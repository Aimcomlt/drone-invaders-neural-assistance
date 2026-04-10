import { useEffect, useMemo } from "react";
import { createAudioController } from "../engine/audioController";

export function useAudioController() {
  const controller = useMemo(() => createAudioController(), []);

  useEffect(() => () => controller.dispose(), [controller]);

  return controller;
}
