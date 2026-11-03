import test from 'node:test';import assert from 'node:assert/strict';import {api,ADMIN_USER_IDS} from './worker/api.js';
const r=(p,method='GET',body,origin='https://test.example')=>new Request('https://test.example'+p,{method,headers:{origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('storage fails closed',async()=>assert.equal((await api(r('/api/content'),{})).status,503));
test('admin rejects unverified identity',async()=>assert.equal((await api(r('/api/admin'),{DB:{}})).status,403));
test('cross-origin writes rejected',async()=>assert.equal((await api(r('/api/questions','POST',{question:'hello'},'https://evil.example'),{DB:{}})).status,403));
test('unknown API route',async()=>assert.equal((await api(r('/api/nope'),{DB:{}})).status,404));
test('non API falls through',async()=>assert.equal(await api(r('/'),{}),null));

test('configured Site-scoped identity permits admin; account-like mismatch does not',async()=>{ADMIN_USER_IDS.push('site-owner-test');try{const db={prepare:()=>({all:async()=>({results:[]})})};const allowed=new Request('https://test.example/api/admin',{headers:{'oai-authenticated-user-id':'site-owner-test'}});assert.equal((await api(allowed,{DB:db})).status,200);const denied=new Request('https://test.example/api/admin',{headers:{'oai-authenticated-user-id':'different-id'}});assert.equal((await api(denied,{DB:db})).status,403);}finally{ADMIN_USER_IDS.pop();}});
