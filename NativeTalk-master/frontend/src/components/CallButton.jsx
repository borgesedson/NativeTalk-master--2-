import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <button 
      onClick={handleVideoCall} 
      className="btn btn-success btn-sm md:btn-md text-white touch-manipulation shadow-lg hover:shadow-xl transition-all min-w-[44px] min-h-[44px] flex-shrink-0"
      aria-label="Iniciar videochamada"
    >
      <VideoIcon className="size-5 md:size-6" />
      <span className="hidden lg:inline">Videochamada</span>
    </button>
  );
}

export default CallButton;
