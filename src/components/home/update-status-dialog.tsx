import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useTheme } from "next-themes";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Laugh, PaintBucket } from "lucide-react";
import useComponentVisible from "@/hooks/useComponentVisible";
import { Textarea } from "../ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BeatLoader } from "react-spinners";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import Image from "next/image";
import ReactPlayer from "react-player";

const UpdateStatusDialog = ({
  statusType,
  onClose,
  statusContent,
}: {
  statusType: string;
  onClose: () => void;
  statusContent?: string | File;
}) => {
  const bgColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-gray-500",
    "bg-red-700",
  ];

  const textColors = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
    "text-pink-500",
    "text-orange-500",
    "text-teal-500",
    "text-indigo-500",
    "text-gray-500",
    "text-red-700",
    "text-gray-100",
    "text-gray-900",
  ];

  const [selectedBg, setSelectedBg] = useState("");
  const [selectedTextColor, setSelectedTextColor] = useState("");
  const [msgText, setMsgText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);

  const changeIntoBg = (color: string) => {
    const [, second, third] = color.split("-");
    return `${second}-${third}`;
  };

  const updateTextStatus = useMutation(api.status.updateTextStatus);
  const me = useQuery(api.users.getMe);
  const updateImageStatus = useMutation(api.status.updateImageStatus);

  const handleUpdateTextStatus = async () => {
    try {
      setIsLoading(true);
      await updateTextStatus({
        backgroundColor: selectedBg,
        textColor: selectedTextColor,
        content: msgText,
        name: me!.name!,
        user: me!._id,
      });
      setIsLoading(false);
      onClose();
      setMsgText("");
      setSelectedBg("");
      setSelectedTextColor("")
    } catch {
      toast.error("Error updating text status.");
      setIsLoading(false);
    }
  };
  const handleUpdateMeidaStatus = async (type: "image"| "video" | "text") => {
    setIsLoading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": (statusContent as File).type },
        body: statusContent,
      });

      const { storageId } = await result.json();

      await updateImageStatus({
        backgroundColor: "bg-white",
        textColor: "text-white",
        content: storageId,
        name: me!.name!,
        user: me!._id,
        type: type,
      });
    } catch {
      toast.error("Failed to send image");
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  

  return (
    <div>
      {statusType === "text" && (
        <Dialog
          open={statusType === "text"}
          onOpenChange={(isOpen) => {
            if (!isOpen) onClose();
          }}
        >
          <DialogContent className={`px-2 pb-2 pt-0`}>
            <DialogTitle></DialogTitle>
            <DialogDescription asChild className="h-96 ">
              <div className="flex flex-col items-center justify-center gap-4">
                <div
                  className={`w-3/4 h-5/6 flex items-center justify-center overflow-x-clip px-1 ${selectedBg}`}
                >
                  <span
                    className={`text-center text-lg break-words break-all overflow-wrap ${selectedTextColor}`}
                  >
                    {msgText}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span>Choose Background Color:</span>
                  <div className="flex items-center justify-center w-full">
                    <Carousel className="w-1/2 flex items-center justify-center">
                      <CarouselContent className="w-1/3">
                        {bgColors.map((color) => (
                          <CarouselItem
                            key={color}
                            onClick={() => setSelectedBg(color)}
                            className="basis-1/8 cursor-pointer"
                          >
                            <div
                              className={`w-6 h-6 rounded-full ${color}`}
                            ></div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span>Choose Text Color:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        className={`h-10 w-10 flex items-center justify-center bg-white border rounded-full `}
                      >
                        <PaintBucket />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-6">
                      {textColors.map((color) => (
                        <DropdownMenuItem
                          asChild
                          key={color}
                          onClick={() => setSelectedTextColor(color)}
                        >
                          <span
                            className={`h-6 w-full rounded-full mb-1 border-2 bg-${changeIntoBg(color)}`}
                          ></span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogDescription>
            <DialogFooter>
              <div className="flex items-center mt-4 overflow-auto gap-5 w-full">
                <div className="flex items-start gap-2 w-4/5">
                  <div
                    ref={ref}
                    onClick={() => setIsComponentVisible(true)}
                    className="cursor-pointer"
                  >
                    {isComponentVisible && (
                      <EmojiPicker
                        theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                        style={{
                          position: "absolute",
                          bottom: "1.5rem",
                          left: "1rem",
                          zIndex: 50,
                        }}
                        height={300}
                        width={300}
                        onEmojiClick={(emojiObject) =>
                          setMsgText((prev) => prev + emojiObject.emoji)
                        }
                      />
                    )}
                    <Laugh
                      size={20}
                      className="text-gray-600 dark:text-gray-400 mr-1 mt-3 "
                    />
                  </div>
                  <Textarea
                    placeholder="Type a message"
                    className="text-sm w-[360px]  border-2 rounded-lg shadow-sm bg-gray-tertiary focus-visible:ring-transparent"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                  />
                </div>
                <Button
                  disabled={
                    isLoading ||
                    msgText === "" ||
                    selectedBg === "" ||
                    selectedTextColor === ""
                  }
                  variant={"secondary"}
                  onClick={handleUpdateTextStatus}
                >
                  {isLoading ? (
                    <BeatLoader
                      size={10}
                      color={theme === "dark" ? "silver" : "gray"}
                    />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </DialogFooter>
            <DialogClose />
          </DialogContent>
        </Dialog>
      )}
      {statusType === "image" && statusContent instanceof File && (
        <MediaImageDialog
          isOpen={statusType === "image"}
          onClose={onClose}
          selectedImage={statusContent}
          isLoading={isLoading}
          handleImageStatus={() => handleUpdateMeidaStatus("image")}
          theme={theme || "light"}
        />
      )}
      {statusType === "video" && statusContent instanceof File && (
        <MediaVideoDialog
          isOpen={statusType === "video"}
          onClose={onClose}
          selectedVideo={statusContent}
          isLoading={isLoading}
          handleVideoStatus={() => handleUpdateMeidaStatus("video")}
          theme={theme || "light"}
        />
      )}
    </div>
  );
};

export default UpdateStatusDialog;

type MediaImageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: File;
  isLoading: boolean;
  handleImageStatus: () => void;
  theme: string;
};

const MediaImageDialog = ({
  isOpen,
  onClose,
  selectedImage,
  isLoading,
  handleImageStatus,
  theme,
}: MediaImageDialogProps) => {
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const reader = new FileReader();
    reader.onload = (e) => setRenderedImage(e.target?.result as string);
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle></DialogTitle>
        <DialogDescription className="flex flex-col gap-10 justify-center items-center">
          {renderedImage && (
            <Image
              src={renderedImage}
              width={300}
              height={300}
              alt="selected image"
            />
          )}
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleImageStatus}
          >
            {isLoading ? (
              <BeatLoader color={theme === "dark" ? "silver" : "gray"} />
            ) : (
              "Update"
            )}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

type MediaVideoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: File;
  isLoading: boolean;
  handleVideoStatus: () => void;
  theme: string
};

 const MediaVideoDialog = ({ isOpen, onClose, selectedVideo, isLoading, handleVideoStatus, theme }: MediaVideoDialogProps) => {
  const renderedVideo = URL.createObjectURL(new Blob([selectedVideo], { type: selectedVideo.type }));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle></DialogTitle>
        <div className='w-full'>
          {renderedVideo && <ReactPlayer url={renderedVideo} controls width='100%' />}
        </div>
        <Button className='w-full' disabled={isLoading} onClick={handleVideoStatus}>
        {isLoading ? <BeatLoader color={theme === "dark" ? "silver" : "gray"}/> : "Update"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
