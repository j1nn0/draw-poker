# draw-poker

Terminal video poker (Dragon Quest casino-style, 1-10 coin bets) implemented with Node.js and pnpm.
## Quick Start

```sh
pnpm install
pnpm start
```

## Game Rules

- Dragon Quest casino poker with 1-10 coin bets (chosen before each hand)
- Initial credit: 100 (persists across sessions)
- Winning hands earn payouts according to the pay table (shown at startup):
  - Royal Flush: 500 × bet (8000 at max 10-coin bet)
  - Straight Flush: 100 × bet
  - Four of a Kind: 50 × bet
  - Full House: 10 × bet
  - Flush: 7 × bet
  - Straight: 5 × bet
  - Three of a Kind: 3 × bet
  - Two Pair: 2 × bet
  - Pair: 1 × bet
  - High Card: 0
- Any pair is a winning hand (minimum payout 1×)
- **Double Up**: After a win, gamble your payout to double it (max 5 consecutive rounds)
- **Game Over**: When credits reach 0, choose to continue with 100 credits or quit
- High scores are saved across sessions (`~/.draw-poker/`)
- UI is in Japanese (Dragon Quest style terminology)

## Controls

- `←` / `→` — Select a card
- `Space` — Toggle exchange for selected card
- `a` — Exchange all cards
- `Enter` — Draw
- `q` — Quit

## Commands

- `pnpm start` — Run the game
- `pnpm test` — Run tests (Node.js built-in test runner)
- `pnpm build` — Syntax check
