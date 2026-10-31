const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const {getPricingUrls,renderPricingHtml}=require('./scripts/env-config.cjs');
const {createClient}=require('./scripts/cms-client.cjs');const pages=require('./scripts/cms-pages.cjs');const {validSignature}=require('./shared/content.cjs');
const root=path.join(__dirname,'dist');const pricing=getPricingUrls(__dirname);const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
const siteURL=process.env.SITE_URL||`http://localhost:${port}`;
const client=createClient({url:process.env.STRAPI_URL,publicUrl:process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL,token:process.env.STRAPI_API_TOKEN});
const noStore={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff'};
const livePreview=require('./scripts/live-preview.cjs');
const runtimeSEO=require('./scripts/runtime-seo.cjs');
const homepageFeatures=require('./scripts/homepage-features.cjs');
const blogs=require('./scripts/render-blogs.cjs');const blogClient=require('./scripts/blog-client.cjs').createBlogClient({url:process.env.STRAPI_URL,publicUrl:process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL,token:process.env.STRAPI_API_TOKEN});
async function relatedCatalog(record){const refs=record.seo?.related||[];const results=await Promise.all([refs.some(r=>r.kind==='use-case')?client.published().catch(()=>[]):[],refs.some(r=>r.kind==='blog')?blogClient.published().catch(()=>[]):[]]);return results.flat();}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const send=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8',...noStore,...headers});res.end(req.method==='HEAD'?'':body);};
 let url,pathname;try{url=new URL(req.url,siteURL);pathname=decodeURIComponent(url.pathname).replaceAll('\\','/');if(pathname.includes(':')||pathname.split('/').some(p=>/[. ]$/.test(p)))return send(400,'Invalid URL');}catch{return send(400,'Invalid URL');}
 const options={siteURL};
 if(pathname==='/robots.txt')return send(200,runtimeSEO.robots(siteURL),{'Content-Type':'text/plain; charset=utf-8'});
 if(!['GET','HEAD'].includes(req.method)&&!(req.method==='POST'&&pathname.startsWith('/preview/')))return send(405,'Method not allowed',{'Allow':'GET, HEAD'});
 const errorPage=(status,message)=>send(status,pages.page(`<section class="hub-section"><div class="container"><h1>${message}</h1><p>${status===503?'Please try again shortly. The rest of the website is available.':'This use case is not currently available.'}</p><a href="/use-cases/">All Use Cases</a></div></section>`,options),status===503?{'Retry-After':'30'}:{});
 if(/^\/workflows(?:\/|\.html|$)/i.test(pathname))return errorPage(404,'Page unavailable');
 const blogError=(status)=>send(status,pages.page(`<section class="hub-section"><div class="container"><h1>${status===503?'Blogs are temporarily unavailable':'Article unavailable'}</h1><p>${status===503?'Please try again shortly. The rest of the website is available.':'This article is not currently published.'}</p><a href="/blogs/">All blogs</a></div></section>`,{...options,bodyClass:'hub-blogs',route:'/blogs/',title:'Blogs | GriidAi',preview:status===404}),status===503?{'Retry-After':'30'}:{});
 if(/^\/blogs(?:\/|\.html|$)/i.test(pathname)){
  try{const [records,useCases]=await Promise.all([blogClient.published(),client.published().catch(()=>[])]);const opts={siteURL,useCases,tagFilter:url.searchParams.get('tag')||''};if(['/blogs/','/blogs','/blogs.html','/blogs/index.html'].includes(pathname.toLowerCase()))return send(200,blogs.hub(records,opts));const slug=pathname.toLowerCase().match(/^\/blogs\/([a-z0-9-]+)\/?(?:index\.html)?$/)?.[1];const record=records.find(r=>r.id===slug);return record?send(200,blogs.detail(record,records,opts)):blogError(404);}catch{return blogError(503);}
 }
 if(pathname.startsWith('/preview/blogs/')){
  const match=pathname.match(/^\/preview\/blogs\/([a-zA-Z0-9_-]+)\/?$/);const signedId=match?'blog-'+match[1]:'';
  if(!match||!validSignature(signedId,url.searchParams.get('expires'),url.searchParams.get('signature'),process.env.PREVIEW_SECRET))return send(403,'Preview link is invalid or expired.',{'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'});
  const cmsOrigin=new URL(process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL).origin;const headers={'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':`frame-ancestors ${cmsOrigin}`};
  if(url.searchParams.get('live')==='1'){
   if(req.method==='POST'){
    if(req.headers.origin!==new URL(siteURL).origin)return send(403,'Preview request origin is not allowed.',headers);
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,'Use JSON preview data.',headers);
    try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>256*1024)throw Error('limit');chunks.push(chunk);}const record=blogs.snapshot(JSON.parse(Buffer.concat(chunks).toString()).data,process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL);return send(200,blogs.detail(record,[],{siteURL,preview:true,relatedCatalog:await relatedCatalog(record)}).replace('<main id="main" class="hub-page hub-blogs">','<main id="main" class="hub-page hub-blogs"><section class="container cms-live-notice"><strong>Unsaved preview</strong><button type="button" data-live-card-toggle>Card preview</button></section><section class="container cms-live-card" id="live-card-preview" hidden><div class="blog-grid">'+blogs.card(record)+'</div></section>'),headers);}catch{return send(400,'Preview data is invalid or exceeds the size limit.',headers);}
   }
   return send(200,livePreview.canvas({siteURL,cmsOrigin}).replace('</head>','<link rel="stylesheet" href="/blogs.css"></head>').replace('</body>','<script src="/blogs.js" defer></script></body>'),headers);
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(405,'Method not allowed');
  try{const record=await blogClient.draft(match[1]);return record?send(200,blogs.detail(record,[],{siteURL,preview:true,relatedCatalog:await relatedCatalog(record)}),headers):blogError(404);}catch{return blogError(503);}
 }
 if(pathname.startsWith('/preview/')){
  const m=pathname.match(/^\/preview\/use-cases\/([a-zA-Z0-9_-]+)\/?$/);
  if(!m||!validSignature(m[1],url.searchParams.get('expires'),url.searchParams.get('signature'),process.env.PREVIEW_SECRET))return send(403,'Preview link is invalid or expired.',{'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'});
  if(url.searchParams.get('live')==='1'){
   const cmsOrigin=new URL(process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL).origin;
   const headers={'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':`frame-ancestors ${cmsOrigin}`};
   if(req.method==='POST'){
    if(req.headers.origin!==new URL(siteURL).origin)return send(403,'Preview request origin is not allowed.',headers);
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,'Use JSON preview data.',headers);
    try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>256*1024)throw Error('limit');chunks.push(chunk);}const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));return send(200,livePreview.renderSnapshot(payload.data,{siteURL,publicURL:process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL,relatedCatalog:await relatedCatalog(payload.data)}),headers);}catch{return send(400,'Preview data is invalid or exceeds the size limit.',headers);}
   }
   return send(200,livePreview.canvas({siteURL,cmsOrigin}),headers);
  }
  if(req.method==='POST')return send(405,'Method not allowed',{'Allow':'GET, HEAD'});
  try{const record=await client.draft(m[1]);if(!record)return errorPage(404,'Draft unavailable');return send(200,pages.preview(record,{...options,relatedCatalog:await relatedCatalog(record)}),{'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':`frame-ancestors ${new URL(process.env.STRAPI_PUBLIC_URL||process.env.STRAPI_URL).origin}`});}catch{return errorPage(503,'Preview temporarily unavailable');}
 }
 if(/^\/use-cases(?:\/|\.html|$)/i.test(pathname)){
  pathname=pathname.toLowerCase();
  try{const records=await client.published();if(['/use-cases/','/use-cases','/use-cases/index.html','/use-cases.html'].includes(pathname))return send(200,pages.hub(records,{...options,tagFilter:url.searchParams.get('tag')||''}));
   const slug=pathname.match(/^\/use-cases\/([a-z0-9-]+)\/(?:index\.html)?$/)?.[1]||pathname.match(/^\/use-cases\/([a-z0-9-]+)$/)?.[1];
   const record=records.find(r=>r.id===slug);if(record)return send(200,pages.detail(record,records,{...options,relatedCatalog:await relatedCatalog(record)}));
   const destination=require('./scripts/use-cases-content.json').retiredRoutes[slug];if(destination&&records.some(r=>r.id===destination))return send(302,'',{'Location':`/use-cases/${destination}/`});
   return errorPage(404,'Use case unavailable');
  }catch{return errorPage(503,'Use cases are temporarily unavailable');}
 }
 let target=path.resolve(root,'.'+pathname);if(target!==root&&!target.startsWith(root+path.sep))return send(403,'Forbidden');
 try{if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');if(!fs.statSync(target).isFile())return errorPage(404,'Page not found');
  const ext=path.extname(target);if(ext==='.html'||pathname==='/sitemap.xml'){
   let records=[];let failed=false;try{records=await client.published();}catch{failed=true;}
   let html=fs.readFileSync(target,'utf8');if(pathname==='/sitemap.xml'){if(failed)return send(503,'Sitemap temporarily unavailable',{'Content-Type':mime['.xml'],'Retry-After':'30'});try{const articles=await blogClient.published();return send(200,pages.sitemap(html,records,siteURL,articles),{'Content-Type':mime['.xml']});}catch{return send(503,'Sitemap temporarily unavailable',{'Content-Type':mime['.xml'],'Retry-After':'30'});}}
   html=runtimeSEO.staticURLs(pages.navigation(html,records),pathname,siteURL);if(/^\/solutions(?:\/|\.html|$)/.test(pathname)){html=pages.solutions(html,records);if(failed)html=html.replace('<div class="solution-case-library">','<p>Use cases are temporarily unavailable. Please try again shortly.</p><div class="solution-case-library">');}
   if(path.relative(root,target).replaceAll('\\','/')==='pricing/index.html')html=renderPricingHtml(html,pricing);
   if(path.relative(root,target).replaceAll('\\','/')==='index.html'){
    // A failed content source must never fall back to stale editorial selections.
    const articles=await blogClient.published().catch(()=>[]);
    html=homepageFeatures.inject(html,records,articles);
   }
   return send(200,html);
  }
  res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(target);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{return errorPage(404,'Page not found');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is busy. Keep it running and set PORT/SITE_URL to a free port, then update cms SITE_URL.`:'Website failed to start.');process.exitCode=1;});
server.listen(port,host,()=>console.log(`GriidAi CMS website: ${siteURL}`));
module.exports=server;
