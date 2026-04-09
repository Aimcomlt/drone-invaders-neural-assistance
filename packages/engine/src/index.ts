import { MapSchema, Ruleset, SpriteAtlas, RenderBatch, EngineSnapshot, TiltInput, ButtonInput, PlayerState, GhostState } from '@pacman/shared';
import { MovementSystem } from './systems/MovementSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { GhostAISystem } from './systems/GhostAISystem';
import { MapLoader } from './loaders/MapLoader';
import { SpriteLoader } from './loaders/SpriteLoader';
import { RulesLoader } from './loaders/RulesLoader';

export type GameState = {
  player: PlayerState;
  ghosts: GhostState[];
  pellets: Record<string, 2 | 3>;
  pelletsRemaining: number;
  mapId?: string;
  inputs: { tilt?: TiltInput; button?: ButtonInput };
};

const pelletKey = (x: number, y: number) => `${x},${y}`;

const extractPellets = (map: MapSchema): Record<string, 2 | 3> => {
  const pellets: Record<string, 2 | 3> = {};
  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === 2 || tile === 3) {
        pellets[pelletKey(x, y)] = tile;
      }
    });
  });
  return pellets;
};

export const createGameState = (map?: MapSchema): GameState => {
  const pellets = map ? extractPellets(map) : {};
  return {
    player: {
      position: map ? { ...map.playerSpawn } : { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      lives: 3,
      score: 0,
    },
    ghosts: map
      ? map.ghostSpawns.map((spawn, index) => ({
          id: `ghost-${index + 1}`,
          position: { ...spawn },
          velocity: { x: 0, y: 0 },
          lives: 0,
          score: 0,
          poweredUpUntil: undefined,
          mode: 'scatter',
        }))
      : [],
    pellets,
    pelletsRemaining: Object.keys(pellets).length,
    mapId: map?.id,
    inputs: {},
  };
};

export const tickGame = ({
  state,
  map,
  rules,
  delta,
  sprites,
}: {
  state: GameState;
  map: MapSchema;
  rules: Ruleset;
  delta: number;
  sprites?: SpriteAtlas;
}): { snapshot: EngineSnapshot; renderBatch: RenderBatch } => {
  if (state.mapId !== map.id) {
    const next = createGameState(map);
    state.player = next.player;
    state.ghosts = next.ghosts;
    state.pellets = next.pellets;
    state.pelletsRemaining = next.pelletsRemaining;
    state.mapId = map.id;
    state.inputs = next.inputs;
  }

  MovementSystem.integrate(state, map, rules, delta);
  CollisionSystem.resolve(state, map, rules);
  GhostAISystem.update(state, map, rules, delta);

  const renderBatch: RenderBatch = {
    camera: state.player.position,
    commands: SpriteLoader.toRenderCommands(state, sprites),
    hud: { score: state.player.score, lives: state.player.lives, level: map.id },
  };

  const snapshot: EngineSnapshot = {
    player: state.player,
    ghosts: state.ghosts,
    pelletsRemaining: state.pelletsRemaining,
    timestamp: Date.now(),
  };

  return { snapshot, renderBatch };
};

export const loadMap = (raw: unknown): MapSchema => MapLoader.parse(raw);
export const loadSprites = (raw: unknown): SpriteAtlas => SpriteLoader.parse(raw);
export const loadRules = (raw: unknown): Ruleset => RulesLoader.parse(raw);

export * from './legacy';
export * from './drone-invaders';
