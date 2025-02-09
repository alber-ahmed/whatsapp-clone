"use client";

import { useMutation, useQuery } from "convex/react";
import React from "react";
import { api } from "../../../convex/_generated/api";
import { IMessage, useConversationStore } from "@/store/chat-store";
import { BotIcon } from "lucide-react";

const UserName = ({ message, name }: { message: IMessage; name: string }) => {
  const { selectedConversation, setSelectedConversation } =
    useConversationStore();

  const createConversation = useMutation(api.conversations.createConversation);
  const me = useQuery(api.users.getMe);
  const gemini = useQuery(api.users.getGemini)
  
  const handleGeminiClick = async()=>{
    const conversationId = await createConversation({
      participants: [me!._id, gemini!._id],
      isGroup: false,
    });
    setSelectedConversation({
      _id: conversationId,
      isGroup: false,
      participants: [me!._id, gemini!._id],
      image: message.sender.image,
      name: message.sender.name,
      admin: me?._id,
      isOnline: message.sender.isOnline,
    });
  return; 
  }

  const handleUserClick = async () => {
    const conversationId = await createConversation({
      participants: [me!._id, message.sender._id],
      isGroup: false,
    });

    setSelectedConversation({
        _id: conversationId,
        isGroup: false,
        participants: [me!._id, message.sender._id],
        image: message.sender.image,
        name: message.sender.name,
        admin: me?._id,
        isOnline: message.sender.isOnline,
      });
    return; 
  };
  return (
      
    <div
      className={`text-xs  font-semibold cursor-pointer my-0.5 hover:underline  ${message.sender.name === "Gemini AI" || name==="Gemini AI" ? "gradient-text" : !selectedConversation?.participants.includes(message.sender._id) && message.sender._id !== selectedConversation?.admin  && "text-gray-500"} `}
      onClick={message.sender.name === "Gemini AI" ? handleGeminiClick : handleUserClick}
    >
      {message.sender.name !== "Gemini AI"  ? name : <p className="hover:underline flex items-center gap-1">Gemini AI <BotIcon size={15}/></p> }
    </div>
  );
};

export default UserName;
