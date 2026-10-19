import { SmaeGroup, SmaeFood } from '../models/index.js'

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getGroups = async (req, res, next) => {
    try {
        const groups = await SmaeGroup.find().sort({ _id: 1 })
        res.json(groups)
    } catch (error) {
        next(error)
    }
}

export const getFoods = async (req, res, next) => {
    try {
        const filter = {}

        if (req.query.groupKey) {
            filter.groupKey = String(req.query.groupKey)
        }

        if (req.query.search) {
            filter.name = new RegExp(escapeRegex(String(req.query.search)), 'i')
        }

        let limit = Number(req.query.limit) || 50
        limit = Math.min(limit, 200)

        const foods = await SmaeFood.find(filter).sort({ name: 1 }).limit(limit)
        res.json(foods)
    } catch (error) {
        next(error)
    }
}