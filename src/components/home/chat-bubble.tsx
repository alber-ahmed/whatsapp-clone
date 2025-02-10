"use client";

import { MessageSeenSvg } from "@/lib/svgs";
import { IMessage, useConversationStore } from "@/store/chat-store";
import ChatBubbleAvatar from "./chat-bubble-avatar";
import DateIndicator from "./date-indicator";
import ReactPlayer from "react-player";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { BanIcon, FileInput, Forward } from "lucide-react";

import toast from "react-hot-toast";
import { useState } from "react";
import UserName from "./user-name";
import MdEditor from "@uiw/react-md-editor";
import { useTheme } from "next-themes";
import MessageActions from "./message-actions";
import AudioWaveform from "./audio-waveform";

type ChatBubbleProps = {
  message: IMessage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  me: any;
  previousMessage?: IMessage;
};

const ChatBubble = ({ me, message, previousMessage }: ChatBubbleProps) => {
  const date = new Date(message._creationTime);
  const hour = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const hours12 = parseInt(hour) % 12 || 12;
  const ampm = parseInt(hour) >= 12 ? "PM" : "AM";
  const time = `${hours12}:${minutes} ${ampm}`;

  const { selectedConversation } = useConversationStore();

  const isMember =
    selectedConversation?.participants.includes(message.sender._id) || false;

  const isGroup = selectedConversation?.isGroup;
  const fromMe = message.sender._id === me._id;
  const fromAI = message.sender.name === "Gemini AI";
  const bgClass = fromMe ? "bg-green-chat" : "bg-white dark:bg-gray-primary";

  const [open, setOpen] = useState(false);

  if (!fromMe) {
    return (
      <>
        <DateIndicator message={message} previousMessage={previousMessage} />
        <div className="flex w-2/3 gap-1">
          <ChatBubbleAvatar
            message={message}
            isMember={isMember}
            isGroup={isGroup}
          />
          
          <div
            className={`flex flex-col z-20 max-w-fit sm:px-2 px-1 rounded-md shadow-md relative sm:pt-1 pt-0.5 ${bgClass}`}
          >
           <div className="flex items-center justify-between gap-2">
          {isGroup && <UserName message={message} name={message.sender.name!} />}
          {(!selectedConversation?.participants.includes(message.sender._id) ) &&
          message.sender.name !== "Gemini AI" && (
            <BanIcon size={12} color="red" />
          )}
          </div> 
            <div></div>
            {!fromAI && <OtherMessageIndicator />}
            {message.content.split("`")[1] === "Forwarded" &&
              message.messageType === "text" && (
                <span className="text-xs font-medium  flex items-center gap-0.5 text-gray-400">
                  <Forward size={10} strokeWidth={3} /> <p className="sm:text-xs text-[10px]">Forwaded</p>
                </span>
              )}
            {message.content.split("`")[2] === "Forwarded" &&
              message.messageType === "audio" && (
                <span className="text-xs font-medium flex items-center gap-0.5 text-gray-400">
                  <Forward size={10} strokeWidth={3} /> <p className="sm:text-xs text-[10px]">Forwaded</p>
                </span>
              )}
            {message.content.split("`")[3] === "Forwarded" &&
              !["audio", "text"].includes(message.messageType) && (
                <span className="text-xs font-medium flex items-center gap-0.5 text-gray-400">
                  <Forward size={10} strokeWidth={3} /> <p className="sm:text-xs text-[10px]">Forwaded</p>
                </span>
              )}
            {message.messageType === "text" && (
              <TextMessage
                message={message}
              />
            )}

            {message.messageType === "image" && (
              <ImageMessage
                message={message}
                handleClick={() => setOpen(true)}
              />
            )}
            {message.messageType === "video" && (
              <VideoMessage
                message={message}
              />
            )}
            {!["text", "image", "video", "audio"].includes(
              message.messageType
            ) && (
              <FileMessage
                message={message}
                fromMe={fromMe}
              />
            )}
            {message.messageType === "audio" && (
              <AudioMessageDisplay fromMe={fromMe} message={message} />
            )}
            {open && (
              <ImageDialog
                src={message.content.split("`")[0]}
                open={open}
                onClose={() => setOpen(false)}
              />
            )}
            <MessageTime time={time} fromMe={fromMe} />
          </div>
          <MessageActions
            message={message}
            fromMe={fromMe}
            handleClick={() => setOpen(true)}
          />
        </div>
      </>
    );
  }
  return (
    <>
      <DateIndicator message={message} previousMessage={previousMessage} />

      <div className="flex w-2/3  gap-1 ml-auto">
        <div
          className={`flex flex-col z-20 max-w-fit sm:px-2 px-1  rounded-md shadow-md ml-auto relative sm:pt-1 pt-0.5 ${bgClass}`}
        >
          <SelfMessageIndicator />
          {message.content.split("`")[1] === "Forwarded" &&
            message.messageType === "text" && (
              <span className="text-xs font-medium flex items-center gap-0.5 text-gray-400">
                <Forward size={10} strokeWidth={3} /> <p className="sm:text-xs text-[10px]">Forwaded</p>
              </span>
            )}
          {message.content.split("`")[2] === "Forwarded" &&
            message.messageType === "audio" && (
              <span className="text-xs font-medium flex items-center gap-0.5 text-gray-400">
                <Forward size={10} strokeWidth={3} /> <p className="sm:text-xs text-[10px]">Forwaded</p>
              </span>
            )}
          {message.content.split("`")[3] === "Forwarded" &&
            (!["audio", "text"].includes(message.messageType)) && (
              <span className="text-xs font-medium flex items-center gap-0.5 text-gray-400">
                <Forward size={10} strokeWidth={3} /> <p className="sm:text-xs text-[10px]">Forwaded</p>
              </span>
            )}

          {message.messageType === "text" && <TextMessage message={message} />}
          {message.messageType === "image" && (
            <ImageMessage message={message} handleClick={() => setOpen(true)} />
          )}

          {open && (
            <ImageDialog
              src={message.content.split("`")[0]}
              open={open}
              onClose={() => setOpen(false)}
            />
          )}
          {message.messageType === "video" && (
            <VideoMessage message={message} />
          )}
          {!["text", "video", "image", "audio"].includes(
            message.messageType
          ) && <FileMessage message={message} fromMe={fromMe} />}
          {message.messageType === "audio" && (
            <AudioMessageDisplay fromMe={fromMe} message={message} />
          )}
          <MessageTime time={time} fromMe={fromMe} />
        </div>

        <MessageActions
          message={message}
          fromMe={fromMe}
          handleClick={() => setOpen(true)}
        />
      </div>
    </>
  );
};
export default ChatBubble;

