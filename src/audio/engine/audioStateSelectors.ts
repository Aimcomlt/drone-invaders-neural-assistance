import type { AudioCueId, AudioPlan, AudioRuntimeState } from "./audioTypes";

export function resolvePrimaryCue(state: AudioRuntimeState): AudioCueId | null {
  if (state.missionState === "success") return "success_stinger";
  if (state.missionState === "failure") return "failure_stinger";

  if (state.missionState === "menu" || state.missionState === "briefing") {
    return "menu_command_loop";
  }

  if (state.missionState === "play" || state.missionState === "paused") {
    if (!state.enemyPresence) return "gameplay_safe_loop";
    return state.dangerLevel >= 0.6 ? "combat_wave_loop" : "enemy_contact_loop";
  }

  return null;
}

export function resolveOverlayCues(state: AudioRuntimeState): AudioCueId[] {
  const overlays: AudioCueId[] = [];

  if (state.hazardSeverity >= 0.35) overlays.push("hazard_breach_loop");
  if (state.objectiveThreat >= 0.7) overlays.push("objective_critical_layer");

  return overlays;
}

export function resolveAudioPlan(state: AudioRuntimeState): AudioPlan {
  return {
    primary: resolvePrimaryCue(state),
    overlays: resolveOverlayCues(state),
  };
}
