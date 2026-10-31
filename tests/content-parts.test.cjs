const test=require('node:test'),assert=require('node:assert/strict');
const {legacyParts,normalizeParts,partRich,renderParts,hasPartContent}=require('../shared/content-parts.cjs');
const paragraph=text=>({type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]});

test('extended writing tools persist through the sanitizer and render safely',()=>{
 const text={type:'text',text:'CO2',marks:[{type:'subscript'},{type:'highlight',attrs:{color:'red'}}]};
 const content={type:'doc',content:[{type:'heading',attrs:{level:5},content:[text]},{type:'taskList',content:[{type:'taskItem',attrs:{checked:true,onchange:'bad'},content:paragraph('Reviewed').content}]},{type:'table',content:[{type:'tableRow',content:[{type:'tableHeader',attrs:{colspan:2,rowspan:1,style:'color:red'},content:paragraph('Input').content},{type:'tableCell',attrs:{colspan:'99;bad',rowspan:400},content:paragraph('Output').content}]}]},{type:'orderedList',attrs:{start:3},content:[{type:'listItem',content:paragraph('Step').content}]}]};
 const html=partRich(content);assert.match(html,/<h5>/);assert.match(html,/<mark class="uc-part-highlight"><sub>/);assert.match(html,/disabled aria-label="Checklist item" checked/);assert.match(html,/<th colspan="2" rowspan="1">/);assert.match(html,/<td colspan="1" rowspan="1">/);assert.match(html,/<ol start="3">/);assert.doesNotMatch(html,/red|onchange|400|99;bad/);
});
test('legacy introduction keeps its heading and all prose in the first part',()=>{
 const parts=legacyParts('Original question',['First paragraph','Second paragraph']);
 const html=renderParts(parts);assert.match(html,/<h2>Original question<\/h2>/);assert.match(html,/First paragraph/);assert.match(html,/Second paragraph/);assert.ok(hasPartContent(parts));
});
test('part formatting supports headings, sizes, brand green, alignment and lists without arbitrary styles',()=>{
 const content={type:'doc',content:[{type:'heading',attrs:{level:3,textAlign:'center',style:'background:red'},content:[{type:'text',text:'Heading',marks:[{type:'partStyle',attrs:{fontSize:32,brand:true,color:'red'}},{type:'underline'}]}]},{type:'bulletList',content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Point'}]}]}]}]};
 const html=partRich(content);assert.match(html,/<h3 class="uc-part-align-center">/);assert.match(html,/--part-font-size:32px/);assert.match(html,/uc-part-brand/);assert.match(html,/<u>/);assert.match(html,/<ul><li><p>Point/);assert.doesNotMatch(html,/red|background/);
});
test('untrusted links, colors, HTML, image URLs, and oversized dimensions cannot escape the renderer',()=>{
 const content=paragraph('<script>alert(1)</script>');
 content.content[0].attrs={textAlign:'left;position:fixed'};
 content.content[0].content[0].marks=[{type:'link',attrs:{href:'javascript:alert(1)'}},{type:'link',attrs:{href:'/industries/'}},{type:'partStyle',attrs:{fontSize:'80;position:fixed',brand:'red'}}];
 const parts=normalizeParts([{content,image:{id:3,url:'javascript:alert(1)'},imageWidth:900,imagePosition:'" onload="alert(1)'}]);
 const html=renderParts(parts);assert.doesNotMatch(html,/<script>|javascript:|href=|onload=|position:fixed|<img/);assert.match(html,/&lt;script&gt;/);assert.equal(parts[0].imageWidth,100);assert.equal(parts[0].imagePosition,'right');
 assert.throws(()=>normalizeParts(Array(41).fill({})));assert.equal(hasPartContent([]),false);
});
test('part image dimensions and placement are shared by saved and live previews',()=>{
 const parts=normalizeParts([{content:paragraph('Description'),image:{id:4,url:'/uploads/image.webp',width:640,height:480},imageAlt:'A "test" map',imagePosition:'left',imageWidth:35}],{publicURL:'http://localhost:1337'});
 const html=renderParts(parts);assert.match(html,/uc-part-left/);assert.match(html,/--part-image-width:35%/);assert.match(html,/src="http:\/\/localhost:1337\/uploads\/image.webp"/);assert.match(html,/alt="A &quot;test&quot; map"/);assert.match(html,/height="480"/);
});
test('All Use Cases search indexes current part text instead of the retired question field',()=>{
 const pages=require('../scripts/cms-pages.cjs');
 const record={...require('../scripts/use-cases-content.json').records[0],group:'demonstrations',question:'Obsolete question marker',parts:[{id:'search-example',content:paragraph('Current part search needle')}]};
 const html=pages.hub([record],{siteURL:'http://localhost:3000'});
 const search=html.match(/data-search="([^"]*)"/)[1];
 assert.match(search,/Current part search needle/);assert.doesNotMatch(search,/Obsolete question marker/);
});
test('parts render above or below video in group order; older parts default above',()=>{
 const render=require('../scripts/render-use-case-detail.cjs'),ui=require('../scripts/use-case-ui.cjs');
 const record={...require('../scripts/use-cases-content.json').records[0],mediaType:'video',parts:[{id:'a',content:paragraph('Above first')},{id:'b',placement:'below-video',content:paragraph('Below first')},{id:'c',content:paragraph('Above second')},{id:'d',placement:'below-video',content:paragraph('Below second')}]};
 const html=render(ui,record),video=html.indexOf('id="watch-example"');
 assert.ok(html.indexOf('Above first')<html.indexOf('Above second'));
 assert.ok(html.indexOf('Above second')<video);
 assert.ok(video<html.indexOf('Below first'));
 assert.ok(html.indexOf('Below first')<html.indexOf('Below second'));
 assert.ok(html.indexOf('Below second')<html.indexOf('id="use-case-method"'));
 assert.equal(normalizeParts([{content:paragraph('Default'),placement:'invalid'}])[0].placement,'above-video');
 const imageHTML=render(ui,{...record,mediaType:'image'});
 assert.doesNotMatch(imageHTML,/id="watch-example"|id="use-case-content-after-video"/);
 assert.ok(imageHTML.indexOf('Above first')<imageHTML.indexOf('Below first'));
 assert.ok(imageHTML.indexOf('Below first')<imageHTML.indexOf('Above second'));
 const onlyBelow=render(ui,{...record,parts:[record.parts[1]]});
 assert.doesNotMatch(onlyBelow,/id="use-case-overview"/);
 assert.ok(onlyBelow.indexOf('id="watch-example"')<onlyBelow.indexOf('Below first'));
});
