"use client";

import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageSeenSvg } from "@/lib/svgs";
import {  FileTextIcon, ImageIcon, Mic, StarsIcon, Users, VideoIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Conversation = ({ conversation }: { conversation: any }) => {
	const conversationImage = conversation.groupImage?.split("`")[0] || conversation.image ;
	const conversationName = conversation.groupName || conversation.name;
	const lastMessage = conversation.lastMessage;
	const lastMessageType = lastMessage?.messageType;

	const me = useQuery(api.users.getMe);

	const { selectedConversation, setSelectedConversation } = useConversationStore();

    const activeBgClass = selectedConversation?._id === conversation._id;

	return (
		<>
			<div className={`flex gap-2 items-center p-3 hover:bg-chat-hover cursor-pointer  ${activeBgClass ? 'bg-chat-hover' : ''}`} 
			onClick={() => setSelectedConversation(conversation)}
			>
				<Avatar className='border border-gray-900 overflow-visible relative'>
					{conversation.isOnline && conversation.name !== "Gemini AI" && (
						<div className='absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-foreground' />
					)}
					<AvatarImage src={conversationImage || "/placeholder.png"} className='object-cover rounded-full' />
					<AvatarFallback>
						<div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
					</AvatarFallback>
				</Avatar>
				<div className='w-full'>
					<div className='flex items-center'>
						<h3 className='text-xs lg:text-sm font-medium'>{conversationName}</h3>
						<span className='text-[10px] lg:text-xs text-gray-500 ml-auto'>
							{formatDate(lastMessage?._creationTime || conversation._creationTime)}
						</span>
					</div>
					<p className='text-[12px] mt-1 text-gray-500 flex items-center gap-1 '>
					{lastMessage?.sender === "Gemini AI" ?<StarsIcon size={15}/> : ""}
						{lastMessage?.sender === me?._id ? <MessageSeenSvg /> : ""}
						{conversation.isGroup && <Users size={16} />}
						{!lastMessage && "Say Hi!"}
						{lastMessageType === "text" ? lastMessage?.content.split("`")[0].length > 13 ? (
							<span className='text-xs'>{lastMessage?.content.slice(0, 13)}...</span>
						) : (
							<span className='text-xs'>{lastMessage?.content.split("`")[0]}</span>
						): null }
						{lastMessageType === "image" && <ImageIcon size={16} />}
						{lastMessageType === "audio" && <Mic size={16} />}
						{lastMessageType === "video" && <VideoIcon size={16} />}
						{lastMessage && !["text","video","image", "audio"].includes(lastMessageType) && <FileTextIcon size={16}/>}
					</p>
				</div>
			</div>
			<hr className='h-[1px] mx-10 bg-gray-primary ' />
		</>
	);
};
export default Conversation;