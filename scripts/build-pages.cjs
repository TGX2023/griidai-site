const fs = require('node:fs');
const path = require('node:path');
const project = path.resolve(__dirname, '..');
const source = path.join(project, 'dist');
const output = path.join(project, '.deploy');
const baseInput = process.env.PAGES_BASE_PATH ?? '/moh_web';
const basePath = baseInput === '' || baseInput === '/' ? '/' : '/' + baseInput.replace(/^\/+|\/+$/g, '') + '/';
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw new Error('Invalid Pages base path');
const siteUrl = (process.env.PAGES_SITE_URL || 'https://abdelrahmanembaby-oss.github.io/moh_web').replace(/\/$/, '');
if (!/^https:\/\/[^\s]+$/.test(siteUrl)) throw new Error('Invalid Pages site URL');
if (output !== path.resolve(project, '.deploy') || !output.startsWith(project + path.sep)) throw new Error('Unsafe output path');
fs.rmSync(output, {recursive:true,force:true});
fs.cpSync(source, output, {recursive:true});
const oldOrigin = 'https://griidai-homepage-review.griidai-9992.chatgpt.site';
let processed = 0;
function walk(folder) {
  for (const entry of fs.readdirSync(folder, {withFileTypes:true})) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) {walk(file);continue;}
    if (!/\.(html|css|js|json|xml)$/.test(entry.name)) continue;
    let text = fs.readFileSync(file, 'utf8');
    text = text.replaceAll(oldOrigin, siteUrl);
    text = text.replace(/(["'`])\/(?!\/)/g, (_, quote) => quote + basePath);
    text = text.replace(/(\b(?:srcset|imagesrcset)\s*=\s*)(["'])(.*?)\2/g, (_, name, quote, value) => {
      const rewritten = value.split(',').map(item => item.trim().replace(/^\/(?!\/)/, (slash) => item.trim().startsWith(basePath) ? slash : basePath)).join(', ');
      return name + quote + rewritten + quote;
    });
    text = text.replace(/url\(\s*(\/(?!\/)[^)]*)\)/g, (_, value) => 'url(' + basePath + value.slice(1) + ')');
    fs.writeFileSync(file, text);
    processed++;
  }
}
walk(output);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
// Verify emitted page links and assets before uploading the artifact.
let references = 0;
const routes=[];
function findPages(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())findPages(file);else if(item.name.endsWith('.html')){const relative=path.relative(output,file).replaceAll('\\','/');routes.push(relative==='index.html'?'':relative.endsWith('/index.html')?relative.slice(0,-11):relative);}}}
findPages(output);
for (const route of routes) {
  const file = route.endsWith('.html') ? path.join(output, route) : path.join(output, route, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const links = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map(match => match[1]);
  const sources = [...html.matchAll(/\b(?:srcset|imagesrcset)=["']([^"']+)["']/g)].flatMap(match => match[1].split(',').map(item => item.trim().split(/\s+/)[0]));
  for (const href of [...links, ...sources]) {
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const parsed = new URL(href, 'https://preview.invalid' + basePath + (route.endsWith('.html') ? route : route ? route + '/' : ''));
    if (!parsed.pathname.startsWith(basePath)) throw new Error('Path escapes Pages base: ' + href);
    const relative = decodeURIComponent(parsed.pathname.slice(basePath.length));
    let target = path.join(output, relative);
    if (!fs.existsSync(target)) throw new Error('Missing deployed file: ' + href);
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) throw new Error('Missing deployed index: ' + href);
    if (parsed.hash && target.endsWith('.html')) {
      const targetHtml = fs.readFileSync(target, 'utf8');
      const id = decodeURIComponent(parsed.hash.slice(1));
      if (!targetHtml.includes('id="' + id + '"') && !targetHtml.includes("id='" + id + "'")) throw new Error('Missing deployed anchor in ' + route + ': ' + href);
    }
    references++;
  }
}
console.log(`Prepared ${processed} text files for ${siteUrl}/; verified ${references} local references.`);
