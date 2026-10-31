// Offline, content-only handoff. Never exports admin users, tokens, settings or the SQLite database.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const root=path.resolve(__dirname,'..'),mode=process.argv[2],folder=path.resolve(process.argv[3]||path.join(root,'seed'));
const types=['api::use-case.use-case','api::blog.blog'];
const excluded=new Set(['renderedCover','publishedSlug','importKey','renderedFrom','coverSourceVideo','topics','question','overview']);
const jsonCopy=v=>v==null?v:JSON.parse(JSON.stringify(v));
async function run(){
 if(!['export','import'].includes(mode))throw Error('Use: node scripts/portable-content.cjs export|import <directory>');
 process.chdir(path.join(root,'cms'));const {createStrapi}=require(path.join(root,'cms/node_modules/@strapi/strapi'));const app=await createStrapi({appDir:process.cwd()}).load();
 try{
  if(mode==='export'){
   if(fs.existsSync(path.join(folder,'content.json')))throw Error('Content export already exists; choose a new directory.');
   fs.mkdirSync(path.join(folder,'media'),{recursive:true});const assets={},entries=[];
   async function asset(id){
    if(!id)return null;const m=await app.db.query('plugin::upload.file').findOne({where:{id}});if(!m)throw Error('Referenced image not found.');
    if(m.provider!=='local')throw Error('This export expects local source images.');
    const publicRoot=path.resolve(app.dirs.static.public),file=path.resolve(publicRoot,'.'+m.url);if(!file.startsWith(publicRoot+path.sep))throw Error('Invalid media location.');
    const bytes=fs.readFileSync(file),key=crypto.createHash('sha256').update(bytes).digest('hex'),ext=path.extname(file).toLowerCase();
    if(!/^\.(webp|png|jpg|jpeg|gif|avif)$/.test(ext))throw Error('Unsupported image format.');
    if(!assets[key]){assets[key]={key,file:'media/'+key+ext,mime:m.mime,name:m.name,alternativeText:m.alternativeText||'',caption:m.caption||''};fs.writeFileSync(path.join(folder,assets[key].file),bytes);}
    return key;
   }
   async function snapshot(uid,record){
    if(!record)return null;const result={};for(const [field,attr]of Object.entries(app.contentType(uid).attributes)){
     if(excluded.has(field)||attr.private||['relation','password'].includes(attr.type)||!Object.hasOwn(record,field))continue;
     if(['createdAt','updatedAt','publishedAt','locale'].includes(field))continue;
     if(attr.type==='media')result[field]=await asset(record[field]?.id);
     else if(attr.type==='component')result[field]=(record[field]||[]).map(({content})=>({content:jsonCopy(content)}));
     else result[field]=jsonCopy(record[field]);
    }
    if(Array.isArray(result.parts))for(const part of result.parts)if(part.image)part.image={asset:await asset(part.image.id)};
    return result;
   }
   for(const uid of types){
    const attrs=app.contentType(uid).attributes,populate=Object.keys(attrs).filter(k=>['media','component'].includes(attrs[k].type)&&!excluded.has(k));
    const [drafts,published]=await Promise.all(['draft','published'].map(status=>app.documents(uid).findMany({status,populate,limit:10000})));
    const ids=[...new Set([...drafts,...published].map(r=>r.documentId))];
    for(const id of ids){const d=drafts.find(r=>r.documentId===id),p=published.find(r=>r.documentId===id);if(/^(changed-full-url-qa-|page-url-qa-|tags-qa-|seo-editing-qa-|home-qa-)/.test((d||p).slug))continue;entries.push({uid,key:id,draft:await snapshot(uid,d),published:await snapshot(uid,p)});}
   }
   fs.writeFileSync(path.join(folder,'content.json'),JSON.stringify({version:1,assets:Object.values(assets),entries},null,2)+'\n');
   console.log(`Content-only export: ${entries.length} entries, ${Object.keys(assets).length} images. Accounts, credentials and database excluded.`);
  }else{
   const bundle=JSON.parse(fs.readFileSync(path.join(folder,'content.json'),'utf8'));if(bundle.version!==1||!Array.isArray(bundle.entries)||!Array.isArray(bundle.assets))throw Error('Unsupported content bundle.');
   const media=new Map(),documents=new Map(),fresh=[];
   for(const a of bundle.assets){
    if(!/^[a-f0-9]{64}$/.test(a.key)||!/^media\/[a-f0-9]{64}\.(webp|png|jpg|jpeg|gif|avif)$/.test(a.file))throw Error('Invalid asset path.');
    const bytes=fs.readFileSync(path.join(folder,a.file));if(crypto.createHash('sha256').update(bytes).digest('hex')!==a.key)throw Error('Image checksum mismatch.');
    const name='seed-'+a.key+path.extname(a.file);let m=await app.db.query('plugin::upload.file').findOne({where:{name}});
    if(!m){const temp=fs.mkdtempSync(path.join(os.tmpdir(),'griidai-seed-')),file=path.join(temp,name);try{fs.writeFileSync(file,bytes);[m]=await app.plugin('upload').service('upload').upload({data:{fileInfo:{name,alternativeText:a.alternativeText,caption:a.caption}},files:{filepath:file,originalFilename:name,mimetype:a.mime,size:bytes.length}});}finally{fs.rmSync(temp,{recursive:true,force:true});}}
    media.set(a.key,m);
   }
   const mapData=(snapshot,related=true)=>{
    const data=jsonCopy(snapshot);for(const name of ['cover','sharingImage','authorPhoto'])if(Object.hasOwn(data,name))data[name]=data[name]?media.get(data[name])?.id:null;
    if(Array.isArray(data.parts))for(const part of data.parts)if(part.image){const m=media.get(part.image.asset);if(!m)throw Error('Part image is missing.');part.image={id:m.id,url:m.url,width:m.width,height:m.height,mime:m.mime};}
    if(data.seo)data.seo.related=related?(data.seo.related||[]).flatMap(ref=>ref.kind==='page'?[ref]:documents.has((ref.kind==='blog'?types[1]:types[0])+':'+ref.id)?[{...ref,id:documents.get((ref.kind==='blog'?types[1]:types[0])+':'+ref.id)}]:[]):[];
    return data;
   };
   for(const entry of bundle.entries){
    if(!types.includes(entry.uid)||!entry.key)throw Error('Invalid content entry.');
    const importKey='portable-v1:'+entry.uid+':'+entry.key;
    const existing=(await app.documents(entry.uid).findMany({status:'draft',filters:{importKey},limit:1}))[0];
    if(existing){documents.set(entry.uid+':'+entry.key,existing.documentId);continue;}
    const data=mapData(entry.published||entry.draft,false);data.featureOnHomepage=false;data.importKey=importKey;
    const created=await app.documents(entry.uid).create({data});documents.set(entry.uid+':'+entry.key,created.documentId);fresh.push(entry);
   }
   for(const entry of fresh){const documentId=documents.get(entry.uid+':'+entry.key);
    if(entry.published){await app.documents(entry.uid).update({documentId,data:mapData(entry.published)});await app.documents(entry.uid).publish({documentId});}
    if(entry.draft)await app.documents(entry.uid).update({documentId,data:mapData(entry.draft)});
   }
   console.log(`Imported ${fresh.length} new entries. Existing imported entries were left unchanged. No accounts or API tokens imported.`);
  }
 }finally{await app.destroy();}
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
