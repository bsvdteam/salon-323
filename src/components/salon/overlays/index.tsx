"use client";

import { SalonOverlay } from "./salon";
import { LegalMenu, LegalReader } from "./legal";
import { StoryOverlay } from "./story";
import { CutsOverlay } from "./cuts";

export function Overlays() {
  return (
    <>
      <SalonOverlay />
      <CutsOverlay />
      <LegalMenu />
      <LegalReader />
      <StoryOverlay />
    </>
  );
}
