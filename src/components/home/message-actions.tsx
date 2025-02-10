/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IMessage, useConversationStore } from "@/store/chat-store";
import { useMutation, useQuery } from "convex/react";
import {
  Download,
  Eye,
  FileTextIcon,
  Forward,
  ImageIcon,
  Mic,
  MoreVertical,
  StarsIcon,
  Trash2,
  Users,
  VideoIcon,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { download } from "./chat-bubble";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDate } from "@/lib/utils";
import { MessageSeenSvg } from "@/lib/svgs";
import { Id } from "../../../convex/_generated/dataModel";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { BeatLoader } from "react-spinners";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

const MessageActions = ({
  message,
  fromMe,
  handleClick,
}: {
  message: IMessage;
  fromMe: boolean;
  handleClick: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  return (
    <div className={`justify-self-end`}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical size={14} className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
         <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <Forward className="mr-1 text-green-500" />
            Forward
          </DropdownMenuItem>
          { fromMe && (
            <DropdownMenuItem
              onClick={async () => {
                await deleteMessage({
                  messageId: message._id,
                  messageType: message.messageType,
                  content: message.content,
                });
              }}
            >
              <Trash2 className="mr-1 text-red-500" />
              Delete
            </DropdownMenuItem>
          )}
          {!["audio", "video", "text"].includes(message.messageType) && (
            <>
              {message.messageType !== "image" ? (
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    href={message.content.split("`")[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="flex items-center gap-3">
                      <Eye className=" text-yellow-500 " /> View
                    </span>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleClick}
                >
                  <Eye className="mr-1 text-yellow-500" /> View
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  download(
                    message.content.split("`")[0],
                    message.content.split("`")[1]
                  )
                }
              >
                <Download className="mr-1 " /> Download
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isOpen && (
        <MyConversationsDialog
          message={message}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MessageActions;

const MyConversationsDialog = ({
  message,
  isOpen,
  onClose,
}: {
  message: IMessage;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedConversations, setSelectedConversations] = useState<
    Id<"conversations">[]
  >([]);

  const { theme } = useTheme();
  const { setSelectedConversation } = useConversationStore();
  const myConversations = useQuery(api.conversations.getMyConversations, {
    searchQuery: searchQuery,
    isGroup: false,
    isOneToOne: false,
  });
  const gemini = useQuery(api.users.getGemini);
  const getSpecificConversation = useMutation(api.conversations.getSpecificCoversation);

  const forwardMessage = useMutation(api.messages.forwardMessage);

  const me = useQuery(api.users.getMe);

  const handleForwardMessage = async () => {
    try {
      setIsLoading(true);
      await forwardMessage({
        conversations: selectedConversations,
        content: message.content,
        messageType: message.messageType,
        gemini: gemini!._id,
      });
      setIsLoading(false);
      onClose();
      if(selectedConversations.length === 1){
        
      const specificConversation = await getSpecificConversation({conversationId: selectedConversations[0]});
        setSelectedConversation(specificConversation!);
      }
    } catch {
      toast.error("Failed to forward message");
    } finally {
      setSelectedConversations([]);
    }
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>Forward To:</DialogTitle>
        <div className="w-full">
          <Input
            placeholder="Search chats by name."
            className="mb-5 mt-2 h-8 text-sm border-none rounded-sm "
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="max-h-72 overflow-y-auto">
            {myConversations?.map((conversation: any) => {
              const conversationImage =
                conversation.groupImage?.split("`")[0] || conversation.image;
              const conversationName =
                conversation.groupName || conversation.name;
              const lastMessage = conversation.lastMessage;
              const lastMessageType = lastMessage?.messageType;

              return (
                <div key={conversation._id}>
                  <div
                    className={`flex gap-2  items-center p-3 rounded cursor-pointer active:scale-95 
								transition-all ease-in-out duration-300 ${selectedConversations.includes(conversation._id) ? "bg-green-primary" : ""}`}
                    onClick={() => {
                      if (selectedConversations.includes(conversation._id)) {
                        setSelectedConversations(
                          selectedConversations.filter(
                            (id) => id !== conversation._id
                          )
                        );
                      } else {
                        setSelectedConversations([
                          ...selectedConversations,
                          conversation._id,
                        ]);
                      }
                    }}
                  >
                    <Avatar className="border border-gray-900 overflow-visible relative">
                      {conversation.isOnline &&
                        conversation.name !== "Gemini AI" && (
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-foreground" />
                        )}
                      <AvatarImage
                        src={conversationImage || "/placeholder.png"}
                        className="object-cover rounded-full"
                      />
                      <AvatarFallback>
                        <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full"></div>
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                      <div className="flex items-center">
                        <h3 className="text-xs lg:text-sm font-medium">
                          {conversationName}
                        </h3>
                        <span className="text-[10px] lg:text-xs text-gray-500 ml-auto">
                          {formatDate(
                            lastMessage?._creationTime ||
                              conversation._creationTime
                          )}
                        </span>
                      </div>
                      <p
                        className={`text-[12px] mt-1  flex items-center gap-1 ${selectedConversations.includes(conversation._id) ? "text-white" : "text-gray-500"}`}
                      >
                        {lastMessage?.sender === "Gemini AI" ? (
                          <StarsIcon size={15} />
                        ) : (
                          ""
                        )}
                        {lastMessage?.sender === me?._id ? (
                          <MessageSeenSvg />
                        ) : (
                          ""
                        )}
                        {conversation.isGroup && <Users size={16} />}
                        {!lastMessage && "Say Hi!"}
                        {lastMessageType === "text" ? (
                          lastMessage?.content.length > 30 ? (
                            <span className="text-xs">
                              {lastMessage?.content.slice(0, 30)}...
                            </span>
                          ) : (
                            <span className="text-xs">
                              {lastMessage?.content}
                            </span>
                          )
                        ) : null}
                        {lastMessageType === "image" && <ImageIcon size={16} />}
                        {lastMessageType === "audio" && <Mic size={16} />}
                        {lastMessageType === "video" && <VideoIcon size={16} />}
                        {lastMessage &&
                          !["text", "video", "image", "audio"].includes(
                            lastMessageType
                          ) && <FileTextIcon size={16} />}
                      </p>
                    </div>
                  </div>
                  <hr className="h-[1px] mx-10 bg-gray-primary" />
                </div>
              );
            })}
          </div>
        </div>
        <Button
          className="w-full"
          onClick={handleForwardMessage}
          disabled={selectedConversations.length === 0 || isLoading}
        >
          {isLoading ? (
            <BeatLoader color={theme === "dark" ? "silver" : "gray"} />
          ) : (
            "Forward"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
