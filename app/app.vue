<script setup>
const assetUrl = useAssetUrl()
import { Swiper, SwiperSlide } from 'swiper/vue'
import { A11y, Keyboard, FreeMode } from 'swiper/modules'
import 'swiper/css'
import {useSelectionEditor} from '~/composables/useSelectionEditor'
import { photoSlots, freshDesign } from '~/composables/useAlbum'

const { design, favorite, cart, price, colorName, money, track } = useAlbum()
const viewer=ref(null), view=ref('closed'), ready=ref(false), spinning=ref(false)
const selectedPhoto=ref('Cover'), toast=ref(''), drawer=ref(''), dialog=ref(''), chatOpen=ref(false), chatInput=ref(''), busyUpload=ref(false), modelError=ref('')
const savedAt=ref(''), savedSnapshot=ref(''), giftWrap=ref(true), consultationSaved=ref(false)
const {editTarget,contextEditor,isCompact,editorItems,editSection,editSlot,editTitle,openPartEditor,selectEditor,closePartEditor,dismissPartEditor,syncViewport}=useSelectionEditor({view,spinning,selectedPhoto,track})
async function confirmDesign(){
 if(confirming.value||!ready.value)return
 confirming.value=true;closePartEditor(false)
 try{saveDesign();await addToCart()}catch{notify('デザインの確認に失敗しました。もう一度お試しください。')}finally{confirming.value=false}
}
const consultation=reactive({ date:'', time:'式場でスタッフに相談', note:'' })
const messages=ref([{role:'assistant',text:'ふたりのアルバム選びをご案内します。下の項目ボタンやアルバム上のアイコンから、色・写真・名入れを選べます。'}])
const total=computed(()=>cart.value.reduce((sum,item)=>sum+item.price,0))
let toastTimer
const notify=text=>{toast.value=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',4200)}
const details=[
 {title:'ふたりで仕立てるアルバム',text:'結婚式の大切な場面を、ふたりらしい一冊に。表紙の色と写真、見開きの二枚、お名前や挙式日を選びながら、仕上がりを立体で確かめられます。選んだデザインは端末に保存して、式場でのご相談にお使いいただけます。'},
 {title:'大きさ・素材・仕上がり',text:'20 × 20cm、30 × 30cmの二つの大きさをご用意した提案モデルです。レザー調の表紙、厚みのある台紙、表紙の写真窓を立体で表現しています。素材感や色は画面によって異なります。実際の仕様は式場スタッフにお確かめください。'},
 {title:'お仕立て・お渡しについて',text:'ご相談の際は、保存したデザインを式場スタッフにお見せください。写真の確認からお仕立て、お渡しまでの流れや時期は、式場からご案内します。この画面では注文・決済を行いません。表示金額は参考価格です。'},
 {title:'大切にお手元に残すために',text:'表紙は乾いた柔らかい布でやさしくお手入れし、直射日光や湿気を避けて保管してください。ご両親への贈り物や保管用のケースについても、式場でご相談いただけます。'}
]
const infoText=computed(()=>({
  story:{title:'晴れの日を、いつまでも。',text:'誓いを交わした瞬間も、家族や友人と笑い合った時間も。結婚式の一日には、ふたりにとって大切な場面がいくつもあります。表紙の色や写真、お名前の入れ方をふたりで選び、何年先も手に取れる一冊へ。仕上がりは立体で確かめながら、ゆっくりお選びください。'},
  privacy:{title:'プライバシーについて',text:'アップロードした写真と作成したデザインは、このブラウザー内で処理します。写真をサーバーに送信する機能はありません。「デザインを保存」した内容、お気に入り、ご相談リストはこの端末のブラウザーに保存されます。共用端末では「保存データを削除」をご利用ください。外部の行動計測送信先は現在未設定です。'},
  terms:{title:'このサイトについて',text:'Kinmeiは、アルバムの3Dカスタマイズを体験するためのプロトタイプです。価格、素材、サイズは提案用の設定です。実際の仕様・金額・お渡し時期は式場でお確かめください。決済・注文・店舗在庫・予約の外部連携は実装していません。'},
  shipping:{title:'お仕立て・お渡しのご案内',text:'写真の選定や名入れの内容を確認したうえで、お仕立ての流れとお渡し時期を式場スタッフからご案内します。まずは、ふたりのお好みの色や写真で仕上がりをお確かめください。'},
  stores:{title:'実物の仕上がりについて',text:'画面上の色や素材感は、お使いの端末によって異なります。実際の表紙や台紙、写真の仕上がりについては、式場スタッフにお確かめください。選んだデザインを「相談メモ」にまとめて、当日のご相談にお使いいただけます。'},
  legal:{title:'販売に関するご案内',text:'このサイトでは商品の販売を行っていません。販売を開始する際は、販売事業者、所在地、連絡先、支払方法、配送、返品条件を確定し、特定商取引法に基づく表記を掲載します。'},
  ar:{title:'3Dで、細部まで。',text:'このバージョンでは、ブラウザー内での回転・拡大に対応しています。AR表示は含まれていません。作成したデザインは「画像を保存」から書き出し、仕上がりの検討にお使いいただけます。'}
}[dialog.value]||{}))

function scrollStudio(){closePartEditor(false);viewer.value?.resetView()}
function changeView(next){closePartEditor(false);view.value=next;track('change_3d_view',{view:next})}
function choosePhoto(key){selectedPhoto.value=key;view.value=key==='Cover'?'closed':'open';if(editSection.value==='photo')editTarget.value='photo-'+key}
async function upload(event,key){
 const file=event.target.files?.[0]; event.target.value=''
 if(!file)return
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('JPG・PNG・WebP形式の画像を選んでください。');return}
 if(file.size>10*1024*1024){notify('10MB以下の画像を選んでください。');return}
 busyUpload.value=true
 try{
  const url=URL.createObjectURL(file), img=new Image()
  try { await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url}) } finally { URL.revokeObjectURL(url) }
  const scale=Math.min(1,1600/Math.max(img.width,img.height)), canvas=document.createElement('canvas')
  canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale)
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height)
  design.value.photos[key]={src:canvas.toDataURL('image/jpeg',.86),zoom:1,x:0,y:0}
  choosePhoto(key);track('replace_photo',{slot:key});notify('写真を差し替えました。ドラッグして仕上がりを確認できます。')
 }catch{notify('この画像を開けませんでした。別の画像をお試しください。')}finally{busyUpload.value=false}
}
function resetPhoto(){design.value.photos[selectedPhoto.value]={...freshDesign().photos[selectedPhoto.value]};notify('この写真を初期状態に戻しました。')}
function resetDesign(){closePartEditor(false);design.value=freshDesign();view.value='closed';notify('編集中のデザインを初期状態に戻しました。')}
function saveDesign(){
 try{const date=new Date().toISOString();localStorage.setItem('memoria-design',JSON.stringify({version:1,design:design.value,date}));savedAt.value=date;savedSnapshot.value=JSON.stringify(design.value);track('save_design');notify('このブラウザーにデザインを保存しました。')}
 catch{notify('保存容量が不足しています。写真のサイズを小さくするか、仕様書を書き出してください。')}
}
function toggleFavorite(){favorite.value=!favorite.value;try{localStorage.setItem('memoria-favorite',JSON.stringify(favorite.value))}catch{};notify(favorite.value?'お気に入りに追加しました。':'お気に入りから外しました。')}
function download(data,name){const a=document.createElement('a');a.href=data;a.download=name;a.click()}
function exportImage(){const image=viewer.value?.snapshot();if(image){download(image,'kinmei-wedding-album-'+view.value+'.png');track('export_preview')}else notify('3Dの読み込みが完了してからお試しください。')}
function exportSpec(item){const config=item?.design||design.value;const blob=new Blob([JSON.stringify({product:'Kinmei Wedding Album',sample:true,price:item?.price||price.value,currency:'JPY',design:config,createdAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);download(url,'kinmei-wedding-design.json');setTimeout(()=>URL.revokeObjectURL(url),1000)}
function persistCart(){try{localStorage.setItem('memoria-cart',JSON.stringify(cart.value))}catch{notify('ご相談リストはこの画面内に保存しました。端末の保存容量が不足しています。')}}
async function addToCart(){
 let image='/images/album-closed.webp'
 const png=viewer.value?.snapshot()
 if(png){const img=new Image();img.src=png;await img.decode();const c=document.createElement('canvas');c.width=240;c.height=180;c.getContext('2d').drawImage(img,0,0,240,180);image=c.toDataURL('image/jpeg',.7)}
 cart.value.push({id:Date.now(),design:JSON.parse(JSON.stringify(design.value)),price:price.value,image,color:colorName.value,gift:giftWrap.value})
 persistCart();track('add_to_cart',{ecommerce:{currency:'JPY',value:price.value,items:[{item_id:'MEM-01',item_name:'Wedding Album',price:price.value,quantity:1,item_variant:colorName.value}]}});drawer.value='cart'
}
function removeItem(id){cart.value=cart.value.filter(i=>i.id!==id);persistCart()}
function clearData(){['memoria-design','memoria-cart','memoria-favorite','memoria-consultation','memoria-recent'].forEach(k=>localStorage.removeItem(k));cart.value=[];favorite.value=false;savedAt.value='';notify('このブラウザーの保存データを削除しました。')}
function ask(text){
 const q=(text||chatInput.value).trim();if(!q)return
 messages.value.push({role:'user',text:q});chatInput.value=''
 let answer='色・写真・名入れ・保存方法についてご案内できます。個別のご相談は「相談メモを作成」から、ご検討内容をまとめてください。実際の送信や予約は行われません。'
 if(/写真|画像|アップロード/.test(q))answer='画面下の「写真」ボタンから差し替えたい場所を選び、JPG・PNG・WebPをアップロードしてください。最大10MBです。倍率と位置のスライダーでトリミングも調整できます。写真はサーバーへ送信されません。'
 else if(/色|カラー/.test(q))answer='画面下の「表紙」「本文紙」「写真枠」ボタンから色を選べます。表紙は6色のほか、カラーピッカーでお好みの色を設定できます。選んだ仕上がりを、その場で確認できます。'
 else if(/保存|ダウンロード/.test(q))answer='「デザインを保存」でこのブラウザーに保存できます。画面左下のカメラボタンからプレビュー画像をダウンロードできます。別の端末へ渡す場合は、ご相談リスト内の「仕様書を書き出す」をお使いください。'
 else if(/名入れ|文字|イニシャル/.test(q))answer='画面下の「名入れ」ボタンで12文字まで入力できます。日本語にも対応しています。文字色はゴールド・シルバー・ブラックの3種類です。参考価格では2,200円が加算されます。'
 else if(/サイズ|大きさ/.test(q))answer='20 × 20cmと30 × 30cmの2サイズを選べます。サイズは3Dの大きさと参考価格に反映されます。モデルの寸法は元画像からの推定です。'
 else if(/配送|発送|納期|注文|購入/.test(q))answer='このサイトはカスタマイズ体験用のデモです。実際の注文・決済・配送は行われません。制作期間と価格も提案用のサンプルです。'
 messages.value.push({role:'assistant',text:answer});nextTick(()=>{const el=document.querySelector('.chat-messages');if(el)el.scrollTop=el.scrollHeight})
}
function saveConsultation(){try{localStorage.setItem('memoria-consultation',JSON.stringify({...consultation,design:design.value,selections:cart.value}));consultationSaved.value=true;track('save_consultation_note')}catch{notify('保存容量が不足しています。メモをコピーして保存してください。')}}
function validSaved(d){return d&&['20','30'].includes(d.size)&&['cover','paper','frame','foil'].every(k=>/^#[0-9a-f]{6}$/i.test(d[k]))&&typeof d.initials==='string'&&photoSlots.every(s=>{const p=d.photos?.[s.key];return p&&typeof p.src==='string'&&(p.src.startsWith('data:image/jpeg;base64,')||p.src===s.src||['/photos/photo_cover.webp','/photos/photo_left.webp','/photos/photo_right.webp'].includes(p.src))&&[p.zoom,p.x,p.y].every(Number.isFinite)&&p.zoom>=1&&p.zoom<=3&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1})}
onMounted(()=>{
 try{
  const saved=JSON.parse(localStorage.getItem('memoria-design')||'null')
  if(validSaved(saved?.design)){design.value=saved.design;for(const slot of photoSlots){if(design.value.photos[slot.key].src.startsWith('/photos/photo_'))design.value.photos[slot.key].src=slot.src}design.value.initials=design.value.initials.slice(0,12);savedAt.value=saved.date;savedSnapshot.value=JSON.stringify(design.value)}
  favorite.value=JSON.parse(localStorage.getItem('memoria-favorite')||'false')===true
  const savedCart=JSON.parse(localStorage.getItem('memoria-cart')||'[]')
  if(Array.isArray(savedCart))cart.value=savedCart.filter(i=>validSaved(i.design)&&Number.isFinite(i.price)&&typeof i.id==='number').slice(0,20)
  localStorage.setItem('memoria-recent','MEM-01')
 }catch{}
 track('view_item',{ecommerce:{currency:'JPY',value:price.value,items:[{item_id:'MEM-01',item_name:'Wedding Album',price:price.value}]}})
})
watch([drawer,dialog,chatOpen],()=>{if(drawer.value||dialog.value||chatOpen.value)closePartEditor(false)})
function onEscape(e){
 if(e.key==='Escape'){
  if(editTarget.value){closePartEditor();return}
  drawer.value='';dialog.value='';chatOpen.value=false
 }
 if(e.key==='Tab'&&isCompact.value&&editTarget.value){
  const controls=contextEditor.value?.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]')
  if(!controls?.length)return
  const first=controls[0],last=controls[controls.length-1]
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
}
onMounted(()=>{syncViewport();window.addEventListener('resize',syncViewport);window.addEventListener('keydown',onEscape);document.addEventListener('pointerdown',dismissPartEditor)})
onBeforeUnmount(()=>{window.removeEventListener('resize',syncViewport);window.removeEventListener('keydown',onEscape);document.removeEventListener('pointerdown',dismissPartEditor);clearTimeout(toastTimer)})
useHead({script:[{type:'application/ld+json',innerHTML:JSON.stringify({'@context':'https://schema.org','@type':'Product',name:'Kinmei Wedding Album — コンセプトモデル',description:'色、写真、名入れを3Dでカスタマイズできるフォトアルバムの試作モデル。販売は行っていません。',sku:'MEM-01',brand:{'@type':'Brand',name:'Kinmei'},image:'https://kinmeiphoto.github.io/personalize-ec/images/album-closed.webp'})}]})
</script>

<template>
 <div class="selection-app">
  <NuxtPwaManifest />
  <a class="skip-link" href="#studio">アルバムの選択画面へ</a>
  <main id="top" class="selection-workspace" :class="{'panel-open':!!editTarget}">
   <div id="studio" class="selection-main" :inert="isCompact && !!editTarget">
    <header class="selection-header">
     <div class="selection-product"><h1>ウェディングアルバム</h1><p>{{money(price)}}<span>参考価格・税込</span></p><small>ふたりで仕立てる、大切な一冊。</small></div>
     <a href="#top" class="selection-logo" aria-label="Kinmei ホーム"><img :src="assetUrl('/images/kinmei-logo.png')" alt="Kinmei フォトイメージング事業部" width="708" height="96"/></a>
     <nav class="selection-header-actions" aria-label="デザインの保存とご相談"><button class="selection-save" @click="saveDesign"><UiIcon name="save" :size="18"/><span>保存</span></button><button class="icon-button" :aria-label="favorite?'お気に入りから外す':'お気に入りに追加'" :aria-pressed="favorite" @click="toggleFavorite"><UiIcon name="heart" :class="{filled:favorite}"/></button><button class="icon-button bag-button" aria-label="ご相談リストを開く" @click="drawer='cart'"><UiIcon name="bag"/><span v-if="cart.length" class="cart-count">{{cart.length}}</span></button></nav>
    </header>
    <div class="selection-scene">
     <ClientOnly><AlbumViewer ref="viewer" :design="design" :view="view" :spinning="spinning" :active-target="editTarget" @edit="openPartEditor" @ready="ready=true" @error="modelError=$event"/></ClientOnly>
     <div class="selection-vignette" aria-hidden="true"/>
     <div v-if="!ready&&!modelError" class="selection-loading"><span class="loader"/><p>アルバムを準備しています</p></div>
     <div v-if="modelError" class="selection-error"><img :src="assetUrl('/images/album-closed.webp')" alt="ウェディングアルバムの参考画像"/><p>{{modelError}}</p></div>
    </div>
    <div class="selection-view-toggle" role="group" aria-label="アルバムの表示状態"><button :class="{active:view==='closed'}" :aria-pressed="view==='closed'" @click="changeView('closed')">表紙</button><button :class="{active:view==='open'}" :aria-pressed="view==='open'" @click="changeView('open')">見開き</button></div>
    <div class="selection-bottom">
     <nav class="editor-dock" aria-label="変更する項目">
      <Swiper :modules="[A11y,Keyboard,FreeMode]" :slides-per-view="'auto'" :space-between="10" :center-insufficient-slides="true" :free-mode="{enabled:true}" :keyboard="{enabled:true,onlyInViewport:true}">
       <SwiperSlide v-for="item in editorItems" :key="item.target"><button class="editor-dock-button" :class="{active:editTarget===item.target || (item.target==='photo-Cover'&&editSection==='photo')}" :data-editor="item.target" :aria-label="item.label+'の変更メニューを開く'" :aria-expanded="editTarget===item.target || (item.target==='photo-Cover'&&editSection==='photo')" aria-controls="selection-editor" @click="selectEditor(item.target)"><i v-if="item.target==='cover'" class="dock-preview" :style="{background:design.cover}"/><i v-else-if="item.target==='paper'" class="dock-preview" :style="{background:design.paper}"/><i v-else-if="item.target==='frame'" class="dock-frame" :style="{borderColor:design.frame}"/><img v-else-if="item.target==='photo-Cover'" class="dock-photo" :src="assetUrl(design.photos.Cover.src)" alt=""/><i v-else-if="item.target==='initials'" class="dock-monogram">{{design.initials.trim().slice(0,2)||'Aa'}}</i><i v-else class="dock-symbol"><UiIcon :name="item.icon" :size="20"/></i><span>{{item.label}}</span></button></SwiperSlide>
      </Swiper>
     </nav>
     <button class="selection-confirm" :disabled="!ready||!!modelError||confirming" @click="confirmDesign">{{confirming?'デザインを保存しています…':'この内容で決定'}}</button>
    </div>
    <div class="selection-tools" aria-label="プレビューの操作"><button class="round-button" aria-label="アルバムについて" title="アルバムについて" @click="dialog='albumInfo'"><UiIcon name="help" :size="18"/></button><button class="round-button" aria-label="プレビュー画像を保存" title="画像を保存" :disabled="!ready||!!modelError" @click="exportImage"><UiIcon name="camera" :size="18"/></button><button class="round-button" :class="{selected:spinning}" :aria-pressed="spinning" aria-label="自動回転" title="自動回転" @click="spinning=!spinning"><UiIcon name="rotate" :size="18"/></button><button class="round-button" aria-label="最初の向きに戻す" title="最初の向きに戻す" @click="viewer?.resetView()"><UiIcon name="cube" :size="18"/></button></div>
    <div class="selection-zoom"><button class="icon-button" aria-label="拡大" @click="viewer?.zoom('in')"><UiIcon name="plus" :size="18"/></button><button class="icon-button" aria-label="縮小" @click="viewer?.zoom('out')"><UiIcon name="minus" :size="18"/></button></div>
    <footer class="selection-legal"><span>© kinmei. All Rights Reserved.</span><button @click="dialog='privacy'">プライバシー</button></footer>
   </div>
   <button v-if="isCompact && editTarget" class="selection-scrim" aria-label="変更メニューを閉じる" @click="closePartEditor"/>
   <Transition name="selection-panel"><aside v-if="editTarget" id="selection-editor" ref="contextEditor" class="selection-panel" role="dialog" :aria-modal="isCompact" aria-labelledby="selection-editor-title" @pointerdown.stop>
    <header><div><span>PERSONALIZE YOUR ALBUM</span><h2 id="selection-editor-title">{{editTitle}}</h2></div><button class="icon-button" aria-label="変更メニューを閉じる" @click="closePartEditor"><UiIcon name="close" :size="22"/></button></header>
    <div class="selection-panel-body">
     <div v-if="editSection==='photo'" class="selection-photo-tabs" role="group" aria-label="変更する写真"><button v-for="slot in photoSlots" :key="slot.key" :aria-pressed="editSlot===slot.key" :class="{active:editSlot===slot.key}" @click="choosePhoto(slot.key)"><img :src="assetUrl(design.photos[slot.key].src)" alt=""/><span>{{slot.label}}</span></button></div>
     <PartEditor :design="design" :section="editSection" :slot-key="editSlot" :busy="busyUpload" @upload="upload($event,editSlot)" @reset-photo="resetPhoto"/>
    </div>
    <div class="selection-panel-footer"><p>選んだ内容は、その場でアルバムに反映されます。</p><button @click="closePartEditor">完了</button></div>
   </aside></Transition>
  </main>

  <button v-if="!editTarget" class="chat-launcher" :aria-label="chatOpen?'相談ガイドを閉じる':'アルバムの相談ガイドを開く'" :aria-expanded="chatOpen" @click="chatOpen=!chatOpen"><UiIcon :name="chatOpen?'close':'message'" :size="20"/><span>アルバムのご相談</span></button>
  <section v-if="chatOpen && !editTarget" class="chat-panel" aria-label="アルバムの相談ガイド"><header><div><strong>アルバム選びのご案内</strong><small>アルバムづくりのガイド</small></div><button class="icon-button" aria-label="閉じる" @click="chatOpen=false"><UiIcon name="close" :size="18"/></button></header><div class="chat-messages" aria-live="polite"><p v-for="(m,i) in messages" :key="i" :class="m.role">{{m.text}}</p></div><div class="quick-questions"><button v-for="q in ['写真の差し替え方','デザインの保存','名入れについて']" :key="q" @click="ask(q)">{{q}}</button></div><form @submit.prevent="ask()"><input v-model="chatInput" aria-label="ガイドへの質問" placeholder="ご質問を入力してください" maxlength="300"/><button aria-label="質問する"><UiIcon name="chevron" :size="19"/></button></form><small class="chat-disclaimer">このガイドは、よくあるご質問に自動でご案内します。</small></section>
  <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><UiIcon name="check" :size="18"/>{{toast}}</div></Transition>

  <div v-if="drawer" class="overlay" @click.self="drawer=''"><aside class="drawer" role="dialog" aria-modal="true" :aria-label="drawer==='cart'?'ご相談リスト':drawer==='menu'?'メニュー':'お気に入り'"><header><h2>{{drawer==='cart'?'ご相談リスト':drawer==='favorite'?'お気に入り':'Kinmei'}}</h2><button class="icon-button" aria-label="閉じる" @click="drawer=''"><UiIcon name="close"/></button></header>
   <template v-if="drawer==='menu'"><nav class="menu-list"><button v-for="item in editorItems" :key="item.target" @click="drawer='';openPartEditor({target:item.target,trigger:'button'})">{{item.label}}を変更する</button></nav></template>
   <template v-if="drawer==='favorite'"><div v-if="favorite" class="favorite-card"><img :src="assetUrl('/images/album-closed.webp')" alt="ウェディング フォトアルバム"/><h3>ウェディング フォトアルバム</h3><p>お気に入りの一冊を、あなたらしく。</p><button class="primary-button" @click="drawer='';scrollStudio()">デザインを続ける</button><button class="text-button" @click="toggleFavorite">お気に入りから外す</button></div><div v-else class="empty-state"><UiIcon name="heart" :size="34"/><h3>気になる一冊を、ここに。</h3><p>ハートのボタンで、お気に入りに追加できます。</p><button class="secondary-button" @click="drawer=''">アルバムを見る</button></div></template>
   <template v-if="drawer==='cart'"><div v-if="!cart.length" class="empty-state"><UiIcon name="bag" :size="34"/><h3>ふたりの一冊を、ここから。</h3><p>色や写真を選び、気になる仕上がりをご相談リストに残せます。</p><button class="secondary-button" @click="drawer=''">アルバムをつくる</button></div><template v-else><div class="cart-items"><article v-for="item in cart" :key="item.id" class="cart-item"><img :src="assetUrl(item.image)" alt="カスタマイズしたアルバム"/><div><h3>ウェディング フォトアルバム</h3><p>{{item.color}} · {{item.design.size}} × {{item.design.size}} cm</p><p v-if="item.design.initials">名入れ：{{item.design.initials}}</p><p v-if="item.gift">専用ケースをご相談</p><strong>{{money(item.price)}}</strong><div class="item-actions"><button @click="exportSpec(item)">仕様書を書き出す</button><button @click="removeItem(item.id)">削除</button></div></div></article></div><div class="cart-summary"><p><span>参考合計（税込）</span><strong>{{money(total)}}</strong></p><button class="primary-button" @click="saveDesign();drawer='';dialog='consultation'">この一冊について、相談メモを残す</button><small>ご相談用のリストです。この画面で注文・決済は行われません。</small></div></template></template>
  </aside></div>
  <div v-if="dialog" class="overlay modal-overlay" @click.self="dialog=''"><section class="modal" role="dialog" aria-modal="true" :aria-label="dialog==='consultation'?'ふたりのアルバムのご相談':infoText.title"><button class="icon-button modal-close" aria-label="閉じる" @click="dialog=''"><UiIcon name="close"/></button><template v-if="dialog==='consultation'"><p class="eyebrow">ふたりの一冊のために</p><h2>ふたりのアルバムのご相談</h2><template v-if="!consultationSaved"><p>選んだ色や写真と一緒に、<br/>大切にしたいことを残しておけます。</p><p class="callout">相談メモをこの端末に保存します。式場スタッフへの送信は行いません。</p><form class="consultation-form" @submit.prevent="saveConsultation"><label>挙式日（予定日）<input v-model="consultation.date" type="date"/></label><label>ご相談の方法<select v-model="consultation.time"><option>式場でスタッフに相談</option><option>オンラインで相談</option><option>未定</option></select></label><label>相談したいこと<textarea v-model="consultation.note" rows="3" placeholder="例：挙式の写真を中心に、ふたりの名前を入れたい" maxlength="1000"/></label><button class="primary-button" type="submit">相談メモを保存</button></form></template><div v-else class="consultation-success"><UiIcon name="check" :size="32"/><h3>相談メモを保存しました。</h3><p>{{consultation.date}} {{consultation.time}}<br/>この端末に、検討中のデザインと一緒に保存しています。スタッフへの送信は行われていません。</p><button class="secondary-button" @click="consultationSaved=false">メモを編集する</button></div></template><template v-else-if="dialog==='albumInfo'"><p class="eyebrow">Kinmei Wedding Album</p><h2>アルバムについて</h2><div class="selection-info"><details v-for="detail in details" :key="detail.title"><summary>{{detail.title}}</summary><p>{{detail.text}}</p></details><label class="gift-option"><input v-model="giftWrap" type="checkbox"/>専用ケースも相談する</label><button class="secondary-button" @click="resetDesign();dialog=''">デザインを初期状態に戻す</button></div></template><template v-else><p class="eyebrow">Kinmei</p><h2>{{infoText.title}}</h2><p>{{infoText.text}}</p><button v-if="dialog==='privacy'" class="secondary-button" @click="clearData">保存データを削除</button><button v-if="dialog==='stores'" class="primary-button" @click="dialog='consultation'">相談メモを作成</button></template></section></div>
 </div>
</template>
