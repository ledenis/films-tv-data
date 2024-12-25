interface Config {
  TMDB_API_TOKEN: string
  OMDB_API_KEY: string
}

export const config: Config = {
  TMDB_API_TOKEN: process.env.TMDB_API_TOKEN as string,
  OMDB_API_KEY: process.env.OMDB_API_KEY as string,
}

function validateConfig() {
  if (!config.TMDB_API_TOKEN) {
    throw new Error('TMDB_API_TOKEN is required')
  }
  if (!config.OMDB_API_KEY) {
    throw new Error('OMDB_API_KEY is required')
  }
}

validateConfig()
