
import { type Status, useStatusStore } from "@/store/status-store";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { ImageIcon, Video } from "lucide-react";

const Status = ({ status, isMine }: { status: Status, isMine?: boolean }) => {
  const users = useQuery(api.users.getUsers, {
    searchUser: ""
  });
  const currentUser = users?.filter((user) => status?.user === user?._id);
  const { selectedStatus, setSelectedStatus } = useStatusStore();

  const activeBgClass = selectedStatus?._id === status?._id;

  function limitString(inputString: string) {
    const firstWord = inputString.split(" ")[0];

    let results;
    if (firstWord.length > 6) {
      for (let index = 0; index <= 8; index++) {
        if (index === 8) {
          results = inputString.split(inputString[index])[0] + "..";
        }
      }
    } else {
      const words = inputString.split(" ");
      if (words.length > 3) {
        results = words.slice(0, 3).join(" ") + "..";
      }
      else{
        results = inputString
      }
    }
    return results;
  }

  const statusBg = status!.backgroundColor;
  return (
    <>
      <div
        className={`flex gap-2 items-center p-2 hover:bg-chat-hover cursor-pointer ${activeBgClass ? "bg-chat-hover" : ""}`}
        onClick={() => setSelectedStatus(status) }
      >
        <div>
          {status?.statusType === "text" && statusBg && (
            <div
              className={`${statusBg}  w-12 h-12 rounded-full text-[8px] flex items-center border-[4px]`}
            >
              <p className={`text-center ${status!.textColor}`}>
                {limitString(status?.content)}
              </p>
            </div>
          )}
          {status?.statusType === "image" && (
            <div className="w-12 h-12 rounded-full text-[8px] flex items-end justify-center border-[4px] relative">
              {status?.content !== "" || null ? <Image
                src={status?.content?.split("`")[0] || "/placeholder.png"}
                alt="Status Content"
                layout="fill"
                objectFit="cover"
                className="rounded-full"
              /> : <ImageIcon size={20}/>}
            </div>
          )}
          {status?.statusType === "video" && (
            <div className="w-12 h-12 rounded-full text-[8px] flex items-end justify-center  overflow-hidden border-[4px] relative ">
              {status!.content?.split("`")[0] !== null || "" ? <video
                src={status?.content?.split("`")[0]}
                className="h-full w-full object-cover"
              />: <Video size={20}/>}
            </div>
          )}
        </div>
        <div className="w-full" >
          <div className="flex items-center">
            <h3 className="text-xs lg:text-sm font-medium">
              {isMine ? "My Status":currentUser?.[0]?.name}
            </h3>
          </div>
          <span className="text-[10px] lg:text-xs text-gray-500 ml-auto">
              {formatDate(status?._creationTime)}
            </span>
        </div>
      </div>
      <hr className="h-[1px] mx-10 bg-gray-primary" />
    </>
  );
};

export default Status;
