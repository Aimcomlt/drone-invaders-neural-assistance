# Drone-Invaders Onboarding (Transition Pass)

Welcome. This repo is in migration from a Pac-Man tilt prototype to **Drone-Invaders**.

## What changed in this pass

- The Pac-Man tilt implementation is now treated as a **legacy archive baseline**.
- Project intent is now governed by `AGENT.md` and `execplan.md`.
- New work should target the fight/extract/fortify/expand loop and neural-assistant-ready architecture.

## How to orient yourself

1. Read `AGENT.md` for design principles and implementation guardrails.
2. Read `execplan.md` for phase-by-phase execution.
3. Use legacy Pac-Man code only as a reference for engine/app patterns that are still useful.

## Repository layout (current)

- `packages/app` — legacy Pac-Man app shell (archived baseline).
- `packages/engine` — legacy Pac-Man gameplay systems (archived baseline).
- `packages/shared` — shared contracts/utilities (likely reusable).
- `packages/assets` — legacy Pac-Man assets/rules/maps (archived baseline).
- `docs` — transition documentation and architecture notes.

## Working agreements during transition

- Do not add new Pac-Man gameplay features.
- Keep changes small, explicit, and testable.
- Build new gameplay systems with explicit separation:
  - world signal
  - interpretation
  - policy
  - execution
- Keep neural logic assistive and behind adapter interfaces.
- Ensure deterministic fallback behavior for model-backed decisions.

## Common scripts

From repo root:

- `npm install`
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run ci`

## Immediate next implementation target

- Phase 0 / Phase 1 groundwork from `execplan.md`:
  - scaffold Drone-Invaders deterministic core
  - scaffold policy engine constraints
  - keep Conway and neural modules behind stable interfaces
