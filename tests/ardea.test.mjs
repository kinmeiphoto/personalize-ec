import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
let browser,server,origin;
before(async()=>{
 const html=await readFile(new URL('../public/maison-ardea.html',import.meta.url));
 server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
 const opts={headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROMIUM_PATH)opts.executablePath=process.env.CHROMIUM_PATH;browser=await chromium.launch(opts);
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r))});
async function open(page){await page.goto(origin);await page.locator('#customizeButton').click();await page.waitForFunction(()=>document.querySelector('#loading').hidden)}
test('desktop: deferred 3D, 6 gallery images, customization, price, save, reload and demo cart',async()=>{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
 assert.equal(await page.locator('.gallery img').count(),6);assert.equal(await page.locator('#viewer canvas').count(),0);
 assert(await page.locator('#heroImage').evaluate(async img=>{await img.decode();const c=document.createElement('canvas');c.width=c.height=1;c.getContext('2d').drawImage(img,0,0,1,1);return c.getContext('2d').getImageData(0,0,1,1).data[0]>100}));
 await page.locator('#customizeButton').click();await page.waitForFunction(()=>document.querySelector('#loading').hidden);assert.equal(await page.locator('#viewer canvas').count(),1);assert.equal(await page.locator('#arButton').isVisible(),false);
 await page.locator('[data-panel=size]').click();await page.locator('[data-setting=size][data-value=GM]').click();assert.equal(await page.locator('#customPrice').textContent(),'¥165,000');
 await page.locator('[data-panel=patch]').click();await page.locator('[data-setting=patch][data-value=star]').click();await page.locator('[data-setting=patchPosition][data-value=right]').click();
 await page.locator('[data-panel=initials]').click();await page.locator('#initialInput').fill('abc');assert.equal(await page.locator('#initialInput').inputValue(),'ABC');
 await page.locator('[data-panel=line]').click();await page.locator('[data-setting=line][data-value=olive]').click();await page.locator('[data-color=ink]').click();assert.equal(await page.locator('#customPrice').textContent(),'¥184,800');
 await page.locator('#confirmButton').click();assert.equal(await page.locator('#customizer').evaluate(d=>d.open),false);assert.match(await page.locator('#designSummary').textContent(),/GM.*インク.*ABC/);assert.equal(await page.locator('#productPrice').textContent(),'¥184,800');
 await page.reload();assert.match(await page.locator('#designSummary').textContent(),/GM.*ABC/);await page.locator('#addButton').click();assert.match(await page.locator('#infoBody').textContent(),/184,800/);await page.locator('#closeInfo').click();await page.locator('#favoriteButton').click();assert.equal(await page.locator('#favoriteButton').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);await context.close();
});
test('camera: keyboard, 360 rotation, elevation/zoom limits, preset transition and reduced motion',async()=>{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();await open(page);
 await page.evaluate(async()=>{const url=URL.createObjectURL(new Blob([document.querySelector('#engine').textContent],{type:'text/javascript'}));const {createViewer}=await import(url);URL.revokeObjectURL(url);const host=document.createElement('div');host.style='position:fixed;inset:0;width:500px;height:500px;z-index:999';document.querySelector('#customizer').append(host);window.rig=createViewer(host,{reduced:true});window.rigCanvas=host.querySelector('canvas');window.rigCanvas.focus()});
 let state=await page.evaluate(()=>window.rig.getState());assert.equal(state.automatic,false);assert.equal(state.damping,false);
 for(let i=0;i<70;i++)await page.keyboard.press('ArrowRight');state=await page.evaluate(()=>window.rig.getState());assert(Number.isFinite(state.azimuth));
 for(let i=0;i<20;i++)await page.keyboard.press('+');state=await page.evaluate(()=>window.rig.getState());assert(Math.abs(state.zoom-2.5)<.01);
 for(let i=0;i<30;i++)await page.keyboard.press('-');state=await page.evaluate(()=>window.rig.getState());assert(Math.abs(state.zoom-.8)<.01);
 await page.evaluate(()=>window.rig.setView('inside'));state=await page.evaluate(()=>window.rig.getState());assert(Math.abs(state.elevation-58)<.01);await page.evaluate(()=>window.rig.reset());state=await page.evaluate(()=>window.rig.getState());assert(Math.abs(state.zoom-1)<.01);assert(Math.abs(state.azimuth)<.01);
 const box=await page.evaluate(()=>{const b=window.rigCanvas.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height}});await page.mouse.move(box.x+250,box.y+250);await page.mouse.down();await page.mouse.move(box.x+250,box.y+1900,{steps:15});await page.mouse.up();state=await page.evaluate(()=>window.rig.getState());assert(state.elevation>=-10.01&&state.elevation<=60.01);await page.evaluate(()=>window.rig.dispose());await context.close();
});
test('mobile: tabs, narrow layout, fields, Escape close and focus return',async()=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();await open(page);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('[data-panel=initials]').click();await page.locator('#initialInput').fill('az');await page.screenshot({path:'/tmp/ardea-mobile.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('#settingsSheet').evaluate(s=>s.inert),true);await page.locator('[data-view=back]').click();await page.locator('#confirmButton').click();assert.match(await page.locator('#designSummary').textContent(),/AZ/);assert.equal(await page.locator('#customizeButton').evaluate(b=>document.activeElement===b),true);await context.close();
});
test('without WebGL: 36 real frames, pointer/keyboard rotation, zoom limits, explicit limitation',async()=>{
 const context=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 assert.equal(await page.locator('#viewer canvas').count(),0);assert.equal(await page.locator('#viewer .fallback').count(),1);assert.match(await page.locator('#fallbackLabel').textContent(),/装飾の変更は画像に反映されません/);assert.equal(await page.locator('#frames').evaluate(s=>new Set(JSON.parse(s.textContent)).size),36);
 const img=page.locator('#viewer img');const first=await img.getAttribute('src');await img.focus();await page.keyboard.press('ArrowRight');assert.notEqual(await img.getAttribute('src'),first);for(let i=0;i<20;i++)await page.keyboard.press('+');assert.equal(await img.evaluate(i=>i.style.transform),'scale(2.5)');for(let i=0;i<30;i++)await page.keyboard.press('-');assert.equal(await img.evaluate(i=>i.style.transform),'scale(0.8)');await page.locator('[data-view=inside]').click();assert.match(await page.locator('#toast').textContent(),/内側視点を利用できません/);assert.deepEqual(errors,[]);await context.close();
});
test('normal motion: exactly one introductory turn, smooth preset, interaction stops rotation',async()=>{
 const context=await browser.newContext({viewport:{width:900,height:800}});const page=await context.newPage();await page.goto(origin);
 await page.evaluate(async()=>{const url=URL.createObjectURL(new Blob([document.querySelector('#engine').textContent],{type:'text/javascript'}));window.engine=await import(url);URL.revokeObjectURL(url);window.host=document.createElement('div');window.host.style='position:fixed;inset:0;width:500px;height:500px';document.body.append(window.host);window.rig=window.engine.createViewer(window.host);window.rigCanvas=window.host.querySelector('canvas')});
 let state=await page.evaluate(()=>window.rig.getState());assert.equal(state.automatic,true);assert.equal(state.damping,true);await page.waitForFunction(()=>!window.rig.getState().automatic,{},{timeout:24000});state=await page.evaluate(()=>window.rig.getState());assert(Math.abs(state.azimuth)<.03);
 await page.evaluate(()=>window.rig.setView('side'));await page.waitForTimeout(700);state=await page.evaluate(()=>window.rig.getState());assert(Math.abs(state.azimuth-Math.PI/2)<.02);
 await page.evaluate(()=>{window.rig.dispose();window.rig=window.engine.createViewer(window.host);window.rigCanvas=window.host.querySelector('canvas')});await page.locator('canvas').click({position:{x:250,y:250}});state=await page.evaluate(()=>window.rig.getState());assert.equal(state.automatic,false);await page.evaluate(()=>window.rig.dispose());await context.close();
});
