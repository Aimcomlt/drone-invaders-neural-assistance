import { DroneConwayConfig, DroneConwayMotifReport, DroneConwayState, DroneVector2 } from '@pacman/shared';
import { simulateConway } from '../conway/step';

const asKey = (cell: DroneVector2): string => `${cell.x},${cell.y}`;

const centroid = (cells: DroneVector2[]): DroneVector2 => {
  const totals = cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );

  return {
    x: Math.round(totals.x / Math.max(1, cells.length)),
    y: Math.round(totals.y / Math.max(1, cells.length)),
  };
};

const detectChaoticZone = (current: Set<string>, next: Set<string>): boolean => {
  if (current.size === 0) {
    return false;
  }

  let changed = 0;
  for (const key of current) {
    if (!next.has(key)) {
      changed += 1;
    }
  }
  for (const key of next) {
    if (!current.has(key)) {
      changed += 1;
    }
  }

  return changed / Math.max(1, current.size) > 0.6;
};

export const detectConwayMotifs = (
  state: DroneConwayState,
  config?: Partial<DroneConwayConfig>,
): DroneConwayMotifReport => {
  const step1 = simulateConway(state, { ...config, stepsPerTick: 1 });
  const step2 = simulateConway(step1, { ...config, stepsPerTick: 1 });
  const step4 = simulateConway(step2, { ...config, stepsPerTick: 2 });

  const currentSet = new Set(state.aliveCells.map(asKey));
  const step1Set = new Set(step1.aliveCells.map(asKey));
  const step2Set = new Set(step2.aliveCells.map(asKey));
  const step4Set = new Set(step4.aliveCells.map(asKey));

  const motifs: DroneConwayMotifReport['motifs'] = [];
  const anchor = centroid(state.aliveCells);

  if (state.aliveCells.length > 0 && currentSet.size === step1Set.size && state.aliveCells.every((c) => step1Set.has(asKey(c)))) {
    motifs.push({ kind: 'stable-cluster', anchor, cellCount: state.aliveCells.length, confidence: 0.9 });
  }

  if (state.aliveCells.length > 0 && currentSet.size === step2Set.size && state.aliveCells.every((c) => step2Set.has(asKey(c)))) {
    motifs.push({ kind: 'oscillator', anchor, cellCount: state.aliveCells.length, confidence: 0.75 });
  }

  if (state.aliveCells.length >= 5 && currentSet.size === step4Set.size && !state.aliveCells.every((c) => step4Set.has(asKey(c)))) {
    motifs.push({ kind: 'glider-candidate', anchor, cellCount: state.aliveCells.length, confidence: 0.55 });
  }

  if (detectChaoticZone(currentSet, step1Set)) {
    motifs.push({ kind: 'chaotic-zone', anchor, cellCount: Math.max(currentSet.size, step1Set.size), confidence: 0.6 });
  }

  const counts: DroneConwayMotifReport['counts'] = {
    'stable-cluster': motifs.filter((m) => m.kind === 'stable-cluster').length,
    oscillator: motifs.filter((m) => m.kind === 'oscillator').length,
    'glider-candidate': motifs.filter((m) => m.kind === 'glider-candidate').length,
    'chaotic-zone': motifs.filter((m) => m.kind === 'chaotic-zone').length,
  };

  return { motifs, counts };
};
