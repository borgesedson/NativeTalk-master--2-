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

  const members = Object.values(channel.state.members || {});
  const otherMember = members.find(member => member.user_id !== channel._client.userID);

  const displayName = otherMember?.user?.name || "Usuário";
  const displayImage = otherMember?.user?.image || null;
  const isOnline = otherMember?.user?.online;
  const targetLang = getLanguageCode(authUser?.native_language || 'pt').toUpperCase();
  const sourceLang = getLanguageCode(otherMember?.user?.native_language || 'en').toUpperCase();

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/messages')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-primary/20 rounded-full transition-colors organic-press"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">arrow_back</span>
        </button>

        <div className="relative">
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

        <div className="flex flex-col">
          <h1 className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">{displayName}</h1>
          <span className="text-[10px] text-primary font-medium mt-1 bg-primary/10 px-2 py-0.5 rounded-full inline-block">
            🌐 Traduzindo {sourceLang}→{targetLang}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => startCall(otherMember?.user_id, 'video')}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-primary/20 rounded-full transition-colors organic-press"
        >
          <span className="material-symbols-outlined">videocam</span>
        </button>
        <button
          onClick={() => startCall(otherMember?.user_id, 'voice')}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-primary/20 rounded-full transition-colors organic-press"
        >
          <span className="material-symbols-outlined">call</span>
        </button>
      </div>
    </header>
  );
};

export default CustomChannelHeader;
