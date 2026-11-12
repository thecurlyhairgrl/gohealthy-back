import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadImage } from '../middlewares/upload.js'
import {
  register,
  login,
  getMe,
  getMyNutritionist,
  updateMe,
  uploadAvatar,
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
router.get('/me/nutritionist', authenticate, authorize('patient'), getMyNutritionist)
router.put('/me', authenticate, updateMe)
router.post('/me/avatar', authenticate, uploadImage.single('image'), uploadAvatar)
router.put('/change-password', authenticate, changePassword)

export default router