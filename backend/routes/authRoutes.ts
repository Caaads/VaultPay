import { Router } from 'express';
import { loginUser, registerUser, updateProfile } from '../controllers/authController.js';

const router = Router();

// Routes for user registration, authentication, and profile syncing
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/update-profile', updateProfile);

export default router;
