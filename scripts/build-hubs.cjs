const fs=require('node:fs');
const path=require('node:path');
const {industries,cases,workflows,formats,providers}=require('./hub-content.cjs');
const faqs=require('./hub-faqs.json');
const dataMedia=require('./data-media.cjs');
const dataContent=require('./data-content.json');
const renderData=require('./render-data.cjs');
const workflowContent=require('./workflows-content.json');
const renderWorkflows=require('./render-workflows.cjs');
const useCasesContent=require('./use-cases-content.json');
const renderUseCases=require('./render-use-cases.cjs');
const renderUseCaseDetail=require('./render-use-case-detail.cjs');
const publicationRules=require('./apply-publication-rules.cjs');
const {workflowsEnabled,industriesInSolutions}=require('./site-publication.cjs');
const industriesContent=require('./industries-content.json');
const renderIndustries=require('./render-industries.cjs');
const enterpriseContent=require('./enterprise-content.json');
const renderEnterprise=require('./render-enterprise.cjs');
const ecosystemContent=require('./ecosystem-content.json');
const renderEcosystem=require('./render-ecosystem.cjs');
const renderEcosystemForm=require('./render-ecosystem-form.cjs');
const enterpriseContactFields=require('./enterprise-contact-fields.cjs');
function dataEvidenceRow(key,title,copy,{kicker='',level='h3',links=''}={}){return `<div class="data-evidence-row"><div class="data-evidence-copy">${kicker?`<span class="eyebrow">${esc(kicker)}</span>`:''}<${level}>${esc(title)}</${level}>${copy}${links}</div>${dataFigure(key)}</div>`;}
function dataEvidenceSection(id,kicker,title,copy,key,{pale=false,after=''}={}){return `<section class="hub-section ${pale?'pale':''}" id="${id}"><div class="container">${dataEvidenceRow(key,title,copy,{kicker,level:'h2'})}${after}</div></section>`;}
const root=path.resolve(__dirname,'../dist');
const origin='https://griidai-homepage-review.griidai-9992.chatgpt.site';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(label,url,cls='text-link')=>`<a class="${cls}" href="${esc(url)}">${esc(label)} <span aria-hidden="true">↗</span></a>`;
const button=(label,url,primary=true)=>link(label,url,'button '+(primary?'primary':'secondary'));
const start=()=>button('Start for Free','https://app.griidai.com');
const contact=(label='Talk to Sales',topic='Enterprise')=>button(label,'/contact-sales.html?topic='+encodeURIComponent(topic));
const arrow='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const navLink=(name,url,current)=>`<a href="${url}"${current===url?' aria-current="page"':''}>${name}</a>`;
function navGroup(name,url,id,items,current){return `<div class="nav-group">${navLink(name,url,current)}<button class="nav-disclosure" aria-label="Open ${name} menu" aria-controls="${id}-submenu" aria-expanded="false">${arrow}</button><div class="nav-submenu${id==='solutions'&&!industriesInSolutions?' nav-use-cases-only':''}" id="${id}-submenu" hidden>${items}</div></div>`;}
function header(current){return `<header><noscript><style>header{height:auto;position:static}.header-inner{flex-wrap:wrap;padding-block:15px}#navigation{position:static;display:flex;flex-wrap:wrap;width:100%;order:4;max-height:none;box-shadow:none;border:0;padding:10px 0}.menu-toggle,.nav-disclosure,.nav-more-toggle{display:none!important}.nav-more-links[hidden]{display:block}.nav-submenu{max-height:none!important}</style></noscript><div class="container header-inner"><a class="logo" href="/" aria-label="GriidAi home"><img src="/assets/logo.png" alt="GriidAi" width="172" height="97"></a><button class="menu-toggle" aria-controls="navigation" aria-expanded="false" aria-label="Toggle navigation">☰</button><nav id="navigation" aria-label="Main navigation">${navGroup('Platform','/platform/','platform',navLink('Platform Overview','/platform/',current)+navLink('Agentic GeoAI','/agentic-geoai/',current)+navLink('Spatial Analysis','/spatial-analysis/',current),current)}${navGroup('Solutions','/solutions/','solutions',`${industriesInSolutions?`<div><span>By Industry</span>${navLink('All Industries','/industries/',current)}${industries.map(i=>navLink(esc(i.short),'/industries/#'+i.id,current)).join('')}</div>`:``}<div><span>By Use Case</span>${navLink('All Use Cases','/use-cases/',current)}${cases.filter(c=>c.featured).map(c=>navLink(esc(c.name),c.detailUrl,current)).join('')}${cases.some(c=>!c.featured)?`<button class="nav-more-toggle" type="button" data-nav-more aria-expanded="false" aria-controls="more-use-cases" data-remaining="${cases.filter(c=>!c.featured).length}"><span data-nav-more-label>Show more (${cases.filter(c=>!c.featured).length})</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="nav-more-links" id="more-use-cases" hidden>${cases.filter(c=>!c.featured).map(c=>navLink(esc(c.name),c.detailUrl,current)).join('')}</div>`:''}</div>`,current)}${navLink('Data','/data/',current)}${workflowsEnabled?navLink('Workflows','/workflows/',current):''}${navLink('Ecosystem','/ecosystem/',current)}${navLink('Pricing','/pricing/',current)}${navLink('Enterprise','/enterprise/',current)}${navLink('About','/about/',current)}</nav><div class="header-actions">${start()}</div></div></header>`;}
const originalHome=fs.readFileSync(path.join(root,'index.html'),'utf8');
const existingFooter=originalHome.match(/<footer[\s>][\s\S]*?<\/footer>/)[0].replace(/<div class="(?:container )?footer-sitemap">[\s\S]*?<\/div><!-- sitemap -->/,'');
function footer(){const sitemap=`<div class="footer-sitemap"><div><span>Explore the platform</span>${link('Platform','/platform/')}${link('Data','/data/')}${workflowsEnabled?link('Workflows','/workflows/'):''}</div><div><span>Find your application</span>${link('Industries','/industries/')}${link('Use Cases','/use-cases/')}${link('Enterprise','/enterprise/')}</div><div><span>Connect with GriidAi</span>${link('Ecosystem','/ecosystem/')}${link('About','/about/')}${link('Contact Sales','/contact-sales.html')}</div></div><!-- sitemap -->`;return existingFooter.replace('<div class="footer-company">',sitemap+'<div class="footer-company">');}
const paragraphs=txt=>Array.isArray(txt)?txt.map(t=>`<p>${esc(t)}</p>`).join(''):`<p>${esc(txt)}</p>`;
function section(id,kicker,title,body,{pale=false,intro='',cls=''}={}){return `<section class="hub-section ${pale?'pale':''} ${cls}"${id?` id="${id}"`:''}><div class="container"><div class="hub-section-heading"><span class="eyebrow">${esc(kicker)}</span><h2>${esc(title)}</h2>${intro?paragraphs(intro):''}</div>${body}</div></section>`;}
const grid=(items,cols=3)=>`<div class="hub-grid cols-${cols}">${items.join('')}</div>`;
const note=(s)=>`<p class="hub-note">${esc(s)}</p>`;
function card(title,text,extra='',kicker=''){return `<article class="hub-card">${kicker?`<span class="eyebrow">${esc(kicker)}</span>`:''}<h3>${esc(title)}</h3>${paragraphs(text)}${extra}</article>`;}
function table(headers,rows){return `<div class="hub-table-wrap"><table class="hub-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,j)=>`<${j===0?'th scope="row"':'td'} data-label="${esc(headers[j])}">${cell}</${j===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function stepper(items){return `<ol class="hub-steps">${items.map(([name,desc],i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><div><h3>${esc(name)}</h3><p>${esc(desc)}</p></div></li>`).join('')}</ol>`;}
const standardSteps=[['Define','State the spatial question, study area, time window and intended use.'],['Data','Bring your own layers or use a supported source. Inspect coverage and metadata.'],['Plan','See the proposed inputs, method, validation and expected output.'],['Review','Check assumptions, units, parameters and the selected data before execution.'],['Execute','Run the approved, supported spatial operations.'],['Validate','Inspect maps, tables, statistics and intermediate results.'],['Continue','Export, refine or carry the result into the next analytical step.']];
function faq(items){return `<div class="hub-faq">${items.map(([q,a])=>`<details><summary>${esc(q)}<span aria-hidden="true">+</span></summary><div>${paragraphs(a)}</div></details>`).join('')}</div>`;}
function jump(items){return `<div class="hub-jump"><div class="container"><details open><summary>On this page ${arrow}</summary><div class="hub-jump-links">${items.map(([name,id])=>`<a href="#${id}">${esc(name)}</a>`).join('')}</div></details></div></div>`;}
function hero(name,title,copy,actions,visual,meta){return `<section class="container hub-hero"><div class="hub-breadcrumbs"><a href="/">Home</a><span aria-hidden="true">/</span><span>${esc(name)}</span></div><div class="hub-hero-grid"><div><span class="eyebrow">${esc(meta||name)}</span><h1>${esc(title)}</h1>${paragraphs(copy)}<div class="actions">${actions}</div></div>${visual}</div></section>`;}
function productFigure(caption){return `<figure class="hub-product"><div class="hub-frame-bar"><i></i><i></i><i></i><span>THE GRIIDAI WORKSPACE</span></div><img src="/assets/homepage-video-poster-1280.webp" srcset="/assets/homepage-video-poster-640.webp 640w, /assets/homepage-video-poster-1280.webp 1280w" sizes="(max-width: 800px) 100vw, 52vw" alt="GriidAi workspace welcome screen with entry points for uploading data, spatial analysis and workflow automation" width="1280" height="720"><figcaption>${esc(caption)}</figcaption></figure>`;}
function dataFigure(key,{hero=false}={}){const media=dataMedia[key];const file=path.join(root,'assets/data',media.file);const bytes=fs.readFileSync(file);const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);const url='/assets/data/'+media.file;return `<figure class="data-product-figure data-figure-${key}${hero?' data-figure-hero':''}"><a class="data-image-link" href="${url}" data-image-viewer data-image-label="${esc(media.label)}" aria-label="Enlarge: ${esc(media.label)}" aria-describedby="data-caption-${key}"><img src="${url}" alt="${esc(media.alt)}" width="${width}" height="${height}" loading="${hero?'eager':'lazy'}" decoding="async"${hero?' fetchpriority="high"':''}></a><figcaption id="data-caption-${key}"><strong>${esc(media.label)}</strong><span>${esc(media.caption)}</span></figcaption></figure>`;}
function methodFigure(title,items){return `<aside class="hub-method-figure"><div class="hub-frame-bar"><span>ILLUSTRATIVE METHOD STRUCTURE</span><span aria-hidden="true">↗</span></div><p class="hub-method-question">${esc(title)}</p>${items.map(([a,b],i)=>`<div class="hub-method-row"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(a)}</strong><p>${esc(b)}</p></div>${i===items.length-1?'<span aria-hidden="true">✓</span>':''}</div>`).join('')}<div class="hub-method-caption">Visible inputs. Reviewable steps. Expert judgment.</div></aside>`;}
function mapArt(kind){const base='<path d="M-30 70 Q100 20 180 90T440 75M-30 150Q110 100 200 165T450 160M-20 235Q100 180 210 245T450 230" stroke="#fff" stroke-width="9" fill="none"/><path d="M70-20L140 290M250-30L280 300M-10 120L430 110" stroke="#f7faf6" stroke-width="5" fill="none"/>';
let shapes=kind===0?'<path d="M80-30Q310 75 175 125T230 300" stroke="#5595a5" stroke-width="7" fill="none"/><path d="M130 70L220 100M185 145L115 190M185 200L285 250" stroke="#5595a5" stroke-width="3"/>':kind===1?'<path d="M65 40L160 65 145 145 60 120ZM180 60L270 40 285 130 200 150ZM60 160L150 180 165 250 80 235ZM205 180L300 165 340 240 235 255Z" fill="#71a67f" stroke="#eef5e9" stroke-width="3"/>':kind===2?'<circle cx="190" cy="145" r="80" fill="#28758820" stroke="#287588" stroke-dasharray="5 6"/><circle cx="280" cy="185" r="62" fill="#28758815" stroke="#287588" stroke-dasharray="5 6"/><circle cx="190" cy="145" r="7" fill="#287588"/><circle cx="280" cy="185" r="7" fill="#287588"/>':'<path d="M-20 240Q120 90 230 150T440 40L440 300H-20Z" fill="#72a4b8" opacity=".75"/><path d="M-20 205Q120 60 230 120T440 10" fill="none" stroke="#287588" stroke-width="2" stroke-dasharray="7 5"/>';
if(kind===4)shapes='<path d="M95 95L220 170 320 85" fill="none" stroke="#287588" stroke-width="2" stroke-dasharray="5 6"/><circle cx="95" cy="95" r="19" fill="#287588"/><circle cx="220" cy="170" r="19" fill="#72a78e"/><circle cx="320" cy="85" r="19" fill="#91b49c"/><circle cx="95" cy="95" r="28" fill="none" stroke="#287588" stroke-width="2"/><text x="91" y="99" font-size="12" fill="white" font-family="Arial">A</text><text x="216" y="174" font-size="12" fill="white" font-family="Arial">B</text><text x="316" y="89" font-size="12" fill="white" font-family="Arial">C</text>';
return `<svg class="hub-map-art" viewBox="0 0 420 280" role="img" aria-label="Illustrative ${['terrain','vegetation','coverage','coastal','location comparison'][kind]} analysis diagram"><rect width="420" height="280" fill="#e6ecdf"/>${base}${shapes}<g fill="#b1b9a6" stroke="#fff" stroke-width="2"><path d="M305 60h28v22h-28zM88 88h26v20H88zM320 190h30v22h-30zM170 210h22v25h-22z"/></g><text x="18" y="263" font-size="9" fill="#365d5f" font-family="Arial">ILLUSTRATIVE • NOT A MEASURED RESULT</text></svg>`;}
function finalCTA(id,title,copy,actions){return `<section class="hub-closing" id="${id}"><div class="container"><span class="eyebrow">YOUR NEXT SPATIAL QUESTION</span><h2>${esc(title)}</h2>${paragraphs(copy)}<div class="actions">${actions}</div></div></section>`;}
function reliability(){return `<div class="hub-split"><div><h3>AI proposes the work. Experts control what proceeds.</h3><p>A plausible map can still be wrong when the projection, time window, units, selected data or analytical assumption is wrong. Review the plan before processing and validate the mapped or tabular result before using it.</p>${link('Explore Agentic GeoAI','/agentic-geoai/')}</div><div class="hub-review-list">${[['Inputs','Are these the intended datasets, geography and time period?'],['Method','Do the operations, units and parameters answer the question?'],['Validation','What checks should pass before accepting the output?'],['Output','Is the result fit for its intended use, or does it need deeper review?']].map(([a,b])=>`<div><span aria-hidden="true">✓</span><div><h3>${a}</h3><p>${b}</p></div></div>`).join('')}</div></div>`;}
function workflowLinks(ids=workflows.map(w=>w.id)){return grid(ids.map(id=>{const w=workflows.find(w=>w.id===id);return card(w.name,w.question,`<p class="hub-small"><strong>Inputs:</strong> ${esc(w.input)}</p>${link('Explore example method','/workflows/#'+w.id)}`,'EXAMPLE · '+w.domain);}),ids.length===2?2:3);}
function caseLinks(ids=cases.map(c=>c.id)){return grid(ids.map(id=>{const c=cases.find(x=>x.id===id);return card(c.name,c.question,link('Explore this use case','/use-cases/#'+c.id),c.pattern);}),ids.length===4?2:3);}
function industryLinks(){return grid(industries.map(i=>card(i.name,i.question,link('Explore industry context','/industries/#'+i.id))),2);}
function filterControls(id,options,placeholder){return `<form class="hub-filters" data-filter-for="${id}" role="search" hidden><div class="hub-search-field"><label for="${id}-search">Search ${id==='format-list'?'formats':id==='case-list'?'use cases':'workflows'}</label><input id="${id}-search" name="q" type="search" placeholder="${esc(placeholder)}" autocomplete="off"></div>${options.map(([label,name,values])=>`<div><label for="${id}-${name}">${label}</label><select id="${id}-${name}" name="${name}"><option value="">All ${label.toLowerCase()}</option>${values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></div>`).join('')}<button class="button secondary hub-clear" type="reset">Clear filters</button><p class="hub-filter-count" aria-live="polite" aria-atomic="true"></p></form>`;}
function noResults(id){return `<div class="hub-empty hub-no-results" data-empty-for="${id}" hidden><h3>No ${id==='format-list'?'formats':id==='case-list'?'use cases':'workflows'} match these filters.</h3><p>Try another search or clear a filter to explore the full collection.</p><button class="button secondary" data-reset="${id}">Clear filters</button></div>`;}

function dataPage(){return renderData({esc,hero,jump,section,paragraphs,button,link,table,stepper});}

function industriesPage(){return renderIndustries({esc,hero,jump,section,paragraphs,button,link});}

function useCasesPage(){return renderUseCases({esc,hero,jump,section,paragraphs,button,link,table,stepper,industries});}

function workflowsPage(){return renderWorkflows({esc,hero,jump,section,paragraphs,button,link,table,faq,stepper,industries});}

function ecosystemPage(){return renderEcosystem({esc,hero,jump,section,paragraphs,button,link,table,stepper});}

function enterprisePage(){return renderEnterprise({esc,hero,jump,section,paragraphs,button,link,table});}

function interestFormPage(){return renderEcosystemForm({esc,paragraphs,link});}

// A local Data review must not regenerate other hubs or shared navigation.
if(process.argv.includes('--data-only')){
 const file=path.join(root,'data/index.html');
 const html=fs.readFileSync(file,'utf8');
 const main=/<main\b[^>]*class="[^"]*\bhub-data\b[^"]*"[^>]*>[\s\S]*?<\/main>/;
 if(!main.test(html))throw new Error('Existing Data page shell was not found');
 const body=publicationRules(dataPage(),'data');
 fs.writeFileSync(file,html.replace(main,match=>match.slice(0,match.indexOf('>')+1)+body+'</main>'));
 console.log('Built Data only; retained its existing header, footer and metadata.');
 process.exit(0);
}

// Preserve the current site shell when editing only Enterprise content.
if(process.argv.includes('--enterprise-only')){
 const file=path.join(root,'enterprise/index.html');
 const html=fs.readFileSync(file,'utf8');
 const main=/<main\b[^>]*class="[^"]*\bhub-enterprise\b[^"]*"[^>]*>[\s\S]*?<\/main>/;
 if(!main.test(html))throw new Error('Existing Enterprise page shell was not found');
 const body=publicationRules(enterprisePage(),'enterprise');
 fs.writeFileSync(file,html.replace(main,match=>match.slice(0,match.indexOf('>')+1)+body+'</main>'));
 console.log('Built Enterprise only; retained its existing header, footer and metadata.');
 process.exit(0);
}

if(process.argv.includes('--use-cases-only')){
 const file=path.join(root,'use-cases/index.html');
 const html=fs.readFileSync(file,'utf8');
 const main=/<main\b[^>]*class="[^"]*\bhub-use-cases\b[^"]*"[^>]*>[\s\S]*?<\/main>/;
 if(!main.test(html))throw new Error('Existing Use Cases page shell was not found');
 const body=publicationRules(useCasesPage(),'use-cases');
 fs.writeFileSync(file,html.replace(main,match=>match.slice(0,match.indexOf('>')+1)+body+'</main>'));
 console.log('Built Use Cases only; retained its existing shell and detail pages.');
 process.exit(0);
}

if(process.argv.includes('--ecosystem-only')){
 const file=path.join(root,'ecosystem/index.html');
 const html=fs.readFileSync(file,'utf8');
 const main=/<main\b[^>]*class="[^"]*\bhub-ecosystem\b[^"]*"[^>]*>[\s\S]*?<\/main>/;
 if(!main.test(html))throw new Error('Existing Ecosystem page shell was not found');
 const body=publicationRules(ecosystemPage(),'ecosystem');
 fs.writeFileSync(file,html.replace(main,match=>match.slice(0,match.indexOf('>')+1)+body+'</main>'));
 console.log('Built Ecosystem only; retained its existing shell.');
 process.exit(0);
}

const pages=[
['data',dataContent.seo.title,dataContent.seo.description,dataPage],
['industries',industriesContent.seo.title,industriesContent.seo.description,industriesPage],
['use-cases',useCasesContent.seo.title,useCasesContent.seo.description,useCasesPage],
...useCasesContent.records.filter(c=>c.publicationStatus==='Published'&&c.productStatus!=='Roadmap').map(c=>['use-cases/'+c.id,c.name+' | GriidAi',c.summary||c.question,()=>renderUseCaseDetail({esc,hero,section,paragraphs,button,link},c)]),
...(workflowsEnabled?[['workflows',workflowContent.seo.title,workflowContent.seo.description,workflowsPage]]:[]),
['ecosystem',ecosystemContent.seo.title,ecosystemContent.seo.description,ecosystemPage],
['enterprise',enterpriseContent.seo.title,enterpriseContent.seo.description,enterprisePage],
['ecosystem/express-interest','Express Interest in the GriidAI Ecosystem','Tell the GriidAI team about your contribution, education, community or customer-facing partnership interests.',interestFormPage]
];
for(const [route,title,description,render] of pages){const name=route==='use-cases'?'Use Cases':route==='ecosystem/express-interest'?'Express Interest':route[0].toUpperCase()+route.slice(1);const detailRecord=route.startsWith('use-cases/')?useCasesContent.records.find(c=>route==='use-cases/'+c.id):null;const url=origin+'/'+route+'/';const schema={'@context':'https://schema.org','@graph':[{'@type':['industries','use-cases','workflows'].includes(route)?'CollectionPage':'WebPage',name:title,url,description},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},...(detailRecord?[{'@type':'ListItem',position:2,name:'Use Cases',item:origin+'/use-cases/'},{'@type':'ListItem',position:3,name:detailRecord.name,item:url}]:route.includes('express-interest')?[{'@type':'ListItem',position:2,name:'Ecosystem',item:origin+'/ecosystem/'},{'@type':'ListItem',position:3,name,item:url}]:[{ '@type':'ListItem',position:2,name,item:url}])]}]};
if(route==='use-cases')schema['@graph'].push({'@type':'ItemList',itemListElement:useCasesContent.records.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,url:origin+c.detailUrl}))});
if(route==='workflows')schema['@graph'].push({'@type':'ItemList',itemListElement:workflows.map((w,i)=>({'@type':'ListItem',position:i+1,name:w.name,url:url+'#'+w.id}))});
const heroImage=detailRecord?detailRecord.video.thumbnailBase:route==='use-cases'?useCasesContent.hero.video.thumbnailBase:route==='workflows'?'/assets/workflows/dem-hydrology-v1':route==='industries'?'/assets/industries/cross-industry-v1':route==='enterprise'?'/assets/enterprise/expert-control-v1':null;
const dataPreload=route==='data'?'<link rel="preload" as="image" href="/assets/data/illustrations/connected-data-v1-1280.webp" imagesrcset="/assets/data/illustrations/connected-data-v1-640.webp 640w, /assets/data/illustrations/connected-data-v1-1280.webp 1280w" imagesizes="(max-width: 700px) 100vw, 520px" fetchpriority="high">':'';
const imagePreload=heroImage?`<link rel="preload" as="image" href="${heroImage}-1280.webp" imagesrcset="${heroImage}-640.webp 640w, ${heroImage}-1280.webp 1280w" imagesizes="(max-width: ${['industries','enterprise'].includes(route)?767:700}px) 100vw, (max-width: 1050px) 50vw, 40vw" fetchpriority="high">`:'';
let html=`<!doctype html><html lang="en"><head>${imagePreload}${dataPreload}<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${route.includes('express-interest')||(detailRecord&&detailRecord.indexStatus==='Noindex')?'noindex,follow':'index,follow'}"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}${detailRecord?detailRecord.video.thumbnailBase+'-1280.webp':route==='use-cases'?useCasesContent.hero.video.thumbnailBase+'-1280.webp':route==='data'?'/assets/data/illustrations/connected-data-v1-1280.webp':route==='ecosystem'?'/assets/ecosystem/ecosystem-social-v1.png':'/assets/homepage-video-poster-1280.webp'}"><link rel="icon" type="image/png" sizes="180x180" href="/assets/griidai-icon.png"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/site-shell.css"><link rel="stylesheet" href="/hubs.css?v=section-nav-1"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><script src="/app.js" defer></script><script src="/hubs.js?v=section-nav-1" defer></script></head><body><a class="skip" href="#main">Skip to content</a>${header('/'+route+'/')}<main id="main" class="hub-page hub-${route.split('/')[0]}">${render()}</main>${footer()}</body></html>`;
html=publicationRules(html,route);
const dir=path.join(root,route);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html.replace('src="/app.js"','src="/site-navigation.js"').replace('</head>',(route==='data'?'<link rel="stylesheet" href="/data-gallery.css"><link rel="stylesheet" href="/data-page.css?v=compact-search-1"><script src="/data-gallery.js" defer></script><script src="/data-page.js?v=compact-search-1" defer></script>':route==='workflows'?'<link rel="stylesheet" href="/workflows-page.css"><script src="/workflows-page.js" defer></script>':route.startsWith('use-cases')?'<link rel="stylesheet" href="/use-cases-page.css"><script src="/use-cases-page.js" defer></script>':route==='industries'?'<link rel="stylesheet" href="/industries-page.css"><script src="/industries-page.js" defer></script>':route==='enterprise'?'<link rel="stylesheet" href="/enterprise-page.css"><script src="/enterprise-page.js" defer></script>':route.startsWith('ecosystem')?'<link rel="stylesheet" href="/ecosystem-page.css"><script src="/ecosystem-page.js" defer></script>':'')+'</head>')+'\n');}
// Retire the five generic pages without breaking existing bookmarks.
for(const [oldId,newId] of Object.entries(useCasesContent.retiredRoutes)){
 const target=newId?'/use-cases/'+newId+'/':'/use-cases/';
 const directory=path.join(root,'use-cases',oldId);fs.mkdirSync(directory,{recursive:true});
 const redirect='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url='+target+'"><link rel="canonical" href="'+origin+target+'"><title>Use Cases | GriidAi</title></head><body><p>This example has moved. <a href="'+target+'">Explore the current use cases</a>.</p></body></html>\n';
 fs.writeFileSync(path.join(directory,'index.html'),redirect);
}
// Apply the same navigation and footer to the existing site, without changing
// legacy content anchors or replacing page-specific layouts.
for(const route of ['','platform','agentic-geoai','spatial-analysis','solutions','about','pricing','contact-sales.html']){
const file=route.endsWith('.html')?path.join(root,route):path.join(root,route,'index.html');let html=fs.readFileSync(file,'utf8');
if(route==='contact-sales.html'){if(!html.includes('id="contact-no-script"'))html=html.replace('<form id="early-access-form">','<noscript id="contact-no-script"><style>#early-access-form{display:none}</style><p>Enable JavaScript to send this form, or email <a href="mailto:contact@griidai.com">contact@griidai.com</a>.</p></noscript><form id="early-access-form">');if(!html.includes('rel="canonical"'))html=html.replace('</head>','<link rel="canonical" href="'+origin+'/contact-sales.html"></head>');html=html.replace(/<!-- enterprise-qualification:start -->[\s\S]*?<!-- enterprise-qualification:end -->/,'');html=html.replace(/<div class="form-group">\s*<label for="gis-usage"/,enterpriseContactFields(esc)+'<div class="form-group">\n              <label for="gis-usage"');if(!html.includes('id="enterprise-qualification"'))throw Error('Enterprise form fields were not inserted');if(!html.includes('src="/enterprise-contact.js"'))html=html.replace('<script src="/assets/contact-sales/js/main.js">','<script src="/enterprise-contact.js"></script><script src="/assets/contact-sales/js/main.js">');}

html=html.replace(/<header[\s>][\s\S]*?<\/header>/,header(route.endsWith('.html')?'/'+route:'/'+(route?route+'/':'')));
html=html.replace(/<footer[\s>][\s\S]*?<\/footer>/,footer());
html=html.replace('src="/app.js"','src="/site-navigation.js"');
if(route==='contact-sales.html'&&!html.includes('id="main"'))html=html.replace('<body>','<body id="main">');
if(!html.includes('href="/site-shell.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/site-shell.css"></head>');
html=html.replace(/href="#detail" data-workflow="(\d+)"/g,(_,n)=>`href="/workflows/#${workflows[Number(n)].id}"`);
html=html.replace(/<a([^>]*?)class="modal-link"([^>]*?)href="[^"]*"/g,'<a$1class="ecosystem-link"$2href="/ecosystem/"');
html=html.replace(/<a([^>]*?)href="[^"]*"([^>]*?)class="modal-link"/g,'<a$1href="/ecosystem/"$2class="ecosystem-link"');
html=html.replace(/<a\b[^>]*\bclass="[^"]*\bmodal-link\b[^"]*"[^>]*>/g,tag=>tag.replace(/\bhref="[^"]*"/,'href="/ecosystem/"').replace(/\bmodal-link\b/,'ecosystem-link'));
html=html.replaceAll('href="/#data"','href="/data/"').replaceAll('href="/solutions/#industries"','href="/industries/"').replaceAll('href="/solutions/#use-cases"','href="/use-cases/"');
fs.writeFileSync(file,publicationRules(html,route));}
const sitemap=pages.filter(([r])=>!r.includes('express-interest')&&!(r.startsWith('use-cases/')&&useCasesContent.records.find(c=>r==='use-cases/'+c.id)?.indexStatus==='Noindex')).map(([r])=>`<url><loc>${origin}/${r}/</loc></url>`).join('');
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}</urlset>\n`);
// Hide the old route itself, not just its navigation entry. Source renderer and
// records stay in scripts for a reversible visibility change.
if(!workflowsEnabled){const hiddenFile=path.join(root,'workflows','index.html');if(fs.existsSync(hiddenFile))fs.unlinkSync(hiddenFile);}
console.log('Generated published hubs, individual use cases, intake and shared navigation.');
