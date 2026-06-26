import './core/config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { avatarService } from './modules/avatar/avatar.service';
import { errorHandler } from './core/middleware/error-handler';
import { notFoundHandler } from './core/middleware/not-found';
import { sendSuccess } from './core/http/api-response';

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));

const ALLOWED_ORIGINS = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /\.vercel\.app$/,
    /\.onrender\.com$/,
];

app.use(cors({
    origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
}));

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);
app.use('/avatars', express.static(avatarService.directory));

app.get('/', (_req, res) => {
    return sendSuccess(res, { message: 'Yorumi Backend is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
