import { Message, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

export const getConversation = async (req, res, next) => {
    try {
        const { patientId } = req.query
        if (!patientId) {
            throw new HttpError(400, 'Falta el patientId')
        }
        const messages = await Message.find({ patient: patientId })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName paternalLastName role')
        res.json(messages)
    } catch (error) {
        next(error)
    }
}

export const getUnreadCount = async (req, res, next) => {
    try {
        const { userId } = req.query
        if (!userId) {
            throw new HttpError(400, 'Falta el userId')
        }
        const unread = await Message.countDocuments({
            recipient: userId, read:
                false
        })
        res.json({ unread })
    } catch (error) {
        next(error)
    }
}

export const sendMessage = async (req, res, next) => {
    try {
        const { senderId, patientId, subject, body } = req.body
        if (!senderId) {
            throw new HttpError(400, 'Falta el senderId')
        }
        const sender = await User.findById(senderId)
        if (!sender) {
            throw new HttpError(404, 'Remitente no encontrado')
        }
        let patient
        let recipient
        if (sender.role === 'patient') {
            patient = sender._id
            recipient = sender.nutritionist
        } else {
            if (!patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }
            const patientUser = await User.findOne({
                _id: patientId, role: 'patient',
                nutritionist: sender._id
            })
            if (!patientUser) {
                throw new HttpError(404, 'Paciente no encontrado')
            }
            patient = patientUser._id
            recipient = patientUser._id
        }
        const message = await Message.create({
            patient,
            sender: sender._id,
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
        const { patientId, userId } = req.query
        if (!patientId || !userId) {
            throw new HttpError(400, 'Faltan el patientId o el userId')
        }
        const result = await Message.updateMany(
            { patient: patientId, recipient: userId, read: false },
            { read: true, readAt: new Date() }
        )
        res.json({ updated: result.modifiedCount })
    } catch (error) {
        next(error)
    }
}
