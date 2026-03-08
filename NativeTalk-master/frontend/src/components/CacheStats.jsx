import { useQuery } from "@tanstack/react-query";
import { Database, TrendingUp, Zap } from "lucide-react";
import { insforge } from "../lib/insforge";

const CacheStats = () => {
  const { data: cacheData, isLoading } = useQuery({
    queryKey: ["cacheStats"],
    queryFn: async () => {
      try {
        const { data } = await insforge.functions.invoke("get_cache_stats");
        return data;
      } catch (e) {
        console.warn("Failed to fetch cache stats", e);
        return null;
      }
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white/5 h-24 rounded-2xl w-full" />
    );
  }

  const stats = cacheData?.stats;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Hit Rate */}
      <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Efficiency</span>
          <TrendingUp className="size-5 text-primary" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.hitRate}</div>
        <p className="text-[10px] text-gray-500 mt-1">{stats.hits} hits from {stats.total} total</p>
      </div>

      {/* Savings */}
      <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Savings</span>
          <Zap className="size-5 text-accent-coral" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.savings}</div>
        <p className="text-[10px] text-gray-500 mt-1">API calls preserved</p>
      </div>

      {/* Capacity */}
      <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Storage</span>
          <Database className="size-5 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.cacheSize}</div>
        <p className="text-[10px] text-gray-500 mt-1">Out of {stats.maxSize} limit</p>
      </div>
    </div>
  );
};

export default CacheStats;
