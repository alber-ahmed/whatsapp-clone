/* eslint-disable jsx-a11y/alt-text */
"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  BanIcon,
  Check,
  Crown,
  Image,
  LogOut,
  PlusIcon,
  Trash2,
  UserPlus2,
  Users2,
} from "lucide-react";
import { Conversation, useConversationStore } from "@/store/chat-store";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { BeatLoader } from "react-spinners";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type GroupMembersDialogProps = {
  currentSelectedConversation: Conversation;
};

const GroupMembersDialog = ({
  currentSelectedConversation,
}: GroupMembersDialogProps) => {
  const users = useQuery(api.users.getGroupMembers, {
    conversationId: currentSelectedConversation._id,
  });
  const { selectedConversation, setSelectedConversation } =
    useConversationStore();
  const me = useQuery(api.users.getMe);
  const removeUser = useMutation(api.conversations.removeUser);
  const deleteGroup = useMutation(api.conversations.deleteGroup);
  const changeGroupName = useMutation(api.conversations.changeGroupName);
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const changeGroupImage = useMutation(api.conversations.changeGroupImage);

  const handleRemove = async (
    userId: Id<"users">,
    userName: string,
    participants: Array<Id<"users">>
  ) => {
    try {
      await removeUser({
        conversationId: currentSelectedConversation._id,
        userId: userId,
        removedUserName: userName,
        message: selectedConversation?.lastMessage?._id,
      });

      setSelectedConversation({
        ...currentSelectedConversation,
        participants,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Failed to remove user");
    }
  };
  const [hovered, setHovered] = useState(false);
  const [groupName, setGroupName] = useState(selectedConversation!.groupName);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const { theme } = useTheme();
  const [renderedImage, setRenderedImage] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const leaveGroup = useMutation(api.conversations.leaveGroup);
  const getSpecifcConversation = useMutation(
    api.conversations.getSpecificCoversation
  );

  const handleGroupNameChange = async () => {
    try {
      setIsLoading(true);
      const conversation = await getSpecifcConversation({
        conversationId: currentSelectedConversation._id,
      });
      await changeGroupName({
        conversationId: currentSelectedConversation._id,
        newName: groupName!,
        message: conversation!.lastMessage?._id,
      });
      setSelectedConversation({
        ...currentSelectedConversation,
        groupName: groupName!,
      });
    } catch {
      toast.error("Failed to update group name.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteGroup = async () => {
    try {
      deleteGroup({ conversationId: currentSelectedConversation._id });
      toast.success("Group Deleted.");
      setSelectedConversation(null);
    } catch {
      toast.error("Failed to delete group.");
    }
  };
  const handleImageChange = async () => {
    if (!selectedImage) return;
    try {
      setIsImageLoading(true);
      const conversation = await getSpecifcConversation({
        conversationId: currentSelectedConversation._id,
      });
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });
      const { storageId } = await result.json();
      const groupImage = await changeGroupImage({
        conversationId: currentSelectedConversation._id,
        imageId: storageId,
        message: conversation!.lastMessage?._id,
      });
      setIsImageLoading(false);
      setSelectedConversation({
        ...currentSelectedConversation,
        groupImage: groupImage!,
      });

      setSelectedImage(null);
      setRenderedImage("");
    } catch {
      toast.error("Failed to update group image.");
    }
  };

  useEffect(() => {
    if (!selectedImage) return setRenderedImage("");
    const reader = new FileReader();
    reader.onload = (e) => setRenderedImage(e.target?.result as string);
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <p className="text-xs text-muted-foreground text-left cursor-pointer">
          tap here for group info
        </p>
      </DrawerTrigger>
      <DrawerContent className="w-2/6 overflow-x-hidden max-h-full overflow-y-auto">
        <DialogTitle></DialogTitle>
        <DrawerHeader>
          <DrawerDescription asChild>
            <div>
              <div className="flex items-center flex-col gap-10">
                <input
                  type="file"
                  ref={imageInput}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                    }
                  }}
                  hidden
                />
                <div className="flex items-center justify-between gap-5">
                  <div
                    onClick={() => {
                      imageInput.current!.click();
                    }}
                    className="relative w-36 h-36 mt-5"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    <Avatar className="w-full h-full justify-center">
                      <AvatarImage
                        src={
                          renderedImage ||
                          currentSelectedConversation?.groupImage?.split(
                            "`"
                          )[0] ||
                          "/placeholder.png"
                        }
                        className="object-cover"
                      />
                      <AvatarFallback>
                        <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                      </AvatarFallback>
                    </Avatar>
                    {hovered && (
                      <>
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center text-white font-medium cursor-pointer">
                          <span className="flex items-center cursor-pointer border-2 p-0.5 rounded-md">
                            <PlusIcon className="mr-1" size={20} />
                            Change
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-full shadow-lg"></div>
                      </>
                    )}
                  </div>
                  <Button
                    disabled={isImageLoading || !selectedImage}
                    onClick={handleImageChange}
                    size={"sm"}
                  >
                    {isImageLoading ? (
                      <BeatLoader
                        size={9}
                        color={theme === "dark" ? "silver" : "gray"}
                      />
                    ) : (
                      <p className="flex gap-2">
                        <Check size={20} /> <Image size={20} />
                      </p>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <Input
                    placeholder="Group Name"
                    className="w-full text-black dark:text-white"
                    defaultValue={selectedConversation!.groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <Button
                    disabled={isLoading || groupName?.length === 0}
                    onClick={handleGroupNameChange}
                    variant={"secondary"}
                  >
                    {isLoading ? (
                      <BeatLoader
                        size={12}
                        color={theme === "dark" ? "silver" : "gray"}
                      />
                    ) : (
                      "Update"
                    )}
                  </Button>
                </div>
                <div className="flex flex-col gap-3 self-start w-full">
                  <span className="text-[17px] ml-2 mb-1 text-black dark:text-white text-center self-center font-semibold flex items-center gap-1">
                    <Users2 size={19} />
                    Group Members:
                  </span>
                  <div className="max-h-44 overflow-y-auto w-full">
                    {users?.map((user) => (
                      <div key={user._id}>
                        <div className={`flex gap-3 items-center p-2 rounded `}>
                          <Avatar className="overflow-visible">
                            {user.isOnline && (
                              <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-foreground" />
                            )}
                            <AvatarImage
                              src={user.image}
                              className="rounded-full object-cover"
                            />
                            <AvatarFallback>
                              <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full"></div>
                            </AvatarFallback>
                          </Avatar>

                          <div className="w-full ">
                            <div
                              className={`flex items-center  ${user._id === currentSelectedConversation.admin ? "gap-3" : "justify-between"}`}
                            >
                              <h3 className="text-md font-medium">
                                {user.name || user.email.split("@")[0]}
                              </h3>
                              {user._id ===
                              currentSelectedConversation.admin || users.length === 1 ? (
                                <div className="flex items-center gap-2 ">
                                  <Crown
                                    size={16}
                                    className="text-yellow-500"
                                  />
                                </div>
                              ) : (
                                me?._id ===
                                  currentSelectedConversation.admin  && (
                                  <Button
                                    variant={"ghost"}
                                    onClick={() => {
                                      handleRemove(
                                        user._id,
                                        user!.name!,
                                        selectedConversation?.participants?.filter(
                                          (participant) =>
                                            participant !== user._id
                                        ) || []
                                      );
                                    }}
                                    size={"xs"}
                                    className="text-red-500 font-normal text-[13px]"
                                  >
                                    Remove <LogOut />{" "}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="bg-gray-500 h-0.5 w-full" />
                </div>
              </div>

              <div className="w-full mt-2 flex flex-col gap-2">
                {currentSelectedConversation?.admin === me?._id && (
                  <div
                    className="flex items-center h-14 pl-4 bg-gray-primary rounded-md w-full gap-2 text-green-600 font-medium cursor-pointer"
                    onClick={() => setIsOpen(true)}
                  >
                    <UserPlus2 size={18} /> Add Members
                  </div>
                )}
                {isOpen && (
                  <AddMembersDialog
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                  />
                )}
                <div
                  className="flex items-center h-14 pl-4 bg-gray-primary rounded-md w-full gap-2 text-red-600 font-medium cursor-pointer"
                  onClick={async () => {
                    const conversation = await getSpecifcConversation({
                      conversationId: selectedConversation!._id,
                    });
                    await leaveGroup({
                      userId: me!._id,
                      message: conversation!.lastMessage?._id,
                      conversationId: selectedConversation!._id,
                    });
                    if (me?._id === selectedConversation?.admin) {
                      setSelectedConversation({
                        ...selectedConversation!,
                        participants:
                          selectedConversation?.participants.filter(
                            (participant) => participant !== me?._id
                          ) || [],
                        admin: selectedConversation?.participants.filter(
                          (participant) => participant !== me!._id
                        )[0],
                      });
                    } else if (
                      selectedConversation &&
                      selectedConversation.participants.filter(
                        (participant) => participant !== me?._id
                      ).length > 0
                    ) {
                      setSelectedConversation({
                        ...selectedConversation,
                        participants: selectedConversation.participants.filter(
                          (participant) => participant !== me?._id
                        ),
                      });
                    } else if (
                      selectedConversation &&
                      selectedConversation?.participants.filter(
                        (participant) => participant !== me?._id
                      ).length === 0
                    ) {
                      setSelectedConversation(null);
                    }
                  }}
                >
                  <BanIcon size={18} /> Leave Group
                </div>
                {currentSelectedConversation.admin === me?._id && (
                  <div className="flex items-center gap-2 pl-4 text-red-600 bg-gray-primary rounded-md w-full h-14 font-medium cursor-pointer">
                    <AlertDialog>
                      <AlertDialogTrigger className="flex items-center gap-2">
                        {" "}
                        <Trash2 size={18} /> Delete Group
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the group for every member.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-700 hover:bg-red-700 text-white"
                            onClick={handleDeleteGroup}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};
export default GroupMembersDialog;

const AddMembersDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const me = useQuery(api.users.getMe);

  const conversations = useQuery(api.conversations.getMyConversations, {
    searchQuery: searchQuery,
    isGroup: false,
    isOneToOne: true,
  });
  const addMembers = useMutation(api.conversations.addMembers);
  const getSpecifcConversation = useMutation(
    api.conversations.getSpecificCoversation
  );
  const { selectedConversation, setSelectedConversation } =
    useConversationStore();
    

  const participants = selectedConversation?.participants;

  const filteredConversations = conversations?.filter((conversation) => {
    const participant = conversation?.participants?.filter(
      (participant) => participant !== me?._id
    );
    return participant && !participants?.includes(participant[0]);
  });

  const handleAddMembers = async () => {
    setIsLoading(true);
    try {
      const conversation = await getSpecifcConversation({
        conversationId: selectedConversation!._id,
      });
      await addMembers({
        conversationId: selectedConversation!._id,
        selectedUsers: selectedUsers,
        message: conversation!.lastMessage?._id,
      });

      const currentParticipants = conversation.participants || [];

      // Merge selectedUsers and participants, and remove duplicates using a Set
      const updatedParticipants = [
        ...new Set([...currentParticipants, ...selectedUsers]),
      ];

      setSelectedConversation({
        ...selectedConversation!,
        participants: updatedParticipants,
      });

      setSelectedUsers([]);
      onClose();
    } catch {
      toast.error("Failed to add members");
    } finally {
      setIsLoading(false);
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
        <DialogTitle>Your Contact(s):</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-col gap-10 justify-center items-center">
            <Input
              placeholder="Search from your contacts."
              className="w-full text-black dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-44 overflow-y-auto w-full">
              {filteredConversations?.length === 0 && (
                <span className="text-gray-500 text-center">
                  No users found
                </span>
              )}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredConversations?.map((conversation: any) => (
                <div
                  key={conversation._id}
                  className={`flex gap-3 items-center p-2 rounded cursor-pointer my-2 active:scale-95 
                transition-all ease-in-out duration-300 ${selectedUsers.includes(conversation?.participants.filter((participant: Id<"users">) => participant !== me?._id)[0]) ? "bg-green-primary" : ""}`}
                  onClick={() => {
                    if (
                      selectedUsers.includes(
                        conversation?.participants.filter(
                          (participant: Id<"users">) => participant !== me?._id
                        )[0]
                      )
                    ) {
                      setSelectedUsers(
                        selectedUsers.filter(
                          (id) =>
                            id !==
                            conversation?.participants.filter(
                              (participant: Id<"users">) =>
                                participant !== me?._id
                            )[0]
                        )
                      );
                    } else {
                      setSelectedUsers([
                        ...selectedUsers,
                        conversation?.participants.filter(
                          (participant: Id<"users">) => participant !== me?._id
                        )[0],
                      ]);
                    }
                  }}
                >
                  <Avatar className="overflow-visible">
                    <AvatarImage
                      src={conversation.image}
                      className="rounded-full object-cover"
                    />
                    <AvatarFallback>
                      <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full"></div>
                    </AvatarFallback>
                  </Avatar>

                  <div className="w-full ">
                    <div className={`flex items-center gap-3`}>
                      <h3
                        className={`text-md font-medium ${selectedUsers.includes(conversation?.participants.filter((participant: Id<"users">) => participant !== me?._id)[0]) && "text-white"}`}
                      >
                        {conversation.name || conversation.email.split("@")[0]}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredConversations && filteredConversations?.length > 0 && (
              <Button
                className="w-full"
                disabled={isLoading || selectedUsers.length === 0}
                onClick={handleAddMembers}
              >
                {isLoading ? (
                  <BeatLoader color={theme === "dark" ? "silver" : "gray"} />
                ) : (
                  <span className="flex items-center gap-1">
                    <UserPlus2 />
                    Add{" "}
                  </span>
                )}
              </Button>
            )}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
