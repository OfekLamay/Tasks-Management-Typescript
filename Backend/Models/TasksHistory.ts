import mongoose, { Schema, Document } from 'mongoose';

export interface ITasksHistory extends Document {
    id: number;
    name: string;
    userRelated: string;
    description: string;
    isDone: boolean;
    teamNumber: number;
    isPrivate: boolean;
}

const tasksHistorySchema = new Schema<ITasksHistory>({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    userRelated: { type: String, required: true },
    description: { type: String, required: true },
    isDone: { type: Boolean, default: true },
    teamNumber: { type: Number, required: true },
    isPrivate: { type: Boolean, default: false } 
});

export default mongoose.model<ITasksHistory>('TasksHistory', tasksHistorySchema);