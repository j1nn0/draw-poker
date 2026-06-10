# ADR 0002: Double Up Feature

## Status
Accepted

## Context
After a winning hand, players can optionally gamble their payout in a "double up" mini-game. We need to decide the mechanics and limits.

## Decision
Implement a standard **High and Low** double-up:
- Dealer reveals one card
- Player picks 1 of 4 face-down cards
- If player's card rank > dealer's rank: payout doubles
- If player's card rank < dealer's rank: payout lost
- If same rank: payout lost (house edge)
- Maximum 5 consecutive double-ups
- Player can stop at any time and keep current payout

## Rationale
- **Standard mechanic**: High and Low is the classic video poker double-up
- **5-round limit**: Prevents infinite doubling and extreme credit inflation
- **Tie loses**: Standard house edge rule in most implementations
- **4 cards to choose from**: Gives player agency while maintaining randomness

## Consequences
- Positive: Familiar to video poker players
- Positive: Adds risk/reward tension to the game
- Negative: Requires additional deck management logic
- Negative: May prolong game sessions significantly

## Alternatives Considered
- **Coin flip (50/50)**: Too simple, less engaging than card comparison
- **Red/Black**: Less thematic for a poker game
- **No double-up**: Would make the game too shallow for repeated play
- **Unlimited double-ups**: Risk of runaway credit inflation
