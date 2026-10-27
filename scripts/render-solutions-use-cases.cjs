const content=require('./use-cases-content.json');
const image=require('./use-case-media.cjs');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

module.exports=function updateSolutionsCases(html){
 html=html.replace(/<a href="\/platform\/#outputs">(?=<span class="index">04<\/span><h3>Maps &amp; Outputs)/,'<a href="/data/#data-outputs">');
 const records=content.records.filter(record=>record.publicationStatus==='Published');
 const cards=records.map(record=>`<a class="solution-case-tile" data-solution-use-case="${esc(record.id)}" href="${esc(record.detailUrl)}"><div class="solution-case-thumbnail">${image(record,{sizes:'(max-width: 560px) 50vw, (max-width: 1000px) 33vw, 25vw'}).replace(/alt="[^"]*"/,'alt=""')}</div><div class="solution-case-copy"><h3>${esc(record.name)}</h3><span class="solution-case-action">${esc(record.kind)}<span aria-hidden="true">↗</span></span></div></a>`).join('');
 const section=`<section class="section container" id="use-cases"><span class="eyebrow">03 / USE CASES</span><h2>Start from the question<br>you need to answer</h2><div class="solution-case-library">${cards}</div></section>`;
 html=html.replace(/<section\b[^>]*id="use-cases"[^>]*>[\s\S]*?<\/section>/,section);
 // Industry descriptions and disclosures remain; their extra navigation is removed.
 html=html.replace(/<section\b[^>]*id="industries"[^>]*>[\s\S]*?<\/section>/,section=>section.replace(/<a\b[^>]*class="text-link"[^>]*>[\s\S]*?<\/a>/g,''));
 // The old local example anchors no longer exist after replacing the library.
 const destinations={'#flood-risk':'/use-cases/sea-level-rise/','#coverage':'/use-cases/sports-facility-site-selection/','#hydrology':'/spatial-analysis/#hydrology'};
 html=html.replace(/<aside\b[^>]*class="decision-panel[^>]*>[\s\S]*?<\/aside>/,panel=>panel.replace(/href="(#[^"]+)"/g,(attribute,hash)=>destinations[hash]?`href="${destinations[hash]}"`:attribute));
 return html;
};
