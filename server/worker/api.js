// Platform supplies authenticated identity headers. Never accept a client-side admin claim.
export const ADMIN_USER_IDS = []; // Fill with verified Site-scoped owner ID before opening admin access.
const json = (body, status=200) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean = (x,max) => typeof x==='string' ? x.trim().slice(0,max) : '';
const admin = request => ADMIN_USER_IDS.includes(request.headers.get('oai-authenticated-user-id'));
async function input(request) { if(!request.headers.get('content-type')?.includes('application/json')) throw new Error('json_required'); const text=await request.text(); if(text.length>12000) throw new Error('body_too_large'); return JSON.parse(text); }
function writeOrigin(request) { const origin=request.headers.get('origin'); return origin===new URL(request.url).origin; }
async function rateLimit(request,db) { const ip=request.headers.get('cf-connecting-ip') || request.headers.get('oai-authenticated-user-id') || 'anonymous'; const minute=Math.floor(Date.now()/60000); const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+':'+minute)); const key=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join(''); await db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(key,(minute+2)*60).run(); const row=await db.prepare('SELECT count FROM rate_limits WHERE key=?').bind(key).first(); await db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Math.floor(Date.now()/1000)).run(); return row.count<=5; }
export async function api(request,env) {
 const u=new URL(request.url),path=u.pathname;
 if(!path.startsWith('/api/')) return null;
 if(request.method==='GET' && path==='/api/whoami')return json({user_id:request.headers.get('oai-authenticated-user-id'),admin:admin(request)});
 if(!env.DB) return json({error:'Storage is not configured.'},503);
 try {
  if(request.method==='GET' && path==='/api/content') {
   const entries=(await env.DB.prepare('SELECT id,kind,title,body,created_at,updated_at FROM entries ORDER BY created_at DESC').all()).results;
   const questions=(await env.DB.prepare("SELECT id,question,category,status,answer,created_at,updated_at FROM questions WHERE status IN ('published','answered') ORDER BY created_at DESC").all()).results;
   return json({notes:entries.filter(x=>x.kind==='note').map(x=>({topic:x.title,text:x.body})),parking:entries.filter(x=>x.kind==='parking').map(x=>({idea:x.title,why:x.body,followUp:''})),next:entries.filter(x=>x.kind==='step').map(x=>({experiment:x.title,who:'',nextStep:x.body})),resources:entries.filter(x=>x.kind==='resource').map(x=>({title:x.title,description:x.body,url:''})),questions,updated_at:new Date().toISOString()});
  }
  if(request.method==='GET' && path==='/api/admin') { if(!admin(request))return json({error:'Organizer access required.'},403); return json({questions:(await env.DB.prepare('SELECT * FROM questions ORDER BY created_at DESC').all()).results,entries:(await env.DB.prepare('SELECT * FROM entries ORDER BY created_at DESC').all()).results}); }
  if(!['POST','PATCH','DELETE'].includes(request.method))return json({error:'Not found.'},404);
  if(!writeOrigin(request))return json({error:'Same-origin request required.'},403);
  if(request.method==='POST' && path==='/api/questions') {
   if(!await rateLimit(request,env.DB))return json({error:'Please wait a minute before submitting another question.'},429);
   const data=await input(request),question=clean(data.question,2000),category=clean(data.topic,40)||'general';
   if(data.website)return json({error:'Submission rejected.'},400);
   if(question.length<3)return json({error:'Please enter a question.'},400);
   const id=crypto.randomUUID(),now=new Date().toISOString();
   await env.DB.prepare('INSERT INTO questions(id,question,category,status,answer,created_at,updated_at) VALUES (?,?,?,\'pending\',\'\',?,?)').bind(id,question,category,now,now).run();
   return json({ok:true,id,status:'pending',message:'Received. Your question is waiting for the facilitator to review.'},201);
  }
  if(!path.startsWith('/api/admin/'))return json({error:'Not found.'},404);
  if(!admin(request))return json({error:'Organizer access required.'},403);
  if(request.method==='POST' && path==='/api/admin/entries') {
   const data=await input(request),kind=clean(data.kind,20),body=clean(data.body,8000),title=clean(data.title,200);
   if(!['note','parking','step','resource'].includes(kind)||!body)return json({error:'A valid entry type and text are required.'},400);
   const id=crypto.randomUUID(),now=new Date().toISOString();await env.DB.prepare('INSERT INTO entries(id,kind,title,body,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(id,kind,title,body,now,now).run();return json({id},201);
  }
  const match=path.match(/^\/api\/admin\/questions\/([a-f0-9-]{36})$/);
  if(match && request.method==='PATCH') { const data=await input(request),status=clean(data.status,20),answer=clean(data.answer,8000); if(!['pending','published','answered','hidden'].includes(status))return json({error:'Invalid status.'},400);const r=await env.DB.prepare('UPDATE questions SET status=?,answer=?,updated_at=? WHERE id=?').bind(status,answer,new Date().toISOString(),match[1]).run();return r.meta.changes?json({ok:true}):json({error:'Question not found.'},404); }
  return json({error:'Not found.'},404);
 } catch(error) { if(['json_required','body_too_large'].includes(error.message)||error instanceof SyntaxError)return json({error:'Invalid request.'},400); console.error('workshop_api_error',error.name);return json({error:'Could not save this request. Please try again.'},500); }
}
