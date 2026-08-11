import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../Models/User';
import logger from '../logger';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const USERS_LIMIT = 5;

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { uName, uPass } = req.body;
        const user = await User.findOne({ username: uName });
        
        if (user && user.password && await bcrypt.compare(uPass, user.password)) {
            // Create JWT payload with essential user info
            const payload = {
                username: user.username,
                role: user.role || 'user',
                teamNumber: user.teamNumber
            };

            // Sign the token (valid for 1 hour)
            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error('JWT_SECRET is not set');
            const token = jwt.sign(payload, secret, { expiresIn: '1h' });

            // Set token in HttpOnly cookie
            res.cookie('token', token, {
                httpOnly: true, // Prevents client-side JS from reading the cookie
                secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
                sameSite: 'strict', // Prevents CSRF attacks
                maxAge: 3600000 // 1 hour in milliseconds
            });

            logger.info({ message: 'Login attempt success', username: uName });
            
            res.json({ 
                isLogin: true, 
                message: "User login successful", 
                role: user.role || 'user', 
                teamNumber: user.teamNumber 
            });
        } else {
            logger.info({ message: 'Login attempt failure', username: uName });
            res.status(401).json({ isLogin: false, message: "Wrong credentials" });
        }
    } catch (error) {
        logger.error({ message: 'Error in login', error });
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.get('/verify', (req: Request, res: Response) => {
    // Get the token from cookies
    const token = req.cookies.token;

    if (!token) {
        res.json({ isLogin: false });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not set');

        // Check if the token is valid and not expired
        // If the token is valid, decode it to get user info
        const decoded = jwt.verify(token, secret) as any;

        res.json({
            isLogin: true,
            username: decoded.username,
            role: decoded.role,
            teamNumber: decoded.teamNumber
        });
    } catch (error) {
        // If the token is expired or invalid, return that the user is not logged in
        res.json({ isLogin: false });
    }
});

router.use(verifyToken);

router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Access denied. Admins only.' });
            return;
        }

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

router.get('/users-only', async (req: AuthRequest, res: Response) => {
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

router.get('/team-users-only', async (req: AuthRequest, res: Response) => {
    try {
        const teamNumber = req.user?.teamNumber;
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || USERS_LIMIT;
        const skip = (page - 1) * limit;

        if (teamNumber === undefined) {
            res.status(400).json({ error: "Invalid user token data" });
            return;
        }

        const query = { teamNumber: teamNumber };
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