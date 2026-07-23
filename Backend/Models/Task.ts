const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    userRelated: { type: String, required: true },
    description: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    teamNumber: { type: Number, required: true }, 
    isPrivate: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Task', taskSchema);