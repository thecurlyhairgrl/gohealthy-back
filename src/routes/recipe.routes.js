import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadImage } from '../middlewares/upload.js'
import {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadRecipeImage,
} from '../controllers/recipe.controller.js'

const router = Router()

router.use(authenticate, authorize('nutritionist'))

router.get('/', getRecipes)
router.get('/:id', getRecipeById)
router.post('/', createRecipe)
router.put('/:id', updateRecipe)
router.delete('/:id', deleteRecipe)
router.post('/:id/image', uploadImage.single('image'), uploadRecipeImage)

export default router
