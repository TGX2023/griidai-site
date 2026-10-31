const plain=node=>typeof node==='string'?node:node?.type==='text'?node.text:(node?.content||[]).map(plain).join(' ');
const excerpt=v=>{const s=String(v||'').replace(/\s+/g,' ').trim();if(s.length<=160)return s;const cut=s.slice(0,159),space=cut.lastIndexOf(' ');return cut.slice(0,space>104?space:159)+'…';};
const safeLink=value=>{if(typeof value!=='string'||/[\x00-\x20\\]/.test(value))return false;try{const u=new URL(value,'https://griidai.com');return ['http:','https:','mailto:'].includes(u.protocol)&&!u.username&&!u.password&&!/^\/(industries|workflows)(?:\/|\.html|$)/i.test(decodeURIComponent(u.pathname));}catch{return false;}};
const normalize=v=>String(v||'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
function documentNodes(data){return[data.body,data.summaryFormatting,...(data.parts||[]).map(p=>p.content),...(data.inputs||[]).map(p=>p.content),...(data.steps||[]).map(p=>p.content),...(data.outputs||[]).map(p=>p.content),...(data.review||[]).map(p=>p.content)];}
function inspect(data){
 const links=[],headings=[];
 const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='heading')headings.push({level:node.attrs?.level,text:plain(node)});for(const m of node.marks||[])if(m.type==='link'&&typeof m.attrs?.href==='string')links.push(m.attrs.href);for(const n of node.content||[])walk(n);};
 documentNodes(data).forEach(walk);
 if(data.sourceUrl)links.push(data.sourceUrl);
 return{links:[...new Set(links)].slice(0,60),headings};
}
function audit(data,{kind='use-case',documentId='',catalog=[],catalogLoaded=false}={}){
 const items=[],add=(id,level,message)=>items.push({id,level,message});
 const title=String(data.title||'').trim(),slug=String(data.slug||'').trim(),seoTitle=String(data.seo?.title||title+(title?' | GriidAi':'')).trim(),description=String(data.seo?.description||excerpt(data.summary||documentNodes(data).map(plain).join(' '))).trim();
 add('title',title?'pass':'issue',title?'Page title is present.':'Add a clear page title that describes the subject.');
 add('slug',/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)?'pass':'issue',/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)?'Page URL uses readable words and hyphens.':'Use a readable Page URL with lowercase words separated by hyphens.');
 if(slug.length>80)add('slug-length','advice','Consider shortening the URL while keeping its meaning.');
 add('search-title',!seoTitle?'issue':seoTitle.length>60?'advice':'pass',!seoTitle?'Add a search title.':seoTitle.length>60?'Search title may be shortened in results. Around 50–60 characters is editing guidance, not a Google limit.':'Search title is present; keep it clear and specific.');
 add('description',!description?'issue':description.length<70||description.length>180?'advice':'pass',!description?'Add a specific summary for this page.':description.length<70||description.length>180?'Review the search description for a useful, concise summary. Around 140–160 characters is guidance, not a requirement.':'Search description is present. Search engines may choose other text.');
 const cover=Array.isArray(data.cover)?data.cover[0]:data.cover;
 add('cover',cover?'pass':'advice',cover?'A page cover is selected.':data.mediaType==='video'&&data.videoUrl?'Save to import the YouTube cover, then review it.':'Choose a page cover. Sharing uses it unless another image is selected.');
 if(cover&&!String(data.coverAlt||'').trim())add('cover-alt','issue','Describe the cover image for readers who cannot see it.');
 const images=(data.parts||[]).filter(p=>p.image);const missing=images.filter(p=>!String(p.imageAlt||'').trim()).length;
 add('image-alt',missing?'issue':'pass',missing?`${missing} content image(s) need an image description.`:'Content image descriptions are complete.');
 const {links,headings}=inspect(data);
 add('headings',headings.length?'pass':'advice',headings.length?'Content uses meaningful subheadings.':'Use subheadings to organize the explanation; changing font size alone does not create a heading.');
 if(headings.some((h,i)=>h.level>(i?headings[i-1].level:1)+1))add('heading-order','advice','Review skipped heading levels. A main section normally starts with Heading 2.');
 const blocked=links.filter(href=>!safeLink(href));if(blocked.length)add('unsafe-links','issue','Remove unsupported links. Industries and Workflows links are unavailable.');
 add('links',links.length?'pass':'advice',links.length?'Contextual links are included; check their destinations before publishing.':'Add a useful source or a relevant internal link where it helps the reader.');
 if(!(data.seo?.related||[]).length)add('related','advice','Select relevant related content when it adds value. There is no required number.');
 add('focus',normalize(data.seo?.focusPhrase)?'pass':'advice',normalize(data.seo?.focusPhrase)?'A target search phrase is recorded for editorial planning. Use natural language, not repeated keywords.':'Record the reader’s likely search phrase to guide the article. This is not a meta-keywords tag.');
 if(catalogLoaded){
  const others=catalog.filter(r=>!(r.kind===kind&&r.documentId===documentId));
  if(slug&&others.some(r=>r.kind===kind&&normalize(r.slug)===normalize(slug)))add('duplicate-slug','issue','This Page URL is already used by another entry. Choose another before saving.');
  if(title&&others.some(r=>normalize(r.title)===normalize(title)))add('duplicate-title','advice','Another entry uses this page title. Make the topic or scope distinctive.');
  if(seoTitle&&others.some(r=>normalize(r.seo?.title||r.title+' | GriidAi')===normalize(seoTitle)))add('duplicate-seo-title','advice','Another entry uses this search title. Consider making it more specific.');
  if(description&&others.some(r=>normalize(r.seo?.description||excerpt(r.summary))===normalize(description)))add('duplicate-description','advice','Another entry uses this search description. Write a summary specific to this page.');
 }else add('duplicates-pending','note','Duplicate checks are unavailable until the content list loads. They cover entries you are permitted to read.');
 return items;
}
export {audit,inspect,documentNodes};
