import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

router.get('/me', authenticate, getMe)
router.put('/change-password', authenticate, changePassword)

export default router