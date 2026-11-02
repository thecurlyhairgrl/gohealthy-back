import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { upload } from '../middlewares/upload.js'
import {
    getLabDocuments,
    uploadLabDocument,
    downloadLabDocument,
    deleteLabDocument,
} from '../controllers/lab-document.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getLabDocuments)
router.post('/', authorize('patient'), upload.single('file'), uploadLabDocument)
router.get('/:id/file', downloadLabDocument)
router.delete('/:id', authorize('patient'), deleteLabDocument)

export default router
