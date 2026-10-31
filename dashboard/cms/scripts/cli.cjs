// Strapi 5.59's CLI searches ancestor folders for tsconfig.json, even in a JS app.
// Keep this standalone CMS isolated from an unrelated parent project's TS build.
const fs=require('node:fs');const path=require('node:path');
const pkg=path.dirname(require.resolve('@strapi/strapi/package.json'));
const config=require(path.join(pkg,'dist/src/cli/utils/tsconfig.js'));
const load=config.loadTsConfig;
config.loadTsConfig=options=>fs.existsSync(path.join(options.cwd,'tsconfig.json'))?load(options):undefined;
require(path.join(pkg,'dist/cli.js')).runCLI(process.argv).catch(error=>{console.error(error.message);process.exitCode=1;});
