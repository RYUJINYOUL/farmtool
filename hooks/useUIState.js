import { create } from "zustand";

const useUIState = create((set) => ({
  homeCategory: null,
  headerImageSrc:
    "/",
  setHomeCategory: (value) => set({ homeCategory: value }),
  setHeaderImageSrc: (src) => set({ headerImageSrc: src }),
}));

export default useUIState;
