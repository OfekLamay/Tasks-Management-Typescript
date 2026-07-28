import express, { Request, Response } from 'express';
import Task from '../Models/Task';
import TasksHistory from '../Models/TasksHistory';
import User from '../Models/User';
import logger from '../logger';

const router = express.Router();

router.post('/tasks', async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        const userGroup = await User.findOne({ username }, { _id: 0, __v: 0, password: 0 });
        if (!userGroup) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const teamTasks = await Task.find({
            teamNumber: userGroup.teamNumber,
            $or: [
                { isPrivate: { $ne: true } }, 
                { isPrivate: true, userRelated: username }
            ]
        }, { _id: 0, __v: 0 });

        res.json(teamTasks);
    } catch (err: any) {
        logger.error({ message: 'Error in /tasks', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/tasks-history', async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        const userGroup = await User.findOne({ username }, { _id: 0, __v: 0, password: 0 });
        if (!userGroup) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const tasksHistory = await TasksHistory.find({
            teamNumber: userGroup.teamNumber,
            $or: [
                { isPrivate: { $ne: true } }, 
                { isPrivate: true, userRelated: username }
            ]
        }, { _id: 0, __v: 0 });

        res.json(tasksHistory);
    } catch (err: any) {
        logger.error({ message: 'Error in /tasks-history', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/user-tasks', async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        const userTasks = await Task.find({ userRelated: username }, { _id: 0, __v: 0 });
        res.json(userTasks);
    } catch (err: any) {
        logger.error({ message: 'Error in /user-tasks', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/add-task', async (req: Request, res: Response) => {
    const { tName, tDes, tUserRelated, tUserCreator, isPrivate } = req.body;

    const assignee = await User.findOne({ username: tUserRelated });
    const creator = await User.findOne({ username: tUserCreator });

    if (!tName || !assignee || !creator) {
        res.json({ isAdded: false, message: "Invalid data or user not found." });
        return;
    }

    let targetTeam: number;

    if (creator.role === 'admin') {
        targetTeam = assignee.teamNumber; 
    } else if (assignee.teamNumber === creator.teamNumber) {
        targetTeam = assignee.teamNumber; 
    } else {
        res.json({ isAdded: false, message: "You can only assign tasks to users from your teams." });
        return;
    }

    const tasksCount = await Task.countDocuments();
    const historyCount = await TasksHistory.countDocuments();
    const latestTaskID = tasksCount + historyCount + 1;

    const resTask = await Task.findOne({ name: tName, userRelated: tUserRelated, description: tDes, teamNumber: targetTeam });
    
    if (resTask) {
        res.json({ isAdded: false, message: "Task already exists for this user." });
        return;
    }

    await Task.create({
        id: latestTaskID,
        name: tName,
        userRelated: tUserRelated,
        description: tDes,
        isDone: false,
        teamNumber: targetTeam,
        isPrivate: isPrivate || false 
    });

    res.json({ isAdded: true, message: "Task added!" });
});

router.post('/end-task', async (req: Request, res: Response) => {
    const { tID, username } = req.body;
    const reqTask = await Task.findOne({ id: tID }, { _id: 0, __v: 0 });
    
    if(reqTask) {
        await TasksHistory.create({
            id: reqTask.id,
            name: reqTask.name,
            userRelated: reqTask.userRelated,
            description: reqTask.description,
            isDone: true,
            teamNumber: reqTask.teamNumber,
            isPrivate: reqTask.isPrivate 
        });
        await Task.deleteOne({ id: tID });

        res.json({ isDone: true, message: "Task finished! \nMoved to history." });
    } else {
        res.json({ isDone: false, message: "No task found" });
    }
});

export default router;