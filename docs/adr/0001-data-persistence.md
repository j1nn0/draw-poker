# ADR 0001: Data Persistence Location

## Status
Accepted

## Context
The video poker game needs to persist player data (credits and high scores) across sessions. We need to decide where and how to store this data.

## Decision
Store data in `~/.draw-poker/` as JSON files:
- `credits.json` — current credit balance
- `highscores.json` — all-time high scores

## Rationale
- **Cross-platform**: `os.homedir()` works on all platforms (POSIX, Windows, macOS)
- **Simple**: JSON is human-readable and easy to debug
- **No dependencies**: Uses only Node.js built-in `fs` module
- **Isolated**: Dedicated directory avoids polluting the home directory
- **Testable**: `DRAW_POKER_DATA_DIR` environment variable allows overriding for tests

## Consequences
- Positive: Simple implementation, no external dependencies
- Positive: Players can manually inspect/edit their data
- Negative: No encryption or tamper protection
- Negative: No backup mechanism

## Alternatives Considered
- **Environment variables**: Too ephemeral, lost on shell restart
- **Local file in repo**: Would be lost on repo deletion/reclone
- **SQLite**: Overkill for two simple key-value files
