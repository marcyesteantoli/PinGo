import * as ImageManipulator from 'expo-image-manipulator'
import { LIMITS } from '@/config/limits'

export type CompressedImage = {
  uri: string
  width: number
  height: number
  base64?: string
}

export async function compressImage(uri: string): Promise<CompressedImage> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: LIMITS.MAX_IMAGE_WIDTH_PX } }],
    {
      compress: LIMITS.IMAGE_COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  )
  return result
}
