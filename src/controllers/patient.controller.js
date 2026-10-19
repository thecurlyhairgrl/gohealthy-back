import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { User, ClinicalHistory } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import { sendWelcomeEmail } from '../emails/account-emails.js'
import { calculateAdherence } from '../services/adherence.service.js'

const SALT_ROUNDS = 10

const EDITABLE_PATIENT_FIELDS = ['firstName', 'paternalLastName', 'maternalLastName', 'phone', 'active']

const EDITABLE_HISTORY_FIELDS = [
    'identification',
    'reasonForVisit',
    'goals',
    'familyHistory',
    'pathologicalHistory',
    'nonPathologicalHistory',
    'eatingHabits',
    'gynecoObstetricHistory',
]

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const generateTemporaryPassword = () => {
    return crypto.randomBytes(6).toString('base64url')
}

const removePrivateFields = (patient) => {
    const data = patient.toObject()
    delete data.passwordHash
    delete data.passwordReset
    return data
}

export const getPatients = async (req, res, next) => {
    try {
        const filter = { role: 'patient', nutritionist: req.user.id }

        if (req.query.includeInactive !== 'true') {
            filter.active = true
        }

        if (req.query.search) {
            const regex = new RegExp(escapeRegex(String(req.query.search)), 'i')
            filter.$or = [{ firstName: regex }, { paternalLastName: regex }, { maternalLastName: regex }, { email: regex }]
        }

        const patients = await User.find(filter).sort({ paternalLastName: 1, firstName: 1 })

        const result = []
        for (const patient of patients) {
            const adherence = await calculateAdherence(patient._id)
            result.push({ ...patient.toObject(), adherence })
        }

        res.json(result)
    } catch (error) {
        next(error)
    }
}

export const createPatient = async (req, res, next) => {
    try {
        const { firstName, paternalLastName, maternalLastName, email, phone, birthDate, sex, reasonForVisit } = req.body

        const temporaryPassword = generateTemporaryPassword()

        const patient = await User.create({
            firstName,
            paternalLastName,
            maternalLastName,
            email,
            phone,
            passwordHash: await bcrypt.hash(temporaryPassword, SALT_ROUNDS),
            role: 'patient',
            nutritionist: req.user.id,
            mustChangePassword: true,
            onboardingCompleted: false,
        })

        let clinicalHistory
        try {
            clinicalHistory = await ClinicalHistory.create({
                patient: patient._id,
                nutritionist: req.user.id,
                identification: { birthDate, sex },
                reasonForVisit,
            })
        } catch (error) {
            await User.findByIdAndDelete(patient._id)
            throw error
        }

        let emailSent = true
        try {
            await sendWelcomeEmail(patient, temporaryPassword)
        } catch (error) {
            emailSent = false
            console.error('No se pudo enviar el correo de bienvenida:', error.message)
        }

        res.status(201).json({ patient: removePrivateFields(patient), clinicalHistory, emailSent })
    } catch (error) {
        next(error)
    }
}

export const getPatientById = async (req, res, next) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        const clinicalHistory = await ClinicalHistory.findOne({ patient: patient._id })
        const adherence = await calculateAdherence(patient._id)

        res.json({ patient, clinicalHistory, adherence })
    } catch (error) {
        next(error)
    }
}

export const updatePatient = async (req, res, next) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        for (const field of EDITABLE_PATIENT_FIELDS) {
            if (req.body[field] !== undefined) {
                patient[field] = req.body[field]
            }
        }

        await patient.save()
        res.json(patient)
    } catch (error) {
        next(error)
    }
}

export const resendAccess = async (req, res, next) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        const temporaryPassword = generateTemporaryPassword()
        patient.passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS)
        patient.mustChangePassword = true
        await patient.save()

        try {
            await sendWelcomeEmail(patient, temporaryPassword)
        } catch (error) {
            console.error('No se pudo reenviar el acceso:', error.message)
            throw new HttpError(502, 'No se pudo enviar el correo. Intenta más tarde')
        }

        res.json({ message: 'Se envió una nueva contraseña temporal al paciente' })
    } catch (error) {
        next(error)
    }
}

export const getClinicalHistory = async (req, res, next) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        const clinicalHistory = await ClinicalHistory.findOne({ patient: patient._id })

        if (!clinicalHistory) {
            throw new HttpError(404, 'Historia clínica no encontrada')
        }

        res.json(clinicalHistory)
    } catch (error) {
        next(error)
    }
}

export const updateClinicalHistory = async (req, res, next) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        const clinicalHistory = await ClinicalHistory.findOne({ patient: patient._id })

        if (!clinicalHistory) {
            throw new HttpError(404, 'Historia clínica no encontrada')
        }

        for (const field of EDITABLE_HISTORY_FIELDS) {
            if (req.body[field] !== undefined) {
                clinicalHistory[field] = req.body[field]
            }
        }

        await clinicalHistory.save()
        res.json(clinicalHistory)
    } catch (error) {
        next(error)
    }
}

export const getPatientAdherence = async (req, res, next) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        let days = Number(req.query.days) || 7
        days = Math.min(Math.max(days, 1), 90)

        const adherence = await calculateAdherence(patient._id, days)
        res.json(adherence)
    } catch (error) {
        next(error)
    }
}