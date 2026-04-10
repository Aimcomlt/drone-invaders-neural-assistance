import { DroneWorldSignal } from '@pacman/shared';
import { detectConwayMotifs, generateConwayCandidates, interpretWorld, stepConway, tickDroneInvaders } from '..';

const createWorld = (aliveCells: { x: number; y: number }[]): DroneWorldSignal => ({
  sector: {
    id: 'sector-phase2',
    width: 8,
    height: 8,
    blockedCells: [],
  },
  entities: [
    {
      id: 'ship-1',
      kind: 'player-ship',
      faction: 'player',
      position: { x: 1, y: 1 },
      velocity: { x: 0, y: 0 },
      integrity: 100,
      active: true,
    },
  ],
  resources: [
    {
      id: 'resource-1',
      position: { x: 6, y: 6 },
      richness: 0.8,
      contested: false,
    },
  ],
  run: {
    timestampMs: 1000,
    resourcesBanked: 40,
    currentSectorId: 'sector-phase2',
    threatLevel: 0.2,
    activeObjectives: ['extract-resource-1'],
  },
  conway: {
    step: 0,
    aliveCells,
  },
});

describe('Drone-Invaders Phase 2 Conway integration', () => {
  test('stepConway supports configurable rules and step count', () => {
    const blinker = {
      step: 0,
      aliveCells: [
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
      ],
    };

    const stepped = stepConway(blinker, {
      width: 6,
      height: 6,
      stepsPerTick: 1,
      birthRules: [3],
      survivalRules: [2, 3],
      wrapEdges: false,
    });

    expect(stepped.step).toBe(1);
    expect(stepped.aliveCells).toEqual(
      expect.arrayContaining([
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
      ]),
    );
  });

  test('motif detection scaffolding identifies oscillator candidates', () => {
    const report = detectConwayMotifs(
      {
        step: 0,
        aliveCells: [
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
      },
      { width: 8, height: 8 },
    );

    expect(report.counts.oscillator).toBeGreaterThanOrEqual(1);
  });

  test('candidate generation returns hazard and resource region scaffolds', () => {
    const candidates = generateConwayCandidates(
      {
        step: 0,
        aliveCells: [
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 1 },
          { x: 6, y: 6 },
          { x: 6, y: 5 },
          { x: 5, y: 6 },
        ],
      },
      { width: 8, height: 8 },
    );

    expect(candidates.hazardRegions.length).toBeGreaterThanOrEqual(1);
    expect(candidates.resourceRegions.length).toBeGreaterThanOrEqual(1);
  });

  test('interpretation exposes conway analysis and feature pipeline outputs', () => {
    const world = createWorld([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);

    const interpretation = interpretWorld(world);

    expect(interpretation.conwayAnalysis.motifReport.counts.oscillator).toBeGreaterThanOrEqual(1);
    expect(interpretation.patternFeatures.hazardRegionCount).toBeGreaterThanOrEqual(1);
    expect(interpretation.patternFeatures.resourceRegionCount).toBeGreaterThanOrEqual(1);
  });

  test('tick can execute Conway stepping when configured', () => {
    const world = createWorld([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);

    const output = tickDroneInvaders(
      { deltaMs: 16, world },
      {
        conwayConfig: {
          stepsPerTick: 1,
          birthRules: [3],
          survivalRules: [2, 3],
          wrapEdges: false,
        },
      },
    );

    expect(output.interpretation.patternFeatures.hazardCandidateCells).toBe(3);
    expect(output.execution.hazardPlacements.length).toBeGreaterThanOrEqual(0);
  });
});
