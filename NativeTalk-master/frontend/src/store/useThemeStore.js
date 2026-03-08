import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("nativetalk-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("nativetalk-theme", theme);
    set({ theme });
  },
}));
