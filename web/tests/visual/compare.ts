import sharp from 'sharp'

export interface VisualComparison {
  width: number
  height: number
  changedPixels: number
  diffRatio: number
  diffPng: Buffer
}

export async function compareVisualScreenshots(
  expectedPng: Buffer,
  actualPng: Buffer,
  options: {
    threshold?: number
  } = {},
): Promise<VisualComparison> {
  const [expected, actual] = await Promise.all([
    sharp(expectedPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(actualPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ])
  if (
    expected.info.width !== actual.info.width ||
    expected.info.height !== actual.info.height
  ) {
    throw new Error(
      `SCREENSHOT_SIZE_MISMATCH:${expected.info.width}x${expected.info.height}:${actual.info.width}x${actual.info.height}`,
    )
  }

  const { width, height } = expected.info
  const threshold = options.threshold ?? 16
  const diff = Buffer.alloc(width * height * 4)
  let changedPixels = 0
  for (let index = 0; index < expected.data.length; index += 4) {
    const delta = Math.max(
      Math.abs(expected.data[index] - actual.data[index]),
      Math.abs(expected.data[index + 1] - actual.data[index + 1]),
      Math.abs(expected.data[index + 2] - actual.data[index + 2]),
      Math.abs(expected.data[index + 3] - actual.data[index + 3]),
    )
    if (delta > threshold) {
      changedPixels += 1
      diff[index] = 224
      diff[index + 1] = 74
      diff[index + 2] = 55
      diff[index + 3] = 255
      continue
    }
    const gray =
      245 -
      Math.round(
        (expected.data[index] +
          expected.data[index + 1] +
          expected.data[index + 2]) /
          18,
      )
    diff[index] = gray
    diff[index + 1] = gray
    diff[index + 2] = gray
    diff[index + 3] = 255
  }

  return {
    width,
    height,
    changedPixels,
    diffRatio: changedPixels / (width * height),
    diffPng: await sharp(diff, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer(),
  }
}
