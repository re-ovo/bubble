export async function convertUint8ArrayToImageBitmap(
    data: ArrayBuffer | ArrayBufferView,
    width: number,
    height: number,
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

export function createImageBitmapOfColor(
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
