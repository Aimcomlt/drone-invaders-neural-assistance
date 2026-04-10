import { DroneWorldSignal } from '@pacman/shared';
import {
  tickDroneInvaders,
  createTickWorld,
  interpretWorld,
  evaluatePolicy,
  createExecutionPlan,
  hasAnySafeResourcePath,
} from '..';

const createWorld = (overrides: Partial<DroneWorldSignal> = {}): DroneWorldSignal => ({
  sector: {
    id: 'sector-a',
    width: 10,
    height: 10,
    blockedCells: [],
    ...overrides.sector,
  },
  entities: [
    {
      id: 'ship-1',
      kind: 'player-ship',
      faction: 'player',
      position: { x: 4, y: 4 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
    {
      id: 'enemy-1',
      kind: 'enemy-drone',
      faction: 'hostile',
      position: { x: 8, y: 8 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
  ],
  resources: [
    {
      id: 'resource-1',
      position: { x: 2, y: 2 },
      richness: 0.9,
      contested: false,
    },
  ],
  run: {
    timestampMs: 1000,
    resourcesBanked: 25,
    currentSectorId: 'sector-a',
    threatLevel: 0.3,
    activeObjectives: ['extract-resource-1'],
    ...overrides.run,
  },
  conway: {
    step: 5,
    aliveCells: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    ...overrides.conway,
  },
  ...overrides,
});

describe('Drone-Invaders Phase 0.1 deterministic checks', () => {
  test('tickDroneInvaders composes interpretation, policy, and execution', () => {
    const world = createWorld();

    const output = tickDroneInvaders({ deltaMs: 16, world });

    expect(output.interpretation.riskAssessment.sectorRisk).toBeGreaterThanOrEqual(0);
    expect(output.interpretation.riskAssessment.sectorRisk).toBeLessThanOrEqual(1);
    expect(output.policy.clampedRisk).toBeGreaterThanOrEqual(0);
    expect(output.policy.clampedRisk).toBeLessThanOrEqual(1);
    expect(output.execution.advisorySignals.length).toBeGreaterThan(0);
  });

  test('policy blocks hazard spawns when hazard coverage exceeds threshold', () => {
    const denseHazardWorld = createWorld({
      conway: {
        step: 10,
        aliveCells: Array.from({ length: 40 }, (_, index) => ({ x: index % 10, y: Math.floor(index / 10) })),
      },
    });

    const interpretation = interpretWorld(denseHazardWorld);
    const policy = evaluatePolicy(denseHazardWorld, interpretation);
    const execution = createExecutionPlan(denseHazardWorld, interpretation, policy);

    expect(policy.allowHazardSpawn).toBe(false);
    expect(policy.reasons).toContain('hazard coverage exceeded max threshold');
    expect(execution.hazardPlacements).toEqual([]);
  });

  test('policy blocks invasion if resources are below threshold', () => {
    const lowResourceWorld = createWorld({
      run: {
        timestampMs: 1000,
        resourcesBanked: 5,
        currentSectorId: 'sector-a',
        threatLevel: 0.3,
        activeObjectives: [],
      },
      conway: {
        step: 7,
        aliveCells: Array.from({ length: 20 }, (_, index) => ({ x: index % 10, y: Math.floor(index / 10) })),
      },
    });

    const output = tickDroneInvaders({ deltaMs: 16, world: lowResourceWorld });

    expect(output.policy.allowInvasionEvent).toBe(false);
    expect(output.execution.invasionWaveSize).toBe(0);
    expect(output.policy.reasonCodes).toContain('resources_below_min');
    expect(output.policy.reasonCodes).not.toContain('risk_below_min');
    expect(output.execution.advisorySignals).toContain('POLICY HOLD: invasion escalation currently blocked.');
  });

  test('world snapshot cloning prevents input mutation side effects', () => {
    const world = createWorld();
    const cloned = createTickWorld({ deltaMs: 16, world });

    cloned.entities[0].position.x = 999;
    cloned.conway.aliveCells[0].x = 999;

    expect(world.entities[0].position.x).toBe(4);
    expect(world.conway.aliveCells[0].x).toBe(1);
  });

  test('policy blocks invasion when no safe path exists to any resource', () => {
    const blockedWorld = createWorld({
      sector: {
        id: 'sector-a',
        width: 10,
        height: 10,
        blockedCells: Array.from({ length: 10 }, (_, x) => ({ x, y: 5 })),
      },
      resources: [
        {
          id: 'resource-1',
          position: { x: 2, y: 8 },
          richness: 0.9,
          contested: false,
        },
      ],
      run: {
        timestampMs: 1000,
        resourcesBanked: 100,
        currentSectorId: 'sector-a',
        threatLevel: 0.7,
        activeObjectives: ['extract-resource-1'],
      },
    });

    expect(hasAnySafeResourcePath(blockedWorld)).toBe(false);

    const output = tickDroneInvaders({ deltaMs: 16, world: blockedWorld });

    expect(output.policy.hasSafePath).toBe(false);
    expect(output.policy.allowInvasionEvent).toBe(false);
    expect(output.policy.reasonCodes).toContain('no_safe_path');
    expect(output.policy.reasons).toContain('no safe path available');
    expect(output.execution.advisorySignals).toContain('POLICY HOLD: no safe extraction path available.');
  });

  test('safe path check succeeds when at least one resource route is open', () => {
    const traversableWorld = createWorld({
      sector: {
        id: 'sector-a',
        width: 10,
        height: 10,
        blockedCells: Array.from({ length: 10 }, (_, x) => ({ x, y: 5 })).filter((cell) => cell.x !== 4),
      },
    });

    expect(hasAnySafeResourcePath(traversableWorld)).toBe(true);

    const interpretation = interpretWorld(traversableWorld);
    const policy = evaluatePolicy(traversableWorld, interpretation);

    expect(policy.hasSafePath).toBe(true);
  });

  test('policy sets risk_below_min reason when clamped risk is under minimum invasion threshold', () => {
    const lowRiskWorld = createWorld({
      run: {
        timestampMs: 1000,
        resourcesBanked: 100,
        currentSectorId: 'sector-a',
        threatLevel: 0.01,
        activeObjectives: ['extract-resource-1'],
      },
      conway: {
        step: 5,
        aliveCells: [{ x: 1, y: 1 }],
      },
    });

    const interpretation = interpretWorld(lowRiskWorld);
    const policy = evaluatePolicy(lowRiskWorld, interpretation);

    expect(policy.allowInvasionEvent).toBe(false);
    expect(policy.reasonCodes).toContain('risk_below_min');
    expect(policy.reasonCodes).not.toContain('resources_below_min');
  });

  test('policy log captures candidate inputs, thresholds, decisions, and reason code details', () => {
    const lowResourceWorld = createWorld({
      run: {
        timestampMs: 1000,
        resourcesBanked: 5,
        currentSectorId: 'sector-a',
        threatLevel: 0.5,
        activeObjectives: ['extract-resource-1'],
      },
    });

    const interpretation = interpretWorld(lowResourceWorld);
    const policy = evaluatePolicy(lowResourceWorld, interpretation);

    expect(policy.policyLog.candidateInput.resourcesBanked).toBe(5);
    expect(policy.policyLog.candidateInput.reachableResourceCount).toBe(1);
    expect(policy.policyLog.candidateInput.totalResourceCount).toBe(1);
    expect(policy.policyLog.candidateInput.reachableResourceRatio).toBe(1);
    expect(policy.policyLog.thresholds.minResourcesForInvasion).toBe(20);
    expect(policy.policyLog.thresholds.maxInvasionWaveSize).toBe(8);
    expect(policy.policyLog.decision.allowInvasionEvent).toBe(false);
    expect(policy.policyLog.decision.clampedInvasionWaveSize).toBe(0);
    expect(policy.policyLog.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'resources_below_min',
          message: 'invasion gated: resources below minimum threshold',
        }),
      ]),
    );
  });

  test('policy clamps invasion wave size via event clamp framework', () => {
    const highRiskWorld = createWorld({
      run: {
        timestampMs: 1000,
        resourcesBanked: 100,
        currentSectorId: 'sector-a',
        threatLevel: 1,
        activeObjectives: ['extract-resource-1'],
      },
      conway: {
        step: 12,
        aliveCells: Array.from({ length: 20 }, (_, index) => ({ x: index % 10, y: Math.floor(index / 10) })),
      },
    });

    const output = tickDroneInvaders(
      { deltaMs: 16, world: highRiskWorld },
      {
        policyThresholds: {
          maxHazardCoverage: 0.5,
          maxRiskBeforeInvasionClamp: 1,
          minRiskForInvasion: 0.35,
          minResourcesForInvasion: 20,
          minReachableResourceRatio: 0.5,
          maxInvasionWaveSize: 3,
        },
      },
    );

    expect(output.policy.allowInvasionEvent).toBe(true);
    expect(output.policy.clampedInvasionWaveSize).toBe(3);
    expect(output.execution.invasionWaveSize).toBe(3);
  });

  test('policy blocks invasion when reachable resource ratio falls below threshold', () => {
    const partlyBlockedWorld = createWorld({
      resources: [
        {
          id: 'resource-open',
          position: { x: 2, y: 2 },
          richness: 0.9,
          contested: false,
        },
        {
          id: 'resource-blocked',
          position: { x: 2, y: 8 },
          richness: 0.4,
          contested: false,
        },
      ],
      sector: {
        id: 'sector-a',
        width: 10,
        height: 10,
        blockedCells: Array.from({ length: 10 }, (_, x) => ({ x, y: 5 })).filter((cell) => cell.x !== 9),
      },
      run: {
        timestampMs: 1000,
        resourcesBanked: 100,
        currentSectorId: 'sector-a',
        threatLevel: 1,
        activeObjectives: ['extract-resource-open', 'extract-resource-blocked'],
      },
    });

    const output = tickDroneInvaders(
      { deltaMs: 16, world: partlyBlockedWorld },
      {
        policyThresholds: {
          maxHazardCoverage: 0.5,
          maxRiskBeforeInvasionClamp: 1,
          minRiskForInvasion: 0.2,
          minResourcesForInvasion: 20,
          minReachableResourceRatio: 0.75,
          maxInvasionWaveSize: 8,
        },
      },
    );

    expect(output.policy.hasSafePath).toBe(true);
    expect(output.policy.allowInvasionEvent).toBe(false);
    expect(output.policy.reasonCodes).toContain('resource_accessibility_below_min');
    expect(output.policy.policyLog.candidateInput.reachableResourceCount).toBe(1);
    expect(output.policy.policyLog.candidateInput.totalResourceCount).toBe(2);
    expect(output.policy.policyLog.candidateInput.reachableResourceRatio).toBe(0.5);
  });
});
