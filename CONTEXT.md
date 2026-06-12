# Draw Poker

This context describes the language used by the terminal draw poker game.

## Language

**Exchange Selection**:
The set of cards the player has chosen to replace during the draw step.
_Avoid_: Hold selection, kept cards
**Bet**:
The number of coins the player wagers before a hand is dealt. The player chooses 1-5 coins each hand. The bet is deducted from Credit before the draw.
_Avoid_: Wager, stake
**Credit**:
The player's current balance of coins. Starts at 100 for new players. Decreased by the bet amount (1-5 coins) each hand, increased by payout on winning hands.
_Avoid_: Money, balance, chips

**Session**:
A single run of the game from launch to exit. Credits persist across sessions via file storage.

**Double Up**:
An optional post-win gamble where the player can risk their current payout to double it by picking a card higher than the dealer's revealed card. Maximum 5 consecutive double-ups.
_Avoid_: Gamble, risk game

**High Score**:
The best records achieved across all sessions: highest credit reached, best hand rank, and maximum consecutive double-ups.
**Pay Table**:
The payout schedule for winning hands, denominated per coin. A higher bet multiplies the base payout linearly, except Royal Flush at 5 coins pays 4000 (max bet bonus).
_Avoid_: Payout chart, odds table
