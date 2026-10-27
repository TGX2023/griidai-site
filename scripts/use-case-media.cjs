module.exports=function useCaseImage(record,{eager=false,sizes='(max-width: 767px) 100vw, 40vw'}={}){
 const base=record.video.thumbnailBase;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<img src="${base}-1280.webp" srcset="${base}-640.webp 640w, ${base}-1280.webp 1280w" sizes="${sizes}" width="1280" height="720" alt="Video thumbnail: ${esc(record.video.title)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
};
