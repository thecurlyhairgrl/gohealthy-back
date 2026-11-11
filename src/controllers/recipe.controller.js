import { Recipe } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import { saveImage } from '../utils/image.js'

const EDITABLE_FIELDS = ['name', 'mealTimes', 'prepMinutes', 'ingredients', 'steps']

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getRecipes = async (req, res, next) => {
    try {
        const filter = { $or: [{ nutritionist: null }, { nutritionist: req.user.id }] }

        if (req.query.search) {
            filter.name = new RegExp(escapeRegex(String(req.query.search)), 'i')
        }

        if (req.query.mealTime) {
            filter.mealTimes = String(req.query.mealTime)
        }

        let limit = Number(req.query.limit) || 50
        limit = Math.min(limit, 200)

        const recipes = await Recipe.find(filter).sort({ name: 1 }).limit(limit)
        res.json(recipes)
    } catch (error) {
        next(error)
    }
}

export const getRecipeById = async (req, res, next) => {
    try {
        const recipe = await Recipe.findOne({
            _id: req.params.id,
            $or: [{ nutritionist: null }, { nutritionist: req.user.id }],
        })

        if (!recipe) {
            throw new HttpError(404, 'Receta no encontrada')
        }

        res.json(recipe)
    } catch (error) {
        next(error)
    }
}

export const createRecipe = async (req, res, next) => {
    try {
        const { name, mealTimes, prepMinutes, ingredients, steps } = req.body

        const recipe = await Recipe.create({
            nutritionist: req.user.id,
            name,
            mealTimes,
            prepMinutes,
            ingredients,
            steps,
        })

        res.status(201).json(recipe)
    } catch (error) {
        next(error)
    }
}

export const updateRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id })

        if (!recipe) {
            throw new HttpError(404, 'Receta no encontrada')
        }

        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) {
                recipe[field] = req.body[field]
            }
        }

        await recipe.save()
        res.json(recipe)
    } catch (error) {
        next(error)
    }
}

export const deleteRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, nutritionist: req.user.id })

        if (!recipe) {
            throw new HttpError(404, 'Receta no encontrada')
        }

        res.json({ message: 'Receta eliminada' })
    } catch (error) {
        next(error)
    }
}

export const uploadRecipeImage = async (req, res, next) => {
    try {
        const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id })

        if (!recipe) {
            throw new HttpError(404, 'Receta no encontrada')
        }

        if (!req.file) {
            throw new HttpError(400, 'No se recibió ninguna imagen. Envíala en el campo "image"')
        }

        // Cada subida usa un nombre nuevo: los planes que ya copiaron la imagen anterior la conservan
        recipe.imageUrl = await saveImage(req.file.buffer, 'recipes/uploads', `${recipe._id}-${Date.now()}`)
        await recipe.save()

        res.json(recipe)
    } catch (error) {
        next(error)
    }
}
