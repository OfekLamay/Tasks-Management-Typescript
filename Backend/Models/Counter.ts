import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
    id: string; 
    seq: number;
}

const counterSchema = new Schema<ICounter>({
    id: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model<ICounter>('Counter', counterSchema);
export default Counter;