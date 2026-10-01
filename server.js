// 零依賴的小伺服器：提供網頁 + 讀寫 data.json
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const INDEX_FILE = path.join(__dirname, 'index.html');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { records: [] };
  }
}

function writeData(data) {
  // 先寫暫存檔再改名，避免寫到一半當機造成資料毀損
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

http
  .createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(INDEX_FILE));
    }
    const STATIC = { '/images.jpg': 'image/jpeg', '/icon.jpg': 'image/jpeg' };
    if (req.method === 'GET' && STATIC[req.url]) {
      res.writeHead(200, { 'Content-Type': STATIC[req.url], 'Cache-Control': 'max-age=86400' });
      return res.end(fs.readFileSync(path.join(__dirname, req.url)));
    }
    if (req.url === '/api/data') {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(readData()));
      }
      if (req.method === 'PUT') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!Array.isArray(data.records)) throw new Error('bad format');
            writeData(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{"ok":true}');
          } catch {
            res.writeHead(400);
            res.end('Bad request');
          }
        });
        return;
      }
    }
    res.writeHead(404);
    res.end('Not found');
  })
  .listen(PORT, () => console.log(`健身紀錄已啟動： http://localhost:${PORT}`));
