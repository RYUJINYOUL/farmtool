import { create } from "zustand"

const useUIState = create((set)=>({
    homeCategory: "",
    headerImageSrc:
       "https://www.redwoodhikes.com/JedSmith/JedSmith1.jpg",
       setHomeCategory: (value) => set({ homeCategory: value }),
       setHeaderImageSrc: (src) => set({ headerImageSrc: src }),
}));

export default useUIState;