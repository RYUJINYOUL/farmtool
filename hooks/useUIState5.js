import { create } from "zustand";

const useUIState5 = create((set) => ({
  homeCategory5: "장비및철거",
  headerImageSrc5:
    "",
  setHomeCategory5: (value) => set({ homeCategory5: value }),
  setheaderImageSrc5: (src) => set({ headerImageSrc5: src }),
}));

export default useUIState5;
