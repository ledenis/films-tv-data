Films TV data
============

Gather data of movies from french TV programmes with critics ratings

Data sources:
* [XML TV Fr](https://xmltvfr.fr/): to get TV programmes of french channels
* [TMDb API](https://developer.themoviedb.org/): to get english titles (needed for OMDb API)
* [OMDb API](https://www.omdbapi.com/): to get critics ratings (IMDb and Rotten Tomatoes ratings)


## Dev

1. Copy `.env.local.example` to `.env.local` and replace the values:
  * For `TMDB_API_TOKEN`: Get an API access token from [TMDb](https://developer.themoviedb.org/docs/getting-started)
  * For `OMDB_API_KEY`: Get an API key [OMDb](https://www.omdbapi.com/apikey.aspx)

2. Install

```
npm install
```

3. Start

```
npm run start
```

## Prod

```
npm run start:prod
```

## License

MIT
