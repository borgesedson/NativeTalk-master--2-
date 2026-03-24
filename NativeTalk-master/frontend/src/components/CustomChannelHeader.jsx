import { useChannelStateContext } from "stream-chat-react";
import { useNavigate } from "react-router";
import { useCall } from "../contexts/CallManager";
import useAuthUser from "../hooks/useAuthUser";
import { getLanguageCode } from "../lib/utils";

const CustomChannelHeader = ({ handleVideoCall }) => {
  const { channel } = useChannelStateContext();
  const navigate = useNavigate();
  const { startCall } = useCall();
  const { authUser } = useAuthUser();
  const isTranslationReady = true; // Sempre pronto agora que é servidor

  const members = Object.values(channel.state.members || {});
  const otherMember = members.find(member => member.user_id !== channel._client.userID);

  const displayName = otherMember?.user?.name || "Usuário";
  const displayImage = otherMember?.user?.image || null;
  const isOnline = otherMember?.user?.online;
  const targetLang = getLanguageCode(authUser?.native_language || 'pt').toUpperCase();
  const sourceLang = getLanguageCode(otherMember?.user?.native_language || 'en').toUpperCase();

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-background-light dark:bg-background-dark sticky top-0 z-10 pt-[calc(12px+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <button
          onClick={() => navigate('/messages')}
          className="flex items-center justify-center min-w-[48px] min-h-[48px] hover:bg-slate-200 dark:hover:bg-primary/20 rounded-full transition-colors organic-press mr-1 touch-manipulation"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 transform scale-[1.2]">arrow_back</span>
        </button>

        <div className="relative shrink-0">
          <div className="size-10 rounded-full bg-primary/20 overflow-hidden border border-primary/30 flex items-center justify-center">
            {displayImage ? (
              <img
                className="w-full h-full object-cover"
                src={displayImage}
                alt={displayName}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className={`w-full h-full bg-primary flex items-center justify-center text-white font-bold text-lg ${displayImage ? 'hidden' : 'flex'}`}>
              {initials}
            </div>
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background-light dark:border-background-dark rounded-full"></div>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <h1 className="text-base font-bold leading-tight text-white whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</h1>
          <span className="text-xs text-[#2ECC71] mt-0.5 flex items-center gap-1.5 font-medium">
            {isOnline ? 'Online' : 'Offline'} • 🌐 {sourceLang}→{targetLang}
            {isTranslationReady && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[10px] font-bold animate-in fade-in zoom-in duration-500">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Privado
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center shrink-0">
        <button
          onClick={() => startCall(otherMember?.user_id, 'video')}
          className="min-w-[48px] min-h-[48px] text-white hover:bg-white/10 rounded-full transition-colors organic-press flex items-center justify-center touch-manipulation"
        >
          <span className="material-symbols-outlined text-[20px]">videocam</span>
        </button>
        <button
          onClick={() => startCall(otherMember?.user_id, 'voice')}
          className="min-w-[48px] min-h-[48px] text-white hover:bg-white/10 rounded-full transition-colors organic-press flex items-center justify-center touch-manipulation"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
        </button>
        <button
          className="min-w-[48px] min-h-[48px] text-white hover:bg-white/10 rounded-full transition-colors organic-press flex items-center justify-center touch-manipulation"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
    </header>
  );
};

export default CustomChannelHeader;
