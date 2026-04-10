# execplan.md

## Project
Drone-Invaders

Arcade-strategy game with a triangle ship, hostile sectors, under-fire resource extraction, fortification, map expansion, and a shipboard AI assistant built from narrow neural-network modules.

---

## Purpose of This Document
This is the execution plan for the project.

It exists to answer:
- what we are building
- why we are building it
- what order we should build it in
- how systems fit together
- how we will decide whether something is working

This is a living document. Update it when architecture, scope, priorities, or validation criteria change.

---

# Part 1 — Project Intent and Success Criteria

## Product Intent
Build a readable, replayable action-strategy game where the player pilots a triangle ship to:
1. fight hostile drone forces
2. extract resources under pressure
3. fortify defensible positions
4. expand into more dangerous sectors

The game should feel like:
- immediate to control
- readable under pressure
- strategically tense
- recoverable after mistakes
- varied across sectors
- satisfying to master

## Design Thesis
Every minute, the player should choose between survival now and growth later.

## Core Pillars
- Clarity
- Mastery
- Tension
- Recovery
- Ownership
- Social Identity
- Fair Rewards

## Non-Goals
This project is not trying to be:
- a pure bullet-hell
- a slow city-builder
- an opaque AI simulation
- a realism-heavy space sim
- an “AI for its own sake” tech demo

## Current Milestone
**Milestone Name:** Phase 0 — Drone-Invaders Scaffold
**Milestone Goal:** Establish deterministic world/interpretation/policy/execution scaffolding with assistant-ready interfaces.
**Build Version:** 0.2.0-alpha.0
**Target Date:** May 8, 2026

## Success Criteria for Current Milestone

### Required
- Deterministic tick scaffolding exists for world -> interpretation -> policy -> execution and is covered by automated tests.
- Hazard placement is blocked when Conway candidate coverage exceeds configured policy cap.
- Invasion events are blocked when resources are below policy thresholds, and execution output reflects the block.
- Assistant advisories always provide at least one non-blocking signal message.
- Snapshot cloning protects input world state from mutation side effects during tick composition.

### Stretch
- Conway-driven hazard interpretation is working
- First neural assistant module is integrated behind a stable interface
- Debug views exist for heat maps and policy clamping

---

# Part 2 — Core Gameplay Loop

## Core Loop
1. Fight
2. Extract
3. Fortify
4. Expand

## Player Fantasy
Pilot a combat triangle ship through dangerous orbital sectors, protect fragile operations, secure resources, and push outward against rising drone pressure.

## Micro Loop
- steer
- shoot
- dodge
- prioritize threats
- collect drops
- defend fragile targets
- use tactical tools

## Meso Loop
- choose where to mine
- choose where to fortify
- escort extraction
- bank resources
- respond to invasions
- expand to adjacent sectors

## Macro Loop
- unlock new options
- improve consistency
- specialize playstyle
- learn sector and hazard patterns
- improve route judgment and survival decisions

## Intended Tension Model
The player should repeatedly face choices like:
- collect more now or bank now
- defend base or protect drone
- fortify current zone or expand into a richer zone
- spend resources on survival or future gain

## Fail State Philosophy
Losses should be understandable and useful.

A failure is acceptable only if:
- the player could read the danger
- the player had at least one plausible counterplay
- the failure teaches a better next decision
- the loss does not feel arbitrary

---

# Part 3 — Technical Architecture

## High-Level System Layers

### 1. World Signal Layer
Contains raw game state such as:
- map layout
- Conway simulation state
- player position and status
- enemy state
- resource state
- objective state
- base state
- run progression state

### 2. Interpretation Layer
Converts raw state into meaningful assessments such as:
- feature extraction
- Conway motif detection
- neural scoring
- semantic classification
- danger and value heat maps

### 3. Policy Layer
Applies hard rules such as:
- fairness constraints
- legality checks
- pacing limits
- hazard caps
- objective accessibility
- event cooldowns
- early-game protection

### 4. Execution Layer
Creates final outputs such as:
- spawn decisions
- event activation
- resource placement
- hazard placement
- assistant advice
- map overlays
- alerts and warnings

## Core Principle
Interpretation may inform execution, but interpretation must not bypass policy.

## System Categories

### Deterministic Systems
Use explicit code for:
- pathfinding
- collision
- physics
- spawn legality
- minimum safe route checks
- economic calculations
- progression logic
- hard event timing
- distance and overlap rules

