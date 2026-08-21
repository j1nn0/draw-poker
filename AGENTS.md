# Repository Instructions

## Top Priority Rule
- Always write responses to users in Japanese.

## Project Shape
- This is a small dependency-free Node.js ESM CLI app, not a web app or TypeScript project.
- Runtime entrypoint is `src/cli.js`; pure poker logic lives in `src/game.js`; rendering helpers live in `src/view.js`; persistence logic lives in `src/persistence.js`; scoring logic lives in `src/scoring.js`; achievement state lives in `src/achievements.js`; event bus lives in `src/eventBus.js`; tests live in `test/`.
- `package.json` declares `"type": "module"`, so local imports need explicit `.js` extensions.
- Use `pnpm` here. `packageManager` is pinned to `pnpm@10.34.3`; Node must be `>=22.0.0`.

## Commands
- Install: `pnpm install`.
- Run the game: `pnpm start`.
- Run tests: `pnpm test` uses Node's built-in `node:test` runner, not Jest/Vitest.
- Syntax check: `pnpm build` runs `node --check` against every file in `src/` (game.js, cli.js, view.js, persistence.js, scoring.js, achievements.js, eventBus.js); it does not bundle or emit files.

- For logic changes in `src/game.js`, run `pnpm test` and `pnpm build`.
- For CLI changes in `src/cli.js`, run `pnpm build` and manually exercise the quit path with `printf 'q\n' | pnpm start` (the game is TTY-only; piped input works only for the bet prompt).
- For persistence changes in `src/persistence.js`, run `pnpm test` with `DRAW_POKER_DATA_DIR` set to a temp directory.
- The CLI is TTY-only for the interactive game; headless flags `--help`/`--version`/`--stats`/`--paytable`/`--achievements` are handled before the TTY check and work when stdin is not a TTY. Use `node src/cli.js --help` for headless; `pnpm start -- --help` forwards via pnpm.

## Implementation Notes
- Keep the app dependency-free unless the user explicitly asks otherwise; current code uses only Node built-ins.
- `shuffleDeck(deck, random = Math.random)` accepts an injectable RNG, so prefer deterministic tests through that hook instead of mocking globals.
- `evaluateHand()` ranks hands from `High Card` rank `0` through `Royal Flush` rank `9` and handles the ace-low straight wheel. Any pair returns `Pair` (rank 1), no Jacks-or-Better distinction.
- `getPayTable()` returns an object mapping hand names to bet-specific payout arrays (index 0 unused, indexes 1-10 for bet amounts 1-10). `calculatePayout(handName, bet = 1)` returns the payout for a given hand name and bet amount (throws on unknown hand names). Pay table: Royal Flush base 500×, max bet bonus 8000 at 10 coins.
- `drawDoubleUpCards(deck)` returns a dealer card and 4 player cards for the double-up mini-game. `playDoubleUp(dealerCard, playerCard)` returns `"win"`, `"lose"`, or `"push"` (was boolean before 2026-06-12). On a tie, the payout is preserved and the player can try again.
- `formatCardLines(card)` is exported for reuse in cli.js double-up card art. Hearts and diamonds are colored red via ANSI `\x1b[31m` codes. `formatVisualHand()` uses Japanese labels ("交換" / "残す") instead of "CHANGE" / "KEEP".
- `localizeHandName(name)` in view.js maps English hand names to Japanese (e.g. "Royal Flush" → "ロイヤルストレートフラッシュ"). Pure view helpers (`displayWidth`, `formatBoxRow`, `centerBoxText`, `truncateDisplayWidth`, `progressBar`, `formatCard`, `renderCardFaceDown`, `renderCardsRow`, `renderTwoCards`, `renderCardLabels`, `buildHelpText`, `buildStatsOutput`, `buildPayTableText`, `buildAchievementsText`) live in `src/view.js` and are re-exported from `cli.js` for test compatibility.
- Card selection uses interactive arrow-key navigation (←/→, Space, Enter, q) plus number keys: 1-5 toggles in the exchange screen, 1-4 selects directly in double-up.
- Bet input validates integer-only (`/^\d+$/`) with separate error messages for non-integer vs out-of-range.
- Data persistence uses `~/.draw-poker/` for JSON storage (credits.json, highscores.json, achievements.json). The `DRAW_POKER_DATA_DIR` environment variable overrides this for testing. `saveCredits()` writes only when credits actually change; `endSession()` always saves final state.
- `main()` in `cli.js` is split into focused phase functions: `handleGameOver()`, `getBet()`, `playDoubleUpLoop()`, and `endSession()`. Flag parsing is handled by `parseArgs()`/`getVersion()` before the TTY gate; headless flags return early without creating a readline interface. Session state is orchestrated in ~70 lines.
- `updateHighScores()` merges peak records; `accumulateStats()` sums cumulative totals (totalGamesPlayed/Won/Bet/Payout) across sessions. `mergeSessionResults()` combines both into a single call — preferred over calling the two separately. `detectNewRecords()` compares session peaks against stored highscores to identify which records were broken.
- `getHeldIndexes(hand, exchangeIndexes)` in game.js inverts a set of exchange indexes into the held-indexes set expected by `drawCards()`. Renamed from `indexesNotSelected` in cli.js for clarity.
- `main()` parses `process.argv` via `parseArgs()` before the TTY check. Headless flags (`--help`, `--version`, `--stats`, `--paytable`, `--achievements`, and unknown-flag handling) return early without requiring a TTY. If no flag is present and stdin is not a TTY, it exits early with a message, preventing cryptic raw-mode errors on piped input.
