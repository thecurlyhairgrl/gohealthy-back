import { Message, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

export const getConversation = async (req, res, next) => {
    try {
        let patientId

        if (req.user.role === 'patient') {
            patientId = req.user.id
        } else {
            if (!req.query.patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }

            const patient = await User.findOne({ _id: req.query.patientId, role: 'patient', nutritionist: req.user.id })

            if (!patient) {
                throw new HttpError(404, 'Paciente no encontrado')
            }

            patientId = patient._id
        }

        const messages = await Message.find({ patient: patientId })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName paternalLastName role')

        res.json(messages)
    } catch (error) {
        next(error)
    }
}

export const getConversations = async (req, res, next) => {
    try {
        const patients = await User.find({ role: 'patient', nutritionist: req.user.id, active: true })
            .select('firstName paternalLastName maternalLastName avatarUrl')
            .lean()

        const result = []
        for (const patient of patients) {
            const lastMessage = await Message.findOne({ patient: patient._id })
                .sort({ createdAt: -1 })
                .populate('sender', 'role')
                .lean()
            const unread = await Message.countDocuments({ patient: patient._id, recipient: req.user.id, read: false })

            result.push({
                patient,
                lastMessage: lastMessage
                    ? { body: lastMessage.body, subject: lastMessage.subject, createdAt: lastMessage.createdAt, senderRole: lastMessage.sender?.role }
                    : null,
                unread,
            })
        }

        // Primero las conversaciones con mensajes, de la más reciente a la más antigua
        result.sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0))

        res.json(result)
    } catch (error) {
        next(error)
    }
}

export const getUnreadCount = async (req, res, next) => {
    try {
        const unread = await Message.countDocuments({ recipient: req.user.id, read: false })
        res.json({ unread })
    } catch (error) {
        next(error)
    }
}

export const sendMessage = async (req, res, next) => {
    try {
        const { patientId, subject, body } = req.body
        let patient
        let recipient

        if (req.user.role === 'patient') {
            const currentUser = await User.findById(req.user.id)

            if (!currentUser) {
                throw new HttpError(404, 'Usuario no encontrado')
            }

            patient = currentUser._id
            recipient = currentUser.nutritionist
        } else {
            if (!patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }

            const patientUser = await User.findOne({ _id: patientId, role: 'patient', nutritionist: req.user.id })

            if (!patientUser) {
                throw new HttpError(404, 'Paciente no encontrado')
            }

            patient = patientUser._id
            recipient = patientUser._id
        }

        const message = await Message.create({
            patient,
            sender: req.user.id,
            recipient,
            subject,
            body,
        })

        res.status(201).json(message)
    } catch (error) {
        next(error)
    }
}

export const markConversationAsRead = async (req, res, next) => {
    try {
        let patientId

        if (req.user.role === 'patient') {
            patientId = req.user.id
        } else {
            if (!req.query.patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }

            const patient = await User.findOne({ _id: req.query.patientId, role: 'patient', nutritionist: req.user.id })

            if (!patient) {
                throw new HttpError(404, 'Paciente no encontrado')
            }

            patientId = patient._id
        }

        const result = await Message.updateMany(
            { patient: patientId, recipient: req.user.id, read: false },
            { read: true, readAt: new Date() }
        )

        res.json({ updated: result.modifiedCount })
    } catch (error) {
        next(error)
    }
}
