import{j as t}from"./vendor-utils-C2PX-ifD.js";import{u as q,i as G,r as u}from"./vendor-react-BEMKmtuf.js";import{i as J,b as B,g as I,a as Q,e as X,t as F,h as Z,j as tt,f as et}from"./index-DO_ecmFU.js";import{u as at,S as nt,C as rt,a as st,W as it,M as ot,b as ct,T as lt}from"./vendor-stream-DKHooGsh.js";import{C as dt,a as pt,s as ut}from"./NotificationManager-C-LusEuQ.js";import{A as mt}from"./AudioRecorder-U3x7XaN8.js";import"./vendor-i18n-eri4N7dV.js";const gt=({handleVideoCall:R})=>{var C,S,v,j;const{channel:f}=at(),M=q(),{startCall:l}=J(),{authUser:N}=B(),n=Object.values(f.state.members||{}).find(x=>x.user_id!==f._client.userID),k=((C=n==null?void 0:n.user)==null?void 0:C.name)||"Usuário",y=((S=n==null?void 0:n.user)==null?void 0:S.image)||null,z=(v=n==null?void 0:n.user)==null?void 0:v.online,O=I((N==null?void 0:N.native_language)||"pt").toUpperCase(),D=I(((j=n==null?void 0:n.user)==null?void 0:j.native_language)||"en").toUpperCase(),P=k.charAt(0).toUpperCase();return t.jsxs("header",{className:"flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-background-light dark:bg-background-dark sticky top-0 z-10 pt-[calc(12px+env(safe-area-inset-top))]",children:[t.jsxs("div",{className:"flex items-center gap-2 overflow-hidden flex-1",children:[t.jsx("button",{onClick:()=>M("/messages"),className:"flex items-center justify-center min-w-[48px] min-h-[48px] hover:bg-slate-200 dark:hover:bg-primary/20 rounded-full transition-colors organic-press mr-1 touch-manipulation",children:t.jsx("span",{className:"material-symbols-outlined text-slate-700 dark:text-slate-300 transform scale-[1.2]",children:"arrow_back"})}),t.jsxs("div",{className:"relative shrink-0",children:[t.jsxs("div",{className:"size-10 rounded-full bg-primary/20 overflow-hidden border border-primary/30 flex items-center justify-center",children:[y?t.jsx("img",{className:"w-full h-full object-cover",src:y,alt:k,onError:x=>{x.target.style.display="none",x.target.nextSibling.style.display="flex"}}):null,t.jsx("div",{className:`w-full h-full bg-primary flex items-center justify-center text-white font-bold text-lg ${y?"hidden":"flex"}`,children:P})]}),z&&t.jsx("div",{className:"absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background-light dark:border-background-dark rounded-full"})]}),t.jsxs("div",{className:"flex flex-col flex-1 min-w-0 pr-2",children:[t.jsx("h1",{className:"text-base font-bold leading-tight text-white whitespace-nowrap overflow-hidden text-ellipsis",children:k}),t.jsxs("span",{className:"text-xs text-[#2ECC71] mt-0.5 flex items-center gap-1.5 font-medium",children:[z?"Online":"Offline"," • 🌐 ",D,"→",O,t.jsxs("span",{className:"flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[10px] font-bold animate-in fade-in zoom-in duration-500",children:[t.jsx("span",{className:"material-symbols-outlined text-[12px]",children:"lock"}),"Privado"]})]})]})]}),t.jsxs("div",{className:"flex items-center shrink-0",children:[t.jsx("button",{onClick:()=>l(n==null?void 0:n.user_id,"video"),className:"min-w-[48px] min-h-[48px] text-white hover:bg-white/10 rounded-full transition-colors organic-press flex items-center justify-center touch-manipulation",children:t.jsx("span",{className:"material-symbols-outlined text-[20px]",children:"videocam"})}),t.jsx("button",{onClick:()=>l(n==null?void 0:n.user_id,"voice"),className:"min-w-[48px] min-h-[48px] text-white hover:bg-white/10 rounded-full transition-colors organic-press flex items-center justify-center touch-manipulation",children:t.jsx("span",{className:"material-symbols-outlined text-[20px]",children:"call"})}),t.jsx("button",{className:"min-w-[48px] min-h-[48px] text-white hover:bg-white/10 rounded-full transition-colors organic-press flex items-center justify-center touch-manipulation",children:t.jsx("span",{className:"material-symbols-outlined text-[20px]",children:"more_vert"})})]})]})},ht="qqq782vgbvwx",jt=()=>{const{id:R}=G(),f=R==null?void 0:R.trim(),M=q(),[l,N]=u.useState(null),[w,n]=u.useState(null),[k,y]=u.useState(!0),[z,O]=u.useState(!1),[D,P]=u.useState({}),[C,S]=u.useState(null),v=u.useRef(new Set),j=u.useRef(!1),x=u.useRef({}),{encryptMessageForUser:Y}=Q(),H=u.useRef(null);H.current||(H.current=nt.getInstance(ht));const K=a=>{var h;return(a==null?void 0:a.id)||`${a==null?void 0:a.created_at}-${(h=a==null?void 0:a.user)==null?void 0:h.id}`},{authUser:e}=B(),{data:g}=X({queryKey:["streamToken",e==null?void 0:e.id],queryFn:et,enabled:!!(e!=null&&e.id),staleTime:20*60*1e3,refetchOnWindowFocus:!1});u.useEffect(()=>{l!=null&&l.userID&&l.userID===(e==null?void 0:e.id)?O(!0):O(!1)},[l==null?void 0:l.userID,e==null?void 0:e.id]),u.useEffect(()=>{if(!(g!=null&&g.token)||!e||j.current)return;let a=null;async function h(){try{const d=H.current;if(!g.token||typeof g.token!="string"){console.error("[Stream] Invalid token in ChatPage:",g.token);return}await d.connectUser({id:e.id,name:e.name,image:Z(e.avatar_url,e.name)},g.token);const s=d.channel("messaging",{members:[e.id,f]});await s.watch({limit:20}),N(d),n(s),j.current=!0;const p=async r=>{var L;if(!r||!r.text||r.isE2E||((L=r.user)==null?void 0:L.id)===e.id)return;const c=I(e.native_language||"pt"),m=I(r.originalLanguage||"en");if(m===c)return;const b=K(r),A=`${b}-${c}`;if(x.current[A]){P(_=>({..._,[b]:x.current[A]}));return}if(!v.current.has(b)&&!D[b]){v.current.add(b);try{const _=await F(r.text,r.user.id,c,m);_&&_.translatedText&&(x.current[A]=_,P(V=>({...V,[b]:_})))}catch(_){console.error("Translation error:",_)}finally{v.current.delete(b)}}},i=async r=>{var c,m;const o=r.message;o&&(r.type==="message.new"&&((c=o.user)==null?void 0:c.id)!==e.id&&!document.hasFocus()&&ut(o.user.name||"Nova Mensagem",{body:o.isE2E?"Mensagem criptografada":((m=o.text)==null?void 0:m.substring(0,100))||"Arquivo recebido",icon:o.user.image||"/avatar.png",tag:`message-${o.id}`}),await p(o))};s.on("message.new",i);const T=(s.state.messages||[]).slice(-10),$={run:async r=>{const o=r.filter(c=>{var m;return((m=c.user)==null?void 0:m.id)!==e.id}).map(c=>p(c));await Promise.allSettled(o)}};$.run(T),d.on("message.read",r=>{}),s.on("message.read",()=>{const r=s.state.messages||[],o=I(e.native_language||"pt"),c=r.filter(m=>{var L;const A=`${K(m)}-${o}`;return((L=m.user)==null?void 0:L.id)!==e.id&&!x.current[A]});c.length>0&&$.run(c.slice(-10))}),a=()=>{s.off("message.new",i),s.off("message.read");try{d.disconnectUser()}catch{}j.current=!1}}catch(d){console.error("[Stream] initChat error:",d),S(`Falha ao conectar ao chat: ${d.message||"Erro desconhecido"}`)}finally{y(!1)}}return f?h():(S("ID do usuário alvo não fornecido na URL."),y(!1)),()=>{a&&a()}},[g==null?void 0:g.token,e,f]);const W=()=>{w&&M(`/call/${w.id}`)},U=async(a,h,d)=>{if(!w)return;const s=toast.loading("🔄 Transcrevendo...",{id:"audio-flow"});try{const{url:p}=await uploadAudio(a);if(!p)throw new Error("Erro ao fazer upload do áudio");const i=await tt(p,"en",(e==null?void 0:e.native_language)||"pt"),E=(i==null?void 0:i.originalTranscription)||"",T=(i==null?void 0:i.translatedTranscription)||"";if(!E)throw new Error("Não foi possível processar o áudio");toast.loading("🌐 Traduzindo...",{id:s}),await new Promise($=>setTimeout($,400)),await w.sendMessage({text:E,originalLanguage:(e==null?void 0:e.native_language)||"pt",attachments:[{type:"audio",asset_url:p,title:"Áudio",duration:d,transcription:E,translation:T}]}),toast.success("✅ Enviado!",{id:s})}catch(p){console.error("Audio flow error:",p),toast.error(p.message||"Erro ao processar áudio",{id:s})}};return C?t.jsxs("div",{className:"flex flex-col items-center justify-center h-screen bg-[#0D2137] text-white p-6 text-center",children:[t.jsx("span",{className:"material-symbols-outlined text-[64px] text-red-500 mb-4",children:"error"}),t.jsx("h2",{className:"text-xl font-bold mb-2",children:"Ops! Algo deu errado"}),t.jsx("p",{className:"text-slate-400 mb-6 max-w-xs",children:C}),t.jsxs("div",{className:"flex gap-4",children:[t.jsx("button",{onClick:()=>M(-1),className:"px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors",children:"Voltar"}),t.jsx("button",{onClick:()=>window.location.reload(),className:"px-6 py-2 rounded-full bg-primary hover:bg-primary-focus font-bold",children:"Tentar Novamente"})]})]}):k||!l||!w?t.jsx(dt,{}):t.jsxs("div",{className:"flex flex-col h-[100dvh] w-full bg-[#0D2137]",children:[t.jsx(rt,{client:l,theme:"str-chat__theme-dark",children:t.jsxs(st,{channel:w,children:[t.jsxs(it,{children:[t.jsx(gt,{handleVideoCall:W}),t.jsx("div",{className:"wa-message-list-wrapper",children:t.jsx(ot,{Message:a=>t.jsx(pt,{...a,translations:D,buildMsgKey:K})})}),t.jsxs("div",{className:"wa-message-input-wrapper",children:[t.jsx(mt,{onSendAudio:U}),t.jsx("div",{className:"wa-input-container",children:t.jsx(ct,{overrideSubmitHandler:async a=>{var s,p;const h=((s=a==null?void 0:a.text)==null?void 0:s.trim())||"";if(!h&&!((p=a.attachments)!=null&&p.length))return;const d=(e==null?void 0:e.native_language)||"pt";if(h){toast.loading("Criptografando...",{id:"e2e-toast"});try{const i=await F(h,f),E=JSON.stringify({original:h,translated:i.translatedText,targetLanguage:i.targetLanguage,sourceLanguage:i.sourceLanguage}),T=await Y(f,E);await w.sendMessage({text:T,isE2E:!0,originalLanguage:d}),toast.success("Mensagem Segura",{id:"e2e-toast",duration:1500})}catch(i){toast.error(i.message||"Erro E2E",{id:"e2e-toast"})}}}})})]})]}),t.jsx(lt,{})]})}),t.jsx("style",{dangerouslySetInnerHTML:{__html:`
        .wa-chat-main-container .str-chat {
          --str-chat__primary-color: #0c7379;
          --str-chat__active-primary-color: #09595d;
          --str-chat__background-color: transparent;
          background: transparent !important;
          height: 100% !important;
        }

        .wa-chat-main-container .str-chat__main-panel {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          overflow: hidden !important;
        }

        /* Hide default header */
        .wa-chat-main-container .str-chat__channel-header {
          display: none !important;
        }

        /* ===== MESSAGE LIST ===== */
        .wa-chat-main-container .str-chat__list,
        .wa-chat-main-container .str-chat-channel {
          background: transparent !important;
        }

        .wa-chat-container .str-chat__list {
          padding: 16px 0 !important;
        }

        .wa-chat-container .str-chat__li {
          margin-bottom: 0 !important;
        }

        /* ===== HIDE DEFAULT BUBBLES (we use CustomMessage) ===== */
        .wa-chat-container .str-chat__message-bubble {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        /* ===== DATE SEPARATOR ===== */
        .wa-chat-container .str-chat__date-separator {
          padding: 16px 0 !important;
        }
        .wa-chat-container .str-chat__date-separator-date {
          background: rgba(12, 115, 121, 0.05) !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 4px 12px !important;
          border-radius: 9999px !important;
          box-shadow: none !important;
        }
        .wa-chat-container .str-chat__date-separator-line {
          display: none !important;
        }

        /* ===== INPUT WRAPPER ===== */
        .wa-message-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          background-color: #112021;
          border-top: 1px solid rgba(12, 115, 121, 0.2);
        }

        .wa-input-container {
          flex: 1;
        }

        .wa-input-wrapper .str-chat__message-input,
        .wa-input-wrapper .str-chat__input-flat {
          background: #1E2A3A !important;
          border: 1px solid rgba(12, 115, 121, 0.1) !important;
          border-radius: 9999px !important;
          min-height: 44px !important;
          overflow: hidden !important;
          transition: all 0.2s;
        }

        .wa-input-wrapper .str-chat__message-input:focus-within {
          border-color: rgba(12, 115, 121, 0.4) !important;
        }

        .wa-input-wrapper .str-chat__textarea textarea,
        .wa-input-wrapper .str-chat__message-textarea {
          background: transparent !important;
          color: #f1f5f9 !important;
          font-size: 14px !important;
          padding: 12px 16px !important;
          line-height: 20px !important;
        }

        .wa-input-wrapper .str-chat__textarea textarea::placeholder {
          color: #64748b !important;
        }

        /* Send button */
        .wa-input-wrapper .str-chat__send-button {
          background: #0D7377 !important;
          border-radius: 50% !important;
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 4px 6px 4px 0 !important;
          padding: 0 !important;
          box-shadow: 0 4px 14px -2px rgba(12, 115, 121, 0.3) !important;
          transition: all 0.2s !important;
        }
        .wa-input-wrapper .str-chat__send-button:hover {
          background: #0a5a5e !important;
          transform: scale(0.95);
        }
        .wa-input-wrapper .str-chat__send-button svg {
          fill: #fff !important;
          width: 16px !important;
          height: 16px !important;
        }

        /* Attachment buttons */
        .wa-input-wrapper .str-chat__input-flat-emojiselect,
        .wa-input-wrapper .str-chat__fileupload-wrapper {
          color: #64748b !important;
          transition: color 0.2s;
        }
        .wa-input-wrapper .str-chat__input-flat-emojiselect:hover,
        .wa-input-wrapper .str-chat__fileupload-wrapper:hover {
          color: #0c7379 !important;
        }

        /* ===== SCROLLBAR ===== */
        .wa-chat-container .str-chat__list::-webkit-scrollbar {
          display: none; /* Match scrollbar-hide in design */
        }
        .wa-chat-container .str-chat__list {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* ===== HIDE UNNECESSARY ELEMENTS ===== */
        .wa-chat-container .str-chat__message-simple-status,
        .wa-chat-container .str-chat__message-simple__actions,
        .wa-chat-container .str-chat__message-simple__actions__container,
        .wa-chat-container .str-chat__message-replies-count-button,
        .wa-chat-container .str-chat__message-sender-avatar {
          display: none !important;
        }

        /* ===== THREAD ===== */
        .wa-chat-container .str-chat__thread {
          background: #112021 !important;
          border-left: 1px solid rgba(12, 115, 121, 0.2) !important;
        }

        /* ===== EMPTY STATE ===== */
        .wa-chat-container .str-chat__empty-channel {
          color: #64748b !important;
          background: transparent !important;
        }

        /* ===== REACTIONS ===== */
        .wa-chat-container .str-chat__message-actions-box,
        .wa-chat-container .str-chat__reaction-selector {
          background: #1E2A3A !important;
          border: 1px solid rgba(12, 115, 121, 0.1) !important;
          border-radius: 12px !important;
        }

        /* ===== TYPING INDICATOR ===== */
        .wa-chat-container .str-chat__typing-indicator {
          color: #64748b !important;
          padding: 4px 16px !important;
          font-size: 12px !important;
          font-style: italic !important;
        }

        /* ===== MOBILE ONLY: HIDE SIDEBAR ===== */
        @media (max-width: 768px) {
          .str-chat__channel-list {
            display: none !important;
          }
        }
      `}})]})};export{jt as default};
