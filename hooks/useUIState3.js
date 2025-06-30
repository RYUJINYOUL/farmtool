import { create } from "zustand";

const useUIState3 = create((set) => ({
  homeCategory3: "특수목",
  headerImageSrc3:
    "",
  setHomeCategory3: (value) => set({ homeCategory3: value }),
  setHeaderImageSrc3: (src) => set({ headerImageSrc3: src }),
}));

export default useUIState3;
