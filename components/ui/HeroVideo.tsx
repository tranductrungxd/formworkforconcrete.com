"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Img } from "./Img";

/**
 * The looping YouTube animation of the home page. The poster (a still of the video, hosted on Cloudinary) is the
 * largest image of the page and is delivered first; the player is only mounted after the first interaction (or 8 seconds),
 * so it never delays the first paint. Visitors who prefer reduced motion get the poster and a play button.
 */
export function HeroVideo({ id, title, poster }: { id: string; title: string; poster: string }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Start on the first sign of a visitor (scroll, pointer, touch or key), or after 8 seconds, whichever comes first.
    // The player brings about 800 KB of YouTube script and the video itself, so it must not compete with the page load.
    const events = ["scroll", "pointerdown", "pointermove", "touchstart", "keydown"] as const;
    const start = () => setPlaying(true);
    const timer = window.setTimeout(start, 8000);
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, start));
    };
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-ink md:aspect-[1440/700]">
      <Img src={poster} alt="" fill priority sizes="100vw" className="object-cover" />
      {playing && (
        <iframe
          title={title}
          tabIndex={-1}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3`}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute left-0 top-1/2 aspect-video w-full -translate-y-1/2 border-0"
        />
      )}
      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? `Pause video: ${title}` : `Play video: ${title}`}
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        {playing ? <Pause aria-hidden="true" size={24} fill="currentColor" /> : <Play aria-hidden="true" size={24} fill="currentColor" />}
      </button>
    </div>
  );
}
