/**
 * Convert a buffer to an ImageBitmap.
 *
 * @param data the buffer to convert
 * @param mimeType the mime type of the image (optional)
 */
export async function convertUint8ArrayToImageBitmap(
    data: ArrayBuffer | ArrayBufferView,
    mimeType?: string
): Promise<ImageBitmap> {
    if(!data) throw new Error('data is required');
    try {
        return await createImageBitmap(
            new Blob([data], {
                type: mimeType,
            }),
            {colorSpaceConversion: 'none'}
        )
    } catch (e) {
        console.error('Failed to create image bitmap', e)
        throw e
    }
}

/**
 * Create an ImageData object of a solid color.
 *
 * @param width the width of the image
 * @param height the height of the image
 * @param color the color of the image
 */
export function createSolidColorTexture(
    width: number,
    height: number,
    color: string
): ImageData {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')!
    context.fillStyle = color
    context.fillRect(0, 0, width, height)
    return context.getImageData(0, 0, width, height)
}
