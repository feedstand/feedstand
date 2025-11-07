import { Xxh64, xxh64 } from '@node-rs/xxhash'

export const generateChecksum = (...values: Array<string | null | undefined>) => {
  return xxh64(values.join('')).toString(16)
}

export const createStreamingChecksum = () => {
  const hasher = new Xxh64()
  return {
    update: (chunk: Buffer | string) => hasher.update(chunk),
    digest: () => hasher.digest().toString(16),
  }
}
