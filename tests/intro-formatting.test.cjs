const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeIntro,introText,synchronizeIntro,titleHTML,summaryHTML}=require('../shared/intro-formatting.cjs');
const {metadata}=require('../shared/seo.cjs');
const text=(t,marks=[])=>({type:'text',text:t,marks});
const doc=(t,marks=[])=>({type:'doc',content:[{type:'paragraph',attrs:{textAlign:'center'},content:[text(t,marks)]}]});
test('formatting synchronizes plain titles and descriptions without changing slugs or old records',()=>{
 const existing={title:'Old title',summary:'Old summary',slug:'stable-url'},data={titleFormatting:doc('New title',[{type:'bold'}]),summaryFormatting:doc('New summary',[{type:'italic'}])};
 synchronizeIntro(data,existing);assert.equal(data.title,'New title');assert.equal(data.summary,'New summary');assert.equal(existing.title,'Old title');assert.equal(existing.slug,'stable-url');assert.equal(data.slug,undefined);
 const old={title:'Old plain title'};synchronizeIntro(old);assert.deepEqual(old,{title:'Old plain title'});
 const changed={title:'Plain API edit'};synchronizeIntro(changed,{titleFormatting:doc('New title')});assert.equal(changed.titleFormatting,null);
 assert.throws(()=>synchronizeIntro({titleFormatting:doc('a'.repeat(161))}),/160/);assert.doesNotThrow(()=>synchronizeIntro({titleFormatting:doc('a'.repeat(200))},{},'blog'));
});
test('title rendering uses inline formatting inside one main heading and never creates nested headings or links',()=>{
 const d={type:'doc',content:[{type:'heading',attrs:{level:2,textAlign:'right'},content:[text('Title',[{type:'bold'},{type:'link',attrs:{href:'https://example.org/'}},{type:'partStyle',attrs:{fontSize:40,brand:true,color:'red'}}])]},...doc('Second line').content]};
 const title=normalizeIntro(d,{title:true}),record={name:introText(title),titleFormatting:title};const html=titleHTML(record);
 assert.match(html,/cms-title-line uc-part-align-right/);assert.match(html,/<strong>/);assert.match(html,/uc-part-brand/);assert.match(html,/--part-font-size:40px/);assert.match(html,/Second line/);assert.doesNotMatch(html,/<p|<h[1-6]|<a|red/);
 assert.throws(()=>normalizeIntro({type:'doc',content:[{type:'table',content:[]}]},{title:true}));
 assert.equal(titleHTML({...record,name:'Changed externally'}),'Changed externally');
});
test('descriptions preserve lists and safe links but strip hidden routes and unsupported styles',()=>{
 const d={type:'doc',content:[{type:'bulletList',content:[{type:'listItem',content:doc('A useful summary',[{type:'italic'},{type:'link',attrs:{href:'/industries/'}},{type:'partStyle',attrs:{fontSize:'100;bad',brand:false}}]).content}]}]};
 const formatted=normalizeIntro(d),record={summary:introText(formatted),summaryFormatting:formatted};const html=summaryHTML(record);assert.match(html,/<ul><li>/);assert.match(html,/<em>/);assert.doesNotMatch(html,/industries|100;bad|href=/);
});
test('metadata stays plain while use-case and blog cards, hero sections and previews show formatting',()=>{
 const titleFormatting=doc('Formatted title',[{type:'bold'},{type:'partStyle',attrs:{fontSize:32,brand:true}}]),summaryFormatting=doc('Formatted description',[{type:'italic'}]);
 const base=require('../scripts/use-cases-content.json').records[0],r={...base,name:'Formatted title',summary:'Formatted description',titleFormatting,summaryFormatting};
 const pages=require('../scripts/cms-pages.cjs');const opts={siteURL:'https://griidai.com'};
 const detail=pages.detail(r,[r],opts);assert.match(detail,/<h1><span class="cms-title-line/);assert.match(detail,/cms-formatted-summary/);assert.match(detail,/<em>Formatted description<\/em>/);assert.match(pages.hub([r],opts),/cms-card-summary/);
 const meta=metadata(r,opts);assert.match(meta,/<title>Formatted title \| GriidAi<\/title>/);assert.match(meta,/name="description" content="Formatted description"/);assert.doesNotMatch(meta,/<strong>|uc-part-brand|font-size/);
 const blogs=require('../scripts/render-blogs.cjs');const b=blogs.snapshot({title:r.name,summary:r.summary,titleFormatting,summaryFormatting,body:doc('Blog body'),authorName:'Writer'},'http://localhost:1337');assert.match(blogs.card(b),/cms-title-line/);assert.match(blogs.detail(b,[],{...opts,preview:true}),/<em>Formatted description<\/em>/);
});
