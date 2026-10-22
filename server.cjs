const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405); return res.end();}
  let target;
  try {target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));} catch {res.writeHead(400); return res.end();}
  if (target !== root && !target.startsWith(root + path.sep)) {res.writeHead(403); return res.end();}
  try {
    if(fs.statSync(target).isDirectory()) target = path.join(target,'index.html');
    if(!fs.statSync(target).isFile()) throw new Error('Not a file');
    res.writeHead(200, {'Content-Type':mime[path.extname(target)] || 'application/octet-stream'});
    if(req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(target); stream.on('error',()=>res.destroy()); stream.pipe(res);
  } catch {res.writeHead(404);res.end('Page not found');}
});
server.on('error', error => {console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Set PORT to another number.` : error.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>console.log(`GriidAi: http://localhost:${port}\nPress Ctrl+C to stop.`));
