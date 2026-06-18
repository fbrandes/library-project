#!/usr/bin/env node
import fs from 'node:fs';
import tty from 'node:tty';
import { spawnSync } from 'node:child_process';
import inquirer from 'inquirer';

const COMMIT_TYPES = [
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
];

const AREA_OPTIONS = ['', 'backend', 'frontend'];
const SELECT_PROMPT_THEME = {
  style: {
    keysHelpTip: () => undefined,
  },
};

const [, , messageFile, source] = process.argv;

if (!messageFile || source !== 'message') {
  process.exit(0);
}

function runGit(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return result.status === 0 ? result.stdout.trim() : '';
}

function getStagedPaths() {
  return runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
    .split('\n')
    .map((path) => path.trim())
    .filter(Boolean);
}

function detectServices(paths) {
  const services = new Set();

  for (const path of paths) {
    const nestedService = path.match(/^([^/]+)\/(?:backend|frontend)(?:\/|$)/);
    const suffixedService = path.match(/^([^/]+)-(?:backend|frontend)(?:\/|$)/);

    if (nestedService) {
      services.add(nestedService[1]);
    }

    if (suffixedService) {
      services.add(suffixedService[1]);
    }

    if (path.startsWith('bookinfo-ui/') || path.startsWith('frontend/')) {
      services.add('bookinfo');
    }
  }

  return [...services].sort();
}

function discoverServices() {
  const services = new Set();
  const entries = fs.readdirSync('.', { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (fs.existsSync(`${entry.name}/backend`) || fs.existsSync(`${entry.name}/frontend`)) {
      services.add(entry.name);
      continue;
    }

    const suffixedService = entry.name.match(/^(.+)-(?:backend|frontend)$/);

    if (suffixedService) {
      services.add(suffixedService[1]);
    }
  }

  if (fs.existsSync('bookinfo-ui')) {
    services.add('bookinfo');
  }

  return [...services].sort();
}

function detectAreas(paths) {
  const areas = new Set();

  for (const path of paths) {
    if (
      path.includes('/backend/') ||
      path.endsWith('/backend') ||
      /^.+-backend(?:\/|$)/.test(path)
    ) {
      areas.add('backend');
    }

    if (
      path.includes('/frontend/') ||
      path.endsWith('/frontend') ||
      /^.+-frontend(?:\/|$)/.test(path) ||
      path.startsWith('bookinfo-ui/') ||
      path.startsWith('frontend/')
    ) {
      areas.add('frontend');
    }
  }

  return [...areas].sort();
}

function parseSubject(subject) {
  const match = subject.match(
    /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?!?:\s*(?<rest>.*?)(?:\s+\[(?<area>backend|frontend)\])?$/,
  );

  if (!match?.groups || !COMMIT_TYPES.includes(match.groups.type)) {
    return {
      area: '',
      scope: '',
      subject: subject.trim(),
      type: '',
    };
  }

  return {
    area: match.groups.area ?? '',
    scope: match.groups.scope ?? '',
    subject: match.groups.rest.trim(),
    type: match.groups.type,
  };
}

function formatOptionLabel(option) {
  return option === '' ? '(empty)' : option;
}

function buildCommitHeader({ area, scope, subject, type }) {
  const scopeSegment = scope ? `(${scope})` : '';
  const areaSegment = area ? ` [${area}]` : '';

  return `${type}${scopeSegment}: ${subject}${areaSegment}`;
}

function toChoice(option) {
  return {
    name: formatOptionLabel(option),
    value: option,
  };
}

function createSelectQuestion({ choices, defaultValue, message, name }) {
  return {
    type: 'select',
    name,
    message,
    choices,
    default: defaultValue,
    pageSize: choices.length,
    theme: SELECT_PROMPT_THEME,
  };
}

function createPrompt() {
  try {
    const inputFd = fs.openSync('/dev/tty', 'r');
    const outputFd = fs.openSync('/dev/tty', 'w');
    const input = new tty.ReadStream(inputFd);
    const output = new tty.WriteStream(outputFd);

    return {
      close: () => {
        input.destroy();
        output.end();
        fs.closeSync(inputFd);
        fs.closeSync(outputFd);
      },
      prompt: inquirer.createPromptModule({
        input,
        output,
        skipTTYChecks: true,
      }),
    };
  } catch {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      return {
        close: () => {},
        prompt: inquirer.createPromptModule({
          input: process.stdin,
          output: process.stdout,
          skipTTYChecks: true,
        }),
      };
    }

    return null;
  }
}

function writeTerminal(text) {
  try {
    const outputFd = fs.openSync('/dev/tty', 'w');
    fs.writeSync(outputFd, text);
    fs.closeSync(outputFd);
  } catch {
    if (process.stdout.isTTY) {
      process.stdout.write(text);
    }
  }
}

async function askQuestion(question) {
  const promptContext = createPrompt();

  if (!promptContext) {
    return null;
  }

  try {
    return await promptContext.prompt([question]);
  } finally {
    promptContext.close();
  }
}

async function main() {
  const originalMessage = fs.readFileSync(messageFile, 'utf8');
  const messageLines = originalMessage.split(/\r?\n/);
  const parsed = parseSubject(messageLines[0] ?? '');
  const stagedPaths = getStagedPaths();
  const detectedServices = detectServices(stagedPaths);
  const knownServices = discoverServices();
  const detectedAreas = detectAreas(stagedPaths);
  const serviceOptions = [
    '',
    ...new Set([parsed.scope, ...detectedServices, ...knownServices].filter(Boolean)),
  ];
  const defaultService =
    parsed.scope || (detectedServices.length === 1 ? detectedServices[0] : '');
  const defaultArea =
    parsed.area || (detectedAreas.length === 1 ? detectedAreas[0] : '');
  const defaultType = parsed.type || 'feat';

  writeTerminal('\nPrepare commit message\n');
  writeTerminal(`Current subject: ${parsed.subject || '(empty)'}\n`);

  const typeAnswer = await askQuestion(createSelectQuestion({
    name: 'type',
    message: 'Type of change',
    choices: COMMIT_TYPES,
    defaultValue: defaultType,
  }));

  if (!typeAnswer) {
    process.exit(0);
  }

  const scopeAnswer = await askQuestion(createSelectQuestion({
    name: 'scope',
    message: 'Changed service',
    choices: serviceOptions.map(toChoice),
    defaultValue: defaultService,
  }));

  if (!scopeAnswer) {
    process.exit(0);
  }

  const areaAnswer = await askQuestion(createSelectQuestion({
    name: 'area',
    message: 'Changed area',
    choices: AREA_OPTIONS.map(toChoice),
    defaultValue: defaultArea,
  }));

  if (!areaAnswer) {
    process.exit(0);
  }

  const subjectAnswer = parsed.subject
    ? { subject: parsed.subject }
    : await askQuestion({
        type: 'input',
        name: 'subject',
        message: 'Subject',
        default: parsed.subject,
      });

  if (!subjectAnswer) {
    process.exit(0);
  }

  const subject = subjectAnswer.subject.trim();

  if (!subject) {
    writeTerminal('Commit subject is empty; leaving message unchanged.\n');
    return;
  }

  messageLines[0] = buildCommitHeader({
    area: areaAnswer.area,
    scope: scopeAnswer.scope,
    subject,
    type: typeAnswer.type,
  });
  fs.writeFileSync(messageFile, messageLines.join('\n'));
}

await main();
