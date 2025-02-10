"use client";

import ChatBubble from "./chat-bubble";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import { useEffect, useRef } from "react";

const MessageContainer = () => {
  const { selectedConversation } = useConversationStore();
  const messages = useQuery(api.messages.getMessages, {
    conversation: selectedConversation!._id,
  });
  const me = useQuery(api.users.getMe);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const events = useQuery(api.events.getAllEvents);

  const initialEvent =
    events?.filter(
      (event) =>
        event.conversation === selectedConversation?._id &&
        event.message === undefined
    ) || null;

  // Scroll to the last message whenever messages or events change
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, events]);

  return (
    <div className="relative sm:p-3 px-1 pl-3 py-3 flex-1 overflow-auto h-full bg-chat-tile-light dark:bg-chat-tile-dark">
      <div className="sm:mx-12 flex flex-col gap-3">
        {initialEvent &&
          initialEvent !== null &&
          events &&
          events.length > 0 &&
          initialEvent.map((event) => (
            <div
              key={event._id}
              className="flex justify-center items-center text-[11px] mt-3"
            >
              <div className="bg-gray-primary dark:text-gray-300 text-gray-800 p-1 rounded-md">
                {event.content}
              </div>
            </div>
          ))}
        {messages?.map((msg, idx) => {
          const currentEvent =
            events?.filter(
              (event) =>
                event.conversation === selectedConversation?._id &&
                event.message === msg._id
            ) || null;

          return (
            <div key={msg?._id}>
              <ChatBubble
                me={me}
                message={msg}
                previousMessage={idx > 0 ? messages[idx - 1] : undefined}
              />
              {currentEvent &&
                currentEvent !== null &&
                events &&
                events.length > 0 &&
                currentEvent.map((event) => (
                  <div
                    key={event._id}
                    className="flex justify-center items-center text-[11px] mt-3"
                  >
                    <div className="bg-gray-primary dark:text-gray-300 text-gray-800 p-1 rounded-md">
                      {event.content}
                    </div>
                  </div>
                ))}
              {/* Attach the ref to the last message */}
              {idx === messages.length - 1 && <div ref={lastMessageRef} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageContainer;
