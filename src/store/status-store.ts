import { Id } from "../../convex/_generated/dataModel";
import { create } from "zustand";

export type Status = {
  _id: Id<"status">;
  _creationTime: number
  content: string;
  user: string;
  name: string
  statusType: string;
  backgroundColor: string ;
  textColor: string
};

type StatusStore = {
  selectedStatus: Status | null
  setSelectedStatus: (status: Status | null) => void;
};

export const useStatusStore = create<StatusStore>((set) => ({
    selectedStatus: null,
    setSelectedStatus: (status) => set({selectedStatus: status}),
}));