const VideoMessage = ({
  message,
}: {
  message: IMessage;
}) => {

  return (
    <div className="sm:w-[250px] sm:h-[250px] w-[195px] h-[195px]">
      
      <ReactPlayer
        url={message.content.split("`")[0]}
        width="100%"
        height="100%"
        controls={true}
      />
    </div>
  );
};

const FileMessage = ({
  message,
  fromMe,
}: {
  message: IMessage;
  fromMe: boolean;
}) => {
  const truncateFilename = (filename: string, maxLength: number) => {
    if (filename.length > maxLength) {
      return `${filename.slice(0, maxLength - 3)}...`;
    }
    return filename;
  };

  return (
    <>
      <div className="relative">
        
        <div
          className={`w-full p-2 py-3 rounded-md ${fromMe ? "dark:bg-[#1341054e] bg-[#4edc2331]" : "bg-[#a8b1a631] dark:bg-[#5e625d21]"}`}
        >
          <div className="flex items-center gap-1 mr-3">
            <FileInput size={18} />
            <span className="sm:block hidden">{truncateFilename(message.content.split("`")[1], 37)}</span>
            <span className="sm:hidden block  ">{truncateFilename(message.content.split("`")[1], 21)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

const AudioMessageDisplay = ({
  message,
  fromMe,
}: {
  message: IMessage;
  fromMe: boolean;
}) => {
  return (
    <>
      {/* {!fromMe ? (
          <div className="pt-2">
            <audio className="h-7 audio-theme" src={message.content.split("`")[0]} controls></audio>
          </div>
        ) : (
          <div className="pt-2">
            <audio className=" h-7 audio-theme from-me" controls src={message.content.split("`")[0]}>
            </audio>
          </div>
        )} */}
        <AudioWaveform audioUrl={message.content.split("`")[0]} fromMe={fromMe} isMessage={true}/>
    </>
  );
};

const ImageMessage = ({
  message,
  handleClick,
}: {
  message: IMessage;
  handleClick: () => void;
}) => {
  return (
    <>
     
      <div className="sm:w-[250px] sm:h-[250px] w-[190px] h-[190px] m-2 relative">
        <Image
          src={message.content.split("`")[0]}
          fill
          className="cursor-pointer object-cover rounded"
          alt="image"
          onClick={handleClick}
        />
      </div>
    </>
  );
};

const ImageDialog = ({
  src,
  onClose,
  open,
}: {
  open: boolean;
  src: string;
  onClose: () => void;
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:min-w-[750px] min-w-[330px] p-1">
        <DialogTitle></DialogTitle>
        <DialogDescription className="relative sm:h-[450px] h-[300px] flex justify-center p-0">
          <Image
            src={src}
            fill
            className="rounded-lg object-contain"
            alt="image"
          />
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

const OtherMessageIndicator = () => (
  <div className="absolute bg-white dark:bg-gray-primary top-0 -left-[4px] sm:w-3 sm:h-3 w-2 h-2 rounded-bl-full" />
);

const SelfMessageIndicator = () => (
  <div className="absolute bg-green-chat top-0 -right-[3px] sm:w-3 sm:h-3 w-2 h-2 rounded-br-full overflow-hidden" />
);
const MessageTime = ({ time, fromMe }: { time: string; fromMe: boolean }) => {
  return (
    <p
      className={`text-[10px] ${fromMe ? "mt-[3px]" : "mt-0.5"} self-end flex gap-1 items-center`}
    >
      {time} {fromMe && <MessageSeenSvg />}
    </p>
  );
};

const TextMessage = ({
  message,
}: {
  message: IMessage;
}) => {
  const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(message.content); // Check if the content is a URL

  const { theme } = useTheme();

  return (
    <>
      <div>
        
        {isLink ? (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className={`mr-2 text-sm font-light text-blue-400 underline`}
          >
            {message.content.split("`")[0]}
          </a>
        ) : message.sender.name === "Gemini AI" ? (
          <MdEditor.Markdown
            source={message.content}
            className="bg-transparent max-w-full break-all px-1"
            style={{
              background: "transparent",
              color: theme === "dark" ? "white" : "black",
              fontSize: "14px",
            }}
          />
        ) : (
          <p className={`sm:mr-2 mr-1  max-w-full   text-sm font-light break-all `}>
            {message.content.split("`")[0]}
          </p>
        )}
      </div>
    </>
  );
};

export function download(url: string, name: string) {
  if (!url) {
    console.error("File URL is missing!");
    return;
  }

  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;

      // Ensure compatibility with all browsers
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .catch((err) => {
      toast.error("Failed to download file");
    });
}
