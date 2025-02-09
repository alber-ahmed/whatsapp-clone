"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatPlaceHolder from "@/components/home/chat-placeholder";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useStatusStore } from "@/store/status-store";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "@/lib/utils";
import { LogOut, X } from "lucide-react";
import StatusDisplayer from "./status-displayer";

const StatusPanel = () => {
  const { selectedStatus, setSelectedStatus } =
    useStatusStore();
    
    const {isLoading} = useConvexAuth()

    const users = useQuery(api.users.getUsers)
    const me = useQuery(api.users.getMe)
    const removeStatus = useMutation(api.status.removeStatus)
    
    if(isLoading)return null
  if (!selectedStatus) return <ChatPlaceHolder />;
  
  const statusName =  selectedStatus.user === me!._id ? "My Status" : selectedStatus.name;

    const currentUser = users?.filter((user)=>user._id === selectedStatus.user)
  const userImage = currentUser?.[0]?.image;
    
  return (
    <>
  

     <div className="w-3/4 flex flex-col">
      <div className="w-full sticky top-0 z-50">
        {/* Header */}
        <div className="flex justify-between bg-gray-primary p-3">
          <div className="flex gap-3 items-center">
            <Avatar>
              <AvatarImage
                src={userImage || "/placeholder.png"}
                className="object-cover"
              />
              <AvatarFallback>
                <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p>{statusName}</p>
              <p className="text-gray-600 text-xs dark:text-gray-400">{formatDate( selectedStatus._creationTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-7 mr-5">
            {selectedStatus.user === me?._id && <LogOut size={18} className="text-red-500 cursor-pointer" onClick={async()=>{await removeStatus({user: me._id}); setSelectedStatus(null)}}/>}
            <X
              size={16}
              className="cursor-pointer"
              onClick={() => setSelectedStatus(null)}
            />
          </div>
        </div>
      </div>
     {selectedStatus && <StatusDisplayer />}
    </div>
    </>
  );
};
export default StatusPanel;
