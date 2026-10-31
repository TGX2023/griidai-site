const {normalizeTags}=require('../shared/tags.cjs');
const {normalizeUseCaseEditorial}=require('../shared/seo.cjs');
const {plain,youtubeId}=require('../shared/content.cjs');
const {normalizeParts,legacyParts}=require('../shared/content-parts.cjs');
const fs=require('node:fs');const path=require('node:path');
const populated=['cover','renderedCover','sharingImage','inputs','steps','outputs','review'];
function createClient({url,token,publicUrl=url,fetcher=fetch,timeout=5000}){
 const origin=new URL(url);if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password)throw Error('Invalid STRAPI_URL');
 if(!token)throw Error('STRAPI_API_TOKEN is required on the website server.');
 async function request(params,id=''){
  const endpoint=new URL(`${origin.pathname.replace(/\/$/,'')}/api/use-cases${id?'/'+encodeURIComponent(id):''}`,origin.origin);
  for(const [key,value]of Object.entries(params))endpoint.searchParams.set(key,value);
  populated.forEach((p,i)=>endpoint.searchParams.set(`populate[${i}]`,p));
  const response=await fetcher(endpoint,{headers:{Authorization:`Bearer ${token}`,'Cache-Control':'no-cache'},cache:'no-store',signal:AbortSignal.timeout(timeout)});
  if(response.status===404)return null;
  if(!response.ok)throw Error('Content service unavailable');
  return response.json();
 }
 const mediaURL=value=>{if(!value)return '';const u=new URL(value,publicUrl);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';};
 function map(r){
  const m=r.renderedCover||r.cover;if(!m||!mediaURL(m.url))throw Error('Incomplete cover');
  const formats=Object.values(m.formats||{}).filter(f=>f.width&&f.url);formats.push(m);formats.sort((a,b)=>a.width-b.width);
  return {id:r.slug,documentId:r.documentId,featureOnHomepage:r.featureOnHomepage===true,homepageOrder:r.homepageOrder||0,name:r.title,tags:normalizeTags(r.tags),titleFormatting:r.titleFormatting,summaryFormatting:r.summaryFormatting,kind:r.classification,summary:r.summary,question:r.question,overview:r.overview,seo:r.seo,editorial:normalizeUseCaseEditorial(r.editorial),publishedAt:r.publishedAt,updatedAt:r.updatedAt,sharingImage:r.sharingImage?{url:mediaURL(r.sharingImage.url),width:r.sharingImage.width,height:r.sharingImage.height,mime:r.sharingImage.mime,alt:r.sharingImage.alternativeText}:null,parts:normalizeParts(r.parts??legacyParts(r.question,r.overview),{publicURL:publicUrl}),contentOrder:r.contentOrder,mediaType:r.mediaType,group:'demonstrations',publicationStatus:'Published',detailUrl:`/use-cases/${r.slug}/`,featured:r.showInSolutions,order:r.order,...Object.fromEntries(['inputs','steps','outputs','review'].map(f=>[f,(r[f]||[]).map(i=>i.content)])),cover:{url:mediaURL(m.url),srcset:formats.map(f=>`${mediaURL(f.url)} ${f.width}w`).join(', '),width:m.width,height:m.height,alt:r.coverAlt,mime:m.mime},video:r.mediaType==='video'?{id:youtubeId(r.videoUrl),url:`https://www.youtube.com/watch?v=${youtubeId(r.videoUrl)}`,title:r.videoTitle||r.title}:null};
 }
 return {async published(){
  const all=[];let page=1;let pageCount=1;
  do{const json=await request({status:'published','sort[0]':'order:asc','sort[1]':'slug:asc','pagination[page]':page,'pagination[pageSize]':100});if(!json||!Array.isArray(json.data))throw Error('Invalid content response');all.push(...json.data);pageCount=json.meta?.pagination?.pageCount||1;if(pageCount>1000)throw Error('Content pagination limit exceeded');page++;}while(page<=pageCount);
  return all.filter(r=>r.publishedAt).map(map);
 },async draft(id){const json=await request({status:'draft'},id);return json?.data?map(json.data):null;}};
}
module.exports={createClient};
