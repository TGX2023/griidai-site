const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.join(__dirname,'../cms/.env');
let contents=fs.existsSync(file)?fs.readFileSync(file,'utf8'):fs.readFileSync(file+'.example','utf8');
for(const key of ['APP_KEYS','API_TOKEN_SALT','ADMIN_JWT_SECRET','TRANSFER_TOKEN_SALT','JWT_SECRET','ENCRYPTION_KEY','PREVIEW_SECRET']){
 const expression=new RegExp('^'+key+'=(.*)$','m'),value=contents.match(expression)?.[1]?.trim();if(value)continue;
 const secret=crypto.randomBytes(32).toString('hex');contents=expression.test(contents)?contents.replace(expression,key+'='+secret):contents+'\n'+key+'='+secret+'\n';
}
fs.writeFileSync(file,contents,{mode:0o600});console.log('Private local CMS configuration prepared. Existing keys preserved. Read cms/.env locally; never commit it.');
