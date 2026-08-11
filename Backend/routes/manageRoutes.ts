import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Task from '../Models/Task';
import User from '../Models/User';
import logger from '../logger';
import { verifyToken, AuthRequest } from '../middleware/auth';

const NO_TEAM_NUMBER = -1;

const router = express.Router();
router.use(verifyToken);

const roleOf = async (username: string) => User.findOne({ username }, { username: 1, role: 1, teamNumber: 1, _id: 0 });

router.post('/add-user', async (req: AuthRequest, res: Response) => {
    try {
        
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const actor = req.user;

        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Access denied. Admins only.' });
            return;
        }

        const { newUser } = req.body;

        const actorRole = actor.role || 'user';
        const actorTeam = actor.teamNumber;

        if (actorRole === 'user') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        else if (actorRole === 'manager') {
            if (newUser.role === 'admin') {
                res.status(403).json({ error: 'Managers cannot create admins' });
                return;
            }
            newUser.teamNumber = actorTeam; 
            newUser.role = newUser.role || 'user';
        }
        else if (actorRole === 'admin') {
            newUser.role = newUser.role || 'user';
            if (!newUser.teamNumber) newUser.teamNumber = actorTeam ?? 1;
        }
        else {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const exists = await User.findOne({ username: newUser.username });
        if (exists) {
            res.json({ isAdded: false, message: 'User already exists' });
            return;
        }

        const hashed = await bcrypt.hash(newUser.password, 10);
        await User.create({ username: newUser.username, password: hashed, teamNumber: newUser.teamNumber, role: newUser.role });

        logger.info({ message: 'User created', by: req.user, created: newUser.username, role: newUser.role, teamNumber: newUser.teamNumber });
        res.json({ isAdded: true, message: 'User added!' });
    } catch (err: any) {
        logger.error({ message: 'Error in /api/manage/add-user', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/remove-user', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const requesterUsername = req.user.username;
        const actorRole = req.user.role || 'user';
        const actorTeam = req.user.teamNumber;

        const { username } = req.body;
        const target = await roleOf(username);

        if (!target) { 
            res.status(404).json({ error: 'User not found' }); 
            return; 
        }

        if (actorRole === 'user') {
            res.status(403).json({ error: 'Forbidden' }); 
            return; 
        }
        else if (actorRole === 'manager') {
            if (actorTeam !== target.teamNumber) {
                res.status(403).json({ error: 'Managers can remove only team members' }); 
                return;
            }
            if (target.role === 'admin') {
                res.status(403).json({ error: 'Only admin can remove admin users' }); 
                return;
            }
        }
        else if (actorRole === 'admin') {
            if (target.role === 'admin' && requesterUsername !== username) {
                res.status(403).json({ error: 'Only admin can remove other admins' }); 
                return;
            }
        }
        else { 
            res.status(403).json({ error: 'Forbidden' }); 
            return; 
        }
        
        if (target.teamNumber === NO_TEAM_NUMBER) {
            res.json({ removedFromTeam: true, already: true, teamNumber: NO_TEAM_NUMBER }); return;
        }

        const prevTeam = target.teamNumber;
        const reassignee = requesterUsername;

        const up = await Task.updateMany(
            { userRelated: username, teamNumber: prevTeam },
            { $set: { userRelated: reassignee } }
        );
        const tasksReassigned = up.modifiedCount || 0;
        const tasksDeleted = 0; 

        await User.updateOne(
            { username },
            { $set: { teamNumber: NO_TEAM_NUMBER, role: target.role === 'admin' ? target.role : 'user' } }
        );

        logger.info({ message: 'User soft-removed from team and tasks reassigned', by: requesterUsername, username, prevTeam, reassignedTo: reassignee });
        res.json({ removedFromTeam: true, teamNumber: NO_TEAM_NUMBER, reassignedTo: reassignee, tasksReassigned, tasksDeleted });
    } catch (err: any) {
        logger.error({ message: 'Error in /api/manage/remove-user', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/set-role', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const {username, role} = req.body;
        if (!['user','manager','admin','guest'].includes(role)) { 
            res.status(400).json({ error: 'Invalid role' }); 
            return;
        }
        
        const requesterUsername = req.user.username;
        const actorRole = req.user.role;
        const actorTeam = req.user.teamNumber;
        const target = await User.findOne({ username }, { username:1, teamNumber:1, role:1, _id:0 });
        
        if (!target) {
            res.status(404).json({ error: 'User not found' }); 
            return;
        }

        if (actorRole !== 'admin') {
            if (role === 'admin') {
                res.status(403).json({ error: 'Only admin can set admin' });
                return;
            }
            if (actorRole !== 'manager') { 
                res.status(403).json({ error: 'Forbidden' }); 
                return; 
            }
            if (actorTeam !== target.teamNumber) { 
                res.status(403).json({ error: 'Managers can change only team members' }); 
                return; 
            }
        }

        await User.updateOne({ username }, { $set: { role: role } });
        logger.info({ message: 'Role changed', by: requesterUsername, username, role });
        res.json({ updated: true });
    } catch (err: any) {
        logger.error({ message: 'Error in /api/manage/set-role', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/delete-user', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { username } = req.body;
        const requesterUsername = req.user.username;
        const actorRole = req.user.role;
        const target = await User.findOne({ username }, { username:1, teamNumber:1, role:1, _id:0 });

        if (!target) {
            res.status(404).json({ error: 'User not found' }); 
            return;
        }

        if (target.teamNumber !== -1) {
            res.status(400).json({ error: 'User must be removed from team before deletion' });
            return;
        }

        if (actorRole !== 'admin') {
            res.status(403).json({ error: 'Only admin can delete users' });
            return;
        }

        await User.deleteOne({ username });
        logger.info({ message: 'User deleted', by: requesterUsername, username });
        res.json({ deleted: true });

    } catch (err: any) {
        logger.error({ message: 'Error in /api/manage/delete-user', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/add-to-team', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { username } = req.body;
        const requesterUsername = req.user.username;
        const actorRole = req.user.role;
        const actorTeam = req.user.teamNumber;

        if (actorRole !== 'admin' && actorRole !== 'manager') {
            res.status(403).json({ error: 'Only admin or manager can add users to team' });
            return;
        }

        const target = await User.findOne({ username }, { username:1, teamNumber:1, role:1, _id:0 });
        if (!target) {
            res.status(404).json({ error: 'User not found' }); 
            return;
        }

        await Task.updateMany(
            { userRelated: username, isPrivate: true },
            { $set: { teamNumber: actorTeam } }
        );

        await User.updateOne({ username }, { $set: { teamNumber: actorTeam } });

        // I want to make every remaining non-private task of the user to be assigned to the manager/admin of the previous team.

        logger.info({ message: 'User added to team', by: requesterUsername, username, teamNumber: actorTeam });

    } catch (err: any) {
        logger.error({ message: 'Error in /api/manage/add-to-team', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/move-to-team', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const actorRole = req.user.role;

        if (actorRole !== 'admin') {
            res.status(403).json({ error: 'Only admin can move users to a different team' });
            return;
        }

        const { username, teamNumber } = req.body;
        const requesterUsername = req.user.username;

        const target = await User.findOne({ username }, { username:1, teamNumber:1, role:1, _id:0 });
        if (!target) {
            res.status(404).json({ error: 'User not found' }); 
            return;
        }

        await Task.updateMany(
            { userRelated: username, isPrivate: true },
            { $set: { teamNumber: teamNumber } }
        );

        // I want to make every remaining non-private task of the user to be assigned to the manager/admin of the previous team.

        await User.updateOne({ username }, { $set: { teamNumber: teamNumber } });
        logger.info({ message: 'User moved to a different team', by: requesterUsername, username, newTeamNumber: teamNumber });
        res.json({ moved: true, newTeamNumber: teamNumber });

    } catch (err: any) {
        logger.error({ message: 'Error in /api/manage/move-to-team', error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;