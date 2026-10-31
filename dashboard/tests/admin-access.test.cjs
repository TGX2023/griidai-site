const test = require('node:test');
const assert = require('node:assert/strict');
const {isSuperAdmin, assertRepeatableChanges, registerSettingsPolicies} = require('../cms/src/admin-access');
const item = id => ({id, content:{type:'doc',content:[]}});

test('Super Admin requires an authenticated admin strategy and the role code', () => {
  const ctx = {state:{auth:{strategy:{name:'admin'}},user:{roles:[{code:'strapi-super-admin'}]}}};
  assert.equal(isSuperAdmin(ctx),true);
  assert.ok(!isSuperAdmin({state:{...ctx.state,auth:{strategy:{name:'users-permissions'}}}}));
  assert.ok(!isSuperAdmin({state:{...ctx.state,user:{roles:[{name:'Super Admin',code:'marketing-editor'}]}}}));
  assert.ok(!isSuperAdmin({}));
});

test('all repeated lists reject deletion, replacement, duplicates, and reordering for non-admins', () => {
  for (const field of ['inputs','steps','outputs','review','topics']) {
    const existing = {[field]:[item(1),item(2)]};
    for (const value of [[],null,[item(2)],[item(2),item(1)],[item(1),item(1),item(2)],[item(3),item(4)]]) {
      assert.throws(()=>assertRepeatableChanges(existing,{[field]:value},false),{name:'ForbiddenError'});
    }
    assert.doesNotThrow(()=>assertRepeatableChanges(existing,{[field]:[item(1),{content:'New'},item(2)]},false));
    assert.doesNotThrow(()=>assertRepeatableChanges(existing,{[field]:[item(1),item(2)]},false));
    assert.doesNotThrow(()=>assertRepeatableChanges(existing,{title:'Text update'},false));
    assert.doesNotThrow(()=>assertRepeatableChanges(existing,{[field]:[]},true));
    assert.doesNotThrow(()=>assertRepeatableChanges(null,{[field]:[]},false));
  }
});

test('Settings policy guards management routes without blocking content, own profile, or media reads', () => {
  const management = action => ({config:{policies:[{name:'admin::hasPermissions',config:{actions:[action]}}]}});
  const roles = management('admin::roles.read');
  const self = {path:'/users/me',config:{policies:['admin::isAuthenticatedAdmin']}};
  const uploadRead = management('plugin::upload.read');
  const uploadWrite = management('plugin::upload.settings.read');
  const content = management('plugin::content-manager.explorer.update');
  const publicAPI = management('admin::example');
  let policy;
  const strapi = {
    get:()=>({set:(name,fn)=>{policy=fn;}}),
    admin:{routes:{admin:{routes:[roles,self]}}},
    plugins:{upload:{routes:{admin:{type:'admin',routes:[uploadRead,uploadWrite]}}},'content-manager':{routes:{admin:{type:'admin',routes:[content]},'content-api':{type:'content-api',routes:[publicAPI]}}}}
  };
  registerSettingsPolicies(strapi);
  for (const route of [roles,uploadWrite]) assert.ok(route.config.policies.includes('global::griidai-super-admin'));
  for (const route of [self,uploadRead,content,publicAPI]) assert.ok(!route.config.policies.includes('global::griidai-super-admin'));
  assert.equal(policy({state:{auth:{strategy:{name:'admin'}},user:{roles:[{code:'strapi-super-admin'}]}}}),true);
  assert.equal(policy({state:{auth:{strategy:{name:'admin'}},user:{roles:[{code:'marketing-editor'}]}}}),false);
});
