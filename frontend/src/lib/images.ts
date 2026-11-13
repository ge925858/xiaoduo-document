interface CompressionOptions {
  maxEdge: number
  maxEncodedLength: number
  quality: number
  format: 'image/jpeg' | 'image/webp'
}

async function compressRasterFile(
  file: File,
  options: CompressionOptions,
): Promise<{
  dataUrl: string
  publicUrl: string
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('原图不能超过 10MB')
  }

  const bitmap = await createImageBitmap(file)
  const maxEdge = options.maxEdge
  const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * ratio))
  const height = Math.max(1, Math.round(bitmap.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法处理图片')

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL(options.format, options.quality)
  if (dataUrl.length > options.maxEncodedLength) {
    throw new Error('压缩后的图片仍然过大')
  }

  return {
    dataUrl,
    publicUrl: `https://cdjblog.oss-cn-hangzhou.aliyuncs.com/notes/prototype-${crypto.randomUUID()}.${
      options.format === 'image/webp' ? 'webp' : 'jpg'
    }`,
  }
}

export function compressImageFile(file: File) {
  return compressRasterFile(file, {
    maxEdge: 1920,
    maxEncodedLength: 5_500_000,
    quality: 0.8,
    format: 'image/jpeg',
  })
}

export function compressAvatarFile(file: File) {
  return compressRasterFile(file, {
    maxEdge: 512,
    maxEncodedLength: 1_200_000,
    quality: 0.84,
    format: 'image/webp',
  })
}
