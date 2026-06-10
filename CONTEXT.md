# Draw Poker

This context describes the language used by the terminal draw poker game.

## Language

**Exchange Selection**:
The set of cards the player has chosen to replace during the draw step.
_Avoid_: Hold selection, kept cards
**Credit**:
The player's current balance of coins. Starts at 100 for new players. Decreased by 1 each game (bet), increased by payout on winning hands.
_Avoid_: Money, balance, chips

**Session**:
A single run of the game from launch to exit. Credits persist across sessions via file storage.

**Double Up**:
An optional post-win gamble where the player can risk their current payout to double it by picking a card higher than the dealer's revealed card. Maximum 5 consecutive double-ups.
_Avoid_: Gamble, risk game

**High Score**:
The best records achieved across all sessions: highest credit reached, best hand rank, and maximum consecutive double-ups.
