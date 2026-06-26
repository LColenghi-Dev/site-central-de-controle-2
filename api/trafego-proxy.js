export default async function handler(req, res) {
  const { _path = '', proxypath, ...query } = req.query

  const url = new URL(`https://trafego.marazulagenciadigital.com.br/${_path}`)
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.TRAFEGO_API_KEY) headers['Authorization'] = `Bearer ${process.env.TRAFEGO_API_KEY}`

  const init = { method: req.method, headers }
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    init.body = JSON.stringify(req.body)
  }

  try {
    const upstream = await fetch(url.toString(), init)
    const contentType = upstream.headers.get('content-type') || 'application/json'
    const body = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', contentType).send(body)
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', message: err.message })
  }
}