### Learned / Assistive Systems
Use narrow models for:
- fuzzy scoring
- semantic interpretation
- pattern classification
- pressure forecasting
- opportunity ranking
- recommendation weighting

### Procedural Systems
Use procedural generation for:
- sector topology
- Conway hazard seeds
- event candidate pools
- spatial variety
- hazard spread sources

## Proposed Module Boundaries
- `world/`
- `generation/`
- `conway/`
- `features/`
- `policy/`
- `assistant/`
- `events/`
- `combat/`
- `resources/`
- `fortification/`
- `expansion/`
- `debug/`

Adjust names to repo conventions, but preserve separation of concerns.

---

# Part 4 — Neural Assistant Architecture

## Assistant Role
The assistant is the ship’s onboard copilot.

It should:
- read the battlefield faster than the player can
- surface useful truths
- improve decision quality
- preserve player agency
- preserve uncertainty and fairness

It should not:
- automate the game
- produce impossible states
- become omniscient
- hide important reasoning
- replace core gameplay decisions

## Assistant Model Strategy
Use multiple narrow models, not one large model.

## Proposed Assistant Modules

### 1. Conway Interpreter
Purpose:
Turn Conway states into gameplay-relevant meanings.

Possible outputs:
- stable zone likelihood
- pulse hazard likelihood
- moving threat likelihood
- resource potential
- corruption potential
- volatility score

### 2. Map Surveyor
Purpose:
Assess navigability and tactical shape of the map.

Possible outputs:
- safe-route score
- chokepoint score
- fortification suitability
- expansion desirability
- danger heat map

### 3. Threat Forecaster
Purpose:
Estimate invasion pressure and likely attack vectors.

Possible outputs:
- next-wave intensity suggestion
- direction likelihood
- escalation likelihood
- recovery need estimate

### 4. Resource Assessor
Purpose:
Estimate value versus risk for extraction opportunities.

Possible outputs:
- extraction priority
- route risk
- expected payoff
- recommended next node

### 5. Recovery Advisor
Purpose:
Identify when the player needs breathing room or fallback guidance.

Possible outputs:
- retreat suggestion
- safe banking recommendation
- stabilizing route
- emergency build recommendation

### 6. Assistant Synthesizer
Purpose:
Merge all assistant outputs into clean player-facing advice.

Possible outputs:
- advisory text
- HUD markers
- route highlights
- alert tiers
- threat warnings
- fortify-here suggestions

## Shared Blackboard / Heat Map Pattern
Assistant systems should preferably write to inspectable intermediate maps.

Examples:
- danger heat map
- resource value heat map
- navigability heat map
- event pressure heat map
- recovery opportunity heat map
- fortification suitability heat map

These should be available in debug mode.

## Neural System Interfaces
All model calls should go through clear adapters such as:
- `classifyConwayPattern()`
- `evaluateSectorNavigability()`
- `forecastInvasionPressure()`
- `scoreResourceOpportunity()`
- `synthesizeAssistantAdvice()`

Avoid raw model calls scattered across gameplay code.

---

# Part 5 — World Generation and Conway Integration

## Conway Role
Conway is a pattern generator, not a decision maker.

Use Conway to create candidate structures for:
- floor hazards
- corruption zones
- pulsing fields
- moving fronts
- resource field candidates
- event tendency regions
- sector identity signals

## Conway Generation Flow
1. Seed initial Conway grid
2. Run Conway for configured number of steps
3. Extract raw spatial features
4. Detect known explicit motifs where possible
5. Send results to interpretation layer
6. Score and classify
7. Clamp with policy
8. Convert valid outputs into gameplay content

## Known Motif Handling
Use explicit detection for common patterns when practical:
- stable clusters
- oscillators
- gliders
- emitter-like structures
- dense chaotic zones

Use neural interpretation when:
- patterns are partial
- mixed patterns overlap
- semantics are fuzzy
- multiple factors need combined scoring

## Example Gameplay Meanings
These are examples, not locked content.

### Stable clusters
- safe anchor zones
- defensible extraction pockets
- persistent ore patches

### Oscillators
- pulsing hazard floors
- timed exposure windows
- EMP burst cycles

### Gliders
- moving drone scouts
- directional threat fronts
- migrating hazards

### Emitter-like structures
- recurring invasion nests
- repeating hazard sources
- reinforcement generators

### Chaotic regions
- unstable corruption
- volatile storms
- high-risk / high-reward sectors

