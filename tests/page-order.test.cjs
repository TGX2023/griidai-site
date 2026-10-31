const test=require('node:test'),assert=require('node:assert/strict');
const {pageOrder}=require('../shared/page-order.cjs');
const render=require('../scripts/render-use-case-detail.cjs'),ui=require('../scripts/use-case-ui.cjs');
const p=text=>({type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]});
test('every fixed section and part can move anywhere in the page, exactly once',()=>{
 const parts=[{id:'a',content:p('Alpha marker')},{id:'b',content:p('Beta marker')}];
 const order=['section:results','part:b','section:method','section:video','part:a','section:hero','section:credits','section:return','section:topics'];
 assert.deepEqual(pageOrder(parts,order),order.filter(key=>!['section:topics','section:credits'].includes(key)));
 const source=require('../scripts/use-cases-content.json').records[0];
 const html=render(ui,{...source,mediaType:'video',parts,contentOrder:order});
 const markers=['id="use-case-results"','Beta marker','id="use-case-method"','id="watch-example"','Alpha marker','class="container hub-hero"','uc-detail-return'];
 for(let i=1;i<markers.length;i++)assert.ok(html.indexOf(markers[i-1])<html.indexOf(markers[i]),markers[i]+' follows '+markers[i-1]);
 assert.equal((html.match(/Alpha marker/g)||[]).length,1);assert.equal((html.match(/id="watch-example"/g)||[]).length,1);
});
test('unknown and repeated block IDs are discarded, new parts included, and deleting a part removes its slot',()=>{
 const parts=[{id:'one'},{id:'two'}];
 const order=pageOrder(parts,['section:hero','section:hero','part:one','part:missing','<script>','section:return']);
 assert.equal(order.filter(x=>x==='section:hero').length,1);assert.ok(!order.includes('part:missing'));assert.ok(!order.includes('<script>'));assert.ok(order.includes('part:two'));
 const removed=pageOrder(parts.slice(1),order);assert.ok(!removed.includes('part:one'));
 assert.throws(()=>pageOrder(parts,Array(101).fill('section:hero')));
});
