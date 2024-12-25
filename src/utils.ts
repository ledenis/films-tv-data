import fs from 'fs'
import path from 'path'

export function ensureDirectoryExists(filePath: string) {
  var dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  fs.mkdirSync(dirname, { recursive: true })
}

export async function doAllSequentually<T>(promiseFns: (() => Promise<T>)[]): Promise<T[]> {
  const arr: T[] = []
  for (const promiseFn of promiseFns) {
    const result = await promiseFn()
    arr.push(result)
  }
  return arr
}
