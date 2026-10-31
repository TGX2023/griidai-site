const {esc,safeLink,doc,plain} = require('./content.cjs');
const BRAND = '#287b8d';
const POSITIONS = ['right','left','top','bottom'];
const ALIGNS = ['left','center','right','justify'];
const fontSize = value => Number.isInteger(Number(value)) && +value >= 12 && +value <= 64 ? +value : null;
function partDoc(value) {
 let count=0,total=0;
 const clean=(node,depth=0)=>{
  if(!node||typeof node!=='object'||depth>20||++count>10000)throw Error('Part text is too large or invalid.');
  if(node.type==='text') {
   const text=String(node.text||'');total+=text.length;if(total>100000)throw Error('Part text is too long.');
   const marks=(Array.isArray(node.marks)?node.marks:[]).flatMap(mark=>{
    if(['bold','italic','underline','strike','highlight','subscript','superscript'].includes(mark.type))return [{type:mark.type}];
    if(mark.type==='link') {const href=safeLink(mark.attrs?.href);return href?[{type:'link',attrs:{href}}]:[];}
    if(mark.type==='partStyle') {const attrs={fontSize:fontSize(mark.attrs?.fontSize),brand:mark.attrs?.brand===true};return attrs.fontSize||attrs.brand?[{type:'partStyle',attrs}]:[];}
    return [];
   });
   return {type:'text',text,...(marks.length?{marks}:{})};
  }
  if(['hardBreak','horizontalRule'].includes(node.type))return {type:node.type};
  const type=['doc','paragraph','heading','bulletList','orderedList','listItem','blockquote','taskList','taskItem','table','tableRow','tableCell','tableHeader'].includes(node.type)?node.type:'paragraph';
  const attrs={};
  if(type==='heading')attrs.level=[2,3,4,5,6].includes(+node.attrs?.level)?+node.attrs.level:2;
  if(type==='taskItem')attrs.checked=node.attrs?.checked===true;
  if(type==='orderedList'&&Number.isInteger(node.attrs?.start)&&node.attrs.start>0&&node.attrs.start<=1000000)attrs.start=node.attrs.start;
  if(['tableCell','tableHeader'].includes(type))for(const key of ['colspan','rowspan'])attrs[key]=Number.isInteger(node.attrs?.[key])&&node.attrs[key]>0&&node.attrs[key]<=20?node.attrs[key]:1;
  if(['heading','paragraph'].includes(type)&&ALIGNS.includes(node.attrs?.textAlign))attrs.textAlign=node.attrs.textAlign;
  return {type,...(Object.keys(attrs).length?{attrs}:{}),content:(Array.isArray(node.content)?node.content:[]).map(n=>clean(n,depth+1))};
 };
 const result=clean(value||{type:'doc',content:[]});if(result.type!=='doc')throw Error('Part content must be a document.');return result;
}
function legacyParts(question,overview) {
 const content=[];
 if(question)content.push({type:'heading',attrs:{level:2},content:[{type:'text',text:String(question)}]});
 if(overview)content.push(...doc(overview).content);
 return content.length?[{id:'original-introduction',content:{type:'doc',content},placement:'above-video',image:null,imagePosition:'right',imageWidth:40,imageAlt:''}]:[];
}
function mediaURL(value,publicURL) {
 if(typeof value!=='string'||/[\x00-\x20\\]/.test(value))return '';
 try {const u=new URL(value,publicURL);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}
}
function normalizeParts(value,{publicURL}={}) {
 if(!Array.isArray(value)||value.length>40)throw Error('Use up to 40 content parts.');
 const ids=new Set();
 return value.map((part,i)=>{
  if(!part||typeof part!=='object')throw Error('Invalid content part.');
  const id=typeof part.id==='string'&&/^[\w-]{1,100}$/.test(part.id)?part.id:'part-'+i;
  if(ids.has(id))throw Error('Each content part needs a unique ID.');ids.add(id);
  const source=part.image;
  const image=source&&typeof source==='object'?{id:source.id,url:publicURL?mediaURL(source.url,publicURL):source.url,width:source.width,height:source.height,mime:source.mime}:null;
  return {id,content:partDoc(part.content),placement:part.placement==='below-video'?'below-video':'above-video',image,imageAlt:String(part.imageAlt||'').slice(0,500),imagePosition:POSITIONS.includes(part.imagePosition)?part.imagePosition:'right',imageWidth:Number.isFinite(+part.imageWidth)?Math.max(20,Math.min(100,Math.round(+part.imageWidth))):40};
 });
}
function partRich(value) {
 const walk=node=>{
  if(node.type==='text')return (node.marks||[]).reduce((s,m)=>{
   if(m.type==='bold')return `<strong>${s}</strong>`;
   if(m.type==='italic')return `<em>${s}</em>`;
   if(m.type==='underline')return `<u>${s}</u>`;
   if(m.type==='strike')return `<s>${s}</s>`;
   if(m.type==='highlight')return `<mark class="uc-part-highlight">${s}</mark>`;
   if(m.type==='subscript')return `<sub>${s}</sub>`;
   if(m.type==='superscript')return `<sup>${s}</sup>`;
   if(m.type==='link')return `<a href="${esc(m.attrs.href)}" rel="noopener noreferrer">${s}</a>`;
   const classes=[m.attrs.fontSize?'uc-part-size':'',m.attrs.brand?'uc-part-brand':''].filter(Boolean).join(' ');
   return `<span class="${classes}"${m.attrs.fontSize?` style="--part-font-size:${m.attrs.fontSize}px"`:''}>${s}</span>`;
  },esc(node.text));
  if(node.type==='hardBreak')return '<br>';
  if(node.type==='horizontalRule')return '<hr>';
  const content=(node.content||[]).map(walk).join('');
  if(node.type==='table')return `<div class="uc-part-table" role="region" aria-label="Content table" tabindex="0"><table><tbody>${content}</tbody></table></div>`;
  if(node.type==='tableRow')return `<tr>${content}</tr>`;
  if(['tableCell','tableHeader'].includes(node.type)){const tag=node.type==='tableHeader'?'th':'td';return `<${tag} colspan="${node.attrs.colspan}" rowspan="${node.attrs.rowspan}">${content}</${tag}>`;}
  if(node.type==='taskList')return `<ul class="uc-part-checklist">${content}</ul>`;
  if(node.type==='taskItem')return `<li class="uc-part-task"><input type="checkbox" disabled aria-label="Checklist item"${node.attrs.checked?' checked':''}><div>${content}</div></li>`;
  const tag={paragraph:'p',heading:'h'+node.attrs?.level,bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote'}[node.type];
  return tag?`<${tag}${node.attrs?.textAlign?` class="uc-part-align-${node.attrs.textAlign}"`:''}${node.type==='orderedList'&&node.attrs?.start?` start="${node.attrs.start}"`:''}>${content}</${tag}>`:content;
 };
 return walk(partDoc(value));
}
function renderParts(value) {
 return normalizeParts(value).map(part=>{
  const url=mediaURL(part.image?.url,'https://griidai.com');
  const figure=url?`<figure class="uc-part-image"><img src="${esc(url)}" alt="${esc(part.imageAlt)}"${Number.isFinite(part.image.width)?` width="${part.image.width}"`:''}${Number.isFinite(part.image.height)?` height="${part.image.height}"`:''} loading="lazy" decoding="async"></figure>`:'';
  return `<article class="uc-content-part uc-part-${part.imagePosition}${figure?' uc-part-with-image':''}${part.imageWidth>75?' uc-part-wide':''}${!plain(part.content).trim()?' uc-part-image-only':''}" style="--part-image-width:${part.imageWidth}%"><div class="uc-part-copy">${partRich(part.content)}</div>${figure}</article>`;
 }).join('');
}
const hasPartContent = value => Array.isArray(value)&&value.some(part=>plain(part.content).trim()||part.image?.id);
module.exports={BRAND,fontSize,partDoc,legacyParts,normalizeParts,partRich,renderParts,mediaURL,hasPartContent};
