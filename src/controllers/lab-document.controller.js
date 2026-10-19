import path from 'node:path'
import { unlink } from 'node:fs/promises'
import { LabDocument } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import { UPLOADS_DIR } from '../middlewares/upload.js'

export const getLabDocuments = async (req, res, next) => {
    try {
        const { patientId } = req.query
        if (!patientId) {
            throw new HttpError(400, 'Falta el patientId')
        }
        const labDocuments = await LabDocument.find({ patient: patientId }).sort({
            createdAt: -1
        })
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
        const originalName = Buffer.from(req.file.originalname,
            'latin1').toString('utf8')
        const labDocument = await LabDocument.create({
            patient: req.body.patientId,
            uploadedBy: req.body.patientId,
            originalName,
            storedName: req.file.filename,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            description: req.body.description,
            studyDate: req.body.studyDate,
        })
        res.status(201).json(labDocument)
    } catch (error) {
        next(error)
    }
}

export const downloadLabDocument = async (req, res, next) => {
    try {
        const labDocument = await LabDocument.findById(req.params.id)
        if (!labDocument) {
            throw new HttpError(404, 'Documento no encontrado')
        }
        const filePath = path.resolve(UPLOADS_DIR, labDocument.storedName)
        res.download(filePath, labDocument.originalName)
    } catch (error) {
        next(error)
    }
}

export const deleteLabDocument = async (req, res, next) => {
    try {
        const labDocument = await LabDocument.findByIdAndDelete(req.params.id)
        if (!labDocument) {
            throw new HttpError(404, 'Documento no encontrado')
        }
        try {
            await unlink(path.resolve(UPLOADS_DIR, labDocument.storedName))
        } catch {
            console.warn(`No se encontró el archivo ${labDocument.storedName} para
borrarlo`)
        }
        res.json({ message: 'Documento eliminado' })
    } catch (error) {
        next(error)
    }
}
