'use strict';
const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const sharp=require('sharp');const crypto=require('node:crypto');
const {youtubeId}=require('../../shared/content.cjs');
async function upload(strapi,bytes,name,alt){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'griidai-cover-'));const file=path.join(dir,name);try{await fs.writeFile(file,bytes);const [media]=await strapi.plugin('upload').service('upload').upload({data:{fileInfo:{name,alternativeText:alt}},files:{filepath:file,originalFilename:name,mimetype:'image/webp',size:bytes.length}});return media;}finally{await fs.rm(dir,{recursive:true,force:true});}}
async function readMedia(strapi,media){
 if(media.provider==='local'){const root=path.resolve(strapi.dirs.static.public);const file=path.resolve(root,'.'+media.url);if(!file.startsWith(root+path.sep))throw Error('Invalid media path');return fs.readFile(file);}
 // Remote providers must return HTTPS asset URLs. No user-provided URL is fetched here.
 const u=new URL(media.url);if(u.protocol!=='https:')throw Error('Media provider requires HTTPS');const r=await fetch(u,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Media unavailable');return Buffer.from(await r.arrayBuffer());
}
async function prepare(strapi,data,existing){
 const {relationId}=require('./use-case-rules');const merged={...existing,...data};let id=Object.hasOwn(data,'cover')?relationId(data.cover):relationId(existing?.cover);
 if(merged.mediaType==='image'||(id&&id!==relationId(existing?.cover)))data.coverSourceVideo=null;
 if(merged.mediaType==='video'&&(!id||(existing?.coverSourceVideo&&existing.coverSourceVideo!==youtubeId(merged.videoUrl)&&id===relationId(existing?.cover)))){
  id=null;data.cover=null;const video=youtubeId(merged.videoUrl);if(video){for(const name of ['maxresdefault','hqdefault']){try{const r=await fetch(`https://i.ytimg.com/vi/${video}/${name}.jpg`,{signal:AbortSignal.timeout(8000)});if(!r.ok)continue;const b=Buffer.from(await r.arrayBuffer());if(b.length>8e6)continue;const bytes=await sharp(b).webp({quality:88}).toBuffer();const media=await upload(strapi,bytes,`youtube-${video}.webp`,merged.coverAlt||merged.title);id=media.id;data.cover=id;data.coverSourceVideo=video;break;}catch{}}}
 }
 if(!id){data.renderedCover=null;data.renderedFrom=null;return;}
 const media=await strapi.db.query('plugin::upload.file').findOne({where:{id}});if(!media)return;
 const {focus:normalizeFocus,crop}=require('../../shared/cover-focus.cjs');const focus=normalizeFocus(merged.coverFocus);const key=crypto.createHash('sha256').update(JSON.stringify([id,media.hash,focus])).digest('hex');
 if(key===existing?.renderedFrom&&existing?.renderedCover)return;
 const bytes=await sharp(await readMedia(strapi,media)).rotate().toBuffer();const meta=await sharp(bytes).metadata();if(!meta.width||!meta.height)throw Error('Cover must be an image');
 const cropped=await sharp(bytes).extract(crop(meta.width,meta.height,focus)).resize({width:1280,height:720,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer();
 const cover=await upload(strapi,cropped,`cover-${key.slice(0,16)}.webp`,merged.coverAlt||merged.title);data.renderedCover=cover.id;data.renderedFrom=key;
}
module.exports={prepare,upload};
