import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addGroupMembers } from "../lib/groupApi";
import { X, UserPlus, Search } from "lucide-react";
import toast from "react-hot-toast";
import useChatStore from "../store/useChatStore";

const AddMembersModal = ({ onClose, groupId, currentMemberIds }) => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { users, getUsers } = useChatStore(); // Assuming this holds potential contacts/friends
    const queryClient = useQueryClient();

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    // Filter users: Must matches search term AND NOT be already in the group
    const filteredUsers = users.filter((user) => {
        const isMember = currentMemberIds.includes(user.id);
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && !isMember;
    });

    const addMembersMutation = useMutation({
        mutationFn: ({ groupId, memberIds }) => addGroupMembers(groupId, memberIds),
        onSuccess: () => {
            toast.success("Members added successfully!");
            queryClient.invalidateQueries(["group", groupId]);
            onClose();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to add members");
        },
    });

    const handleAddMembers = () => {
        if (selectedUsers.length === 0) return;
        addMembersMutation.mutate({
            groupId,
            memberIds: selectedUsers.map((u) => u.id),
        });
    };

    const toggleUser = (user) => {
        if (selectedUsers.find((u) => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
        } else {
            const currentCount = currentMemberIds.length;
            if (currentCount + selectedUsers.length >= 20) {
                return toast.error("Group limit reached (20 members)");
            }
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-base-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-primary" />
                        Add Members
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            className="input input-bordered w-full pl-10 input-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* List */}
                    <div className="h-64 overflow-y-auto border border-base-300 rounded-lg bg-base-200/30">
                        {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-base-content/50">
                                <p>No new users found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-base-300">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user)}
                                        className={`
                           flex items-center gap-3 p-3 cursor-pointer transition-colors
                           ${selectedUsers.find(u => u.id === user.id)
                                                ? 'bg-primary/10 hover:bg-primary/20'
                                                : 'hover:bg-base-200'}
                         `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!selectedUsers.find(u => u.id === user.id)}
                                            readOnly
                                            className="checkbox checkbox-primary checkbox-sm"
                                        />
                                        <div className="avatar">
                                            <div className="w-8 h-8 rounded-full">
                                                <img src={user.avatar_url || "/avatar.png"} alt={user.name} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{user.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chips */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-sm">
                            {selectedUsers.map(u => (
                                <span key={u.id} className="badge badge-primary gap-1">
                                    {u.name.split(' ')[0]}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleUser(u)} />
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-base-300 bg-base-200/50 flex justify-end gap-2">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleAddMembers}
                        disabled={selectedUsers.length === 0 || addMembersMutation.isPending}
                    >
                        {addMembersMutation.isPending ? "Adding..." : "Add Selected"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMembersModal;
