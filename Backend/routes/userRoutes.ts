import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../Models/User';
import logger from '../logger';

const router = express.Router();

const USERS_LIMIT = 5;

router.post('/login', async (req: Request, res: Response) => {
    const uDetails = req.body;
    const user = await User.findOne({ username: uDetails.uName });
    let result;
    
    if (user && user.password && await bcrypt.compare(uDetails.uPass, user.password)) {
        result = { isLogin: true, message: "User login", role: user.role || 'user', teamNumber: user.teamNumber };
    } else {
        result = { isLogin: false, message: "Wrong credentials" };
    }

    logger.info({
        message: 'Login attempt',
        username: uDetails.uName,
        status: result.isLogin ? 'success' : 'failure'
    });

    res.json(result);
});

router.get('/users', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || USERS_LIMIT;
        const skip = (page - 1) * limit;

        const totalCount = await User.countDocuments({});
        const users = await User.find({}, { _id: 0, __v: 0 }).skip(skip).limit(limit);

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err: any) {
        logger.error({ message: 'Error in /users', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/users-only', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || USERS_LIMIT;
        const skip = (page - 1) * limit;

        const totalCount = await User.countDocuments({});
        const users = await User.find({}, { password: 0, _id: 0, __v: 0 }).skip(skip).limit(limit);

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err: any) {
        logger.error({ message: 'Error in /users-only', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/team-users-only', async (req: Request, res: Response) => {
    try {
        const { username, page = 1, limit = USERS_LIMIT } = req.body;
        const skip = (page - 1) * limit;

        const userGroup = await User.findOne({ username }, { _id: 0, __v: 0, password: 0 });
        
        if (!userGroup) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const query = { teamNumber: userGroup.teamNumber };
        const totalCount = await User.countDocuments(query);
        const groupUsers = await User.find(query, { password: 0, _id: 0, __v: 0 }).skip(skip).limit(limit);
        
        res.json({
            users: groupUsers,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (err: any) {
        logger.error({ message: 'Error in /team-users-only', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;