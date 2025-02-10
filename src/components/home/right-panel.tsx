"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import MessageInput from "./message-input";
import MessageContainer from "./message-container";
import ChatPlaceHolder from "@/components/home/chat-placeholder";
import GroupMembersDialog from "./group-members-dialog";
import { useConversationStore } from "@/store/chat-store";
import { useConvexAuth } from "convex/react";

const RightPanel = () => {
  const { selectedConversation, setSelectedConversation } =
    useConversationStore();

  const { isLoading } = useConvexAuth();
  if (isLoading) return null;
  if (!selectedConversation) return <ChatPlaceHolder />;
  const conversationName =
    selectedConversation!.groupName || selectedConversation!.name;

  const conversationImage =
    selectedConversation!.groupImage?.split("`")[0] ||
    selectedConversation!.image;

    
  return (
    <>
      <div className={`sm:w-3/4 overflow-hidden flex flex-col h-full ${selectedConversation && "sm:w-3/4 w-full" }`}>
        <div className="w-full sticky top-0 z-50">
          {/* Header */}
          <div className="flex w-full sticky justify-between bg-gray-primary p-3">
            <div className="flex gap-3 items-center">
              <Avatar>
                <AvatarImage
                  src={conversationImage || "/placeholder.png"}
                  className="object-cover"
                />
                <AvatarFallback>
                  <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col">
                <p>{conversationName}</p>
                {selectedConversation && selectedConversation?.isGroup ? (
                  <GroupMembersDialog
                    currentSelectedConversation={selectedConversation}
                  />
                ) : selectedConversation.name !== "Gemini AI" && <span className="text-xs text-muted-foreground text-left ">{selectedConversation.isOnline && "Online"}</span>}
              </div>
            </div>

            <div className="flex items-center gap-7 mr-5">
              <X
                size={16}
                className="cursor-pointer"
                onClick={() => setSelectedConversation(null)}
              />
            </div>
          </div>
        </div>
        
        {/* CHAT MESSAGES */}
        <MessageContainer />
        {/* INPUT */}
        <MessageInput /> 
      </div>
    </>
  );
};
export default RightPanel;
