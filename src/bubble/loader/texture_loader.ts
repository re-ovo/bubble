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
        return createImageBitmapOfColor(
            width,
            height,
            '#ff0000'
        )
    }
}

export function createImageBitmapOfColor(
    width: number,
    height: number,
    color: string
): Promise<ImageBitmap> {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return createImageBitmap(canvas);
}
