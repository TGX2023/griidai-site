const fs=require('node:fs'),path=require('node:path');
const sharp=require('sharp');
const records=require('./use-cases-content.json').records;
const root=path.resolve(__dirname,'../dist/assets/use-cases/videos');
async function prepare(id){
 const target=path.join(root,id);
 if(fs.existsSync(target+'-1280.webp')&&fs.existsSync(target+'-640.webp'))return;
 let source,buffer;
 for(const file of ['maxresdefault.jpg','hq720.jpg','sddefault.jpg','hqdefault.jpg']){
  const response=await fetch('https://i.ytimg.com/vi/'+id+'/'+file,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)continue;
  const bytes=Buffer.from(await response.arrayBuffer());
  const info=await sharp(bytes).metadata();
  if(info.width<320)continue;
  source='https://i.ytimg.com/vi/'+id+'/'+file;buffer=bytes;break;
 }
 if(!buffer)throw Error('No usable public thumbnail for '+id);
 for(const width of [640,1280])await sharp(buffer).resize(width,Math.round(width*9/16),{fit:'cover',position:'centre'}).webp({quality:82}).toFile(target+'-'+width+'.webp');
 return {videoId:id,source};
}
(async()=>{
 fs.mkdirSync(root,{recursive:true});
 const ids=[...new Set(records.map(r=>r.video.id))],sources=[];
 for(let index=0;index<ids.length;index+=3){const batch=await Promise.all(ids.slice(index,index+3).map(prepare));sources.push(...batch.filter(Boolean));}
 if(sources.length)fs.writeFileSync(path.join(root,'sources.json'),JSON.stringify(sources,null,2)+'\n');
 console.log('Prepared responsive source-video thumbnails for '+ids.length+' videos.');
})().catch(e=>{console.error(e.message);process.exit(1)});
