"use client";

import { useStatusStore } from "@/store/status-store";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";

const StatusDisplayer = () => {
  const { selectedStatus, setSelectedStatus } = useStatusStore();
  const [fillPercent, setFillPercent] = useState(0);
  const [startTime, setStartTime] = useState(0); // Track start time dynamically
  const [isPaused, setIsPaused] = useState(false); // Track if the progress bar is paused
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Store the interval reference for clearing later

  
  useEffect(() => {
    if (selectedStatus && !isPaused && selectedStatus.statusType !== "video") {
      const updateFill = () => {
        const elapsedTime = (Date.now() - startTime) / 300; // Calculate elapsed time in seconds
        const newFill = Math.min((elapsedTime / 10) * 100, 100); // Ensure it doesn't exceed 100
        setFillPercent(newFill);

        if (newFill === 100) {
          setSelectedStatus(null);
        }
      };

      const interval = setInterval(updateFill, 42); // Update fill every 50ms for smoothness
      intervalRef.current = interval;

      return () => clearInterval(interval); // Cleanup interval on unmount or status change
    }
  }, [selectedStatus, startTime, setSelectedStatus, isPaused]); // Depend on startTime and isPaused to reset on status change or pause

  useEffect(() => {
    // Initialize start time when selectedStatus changes
    if (selectedStatus) {
      setStartTime(Date.now());
    }
  }, [selectedStatus]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setStartTime(Date.now() - (fillPercent / 100) * 2500); // Adjust start time to continue from where it left off
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {selectedStatus?.statusType === "text" && (
        <div className="flex flex-col justify-center items-center w-full h-full">
          {/* Smooth progress bar with transition */}
          <div
            className="w-full h-[3px] self-start bg-green-300 dark:bg-green-chat"
            style={{
              width: `${fillPercent}%`,
              transition: "width 0.05s linear", // Smooth transition over 50ms
            }}
          />

          <div
            className={`flex items-center justify-center lg:w-1/2 sm:w-3/4 w-full h-full  ${selectedStatus.backgroundColor} ${selectedStatus.textColor}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <p className="text-center text-xl">{selectedStatus.content}</p>
          </div>
        </div>
      )}

      {selectedStatus?.statusType === "image" && (
        <div className="flex flex-col justify-center items-center w-full h-full">
          {/* Smooth progress bar with transition */}
          <div
            className="w-full h-[3px] self-start bg-green-300 dark:bg-green-chat"
            style={{
              width: `${fillPercent}%`,
              transition: "width 0.05s linear", // Smooth transition over 50ms
            }}
          />

          <Image
            src={selectedStatus.content?.split("`")[0]}
            alt="Status Image"
            width={500}
            height={500}
            className="lg:w-1/2
            h-full sm:w-3/4 w-full object-contain"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      )}
      {selectedStatus?.statusType === "video" && (
        <div className="flex flex-col justify-center items-center w-full h-full pb-7">
         
          <ReactPlayer
            url={selectedStatus.content?.split("`")[0]}
            width="75%"
            height="80%"
            controls={true}
            onEnded={()=>setSelectedStatus(null)}
            playing={true}
          />
        </div>
      )}
    </div>
  );
};

export default StatusDisplayer;
