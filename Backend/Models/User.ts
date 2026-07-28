import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password?: string;
    email?: string;
    googleId?: string;
    teamNumber: number;
    role: 'admin' | 'manager' | 'user' | 'guest';
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String }, 
    email: { type: String, unique: true, sparse: true }, 
    googleId: { type: String, unique: true, sparse: true }, 
    teamNumber: { type: Number, default: -1 },
    role: { type: String, enum: ['admin', 'manager', 'user', 'guest'], default: 'user' }
});

export default mongoose.model<IUser>('User', userSchema);