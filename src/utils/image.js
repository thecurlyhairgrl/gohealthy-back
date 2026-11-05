import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { HttpError } from './http-error.js'

export const IMAGES_DIR = path.join('public', 'images')

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp']
const MIN_WIDTH = 600
const MIN_HEIGHT = 450
const WIDTH = 800
const HEIGHT = 600

// Todas las imágenes quedan iguales: 800x600, recortadas al centro y en WebP.
export const saveImage = async (input, folder, name) => {
    let metadata
    try {
        metadata = await sharp(input).metadata()
    } catch {
        throw new HttpError(400, 'El archivo no es una imagen válida')
    }

    if (!ALLOWED_FORMATS.includes(metadata.format)) {
        throw new HttpError(400, 'La imagen debe ser JPG, PNG o WebP')
    }

    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
        throw new HttpError(400, `La imagen debe medir al menos ${MIN_WIDTH}x${MIN_HEIGHT} píxeles`)
    }

    await mkdir(path.join(IMAGES_DIR, folder), { recursive: true })

    const fileName = `${name}.webp`
    await sharp(input)
        .rotate()
        .resize(WIDTH, HEIGHT, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(path.join(IMAGES_DIR, folder, fileName))

    return `/images/${folder}/${fileName}`
}
