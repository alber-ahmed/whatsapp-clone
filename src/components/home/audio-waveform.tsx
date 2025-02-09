"use client";

import React, { useRef, useState } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Play, Pause } from "lucide-react";
import { useTheme } from "next-themes";

const AudioWaveform = ({ audioUrl, fromMe, isMessage }: { audioUrl: string; fromMe: boolean , isMessage: boolean}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const { theme } = useTheme();

  const { wavesurfer, isPlaying } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: fromMe ? "#B2AC88" : theme === "dark" ? "#696969" : "#666666",
    progressColor: fromMe ? "#388E3C" : theme === "dark" ? "#D3D3D3" : "#000000",
    cursorColor: "transparent",
    barWidth: 2,
    height: 30,
    barRadius: 2,
    normalize: true,
  });

  // Handle play/pause
  const togglePlay = () => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  };

  // Format time to MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Update current time during playback
  if (wavesurfer) {
    wavesurfer.on("audioprocess", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on("ready", () => {
      setCurrentTime(0); // Reset time when a new audio is loaded
    });

    wavesurfer.on("finish", () => {
      setCurrentTime(wavesurfer.getDuration()); // Set time to end when audio finishes
    });
  }

  // Handle waveform click to seek audio
  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (wavesurfer && containerRef.current) {
      const boundingRect = containerRef.current.getBoundingClientRect();
      const clickX = event.clientX - boundingRect.left;
      const progress = clickX / boundingRect.width;
      wavesurfer.seekTo(progress);
      setCurrentTime(progress * (wavesurfer.getDuration() || 0));
    }
  };

  return (
    <div
      className={`flex items-center gap-2 pt-1 rounded-lg w-[250px] ${
        fromMe ? "bg-green-chat" : isMessage ? "bg-primary-foreground dark:bg-gray-primary" : "bg-gray-primary"
      }`}
    >
      <button onClick={togglePlay} className="p-1">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div
        ref={containerRef}
        className="w-full cursor-pointer"
        onClick={handleWaveformClick}
      ></div>

      <span className="text-[10px]">{formatTime(currentTime)}</span>
    </div>
  );
};

export default AudioWaveform;