## Conway Data Contract
Document and version:
- grid size
- step count
- neighborhood rule
- edge handling
- seed parameters
- extracted features
- semantic labels
- downstream consumers

---

# Part 6 — Hard Rules / Policy Layer

## Purpose
The policy layer protects fairness, clarity, and trust.

If any learned or procedural system proposes content that violates policy, policy wins.

## Policy Categories

### Spatial Fairness
Examples:
- minimum safe path count from spawn to critical objective
- safe radius around player spawn
- minimum path width in early sectors
- maximum hazard region size
- maximum total hazard coverage
- minimum separation between critical objective and extreme hazard

### Event Fairness
Examples:
- no stacked overload events in early game
- minimum cooldown between major spikes
- no recovery-denial chains
- no high-intensity bomber plus jammer plus choke-stack too early
- intensity increase capped by progression stage

### Resource Accessibility
Examples:
- at least one reachable resource cluster
- not all high-value resources in extreme hazard
- deposit route must remain plausibly navigable
- early-game extraction should remain readable

### Assistant Behavior Rules
Examples:
- assistant advice must degrade gracefully if inputs are weak
- assistant may suggest, not command
- assistant should prefer confidence bands over fake certainty
- assistant output should be suppressible in high-noise scenarios

## Policy Output Types
- allow
- reject
- clamp
- soften
- downgrade intensity
- reroute
- replace candidate
- defer event

## Policy Debugging Requirements
Every rejected or clamped candidate should be explainable in logs or debug overlays.

Examples:
- `rejected: no safe path`
- `clamped: hazard coverage above max`
- `downgraded: event intensity exceeded stage limit`
- `replaced: deposit route unfair`

---

# Part 7 — Implementation Roadmap

## Phase 0 — Baseline Scaffolding
Goal:
Establish a playable deterministic core without neural dependency.

Deliverables:
- triangle ship movement
- basic combat loop
- basic extraction loop
- basic fortification
- basic sector expansion
- deterministic hazard placement
- debug seed reproduction

Exit criteria:
- end-to-end playable loop exists
- core loop can be tested without assistant systems

## Phase 1 — Policy Engine
Goal:
Create hard constraints before adding learned interpretation.

Status note (April 10, 2026):
- completed in code with safe-path validation, hazard coverage gating, invasion event clamping, resource accessibility ratio checks, and structured policy logging.

Deliverables:
- safe-path validation
- hazard coverage rules
- event clamp framework
- resource accessibility rules
- policy logging

Exit criteria:
- illegal or unfair sector candidates can be detected and rejected
- event spikes can be clamped consistently

## Phase 2 — Conway Integration
Goal:
Use Conway as a spatial pattern source.

Status note (April 10, 2026):
- in progress in code with configurable Conway stepping, motif-detection scaffolding, Conway feature extraction, and gameplay candidate region generation hooks wired into interpretation and execution planning.

Deliverables:
- configurable Conway simulation
- motif detection scaffolding
- feature extraction pipeline
- candidate hazard/resource region generation

Exit criteria:
- Conway outputs stable, inspectable candidate maps
- generated outputs can be turned into gameplay candidates

## Phase 3 — Rule-Based Assistant
Goal:
Prove assistant usefulness before model integration.

Deliverables:
- assistant UI scaffolding
- rule-based warnings
- route hints
- danger overlays
- debug toggles

Exit criteria:
- players can use assistant information meaningfully
- assistant does not overwhelm the HUD

## Phase 4 — First Neural Module
Goal:
Integrate a single narrow model behind a stable interface.

Recommended first model:
- Conway Interpreter or Map Surveyor

Deliverables:
- model adapter
- normalized input pipeline
- deterministic fallback
- logging of input/output pairs
- debug comparison between rule and model result

Exit criteria:
- model adds value over rule-only baseline
- model output remains policy-clamped
- model failures are debuggable

## Phase 5 — Multi-Module Assistant
Goal:
Expand assistant capability carefully.

Potential sequence:
1. Conway Interpreter
2. Map Surveyor
3. Threat Forecaster
4. Resource Assessor
5. Recovery Advisor
6. Assistant Synthesizer

Exit criteria:
- each module has bounded scope
- outputs are useful and non-duplicative
- no module weakens clarity or fairness

## Phase 6 — Tuning and Playtest Refinement
Goal:
Use real play to refine pacing, advice, and fairness.

