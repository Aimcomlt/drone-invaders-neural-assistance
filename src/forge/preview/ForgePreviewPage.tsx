import { AudioDebugPanel } from "../../audio/debug/AudioDebugPanel";
import { useAudioController } from "../../audio/react/useAudioController";
import "./preview.css";

export function ForgePreviewPage() {
  const audioController = useAudioController();

  return (
    <main className="forge-preview-page">
      <section className="forge-card forge-preview-main">
        <h2>Drone-Invaders Forge Preview</h2>
        <p>Current preview includes an isolated audio harness to validate state-driven music cue behavior before gameplay runtime integration.</p>
      </section>

      <aside className="forge-preview-side">
        <AudioDebugPanel controller={audioController} />
      </aside>
    </main>
  );
}

export default ForgePreviewPage;
