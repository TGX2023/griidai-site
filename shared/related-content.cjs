const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PRODUCTS=require('./product-pages.json');
function normalizeRelated(value){
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>6)throw Error('Select up to six related pages.');
 const seen=new Set();return value.map(ref=>{
  if(!ref||!['use-case','blog','page'].includes(ref.kind)||typeof ref.id!=='string'||!(/^[a-zA-Z0-9_-]{1,100}$/).test(ref.id))throw Error('Select related content from the list.');
  if(ref.kind==='page'&&!PRODUCTS.some(p=>p.id===ref.id))throw Error('This product page is unavailable.');
  const key=ref.kind+':'+ref.id;if(seen.has(key))throw Error('Each related page can be selected once.');seen.add(key);return{kind:ref.kind,id:ref.id};
 });
}
function resolveRelated(record,catalog=[]){
 let refs=[];try{refs=normalizeRelated(record.seo?.related);}catch{return [];}
 return refs.flatMap(ref=>{
  const found=ref.kind==='page'?PRODUCTS.find(p=>p.id===ref.id):catalog.find(p=>(p.contentType==='blog'?'blog':'use-case')===ref.kind&&p.documentId===ref.id&&p.publishedAt);
  return found&&found.detailUrl!==record.detailUrl?[found]:[];
 });
}
function relatedHTML(record,catalog=[]){
 const list=resolveRelated(record,catalog);if(!list.length)return '';
 return `<section class="container cms-related-content" aria-labelledby="related-content-heading"><h2 id="related-content-heading">Explore related content</h2><ul>${list.map(r=>`<li><a href="${esc(r.detailUrl)}">${esc(r.name)} <span aria-hidden="true">↗</span></a>${r.summary?`<p>${esc(r.summary)}</p>`:''}</li>`).join('')}</ul></section>`;
}
module.exports={PRODUCTS,normalizeRelated,resolveRelated,relatedHTML};
