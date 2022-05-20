let cache;

async function getConfig() {
  if (cache) return cache;

  const link = window.location.href;
  const configFileUrl = `${link}${link[link.length - 1] === '/' ? '' : '/'}config.json`;
  cache = await (await fetch(configFileUrl, { method: 'GET' })).json() ?? {};

  return cache;
}

export default getConfig;
