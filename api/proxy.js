const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

const buildTargetUrl = req => {
  const origin = process.env.CHATWOOT_ORIGIN;

  if (!origin) {
    return null;
  }

  const normalizedOrigin = origin.replace(/\/$/, '');
  const incomingUrl = new URL(req.url, `https://${req.headers.host}`);
  return `${normalizedOrigin}${incomingUrl.pathname}${incomingUrl.search}`;
};

const readBody = req =>
  new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const proxyHeaders = req => {
  const headers = {};

  Object.entries(req.headers).forEach(([key, value]) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && value) {
      headers[key] = value;
    }
  });

  headers['x-forwarded-host'] = req.headers.host;
  headers['x-forwarded-proto'] = 'https';

  return headers;
};

const writeResponseHeaders = (res, upstreamResponse) => {
  upstreamResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key !== 'set-cookie') {
      res.setHeader(key, value);
    }
  });

  const cookies =
    upstreamResponse.headers.getSetCookie?.() ||
    upstreamResponse.headers.raw?.()['set-cookie'] ||
    [];

  if (cookies.length) {
    res.setHeader('set-cookie', cookies);
  }
};

module.exports = async (req, res) => {
  const targetUrl = buildTargetUrl(req);

  if (!targetUrl) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(
      'Defina CHATWOOT_ORIGIN nas variáveis de ambiente da Vercel apontando para a URL pública do seu Chatwoot.'
    );
    return;
  }

  try {
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders(req),
      body: hasBody ? await readBody(req) : undefined,
      redirect: 'manual',
    });

    res.statusCode = upstreamResponse.status;
    writeResponseHeaders(res, upstreamResponse);

    const body = Buffer.from(await upstreamResponse.arrayBuffer());
    res.end(body);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(`Falha ao acessar o Chatwoot de origem: ${error.message}`);
  }
};
