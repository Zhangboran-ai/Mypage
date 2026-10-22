const MAX_EDGE_DEFAULT = 1600

export type CompressedImage = {
  blob: Blob
  width: number
  height: number
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片压缩失败，请换一张试试'))
      },
      type,
      quality,
    )
  })
}

/**
 * 浏览器端压缩：等比缩放到最长边 maxEdge，优先输出 WebP。
 * 服务端不接收文件流，压缩后再直传 Blob。
 */
export async function compressImage(
  file: File,
  maxEdge = MAX_EDGE_DEFAULT,
  quality = 0.82,
): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件')
  }

  if (file.size === 0) {
    throw new Error('图片内容为空')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('当前浏览器无法处理图片')
  }

  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvasToBlob(canvas, 'image/webp', quality)
  return { blob, width, height }
}
