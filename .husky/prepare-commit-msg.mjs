#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

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
const sleepBuffer = new Int32Array(new SharedArrayBuffer(4));

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

function writeTerminal(terminal, text) {
  fs.writeSync(terminal.outputFd, text);
}

function sleep(milliseconds) {
  Atomics.wait(sleepBuffer, 0, 0, milliseconds);
}

function readTerminalLine(terminal, prompt) {
  writeTerminal(terminal, prompt);

  const chunks = [];
  const buffer = Buffer.alloc(1);

  while (true) {
    let bytesRead;

    try {
      bytesRead = fs.readSync(terminal.inputFd, buffer, 0, 1, null);
    } catch (error) {
      if (error?.code === 'EAGAIN' || error?.code === 'EINTR') {
        sleep(20);
        continue;
      }

      throw error;
    }

    if (bytesRead === 0) {
      break;
    }

    const character = buffer.toString('utf8', 0, bytesRead);

    if (character === '\n') {
      break;
    }

    if (character !== '\r') {
      chunks.push(character);
    }
  }

  return chunks.join('');
}

function selectOption(terminal, question, options, defaultValue = '') {
  writeTerminal(terminal, `\n${question}\n`);

  options.forEach((option, index) => {
    const defaultMarker = option === defaultValue ? ' default' : '';
    writeTerminal(terminal, `  ${index + 1}. ${formatOptionLabel(option)}${defaultMarker}\n`);
  });

  while (true) {
    const answer = readTerminalLine(terminal, 'Select option: ').trim();

    if (!answer && options.includes(defaultValue)) {
      return defaultValue;
    }

    const selectedIndex = Number.parseInt(answer, 10);
    if (Number.isInteger(selectedIndex) && selectedIndex >= 1 && selectedIndex <= options.length) {
      return options[selectedIndex - 1];
    }

    if (options.includes(answer)) {
      return answer;
    }

    writeTerminal(terminal, `Enter a number from 1 to ${options.length}.\n`);
  }
}

function buildCommitHeader({ area, scope, subject, type }) {
  const scopeSegment = scope ? `(${scope})` : '';
  const areaSegment = area ? ` [${area}]` : '';

  return `${type}${scopeSegment}: ${subject}${areaSegment}`;
}

function createTerminal() {
  try {
    const ttyFd = fs.openSync('/dev/tty', 'r+');

    return {
      close: () => fs.closeSync(ttyFd),
      inputFd: ttyFd,
      outputFd: ttyFd,
    };
  } catch {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      return {
        close: () => {},
        inputFd: process.stdin.fd,
        outputFd: process.stdout.fd,
      };
    }

    return null;
  }
}

function main() {
  const terminal = createTerminal();

  if (!terminal) {
    process.exit(0);
  }

  try {
    const originalMessage = fs.readFileSync(messageFile, 'utf8');
    const messageLines = originalMessage.split(/\r?\n/);
    const parsed = parseSubject(messageLines[0] ?? '');
    const stagedPaths = getStagedPaths();
    const detectedServices = detectServices(stagedPaths);
    const detectedAreas = detectAreas(stagedPaths);
    const serviceOptions = ['', ...new Set([parsed.scope, ...detectedServices].filter(Boolean))];
    const defaultService =
      parsed.scope || (detectedServices.length === 1 ? detectedServices[0] : '');
    const defaultArea =
      parsed.area || (detectedAreas.length === 1 ? detectedAreas[0] : '');
    const defaultType = parsed.type || 'feat';

    writeTerminal(terminal, '\nPrepare commit message\n');
    writeTerminal(terminal, `Current subject: ${parsed.subject || '(empty)'}\n`);

    const type = selectOption(terminal, 'Type of change', COMMIT_TYPES, defaultType);
    const scope = selectOption(terminal, 'Changed service', serviceOptions, defaultService);
    const area = selectOption(terminal, 'Changed area', AREA_OPTIONS, defaultArea);
    const subject = parsed.subject || readTerminalLine(terminal, '\nSubject: ').trim();

    if (!subject) {
      writeTerminal(terminal, 'Commit subject is empty; leaving message unchanged.\n');
      return;
    }

    messageLines[0] = buildCommitHeader({ area, scope, subject, type });
    fs.writeFileSync(messageFile, messageLines.join('\n'));
  } finally {
    terminal.close();
  }
}

main();
