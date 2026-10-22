const config=require('./site-publication.cjs');
const useCaseContent=require('./use-cases-content.json');
const cases=useCaseContent.records;
module.exports=function publicationRules(html,route){
 if(!config.workflowsEnabled&&route==='solutions')html=html.replace(/<section\b[^>]*id="workflow-proof"[^>]*>[\s\S]*?<\/section>/g,'');
 const isUseCase=route==='use-cases'||route.startsWith('use-cases/'),isIndustry=route==='industries'||route.startsWith('industries/');
 // Shared navigation stays complete. Category cross-link exclusions apply
 // only inside page content, including each dedicated use-case page.
 const mainStart=html.indexOf('<main'),mainEnd=html.indexOf('</main>');
 let result=html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,(anchor,offset)=>{
  const inContent=mainStart!==-1&&offset>mainStart&&offset<mainEnd;
  const match=anchor.match(/\bhref=(["'])(.*?)\1/);if(!match)return anchor;
  let url;try{url=new URL(match[2],'https://site.invalid/'+route+'/')}catch{return anchor;}
  const pathname=url.pathname.replace(/^\/moh_web(?=\/)/,'');
  const ownOrigin=['https://site.invalid','https://griidai-homepage-review.griidai-9992.chatgpt.site','https://abdelrahmanembaby-oss.github.io'].includes(url.origin);
  if(!ownOrigin)return anchor;
  if(!config.workflowsEnabled&&(/^\/workflows(?:\/|$)/.test(pathname)||/^#workflow-(?:proof|\d+)$/.test(url.hash)))return '';
  if(inContent&&isUseCase&&/^\/industries(?:\/|$)/.test(pathname))return '';
  if(inContent&&isIndustry&&/^\/use-cases(?:\/|$)/.test(pathname))return '';
  if(pathname==='/use-cases/'&&url.hash){const id=url.hash.slice(1);const record=cases.find(c=>c.id===id&&c.detailUrl);if(record)return anchor.replace(match[0],`href="${record.detailUrl}"`);if(Object.hasOwn(useCaseContent.retiredRoutes,id)){const replacement=useCaseContent.retiredRoutes[id];return anchor.replace(match[0],`href="${replacement?'/use-cases/'+replacement+'/':'/use-cases/'}"`);}}
  const retired=pathname.match(/^\/use-cases\/([^/]+)\/?$/);if(retired&&Object.hasOwn(useCaseContent.retiredRoutes,retired[1])){const replacement=useCaseContent.retiredRoutes[retired[1]];return anchor.replace(match[0],`href="${replacement?'/use-cases/'+replacement+'/':'/use-cases/'}"`);}
  return anchor;
 });
 // Hiding an anchor-wrapped legacy card can also remove its ID. Remove local
 // jump links to those absent targets, so no control points at missing content.
 result=result.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,anchor=>{
  const href=anchor.match(/\bhref=(["'])(.*?)\1/);if(!href)return anchor;
  let url;try{url=new URL(href[2],'https://site.invalid/'+route+'/')}catch{return anchor;}
  const pathname=url.pathname.replace(/^\/moh_web(?=\/)/,'').replace(/\/$/,'');
  if(url.origin==='https://site.invalid'&&pathname===('/'+route).replace(/\/$/,'')&&url.hash){let id;try{id=decodeURIComponent(url.hash.slice(1))}catch{return anchor;}if(!result.includes('id="'+id+'"')&&!result.includes("id='"+id+"'"))return '';}
  return anchor;
 });
 return result;
};
