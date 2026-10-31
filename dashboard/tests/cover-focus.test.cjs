const test=require('node:test');const assert=require('node:assert/strict');
const {focus,crop}=require('../shared/cover-focus.cjs');
test('16:9 covers need zoom before either focus axis can change the visible area',()=>{
 assert.deepEqual(crop(1280,720,{x:0,y:0}),crop(1280,720,{x:100,y:100}));
 assert.deepEqual(crop(1280,720,{x:0,y:0,zoom:2}),{left:0,top:0,width:640,height:360});
 assert.deepEqual(crop(1280,720,{x:100,y:100,zoom:2}),{left:640,top:360,width:640,height:360});
 assert.deepEqual(crop(1280,720,{x:50,y:50,zoom:2}),{left:320,top:180,width:640,height:360});
});
test('portrait and wide covers crop within bounds; older saved focus defaults to no zoom',()=>{
 assert.deepEqual(crop(900,1200,{x:50,y:100}),{left:0,top:694,width:900,height:506});
 assert.deepEqual(crop(2400,900,{x:100,y:50}),{left:800,top:0,width:1600,height:900});
 for(const [w,h] of [[1,1],[1280,720],[900,1200],[2400,900]])for(const zoom of [1,1.5,3]){const c=crop(w,h,{x:100,y:100,zoom});assert.ok(c.left>=0&&c.top>=0&&c.width>0&&c.height>0&&c.left+c.width<=w&&c.top+c.height<=h);}
 assert.deepEqual(focus({x:10,y:90}),{x:10,y:90,zoom:1});
 assert.deepEqual(focus({x:'bad',y:-10,zoom:99}),{x:50,y:0,zoom:3});
});
