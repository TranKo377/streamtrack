// Fonction serverless Netlify : relaie les appels vers TMDB sans jamais exposer
// la clé API au navigateur du visiteur. La clé vit uniquement ici, côté serveur,
// lue depuis une variable d'environnement (jamais écrite en dur dans le code).

exports.handler = async function (event) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;

  if (!TMDB_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TMDB_API_KEY manquante côté serveur (variable d\'environnement non configurée).' })
    };
  }

  const params = event.queryStringParameters || {};
  const { path, ...rest } = params;

  if (!path) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Paramètre "path" manquant.' }) };
  }

  const url = new URL('https://api.themoviedb.org/3' + path);
  url.searchParams.set('api_key', TMDB_API_KEY);
  Object.entries(rest).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // petit cache 5 min, réduit le nombre d'appels à TMDB
      },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Erreur en contactant TMDB.' }) };
  }
};
