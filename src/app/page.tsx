"use client"

import LeftPanel from "@/components/home/left-panel";
import RightPanel from "@/components/home/right-panel";
import StatusPanel from "@/components/home/status-panel";
import { useTabStore } from "@/store/tab-store";
import { useUser } from "@clerk/nextjs";
import { BarLoader } from "react-spinners";

export default function Home() {

	const {selectedTab} = useTabStore()

	const {isSignedIn, isLoaded} = useUser()
	
	if(!isSignedIn && isLoaded){
		window.location.replace("https://fair-swan-6.accounts.dev/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3000%2F")
	}
	if(!isLoaded){
		return <BarLoader width={"100%"} className="bg-green-primary"/>
	}
	return (
		<main className='sm:m-5'>
	<div className='flex overflow-y-hidden sm:h-[calc(100vh-50px)] h-[100vh] max-w-[1700px] mx-auto bg-left-panel'>
		{/* Green background decorator for Light Mode */}
		<div className='fixed top-0 left-0 w-full h-36 bg-green-primary dark:bg-transparent -z-30' />
		<LeftPanel />
		{selectedTab === "chats" ? <RightPanel /> : <StatusPanel/>}
	</div>
</main>
	);
}