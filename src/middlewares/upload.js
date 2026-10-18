import multer from 'multer'

export const UPLOADS_DIR = 'uploads'

const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`
        callback(null, uniqueName)
    },
})

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
})
