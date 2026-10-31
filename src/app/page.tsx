import type { Metadata } from "next";
import { SalonApp } from "@/components/salon/salon-app";
import { PublicSeo } from "@/components/salon/public-seo";

// The homepage is the one public, server-rendered ranking surface.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <PublicSeo />
      <SalonApp />
    </>
  );
}
