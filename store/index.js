import { configureStore } from "@reduxjs/toolkit";
import useReducer from "./userSlice";
import chatRoomReducer from "./chatRoomSlice"


export const store = configureStore({
    reducer: {
        user: useReducer,
        chatRoom: chatRoomReducer
    }
});

