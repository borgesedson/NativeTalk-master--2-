import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthUser, logout as apiLogout } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos — evita refetch excessivo
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      await apiLogout();
      queryClient.setQueryData(["authUser"], null);
      window.location.href = "/login";
    } catch (e) {
      console.error('logout error', e);
    }
  };

  // getCurrentUser retorna o objeto merged direto (não wrappado em { user })
  const userData = authUser.data?.user || authUser.data;

  return { isLoading: authUser.isLoading, authUser: userData, logout };
};
export default useAuthUser;
