'use strict';
const UID='api::blog.blog';const {errors}=require('@strapi/utils');
const {slugify}=require('../../shared/content.cjs');const rules=require('../../shared/blog.cjs');const {normalizeSEO}=require('../../shared/seo.cjs');
module.exports={UID,register(strapi){strapi.documents.use(async(context,next)=>{
 if(context.uid!==UID||!['create','update','publish'].includes(context.action))return next();
 const p=context.params,data=p.data||{};
 const existing=p.documentId?await strapi.documents(UID).findOne({documentId:p.documentId,status:'draft',populate:['cover','renderedCover','sharingImage','authorPhoto']}):null;
 const published=p.documentId?await strapi.documents(UID).findOne({documentId:p.documentId,status:'published'}):null;
 try{
  require('../../shared/intro-formatting.cjs').synchronizeIntro(data,existing||{},'blog');
  rules.validate(data);if(Object.hasOwn(data,'seo'))data.seo=normalizeSEO(data.seo);
  if(context.action==='create')data.slug=data.slug||slugify(data.title);
  if(data.slug&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))throw Error('Use a lowercase URL containing letters, numbers and hyphens.');
  const locked=existing?.publishedSlug||published?.slug;
  if(locked){if(data.slug&&data.slug!==locked)throw Error('The URL is locked after first publication. Arrange a redirect before changing it.');if(context.action==='update')data.publishedSlug=locked;}
  if(data.slug&&await strapi.db.query(UID).findOne({where:{slug:data.slug,...(p.documentId?{documentId:{$ne:p.documentId}}:{})}}))throw Error('This blog URL is already used.');
  for(const field of ['cover','sharingImage','authorPhoto'])if(data[field]){const id=require('./use-case-rules').relationId(data[field]);const image=id?await strapi.db.query('plugin::upload.file').findOne({where:{id}}):null;if(!image||!/^image\/(jpeg|png|webp|gif|avif)$/.test(image.mime))throw Error('Choose an image from the Media Library.');}
  if(context.action!=='publish'){await require('./use-case-media').prepare(strapi,data,existing);delete data.coverSourceVideo;}
  if(context.action==='publish'||p.status==='published'){
   const complete={...existing,...data};rules.publication(complete);
   if(!complete.cover||!complete.renderedCover)throw Error('Save a valid article cover before publishing.');
   if(context.action==='publish'&&!existing.publishedSlug)await strapi.db.query(UID).update({where:{id:existing.id},data:{publishedSlug:existing.slug}});
   else if(p.status==='published')data.publishedSlug=complete.slug;
  }
 }catch(error){throw new errors.ValidationError(error.message);}
 return next();
});}};
