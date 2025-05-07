import fs from 'node:fs/promises'
import path from 'node:path'

// TODO: Write tests for this function.
export const importFilesFromDirectory = async (directory: string) => {
  try {
    const files = await fs.readdir(directory, { recursive: true })
    const filteredFiles = files.filter((file) => file.endsWith('.ts') || file.endsWith('.ts'))

    for (const file of filteredFiles) {
      const filePath = path.join(directory, file)
      const resolvedPath = path.resolve(filePath)
      await import(resolvedPath)
    }
  } catch (error) {
    console.error('Error reading directory:', error)
  }
}
