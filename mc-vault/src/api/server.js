const http = require('http');
const util = require('minecraft-server-util');

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // URL structure: /api/ping?host=example.com&port=25565
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/api/ping' && req.method === 'GET') {
    const host = url.searchParams.get('host');
    const port = parseInt(url.searchParams.get('port')) || 25565;

    // Basic validation: ensure host is a valid domain/IP pattern and not an internal address
    const hostRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$|^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
    if (!host || !hostRegex.test(host)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid or missing host address' }));
    }

    if (port < 1 || port > 65535) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid port number' }));
    }

    try {
      const response = await util.status(host, port);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          version: response.version,
          players: response.players.online,
          maxPlayers: response.players.max,
          motd: response.motd.clean
        }
      }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Server ping failed', details: err.message }));
    }
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

server.listen(3000, () => console.log('API running on port 3000'));
