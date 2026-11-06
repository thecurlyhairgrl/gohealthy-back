import path from 'node:path'
import { unlink } from 'node:fs/promises'
import { LabDocument, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import { UPLOADS_DIR } from '../middlewares/upload.js'

export const getLabDocuments = async (req, res, next) => {
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

        const labDocuments = await LabDocument.find({ patient: patientId }).sort({ createdAt: -1 })
        res.json(labDocuments)
    } catch (error) {
        next(error)
    }
}

export const uploadLabDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new HttpError(400, 'No se recibió ningún archivo. Envíalo en el campo "file"')
        }

        let patientId = req.user.id

        if (req.user.role === 'nutritionist') {
            if (!req.body.patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }

            const patient = await User.findOne({ _id: req.body.patientId, role: 'patient', nutritionist: req.user.id })

            if (!patient) {
                throw new HttpError(404, 'Paciente no encontrado')
            }

            patientId = patient._id
        }

        const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8')

        const labDocument = await LabDocument.create({
            patient: patientId,
            uploadedBy: req.user.id,
            originalName,
            storedName: req.file.filename,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            description: req.body.description,
            studyDate: req.body.studyDate,
        })

        res.status(201).json(labDocument)
    } catch (error) {
        // Si no se guardó el registro, el archivo que dejó multer ya no sirve
        if (req.file) {
            await unlink(req.file.path).catch(() => {})
        }
        next(error)
    }
}

export const downloadLabDocument = async (req, res, next) => {
    try {
        const labDocument = await LabDocument.findById(req.params.id)

        if (!labDocument) {
            throw new HttpError(404, 'Documento no encontrado')
        }

        if (req.user.role === 'patient') {
            if (labDocument.patient.toString() !== req.user.id) {
                throw new HttpError(404, 'Documento no encontrado')
            }
        } else {
            const patient = await User.findOne({ _id: labDocument.patient, nutritionist: req.user.id })

            if (!patient) {
                throw new HttpError(404, 'Documento no encontrado')
            }
        }

        const filePath = path.resolve(UPLOADS_DIR, labDocument.storedName)
        res.download(filePath, labDocument.originalName)
    } catch (error) {
        next(error)
    }
}

export const deleteLabDocument = async (req, res, next) => {
    try {
        const labDocument = await LabDocument.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user.id })

        if (!labDocument) {
            throw new HttpError(404, 'Documento no encontrado')
        }

        try {
            await unlink(path.resolve(UPLOADS_DIR, labDocument.storedName))
        } catch {
            console.warn(`No se encontró el archivo ${labDocument.storedName} para borrarlo`)
        }

        res.json({ message: 'Documento eliminado' })
    } catch (error) {
        next(error)
    }
}
