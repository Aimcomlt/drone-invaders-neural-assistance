import { DroneWorldSignal } from '@pacman/shared';
import { tickDroneInvaders } from '..';

const createWorld = (overrides: Partial<DroneWorldSignal> = {}): DroneWorldSignal => ({
  sector: {
    id: 'sector-phase7',
    width: 12,
    height: 12,
    blockedCells: [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 8, y: 5 },
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
      id: 'resource-safe',
      position: { x: 2, y: 2 },
      richness: 0.84,
      contested: false,
    },
    {
      id: 'resource-contested',
      position: { x: 10, y: 4 },
      richness: 0.72,
      contested: true,
    },
  ],
  run: {
    timestampMs: 9000,
    resourcesBanked: 45,
    currentSectorId: 'sector-phase7',
    threatLevel: 0.42,
    activeObjectives: ['extract-resource-safe'],
    ...overrides.run,
  },
  conway: {
    step: 11,
    aliveCells: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
    ],
    ...overrides.conway,
  },
  ...overrides,
});

describe('Drone-Invaders Phase 7 strategic briefing', () => {
  test('tick output includes a bounded readiness briefing and focus guidance', () => {
    const output = tickDroneInvaders({ deltaMs: 16, world: createWorld() });

    expect(output.phase7Briefing.readinessScore).toBeGreaterThanOrEqual(0);
    expect(output.phase7Briefing.readinessScore).toBeLessThanOrEqual(1);
    expect(['fight', 'extract', 'fortify', 'expand']).toContain(output.phase7Briefing.recommendedFocus);
    expect(output.phase7Briefing.summary.length).toBeGreaterThan(0);
  });

  test('briefing degrades toward fortify/fight when pressure and frustration increase', () => {
    const output = tickDroneInvaders(
      {
        deltaMs: 16,
        world: createWorld({
          run: {
            timestampMs: 9001,
            currentSectorId: 'sector-phase7',
            threatLevel: 1,
            resourcesBanked: 5,
            activeObjectives: ['survive'],
          },
        }),
      },
      {
        playtestFeedback: {
          confusionEvents: 4,
          excitingEvents: 1,
          frustrationEvents: 8,
          ignoredAdviceEvents: 3,
        },
      },
    );

    expect(output.phase7Briefing.readinessScore).toBeLessThan(0.5);
    expect(['fight', 'fortify']).toContain(output.phase7Briefing.recommendedFocus);
    expect(output.phase7Briefing.summary.join(' ')).toContain('ADVISORY TUNING');
  });
});
