import fsPromises from 'fs/promises'
import * as omdbGateway from './gateway/omdbGateway'
import type { RatingsInfo } from './gateway/omdbGateway'
import * as tmdbGateway from './gateway/tmdbGateway'
import { doAllSequentually, ensureDirectoryExists } from './utils'
import { getProgrammesMovies } from './gateway/xmltvGateway'
import type { Programme } from './gateway/xmltvGateway'
import dayjs from 'dayjs'

type ProgrammeWithRatings = Programme & { ratingsInfo: RatingsInfo }

async function main() {
  let movies: Programme[] = await getProgrammesMovies()

  const moviesPromiseFns = movies.map((movie) => async (): Promise<ProgrammeWithRatings> => {
    console.log('movie.title', movie.title)

    // englishTitle needed for omdb
    const englishTitle = await tmdbGateway.getEnglishTitle(movie.title)
    console.log('englishTitle', englishTitle)

    const ratingsInfo = await omdbGateway.getRatingsInfo(englishTitle ?? movie.title)
    console.log('ratingsInfo', ratingsInfo)
    const movieWithRatings: ProgrammeWithRatings = {
      ...movie,
      ratingsInfo,
    }
    return movieWithRatings
  })
  const moviesWithRatings = await doAllSequentually(moviesPromiseFns)
  console.log('moviesWithRatings', moviesWithRatings)

  const resultJson = JSON.stringify({
    lastUpdateDateTime: dayjs().toISOString(),
    movies: moviesWithRatings,
  })

  const resultFilePath = 'out/movies.json'
  ensureDirectoryExists(resultFilePath)
  fsPromises.writeFile(resultFilePath, resultJson)
}

main()
  .then(() => console.log('done'))
  .catch((err) => console.log('Failed', err))
