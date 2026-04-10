import { DroneConwayCandidates, DroneConwayConfig, DroneConwayState, DroneGameplayCandidateRegion, DroneVector2 } from '@pacman/shared';

const asKey = (cell: DroneVector2): string => `${cell.x},${cell.y}`;

const centroid = (cells: DroneVector2[]): DroneVector2 => {
  const sum = cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );

  return {
    x: Math.round(sum.x / Math.max(1, cells.length)),
    y: Math.round(sum.y / Math.max(1, cells.length)),
  };
};

const clusterByAdjacency = (cells: DroneVector2[]): DroneVector2[][] => {
  const remaining = new Set(cells.map(asKey));
  const byKey = new Map(cells.map((cell) => [asKey(cell), cell]));
  const clusters: DroneVector2[][] = [];

  while (remaining.size > 0) {
    const [start] = remaining;
    const queue: string[] = [start];
    const cluster: DroneVector2[] = [];
    remaining.delete(start);

    while (queue.length > 0) {
      const key = queue.shift()!;
      const cell = byKey.get(key);
      if (!cell) {
        continue;
      }
      cluster.push(cell);

      const neighbors = [
        { x: cell.x + 1, y: cell.y },
        { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 },
        { x: cell.x, y: cell.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const neighborKey = asKey(neighbor);
        if (remaining.has(neighborKey)) {
          remaining.delete(neighborKey);
          queue.push(neighborKey);
        }
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  return clusters;
};

const createRegion = (
  id: string,
  kind: DroneGameplayCandidateRegion['kind'],
  cells: DroneVector2[],
  totalCells: number,
): DroneGameplayCandidateRegion => ({
  id,
  kind,
  cells,
  centroid: centroid(cells),
  score: Math.max(0, Math.min(1, cells.length / Math.max(1, totalCells))),
});

export const generateConwayCandidates = (
  state: DroneConwayState,
  config: Pick<DroneConwayConfig, 'width' | 'height'>,
): DroneConwayCandidates => {
  const totalCells = Math.max(1, config.width * config.height);
  const aliveSet = new Set(state.aliveCells.map(asKey));

  const hazardClusters = clusterByAdjacency(state.aliveCells).filter((cluster) => cluster.length >= 3);

  const deadCells: DroneVector2[] = [];
  for (let y = 0; y < config.height; y += 1) {
    for (let x = 0; x < config.width; x += 1) {
      const cell = { x, y };
      if (!aliveSet.has(asKey(cell))) {
        deadCells.push(cell);
      }
    }
  }

  const resourceClusters = clusterByAdjacency(deadCells)
    .filter((cluster) => cluster.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  return {
    hazardRegions: hazardClusters.map((cluster, index) => createRegion(`hazard-${index}`, 'hazard', cluster, totalCells)),
    resourceRegions: resourceClusters.map((cluster, index) =>
      createRegion(`resource-${index}`, 'resource', cluster, totalCells),
    ),
  };
};
