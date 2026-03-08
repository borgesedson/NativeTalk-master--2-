import { create } from "zustand";
import { toast } from "react-hot-toast";
import { getUserFriends } from "../lib/api";

const useChatStore = create((set, get) => ({
    users: [],
    isUsersLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const friends = await getUserFriends();
            set({ users: friends });
        } catch (error) {
            console.error("Error fetching friends:", error);
            toast.error(error.response?.data?.message || "Failed to fetch friends");
        } finally {
            set({ isUsersLoading: false });
        }
    },
}));

export default useChatStore;
