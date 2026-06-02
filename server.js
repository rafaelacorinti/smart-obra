const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const app = next({ dir: __dirname, dev: false });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Smart Obra running on port ${port}`);
  });
});
