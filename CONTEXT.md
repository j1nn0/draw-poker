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
