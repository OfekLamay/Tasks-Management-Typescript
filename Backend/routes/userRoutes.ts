import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../Models/User';
import logger from '../logger';

const router = express.Router();

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
        const users = await User.find({}, { _id: 0, __v: 0 });
        res.json(users);
    } catch (err: any) {
        logger.error({ message: 'Error in /users', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/users-only', async (req: Request, res: Response) => {
    try {
        const users = await User.find({}, { password: 0, _id: 0, __v: 0 });
        res.json(users);
    } catch (err: any) {
        logger.error({ message: 'Error in /users-only', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/team-users-only', async (req: Request, res: Response) => {
    try {
        const uDetails = req.body;
        const userGroup = await User.findOne({ username: uDetails.username }, { _id: 0, __v: 0, password: 0 });
        
        if (!userGroup) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const groupUsers = await User.find({ teamNumber: userGroup.teamNumber }, { password: 0, _id: 0, __v: 0 });
        
        res.json(groupUsers);
    } catch (err: any) {
        logger.error({ message: 'Error in /team-users-only', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;