import { createSlice, current } from "@reduxjs/toolkit";
import { getSafeLocalStorage } from '../utils/localStorage';

const initialState = {
    currentUser: {
        uid: getSafeLocalStorage('uid'),
        photoURL: getSafeLocalStorage("photoURL"),
        displayName: getSafeLocalStorage('displayName'),
    }
}

// const initialState = {
//   currentUser: {
//     uid: '',
//     photoURL: '',
//     displayName: '',
//   },
// };


export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.currentUser.uid = action.payload.uid;
            state.currentUser.photoURL = action.payload.photoURL;
            state.currentUser.displayName = action.payload.displayName;


            let uid = JSON.stringify(state.currentUser.uid);
            let photoURL = JSON.stringify(state.currentUser.photoURL);
            let displayName = JSON.stringify(state.currentUser.displayName);

            localStorage.setItem("uid", uid);
            localStorage.setItem("photoURL", photoURL);
            localStorage.setItem("displayName", displayName);


            // localStorage.setItem("uid", action.payload.uid);
            // localStorage.setItem("photoURL", action.payload.photoURL || '');
            // localStorage.setItem("displayName", action.payload.displayName || '');
        },
        clearUser: (state) => {
            state.currentUser = {
                uid: '',
                photoURL: '',
                displayName: '',
            };
            if (typeof window !== 'undefined') {
                localStorage.removeItem("uid");
                localStorage.removeItem("photoURL");
                localStorage.removeItem("displayName");
            }
        },
        setPhotoUrl: (state, action) => {
            state.currentUser = {
                ...state.currentUser,   //전부 나열하고
                photoURL: action.payload   //photoURL만 바꿔준다 오버라이드
            }
        }
    }
})

export const { setUser, clearUser, setPhotoUrl } = userSlice.actions;   //구조분해할당

export default userSlice.reducer;