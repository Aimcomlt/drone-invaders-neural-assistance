import { DroneConwayConfig, DroneConwayState, DroneVector2 } from '@pacman/shared';

export const DEFAULT_CONWAY_CONFIG: DroneConwayConfig = {
  width: 32,
  height: 32,
  birthRules: [3],
  survivalRules: [2, 3],
  wrapEdges: false,
  stepsPerTick: 0,
};

const keyFor = (x: number, y: number): string => `${x},${y}`;

const parseCellKey = (key: string): DroneVector2 => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};

const normalizeConfig = (config?: Partial<DroneConwayConfig>): DroneConwayConfig => ({
  ...DEFAULT_CONWAY_CONFIG,
  ...config,
  width: Math.max(1, Math.floor(config?.width ?? DEFAULT_CONWAY_CONFIG.width)),
  height: Math.max(1, Math.floor(config?.height ?? DEFAULT_CONWAY_CONFIG.height)),
  stepsPerTick: Math.max(0, Math.floor(config?.stepsPerTick ?? DEFAULT_CONWAY_CONFIG.stepsPerTick)),
});

const toAliveSet = (aliveCells: DroneVector2[], config: DroneConwayConfig): Set<string> => {
  const set = new Set<string>();
  for (const cell of aliveCells) {
    if (cell.x >= 0 && cell.x < config.width && cell.y >= 0 && cell.y < config.height) {
      set.add(keyFor(cell.x, cell.y));
    }
  }
  return set;
};

const getNeighborKeys = (x: number, y: number, config: DroneConwayConfig): string[] => {
  const result: string[] = [];

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      let nx = x + dx;
      let ny = y + dy;

      if (config.wrapEdges) {
        nx = (nx + config.width) % config.width;
        ny = (ny + config.height) % config.height;
      }

      if (nx < 0 || ny < 0 || nx >= config.width || ny >= config.height) {
        continue;
      }

      result.push(keyFor(nx, ny));
    }
  }

  return result;
};

const runSingleStep = (aliveSet: Set<string>, config: DroneConwayConfig): Set<string> => {
  const neighborCounts = new Map<string, number>();

  for (const aliveKey of aliveSet) {
    const { x, y } = parseCellKey(aliveKey);
    for (const neighborKey of getNeighborKeys(x, y, config)) {
      neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) ?? 0) + 1);
    }
  }

  const nextAlive = new Set<string>();

  for (const [cellKey, count] of neighborCounts) {
    const currentlyAlive = aliveSet.has(cellKey);
    const survives = currentlyAlive && config.survivalRules.includes(count);
    const born = !currentlyAlive && config.birthRules.includes(count);

    if (survives || born) {
      nextAlive.add(cellKey);
    }
  }

  return nextAlive;
};

export const simulateConway = (
  state: DroneConwayState,
  config?: Partial<DroneConwayConfig>,
): DroneConwayState => {
  const resolvedConfig = normalizeConfig(config);
  let aliveSet = toAliveSet(state.aliveCells, resolvedConfig);

  for (let i = 0; i < resolvedConfig.stepsPerTick; i += 1) {
    aliveSet = runSingleStep(aliveSet, resolvedConfig);
  }

  return {
    ...state,
    step: state.step + resolvedConfig.stepsPerTick,
    aliveCells: Array.from(aliveSet, parseCellKey),
  };
};

export const stepConway = (state: DroneConwayState, config?: Partial<DroneConwayConfig>): DroneConwayState =>
  simulateConway(state, config);
