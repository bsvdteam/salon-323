"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSalon } from "./store";
import { renderStory } from "@/lib/story-image";
import { inviteMessage, inviteUrl, shareText } from "@/lib/share";

const EZ = "cubic-bezier(.22,1,.36,1)";

/**
 * "Einladung teilen": the invite as a story picture (9:16, in the member's
 * card design) to post straight to Instagram/WhatsApp — plus the classic link
 * message. The picture is rendered when the overlay opens, so the share tap
 * itself has nothing to wait for (iOS only shares during the gesture).
 */
export function StoryShare({ onClose }: { onClose: () => void }) {
  const { state: st, say } = useSalon();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const code = st.refCode;
  const urlRef = useRef("");

  useEffect(() => {
    const U = st.user;
    if (!U || !code) return;
    let live = true;
    const link = inviteUrl(code);
    renderStory({
      first: U.first,
      last: U.last,
      no: U.no,
      cuts: U.cuts,
      card: U.card,
      since: U.since,
      code,
      link: link.replace(/^https?:\/\/(www\.)?/, ""),
      standing: st.standing,
    })
      .then((blob) => {
        if (!live) return;
        const f = new File([blob], `salon15-${code}.png`, {
          type: "image/png",
        });
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setFile(f);
        setUrl(u);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // render once per opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    setLeaving(true);
    setTimeout(onClose, 380);
  };

  const canShareFile =
    !!file &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  // straight in the tap: the file is ready, nothing awaited before share()
  const shareStory = () => {
    if (!file) return;
    if (canShareFile) {
      navigator.share({ files: [file], text: inviteUrl(code) }).catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    say("Bild gespeichert – jetzt in deine Story");
  };
  const shareLink = () => {
    shareText({
      title: "Einladung zu Salon 15",
      text: inviteMessage(code),
      url: inviteUrl(code),
    }).then((r) => {
      if (r === "copied") say("Einladung kopiert – jetzt einfügen");
      else if (r === "failed") say("Kopieren ging nicht – Code: " + code);
    });
  };

  // portalled to <body>: the tab content is animated (transformed), which
  // would pin a fixed overlay to it instead of the screen
  return createPortal(
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding:
          "calc(20px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom))",
        background: "rgba(10,14,22,.62)",
        backdropFilter: "blur(26px) saturate(140%)",
        WebkitBackdropFilter: "blur(26px) saturate(140%)",
        animation: `fade .5s ease both`,
        opacity: leaving ? 0 : 1,
        transition: "opacity .38s ease",
      }}
    >
      <button
        onClick={close}
        aria-label="Schliessen"
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top))",
          right: 18,
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,.2)",
          background: "rgba(255,255,255,.08)",
          color: "#F4F7FA",
          fontSize: 18,
        }}
      >
        ×
      </button>

      {/* the story, floating in */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          height: "min(64vh, 640px)",
          aspectRatio: "9/16",
          maxWidth: "100%",
          borderRadius: 26,
          overflow: "hidden",
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.18)",
          boxShadow: "0 50px 100px -30px rgba(0,0,0,.7)",
          animation: `storyIn 1.1s ${EZ} both`,
          transform: leaving ? "scale(.94) translateY(20px)" : "none",
          transition: `transform .38s ${EZ}`,
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Deine Einladung als Story"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              animation: `fade .8s ease both`,
            }}
          />
        ) : (
          <div
            data-loop
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "rgba(244,247,250,.6)",
              fontSize: 12.5,
              background:
                "linear-gradient(110deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.04) 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s linear infinite",
            }}
          >
            {failed ? "Bild ging nicht – Link senden geht" : "Wird gestaltet …"}
          </div>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          width: "min(340px,100%)",
          animation: `up 1s ${EZ} .25s both`,
        }}
      >
        <button
          onClick={shareStory}
          disabled={!file}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            border: 0,
            background: "#F4F7FA",
            color: "#0E141C",
            fontSize: 14,
            fontWeight: 600,
            opacity: file ? 1 : 0.5,
            transition: "opacity .4s ease",
          }}
        >
          {canShareFile || !file ? "In Story teilen" : "Bild speichern"}
        </button>
        <button
          onClick={shareLink}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.22)",
            background: "transparent",
            color: "#F4F7FA",
            fontSize: 13,
          }}
        >
          Link senden
        </button>
      </div>
    </div>,
    document.body,
  );
}
