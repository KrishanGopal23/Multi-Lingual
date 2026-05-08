import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout } from './authController.js';
import { protect } from '../middleware/authMiddleware.js';

const Router = express.Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
});

Router.post('/register', authLimiter, register);
Router.post('/login', authLimiter, login);
Router.post('/refresh', authLimiter, refresh);
Router.post('/logout', logout);

export default Router;