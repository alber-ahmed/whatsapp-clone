
import { create } from "zustand";


type TabStore = {
  selectedTab: "chats" | "status" | null
  setSelectedTab: (status: "chats" | "status" | null) => void;
};

export const useTabStore = create<TabStore>((set) => ({
    selectedTab: "chats",
    setSelectedTab: (tab) => set({selectedTab: tab}),
}));
