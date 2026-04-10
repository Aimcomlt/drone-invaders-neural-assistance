import { AUDIO_CUE_SPECS } from "../config/audioSpec";
import { AUDIO_MIXER_RULES } from "../config/audioMixerRules";
import { resolveAudioPlan } from "./audioStateSelectors";
import type { AudioCueId, AudioRuntimeState } from "./audioTypes";

type TimerId = ReturnType<typeof setTimeout>;

interface AudioLike {
  src: string;
  loop: boolean;
  volume: number;
  paused: boolean;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  cloneNode(deep?: boolean): AudioLike;
}

type AudioFactory = (src: string) => AudioLike;

export interface AudioController {
  syncAudioState(state: AudioRuntimeState): void;
  playStinger(id: Extract<AudioCueId, "success_stinger" | "failure_stinger">): void;
  setMasterVolume(value: number): void;
  reset(): void;
  dispose(): void;
  getDebugState(): { primary: AudioCueId | null; overlays: AudioCueId[]; unavailable: AudioCueId[]; masterVolume: number };
}

class AudioControllerImpl implements AudioController {
  private readonly audioFactory: AudioFactory;
  private readonly cueAudio = new Map<AudioCueId, AudioLike>();
  private readonly unavailable = new Set<AudioCueId>();
  private readonly timers = new Set<TimerId>();

  private currentPrimary: AudioCueId | null = null;
  private readonly activeOverlays = new Set<AudioCueId>();
  private masterVolume = 1;

  constructor(audioFactory: AudioFactory) {
    this.audioFactory = audioFactory;
  }

  syncAudioState(state: AudioRuntimeState): void {
    const plan = resolveAudioPlan(state);

    this.applyPrimary(plan.primary);
    this.applyOverlays(plan.overlays);

    const pausedFactor = state.paused ? AUDIO_MIXER_RULES.pausedVolumeFactor : 1;
    this.refreshMixLevels(pausedFactor);

    if (plan.primary === "success_stinger" || plan.primary === "failure_stinger") {
      this.playStinger(plan.primary);
    }
  }

  playStinger(id: Extract<AudioCueId, "success_stinger" | "failure_stinger">): void {
    if (this.unavailable.has(id)) return;

    const cue = AUDIO_CUE_SPECS[id];
    try {
      const base = this.getOrCreateAudio(id);
      const oneShot = base.cloneNode(true);
      oneShot.loop = false;
      oneShot.currentTime = 0;
      oneShot.volume = this.clampVolume(cue.baseVolume * this.masterVolume);
      void oneShot.play().catch(() => {
        this.unavailable.add(id);
      });
    } catch {
      this.unavailable.add(id);
    }
  }

  setMasterVolume(value: number): void {
    this.masterVolume = this.clampVolume(value);
    this.refreshMixLevels();
  }

  reset(): void {
    if (this.currentPrimary) {
      this.stopCue(this.currentPrimary);
      this.currentPrimary = null;
    }

    for (const overlay of this.activeOverlays) {
      this.stopCue(overlay);
    }
    this.activeOverlays.clear();
  }

  dispose(): void {
    this.reset();
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cueAudio.clear();
  }

  getDebugState() {
    return {
      primary: this.currentPrimary,
      overlays: [...this.activeOverlays],
      unavailable: [...this.unavailable],
      masterVolume: this.masterVolume,
    };
  }

  private applyPrimary(nextPrimary: AudioCueId | null): void {
    if (!nextPrimary || AUDIO_CUE_SPECS[nextPrimary].type === "oneshot") return;
    if (this.currentPrimary === nextPrimary) return;

    const previous = this.currentPrimary;
    this.currentPrimary = nextPrimary;

    if (previous) {
      this.fadeCue(previous, 0, AUDIO_CUE_SPECS[previous].fadeOutMs, () => this.stopCue(previous));
    }

    this.startCue(nextPrimary);
    this.fadeCue(nextPrimary, this.targetVolume(nextPrimary), AUDIO_CUE_SPECS[nextPrimary].fadeInMs);
  }

