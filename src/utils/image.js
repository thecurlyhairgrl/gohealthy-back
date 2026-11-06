import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { HttpError } from './http-error.js'

export const IMAGES_DIR = path.join('public', 'images')

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp']
const DEFAULT_SIZE = { width: 800, height: 600, minWidth: 600, minHeight: 450 }
export const AVATAR_SIZE = { width: 400, height: 400, minWidth: 200, minHeight: 200 }

// Las imágenes quedan iguales: recortadas al centro y en WebP (800x600, o 400x400 las fotos de perfil).
export const saveImage = async (input, folder, name, size = DEFAULT_SIZE) => {
    let metadata
    try {
        metadata = await sharp(input).metadata()
    } catch {
        throw new HttpError(400, 'El archivo no es una imagen válida')
    }

    if (!ALLOWED_FORMATS.includes(metadata.format)) {
        throw new HttpError(400, 'La imagen debe ser JPG, PNG o WebP')
    }

    if (metadata.width < size.minWidth || metadata.height < size.minHeight) {
        throw new HttpError(400, `La imagen debe medir al menos ${size.minWidth}x${size.minHeight} píxeles`)
    }

    await mkdir(path.join(IMAGES_DIR, folder), { recursive: true })

    const fileName = `${name}.webp`
    await sharp(input)
        .rotate()
        .resize(size.width, size.height, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(path.join(IMAGES_DIR, folder, fileName))

    return `/images/${folder}/${fileName}`
}
