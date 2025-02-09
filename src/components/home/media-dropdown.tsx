/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { File, ImageIcon, Plus, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import Image from "next/image";
import { Button } from "../ui/button";
import ReactPlayer from 'react-player'
import toast from "react-hot-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import { BeatLoader } from 'react-spinners'
import { useTheme } from "next-themes";
  

const MediaDropdown = () => {
	const { theme } = useTheme()

    const imageInput = useRef<HTMLInputElement>(null);
    const videoInput = useRef<HTMLInputElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false);

	const generateUploadUrl = useMutation(api.conversations.generateUploadUrl)

	const sendImage = useMutation(api.messages.sendImage)
	const sendVideo = useMutation(api.messages.sendVideo)
	const sendFile = useMutation(api.messages.sendFile)

	const me = useQuery(api.users.getMe)

	const {selectedConversation} = useConversationStore()

   const handleSendImage = async()=>{
	setIsLoading(true)
	try {
		const postUrl = await generateUploadUrl();
		const result = await fetch(postUrl, {
			method: "POST",
			headers: {"Content-Type": selectedImage!.type},
			body: selectedImage
		})

		const { storageId } = await result.json();

		await sendImage({
			conversation: selectedConversation!._id,
			imgId: storageId,
			sender: me!._id,
			imageName: selectedImage?.name as string
		})


		setSelectedImage(null)

	} catch (err) {
		toast.error('Failed to send image')
	}finally{
		setIsLoading(false)
	}
   }
    
   const handleSendVideo = async()=>{
	setIsLoading(true)
	try {
		const postUrl = await generateUploadUrl();
		const result = await fetch(postUrl, {
			method: "POST",
			headers: {"Content-Type": selectedVideo!.type},
			body: selectedVideo
		})

		const { storageId } = await result.json();

		await sendVideo({
			conversation: selectedConversation!._id,
			videoId: storageId,
			sender: me!._id,
			videoName: selectedVideo?.name as string
		})

		setSelectedVideo(null)

	} catch (err) {
		toast.error('Failed to send video')
	}finally{
		setIsLoading(false)
	}
   }


     
   const handleSendFile = async()=>{
	setIsLoading(true)
	try {
		const postUrl = await generateUploadUrl();
		const result = await fetch(postUrl, {
			method: "POST",
			headers: {"Content-Type": selectedFile!.type},
			body: selectedFile
		})

		const { storageId } = await result.json();

		await sendFile({
			conversation: selectedConversation!._id,
			fileId: storageId,
			sender: me!._id,
			fileName: selectedFile?.name as string ,
			sendMessageType: selectedFile!.type as string
		})

		setSelectedFile(null)

	} catch (err) {
		toast.error('Failed to send file')
	}finally{
		setIsLoading(false)
	}
   }
   
    
  return (
    <>
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
	  {selectedImage && (
		<MediaImageDialog
		isOpen={selectedImage!==null}
		onClose={()=>setSelectedImage(null)}
		selectedImage={selectedImage}
		isLoading={isLoading}
		handleSendImage={handleSendImage}
		theme={theme!}
		/>
	  )}
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
		{selectedVideo && <MediaVideoDialog
		isOpen={selectedVideo!==null}
		onClose={()=>setSelectedVideo(null)}
		selectedVideo={selectedVideo}
		isLoading={isLoading}
		handleSendVideo={handleSendVideo}
		theme={theme!}
		/>}

        <input
        type="file"
        ref={fileInput}
        accept="pdf,doc,docx,xls,xlsx,txt,ppt,pptx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile(file);
          }
        }}
        hidden
        />

{selectedFile && <MediaFileDialog
		isOpen={selectedFile!==null}
		onClose={()=>setSelectedFile(null)}
		selectedFile={selectedFile}
		isLoading={isLoading}
		handleSendFile={handleSendFile}
		theme={theme!}
		/>}
        <DropdownMenu>
  <DropdownMenuTrigger asChild><Plus className="text-gray-600 dark:text-gray-400 cursor-pointer"/></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={()=> imageInput.current!.click()} className="cursor-pointer"><ImageIcon className="mr-1" size={18}/> Photo</DropdownMenuItem>
    <DropdownMenuItem className="cursor-pointer" onClick={()=> videoInput.current!.click()}><Video className="mr-1" size={20}/> Video</DropdownMenuItem>
    <DropdownMenuItem className="cursor-pointer" onClick={()=> fileInput.current!.click()}><File className="mr-1" size={18}/> Documents</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>


    </>
  )
}

export default MediaDropdown;


type MediaImageDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	selectedImage: File;
	isLoading: boolean;
	handleSendImage: () => void;
	theme: string
};

 const MediaImageDialog = ({ isOpen, onClose, selectedImage, isLoading, handleSendImage, theme }: MediaImageDialogProps) => {
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
			<DialogContent >
				<DialogTitle></DialogTitle>
				<DialogDescription  className='flex flex-col gap-10 justify-center items-center'>
					{renderedImage && <Image src={renderedImage} width={300} height={300} alt='selected image' />}
					<Button className='w-full' disabled={isLoading} onClick={handleSendImage}>
						{isLoading ? <BeatLoader color={theme === "dark" ? "silver" : "gray"}/> : "Send"}
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
	handleSendVideo: () => void;
	theme: string
};

 const MediaVideoDialog = ({ isOpen, onClose, selectedVideo, isLoading, handleSendVideo, theme }: MediaVideoDialogProps) => {
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
				<Button className='w-full' disabled={isLoading} onClick={handleSendVideo}>
				{isLoading ? <BeatLoader color={theme === "dark" ? "silver" : "gray"}/> : "Send"}
				</Button>
			</DialogContent>
		</Dialog>
	);
};



type MediaFileDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	selectedFile: File;
	isLoading: boolean;
	handleSendFile: () => void;
	theme: string
};

const MediaFileDialog = ({ isOpen, onClose, selectedFile, isLoading, handleSendFile , theme}: MediaFileDialogProps) => {
    const truncateFilename = (filename: string, maxLength: number) => {
		if (filename.length > maxLength) {
		  return `${filename.slice(0, maxLength - 3)}...`;
		}
		return filename;
	  };
	  
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<DialogContent >
				<DialogTitle></DialogTitle>
				<DialogDescription>File</DialogDescription>
				<div className='w-full'>
					<div className="flex items-center gap-4 ">
            <File size={20}/>  <span className="">{truncateFilename(selectedFile.name, 50)}</span>
          </div>
				</div>
				<Button className='w-full' disabled={isLoading} onClick={handleSendFile}>
				{isLoading ? <BeatLoader color={theme === "dark" ? "silver" : "gray"}/> : "Send"}
				</Button>
			</DialogContent>
		</Dialog>
	);
};
