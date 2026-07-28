---
name: verify
description: Prove a change actually works before it ships. Use whenever a change is "done" and needs validation — after implementing a feature, fixing a bug, or before opening a PR. Also trigger when the user says "verify", "check this works", "is this actually working", or invokes /ship. Tests passing is not sufficient evidence; this skill drives the change end-to-end.
---

# Verify

Core principle: **tests passing ≠ feature working**. Your job is to find the gap between "the code I wrote" and "the behaviour the user asked for".

## Process

### 1. Restate the contract
Write down (briefly, in the session) what the change is supposed to do, from the user's perspective, not the code's. If you can't state it, ask.

### 2. Run the existing gates
- Full test suite, not just the tests you touched.
- Linters, type checks, `go vet` / `golangci-lint`, build for all targets the repo builds.
- If any of these were already failing before your change, note it and don't claim credit or blame.

### 3. Drive the change end-to-end
This is the step that distinguishes verification from testing. Exercise the actual entry point a user or calling system would use:
- CLI tool → run the real binary with real arguments, not the function in a test harness.
- API/service → start it and hit it (curl, grpcurl, a script). Check the response body, not just the status code.
- Temporal workflow → run it against a dev server (`temporal server start-dev`) and confirm completion and side effects, not just that it was accepted.
- Data pipeline → run on a small real input and inspect the output rows, not the row count.
- Library change → write a throwaway script that uses it the way a consumer would.

Capture concrete evidence: command + output, not "I ran it and it worked".

### 4. Edge-case sweep
Walk this checklist against the changed surface. Skip items that genuinely don't apply, but say so rather than silently skipping:
- Empty input / zero rows / empty string / nil
- Boundary values (0, 1, max, off-by-one on ranges and pagination)
- Duplicate input, repeated invocation (idempotency)
- Concurrent invocation if the code path can race
- Failure injection: dependency down, timeout, malformed response — does it fail loudly and safely?
- Unicode / encoding if strings cross a boundary
- Permissions / auth on any new endpoint or file access
- Backwards compatibility: old data, old config, old callers

### 5. Reliability checklist
- Errors are wrapped with context, not swallowed.
- New external calls have timeouts and (where appropriate) retries.
- Logging exists at the level you'd need to debug this in prod at 2am.
- No secrets, tokens, or PII in logs or committed files.
- Resource cleanup: connections closed, goroutines not leaked, temp files removed.

### 6. Verdict
End with one of:
- **VERIFIED** — list the evidence (commands run, behaviours confirmed).
- **NOT VERIFIED** — list what failed or what you could not exercise and why. Do not soften this. A partial verification is NOT VERIFIED with notes.

## Gotchas
- Do not "verify" by re-reading the code. Reading is review; verification is execution.
- Do not write a new test that mirrors the implementation and call that verification — it proves the code does what the code does.
- If the environment can't support end-to-end execution (no DB, no creds), say exactly which steps were skipped and mark NOT VERIFIED rather than extrapolating.
- Resist the urge to fix unrelated problems found during the sweep. Note them; stay in scope.
