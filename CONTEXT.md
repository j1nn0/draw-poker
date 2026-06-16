# Draw Poker

This context describes the language used by the terminal draw poker game.

## Language

**交換選択**:
The set of cards the player has chosen to replace during the draw step.
_Avoid_: Hold selection, kept cards
**ベット**:
The number of coins the player wagers before a hand is dealt. The player chooses 1-10 coins each hand. The bet is deducted from コイン before the draw.
_Avoid_: Wager, stake
**コイン**:
The player's current balance of coins. Starts at 100 for new players. Decreased by the bet amount (1-10 coins) each hand, increased by payout on winning hands.
_Avoid_: Money, balance, chips

**Session**:
A single run of the game from launch to exit. コイン persist across sessions via file storage.

**ダブルアップ**:
An optional post-win gamble where the player can risk their current payout to double it by picking a card higher than the dealer's revealed card. Maximum 5 consecutive double-ups. A push (tie) preserves the payout and does not count toward the 5-round limit.
_Avoid_: Gamble, risk game

**High Score**:
The best records achieved across all sessions: highest コイン reached, best hand rank, and maximum consecutive double-ups.
**ペイテーブル**:
The payout schedule for winning hands, denominated per coin. A higher bet multiplies the base payout linearly, except Royal Flush at 10 coins pays 8000 (max bet bonus).
_Avoid_: Payout chart, odds table
**Pair**:
Any pair of matching ranks (2-2 up to A-A). The minimum winning hand, pays 1× base.
_Avoid_: Jacks or Better, One Pair

**イベントバス**:
A lightweight pub/sub mechanism that decouples game phases from side effects. Emits 14 event types across the game loop (`session:start`, `bet:placed`, `hand:dealt`, `exchange:selected`, `hand:evaluated`, `payout:received`, `doubleup:start/win/lose/push`, `hand:end`, `session:end`, `gameover`, `achievement:unlocked`). Implemented as a self-contained module (~15 lines) rather than Node's EventEmitter, to keep dependencies at zero.
_Avoid_: EventEmitter, EventBus library

**実績**:
Permanent unlockable goals with specific in-game conditions. 30 achievements across 5 categories: ハンド系 (10), ダブルアップ系 (5), 累計系 (5), マイルストーン系 (4), チャレンジ系 (6). Each has a pure-function condition `condition(event, accumulatedState)`. Unlocked achievements persist in `~/.draw-poker/achievements.json` with a timestamp.
_Avoid_: Trophies, Badges, Awards

**実績チェッカー**:
The state machine inside `src/achievements.js` that subscribes to イベントバス events, maintains `accumulatedState` (unlocked set, session counters, exchange counts), and evaluates each unfulfilled achievement's condition on every event. State is split into persistent (totalBet, totalPayout, totalGamesPlayed from highscores.json) and session-local (doubleUpStreak, lastExchangeCount, etc.).
_Avoid_: Achievement manager, achievement service

**ハンドラッパー**:
Functions that wrap a game phase and emit the corresponding events. Three wrappers exist: `handleBet(rl, credits, lastBet)` → `{bet, credits, lastBet}`, `playDraw(rl, shuffled)` → `{hand, result, exchangeCount}`, `handlePayout(rl, result, bet, credits)` → `{payout, newCredits, doubleUps}`. Replaces inline phase logic in `main()`.
_Avoid_: Phase handler, game phase function
