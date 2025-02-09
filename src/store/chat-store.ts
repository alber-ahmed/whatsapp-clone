import { Id } from "../../convex/_generated/dataModel";
import { create } from "zustand";

export type Conversation = {
  _id: Id<"conversations">;
  image?: string;
  participants: Id<"users">[];
  isGroup: boolean;
  name?: string;
  groupImage?: string;
  groupName?: string;
  admin?: Id<"users">;
  isOnline?: boolean;
  lastMessage?: {
    _id: Id<"messages">;
    conversation: Id<"conversations">;
    content: string;
    sender: string;
  };
};

type ConversationStore = {
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export const useConversationStore = create<ConversationStore>((set) => ({
  selectedConversation: null,
  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export interface IMessage {
  _id: Id<"messages">;
  content: string;
  _creationTime: number;
  messageType: "text" | "image" | "video" | string;
  sender: {
    _id: Id<"users">;
    image: string;
    name?: string;
    tokenIdentifier: string;
    email: string;
    _creationTime: number;
    isOnline: boolean;
  };
  geminiId?: string;
}
