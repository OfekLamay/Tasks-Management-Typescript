const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String }, 
    email: { type: String, unique: true, sparse: true }, 
    googleId: { type: String, unique: true, sparse: true }, 
    teams: { type: [Number], default: [] }, 
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' }
});

module.exports = mongoose.model('User', userSchema);