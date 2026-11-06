import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
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
router.post('/', upload.single('file'), uploadLabDocument)
router.get('/:id/file', downloadLabDocument)
router.delete('/:id', deleteLabDocument)

export default router
