import { useMemo, useState, type ChangeEvent } from "react";
import { resolveAudioPlan } from "../engine/audioStateSelectors";
import type { AudioController } from "../engine/audioController";
import { DEFAULT_AUDIO_RUNTIME_STATE, type AudioRuntimeState, type MissionState, type ZoneType } from "../engine/audioTypes";

interface AudioDebugPanelProps {
  controller: AudioController;
}

const missionStates: MissionState[] = ["menu", "briefing", "play", "success", "failure", "paused"];
const zoneTypes: ZoneType[] = ["menu", "hangar", "corridor", "chamber", "breach", "nest"];

export function AudioDebugPanel({ controller }: AudioDebugPanelProps) {
  const [state, setState] = useState<AudioRuntimeState>(DEFAULT_AUDIO_RUNTIME_STATE);
  const [masterVolume, setMasterVolume] = useState(1);

  const plan = useMemo(() => resolveAudioPlan(state), [state]);

  const sync = () => controller.syncAudioState(state);

  const onSlider = (key: keyof AudioRuntimeState) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="audio-debug-panel forge-card">
      <h3>Audio Debug</h3>
      <p className="audio-debug-note">Assets may be absent for now; playback can remain silent until files are added under /public/audio.</p>

      <label>
        Mission State
        <select value={state.missionState} onChange={(e) => setState((prev) => ({ ...prev, missionState: e.target.value as MissionState }))}>
          {missionStates.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label>
        Zone Type
        <select value={state.zoneType} onChange={(e) => setState((prev) => ({ ...prev, zoneType: e.target.value as ZoneType }))}>
          {zoneTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label>
        Danger Level ({state.dangerLevel.toFixed(2)})
        <input type="range" min={0} max={1} step={0.01} value={state.dangerLevel} onChange={onSlider("dangerLevel")} />
      </label>

      <label>
        Hazard Severity ({state.hazardSeverity.toFixed(2)})
        <input type="range" min={0} max={1} step={0.01} value={state.hazardSeverity} onChange={onSlider("hazardSeverity")} />
      </label>

      <label>
        Objective Threat ({state.objectiveThreat.toFixed(2)})
        <input type="range" min={0} max={1} step={0.01} value={state.objectiveThreat} onChange={onSlider("objectiveThreat")} />
      </label>

      <label>
        Player Health Pressure ({state.playerHealthPressure.toFixed(2)})
        <input type="range" min={0} max={1} step={0.01} value={state.playerHealthPressure} onChange={onSlider("playerHealthPressure")} />
      </label>

      <label className="audio-checkbox">
        <input type="checkbox" checked={state.enemyPresence} onChange={(e) => setState((prev) => ({ ...prev, enemyPresence: e.target.checked }))} />
        Enemy Presence
      </label>

      <label className="audio-checkbox">
        <input type="checkbox" checked={state.paused} onChange={(e) => setState((prev) => ({ ...prev, paused: e.target.checked }))} />
        Paused
      </label>

      <label>
        Master Volume ({masterVolume.toFixed(2)})
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(e) => {
            const value = Number(e.target.value);
            setMasterVolume(value);
            controller.setMasterVolume(value);
          }}
        />
      </label>

      <div className="audio-actions">
        <button type="button" onClick={sync}>
          Sync Audio
        </button>
        <button type="button" onClick={() => controller.playStinger("success_stinger")}>
          Play Success Stinger
        </button>
        <button type="button" onClick={() => controller.playStinger("failure_stinger")}>
          Play Failure Stinger
        </button>
        <button type="button" onClick={() => controller.reset()}>
          Stop / Reset Audio
        </button>
      </div>

      <div className="audio-plan">
        <strong>Resolved Primary:</strong> {plan.primary ?? "none"}
        <br />
        <strong>Resolved Overlays:</strong> {plan.overlays.length > 0 ? plan.overlays.join(", ") : "none"}
      </div>
    </section>
  );
}
