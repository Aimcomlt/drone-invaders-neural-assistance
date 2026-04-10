import { DroneWorldSignal } from '@pacman/shared';
import { createAssistantModuleSignals, tickDroneInvaders } from '..';

const createWorld = (overrides: Partial<DroneWorldSignal> = {}): DroneWorldSignal => ({
  sector: {
    id: 'sector-phase5',
    width: 12,
    height: 12,
    blockedCells: [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
      { x: 7, y: 3 },
    ],
    ...overrides.sector,
  },
  entities: [
    {
      id: 'ship-1',
      kind: 'player-ship',
      faction: 'player',
      position: { x: 4, y: 10 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
  ],
  resources: [
    {
      id: 'resource-rich',
      position: { x: 2, y: 2 },
      richness: 0.85,
      contested: false,
    },
    {
      id: 'resource-contested',
      position: { x: 10, y: 3 },
      richness: 0.6,
      contested: true,
    },
  ],
  run: {
    timestampMs: 5000,
    resourcesBanked: 15,
    currentSectorId: 'sector-phase5',
    threatLevel: 0.9,
    activeObjectives: ['extract-resource-rich'],
    ...overrides.run,
  },
  conway: {
    step: 7,
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

describe('Drone-Invaders Phase 5 multi-module assistant', () => {
  test('assistant modules produce one bounded signal per module for synthesizer input', () => {
    const output = tickDroneInvaders({ deltaMs: 16, world: createWorld() });
    const moduleSignals = createAssistantModuleSignals(createWorld(), output.interpretation, output.policy);

    expect(moduleSignals).toHaveLength(5);
    expect(new Set(moduleSignals.map((signal) => signal.module)).size).toBe(5);
  });

  test('execution advisories are synthesized from top-priority non-duplicative module signals', () => {
    const output = tickDroneInvaders({ deltaMs: 16, world: createWorld() });

    expect(output.execution.advisorySignals.length).toBeLessThanOrEqual(4);
    expect(output.execution.advisorySignals[0]).toContain('FORECAST: invasion pressure trending high');
    expect(output.execution.advisorySignals.some((signal) => signal.includes('RESOURCES: high-yield window'))).toBe(true);
  });
});
