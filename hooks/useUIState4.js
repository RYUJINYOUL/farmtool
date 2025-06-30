import { create } from "zustand";

const useUIState4 = create((set) => ({
  homeCategory4: "조경시설물",
  headerImageSrc4:
    "",
  setHomeCategory4: (value) => set({ homeCategory4: value }),
  setheaderImageSrc4: (src) => set({ headerImageSrc4: src }),
}));

export default useUIState4;
