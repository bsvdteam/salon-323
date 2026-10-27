import { Preloader } from "@/components/preloader";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { ImageBreak } from "@/components/sections/image-break";
import { History } from "@/components/sections/history";
import { Services } from "@/components/sections/services";
import { Haircuts } from "@/components/sections/haircuts";
import { Spotlight } from "@/components/sections/spotlight";
import { Studio } from "@/components/sections/studio";
import { Testimonials } from "@/components/sections/testimonials";
import { BookingCta } from "@/components/sections/booking-cta";
import { SiteFooter } from "@/components/layout/site-footer";

export default function HomePage() {
  return (
    <>
      <Preloader />
      <Hero />
      <Manifesto />
      <ImageBreak
        src="/images/stills/still-1.jpg"
        eyebrow="Handwerk"
        title="Aus Struktur wird Ausdruck."
      />
      <History />
      <Services />
      <Haircuts />
      <Spotlight />
      <Studio />
      <ImageBreak
        src="/images/stills/still-3.jpg"
        eyebrow="St. Gallen"
        title="Präzision, die man trägt."
      />
      <Testimonials />
      <BookingCta />
      <SiteFooter />
    </>
  );
}
