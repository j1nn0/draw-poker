# Repository Instructions

## Top Priority Rule
- Always write responses to users in Japanese.

## Project Shape
- This is a small dependency-free Node.js ESM CLI app, not a web app or TypeScript project.
- Runtime entrypoint is `src/cli.js`; pure poker logic lives in `src/game.js`; persistence logic lives in `src/persistence.js`; scoring logic lives in `src/scoring.js`; tests live in `test/`.
- `package.json` declares `"type": "module"`, so local imports need explicit `.js` extensions.
- Use `pnpm` here. `packageManager` is pinned to `pnpm@10.0.0`; Node must be `>=20.0.0`.

## Commands
- Install: `pnpm install`.
- Run the game: `pnpm start`.
- Run tests: `pnpm test` uses Node's built-in `node:test` runner, not Jest/Vitest.
- Syntax check: `pnpm build` runs `node --check ./src/game.js && node --check ./src/cli.js`; it does not bundle or emit files.

- For logic changes in `src/game.js`, run `pnpm test` and `pnpm build`.
- For CLI changes in `src/cli.js`, run `pnpm build` and manually exercise the quit path with `printf 'q\n' | pnpm start` (the game is TTY-only; piped input works only for the bet prompt).
- For persistence changes in `src/persistence.js`, run `pnpm test` with `DRAW_POKER_DATA_DIR` set to a temp directory.
- The CLI is TTY-only; it exits when stdin is not a TTY.

## Implementation Notes
- Keep the app dependency-free unless the user explicitly asks otherwise; current code uses only Node built-ins.
- `shuffleDeck(deck, random = Math.random)` accepts an injectable RNG, so prefer deterministic tests through that hook instead of mocking globals.
- `evaluateHand()` ranks hands from `High Card` rank `0` through `Royal Flush` rank `9` and handles the ace-low straight wheel. Pairs of J or higher return `Jacks or Better` (rank 1); pairs of 10 or lower return `High Card` (rank 0).
- `getPayTable()` returns an object mapping hand names to bet-specific payout arrays (index 0 unused, indexes 1-5 for bet amounts). `calculatePayout(handName, bet = 1)` returns the payout for a given hand name and bet amount. Royal Flush at 5 coins pays 4000 (max bet bonus).
- `drawDoubleUpCards(deck)` returns a dealer card and 4 player cards for the double-up mini-game. `playDoubleUp(dealerCard, playerCard)` returns true if the player's card rank is higher than the dealer's.
- Data persistence uses `~/.draw-poker/` for JSON storage. The `DRAW_POKER_DATA_DIR` environment variable overrides this for testing.

- Tests are intentionally minimal: they cover scoring, hand ranking, draw behavior, and persistence, but do not cover every edge case in the CLI loop or double-up flow.
- There is no lint, formatter, TypeScript, CI workflow, or generated-code step in this repo.
