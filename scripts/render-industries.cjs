const content=require('./industries-content.json');
const workflows=require('./workflows-content.json');
const {workflowsEnabled}=require('./site-publication.cjs');
const fs=require('node:fs');
const path=require('node:path');

module.exports=function renderIndustries(ui){
  const {esc,hero,jump,section,paragraphs,button,link}=ui;
  const records=content.records.filter(i=>i.publicationStatus==='Published'&&i.featured).sort((a,b)=>a.order-b.order);
  function image(folder,key,alt,eager=false){
    const file=key+'-v1',bytes=fs.readFileSync(path.join(__dirname,'../dist/assets',folder,file+'.png'));
    return `<img src="/assets/${folder}/${file}-1280.webp" srcset="/assets/${folder}/${file}-640.webp 640w, /assets/${folder}/${file}-1280.webp 1280w" sizes="(max-width: 767px) 100vw, (max-width: 1050px) 50vw, 40vw" width="${bytes.readUInt32BE(16)}" height="${bytes.readUInt32BE(20)}" alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
  }
  const figure=(folder,key,name,cls='',eager=false)=>`<figure class="ih-concept ${cls}">${image(folder,key,'Conceptual illustration of '+name+'; not a software screenshot or a measured result.',eager)}<figcaption>Illustrative</figcaption></figure>`;
  const heroVisual=figure('industries','cross-industry','one connected landscape with environmental project context, coastal exposure, service coverage and candidate locations','ih-hero-art',true);
  const selector=records.map((industry,index)=>`<article class="ih-industry-card" data-industry="${industry.id}" data-position="${index+1}"><div class="ih-industry-copy"><h3>${esc(industry.name)}</h3>${paragraphs(industry.copy)}${link(industry.cta,industry.detailUrl||industry.url)}</div>${figure('industries',industry.image,industry.name)}</article>`).join('');
  const pattern=`<div class="hub-reading">${paragraphs(content.pattern.paragraphs)}</div><ol class="ih-pattern-flow">${content.pattern.stages.map(stage=>`<li>${esc(stage)}</li>`).join('')}</ol><div class="ih-example-grid">${records.map(i=>`<article><h3>${esc(i.name)}</h3><p class="ih-example-question">${esc(i.example[1])}</p><p>${esc(i.example[2])}</p></article>`).join('')}</div><div class="ih-section-links">${link('See the Platform','/platform/')}</div>`;
  const matrix=records.map(i=>`<details class="ih-matrix-row" id="${i.id}" open><summary><h3>${esc(i.name)}</h3><span aria-hidden="true">+</span></summary><div><dl>${i.matrix.slice(1).map((copy,index)=>`<div><dt>${esc(content.matrix.headers[index+1])}</dt><dd>${esc(copy)}</dd></div>`).join('')}</dl></div></details>`).join('');
  const process=`<div class="hub-reading">${paragraphs(content.process.copy)}</div><ol class="ih-process">${content.process.steps.map(([step,what,responsibility])=>`<li><h3>${esc(step)}</h3>${paragraphs(what)}<div class="ih-responsibility"><strong>${esc(content.process.headers[2])}</strong><p>${esc(responsibility)}</p></div></li>`).join('')}</ol><div class="ih-section-links">${link('See how GriidAi plans and reviews analysis','/agentic-geoai/')}${link('Explore Spatial Analysis','/spatial-analysis/')}${link('Data','/data/')}${link('Bring Your Own Data','/data/#bring-your-data')}</div>`;
  const workflowCards=content.workflows.rows.map(([name,fit],index)=>{
    const workflow=workflows.records.find(w=>w.name===name&&w.publicationStatus==='Published'&&['Live','Beta','Example'].includes(w.status));if(!workflow)return '';
    return `<article class="ih-proof-card ih-workflow-card" data-workflow="${workflow.id}" data-status="${workflow.status}" data-position="${index+1}">${figure('workflows',workflow.image,workflow.name)}<div class="ih-proof-copy"><span class="hub-tag">${esc(workflow.status)}</span><h3>${esc(name)}</h3><p class="ih-decision-question">${esc(workflow.question)}</p><dl><dt>Industries</dt><dd>${esc(fit)}</dd><dt>Inputs</dt><dd>${esc(workflow.input)}</dd></dl>${link('View Workflow','/workflows/#'+workflow.id)}</div></article>`;
  }).join('');
  const review=`<div class="ih-review-layout"><div class="ih-review-copy"><div class="hub-section-heading"><h2>${esc(content.review.title)}</h2></div><div class="hub-reading">${paragraphs(content.review.copy)}</div></div><div class="hub-review-list">${content.review.checks.map(([name,question])=>`<div><span aria-hidden="true">✓</span><div><h3>${esc(name)}</h3><p>${esc(question)}</p></div></div>`).join('')}</div></div>`;
  const audience=`<div class="ih-audience-paths">${content.audience.table[0].map((title,index)=>`<article class="ih-audience-path"><h3>${esc(title)}</h3>${paragraphs(content.audience.table[1][index])}<div class="actions">${button(content.audience.table[2][index].replace('Primary CTA: ',''),index?'/contact-sales.html':'https://app.griidai.com')}${index?link(content.audience.table[3][index].replace('Secondary: ',''),'/enterprise/'):''}</div></article>`).join('')}</div>`;
  return hero(content.hero.eyebrow,content.hero.title,content.hero.copy,button(content.hero.primaryCTA,'#industry-directory')+button(content.hero.secondaryCTA,'https://app.griidai.com',false),heroVisual)+
    jump([['Industries','industry-directory'],...(workflowsEnabled?[['Workflows','industry-workflows']]:[]),['How It Works','how-it-works'],['Enterprise','industry-enterprise']])+
    section('industry-directory','',content.selector.title,`<div class="ih-selector-grid">${selector}</div>`,{intro:content.selector.intro})+
    section('industry-pattern','',content.pattern.title,pattern,{pale:true})+
    section('decision-matrix','',content.matrix.title,`<div class="ih-matrix">${matrix}</div>`)+
    section('how-it-works','',content.process.title,process,{pale:true})+
    (workflowsEnabled?section('industry-workflows','',content.workflows.title,`<div class="ih-proof-grid">${workflowCards}</div>`,{pale:true}):'')+
    `<section class="hub-section" id="industry-review"><div class="container">${review}</div></section>`+
    section('industry-enterprise','',content.audience.title,audience,{pale:true})+
    `<section class="hub-closing ih-final" id="industry-next-step"><div class="container"><h2>${esc(content.final.title)}</h2>${paragraphs(content.final.copy)}<div class="actions">${button(content.final.primaryCTA,'https://app.griidai.com')}${button(content.final.secondaryCTA,'/contact-sales.html',false)}</div>${link(content.final.textLink,'/solutions/')}</div></section>`;
};
