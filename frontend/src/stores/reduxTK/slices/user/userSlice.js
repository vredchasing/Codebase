import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,     // { userId, name, email, roles, ... }
  accessToken: null,  // short‑lived access token (optional)
  isLoggedIn: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo(state, action) {
      state.userInfo = action.payload.userInfo;
      state.accessToken = action.payload.accessToken || null;
      state.isLoggedIn = true;
    },
    clearUserInfo(state) {
      state.userInfo = null;
      state.accessToken = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setUserInfo, clearUserInfo } = userSlice.actions;
export default userSlice.reducer;
