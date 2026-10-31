const {esc}=require('./content.cjs');
const tagKey=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
function normalizeTags(value){
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>12)throw Error('Add up to twelve tags.');
 const result=[],seen=new Set();for(const item of value){
  if(typeof item!=='string')throw Error('Use text for each tag.');const tag=item.normalize('NFKC').trim().replace(/\s+/g,' ');
  if(!tag)continue;if(tag.length>50||/[<>\x00-\x1f\x7f]/.test(tag))throw Error('Each tag must be plain text, up to 50 characters.');
  const key=tagKey(tag);if(!seen.has(key)){seen.add(key);result.push(tag);}
 }return result;
}
function filterByTag(records,value){const key=tagKey(value);return key?records.filter(r=>normalizeTags(r.tags).some(tag=>tagKey(tag)===key)):records;}
function tagsHTML(record){
 const tags=normalizeTags(record.tags);if(!tags.length)return '';
 const base=record.contentType==='blog'||record.detailUrl?.startsWith('/blogs/')?'/blogs/':'/use-cases/';
 return `<div class="content-tags" aria-label="Tags">${tags.map(tag=>`<a class="content-tag" href="${base}?tag=${encodeURIComponent(tagKey(tag))}" aria-label="Show ${esc(tag)} ${base==='/blogs/'?'articles':'use cases'}">${esc(tag)}</a>`).join('')}</div>`;
}
function tagFilterHTML(records,selected,{base='/use-cases/'}={}){
 const tags=new Map();for(const r of records)for(const tag of normalizeTags(r.tags))if(!tags.has(tagKey(tag)))tags.set(tagKey(tag),tag);
 const active=tagKey(selected).slice(0,200);if(!tags.size&&!active)return '';
 const id=base==='/blogs/'?'blog-tag-filter':'use-case-tag-filter';
 return `<form class="cms-tag-filter" action="${base}" method="get"><label for="${id}">Filter by tag</label><select id="${id}" name="tag"><option value=""${!active?' selected':''}>All tags</option>${active&&!tags.has(active)?`<option value="${esc(active)}" selected>${esc(String(selected).slice(0,200))}</option>`:''}${[...tags].sort((a,b)=>a[1].localeCompare(b[1])).map(([key,tag])=>`<option value="${esc(key)}"${key===active?' selected':''}>${esc(tag)}</option>`).join('')}</select><button type="submit">Apply filter</button>${active?`<a href="${base}">Clear filter</a>`:''}</form>`;
}
module.exports={tagKey,normalizeTags,filterByTag,tagsHTML,tagFilterHTML};
