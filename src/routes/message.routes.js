import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getConversation,
    getConversations,
    getUnreadCount,
    sendMessage,
    markConversationAsRead,
} from '../controllers/message.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getConversation)
router.get('/conversations', authorize('nutritionist'), getConversations)
router.get('/unread-count', getUnreadCount)
router.post('/', sendMessage)
router.put('/read', markConversationAsRead)

export default router
