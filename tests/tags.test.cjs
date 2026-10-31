const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeTags,tagKey,filterByTag,tagsHTML,tagFilterHTML}=require('../shared/tags.cjs');
test('tags normalize spacing and Unicode, reject invalid values and deduplicate case-insensitively',()=>{
 assert.deepEqual(normalizeTags([' Solar  Energy ','solar energy','Remote Sensing']),['Solar Energy','Remote Sensing']);assert.deepEqual(normalizeTags(null),[]);assert.equal(tagKey(' ＳＡＲ '),'sar');
 assert.throws(()=>normalizeTags('one'));assert.throws(()=>normalizeTags(Array(13).fill('tag')));assert.throws(()=>normalizeTags(['<script>bad</script>']));assert.throws(()=>normalizeTags(['a'.repeat(51)]));
});
test('tag links point to their own collection and safely encode the selected topic',()=>{
 assert.match(tagsHTML({tags:['Solar Energy'],detailUrl:'/use-cases/solar/'}),/href="\/use-cases\/\?tag=solar%20energy"/);
 assert.match(tagsHTML({contentType:'blog',tags:['SAR & GIS'],detailUrl:'/blogs/sar/'}),/href="\/blogs\/\?tag=sar%20%26%20gis"/);assert.match(tagsHTML({tags:['SAR & GIS']}),/SAR &amp; GIS/);
 assert.equal(tagsHTML({tags:[]}), '');assert.doesNotMatch(tagFilterHTML([], '<img src=x>',{base:'/blogs/'}),/<img/);
});
test('server filters are exact and case-insensitive, and unknown tags return no records',()=>{
 const records=[{id:'a',tags:['Solar Energy']},{id:'b',tags:['Urban Planning']},{id:'c'}];assert.deepEqual(filterByTag(records,'solar energy').map(r=>r.id),['a']);assert.deepEqual(filterByTag(records,'solar'),[]);assert.equal(filterByTag(records,'').length,3);
 const filter=tagFilterHTML(records,'SOLAR ENERGY');assert.match(filter,/value="solar energy" selected/);assert.match(filter,/All tags/);assert.match(filter,/Clear filter/);
});
test('filtered hubs render only matching cards, preserve canonical hub URLs and include tags in search',()=>{
 const base=require('../scripts/use-cases-content.json').records[0],pages=require('../scripts/cms-pages.cjs'),siteURL='https://griidai.com';
 const records=[{...base,id:'tagged',name:'Tagged case',detailUrl:'/use-cases/tagged/',tags:['Solar Energy']},{...base,id:'other',name:'Other case',detailUrl:'/use-cases/other/',tags:['Urban Planning']}];
 const html=pages.hub(records,{siteURL,tagFilter:'solar energy'});assert.match(html,/data-use-case="tagged"/);assert.doesNotMatch(html,/data-use-case="other"/);assert.match(html,/canonical" href="https:\/\/griidai.com\/use-cases\/"/);assert.match(html,/data-search="[^"]*Solar Energy/);assert.match(html,/href="\/use-cases\/other\/"/);
 const blogs=require('../scripts/render-blogs.cjs'),blog=(r)=>({...r,contentType:'blog',authorName:'Writer',publicationDate:'2026-10-28',category:'Geospatial AI',detailUrl:'/blogs/'+r.id+'/'});
 const blogHTML=blogs.hub(records.map(blog),{siteURL,tagFilter:'urban planning'});assert.match(blogHTML,/data-blog-search="other case/);assert.doesNotMatch(blogHTML,/data-blog-search="tagged case/);assert.match(blogHTML,/canonical" href="https:\/\/griidai.com\/blogs\/"/);
});
