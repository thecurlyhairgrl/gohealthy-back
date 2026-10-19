import { User, ClinicalHistory } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

const ONBOARDING_FIELDS = [
    'identification',
    'goals',
    'familyHistory',
    'pathologicalHistory',
    'nonPathologicalHistory',
    'eatingHabits',
    'gynecoObstetricHistory',
]

export const getOnboarding = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
        const clinicalHistory = await ClinicalHistory.findOne({ patient: req.user.id })

        if (!user || !clinicalHistory) {
            throw new HttpError(404, 'No se encontró tu expediente')
        }

        res.json({
            mustChangePassword: user.mustChangePassword,
            onboardingCompleted: user.onboardingCompleted,
            clinicalHistory,
        })
    } catch (error) {
        next(error)
    }
}

export const completeOnboarding = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            throw new HttpError(404, 'Usuario no encontrado')
        }

        if (user.mustChangePassword) {
            throw new HttpError(403, 'Primero cambia tu contraseña temporal')
        }

        const clinicalHistory = await ClinicalHistory.findOne({ patient: req.user.id })

        if (!clinicalHistory) {
            throw new HttpError(404, 'No se encontró tu expediente')
        }

        for (const field of ONBOARDING_FIELDS) {
            if (req.body[field] !== undefined) {
                clinicalHistory[field] = req.body[field]
            }
        }

        await clinicalHistory.save()

        user.onboardingCompleted = true
        await user.save()

        res.json({ message: 'Onboarding completado', clinicalHistory })
    } catch (error) {
        next(error)
    }
}