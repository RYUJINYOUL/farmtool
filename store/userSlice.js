import { createSlice, current } from "@reduxjs/toolkit";

const initialState = {
    currentUser: {
       uid: JSON.parse(localStorage.getItem('uid')) || '',
       photoURL: JSON.parse(localStorage.getItem("photoURL")) || '',
       displayName: JSON.parse(localStorage.getItem('displayName')) || '',
    }
}

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
        },
        clearUser: (state) => {
            state.currentUser = {};
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