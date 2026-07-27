import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IUser {
  username: string;
  role: 'admin' | 'manager' | 'user' | 'guest';
  teamNumber: number | null;
}

const initialState: IUser = {
  username: 'NotLoggedIn',
  role: 'guest',
  teamNumber: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ username: string; role?: 'admin' | 'manager' | 'user' | 'guest'; teamNumber?: number }>) {
      const { username, role, teamNumber } = action.payload;
      state.username = username;
      state.role = role || 'user';
      state.teamNumber = teamNumber ?? null;
    },
    logout(state) {
      state.username = 'NotLoggedIn';
      state.role = 'guest';
      state.teamNumber = null;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;