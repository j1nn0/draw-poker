# Repository Instructions

## Project Shape
- This is a small dependency-free Node.js ESM CLI app, not a web app or TypeScript project.
- Runtime entrypoint is `src/cli.js`; pure poker logic lives in `src/game.js`; tests live in `test/game.test.js`.
- `package.json` declares `"type": "module"`, so local imports need explicit `.js` extensions.
- Use `pnpm` here. `packageManager` is pinned to `pnpm@10.0.0`; Node must be `>=20.0.0`.

## Commands
- Install: `pnpm install`.
- Run the game: `pnpm start`.
- Run tests: `pnpm test` uses Node's built-in `node:test` runner, not Jest/Vitest.
- Syntax check: `pnpm build` runs `node --check ./src/game.js && node --check ./src/cli.js`; it does not bundle or emit files.

## Verification
- For logic changes in `src/game.js`, run `pnpm test` and `pnpm build`.
- For CLI changes in `src/cli.js`, run `pnpm build` and manually exercise at least the quit path: `printf 'q\n' | pnpm start`.
- The CLI is interactive under a TTY but exits after one hand when stdin is piped because `src/cli.js` checks `input.isTTY`.

## Implementation Notes
- Keep the app dependency-free unless the user explicitly asks otherwise; current code uses only Node built-ins.
- `shuffleDeck(deck, random = Math.random)` accepts an injectable RNG, so prefer deterministic tests through that hook instead of mocking globals.
- `parseHoldInput()` accepts card numbers 1-5 separated by spaces or commas and returns zero-based indexes in a `Set`.
- `evaluateHand()` ranks hands from `High Card` rank `0` through `Royal Flush` rank `9` and handles the ace-low straight wheel.

## Current Gaps
- Tests are intentionally minimal: they cover royal flush scoring and hold-input parsing, but not every hand ranking, draw behavior, or CLI loop.
- There is no lint, formatter, TypeScript, CI workflow, or generated-code step in this repo.
