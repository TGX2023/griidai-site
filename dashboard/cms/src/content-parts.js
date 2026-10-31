'use strict';
const {normalizeParts,legacyParts,hasPartContent}=require('../../shared/content-parts.cjs');
async function prepareParts(strapi,value) {
 const parts=normalizeParts(value);
 for(const part of parts) {
  if(!part.image)continue;
  const id=Number(part.image.id);
  if(!Number.isSafeInteger(id)||id<1)throw Error('Choose a part image from the Media Library.');
  const media=await strapi.db.query('plugin::upload.file').findOne({where:{id}});
  if(!media||!/^image\/(jpeg|png|webp|gif|avif)$/.test(media.mime))throw Error('Part images must be JPG, PNG, WebP, GIF or AVIF files in the Media Library.');
  part.image={id:media.id,url:media.url,width:media.width,height:media.height,mime:media.mime};
  if(!part.imageAlt.trim())throw Error('Add a description for each part image.');
 }
 return parts;
}
async function migrateLegacyParts(strapi,uid) {
 const records=await strapi.db.query(uid).findMany({where:{parts:{$null:true}}});
 for(const record of records) {
  const parts=legacyParts(record.question,record.overview);
  if(parts.length)await strapi.db.query(uid).update({where:{id:record.id},data:{parts,updatedAt:record.updatedAt}});
 }
}
module.exports={prepareParts,migrateLegacyParts,legacyParts,hasPartContent};
