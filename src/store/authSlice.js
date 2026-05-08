import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('papertech_token') || null,
  user: JSON.parse(localStorage.getItem('papertech_user')) || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('papertech_token', action.payload.token);
      localStorage.setItem('papertech_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('papertech_token');
      localStorage.removeItem('papertech_user');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
