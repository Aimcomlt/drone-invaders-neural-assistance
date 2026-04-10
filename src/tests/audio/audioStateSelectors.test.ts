import { describe, expect, it } from "vitest";
import { resolveOverlayCues, resolvePrimaryCue } from "../../audio/engine/audioStateSelectors";
import { DEFAULT_AUDIO_RUNTIME_STATE } from "../../audio/engine/audioTypes";

describe("audioStateSelectors", () => {
  it("menu resolves menu_command_loop", () => {
    expect(resolvePrimaryCue({ ...DEFAULT_AUDIO_RUNTIME_STATE, missionState: "menu" })).toBe("menu_command_loop");
  });

  it("play safe resolves gameplay_safe_loop", () => {
    expect(resolvePrimaryCue({ ...DEFAULT_AUDIO_RUNTIME_STATE, missionState: "play", enemyPresence: false })).toBe("gameplay_safe_loop");
  });

  it("contact resolves enemy_contact_loop", () => {
    expect(resolvePrimaryCue({ ...DEFAULT_AUDIO_RUNTIME_STATE, missionState: "play", enemyPresence: true, dangerLevel: 0.59 })).toBe("enemy_contact_loop");
  });

  it("combat resolves combat_wave_loop", () => {
    expect(resolvePrimaryCue({ ...DEFAULT_AUDIO_RUNTIME_STATE, missionState: "play", enemyPresence: true, dangerLevel: 0.6 })).toBe("combat_wave_loop");
  });

  it("hazard overlay appears at threshold", () => {
    expect(resolveOverlayCues({ ...DEFAULT_AUDIO_RUNTIME_STATE, hazardSeverity: 0.35 })).toContain("hazard_breach_loop");
  });

  it("objective critical overlay appears at threshold", () => {
    expect(resolveOverlayCues({ ...DEFAULT_AUDIO_RUNTIME_STATE, objectiveThreat: 0.7 })).toContain("objective_critical_layer");
  });

  it("success and failure resolve stinger primary", () => {
    expect(resolvePrimaryCue({ ...DEFAULT_AUDIO_RUNTIME_STATE, missionState: "success" })).toBe("success_stinger");
    expect(resolvePrimaryCue({ ...DEFAULT_AUDIO_RUNTIME_STATE, missionState: "failure" })).toBe("failure_stinger");
  });
});
