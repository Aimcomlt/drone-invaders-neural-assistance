import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioController } from "../../audio/engine/audioController";
import { DEFAULT_AUDIO_RUNTIME_STATE, type AudioRuntimeState } from "../../audio/engine/audioTypes";

class MockAudio {
  src: string;
  loop = false;
  volume = 0;
  paused = true;
  currentTime = 0;
  shouldFailPlay = false;

  constructor(src: string) {
    this.src = src;
  }

  play = vi.fn(async () => {
    if (this.shouldFailPlay) throw new Error("missing");
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  addEventListener = vi.fn();
  removeEventListener = vi.fn();

  cloneNode() {
    const clone = new MockAudio(this.src);
    clone.shouldFailPlay = this.shouldFailPlay;
    return clone;
  }
}

const makeState = (partial: Partial<AudioRuntimeState>): AudioRuntimeState => ({
  ...DEFAULT_AUDIO_RUNTIME_STATE,
  missionState: "play",
  ...partial,
});

describe("audioController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("syncAudioState activates one primary", () => {
    const created: MockAudio[] = [];
    const controller = createAudioController((src) => {
      const audio = new MockAudio(src);
      created.push(audio);
      return audio;
    });

    controller.syncAudioState(makeState({ enemyPresence: false }));
    vi.runAllTimers();

    const debug = controller.getDebugState();
    expect(debug.primary).toBe("gameplay_safe_loop");
    expect(created.filter((a) => !a.paused).length).toBe(1);
  });

  it("changing state replaces primary rather than stacking", () => {
    const controller = createAudioController((src) => new MockAudio(src));

    controller.syncAudioState(makeState({ enemyPresence: false }));
    controller.syncAudioState(makeState({ enemyPresence: true, dangerLevel: 0.9 }));
    vi.runAllTimers();

    expect(controller.getDebugState().primary).toBe("combat_wave_loop");
  });

  it("overlays are added and removed correctly", () => {
    const controller = createAudioController((src) => new MockAudio(src));

    controller.syncAudioState(makeState({ hazardSeverity: 0.5, objectiveThreat: 0.8 }));
    vi.runAllTimers();
    expect(controller.getDebugState().overlays.sort()).toEqual(["hazard_breach_loop", "objective_critical_layer"].sort());

    controller.syncAudioState(makeState({ hazardSeverity: 0.2, objectiveThreat: 0.1 }));
    vi.runAllTimers();
    expect(controller.getDebugState().overlays).toEqual([]);
  });

  it("playStinger does not replace tracked primary loop permanently", () => {
    const controller = createAudioController((src) => new MockAudio(src));

    controller.syncAudioState(makeState({ enemyPresence: false }));
    controller.playStinger("success_stinger");
    vi.runAllTimers();

    expect(controller.getDebugState().primary).toBe("gameplay_safe_loop");
  });

  it("missing asset paths do not throw", () => {
    const controller = createAudioController((src) => {
      const audio = new MockAudio(src);
      if (src.includes("failure_stinger")) {
        audio.shouldFailPlay = true;
      }
      return audio;
    });

    expect(() => controller.playStinger("failure_stinger")).not.toThrow();
  });

  it("setMasterVolume updates controller state safely", () => {
    const controller = createAudioController((src) => new MockAudio(src));

    controller.setMasterVolume(0.42);
    expect(controller.getDebugState().masterVolume).toBe(0.42);
  });
});
