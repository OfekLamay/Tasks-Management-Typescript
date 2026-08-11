import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user data
export interface AuthRequest extends Request {
    user?: {
        username: string;
        role: string;
        teamNumber: number;
    };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Extract the token directly from the cookies
    const token = req.cookies.token;

    // If there is no token, the user is not logged in or the cookie expired
    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not set');
        
        // Verify the token signature and expiration
        const decoded = jwt.verify(token, secret) as any;
        
        // Attach the decoded payload to the request object
        // This allows your routes to access req.user instead of req.body
        req.user = decoded;
        
        // Pass control to the next middleware or the actual route handler
        next();
    } catch (error) {
        // Token is invalid, modified, or expired
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};