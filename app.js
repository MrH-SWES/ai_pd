'use strict';
(() => {
  const settings=window.WORKSHOP||{};
  const $=id=>document.getElementById(id);
  const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}};
  const node=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text||'';if(cls)e.className=cls;return e;};
  function renderList(id,items,fields){if(!Array.isArray(items)||!items.length)return;const root=$(id);root.replaceChildren();items.forEach(item=>{const card=node('article','','record');fields.forEach(([key,tag,label])=>{if(item[key])card.append(node(tag,(label||'')+String(item[key]),key==='status'?'pill':''));});root.append(card);});}
  const initialLists=Object.fromEntries(['notes-list','questions-list'].map(id=>[id,$(id).innerHTML]));
  function render(data){
    for(const [id,html] of Object.entries(initialLists))$(id).innerHTML=html;
    renderList('notes-list',data.notes,[['topic','h3'],['text','p']]);
    renderList('questions-list',data.questions,[['status','span'],['question','h3'],['answer','p']]);

  }
  render(settings);
  const base=settings.apiBase==='.'?'':safeUrl(settings.apiBase);
  const connected=settings.apiBase==='.'||Boolean(base);
  const endpoint=path=>(base||'').replace(/\/$/,'')+path;
  let loading=false;
  async function refresh(){if(!connected||loading||document.hidden)return;loading=true;try{const response=await fetch(endpoint('/api/content'),{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('feed');const data=await response.json();if(!Array.isArray(data.notes)||!Array.isArray(data.questions))throw new Error('schema');render(data);$('sync-status').textContent='Notes refreshed '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.';}catch{$('sync-status').textContent='Updates unavailable. Showing the last loaded notes.';}finally{loading=false;}}
  const form=$('question-form');const submit=$('submit-question');
  submit.disabled=!connected;
  $('submission-status').textContent=connected?'':'Question submission is not connected yet.';
  form.addEventListener('submit',async event=>{event.preventDefault();if(!connected||submit.disabled)return;const question=$('question').value.trim();if(!question){$('question').focus();return;}submit.disabled=true;$('submission-status').textContent='Sending…';try{const response=await fetch(endpoint('/api/questions'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({question,topic:'General',website:$('website').value}),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'Submission was not confirmed.');form.reset();$('submission-status').textContent='Received. Your question is in the facilitator’s queue. Thank you!';}catch(error){$('submission-status').textContent='We couldn’t confirm receipt. Your text is still here. Please try again or ask aloud.';}finally{submit.disabled=false;}});
  if(connected){refresh();setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);}else{$('sync-status').textContent='Preview. Live updates are not connected.';}
})();
