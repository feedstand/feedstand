import fs from 'node:fs/promises'
import path from 'node:path'

export const importFilesFromDirectory = async (directory: string, extensions: string[] = []) => {
    try {
        const files = await fs.readdir(directory)

        const filteredFiles = extensions.length
            ? files.filter((file) => extensions.some((extension) => file.endsWith(extension)))
            : files

        for (const file of filteredFiles) {
            console.log(path.join(directory, file))
            await import(path.join(directory, file))
        }
    } catch (error) {
        console.error('Error reading directory:', error)
    }
}
