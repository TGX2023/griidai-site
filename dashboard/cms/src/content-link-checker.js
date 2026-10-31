'use strict';
const dns=require('node:dns').promises,https=require('node:https'),http=require('node:http'),net=require('node:net'),fs=require('node:fs'),path=require('node:path');
const ipaddr=require('ipaddr.js');
const {safeLink}=require('../../shared/content.cjs');
function isPublicIP(address){try{return ipaddr.process(address).range()==='unicast';}catch{return false;}}
async function publicAddress(url,lookup=dns.lookup){
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!((url.protocol==='https:'&&url.port==='443')||(url.protocol==='http:'&&url.port==='80'))))throw Error('Unsupported public URL');
 const host=url.hostname.replace(/^\[|\]$/g,'');if(!host.includes('.')&&!net.isIP(host)||/(^|\.)(localhost|local|internal)$/i.test(host))throw Error('Private host');
 const addresses=net.isIP(host)?[{address:host,family:net.isIP(host)}]:await Promise.race([lookup(host,{all:true,verbatim:true}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('DNS timeout')),3000);t.unref();})]);
 if(!addresses.length||addresses.some(r=>!isPublicIP(r.address)))throw Error('Non-public destination');return addresses[0];
}
function requestHead(url,address,method='HEAD',timeout=3500){return new Promise((resolve,reject)=>{
 const req=(url.protocol==='https:'?https:http).request(url,{method,agent:false,timeout,headers:{'User-Agent':'GriidAi-Content-Link-Check/1.0',Accept:'text/html,*/*;q=0.5',...(method==='GET'?{Range:'bytes=0-0'}:{})},lookup:(_host,options,callback)=>callback(null,options.all?[address]:address.address,address.family)},res=>{resolve({status:res.statusCode,location:res.headers.location});res.destroy();});
 req.on('timeout',()=>req.destroy(Error('Timeout')));req.on('error',reject);req.end();
});}
async function external(url,{lookup=dns.lookup,request=requestHead}={}){
 const deadline=Date.now()+6500;let target=new URL(url);
 try{
  for(let hops=0;hops<=3;hops++){
   const address=await publicAddress(target,lookup);if(Date.now()>=deadline)throw Error('Timeout');
   let response=await request(target,address,'HEAD',Math.max(100,Math.min(3500,deadline-Date.now())));
   if([405,501].includes(response.status))response=await request(target,address,'GET',Math.max(100,Math.min(2000,deadline-Date.now())));
   if([301,302,303,307,308].includes(response.status)&&response.location){target=new URL(response.location,target);if(!safeLink(target.href))throw Error('Unsupported redirect');continue;}
   if(response.status>=200&&response.status<400)return{status:'ok',message:'Public destination responded successfully.'};
   if([404,410].includes(response.status))return{status:'broken',message:'The destination reports that this page is unavailable.'};
   return{status:'unverified',message:'The site returned a restriction or temporary error. Review it in your browser.'};
  }
  return{status:'unverified',message:'Too many redirects. Review this link manually.'};
 }catch{return{status:'unverified',message:'Could not verify a public destination. Private addresses, unsupported ports and slow responses are not requested.'};}
}
function staticRoutes(){
 const root=path.resolve(__dirname,'../../website/dist'),routes=new Set(['/']);
 if(!fs.existsSync(root))return new Set(require('../../shared/site-routes.json'));
 const walk=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory()){if(!['assets','industries','workflows','use-cases','blogs'].includes(item.name))walk(full);}else if(item.name.endsWith('.html')){const route='/'+path.relative(root,full).replaceAll('\\','/');routes.add(route);if(route.endsWith('/index.html')){routes.add(route.slice(0,-10));routes.add(route.slice(0,-11)||'/');}}}};walk(root);routes.add('/use-cases/');routes.add('/blogs/');return routes;
}
function register(strapi){
 const limits=new Map();let active=0;
 strapi.admin.routes.admin.routes.push({method:'POST',path:'/content-guidance/check-links',handler:async ctx=>{
  const ability=ctx.state.userAbility,action='plugin::content-manager.explorer.read';if(!ability||!['api::blog.blog','api::use-case.use-case'].some(uid=>ability.can(action,uid)))return ctx.forbidden();
  const urls=ctx.request.body?.urls;if(!Array.isArray(urls)||urls.length>60||urls.some(v=>typeof v!=='string'||v.length>2000))return ctx.badRequest('Provide up to sixty content links.');
  const now=Date.now();for(const [id,value]of limits)if(now-value.start>60000)limits.delete(id);
  const id=ctx.state.user.id,previous=limits.get(id)||{start:now,count:0};if(previous.count>=4||active>=3){ctx.status=429;ctx.body={error:'Try again shortly.'};return;}previous.count++;limits.set(id,previous);active++;
  try{
   const base=new URL(strapi.config.get('server.url')||'http://localhost:1337');const site=new URL(process.env.SITE_URL||base.origin),routes=staticRoutes();let externalCount=0;
   for(const alias of ['/blogs','/blogs.html','/use-cases','/use-cases.html'])routes.add(alias);
   const pagePath=ctx.request.body?.pagePath||'/';if(pagePath!=='/'&&!/^\/(blogs|use-cases)\/(?:[a-z0-9-]+\/)?$/.test(pagePath))return ctx.badRequest('Provide a valid content page path.');const pageURL=new URL(pagePath,site);
   const internal=async url=>{
    if(routes.has(url.pathname))return true;
    const match=url.pathname.match(/^\/(blogs|use-cases)\/([a-z0-9-]+)(?:\/(?:index\.html)?)?$/);if(!match)return false;
    const uid=match[1]==='blogs'?'api::blog.blog':'api::use-case.use-case';let slug=match[2];
    const retired=require('../../shared/retired-routes.json');if(match[1]==='use-cases')slug=retired[slug]||slug;
    return Boolean((await strapi.documents(uid).findMany({status:'published',filters:{slug},fields:['documentId'],limit:1})).length);
   };
   const unique=[...new Set(urls)],results=new Array(unique.length);let cursor=0;
   const worker=async()=>{while(cursor<unique.length){const index=cursor++,value=unique[index];let result;
    if(!safeLink(value))result={status:'blocked',message:'Unsupported link. Industries and Workflows links are unavailable.'};
    else if(value.startsWith('#'))result={status:'unverified',message:'This is an in-page anchor. Check that it points to the intended section in Preview.'};
    else{const url=new URL(value,pageURL);if(url.protocol==='mailto:')result={status:'unverified',message:'Email links cannot be checked as web pages.'};
     else if(url.origin===site.origin)result=await internal(url)?{status:'ok',message:url.hash?'Published page exists; check the target section in Preview.':'Published page exists.'}:{status:'broken',message:'No published page is available at this address.'};
     else if(++externalCount>12)result={status:'unverified',message:'Only the first twelve external destinations are checked per run. Review this link manually.'};
     else result=await external(url.href);
    }results[index]={url:value,...result};
   }};await Promise.all([worker(),worker(),worker()]);ctx.set('Cache-Control','no-store');ctx.body={results};
  }finally{active--;}
 },config:{policies:['admin::isAuthenticatedAdmin']}});
}
module.exports={isPublicIP,publicAddress,external,register};
