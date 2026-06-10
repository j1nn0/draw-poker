# draw-poker

Terminal video poker (Jacks or Better) implemented with Node.js and pnpm.

## Quick Start

```sh
pnpm install
pnpm start
```

## Game Rules

- Jacks or Better poker with 1-coin fixed bets
- Initial credit: 100 (persists across sessions)
- Winning hands earn payouts according to the pay table:
  - Royal Flush: 250 coins
  - Straight Flush: 50 coins
  - Four of a Kind: 25 coins
  - Full House: 9 coins
  - Flush: 6 coins
  - Straight: 4 coins
  - Three of a Kind: 3 coins
  - Two Pair: 2 coins
  - Jacks or Better: 1 coin
  - High Card: 0 coins
- **Double Up**: After a win, gamble your payout to double it (max 5 consecutive rounds)
- **Game Over**: When credits reach 0, choose to continue with 100 credits or quit
- High scores are saved across sessions (`~/.draw-poker/`)

## Controls

### Interactive Mode (TTY)
- `←` / `→` — Select a card
- `Space` — Toggle exchange for selected card
- `a` — Exchange all cards
- `Enter` — Draw
- `q` — Quit

### Pipe Mode (Non-TTY)
Enter card numbers to hold (1-5), separated by spaces or commas. Enter `q` to quit.

## Commands

- `pnpm start` — Run the game
- `pnpm test` — Run tests (Node.js built-in test runner)
- `pnpm build` — Syntax check
