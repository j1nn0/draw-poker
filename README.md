# draw-poker

Terminal video poker (Jacks or Better, 1-5 coin bets) implemented with Node.js and pnpm.
## Quick Start

```sh
pnpm install
pnpm start
```

## Game Rules

- Jacks or Better poker with 1-5 coin bets (chosen before each hand)
- Initial credit: 100 (persists across sessions)
- Winning hands earn payouts according to the pay table (shown at startup):
  - Royal Flush: 250 × bet (4000 at max 5-coin bet)
  - Straight Flush: 50 × bet
  - Four of a Kind: 25 × bet
  - Full House: 9 × bet
  - Flush: 6 × bet
  - Straight: 4 × bet
  - Three of a Kind: 3 × bet
  - Two Pair: 2 × bet
  - Jacks or Better: 1 × bet
  - High Card: 0
- **Double Up**: After a win, gamble your payout to double it (max 5 consecutive rounds)
- **Game Over**: When credits reach 0, choose to continue with 100 credits or quit
- High scores are saved across sessions (`~/.draw-poker/`)

## Controls

- `←` / `→` — Select a card
- `Space` — Toggle exchange for selected card
- `a` — Exchange all cards
- `Enter` — Draw
- `q` — Quit (at bet prompt or card selection)

## Commands

- `pnpm start` — Run the game
- `pnpm test` — Run tests (Node.js built-in test runner)
- `pnpm build` — Syntax check
