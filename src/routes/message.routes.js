import { Router } from 'express'
import {
    getConversation,
    getUnreadCount,
    sendMessage,
    markConversationAsRead,
} from '../controllers/message.controller.js'

const router = Router()

router.get('/', getConversation)
router.get('/unread-count', getUnreadCount)
router.post('/', sendMessage)
router.put('/read', markConversationAsRead)

export default router