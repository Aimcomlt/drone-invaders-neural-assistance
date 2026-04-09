# Pac-Man Tilt Archive (First Pass)

This document records the first-pass archival status of the Pac-Man tilt game so the repository can safely transition to Drone-Invaders.

## Archive intent

- Preserve prior work for reference.
- Prevent accidental expansion of legacy gameplay.
- Create clear boundaries while new systems are scaffolded.

## Archived areas

### Application layer
- `packages/app/src/**`
- Tilt/sensor hooks and Redux slices tied to Pac-Man runtime behavior.

### Engine layer
- `packages/engine/src/legacy/**`
- Existing movement/collision/ghost systems and Pac-Man assumptions.

### Assets layer
- `packages/assets/maps/default.json`
- `packages/assets/rules.json`
- `packages/assets/sprites/default.json`

## Archive policy

1. Legacy Pac-Man modules are read-only by default.
2. Allowed changes are limited to:
   - safety fixes,
   - build/test stabilization,
   - extraction of generic utilities needed by Drone-Invaders.
3. Any behavioral change in archived modules must justify why extraction/refactor was not possible.

## Transition guidance

When implementing new Drone-Invaders work:

- Prefer creating new modules over mutating `legacy/` logic.
- Keep deterministic systems and policy checks explicit.
- Route all neural outputs through adapter interfaces + deterministic fallback.

## Completion marker for first pass

A first-pass archive is considered complete when:

- docs identify legacy scope,
- contributors are redirected to `AGENT.md` + `execplan.md`,
- no new feature requests are implemented in Pac-Man-specific systems.
