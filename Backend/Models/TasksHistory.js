const mongoose = require('mongoose');

const tasksHistorySchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    userRelated: { type: String, required: true },
    description: { type: String },
    isDone: { type: Boolean, default: true },
    teamNumber: { type: Number, required: true },
    isPrivate: { type: Boolean, default: false } 
});

module.exports = mongoose.model('TasksHistory', tasksHistorySchema);