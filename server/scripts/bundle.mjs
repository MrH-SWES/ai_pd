import fs from 'node:fs';import path from 'node:path';
const frontend=process.argv[2];if(!frontend)throw Error('Pass frontend source path');
const files={};for(const name of ['index.html','styles.css','app.js','config.js'])files['/'+(name==='index.html'?'':name)]=fs.readFileSync(path.join(frontend,name),'utf8');
files['/config.js']=files['/config.js'].replace("apiBase: ''","apiBase: '.'");files['/admin']=fs.readFileSync('admin.html','utf8');
let api=fs.readFileSync('worker/api.js','utf8').replace('export const ADMIN_USER_IDS','const ADMIN_USER_IDS').replace('export async function api','async function api');
api+='\nconst ASSETS='+JSON.stringify(files)+';\nexport default {async fetch(request,env){const result=await api(request,env);if(result)return result;const p=new URL(request.url).pathname;if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405});if(!(p in ASSETS))return new Response("Not found",{status:404});const type=p.endsWith(".js")?"text/javascript":p.endsWith(".css")?"text/css":"text/html";return new Response(request.method==="HEAD"?null:ASSETS[p],{headers:{"Content-Type":type+"; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"same-origin","Cache-Control":"no-cache"}})}};';
fs.writeFileSync('worker/index.js',api);console.log('Bundled workshop frontend and API.');
