import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import logger from './logger';

import Task from './Models/Task';
import User from './Models/User';

import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

mongoose.set('strictQuery', false);

const ConnectionUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_LINK}/${process.env.DB_NAME}?appName=${process.env.DB_APP_NAME}`;
const localUri = 'mongodb://localhost:27017/tasksManagement';
const NO_TEAM_NUMBER = -1;

mongoose.connect(localUri)
    .then(() => console.log("Connected to db"))
    .catch((err) => console.log(err));

logger.info('Server started');

app.use((req: Request, res: Response, next: NextFunction) => {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[PROTECTED]';
    if (safeBody.uPass) safeBody.uPass = '[PROTECTED]';

    logger.info({
        message: 'Incoming request',
        method: req.method,
        url: req.originalUrl,
        body: safeBody
    });
    next();
});

const roleOf = async (username: string) => User.findOne({ username }, { username: 1, role: 1, teamNumber: 1, _id: 0 });

async function findReassignee(teamNumber: number, excludeUsername: string): Promise<string | null> {
  const manager = await User.findOne(
    { teamNumber, role: 'manager', username: { $ne: excludeUsername } },
    { username: 1, _id: 0 }
  ).sort({ username: 1 });
  if (manager) return manager.username;

  const other = await User.findOne(
    { teamNumber, username: { $ne: excludeUsername } },
    { username: 1, _id: 0 }
  ).sort({ username: 1 });
  return other ? other.username : null;
}

app.use('/api', userRoutes);
app.use('/api', taskRoutes);

// --- Admin & Manage Routes ---

app.post('/api/manage/add-user', async (req: Request, res: Response) => {
  try {
    const { requesterUsername, newUser } = req.body;
    const actor = await roleOf(requesterUsername);
    if (!actor) {
        res.status(401).json({ error: 'Requester not found' });
        return;
    }

    const actorRole = actor.role || 'user';
    const actorTeam = actor.teamNumber;

    if (actorRole === 'user') {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    if (actorRole === 'manager') {
      if (newUser.role === 'admin') {
          res.status(403).json({ error: 'Managers cannot create admins' });
          return;
      }
      newUser.teamNumber = actorTeam; 
      newUser.role = newUser.role || 'user';
    }
    if (actorRole === 'admin') {
      newUser.role = newUser.role || 'user';
      if (!newUser.teamNumber) newUser.teamNumber = actorTeam ?? 1;
    }

    const exists = await User.findOne({ username: newUser.username });
    if (exists) {
        res.json({ isAdded: false, message: 'User already exists' });
        return;
    }

    const hashed = await bcrypt.hash(newUser.password, 10);
    await User.create({ username: newUser.username, password: hashed, teamNumber: newUser.teamNumber, role: newUser.role });

    logger.info({ message: 'User created', by: requesterUsername, created: newUser.username, role: newUser.role, teamNumber: newUser.teamNumber });
    res.json({ isAdded: true, message: 'User added!' });
  } catch (err: any) {
    logger.error({ message: 'Error in /api/manage/add-user', error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/manage/remove-user', async (req: Request, res: Response) => {
  try {
    const { requesterUsername, username } = req.body;
    const actor = await roleOf(requesterUsername);
    const target = await roleOf(username);

    if (!actor) { res.status(401).json({ error: 'Requester not found' }); return; }
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }

    const actorRole = actor.role || 'user';
    if (actorRole === 'user') { res.status(403).json({ error: 'Forbidden' }); return; }

    if (actorRole === 'manager') {
      if (actor.teamNumber !== target.teamNumber) {
        res.status(403).json({ error: 'Managers can remove only team members' }); return;
      }
      if (target.role === 'admin') {
        res.status(403).json({ error: 'Only admin can remove admin users' }); return;
      }
    }

    if (target.teamNumber === NO_TEAM_NUMBER) {
      res.json({ removedFromTeam: true, already: true, teamNumber: NO_TEAM_NUMBER }); return;
    }

    const prevTeam = target.teamNumber;
    const reassignee = await findReassignee(prevTeam, username);

    let tasksReassigned = 0;
    let tasksDeleted = 0;

    if (reassignee) {
      const up = await Task.updateMany(
        { userRelated: username, teamNumber: prevTeam },
        { $set: { userRelated: reassignee } }
      );
      tasksReassigned = up.modifiedCount || 0;
    } else {
      const del = await Task.deleteMany({ userRelated: username, teamNumber: prevTeam });
      tasksDeleted = del.deletedCount || 0;
    }

    await User.updateOne(
      { username },
      { $set: { teamNumber: NO_TEAM_NUMBER, role: target.role === 'admin' ? target.role : 'user' } }
    );

    logger.info({ message: 'User soft-removed from team', by: requesterUsername, username, prevTeam, reassignedTo: reassignee });
    res.json({ removedFromTeam: true, teamNumber: NO_TEAM_NUMBER, reassignedTo: reassignee, tasksReassigned, tasksDeleted });
  } catch (err: any) {
    logger.error({ message: 'Error in /api/manage/remove-user', error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/manage/set-role', async (req: Request, res: Response) => {
  try {
    const { requesterUsername, username, role } = req.body;
    const actor = await roleOf(requesterUsername);
    const target = await User.findOne({ username }, { username:1, teamNumber:1, role:1, _id:0 });
    
    if (!actor) { res.status(401).json({ error: 'Requester not found' }); return; }
    if (!target) { res.status(404).json({ error: 'User not found' }); return; }
    if (!['user','manager','admin','guest'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }

    if (actor.role !== 'admin') {
      if (role === 'admin') { res.status(403).json({ error: 'Only admin can set admin' }); return; }
      if (actor.role !== 'manager') { res.status(403).json({ error: 'Forbidden' }); return; }
      if (actor.teamNumber !== target.teamNumber) { res.status(403).json({ error: 'Managers can change only team members' }); return; }
    }

    await User.updateOne({ username }, { $set: { role } });
    logger.info({ message: 'Role changed', by: requesterUsername, username, role });
    res.json({ updated: true });
  } catch (err: any) {
      logger.error({ message: 'Error in /api/manage/set-role', error: err.message });
      res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Server is active on port ${PORT}`));