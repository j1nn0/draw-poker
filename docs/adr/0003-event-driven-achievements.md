# ADR 0003: Event-Driven Architecture for Achievements

## Status
Accepted

## Context
We need an achievement system that reacts to game events (hand evaluated, payout received, double-up results, etc.) without coupling the achievement logic into every game phase. The existing code has a single 70-line `main()` loop with inline phase logic, which would become unmanageable if achievement checks were added inline.

We also wanted the architecture to support future features (stats dashboard, session replay) without further refactoring.

## Decision
Introduce a lightweight self-made EventBus (`src/eventBus.js`) and refactor the game loop into three wrapper functions that emit events at each phase boundary.

### EventBus (self-made, ~15 lines)
- `on(event, fn)` — subscribe
- `off(event, fn)` — unsubscribe
- `emit(event, data)` — publish

Chosen over Node's built-in `EventEmitter` to keep the dependency count at zero and the API minimal (only what this game needs).

### 14 events across the game lifecycle
```
session:start / session:end
bet:placed
hand:dealt / exchange:selected / hand:evaluated
payout:received
doubleup:start / doubleup:win / doubleup:lose / doubleup:push
hand:end
gameover
achievement:unlocked
```

### Three wrapper functions
- `handleBet(rl, credits, lastBet)` → emits `bet:placed`
- `playDraw(rl, shuffled)` → emits `hand:dealt`, `exchange:selected`, `hand:evaluated`
- `handlePayout(rl, result, bet, credits)` → emits `payout:received`, `doubleup:*`, `hand:end`

### Achievement checker as an independent module
`src/achievements.js` subscribes to events and evaluates pure-function conditions against an `accumulatedState`. It has no dependency on `cli.js` rendering logic.

## Rationale
- **Decoupling**: Achievements (and future features) never touch game phase code. They subscribe and react.
- **Testability**: Wrapper functions and achievement conditions can be unit-tested without raw-mode I/O.
- **Discoverability**: To understand what happens after a hand is evaluated, read the subscriber list — not grep through `main()`.
- **Future-proof**: Stats dashboard, session replay, or logging can subscribe to the same events.

## Consequences
- Positive: Achievement system slots in as a pure event subscriber — zero changes to game phase logic.
- Positive: `main()` shrinks from ~70 lines to ~20.
- Positive: Each wrapper function has a single responsibility and clear I/O.
- Negative: Existing code must be refactored (the three wrappers extracted). Risk of introducing bugs in `credits` tracking during the split.
- Negative: Extra indirection — tracing a feature requires following event subscriptions instead of reading linear code.

## Alternatives Considered
- **Inline achievement checks**: Would scatter `if (condition) unlock()` throughout `main()`. Maintainable at 10 achievements but not at 30.
- **Node `events` module**: Familiar but carries unused API surface (`removeListener`, `error handling`, `maxListeners`). Self-made is 15 lines vs 400+ lines of undocumented API.
- **No events, just callbacks at phase boundaries**: Similar decoupling but harder to add/remove subscribers dynamically (e.g., achievements that silence themselves after unlock).
- **All logic in cli.js**: Current pattern. Would make cli.js ~500+ lines with achievements, stats, and future features.
