const {tagsHTML,filterByTag,tagFilterHTML}=require('../shared/tags.cjs');
const fs=require('node:fs');const path=require('node:path');
const {esc,plain,safeLink}=require('../shared/content.cjs');
const {metadata,includeInSitemap}=require('../shared/seo.cjs');
const {titleHTML,summaryHTML}=require('../shared/intro-formatting.cjs');
const ui=require('./use-case-ui.cjs');const renderHub=require('./render-use-cases.cjs');const renderDetail=require('./render-use-case-detail.cjs');const solutions=require('./render-solutions-use-cases.cjs');const image=require('./use-case-media.cjs');
const original=require('./use-cases-content.json');
const shell=fs.readFileSync(path.join(__dirname,'../dist/use-cases/index.html'),'utf8');
function replaceElement(html,id,render){
 const re=new RegExp(`<([a-z][\\w-]*)\\b[^>]*\\bid="${id}"[^>]*>`,'i');const m=re.exec(html);if(!m)return html;
 const tags=new RegExp(`<(/?)${m[1]}\\b[^>]*>`,'gi');tags.lastIndex=m.index+m[0].length;let depth=1,t;
 while((t=tags.exec(html))){depth+=t[1]?-1:1;if(!depth)return html.slice(0,m.index)+render(m[0],html.slice(m.index+m[0].length,t.index))+html.slice(tags.lastIndex);}
 return html;
}
function content(records){return {...original,records,hero:{...original.hero,copy:'Explore GriidAi demonstrations. Open a use case to understand the spatial question, the method and its source.'},groups:[{id:'demonstrations',title:'Explore the demonstrations',description:'Each use case explains its spatial question, analytical approach and outputs.'}],faq:original.faq.filter(([q])=>!/^What use cases/.test(q)).map(([q,a])=>[q,String(a).replace(/seven/gi,'the selected')])};}
function navigation(html,records){
 html=replaceElement(html,'navigation',(open,inner)=>open+(inner.includes('href="/blogs/"')?inner:inner.replace(/<a\b[^>]*href="\/pricing\/"/,'<a href="/blogs/">Blogs</a>$&'))+'</nav>');
 html=html.replace(/(<div class="footer-sitemap">[\s\S]*?<span>Connect with GriidAi<\/span>)(?!<a [^>]*href="\/blogs\/">)/,'$1<a class="text-link" href="/blogs/">Blogs <span aria-hidden="true">↗</span></a>');
 const nav=r=>`<a href="${esc(r.detailUrl)}">${esc(r.name)}</a>`;const featured=records.filter(r=>r.featured),more=records.filter(r=>!r.featured);
 html=replaceElement(html,'solutions-submenu',open=>open+`<div><span>By Use Case</span><a href="/use-cases/">All Use Cases</a>${featured.map(nav).join('')}${more.length?`<button class="nav-more-toggle" type="button" data-nav-more aria-expanded="false" aria-controls="more-use-cases" data-remaining="${more.length}"><span data-nav-more-label>Show more (${more.length})</span></button><div class="nav-more-links" id="more-use-cases" hidden>${more.map(nav).join('')}</div>`:''}</div></div>`);
 const available=new Set(records.map(r=>r.id));
 html=html.replace(/<a\b([^>]*\bhref="([^"]+)"[^>]*)>([\s\S]*?)<\/a>/gi,(all,attrs,href,label)=>{if(!safeLink(href))return label;try{const u=new URL(href,'https://griidai.com');const m=u.pathname.match(/^\/use-cases\/([^/]+)\/?$/);if(m&&!available.has(m[1]))return label;}catch{}return all;});
 return html;
}
function page(body,{title='Geospatial Use Cases | GriidAi',description='Explore spatial questions, analytical approaches and outputs.',route='/use-cases/',siteURL='http://localhost:3000',records=[],preview=false,metadataRecord,hubPage=false,bodyClass='hub-use-cases',schemaRecords}={}){
 let html=shell.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,()=>`<main id="main" class="hub-page ${bodyClass}">${body}</main>`);
 if(bodyClass==='hub-blogs')html=html.replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/g,'');
 html=html.replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<link\b[^>]*rel="canonical"[^>]*>/gi,'').replace(/<meta\b[^>]*(?:name="(?:description|robots|author|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/gi,'');
 html=html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,'');
 html=html.replace(/<meta\b[^>]*name="robots"[^>]*>/g,'');
 const record=metadataRecord||{name:title,summary:description,detailUrl:route,seo:{title,description}};
 html=html.replace('</head>',()=>metadata(record,{siteURL,preview,records:schemaRecords||records,hub:hubPage})+(preview?'<meta name="referrer" content="no-referrer">':'')+'</head>');
 return navigation(html,records).replace('</head>','<link rel="stylesheet" href="/cms-content.css"></head>').replace('</body>','<script src="/cms-content.js" defer></script></body>');
}
function hub(records,options={}){const selected=options.tagFilter||'',visible=filterByTag(records,selected);let body=renderHub(ui,content(visible));const search=`<form class="container uc-cms-search" role="search"><label for="use-case-search">Search use cases</label><input id="use-case-search" type="search" placeholder="Search by title, question, description or tag" autocomplete="off"><p data-case-count aria-live="polite">${visible.length} use cases</p></form>`;const filters=tagFilterHTML(records,selected);body=body.replace('<section class="hub-section',search+(filters?'<div class="container">'+filters+'</div>':'')+(!visible.length?'<p class="container cms-tag-empty">No matching use cases. Try another tag or clear the filter.</p>':'')+'<section class="hub-section');return page(body,{...options,records,schemaRecords:visible,hubPage:true,metadataRecord:{name:'Geospatial Use Cases',summary:'Explore GriidAi demonstrations, methods and outputs.',detailUrl:'/use-cases/',cover:records[0]?.cover,seo:{title:'Geospatial Use Cases | GriidAi'}}});}
function detail(record,records,options){return page(renderDetail(ui,record,options),{...options,metadataRecord:record,route:record.detailUrl,records});}
function preview(record,options){const card=`<div class="uc-question-card uc-channel-card"><div class="uc-card-image">${image(record,{eager:true})}</div><div class="uc-card-copy"><span class="hub-tag">${esc(record.kind)}</span><h3>${titleHTML(record)}</h3><div class="cms-card-summary uc-part-copy">${summaryHTML(record)}</div>${tagsHTML(record)}<span class="text-link">Explore use case ↗</span></div></div>`;const bar=`<section class="container cms-preview-tools"><p><strong>Draft preview — not published</strong> · Saved content only. Use the Strapi device selector for desktop/mobile. This link expires after 15 minutes.</p><div><button type="button" data-preview-card>Card preview</button></div><div class="cms-card-preview" hidden>${card}</div></section>`;return page(bar+`<div class="cms-preview-content">${renderDetail(ui,record,options)}</div>`,{...options,metadataRecord:record,route:record.detailUrl,preview:true,records:(options.relatedCatalog||[]).filter(r=>r.contentType!=='blog')});}
function sitemap(xml,records,siteURL,blogs=[]){
 const routes=new Set();const root=path.join(__dirname,'../dist');
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(!['assets','industries','workflows','use-cases'].includes(e.name))walk(p);}else if(e.name.endsWith('.html')){let route='/'+path.relative(root,p).replaceAll('\\','/');if(route.endsWith('index.html'))route=route.slice(0,-10);routes.add(route);}}}
 walk(root);routes.add('/use-cases/');routes.add('/blogs/');for(const r of [...records,...blogs])if(includeInSitemap(r,{siteURL}))routes.add(r.detailUrl);
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...routes].sort().map(route=>`<url><loc>${esc(new URL(route,siteURL).href)}</loc></url>`).join('')+'</urlset>';
}
module.exports={hub,detail,preview,navigation,sitemap,page,replaceElement,solutions:(html,records)=>solutions(html,content(records))};
