import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import { text } from 'stream/consumers'
import fs from 'fs'
import fsPromises from 'fs/promises'
import { XMLParser } from 'fast-xml-parser'
import { createGunzip } from 'zlib'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ensureDirectoryExists } from '../utils'

dayjs.extend(customParseFormat)

interface XmlTvResponse {
  tv: {
    channel: any[]
    programme: any[]
  }
}

interface ProgrammeXml {
  title: {
    '#text': string
  }
  credits?: {
    director: string[]
  }
  category: { '#text': string }[]
  icon: {
    '@_src': string
  }
  '@_start': string
  '@_stop': string
  '@_channel': string
}

export interface Programme {
  title: string
  directors: string[]
  categories: string[]
  iconUrl: string
  startDateTime: string
  stopDateTime: string
  channelId: string
}

function mapProgramme(programme: ProgrammeXml): Programme {
  console.log('programme', programme)
  const dateFormat = 'YYYYMMDDHHmmss ZZ' // 20241208005000 +0100
  // TODO: use strict mode when this is fixed: https://github.com/iamkun/dayjs/issues/2797
  const startDateTime = dayjs(programme['@_start'], dateFormat).toISOString()
  const stopDateTime = dayjs(programme['@_stop'], dateFormat).toISOString()

  return {
    title: programme.title['#text'],
    directors: programme.credits?.director ?? [],
    categories: programme.category.map((cat) => cat['#text']),
    iconUrl: programme.icon['@_src'],
    startDateTime,
    stopDateTime,
    channelId: programme['@_channel'],
  }
}

function mapProgrammes(programmes: ProgrammeXml[]): Programme[] {
  return programmes.map(mapProgramme)
}

function isMovie(programme: Programme) {
  const filmCategories = [
    'Film',
    // "Film d'aventures",
    // "Film fantastique",
    // "Film policier",
    'Téléfilm',
    // "Téléfilm mélodramatique",
    // "Téléfilm d'aventures",
    'Science-fiction',
    'Action',
    'Drame',
  ]
  return filmCategories.some((filmCategory) => programme.categories[0].startsWith(filmCategory))
}

function getUniqueCategories(programmes: Programme[]) {
  const categoriesSet = new Set()
  programmes.forEach((programme) => {
    categoriesSet.add(programme.categories[0])
  })
}

const CACHE_PATH = './cache'
const XMLTV_CACHE_FILENAME = 'xmltv_tnt.xml.gz'

const alwaysArray = ['tv.programme.category', 'tv.programme.credits.director']

async function readGzipStream(gzipStream: Readable): Promise<string> {
  const unzippedStream = gzipStream.pipe(createGunzip())
  return await text(unzippedStream)
}

async function fetchXmltvGzOrReadFromCache(): Promise<string> {
  const xmlTvCacheFilePath = `${CACHE_PATH}/${XMLTV_CACHE_FILENAME}`
  if (fs.existsSync(xmlTvCacheFilePath)) {
    console.log(`File ${xmlTvCacheFilePath} already exists, reading it`)
    const xmltvCacheFileStream = fs.createReadStream(xmlTvCacheFilePath)
    return readGzipStream(xmltvCacheFileStream)
  }

  const res = await fetch('https://xmltvfr.fr/xmltv/xmltv_tnt.xml.gz')
  if (!res.body) {
    throw new Error('Failed to fetch xmltv file: empty response body')
  }
  const [readableStreamForCache, readableStreamForReturn] = res.body.tee()

  const readableForCache = Readable.fromWeb(readableStreamForCache as ReadableStream)
  const readableForReturn = Readable.fromWeb(readableStreamForReturn as ReadableStream)

  ensureDirectoryExists(xmlTvCacheFilePath)
  // write file in parallel without await
  fsPromises
    .writeFile(xmlTvCacheFilePath, readableForCache, { flag: 'wx' })
    .catch((err) => console.log('Failed to cache xmltv file', err))

  return readGzipStream(readableForReturn)
}

export async function getProgrammesMovies(): Promise<Programme[]> {
  const xmlString = await fetchXmltvGzOrReadFromCache()

  const xml: XmlTvResponse = new XMLParser({
    ignoreAttributes: false,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      if (alwaysArray.indexOf(jpath) !== -1) return true
      return false
    },
  }).parse(xmlString)
  const programmes = mapProgrammes(xml.tv.programme)
  console.log('getUniqueCategories(programmes)', getUniqueCategories(programmes))
  const movies = programmes.filter(isMovie)
  console.log('movies', movies)
  return movies
}
