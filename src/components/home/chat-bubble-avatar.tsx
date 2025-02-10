import { IMessage } from "@/store/chat-store";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type ChatBubbleAvatarProps = {
	message: IMessage;
	isMember: boolean;
	isGroup: boolean | undefined;
};

const ChatBubbleAvatar = ({ isGroup, isMember, message }: ChatBubbleAvatarProps) => {
	if (!isGroup ) return null;

	return (
		<Avatar className='overflow-visible relative sm:w-10 sm:h-10 w-[26px] h-[26px]'>
			{message.sender.isOnline && isMember && message.sender.name !== 'Gemini AI' && (
				<div className='absolute sm:right-1  right-0 top-0 sm:w-2 sm:h-2 w-[7px] h-[7px] bg-green-500 rounded-full border-2 border-foreground' />
			)}
			<AvatarImage src={message.sender?.image} className='rounded-full object-cover sm:w-8 sm:h-8 w-6 h-6' />
			<AvatarFallback className='sm:w-8 sm:h-8 w-6 h-6'>
				<div className='animate-pulse bg-gray-tertiary rounded-full'></div>
			</AvatarFallback>
		</Avatar>
	);
};
export default ChatBubbleAvatar;