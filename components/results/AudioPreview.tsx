"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Play/pause for a 30s preview. Renders nothing when no preview URL exists. */
export function AudioPreview({ url, label }: { url: string | null; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!url) return null;

  return (
    <>
      <audio ref={ref} src={url} preload="none" onEnded={() => setPlaying(false)} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`${playing ? "Pause" : "Play"} preview of ${label}`}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (playing) a.pause();
          else void a.play();
          setPlaying(!playing);
        }}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        Preview
      </Button>
    </>
  );
}
