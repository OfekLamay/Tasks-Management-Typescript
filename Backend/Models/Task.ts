import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    id: number;
    name: string;
    userRelated: string;
    description: string;
    isDone: boolean;
    teamNumber: number;
    isPrivate: boolean;
}

const taskSchema = new Schema<ITask>({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    userRelated: { type: String, required: true },
    description: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    teamNumber: { type: Number, required: true }, 
    isPrivate: { type: Boolean, default: false } 
});

export default mongoose.model<ITask>('Task', taskSchema);