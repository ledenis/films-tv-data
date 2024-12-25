import { config } from '../config'

const ROTTEN_SOURCE = 'Rotten Tomatoes'

interface OmdbMovie {
  Title: string
  Year: string
  Ratings: {
    Source: string
    Value: string
  }[]
  Metascore: string
  imdbRating: string
  Response: 'True' | 'False'
  Error?: string
}

async function getMovieWithRatings(title: string): Promise<OmdbMovie> {
  const searchParams = new URLSearchParams({
    apikey: config.OMDB_API_KEY,
    t: title,
  }).toString()
  const res = await fetch(`https://www.omdbapi.com/?${searchParams}`)
  if (!res.ok) {
    console.log(`Failed to get movie from OMDb for title ${title} - ${res.status}`)
    throw new Error(`Failed to get movie from OMDb for title ${title} - ${res.status}`)
  }
  const json: OmdbMovie = await res.json()
  if (json.Response === 'False') {
    console.log(`Failed to get movie from OMDb for title ${title}, Response was False - ${json.Error}`)
    throw new Error(`Failed to get movie from OMDb for title ${title}, Response was False - ${json.Error}`)
  }
  console.log('json', json)
  return json
}

export interface RatingsInfo {
  /** out of 100 */
  rottenRating?: number
  /** out of 10 */
  imdbRating?: number
}

export async function getRatingsInfo(title: string): Promise<RatingsInfo> {
  let movie: OmdbMovie | undefined
  try {
    movie = await getMovieWithRatings(title)
  } catch (error) {
    console.log('Could not get ratings, returning empty ratings info', error)
    return {}
  }
  return formatRatingsInfo(movie)
}

function formatRatingsInfo(movie: OmdbMovie): RatingsInfo {
  return {
    rottenRating: formatRottenRating(movie),
    imdbRating: movie.imdbRating === 'N/A' ? undefined : parseFloat(movie.imdbRating),
  }
}

function formatRottenRating(movie: OmdbMovie): number | undefined {
  const rottenRating = movie.Ratings.find((rating) => rating.Source === ROTTEN_SOURCE)
  if (!rottenRating) {
    return undefined
  }
  return parseFloat(rottenRating.Value.replace('%', '')) // '80%' -> 80
}
