<script setup>
const assetUrl = useAssetUrl()
import { coverColors, paperColors, frameColors } from '~/composables/useAlbum'
const props=defineProps({ design:Object, section:String, slotKey:{type:String,default:'Cover'}, busy:Boolean })
const emit=defineEmits(['upload','reset-photo'])
const photo=computed(()=>props.design.photos[props.slotKey])
const options=computed(()=>props.section==='paper'?paperColors:frameColors)
const key=computed(()=>props.section==='paper'?'paper':'frame')
</script>
<template>
 <div class="part-editor-content">
  <template v-if="section==='size'">
   <p class="part-intro">ふたりの写真を残す、一冊の大きさを選びます。</p>
   <div class="part-size-options" role="group" aria-label="アルバムのサイズ">
    <button v-for="s in ['20','30']" :key="s" :class="{active:design.size===s}" :aria-pressed="design.size===s" @click="design.size=s"><span class="part-size-book" :class="{large:s==='30'}"><UiIcon name="cube" :size="s==='30'?43:32"/></span><span><strong>{{s}} × {{s}} cm</strong><small>{{s==='20'?'手に取りやすい、コンパクトな一冊':'写真をゆったり楽しめる、大きな一冊'}}</small><small>{{s==='20'?'￥19,800':'￥24,200'}}（税込・参考価格）</small></span><UiIcon v-if="design.size===s" name="check" :size="18"/></button>
   </div>
  </template>
  <template v-else-if="section==='cover'">
   <p class="part-intro">挙式の思い出に似合う、表紙の色を。</p>
   <div class="part-palette" role="group" aria-label="表紙カラーの選択">
    <button v-for="c in coverColors" :key="c.hex" :aria-label="'表紙を'+c.name+'に変更'" :aria-pressed="design.cover===c.hex" :class="{active:design.cover===c.hex}" @click="design.cover=c.hex"><i :style="{background:c.hex}"><UiIcon v-if="design.cover===c.hex" name="check" :size="16" :style="{color:c.name==='アイボリー'?'#222':'#fff'}"/></i><span>{{c.name}}</span></button>
   </div>
   <label class="part-custom-color"><span>お好みの色</span><span class="color-hex">{{design.cover.toUpperCase()}}</span><input v-model="design.cover" type="color" aria-label="ポップアップで表紙を自由な色に変更"/></label>
  </template>
  <template v-else-if="section==='paper'||section==='frame'">
   <p class="part-intro">{{section==='paper'?'ふたりの写真を引き立てる台紙の色を。':'大切な一枚を、静かに引き立てる色を。'}}</p>
   <div class="part-palette compact" role="group" :aria-label="section==='paper'?'本文紙カラーの選択':'写真枠カラーの選択'"><button v-for="c in options" :key="c.hex" :aria-label="(section==='paper'?'本文紙':'写真枠')+'を'+c.name+'に変更'" :aria-pressed="design[key]===c.hex" :class="{active:design[key]===c.hex}" @click="design[key]=c.hex"><i :style="{background:c.hex}"><UiIcon v-if="design[key]===c.hex" name="check" :size="16" :style="{color:c.hex==='#fafafa'||c.name==='クリーム'?'#222':'#fff'}"/></i><span>{{c.name}}</span></button></div>
  </template>
  <template v-else-if="section==='photo'">
   <div class="part-photo-preview"><img :src="assetUrl(photo.src)" alt="選択中の写真" :style="{transform:'scale('+photo.zoom+')',transformOrigin:((photo.x+1)*50)+'% '+((photo.y+1)*50)+'%'}"/></div>
   <label class="upload-button part-upload"><UiIcon name="upload" :size="18"/>{{busy?'写真を処理しています…':'写真を差し替える'}}<input type="file" accept="image/jpeg,image/png,image/webp" :disabled="busy" :aria-label="'ポップアップで'+slotKey+'の写真を選択'" @change="emit('upload',$event)"/></label>
   <div class="part-crop"><label>拡大<span>{{photo.zoom.toFixed(2)}}×</span><input v-model.number="photo.zoom" aria-label="ポップアップの写真の拡大率" type="range" min="1" max="3" step="0.01"/></label><label>左右<input v-model.number="photo.x" aria-label="ポップアップの写真の左右位置" type="range" min="-1" max="1" step="0.01"/></label><label>上下<input v-model.number="photo.y" aria-label="ポップアップの写真の上下位置" type="range" min="-1" max="1" step="0.01"/></label></div>
   <div class="part-photo-note"><span>JPG・PNG・WebP / 最大10MB</span><button class="text-button" @click="emit('reset-photo')">元に戻す</button></div><p class="part-privacy">写真は端末内で処理されます。</p>
  </template>
  <template v-else-if="section==='initials'">
   <label class="part-intro" for="popup-initials">お名前や挙式の日付を、表紙に。</label><input id="popup-initials" v-model="design.initials" class="initials-input" placeholder="例：Haruka & Ren" maxlength="12" autocomplete="off"/><p class="input-help">お名前・挙式日など、12文字まで<span>{{design.initials.length}} / 12</span></p><p class="part-foil-label">箔のカラー</p><div class="foil-options"><button v-for="c in frameColors" :key="c.hex" :aria-pressed="design.foil===c.hex" @click="design.foil=c.hex"><i :style="{background:c.hex}"/>{{c.name}}</button></div><p class="part-privacy">名入れ追加：＋￥2,200（税込・参考価格）</p>
  </template>
 </div>
</template>
