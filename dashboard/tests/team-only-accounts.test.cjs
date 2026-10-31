const test = require('node:test');
const assert = require('node:assert/strict');
const extend = require('../cms/src/extensions/users-permissions/strapi-server');

test('visitor account endpoints are removed while admin routes and existing account data stay intact', () => {
  const admin = {type:'admin', routes:[{path:'/roles'}]};
  const attributes = {email:{type:'email'}, password:{type:'password'}};
  const plugin = {routes:{admin,'content-api':()=>({routes:[{path:'/auth/local/register'}]})},contentTypes:{user:{schema:{collectionName:'up_users',attributes,pluginOptions:{other:{enabled:true}}}}}};
  const result = extend(plugin);
  assert.deepEqual(result.routes['content-api'], {type:'content-api',routes:[]});
  assert.equal(result.routes.admin, admin);
  assert.equal(result.contentTypes.user.schema.attributes, attributes);
  assert.equal(result.contentTypes.user.schema.collectionName, 'up_users');
  assert.equal(result.contentTypes.user.schema.pluginOptions['content-manager'].visible, false);
  assert.equal(result.contentTypes.user.schema.pluginOptions['content-type-builder'].visible, false);
  assert.equal(result.contentTypes.user.schema.pluginOptions.other.enabled, true);
});
