"use client";

import {
  Globe,
  ImageIcon,
  ListFilter,
  Search,
  Stars,
  Text,
  User2,
  UsersRound,
  Video,
} from "lucide-react";
import { Input } from "../ui/input";
import ThemeSwitch from "../theme-switch";
import Conversation from "./conversation";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import UserListDialog from "./user-list-dialog";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import { useEffect, useRef, useState } from "react";
import Status from "./status";
import Image from "next/image";
import { useTabStore } from "@/store/tab-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UpdateStatusDialog from "./update-status-dialog";
import {AnimatePresence, motion} from "framer-motion";
import { useStatusStore } from "@/store/status-store";

const LeftPanel = () => {
  const { theme } = useTheme();

  const { isAuthenticated, isLoading } = useConvexAuth();
  const [statusType, setStatusType] = useState("text");
  const [isGroup, setIsGroup] = useState(false);
  const [isOneToOne, setIsOneToOne] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedTab, setSelectedTab } = useTabStore();
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);

  const conversations = useQuery(api.conversations.getMyConversations, {
    searchQuery: searchQuery,
    isGroup: isGroup,
    isOneToOne: isOneToOne,
  })

  const sortedConversations = conversations?.sort((a, b) => {
    const aTime = a?.lastMessage?._creationTime || 0;
    const bTime = b?.lastMessage?._creationTime || 0;
    return bTime - aTime;
  });



  const statusData = useQuery(api.status.getUserContactsStatus, {
    searchQuery: searchQuery,
  });
  const userContactsStatus = statusData?.filteredStatuses;
  const myStatus = statusData?.myStatus || [];

  const { selectedConversation, setSelectedConversation } =
    useConversationStore();
  const createConversation = useMutation(api.conversations.createConversation);
  const me = useQuery(api.users.getMe);
  const gemini = useQuery(api.users.getGemini);

  useEffect(() => {
    const conversationIds = conversations?.map(
      (conversation) => conversation?._id
    );
    if (
      selectedConversation &&
      (conversationIds &&
      !conversationIds.includes(selectedConversation._id)) || (selectedConversation?.participants?.length ?? 0) < 0)
     {
      setSelectedConversation(null);
    }
  }, [conversations, selectedConversation, setSelectedConversation]);

  const handleGeminiClick = async () => {
    const conversationId = await createConversation({
      participants: [me!._id, gemini!._id],
      isGroup: false,
    });
    setSelectedConversation({
      _id: conversationId,
      isGroup: false,
      participants: [me!._id, gemini!._id],
      image: "/gemini.jpg",
      name: "Gemini AI",
      admin: me?._id,
      isOnline: true,
    });
    return;
  };
  const {selectedStatus} = useStatusStore()
  if (isLoading || !isAuthenticated) return null;

  return (
    <div className={`w-1/3 ${selectedStatus || selectedConversation ? " sm:block hidden " : "w-full sm:w-1/3"} border-gray-600 border-r sm:relative`}>
      <div className="sticky top-0 bg-left-panel z-10">
        {/* Header */}
        <div className="flex justify-between bg-gray-primary p-3 items-center">
          {theme === "dark" ? (
            <UserButton
              appearance={{
                baseTheme: dark,
              }}
            />
          ) : (
            <UserButton />
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated && <UserListDialog />}
            <ThemeSwitch />
          </div>
        </div>
        <div className="p-3 flex items-center ">
          {/* Search */}
          <div className="relative h-10 mx-3 flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
              size={18}
            />
            <Input
              type="text"
              placeholder={`Search ${selectedTab} by name.`}
              className="pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedTab === "chats" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {selectedTab === "chats" && (
                  <ListFilter className="cursor-pointer" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter Conversations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {setIsGroup(false); setIsOneToOne(false)}}
                  className="cursor-pointer"
                >
                  <Globe className="mr-1" size={18} /> All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {setIsGroup(true); setIsOneToOne(false)}}
                  className="cursor-pointer"
                >
                  <UsersRound className="mr-1" size={18} /> Group
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {setIsOneToOne(true); setIsGroup(false)}}
                >
                  <User2 className="mr-1" size={20} /> One To One
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex  items-center gap-3 px-5 text-sm">
        <div
          onClick={() => {
            setSelectedTab("chats");
            setSearchQuery("");
          }}
          className={`rounded-xl px-2 py-0.5 cursor-pointer ${selectedTab === "chats" ? "bg-green-chat dark:text-green-500 text-green-700" : "bg-gray-primary text-gray-500 dark:text-gray-400  "}`}
        >
          <span>Chats</span>
        </div>
        <div
          onClick={() => {
            setSelectedTab("status");
            setSearchQuery("");
          }}
          className={`rounded-xl px-2 cursor-pointer py-0.5 ${selectedTab === "status" ? "bg-green-chat dark:text-green-500 text-green-700" : "bg-gray-primary text-gray-500 dark:text-gray-400"}`}
        >
          <span>Status</span>
        </div>
      </div>
      {/* Chat List */}
      {selectedTab === "chats" && (
        <div className="my-3 flex flex-col gap-0 max-h-[80%] overflow-auto ">
          <div
            className="absolute bottom-3 cursor-pointer right-3  items-center font-medium font-sans gap-1  bg-gray-50 border dark:bg-gray-800  p-[7px] rounded-lg "
            onClick={handleGeminiClick}
          >
            <Stars
              size={20}
              fill={theme === "dark" ? "#FFC107" : "#ffdb0fd1"}
              strokeWidth={1}
              stroke={theme === "dark" ? "#FFC107" : "black"}
            />
          </div>
          {/* Conversations will go here*/}
          {sortedConversations?.map((conversation) => (
            <AnimatePresence key={conversation?._id}>
              <motion.div
              layout
              initial={{opacity: 0.2}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
             
              >
            <Conversation key={conversation?._id} conversation={conversation} />
            </motion.div>
            </AnimatePresence>
          ))}
          {conversations?.length === 0 && (
            <div className="px-2">
              <p className="text-center text-gray-500 text-sm mt-3">
                No conversations yet
              </p>
              <p className="text-center text-gray-500 text-sm mt-3 ">
                We understand {"you're"} an introvert, but {"you've"} got to
                start somewhere 😊
              </p>
            </div>
          )}
        </div>
      )}

      {selectedTab === "status" && (
        <div className="my-3 flex flex-col gap-0 max-h-[80%] overflow-auto ">
          <input
            type="file"
            ref={imageInput}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedImage(file);
              }
            }}
            hidden
          />

          <input
            type="file"
            ref={videoInput}
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedVideo(file);
              }
            }}
            hidden
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="absolute bottom-3 cursor-pointer right-3 flex items-center font-medium font-sans gap-1 bg-green-chat    p-[7px] rounded-lg ">
                <svg
                  fill="none"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g
                    stroke={theme === "dark" ? "#F5F5F5" : "#33363f"}
                    strokeWidth="2"
                  >
                    <path d="m12 4c-3.77124 0-5.65685 0-6.82843 1.17157-1.17157 1.17158-1.17157 3.05719-1.17157 6.82843v6c0 .9428 0 1.4142.29289 1.7071.2929.2929.7643.2929 1.70711.2929h6c3.7712 0 5.6569 0 6.8284-1.1716 1.1716-1.1715 1.1716-3.0572 1.1716-6.8284" />
                    <g strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 10h6" />
                      <path d="m9 14h3" />
                      <path d="m19 8v-6m-3 3h6" />
                    </g>
                  </g>
                </svg>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Update My Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  imageInput.current!.click();
                  setStatusType("image");
                }}
                className="cursor-pointer"
              >
                <ImageIcon className="mr-1" size={18} /> Photo
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  videoInput.current!.click();
                  setStatusType("video");
                }}
              >
                <Video className="mr-1" size={20} /> Video
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsTextDialogOpen(true);
                  setStatusType("text");
                }}
                className="cursor-pointer"
              >
                <Text className="mr-1" size={18} /> Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isTextDialogOpen && statusType === "text" && (
            <UpdateStatusDialog
              statusType={statusType}
              onClose={() => setStatusType("none")}
            />
          )}
          {selectedImage && statusType === "image" && (
            <UpdateStatusDialog
              statusType={statusType}
              statusContent={selectedImage!}
              onClose={() => {
                setStatusType("none");
                setSelectedImage(null);
              }}
            />
          )}
          {selectedVideo && statusType === "video" && (
            <UpdateStatusDialog
              statusType={statusType}
              statusContent={selectedVideo!}
              onClose={() => {
                setStatusType("none");
                setSelectedVideo(null);
              }}
            />
          )}
          {myStatus && myStatus.length > 0 ? (
            <div>
              {myStatus && <Status status={myStatus[0]} isMine={true} />}
            </div>
          ) : (
            <>
              <div className="flex gap-2 items-center p-3 hover:bg-chat-hover cursor-pointer ">
                <div>
                  <div className="w-12 h-12 rounded-full text-[8px] flex items-end justify-center border-[4px] relative">
                    <Image
                      src={"/placeholder.png"}
                      alt="Status Content"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-full"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center">
                    <h3 className="text-xs lg:text-sm font-medium">
                      My Status
                    </h3>
                  </div>

                  <span className="text-xs dark:text-gray-400 text-gray-600">
                    No status updates.
                  </span>
                </div>
              </div>
              <hr className="h-[1px] mx-10 bg-gray-primary" />
            </>
          )}
          <h3 className="text-xs  font-medium dark:text-gray-400 text-gray-600 px-4 py-1.5 ">
            Recent Updates
          </h3>
          {/* <hr className="h-[1px] bg-gray-primary" /> */}
          {userContactsStatus?.map((status) => (
            <Status key={status?._id} status={status} />
          ))}
          {userContactsStatus?.length === 0 && (
            <div className="px-2">
              <p className="text-center text-gray-500 text-sm mt-3">
                No Status to view.
              </p>
              <p className="text-center text-gray-500 text-sm mt-3 ">
                Keep in touch to view Status Updates
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default LeftPanel;
