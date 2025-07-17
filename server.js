const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const httpsPort = process.env.HTTPS_PORT || 3001;
const httpPort = process.env.HTTP_PORT || 3000;

const app = next({ dev, hostname, port: httpsPort });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates/cert.pem')),
};

app.prepare().then(() => {
  // HTTPS Server
  createHttpsServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(httpsPort, () => {
      console.log(`> Ready on https://${hostname}:${httpsPort}`);
    });

  // HTTP Server for redirects
  createHttpServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host.replace(httpPort, httpsPort)}${req.url}` });
    res.end();
  }).listen(httpPort, () => {
    console.log(`> HTTP redirect server running on http://${hostname}:${httpPort}`);
  });
}); 