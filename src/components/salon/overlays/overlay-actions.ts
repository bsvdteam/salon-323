"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSalon } from "../store";

/** Open/close choreography for the overlays (two-phase: mount then fade in). */
export function useOverlayActions() {
  const { state, set, clearIntro } = useSalon();
  const sref = useRef(state);
  useEffect(() => {
    sref.current = state;
  });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const twoPhaseOpen = useCallback(
    (onKey: string, visKey: string, extra: Record<string, unknown> = {}) => {
      clearIntro();
      set({ [onKey]: true, [visKey]: false, intro: 3, ...extra });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => set({ [visKey]: true })),
      );
    },
    [set, clearIntro],
  );

  const twoPhaseClose = useCallback(
    (onKey: string, visKey: string, delay: number) => {
      set({ [visKey]: false });
      if (timers.current[onKey]) clearTimeout(timers.current[onKey]);
      timers.current[onKey] = setTimeout(() => set({ [onKey]: false }), delay);
    },
    [set],
  );

  const openSalon = useCallback(
    () => twoPhaseOpen("salOn", "salVis"),
    [twoPhaseOpen],
  );
  const closeSalon = useCallback(
    () => twoPhaseClose("salOn", "salVis", 1000),
    [twoPhaseClose],
  );

  const openCuts = useCallback(
    () => twoPhaseOpen("cOn", "cVis", { dragged: false }),
    [twoPhaseOpen],
  );
  const closeCuts = useCallback(
    () => twoPhaseClose("cOn", "cVis", 1000),
    [twoPhaseClose],
  );

  const openLm = useCallback(
    () => twoPhaseOpen("lmOn", "lmVis", { lmHov: -1 }),
    [twoPhaseOpen],
  );
  const closeLm = useCallback(
    () => twoPhaseClose("lmOn", "lmVis", 750),
    [twoPhaseClose],
  );

  const openDoc = useCallback(
    (k: string) => {
      closeLm();
      set({ lDoc: k, lOn: true, lVis: false, lSec: 0, lSwap: false });
      setTimeout(() => set({ lVis: true }), 260);
    },
    [set, closeLm],
  );
  const closeReader = useCallback(
    () => twoPhaseClose("lOn", "lVis", 1000),
    [twoPhaseClose],
  );

  const openStory = useCallback(() => {
    clearIntro();
    set({ story: true, sVis: false, sIdx: 0, sReady: false, intro: 3 });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => set({ sVis: true })),
    );
    setTimeout(() => set({ sReady: true }), 500);
  }, [set, clearIntro]);

  const closeStory = useCallback(
    (after?: () => void) => {
      set({ sReady: false });
      setTimeout(() => set({ sVis: false }), 500);
      setTimeout(() => {
        set({ story: false });
        after?.();
      }, 1750);
    },
    [set],
  );

  const storyGo = useCallback(
    (i: number, total: number) => {
      const to = Math.max(0, Math.min(total - 1, i));
      if (to === sref.current.sIdx) return;
      set({ sIdx: to });
    },
    [set],
  );

  return {
    openSalon,
    closeSalon,
    openCuts,
    closeCuts,
    openLm,
    closeLm,
    openDoc,
    closeReader,
    openStory,
    closeStory,
    storyGo,
  };
}
