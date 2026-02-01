import express from 'express';
import { register, login } from './authController.js';
import { protect } from '../middleware/authMiddleware.js';

const Router = express.Router();

Router.post('/register', register);
Router.post('/login', login);

export default Router;