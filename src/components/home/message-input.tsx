"use client";

import { Laugh, Mic, PauseCircle, Send, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import toast from "react-hot-toast";
import useComponentVisible from "@/hooks/useComponentVisible";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import MediaDropdown from "./media-dropdown";
import WaveSurfer from "wavesurfer.js";
import { ClipLoader } from "react-spinners";
import AudioWaveform from "./audio-waveform";

const MessageInput = () => {
  const { theme } = useTheme();

  const [msgText, setMsgText] = useState("");
  const [isAudioVisible, setIsAudioVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false)
  const [waveform, setWaveform] = useState<WaveSurfer | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [renderedAudio, setRenderedAudio] = useState<File | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const waveFormRef = useRef<HTMLDivElement | null>(null);

  const { selectedConversation } = useConversationStore();

  const me = useQuery(api.users.getMe);
  const sendTextMessage = useMutation(api.messages.sendTextMessage);
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl)
  const sendAudioMessage = useMutation(api.messages.sendAudioMessage)

  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

  const handleSendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendTextMessage({
        sender: me!._id,
        content: msgText,
        conversation: selectedConversation!._id,
        selectedConversation: selectedConversation,
      });

      setMsgText("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          // setTotalDuration(prevDuration + 1);
          return prevDuration + 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    if (waveFormRef.current) {
      const wavesurfer = WaveSurfer.create({
        container: waveFormRef.current,
        waveColor: "#ccc",
        progressColor: "#4a9eff",
        cursorColor: "#7ae3c3",
        barWidth: 2,
        height: 30,
      });
      setWaveform(wavesurfer);

      wavesurfer.on("finish", () => {
        setIsPlaying(false);
      });

      return () => {
        wavesurfer.destroy();
      };
    }
  }, []);

  useEffect(() => {
    if (recordedAudio) {
      const updatePlaybackTime = () => {
        setCurrentPlaybackTime(recordedAudio.currentTime);
      };
      recordedAudio.addEventListener("timeupdate", updatePlaybackTime);
      return () => {
        recordedAudio.removeEventListener("timeupdate", updatePlaybackTime);
      };
    }
  }, [recordedAudio]);

  const handleStartRecording = () => {
    if (!renderedAudio) {
      setRecordingDuration(0);
      setCurrentPlaybackTime(0);
      setIsRecording(true);
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          const audioURL = URL.createObjectURL(blob);
          const audio = new Audio(audioURL);
          setRecordedAudio(audio);

          if (waveform) {
            waveform.load(audioURL);
          }
        };

        mediaRecorder.start();
      });
    }
    // .catch((error) => {
    //   toast.error("Error Accessing Microphone");
    //   console.error(error);
    // });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (waveform) {
        waveform.stop();
      }

      const audioChunks: Blob[] = [];
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        const audioFile = new File([audioBlob], "recording.mp3");
        setRenderedAudio(audioFile);
      });
    }
  };

  const sendRecording = async () => {
	try {
    setIsLoading(true)
    if(renderedAudio){
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: {"Content-Type": "audio/mp3"},
        body: renderedAudio 
      })
  
      const { storageId } = await result.json();

		await sendAudioMessage({
			audio: storageId,
			conversation: selectedConversation!._id,
			sender: me!._id,
      sendMessageType: "audio"
		})

  }
		setRenderedAudio(null)
    

	} catch {
		toast.error('Failed to send voice message')
	}finally{
		setIsLoading(false);
    setIsRecording(false)
    setIsAudioVisible(false)
	}
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div
        className={`bg-gray-primary p-2 flex gap-4 items-center ${isAudioVisible && "justify-stretch"} `}
      >
        {!isAudioVisible && (
          <div className="relative flex gap-2 ml-2">
            <div
              ref={ref}
              onClick={() => setIsComponentVisible(true)}
              className="cursor-pointer"
            >
              {isComponentVisible && (
                <EmojiPicker
                  theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                  style={{
                    position: "absolute",
                    bottom: "1.5rem",
                    left: "1rem",
                    zIndex: 50,
                  }}
                  height={380}
                  width={300}
                  onEmojiClick={(emojiObject) =>
                    setMsgText((prev) => prev + emojiObject.emoji)
                  }
                />
              )}
              <Laugh className="text-gray-600 dark:text-gray-400" />
            </div>
            <MediaDropdown />
          </div>
        )}

        {!isAudioVisible ? (
          <form onSubmit={handleSendTextMessage} className="w-full flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Type a message"
                className="py-2 text-sm w-full rounded-lg shadow-sm bg-gray-tertiary focus-visible:ring-transparent"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
              />
            </div>
            <div className="mr-4 flex items-center gap-3">
              {msgText.length > 0 ? (
                <Button
                  type="submit"
                  size={"sm"}
                  className="bg-transparent text-foreground hover:bg-transparent"
                >
                  <Send />
                </Button>
              ) : (
                <Mic
                  size={18}
                  className="cursor-pointer"
                  onClick={() => {
                    setIsAudioVisible(true);
                    setIsRecording(true);
                    handleStartRecording();
                  }}
                />
              )}
            </div>
          </form>
        ) : (
          <div className="flex items-center w-full justify-end">
            <Trash2
              size={20}
              className="mr-10"
              onClick={() => {
                setIsAudioVisible(false);
                setRenderedAudio(null);
              }}
            />
            <div
              className={` text-lg flex ${isRecording && "py-3 px-14 mr-4"} justify-center items-center   ${renderedAudio ? "bg-gray-primary drop-shadow-none rounded-none " : "rounded-full drop-shadow-lg bg-gray-secondary" } `}
            >
              {isRecording ? (
                <div className="text-red-500 animate-pulse text-center">
                  Recording <span>{recordingDuration}s</span>
                </div>
              ) : (
                renderedAudio && (
                  <div className="">
                    {/* <audio controls>
                      <source
                        src={URL.createObjectURL(renderedAudio)}
                        type="audio/mp3"
                      />
                      Your browser does not support the audio element.
                    </audio> */}
                    <AudioWaveform fromMe={false} audioUrl={URL.createObjectURL(renderedAudio)} isMessage={false}/>
                  </div>
                )
              )}
              <div className="" ref={waveFormRef} hidden={isRecording} />
              {recordedAudio && isPlaying && (
                <span>{formatTime(currentPlaybackTime)}</span>
              )}
            </div>
            <div className="mr-4">
              {isRecording && (
                <PauseCircle
                  size={20}
                  className="text-red-500"
                  onClick={handleStopRecording}
                />
              )}
            </div>
            <div>
              <Button
                size={"sm"}
                className="bg-transparent text-foreground hover:bg-transparent"
                disabled={!renderedAudio || isLoading}
                onClick={sendRecording}
              >
                {isLoading ? <ClipLoader size={20} color={theme === "dark" ? "silver" : "gray"}/> :<Send />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageInput;
