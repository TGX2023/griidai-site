'use strict';
const {doc,plain,youtubeId,slugify}=require('../../shared/content.cjs');
const {errors}=require('@strapi/utils');
const UID='api::use-case.use-case';
const {isSuperAdmin,assertRepeatableChanges}=require('./admin-access');
const {prepareParts,legacyParts,hasPartContent}=require('./content-parts');
const {pageOrder}=require('../../shared/page-order.cjs');
const {normalizeSEO,normalizeUseCaseEditorial}=require('../../shared/seo.cjs');
const bad=message=>{throw new errors.ValidationError(message);};
const fields=['title','classification','summary','question','coverAlt','videoTitle'];
const lists=['inputs','steps','outputs','review'];
function relationId(value){if(!value)return null;if(Array.isArray(value))return relationId(value[0]);if(typeof value==='number')return value;if(value.id)return value.id;return value.connect?.[0]?.id||value.set?.[0]?.id||null;}
module.exports={UID,relationId,register(strapi){
 strapi.documents.use(async(context,next)=>{
  if(context.uid!==UID||!['create','update','publish'].includes(context.action))return next();
  const p=context.params;const existing=p.documentId?await strapi.documents(UID).findOne({documentId:p.documentId,status:'draft',populate:['cover','renderedCover','sharingImage',...lists,'topics']}):null;
  const published=p.documentId?await strapi.documents(UID).findOne({documentId:p.documentId,status:'published'}):null;
  const data=p.data||{};const merged={...existing,...data};
  try{if(Object.hasOwn(data,'tags'))data.tags=require('../../shared/tags.cjs').normalizeTags(data.tags);}catch(error){bad(error.message);}
  try{require('../../shared/intro-formatting.cjs').synchronizeIntro(data,existing||{});}catch(error){bad(error.message);}
  try{if(Object.hasOwn(data,'seo'))data.seo=normalizeSEO(data.seo);if(Object.hasOwn(data,'editorial'))data.editorial=normalizeUseCaseEditorial(data.editorial);}catch(error){bad(error.message);}
  if(Object.hasOwn(data,'sharingImage')&&data.sharingImage){const imageId=relationId(data.sharingImage);const media=imageId?await strapi.db.query('plugin::upload.file').findOne({where:{id:imageId}}):null;if(!media||!/^image\/(jpeg|png|webp|gif|avif)$/.test(media.mime))bad('Choose a JPG, PNG, WebP, GIF or AVIF sharing image from the Media Library.');}
  const request=strapi.requestContext.get();
  if(context.action==='update'&&request)assertRepeatableChanges(existing,data,isSuperAdmin(request));
  if(existing?.publishedSlug||published){const locked=existing?.publishedSlug||published.slug;if(data.slug&&data.slug!==locked)bad('The URL is locked after first publication. A URL change requires a redirect migration.');if(context.action==='update')data.publishedSlug=locked;}
  if(context.action==='create')data.slug=data.slug||slugify(data.title);
  if(context.action==='create'&&data.parts==null&&(data.question||data.overview))data.parts=legacyParts(data.question,data.overview);
  // An untouched native JSON field submits null when saving an incomplete draft.
  if(Object.hasOwn(data,'parts')){try{data.parts=await prepareParts(strapi,data.parts??[]);}catch(error){bad(error.message);}}
  if(Object.hasOwn(data,'contentOrder')||Object.hasOwn(data,'parts')){try{data.contentOrder=pageOrder(data.parts??existing?.parts??[],data.contentOrder??existing?.contentOrder,{isVideo:(data.mediaType??existing?.mediaType)!=='image'});}catch(error){bad(error.message);}}
  if(data.slug&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))bad('Use a lowercase URL containing letters, numbers and hyphens.');
  if(data.slug){const conflict=await strapi.db.query(UID).findOne({where:{slug:data.slug,...(p.documentId?{documentId:{$ne:p.documentId}}:{})}});if(conflict)bad('This page URL is already used. Choose another URL.');}
  const reserved=require('../../shared/retired-routes.json');
  if(data.slug&&Object.hasOwn(reserved,data.slug))bad('This URL is reserved for an existing redirect.');
  for(const f of fields)if(data[f]!=null&&/<\/?[a-z][^>]*>/i.test(data[f]))bad(`${f}: enter plain text, not HTML.`);
  try{
   if(data.overview)data.overview=doc(data.overview);
   for(const f of lists)if(Array.isArray(data[f]))data[f]=data[f].map(item=>({...item,content:doc(item.content)}));
   if(Array.isArray(data.topics))data.topics=data.topics.map(item=>({...item,description:doc(item.description)}));
  }catch{bad('The text contains an invalid document or too much content.');}
  if(merged.videoUrl&&!youtubeId(merged.videoUrl))bad('Enter a valid YouTube video link.');
  if(data.coverFocus){const {x,y,zoom=1}=data.coverFocus;if(![x,y].every(n=>Number.isFinite(n)&&n>=0&&n<=100))bad('Cover focus must be between 0 and 100.');if(!Number.isFinite(zoom)||zoom<1||zoom>3)bad('Cover zoom must be between 1 and 3.');}
  if(context.action!=='publish')await require('./use-case-media').prepare(strapi,data,existing);
  if(context.action==='publish'||p.status==='published'){
   const complete={...existing,...data};
   try{normalizeUseCaseEditorial(complete.editorial);normalizeSEO(complete.seo);}catch(error){bad(error.message);}
   for(const f of ['title','classification','summary','slug','coverAlt'])if(!String(complete[f]||'').trim())bad(`Complete ${f} before publishing.`);
   if(!hasPartContent(complete.parts??legacyParts(complete.question,complete.overview)))bad('Add text or an image in at least one content part before publishing.');
   for(const f of lists)if(!complete[f]?.length||complete[f].some(item=>!plain(item.content).trim()))bad(`Add non-empty ${f} before publishing.`);
   if(!relationId(complete.cover)||!relationId(complete.renderedCover))bad('Save a valid cover before publishing.');
   if(complete.mediaType==='video'&&!youtubeId(complete.videoUrl))bad('A YouTube link is required for video content.');
   if(context.action==='publish'&&!existing?.publishedSlug)await strapi.db.query(UID).update({where:{id:existing.id},data:{publishedSlug:existing.slug}});
   else if(p.status==='published')data.publishedSlug=complete.slug;
  }
  return next();
 });
}};
