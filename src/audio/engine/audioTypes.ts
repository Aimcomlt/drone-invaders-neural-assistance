export type MissionState = "menu" | "briefing" | "play" | "success" | "failure" | "paused";

export type ZoneType = "menu" | "hangar" | "corridor" | "chamber" | "breach" | "nest";

export interface AudioRuntimeState {
  missionState: MissionState;
  zoneType: ZoneType;
  dangerLevel: number;
  hazardSeverity: number;
  enemyPresence: boolean;
  objectiveThreat: number;
  playerHealthPressure: number;
  paused: boolean;
}

export const AUDIO_CUE_IDS = [
  "menu_command_loop",
  "gameplay_safe_loop",
  "hazard_breach_loop",
  "enemy_contact_loop",
  "combat_wave_loop",
  "objective_critical_layer",
  "success_stinger",
  "failure_stinger",
] as const;

export type AudioCueId = (typeof AUDIO_CUE_IDS)[number];

export type AudioCueType = "loop" | "overlay" | "oneshot";

export interface AudioCueSpec {
  id: AudioCueId;
  file: string;
  type: AudioCueType;
  baseVolume: number;
  fadeInMs: number;
  fadeOutMs: number;
  priority: number;
  loop: boolean;
  tags: readonly string[];
}

export interface AudioPlan {
  primary: AudioCueId | null;
  overlays: AudioCueId[];
}

export const DEFAULT_AUDIO_RUNTIME_STATE: AudioRuntimeState = {
  missionState: "menu",
  zoneType: "menu",
  dangerLevel: 0,
  hazardSeverity: 0,
  enemyPresence: false,
  objectiveThreat: 0,
  playerHealthPressure: 0,
  paused: false,
};
