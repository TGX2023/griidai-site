module.exports=function useCaseImage(record,{eager=false,sizes='(max-width: 767px) 100vw, 40vw'}={}){
 if(record.cover){
  const {esc}=require('../shared/content.cjs');
  const c=record.cover;
  if(!c.url)return `<div class="uc-cover-pending">${record.contentType==='blog'?'Choose a cover image to preview the article.':'Choose an image or add a YouTube link to preview the cover.'}</div>`;
  const f=c.focus?require('../shared/cover-focus.cjs').focus(c.focus):null;
  const position=f?` style="object-position:${f.x}% ${f.y}%${f.zoom>1?`;display:block;width:100%;height:100%;object-fit:cover;transform:scale(${f.zoom});transform-origin:${f.x}% ${f.y}%`:''}"`:'';
  const img=`<img src="${esc(c.url)}"${c.srcset?` srcset="${esc(c.srcset)}"`:''}${position} sizes="${esc(sizes)}" width="${c.width}" height="${c.height}" alt="${esc(c.alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
  return f?.zoom>1?`<span class="uc-cover-crop" style="display:block;aspect-ratio:16/9;overflow:hidden">${img}</span>`:img;
 }
 const base=record.video.thumbnailBase;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<img src="${base}-1280.webp" srcset="${base}-640.webp 640w, ${base}-1280.webp 1280w" sizes="${sizes}" width="1280" height="720" alt="Video thumbnail: ${esc(record.video.title)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
};
