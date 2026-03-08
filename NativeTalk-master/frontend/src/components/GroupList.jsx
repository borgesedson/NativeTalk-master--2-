import { useQuery } from "@tanstack/react-query";
import { getUserGroups } from "../lib/groupApi";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router";

const GroupList = () => {
    const navigate = useNavigate();

    const { data: groups, isLoading, isError } = useQuery({
        queryKey: ["groups"],
        queryFn: getUserGroups,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4">
                <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-4 text-error text-sm">
                <p>Failed to load groups.</p>
            </div>
        );
    }

    return (
        <div>
            {groups?.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-base-content/50 gap-2 p-6">
                    <Users className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No groups yet</p>
                </div>
            ) : (
                <div className="divide-y divide-base-300">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            onClick={() => navigate(`/groups/${group.id}`)}
                            className="flex items-center gap-3 p-4 hover:bg-base-200 cursor-pointer transition-colors"
                        >
                            <div className="avatar">
                                <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                                    <img src={group.avatar} alt={group.name} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold truncate">{group.name}</h3>
                                    {group.updatedAt && (
                                        <span className="text-xs text-base-content/50 whitespace-nowrap ml-2">
                                            {format(new Date(group.updatedAt), "MMM d")}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-base-content/60 truncate flex items-center gap-1">
                                    {group.description || `${group.members.length} members`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupList;