  private applyOverlays(targetOverlays: AudioCueId[]): void {
    const targetSet = new Set(targetOverlays);

    for (const id of targetSet) {
      if (this.activeOverlays.has(id)) continue;
      this.activeOverlays.add(id);
      this.startCue(id);
      this.fadeCue(id, this.targetVolume(id), AUDIO_CUE_SPECS[id].fadeInMs);
    }

    for (const activeId of [...this.activeOverlays]) {
      if (targetSet.has(activeId)) continue;
      this.fadeCue(activeId, 0, AUDIO_CUE_SPECS[activeId].fadeOutMs, () => {
        this.stopCue(activeId);
        this.activeOverlays.delete(activeId);
      });
    }
  }

  private getOrCreateAudio(id: AudioCueId): AudioLike {
    const existing = this.cueAudio.get(id);
    if (existing) return existing;

    const cue = AUDIO_CUE_SPECS[id];
    const audio = this.audioFactory(cue.file);
    audio.loop = cue.loop;
    audio.volume = 0;

    const markUnavailable = () => {
      this.unavailable.add(id);
    };
    audio.addEventListener("error", markUnavailable);

    this.cueAudio.set(id, audio);
    return audio;
  }

  private startCue(id: AudioCueId): void {
    if (this.unavailable.has(id)) return;

    try {
      const audio = this.getOrCreateAudio(id);
      if (!audio.paused) return;

      audio.currentTime = 0;
      void audio.play().catch(() => {
        this.unavailable.add(id);
      });
    } catch {
      this.unavailable.add(id);
    }
  }

  private stopCue(id: AudioCueId): void {
    const audio = this.cueAudio.get(id);
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
  }

  private refreshMixLevels(pausedFactor = 1): void {
    if (this.currentPrimary) {
      this.setCueVolume(this.currentPrimary, this.targetVolume(this.currentPrimary) * pausedFactor);
    }
    for (const overlay of this.activeOverlays) {
      this.setCueVolume(overlay, this.targetVolume(overlay) * pausedFactor);
    }
  }

  private targetVolume(id: AudioCueId): number {
    return this.clampVolume(AUDIO_CUE_SPECS[id].baseVolume * this.masterVolume);
  }

  private setCueVolume(id: AudioCueId, value: number): void {
    const audio = this.cueAudio.get(id);
    if (!audio) return;
    audio.volume = this.clampVolume(value);
  }

  private fadeCue(id: AudioCueId, to: number, durationMs: number, onDone?: () => void): void {
    const audio = this.cueAudio.get(id);
    if (!audio) {
      onDone?.();
      return;
    }

    if (durationMs <= 0) {
      audio.volume = this.clampVolume(to);
      onDone?.();
      return;
    }

    const from = audio.volume;
    const steps = Math.max(1, Math.floor(durationMs / AUDIO_MIXER_RULES.fadeStepMs));
    const delta = (to - from) / steps;

    for (let step = 1; step <= steps; step += 1) {
      const timer = setTimeout(() => {
        audio.volume = this.clampVolume(from + delta * step);
        if (step === steps) onDone?.();
        this.timers.delete(timer);
      }, step * AUDIO_MIXER_RULES.fadeStepMs);
      this.timers.add(timer);
    }
  }

  private clampVolume(value: number): number {
    return Math.min(AUDIO_MIXER_RULES.maxVolume, Math.max(AUDIO_MIXER_RULES.minVolume, value));
  }
}

export function createAudioController(audioFactory?: AudioFactory): AudioController {
  const factory =
    audioFactory ??
    ((src: string) => {
      if (typeof Audio === "undefined") {
        throw new Error("Audio API unavailable");
      }
      return new Audio(src) as unknown as AudioLike;
    });

  return new AudioControllerImpl(factory);
}
