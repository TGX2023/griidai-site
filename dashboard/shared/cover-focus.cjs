const clamp=(value,min,max,fallback)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
function focus(value={}) {
 return {x:clamp(value?.x,0,100,50),y:clamp(value?.y,0,100,50),zoom:clamp(value?.zoom,1,3,1)};
}
function crop(width,height,value) {
 const f=focus(value);
 const baseWidth=Math.min(width,Math.floor(height*16/9));
 const w=Math.max(1,Math.floor(baseWidth/f.zoom));
 const h=Math.max(1,Math.min(height,Math.floor(w*9/16)));
 return {left:Math.round((width-w)*f.x/100),top:Math.round((height-h)*f.y/100),width:w,height:h};
}
module.exports={focus,crop};
