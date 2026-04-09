# Drone-Invaders Transition Architecture (First Pass)

This repository originally shipped as a Pac-Man tilt prototype. In this first-pass transition, we are **archiving the Pac-Man implementation** and treating it as a legacy baseline while we prepare the Drone-Invaders architecture described in `AGENT.md` and `execplan.md`.

## Transition Status

- **Status:** Pac-Man tilt stack archived (legacy reference only).
- **Current coding focus:** new Drone-Invaders systems with deterministic core + neural assistant modules.
- **Scope of this pass:** documentation and repository intent reset, not a full gameplay rewrite.

## Legacy Stack (Archived)

The current workspace layout remains intact for now so we can preserve prior implementation details:

```
packages/
  app/      # Legacy Pac-Man tilt UI shell (archived)
  engine/   # Legacy deterministic gameplay engine (archived)
  shared/   # Shared types/utilities (candidate for reuse)
  assets/   # Legacy Pac-Man maps/rules/sprites (archived)
```

Archived means:
- bug fixes only if needed to keep repository integrity,
- no new feature work for Pac-Man-specific gameplay,
- all forward-looking systems should align to Drone-Invaders architecture.

## Target Architecture Direction (Drone-Invaders)

Per `execplan.md`, gameplay systems should converge on the following layering:

1. **World Signal Layer** — raw map, entities, run state, Conway state.
2. **Interpretation Layer** — feature extraction, motif detection, neural scoring.
3. **Policy Layer** — fairness/legality checks and clamps.
4. **Execution Layer** — spawns, hazards, resources, assistant advice, overlays.

### Deterministic vs Neural Responsibilities

- Keep deterministic systems responsible for collision, pathfinding, legality, progression, and economy math.
- Keep neural systems narrow and assistive (classification, scoring, pressure/risk estimation, recommendation ranking).
- Route all gameplay-affecting outputs through policy checks before execution.

## First-Pass Repository Rules

- Preserve legacy behavior unless explicitly removing/replacing archived systems.
- New modules should be named by role (e.g. `policy/`, `assistant/`, `conway/`, `features/`).
- Avoid direct model calls in gameplay code; always use adapter interfaces.
- Require deterministic fallback behavior for every neural output.

## Next Steps

- Add a dedicated `docs/ARCHIVE_PACMAN_TILT.md` inventory and freeze boundaries.
- Introduce Phase 0 Drone-Invaders scaffolding modules alongside archived code.
- Begin policy engine scaffolding before integrating any neural model.