Deliverables:
- telemetry or structured logging
- playtest review loop
- tuning pass on assistant confidence and frequency
- hazard/event balance refinement

Exit criteria:
- repeated confusion is reduced
- memorable moments increase
- frustration sources are known and shrinking

---

# Part 8 — Testing, Telemetry, and Playtest Pipeline

## Testing Priorities
Test in this order:
1. Ship feel
2. Threat readability
3. Extraction tension
4. Recovery after mistakes
5. Policy enforcement
6. Assistant usefulness
7. Conway interpretation accuracy
8. Pacing quality
9. Content variety

## Required Test Types

### Unit / Logic Tests
Good candidates:
- safe-path validation
- hazard coverage checks
- event clamp behavior
- resource accessibility checks
- deterministic fallback logic
- feature extraction consistency

### Seed-Based Repro Tests
Use for:
- bad map reproduction
- assistant misclassification
- event pacing anomalies
- impossible extraction routes

### Debug Visualization Tests
Use for:
- heat map inspection
- hazard cluster validation
- safe-route verification
- Conway motif interpretation

### Manual Playtests
Track:
- first confusion
- most exciting moment
- most frustrating moment
- ignored assistant advice
- over-trusted assistant advice
- unfair-feeling losses
- memorable recoveries

## Telemetry / Logging Targets
At minimum, support logging for:
- random seed
- Conway seed and steps
- extracted feature values
- neural outputs
- post-policy clamped outputs
- event selection reasons
- rejection reasons
- assistant advice emissions

## Evaluation Questions
Use these repeatedly:
- Did the player understand what mattered?
- Did the player feel pressure with choices?
- Did the assistant help without playing for them?
- Did the failure feel deserved?
- Did the sector feel varied but fair?
- Was there a story worth retelling?

---

# Part 9 — Risks, Open Questions, and Decision Log

## Current Risks
Fill and maintain this section.

### Risk Template
**Risk:**  
**Why it matters:**  
**Likelihood:**  
**Impact:**  
**Mitigation:**  
**Owner:**  
**Status:**  

## Known Likely Risks

### 1. Neural Overreach
Risk:
Models begin controlling too much game behavior.

Mitigation:
Keep models narrow, assistive, and policy-clamped.

### 2. Conway Novelty Without Readability
Risk:
Generated patterns are interesting but not playable.

Mitigation:
Feature extraction plus hard policy plus human playtest review.

### 3. Assistant Noise
Risk:
The assistant floods the player with too much advice.

Mitigation:
Confidence thresholds, alert prioritization, suppress low-value output.

### 4. Debug Difficulty
Risk:
Learned behavior becomes hard to explain.

Mitigation:
Mandatory logging, heat maps, seed reproduction, stable interfaces.

### 5. Complexity Drift
Risk:
Too many systems arrive before the core loop is solid.

Mitigation:
Protect the roadmap order; no advanced assistant work before the deterministic core feels good.

## Open Questions
Keep these current.

### Template
**Question:**  
**Why unresolved:**  
**Options:**  
**Next test or decision point:**  
**Owner:**  

## Decision Log
Track important design and technical decisions here.

### Template
**Decision:**  
**Date:**  
**Context:**  
**Options considered:**  
**Chosen approach:**  
**Why:**  
**Revisit trigger:**  

---

# Appendix A — Starter Definitions of Done

## Ship Feel
Done when:
- movement is responsive
- aim and dodge feel readable
- inertia is intentional, not sloppy
- collision outcomes are understandable

## Extraction Loop
Done when:
- resource pickup is obvious
- banking is understandable
- risk is meaningful
- failure to bank feels like a consequence, not a surprise

## Assistant Utility
Done when:
- advice is readable
- advice appears at useful times
- advice is helpful but not perfect
- players can ignore it and still play

## Conway Interpretation
Done when:
- Conway output is visible in debug mode
- motifs or feature patterns can be inspected
- gameplay conversion is explainable
- policy rejects bad outputs consistently

---

# Appendix B — Default Build Order

If priorities become unclear, prefer this build order:
1. deterministic core loop
2. policy engine
3. Conway generation and feature extraction
4. rule-based assistant
5. first narrow neural module
6. additional assistant modules
7. UI polish and content expansion
8. meta systems and progression depth

---

# Appendix C — Update Rules

Update this file when:
- a phase changes
- a new subsystem is added
- a model interface changes
- a major risk appears
- success criteria change
- milestone priorities change

Do not let this document drift away from the codebase.
