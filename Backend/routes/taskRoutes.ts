import express, { Request, Response } from 'express';
import Task from '../Models/Task';
import TasksHistory from '../Models/TasksHistory';
import User from '../Models/User';
import Counter from '../Models/Counter';
import logger from '../logger';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(verifyToken);

const TASKS_LIMIT = 5;


router.get('/tasks', async (req: AuthRequest, res: Response) => {
    try {
        const username = req.user?.username;
        const teamNumber = req.user?.teamNumber;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || TASKS_LIMIT;

        if (!username) {
            res.status(401).json({ message: "Unauthorized user" });
            return;
        }

        const skip = (page - 1) * limit;

        const userGroup = await User.findOne({ username }, { _id: 0, __v: 0, password: 0 });
        if (!userGroup) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const query = {
            teamNumber: teamNumber,
            $or: [
                { isPrivate: { $ne: true } }, 
                { isPrivate: true, userRelated: username }
            ]
        };

        const totalCount = await Task.countDocuments(query);
        const teamTasks = await Task.find(query, { _id: 0, __v: 0 }).skip(skip).limit(limit);

        res.json({
            tasks: teamTasks,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err: any) {
        logger.error({ message: 'Error in /tasks', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/tasks-history', async (req: AuthRequest, res: Response) => {
    try {
        const username = req.user?.username;
        const teamNumber = req.user?.teamNumber;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || TASKS_LIMIT;
        const skip = (page - 1) * limit;

        const userGroup = await User.findOne({ username }, { _id: 0, __v: 0, password: 0 });
        if (!userGroup) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const query = {
            teamNumber: teamNumber,
            $or: [
                { isPrivate: { $ne: true } }, 
                { isPrivate: true, userRelated: username }
            ]
        };

        const totalCount = await TasksHistory.countDocuments(query);
        const tasksHistory = await TasksHistory.find(query, { _id: 0, __v: 0 }).skip(skip).limit(limit);

        res.json({
            tasks: tasksHistory,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err: any) {
        logger.error({ message: 'Error in /tasks-history', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/user-tasks', async (req: AuthRequest, res: Response) => {
    try {
        const username = req.user?.username;
        const teamNumber = req.user?.teamNumber;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || TASKS_LIMIT;
        const skip = (page - 1) * limit;

        const query = { userRelated: username, teamNumber: teamNumber };

        const totalCount = await Task.countDocuments(query);
        const userTasks = await Task.find(query, { _id: 0, __v: 0 }).skip(skip).limit(limit);

        res.json({
            tasks: userTasks,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err: any) {
        logger.error({ message: 'Error in /user-tasks', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/add-task', async (req: AuthRequest, res: Response) => {
    const creatorUsername = req.user?.username;
    const creatorRole = req.user?.role;
    const creatorTeam = req.user?.teamNumber;
    
    const { tName, tDes, tUserRelated, isPrivate } = req.body;

    const assignee = await User.findOne({ username: tUserRelated });

    if (!tName || !assignee || !creatorUsername) {
        res.json({ isAdded: false, message: "Invalid data or user not found." });
        return;
    }

    let targetTeam: number;

    if (creatorRole === 'admin') {
        targetTeam = assignee.teamNumber; 
    } else if (assignee.teamNumber === creatorTeam) {
        targetTeam = assignee.teamNumber; 
    } else {
        res.json({ isAdded: false, message: "You can only assign tasks to users from your teams." });
        return;
    }

    const resTask = await Task.findOne({ name: tName, userRelated: tUserRelated, description: tDes, teamNumber: targetTeam });
    
    if (resTask) {
        res.json({ isAdded: false, message: "Task already exists for this user." });
        return;
    }

    try {
        const counter = await Counter.findOneAndUpdate(
            { id: 'taskId' },
            { $inc: { seq: 1 } },
            { returnDocument: 'after', upsert: true }
        );

        if (!counter) {
            throw new Error("Failed to generate task ID");
        }

        await Task.create({
            id: counter.seq,
            name: tName,
            userRelated: tUserRelated,
            description: tDes,
            isDone: false,
            teamNumber: targetTeam,
            isPrivate: isPrivate || false 
        });

        res.json({ isAdded: true, message: "Task added!" });
    } catch (error) {
        logger.error({ message: 'Error creating task with atomic counter', error });
        res.status(500).json({ isAdded: false, message: "Server error creating task." });
    }
});

router.post('/end-task', async (req: AuthRequest, res: Response) => {
    const username = req.user?.username; 

    const { tID } = req.body; 
    const reqTask = await Task.findOne({ id: tID }, { _id: 0, __v: 0 });

    const userGroup = await User.findOne({ username }, { _id: 0, __v: 0, password: 0 });
    if (!userGroup) {
        res.status(400).json({ error: "User not found" });
        return;
    }
    
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