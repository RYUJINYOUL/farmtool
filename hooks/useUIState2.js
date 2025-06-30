import { create } from "zustand";

const useUIState2 = create((set) => ({
  homeCategory2: "잔디심기",
  headerImageSrc2:
    "",
  setHomeCategory2: (value) => set({ homeCategory2: value }),
  setHeaderImageSrc2: (src) => set({ headerImageSrc2: src }),
}));

export default useUIState2;
