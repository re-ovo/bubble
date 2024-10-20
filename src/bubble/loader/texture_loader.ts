export async function convertUint8ArrayToImageBitmap(data: Uint8Array): Promise<ImageBitmap> {
    return createImageBitmap(
        new Blob([data]),
        { colorSpaceConversion: 'none' }
    );
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
