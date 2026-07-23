import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password?: string;
    email?: string;
    googleId?: string;
    teams: number[];
    role: 'admin' | 'manager' | 'user';
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String }, 
    email: { type: String, unique: true, sparse: true }, 
    googleId: { type: String, unique: true, sparse: true }, 
    teams: { type: [Number], default: [] }, 
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' }
});

export default mongoose.model<IUser>('User', userSchema);