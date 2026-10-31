const test=require('node:test'),assert=require('node:assert/strict');
const {select,section,inject}=require('../scripts/homepage-features.cjs');
const record=(id,order=0,blog=false)=>({id,documentId:id,name:'Example '+id,summary:'A clear summary.',featureOnHomepage:true,homepageOrder:order,publishedAt:'2026-10-31',detailUrl:`/${blog?'blogs':'use-cases'}/${id}/`,...(blog?{contentType:'blog'}:{}),cover:{url:'/assets/cover.webp',width:1280,height:720,alt:'A cover'}});
test('homepage selection caps each kind independently, uses explicit published picks and editorial order',()=>{
 const uc=[record('a',3),record('b',1),record('c',2),{...record('draft'),publishedAt:null},{...record('unselected'),featureOnHomepage:false}];
 const articles=[record('d',4,true),record('e',2,true),record('f',5,true)];
 assert.deepEqual(select(uc,articles).map(r=>r.id),['b','e','c','d']);assert.deepEqual(select([],[]),[]);
});
test('homepage renders safe linked cards in the requested location and omits an empty section',()=>{
 const shell='<head></head><main><section id="data"></section><section class="section pale" id="solutions"></section></main>';
 assert.equal(inject(shell,[],[]),shell);
 const html=inject(shell,[{...record('one'),name:'A < B',summary:'<script>bad</script>'}],[record('two',1,true)]);
 assert.ok(html.indexOf('id="find-news"')>html.indexOf('id="data"'));assert.ok(html.indexOf('id="find-news"')<html.indexOf('id="solutions"'));
 assert.equal((html.match(/data-home-feature=/g)||[]).length,2);assert.match(html,/href="\/use-cases\/one\/"/);assert.match(html,/href="\/blogs\/two\/"/);assert.match(html,/A &lt; B/);assert.doesNotMatch(html,/<script>bad/);assert.match(html,/home-features.css/);
 assert.equal(section([],[]),'');
});
