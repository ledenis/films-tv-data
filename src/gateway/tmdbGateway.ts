import { config } from '../config'

interface TmdbSearchResponse {
  results: [
    {
      id: number
    }
  ]
}

export async function searchTmdbMovie(title: string): Promise<TmdbSearchResponse> {
  const searchParams = new URLSearchParams({
    language: 'fr-FR',
    query: title,
  }).toString()
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${config.TMDB_API_TOKEN}`,
    },
  })
  if (!res.ok) {
    console.log(`Failed to search movies from TMDB for title ${title} - ${res.status}`)
    throw new Error(`Failed to search movies from TMDB for title ${title} - ${res.status}`)
  }
  const json = (await res.json()) as TmdbSearchResponse
  console.log('json', json)
  return json
}

interface TmdbByIdResponse {
  title: string
}

export async function getTmdbMovieById(id: number): Promise<TmdbByIdResponse> {
  const searchParams = new URLSearchParams({
    language: 'en-US',
  }).toString()
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${config.TMDB_API_TOKEN}`,
    },
  })
  if (!res.ok) {
    console.log(`Failed to get movie by ID from TMDB for ID ${id} - ${res.status}`)
    throw new Error(`Failed to get movie by ID from TMDB for ID ${id} - ${res.status}`)
  }
  const json = (await res.json()) as TmdbByIdResponse
  console.log('json', json)
  return json
}

export async function getEnglishTitle(title: string): Promise<string | undefined> {
  const searchResponse = await searchTmdbMovie(title)

  if (!searchResponse.results.length) {
    console.log(`Cannot find english title of ${title}: no result while searching for this title`)
    return undefined
  }
  if (searchResponse.results.length > 1) {
    console.log(`Warning: found multiple results for ${title}, we only take the first one...`, searchResponse.results)
  }

  const id = searchResponse.results[0].id

  const movieDetail = await getTmdbMovieById(id)

  return movieDetail.title
}
