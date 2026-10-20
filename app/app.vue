<script setup>
import { computed, reactive, ref, onMounted, watch, defineAsyncComponent } from 'vue'
const products = [
  { id: 'album', name: 'アルバム', en: 'ALBUM', icon: '▤', desc: '何度でも、開きたくなる一冊。' },
  { id: 'scrap', name: 'スクラップ', en: 'SCRAPBOOK', icon: '▧', desc: '好きなものを、自由に重ねて。' },
  { id: 'calendar', name: 'カレンダー', en: 'CALENDAR', icon: '▦', desc: '日々のそばに、大切な風景を。' },
  { id: 'card', name: 'カード', en: 'CARD', icon: '▱', desc: '伝えたい気持ちを、一枚に。' },
  { id: 'print', name: 'プリント', en: 'PRINT', icon: '▣', desc: 'お気に入りの瞬間を、手に取る。' },
]
const settings = Object.fromEntries(products.map(p => [p.id, defineAsyncComponent(() => import(`./components/${p.id}.vue`))]))
const steps = ['商品選択', 'サイズ・形式', 'テンプレート', '写真・文字の編集', '仕上がり確認']
const baseURL = useRuntimeConfig().app.baseURL
const state = reactive({ product: 'album', size: 'square', pages: 20, title: 'Our little moments', body: '何気ない日々が、たからものになる。', color: '#f7f3eb', ink: '#353d36', template: 'classic', start: '2026-10', monday: false, anniversary: '', anniversaryLabel: '', double: false, margin: 24, copies: 1, scenes: {}, photos: [`${baseURL}photos/garden.jpg`, `${baseURL}photos/portrait.jpg`] })
const step = ref(0), page = ref(0), selected = ref('photo'), notice = ref(''), loaded = ref(false), stage = ref(null), fileInput = ref(null), busy = ref(false)
const product = computed(() => products.find(p => p.id === state.product))
const scene = computed(() => {
 const key = `${state.product}:${page.value}`
 if (!state.scenes[key]) state.scenes[key] = { title: 'Our little moments', body: '何気ない日々が、たからものになる。', photo: state.photos[0], x: 0, y: 0, scale: 1, rotation: 0, textX: 0, textY: 0, textScale: 1, stickers: [] }
 return state.scenes[key]
})
const pageCount = computed(() => state.product === 'album' ? state.pages + 1 : state.product === 'calendar' ? 12 : state.product === 'card' && state.double ? 2 : 1)
const pageLabel = computed(() => state.product === 'album' ? page.value === 0 ? '表紙' : `${page.value}ページ` : state.product === 'calendar' ? `${calendar.value.year}年 ${calendar.value.month + 1}月` : page.value ? '裏面' : '表面')
const calendar = computed(() => {
 const [y,m] = state.start.split('-').map(Number)
 const date = new Date(y, m - 1 + page.value, 1), year = date.getFullYear(), month = date.getMonth()
 const offset = (date.getDay() + (state.monday ? 6 : 0)) % 7
 const count = new Date(year, month + 1, 0).getDate()
 return { year, month, cells: Array.from({length: Math.ceil((offset + count)/7)*7}, (_, i) => i >= offset && i < offset + count ? i - offset + 1 : '') }
})
const stageStyle = computed(() => ({ background: state.color, color: state.ink, aspectRatio: state.size === 'landscape' ? '4 / 3' : state.size === 'portrait' ? '3 / 4' : '1 / 1' }))
const currentMonth = computed(() => `${calendar.value.year}-${String(calendar.value.month+1).padStart(2,'0')}`)
function chooseProduct(id) { state.product = id; page.value = 0; selected.value = 'photo' }
function template(id) { state.template = id; Object.values(state.scenes).forEach(s => { s.x=0;s.y=0;s.scale=1;s.rotation=0;s.textX=0;s.textY=0;s.textScale=1 }) }
let saveTimer, messageTimer
function message(s) { notice.value=s;clearTimeout(messageTimer);messageTimer=setTimeout(()=>notice.value='',4500) }
let db
async function database() {
 if (db) return db
 db = await new Promise((resolve,reject)=>{const r=indexedDB.open('yohaku-photo',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
 return db
}
async function persist() {
 try { const d=await database();const snapshot=JSON.parse(JSON.stringify(state));await new Promise((resolve,reject)=>{const tx=d.transaction('drafts','readwrite');tx.objectStore('drafts').put(snapshot,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});message('このブラウザに保存しました') }
 catch { message('保存できませんでした。ブラウザの保存容量・設定をご確認ください。') }
}
onMounted(async()=>{
 try {const d=await database();const saved=await new Promise((resolve,reject)=>{const r=d.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});if(saved){Object.assign(state,saved);message('前回の編集内容を読み込みました')}} catch {message('ブラウザ内保存を利用できません。編集は可能です。')}
 loaded.value=true
})
watch(state,()=>{if(loaded.value){clearTimeout(saveTimer);saveTimer=setTimeout(persist,1000)}},{deep:true})
watch(pageCount,n=>{if(page.value>=n)page.value=n-1})
async function upload(event) {
 const files = Array.from(event.target.files || []);busy.value=true
 let failed=0
 for (const file of files) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>25*1024*1024) {failed++;continue}
  let bitmap
  try {bitmap=await createImageBitmap(file);const ratio=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);const url=canvas.toDataURL('image/jpeg',.85);state.photos.push(url);scene.value.photo=url}
  catch {failed++} finally {bitmap?.close()}
 }
 busy.value=false;event.target.value='';if(failed)message(`${failed}枚を読み込めませんでした。JPEG・PNG・WebP、25MB以下をご利用ください。`)
}
let drag=null, frame=null, pending=null
function applyMove(){if(!drag||!pending)return;const {x,y}=pending;const dx=(x-drag.x)/drag.width*100,dy=(y-drag.y)/drag.height*100;if(drag.kind==='photo'){scene.value.x=drag.ox+dx;scene.value.y=drag.oy+dy}else if(drag.kind==='text'){scene.value.textX=drag.ox+dx;scene.value.textY=drag.oy+dy}else{const s=scene.value.stickers[drag.index];if(s){s.x=drag.ox+dx;s.y=drag.oy+dy}}}
function begin(event,kind,index=0){if(step.value!==3||event.button!==0)return;selected.value=kind;const box=stage.value.getBoundingClientRect();const s=scene.value;drag={kind,index,x:event.clientX,y:event.clientY,width:kind==='sticker'?box.width:event.currentTarget.offsetWidth,height:kind==='sticker'?box.height:event.currentTarget.offsetHeight,ox:kind==='photo'?s.x:kind==='text'?s.textX:s.stickers[index].x,oy:kind==='photo'?s.y:kind==='text'?s.textY:s.stickers[index].y};event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault()}
function move(event){if(!drag)return;pending={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(()=>{frame=null;applyMove()})}
function end(){if(frame)cancelAnimationFrame(frame);applyMove();frame=null;pending=null;drag=null}
function resetPosition(){Object.assign(scene.value,{x:0,y:0,scale:1,rotation:0,textX:0,textY:0,textScale:1})}
function isAnniversary(day){return day && state.anniversary===`${currentMonth.value}-${String(day).padStart(2,'0')}`}
</script>

<template>
 <div class="app-shell">
  <header class="site-header"><a href="#" class="brand" @click.prevent="step=0">余白<span>PHOTO ATELIER</span></a><div class="header-center">大切な瞬間に、あなたらしい余白を。</div><button class="save-button" @click="persist">↓ 編集内容を保存</button></header>
  <nav class="steps" aria-label="制作のステップ"><button v-for="(label,i) in steps" :key="label" :class="{active:step===i,done:step>i}" :aria-current="step===i?'step':undefined" @click="step=i"><span>{{step>i?'✓':String(i+1).padStart(2,'0')}}</span>{{label}}</button></nav>
  <main class="workspace">
   <section class="preview-zone" aria-label="商品プレビュー">
    <div class="preview-heading"><div><span class="eyebrow">YOUR PERSONAL STORY</span><h1>{{product.name}}<span> / {{product.en}}</span></h1></div><span class="preview-tag">{{step===4?'仕上がりプレビュー':'LIVE PREVIEW'}}</span></div>
    <div class="canvas-space">
     <div ref="stage" :class="['paper',state.product,state.template,{editing:step===3}]" :style="stageStyle">
      <div v-if="state.product==='album'" class="spine"></div>
      <div class="photo-window" :style="state.product==='print'?{inset:`${state.margin}px`}:{}">
       <img :src="scene.photo" alt="編集中の写真" draggable="false" :class="{selected:step===3&&selected==='photo'}" :style="{transform:`translate(${scene.x}%,${scene.y}%) rotate(${scene.rotation}deg) scale(${scene.scale})`}" @pointerdown="begin($event,'photo')" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" />
      </div>
      <div v-if="state.product!=='print'" class="paper-copy" :class="{selected:step===3&&selected==='text'}" :style="{transform:`translate(${scene.textX}%,${scene.textY}%) scale(${scene.textScale})`}" @pointerdown="begin($event,'text')" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end"><span class="small-title">{{state.product==='calendar'?calendar.year:'THE MOMENTS WE KEEP'}}</span><h2>{{scene.title}}</h2><p>{{scene.body}}</p></div>
      <div v-if="state.product==='calendar'" class="calendar-grid"><div class="month-name">{{String(calendar.month+1).padStart(2,'0')}} <span>{{calendar.year}}</span></div><div class="week"><span v-for="d in (state.monday?['月','火','水','木','金','土','日']:['日','月','火','水','木','金','土'])" :key="d">{{d}}</span></div><div class="days"><span v-for="(d,i) in calendar.cells" :key="i" :class="{anniversary:isAnniversary(d)}" :title="isAnniversary(d)?state.anniversaryLabel:undefined">{{d}}</span></div><small v-if="state.anniversary.startsWith(currentMonth)">{{state.anniversaryLabel}}</small></div>
      <div v-for="(s,i) in scene.stickers" :key="i" class="sticker" :style="{left:s.x+'%',top:s.y+'%'}" @pointerdown="begin($event,'sticker',i)" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end">{{s.text}}<button v-if="step===3" aria-label="スタンプを削除" @pointerdown.stop @click="scene.stickers.splice(i,1)">×</button></div>
     </div>
    </div>
    <div class="preview-footer"><span>{{step===3?'写真や文字をドラッグして配置できます':'あなたの思い出を、かたちに。'}}</span><div v-if="pageCount>1" class="pagination"><button aria-label="前のページ" :disabled="page===0" @click="page--">←</button><span>{{pageLabel}}</span><button aria-label="次のページ" :disabled="page===pageCount-1" @click="page++">→</button></div><span v-else>{{state.size==='square'?'正方形':state.size==='portrait'?'縦長':'横長'}}</span></div>
   </section>
   <aside class="settings-panel">
    <div class="panel-top"><span class="eyebrow">STEP {{String(step+1).padStart(2,'0')}} / 05</span><h2>{{steps[step]}}</h2><p>{{['思い出を残す、かたちを選びましょう。','暮らしに合うサイズと形式を。','あなたらしさが見つかるデザイン。','写真と言葉で、物語を添えて。','細部まで確認して、できあがり。'][step]}}</p></div>
    <div class="panel-content">
     <div v-if="step===0" class="product-list"><button v-for="p in products" :key="p.id" :class="{chosen:state.product===p.id}" @click="chooseProduct(p.id)"><span class="product-icon">{{p.icon}}</span><div><strong>{{p.name}}</strong><small>{{p.desc}}</small></div><span class="radio">{{state.product===p.id?'●':''}}</span></button></div>
     <div v-if="step===1"><label class="field-title">サイズ・向き</label><div class="options"><button v-for="s in [{id:'square',label:'正方形'},{id:'portrait',label:'縦長'},{id:'landscape',label:'横長'}]" :key="s.id" :class="{chosen:state.size===s.id}" @click="state.size=s.id">{{s.label}}</button></div><component :is="settings[state.product]" :model="state" /><p class="help">サイズは試作用の比率です。印刷用の実寸設定は含みません。</p></div>
     <div v-if="step===2"><div class="template-list"><button v-for="t in [{id:'classic',name:'Classic',desc:'余白を楽しむ、端正な一枚。'},{id:'full',name:'Full Bleed',desc:'写真を大きく、印象的に。'},{id:'editorial',name:'Editorial',desc:'雑誌のように、物語を綴る。'}]" :key="t.id" :class="{chosen:state.template===t.id}" @click="template(t.id)"><div :class="['template-swatch',t.id]"><div></div><i></i></div><div><strong>{{t.name}}</strong><small>{{t.desc}}</small></div><span>{{state.template===t.id?'✓':'＋'}}</span></button></div><p class="help">テンプレートの切り替えで配置・拡大率を初期位置に戻します。</p></div>
     <div v-if="step===3" class="edit-fields">
      <label class="field-title">01 — 写真</label><div class="photo-tray"><button v-for="(photo,i) in state.photos" :key="i" :class="{chosen:scene.photo===photo}" @click="scene.photo=photo;selected='photo'"><img :src="photo" :alt="`写真 ${i+1}`" /></button><button class="upload-tile" aria-label="写真を追加" @click="fileInput.click()">＋</button></div><input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden @change="upload"/><button class="upload-button" :disabled="busy" @click="fileInput.click()">{{busy?'写真を読み込み中…':'↑ 写真をアップロード'}}</button><small class="help">JPEG・PNG・WebP / 1枚25MBまで。写真はこの端末内で処理します。</small>
      <label>写真の拡大率 <span>{{Math.round(scene.scale*100)}}%</span><input v-model.number="scene.scale" aria-label="写真の拡大率" type="range" min="0.5" max="3" step="0.01" /></label><label>写真の回転 <span>{{scene.rotation}}°</span><input v-model.number="scene.rotation" aria-label="写真の回転" type="range" min="-180" max="180" /></label>
      <template v-if="state.product!=='print'"><label class="field-title">02 — 文字</label><label>タイトル<input v-model="scene.title" maxlength="80" /></label><label>本文<textarea v-model="scene.body" rows="2" maxlength="300"></textarea></label><label>文字の大きさ<input v-model.number="scene.textScale" aria-label="文字の大きさ" type="range" min="0.5" max="2" step="0.05" /></label></template>
      <label class="field-title">03 — 色・仕上げ</label><div class="color-row"><label>背景色<input v-model="state.color" type="color" /></label><label>文字色<input v-model="state.ink" type="color" /></label></div>
      <template v-if="state.product==='scrap'"><label class="field-title">スタンプ</label><div class="options"><button v-for="s in ['✿','♡','✦','❋']" :key="s" @click="scene.stickers.push({text:s,x:55,y:45})">{{s}}</button></div></template><button class="text-button" @click="resetPosition">配置・拡大率をリセット</button>
     </div>
     <div v-if="step===4" class="review"><div class="check-circle">✓</div><h3>あなたらしい、ひとつに。</h3><p>プレビューとページ送りで<br>仕上がりを確認してください。</p><dl><dt>商品</dt><dd>{{product.name}}</dd><dt>形式</dt><dd>{{state.size==='square'?'正方形':state.size==='portrait'?'縦長':'横長'}}</dd><dt>テンプレート</dt><dd>{{state.template}}</dd><dt v-if="pageCount>1">面・ページ数</dt><dd v-if="pageCount>1">{{pageCount}}</dd><dt v-if="state.product==='print'">枚数</dt><dd v-if="state.product==='print'">{{state.copies}}</dd></dl><button class="upload-button" @click="step=3">編集に戻る</button><p class="help">この試作は仕上がり確認までです。注文・決済・印刷データ出力はありません。</p></div>
    </div>
    <div class="panel-bottom"><div class="navigation"><button :disabled="step===0" class="back" @click="step--">← 戻る</button><button class="next" @click="step<4?step++:persist()">{{step<4?'次へ進む →':'ブラウザに保存 ↓'}}</button></div><small>編集内容はこのブラウザに自動保存されます</small></div>
   </aside>
  </main><footer class="site-footer"><span>YOHAKU — PHOTO ATELIER</span><span>何気ない日々を、いつまでも。</span><span>DESIGNED FOR YOUR MEMORIES</span></footer>
  <div v-if="notice" role="status" class="toast">{{notice}}</div>
 </div>
</template>

<style>
@import './style.css';
</style>
