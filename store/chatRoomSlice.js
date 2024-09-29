import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentChatRoom: {
        createdBy: {
            image: '',
            name: ''
        },
        description: '',
        id: '',
        name: ''
    },
    isPrivateChatRoom: false,
    userPosts: null
}

export const chatRoomSlice = createSlice({
    name: 'chatRoom',
    initialState,
    reducers: {
        setCurrentChatRoom: (state, action) => {
            state.currentChatRoom = action.payload;
        },
        setPrivateChatRoom: (state, action) => {
            state.isPrivateChatRoom = action.payload;
        },
        setUserPosts: (state, action) => {
            state.userPosts = action.payload;
        }
    }
})

export const { setCurrentChatRoom, setPrivateChatRoom, setUserPosts } = chatRoomSlice.actions;

export default chatRoomSlice.reducer;