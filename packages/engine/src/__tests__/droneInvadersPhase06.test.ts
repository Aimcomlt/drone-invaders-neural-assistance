import { DroneWorldSignal } from '@pacman/shared';
import { tickDroneInvaders } from '..';

const createWorld = (overrides: Partial<DroneWorldSignal> = {}): DroneWorldSignal => ({
  sector: {
    id: 'sector-phase6',
    width: 12,
    height: 12,
    blockedCells: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
      { x: 7, y: 4 },
    ],
    ...overrides.sector,
  },
  entities: [
    {
      id: 'ship-1',
      kind: 'player-ship',
      faction: 'player',
      position: { x: 3, y: 10 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
  ],
  resources: [
    {
      id: 'resource-open',
      position: { x: 2, y: 2 },
      richness: 0.88,
      contested: false,
    },
    {
      id: 'resource-contested',
      position: { x: 10, y: 3 },
      richness: 0.72,
      contested: true,
    },
  ],
  run: {
    timestampMs: 7000,
    resourcesBanked: 18,
    currentSectorId: 'sector-phase6',
    threatLevel: 0.94,
    activeObjectives: ['extract-resource-open'],
    ...overrides.run,
  },
  conway: {
    step: 9,
    aliveCells: [
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 8, y: 5 },
    ],
    ...overrides.conway,
  },
  ...overrides,
});

describe('Drone-Invaders Phase 6 tuning and playtest refinement', () => {
  test('execution emits telemetry and detailed advisory output for playtest review loop', () => {
    const output = tickDroneInvaders({ deltaMs: 16, world: createWorld() });

    expect(output.execution.advisorySignalDetails.length).toBeGreaterThan(0);
    expect(output.telemetry.advisorySignalsEmitted).toBe(output.execution.advisorySignals.length);
    expect(output.telemetry.hazardPlacementCount).toBe(output.execution.hazardPlacements.length);
    expect(output.playtestReview.recommendations.length).toBeGreaterThan(0);
  });

  test('tuning pass can reduce advisory frequency and rebalance hazard pressure', () => {
    const defaultOutput = tickDroneInvaders({ deltaMs: 16, world: createWorld() });
    const tunedOutput = tickDroneInvaders(
      { deltaMs: 16, world: createWorld() },
      {
        assistantTuning: {
          maxSignalsPerTick: 2,
          minConfidenceToBroadcast: 0.8,
          hazardBalanceBias: 0.2,
        },
        playtestFeedback: {
          confusionEvents: 5,
          excitingEvents: 2,
          frustrationEvents: 6,
          ignoredAdviceEvents: 3,
        },
      },
    );

    expect(tunedOutput.execution.advisorySignals.length).toBeLessThanOrEqual(2);
    expect(tunedOutput.telemetry.advisorySignalsSuppressed).toBeGreaterThanOrEqual(1);
    expect(tunedOutput.execution.advisorySignals.length).toBeLessThanOrEqual(defaultOutput.execution.advisorySignals.length);
    expect(tunedOutput.playtestReview.recommendations.join(' ')).toContain('Reduce hazard pressure bias');
  });
});
