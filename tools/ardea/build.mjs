import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
const result=await build({entryPoints:['tools/ardea/viewer.js'],bundle:true,minify:true,format:'esm',target:'es2022',write:false,legalComments:'inline'});
const engine=result.outputFiles[0].text;
const server=createServer((req,res)=>{if(req.url==='/engine.js'){res.setHeader('content-type','text/javascript');res.end(engine)}else{res.setHeader('content-type','text/html');res.end('<!doctype html><style>body{margin:0;background:#f5f5f3}#stage{width:680px;height:680px}</style><div id="stage"></div><script type="module">import {createViewer} from "/engine.js";window.viewer=createViewer(document.querySelector("#stage"),{reduced:true});window.viewer.setDesign({size:"MM",color:"sand",patch:"none",patchPosition:"left",initials:"",line:"none"});</script>')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;let frames=[],gallery=[];
try{
 const options={headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROMIUM_PATH)options.executablePath=process.env.CHROMIUM_PATH;
 browser=await chromium.launch(options);const page=await browser.newPage({viewport:{width:680,height:680},deviceScaleFactor:1});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.viewer);await page.waitForTimeout(400);
 for(let i=0;i<36;i++)frames.push(await page.evaluate(i=>window.viewer.capture(i*Math.PI/18),i));
 const views=[['FRONT VIEW',0],['PROFILE',9],['BACK VIEW',18],['INTERIOR',0],['PERSONAL DETAILS',3],['CRAFT & COLOUR',30]];
 for(let i=0;i<views.length;i++){
  const [label,index]=views[i];let image=frames[index];
  if(i===3){await page.evaluate(()=>window.viewer.setView('inside',true));image=await page.locator('canvas').screenshot({type:'jpeg',quality:83}).then(b=>'data:image/jpeg;base64,'+b.toString('base64'))}
  if(i===4){image=await page.evaluate(()=>{window.viewer.setDesign({size:'MM',color:'sand',patch:'star',patchPosition:'left',initials:'MA',initialColor:'#f1e2bd',line:'olive'});return window.viewer.capture(.45)})}
  if(i===5){image=await page.evaluate(()=>{window.viewer.setDesign({size:'MM',color:'ink',patch:'diamond',patchPosition:'right',initials:'AR',initialColor:'#f1e2bd',line:'navy'});return window.viewer.capture(-.6)})}
  gallery.push(`<figure><img ${i===0?'id="heroImage" fetchpriority="high"':'loading="lazy"'} src="${image}" alt="アルデア トート：${label}" width="680" height="680"><figcaption>0${i+1} / ${label}</figcaption>${i===0?'<button class="gallery-hint" data-open-custom>360°で見る　↗</button>':''}</figure>`)
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
const template=await readFile('tools/ardea/template.html','utf8');
const html=template.replace('__GALLERY__',gallery.join('')).replace('__FRAMES__',JSON.stringify(frames)).replace('__ENGINE__',()=>engine.replace(/<\/script/gi,'<\\/script'));
const license=await readFile('node_modules/three/LICENSE','utf8');
await writeFile('public/maison-ardea.html',html.replace('<!doctype html>','<!doctype html>\n<!-- Three.js license\n'+license+'\n-->')); console.log(`Generated public/maison-ardea.html: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB, 36 fallback views, 6 gallery images; self-contained.`);
