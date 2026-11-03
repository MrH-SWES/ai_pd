'use strict';
(() => {
  const settings = window.WORKSHOP || {};
  const $ = id => document.getElementById(id);
  const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
  const source = safeUrl(settings.sourceDocumentUrl);
  if (source) ['source-link','resource-source'].forEach(id => $(id).href = source);
  const node = (tag, text, cls) => {const e=document.createElement(tag);e.textContent=text || '';if(cls)e.className=cls;return e;};
  function renderList(id, items, fields) {
    if (!Array.isArray(items) || !items.length) return;
    const root=$(id); root.replaceChildren();
    items.forEach(item => { const card=node('article','','record'); fields.forEach(([key,tag,label]) => {if(item[key])card.append(node(tag,(label || '')+String(item[key]),key==='status'?'pill':''));});root.append(card); });
  }
  const initialLists = Object.fromEntries(['notes-list','questions-list','parking-list','next-list','resources-list'].map(id=>[id,$(id).innerHTML]));
  function render(data) {
    for (const [id,html] of Object.entries(initialLists)) $(id).innerHTML=html;
    renderList('notes-list',data.notes,[['topic','h3'],['text','p']]);
    renderList('questions-list',data.questions,[['status','span'],['question','h3'],['answer','p']]);
    renderList('parking-list',data.parking,[['idea','h3'],['why','p'],['followUp','small','Follow-up: ']]);
    renderList('next-list',data.next,[['experiment','h3'],['who','small','Who: '],['nextStep','p']]);
    (Array.isArray(data.resources)?data.resources:[]).forEach(item=>{const url=safeUrl(item.url);if(!url)return;const a=node('a','','resource');a.href=url;a.target='_blank';a.rel='noopener';a.append(node('span','RESOURCE'),node('h3',String(item.title || 'Resource')+' ↗'),node('p',item.description));$('resources-list').append(a);});
    if(source)$('resource-source').href=source;
  }
  render(settings);
  const form=safeUrl(settings.googleFormUrl);
  if(form){const u=new URL(form);if(u.hostname==='docs.google.com' && /^\/forms\/(d\/e\/|d\/)/.test(u.pathname) && u.pathname.endsWith('/viewform')){u.searchParams.set('embedded','true');const frame=document.createElement('iframe');frame.src=u.href;frame.title='Submit a workshop question';frame.loading='lazy';const link=node('a','Trouble loading? Open the question form ↗','form-link');link.href=form;link.target='_blank';link.rel='noopener';$('form-area').replaceChildren(frame,link);$('ask').classList.add('connected');}}
  const endpoint=safeUrl(settings.dataUrl);
  let loading=false;
  async function refresh(){if(!endpoint||loading||document.hidden)return;loading=true;try{const response=await fetch(endpoint,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('feed');const data=await response.json();if(!Array.isArray(data.notes)||!Array.isArray(data.questions))throw new Error('schema');render(data);$('sync-status').textContent='Connected feed refreshed '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.';}catch{$('sync-status').textContent='Updates unavailable. Showing the last loaded notes; try again shortly.';}finally{loading=false;}}
  if(endpoint){refresh();setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);} else {$('sync-status').textContent='Workshop snapshot · November 3. Automatic document updates are not connected yet.';}
})();
