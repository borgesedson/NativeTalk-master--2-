import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { haptics } from "../lib/haptics";
import useAuthUser from "../hooks/useAuthUser";

const CallFAB = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();

  const handleClick = () => {
    haptics.medium();
    // Navegar para a página de mensagens onde pode iniciar uma chamada
    navigate("/messages");
  };

  // Não mostrar em páginas de auth ou durante chamadas
  const pathname = window.location.pathname;
  const hideOnPages = ["/login", "/signup", "/onboarding", "/call"];
  
  if (!authUser || hideOnPages.some(page => pathname.includes(page))) {
    return null;
  }

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 btn btn-circle btn-lg bg-gradient-to-br from-primary to-secondary text-white shadow-2xl border-none hover:shadow-primary/50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <Phone className="w-6 h-6" />
    </motion.button>
  );
};

export default CallFAB;
