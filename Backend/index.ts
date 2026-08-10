import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import logger from './logger';

import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

mongoose.set('strictQuery', false);

const ConnectionUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_LINK}/${process.env.DB_NAME}?appName=${process.env.DB_APP_NAME}`;
const localUri = 'mongodb://localhost:27017/tasksManagement';

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

app.use('/api', userRoutes);
app.use('/api', taskRoutes);
app.use('/api/manage', adminRoutes);

app.listen(PORT, () => console.log(`Server is active on port ${PORT}`));