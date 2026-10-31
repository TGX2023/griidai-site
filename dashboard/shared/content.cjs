const crypto = require('node:crypto');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeLink(value) {
  if (typeof value !== 'string' || /[\x00-\x20\\]/.test(value)) return null;
  try {
    const u = new URL(value, 'https://griidai.com');
    if (!['https:', 'http:', 'mailto:'].includes(u.protocol) || u.username || u.password) return null;
    if (/^\/(industries|workflows)(?:\/|\.html|$)/i.test(decodeURIComponent(u.pathname))) return null;
    return value;
  } catch { return null; }
}
function doc(value) {
  if (typeof value === 'string') value = [value];
  if (Array.isArray(value)) return {type:'doc',content:value.map(text=>({type:'paragraph',content:[{type:'text',text:String(text)}]}))};
  let size = 0;
  function clean(node, depth=0) {
    if (!node || typeof node !== 'object' || depth > 20 || ++size > 10000) throw new Error('Invalid or oversized rich text');
    if (node.type === 'text') {
      const result = {type:'text',text:String(node.text || '').slice(0,30000)};
      const marks = (node.marks || []).flatMap(mark => {
        if (['bold','italic'].includes(mark.type)) return [{type:mark.type}];
        const href = mark.type === 'link' && safeLink(mark.attrs?.href);
        return href ? [{type:'link',attrs:{href}}] : [];
      });
      if (marks.length) result.marks = marks;
      return result;
    }
    if (node.type === 'hardBreak') return {type:'hardBreak'};
    if (!['doc','paragraph'].includes(node.type)) return {type:'paragraph',content:(node.content || []).map(n=>clean(n,depth+1))};
    return {type:node.type,content:(node.content || []).map(n=>clean(n,depth+1))};
  }
  const result = clean(value || {type:'doc',content:[]});
  if (result.type !== 'doc') throw new Error('Rich text must be a document');
  return result;
}
function plain(value) {
  if (typeof value === 'string') return value;
  const walk = node => node?.type === 'text' ? node.text : (node?.content || []).map(walk).join(node?.type === 'doc' ? '\n' : '');
  return walk(value);
}
function rich(value) {
  const walk = node => {
    if (node.type === 'text') return (node.marks || []).reduce((s,m)=>m.type==='bold'?`<strong>${s}</strong>`:m.type==='italic'?`<em>${s}</em>`:`<a href="${esc(m.attrs.href)}" rel="noopener noreferrer">${s}</a>`,esc(node.text));
    if (node.type === 'hardBreak') return '<br>';
    const s = (node.content || []).map(walk).join('');
    return node.type === 'paragraph' ? `<p>${s}</p>` : s;
  };
  return walk(doc(value));
}
function youtubeId(value) {
  try {
    const u = new URL(value);
    if (!['https:','http:'].includes(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./,'');
    const id = host === 'youtu.be' ? u.pathname.slice(1) : ['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host) ? u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1] : null;
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
function slugify(value) { return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100); }
function sign(id, expires, secret) { return crypto.createHmac('sha256',secret).update(`${id}:${expires}`).digest('hex'); }
function validSignature(id, expires, signature, secret, now=Date.now()) {
  if (!secret || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !/^\d+$/.test(String(expires)) || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  if (+expires < now || +expires > now + 16*60*1000) return false;
  return crypto.timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(sign(id,expires,secret),'hex'));
}
module.exports = {esc,safeLink,doc,plain,rich,youtubeId,slugify,sign,validSignature};
