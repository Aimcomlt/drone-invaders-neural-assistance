import { DroneWorldSignal } from '@pacman/shared';
import {
  createConwayInterpreterModel,
  createLoggedRiskModelAdapter,
  deterministicRiskFallback,
  tickDroneInvaders,
} from '..';

const createWorld = (overrides: Partial<DroneWorldSignal> = {}): DroneWorldSignal => ({
  sector: {
    id: 'sector-phase4',
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
      position: { x: 4, y: 8 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
    {
      id: 'enemy-1',
      kind: 'enemy-drone',
      faction: 'hostile',
      position: { x: 6, y: 3 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
  ],
  resources: [
    {
      id: 'resource-1',
      position: { x: 2, y: 2 },
      richness: 0.7,
      contested: false,
    },
  ],
  run: {
    timestampMs: 3000,
    resourcesBanked: 60,
    currentSectorId: 'sector-phase4',
    threatLevel: 0.7,
    activeObjectives: ['extract-resource-1'],
    ...overrides.run,
  },
  conway: {
    step: 9,
    aliveCells: [
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
      { x: 5, y: 4 },
      { x: 5, y: 5 },
    ],
    ...overrides.conway,
  },
  ...overrides,
});

describe('Drone-Invaders Phase 4 first neural module', () => {
  test('Conway interpreter model runs behind adapter and records normalized input/output logs', () => {
    const loggedModel = createLoggedRiskModelAdapter(createConwayInterpreterModel());

    const output = tickDroneInvaders(
      { deltaMs: 16, world: createWorld() },
      {
        riskModel: loggedModel.adapter,
      },
    );

    const entries = loggedModel.getEntries();

    expect(output.interpretation.riskAssessment.source).toBe('assistant-model');
    expect(entries).toHaveLength(1);
    expect(entries[0].input.aliveDensity).toBeGreaterThanOrEqual(0);
    expect(entries[0].input.aliveDensity).toBeLessThanOrEqual(1);
    expect(entries[0].output.source).toBe('assistant-model');
  });

  test('policy still clamps model risk output before invasion sizing', () => {
    const aggressiveModel = {
      evaluateSectorRisk: () => ({
        sectorRisk: 1,
        extractionRisk: 1,
        confidence: 0.99,
        source: 'assistant-model' as const,
      }),
    };

    const output = tickDroneInvaders(
      { deltaMs: 16, world: createWorld() },
      {
        riskModel: aggressiveModel,
        policyThresholds: {
          maxHazardCoverage: 1,
          maxRiskBeforeInvasionClamp: 0.4,
          minRiskForInvasion: 0.2,
          minResourcesForInvasion: 20,
          minReachableResourceRatio: 0.5,
          maxInvasionWaveSize: 8,
        },
      },
    );

    expect(output.interpretation.riskAssessment.sectorRisk).toBe(1);
    expect(output.policy.clampedRisk).toBe(0.4);
    expect(output.execution.invasionWaveSize).toBe(4);
  });

  test('debug diagnostics include fallback vs model comparison', () => {
    const world = createWorld();
    const withModel = tickDroneInvaders(
      { deltaMs: 16, world },
      {
        riskModel: createConwayInterpreterModel(),
      },
    );

    const fallbackOnly = tickDroneInvaders(
      { deltaMs: 16, world },
      {
        riskModel: deterministicRiskFallback,
      },
    );

    expect(withModel.interpretation.riskDiagnostics.modelAssessment?.source).toBe('assistant-model');
    expect(withModel.interpretation.riskDiagnostics.fallbackAssessment.source).toBe('deterministic-fallback');
    expect(withModel.interpretation.riskDiagnostics.selectedSource).toBe('assistant-model');
    expect(withModel.interpretation.riskAssessment.sectorRisk).not.toBe(
      fallbackOnly.interpretation.riskAssessment.sectorRisk,
    );
  });
});
