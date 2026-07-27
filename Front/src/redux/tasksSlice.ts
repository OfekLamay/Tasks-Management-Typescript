import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ITask {
  id: number;
  name: string;
  userRelated: string;
  description: string;
  isDone: boolean;
  teamNumber: number;
  isPrivate: boolean;
}

const initialState: ITask[] = [];

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks(_state, action: PayloadAction<ITask[]>) {
      return action.payload;
    },
    addTask(state, action: PayloadAction<ITask>) {
      state.push(action.payload);
    },
    removeTask(state, action: PayloadAction<number>) {
      return state.filter(task => task.id !== action.payload);
    },
    updateTask(state, action: PayloadAction<ITask>) {
      const idx = state.findIndex(task => task.id === action.payload.id);
      if (idx !== -1) state[idx] = action.payload;
    }
  }
});

export const { setTasks, addTask, removeTask, updateTask } = tasksSlice.actions;
export default tasksSlice.reducer;