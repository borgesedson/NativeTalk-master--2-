import{j as e}from"./vendor-utils-C2PX-ifD.js";import"./vendor-react-BEMKmtuf.js";const g=({user:t,size:i="md",className:n="",showOnlineStatus:r=!1})=>{const l={xs:"size-8 text-[10px]",sm:"size-12 text-xs",md:"size-16 text-sm",lg:"size-20 text-base",xl:"size-24 text-lg"},o={xs:"ring-2",sm:"ring-2",md:"ring-4",lg:"ring-4",xl:"ring-4"},s=a=>a?a.split(" ").map(d=>d.charAt(0)).join("").toUpperCase().slice(0,1):"?";return e.jsxs("div",{className:`relative shrink-0 ${n}`,children:[e.jsxs("div",{className:`
        ${l[i]||"size-16"} 
        rounded-[1.2rem]
        ${i==="lg"||i==="xl"?"rounded-[1.8rem]":"rounded-[1.2rem]"}
        flex 
        items-center 
        justify-center 
        font-black 
        text-white 
        bg-white/5
        ring-inset ${o[i]||"ring-2"} ring-primary/20
        shadow-inner
        overflow-hidden
        relative
      `,children:[t!=null&&t.avatar_url||t!=null&&t.avatar?e.jsx("img",{src:t.avatar_url||t.avatar,alt:t.name||"Avatar",className:"w-full h-full object-cover transition-transform hover:scale-110 duration-500",onError:a=>{a.target.style.display="none",a.target.nextSibling&&(a.target.nextSibling.style.display="flex")}}):null,e.jsx("span",{className:`
            w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20
            ${t!=null&&t.avatar_url||t!=null&&t.avatar?"hidden":"flex"}
          `,children:s(t==null?void 0:t.name)}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"})]}),r&&e.jsx("div",{className:`
          absolute -bottom-1 -right-1 bg-green-500 rounded-full border-[3px] border-[#0a0a0a] shadow-lg
          ${i==="xs"?"size-3 border-2":"size-4"}
        `})]})};export{g as A};
