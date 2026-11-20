<script setup>
import * as THREE from 'three'
import { intersectAlbum } from '../utils/albumHit.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const props = defineProps({ design: Object, view: String, spinning: Boolean, activeTarget: String, hoverEnabled: Boolean })
const emit = defineEmits(['ready', 'error', 'edit'])
const assetUrl = useAssetUrl()
const host = ref(null)
const albumHovered = ref(false)
let lastPointer = null, overHotspot = false
const hotspots = ref([]), dragging = ref(false)
const anchors = {}, hitTester = new THREE.Raycaster()
let anchorsDirty = true
let renderer, scene, camera, controls, observer, raf, pmrem, environment, nameplate, baseMin = {}, visible = true
const groups = {}, textureCache = new Map(), textureRequests = new Map()
const textureLoader = new THREE.TextureLoader()
let disposed = false
let hoverTimer, hoverTarget='', hoverSuppressedUntil=0, lastFitDistance=0

function clearQueuedHover(){clearTimeout(hoverTimer);hoverTarget=''}
function suspendHover(duration=1000){clearQueuedHover();hoverSuppressedUntil=Date.now()+duration}
function queueHover(target){
  if(!target||!props.hoverEnabled||dragging.value||Date.now()<hoverSuppressedUntil){clearQueuedHover();return}
  if(hoverTarget===target)return
  clearQueuedHover();hoverTarget=target
  hoverTimer=setTimeout(()=>{
    if(!disposed&&props.hoverEnabled&&!dragging.value&&Date.now()>=hoverSuppressedUntil)emit('edit',{target,trigger:'hover'})
  },450)
}
function leaveAlbum(){
  lastPointer=null;overHotspot=false;albumHovered.value=false;clearQueuedHover()
}
function hoverHotspot(event,hotspot){
  if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return
  overHotspot=true;albumHovered.value=true;queueHover(hotspot.target)
}
function leaveHotspot(event){overHotspot=false;clearQueuedHover();handlePointerMove(event)}
function checkAlbumHover(){
  if(overHotspot)return
  if(!lastPointer||dragging.value||!camera||!renderer){albumHovered.value=false;clearQueuedHover();return}
  const rect=renderer.domElement.getBoundingClientRect()
  const hit=intersectAlbum({point:lastPointer,rect,camera,group:groups[props.view],nameplate,raycaster:hitTester})
  albumHovered.value=!!hit
  const name=hit?.object.material?.name||''
  const target=hit?.object.userData.editTarget || (name.startsWith('PHOTO_')?'photo-'+name.slice(6):({COLOR_Cover:'cover',COLOR_Paper:'paper',COLOR_Frame:'frame',DETAIL_PageEdges:'paper',DETAIL_Hinge:'cover'}[name]||''))
  queueHover(target)
}
function handlePointerMove(event){
  if(event.pointerType!=='mouse'&&event.pointerType!=='pen'){leaveAlbum();return}
  lastPointer={x:event.clientX,y:event.clientY}
  checkAlbumHover()
}

function updateCrop(map, slot) {
  const image = map.image
  if (!image?.width) return
  const ratio = image.width / image.height, target = 4 / 3
  let sx = ratio > target ? target / ratio : 1
  let sy = ratio > target ? 1 : ratio / target
  sx /= slot.zoom; sy /= slot.zoom
  map.repeat.set(sx, sy)
  map.offset.set((1-sx)/2 + slot.x*(1-sx)/2, (1-sy)/2 + slot.y*(1-sy)/2)
  map.needsUpdate = true
}
function applyDesign() {
  if (!scene) return
  anchorsDirty = true
  for (const [kind, group] of Object.entries(groups)) {
    const scale = props.design.size === '20' ? 2/3 : 1
    group.scale.setScalar(scale)
    group.position.y = -.32 - baseMin[kind]*scale
    group.traverse(mesh => {
      if (!mesh.isMesh || !mesh.material) return
      const mat = mesh.material
      if (mat.name === 'COLOR_Cover') { mat.color.set(props.design.cover); mat.roughness=.65; mat.metalness=0 }
      if (mat.name === 'COLOR_Paper') mat.color.set(props.design.paper)
      if (mat.name === 'COLOR_Frame') { mat.color.set(props.design.frame); mat.metalness=.65; mat.roughness=.32 }
      if (mat.name.startsWith('PHOTO_')) {
        const key = mat.name.replace('PHOTO_', ''), slot = props.design.photos[key]
        if (!slot) return
        const cacheKey = key + '|' + slot.src
        if (textureCache.has(cacheKey)) {
          mat.map = textureCache.get(cacheKey); updateCrop(mat.map,slot)
          mat.color.set('#ffffff'); mat.roughness=.58; mat.metalness=0; mat.needsUpdate=true
        } else if (!textureRequests.has(cacheKey)) {
          const req = textureLoader.loadAsync(assetUrl(slot.src)).then(map => {
            if (disposed) { map.dispose(); return }
            map.colorSpace=THREE.SRGBColorSpace; map.flipY=false
            map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8)
            textureCache.set(cacheKey,map); applyDesign()
          }).catch(() => emit('error','写真を読み込めませんでした。別の画像をお試しください。'))
          textureRequests.set(cacheKey,req)
        }
      }
    })
  }
  updateNameplate()
}
function updateNameplate() {
  if (nameplate) {
    scene.remove(nameplate); nameplate.geometry.dispose(); nameplate.material.map.dispose(); nameplate.material.dispose(); nameplate=null
  }
  const text = props.design.initials.trim()
  if (!text || props.view !== 'closed' || !groups.closed) return
  const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=160
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,1024,160)
  ctx.fillStyle=props.design.foil; ctx.font='58px Georgia, "Hiragino Mincho ProN", serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText(text,512,80,950)
  const map=new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace
  const mat=new THREE.MeshStandardMaterial({map,transparent:true,roughness:.4,metalness:.45,depthWrite:false,side:THREE.DoubleSide})
  nameplate=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.258),mat)
  nameplate.userData.editTarget='initials'
  const scale=props.design.size==='20'?2/3:1
  const box=new THREE.Box3().setFromObject(groups.closed)
  nameplate.rotation.x=-Math.PI/2; nameplate.position.set(0,box.max.y+.008,1.03*scale)
  nameplate.scale.setScalar(scale); scene.add(nameplate)
}
function setView() {
  Object.entries(groups).forEach(([kind,g]) => { g.visible=kind===props.view })
  resetView(); applyDesign()
}
function fitDistance(){
  const aspect=Math.max(.22,host.value.clientWidth/Math.max(1,host.value.clientHeight))
  const open=props.view==='open'
  return Math.max(open?10.6:8.4,(open?6.6:4.3)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*aspect))
}
function resetView() {
  if (!camera || !controls) return
  const open=props.view==='open'
  const distance=fitDistance(),direction=new THREE.Vector3(open?.055:.27,.64,.75).normalize()
  lastFitDistance=distance
  controls.target.set(0,-.25,0)
  camera.position.copy(controls.target).add(direction.multiplyScalar(distance));controls.update()
}
function zoom(direction) {
  const delta=camera.position.clone().sub(controls.target)
  const distance=THREE.MathUtils.clamp(delta.length()*(direction==='in'?.86:1.16),3.2,30)
  camera.position.copy(controls.target).add(delta.normalize().multiplyScalar(distance)); controls.update()
}
function snapshot() {
  if (!renderer) return null
  renderer.render(scene,camera)
  return renderer.domElement.toDataURL('image/png')
}
function createAnchors(kind, group) {
  group.updateMatrixWorld(true)
  const region = material => {
    const box = new THREE.Box3()
    group.traverse(mesh => { if (mesh.isMesh && mesh.material?.name === material) box.union(new THREE.Box3().setFromObject(mesh)) })
    return box
  }
  const defs = kind === 'closed' ? [
    { target:'cover', label:'表紙の色を変更', icon:'palette', material:'COLOR_Cover', u:.23, v:.72 },
    { target:'photo-Cover', label:'表紙の写真を変更', icon:'photo', material:'PHOTO_Cover', u:.5, v:.5 },
    { target:'frame', label:'写真枠の色を変更', icon:'palette', material:'COLOR_Frame', u:.985, v:.5 },
    { target:'paper', label:'本文紙の色を変更', icon:'layers', material:'COLOR_Paper', u:.73, v:1, edge:true },
    { target:'initials', label:'名入れを変更', icon:'type', material:'COLOR_Cover', u:.5, v:.82 }
  ] : [
    { target:'cover', label:'表紙の色を変更', icon:'palette', material:'COLOR_Cover', u:.012, v:.64 },
    { target:'photo-Left', label:'左ページの写真を変更', icon:'photo', material:'PHOTO_Left', u:.5, v:.5 },
    { target:'photo-Right', label:'右ページの写真を変更', icon:'photo', material:'PHOTO_Right', u:.5, v:.5 },
    { target:'paper', label:'本文紙の色を変更', icon:'layers', material:'COLOR_Paper', u:.72, v:.12 }
  ]
  return defs.flatMap(def => {
    const box = region(def.material)
    if (box.isEmpty()) return []
    const point = new THREE.Vector3(THREE.MathUtils.lerp(box.min.x,box.max.x,def.u),box.max.y+.02,THREE.MathUtils.lerp(box.min.z,box.max.z,def.v))
    if (def.edge) { point.y=(box.min.y+box.max.y)/2; point.z=box.max.z+.02 }
    else {
      // Find the actual curved surface, rather than floating above its bounds.
      hitTester.set(new THREE.Vector3(point.x,box.max.y+2,point.z),new THREE.Vector3(0,-1,0))
      const surface=hitTester.intersectObject(group,true).find(hit=>hit.object.material?.name===def.material)
      if (surface) point.y=surface.point.y+.025
    }
    return [{...def,local:group.worldToLocal(point),normal:new THREE.Vector3(0,def.edge?0:1,def.edge?1:0)}]
  })
}
function updateHotspots() {
  const group=groups[props.view]
  if (!group || !camera || !host.value) return
  group.updateMatrixWorld(true)
  const width=host.value.clientWidth,height=host.value.clientHeight
  const next=[]
  for (const anchor of anchors[props.view] || []) {
    const world=anchor.local.clone().applyMatrix4(group.matrixWorld)
    const direction=camera.position.clone().sub(world)
    if (anchor.normal.dot(direction)<=0) continue
    const projected=world.clone().project(camera)
    if(projected.z < -1 || projected.z > 1) continue
    const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height
    if(x<20 || x>width-20 || y<65 || y>height-42) continue
    hitTester.set(camera.position,world.clone().sub(camera.position).normalize())
    const hit=hitTester.intersectObject(group,true)[0]
    if(hit && hit.distance+.07 < camera.position.distanceTo(world)) continue
    next.push({target:anchor.target,label:anchor.label,icon:anchor.icon,x:Math.round(x),y:Math.round(y)})
  }
  hotspots.value=next
}
function editPart(hotspot) {
  clearQueuedHover();emit('edit',{...hotspot,trigger:'click'})
}
function focusHotspot(target) { host.value?.querySelector('[data-part="'+target+'"]')?.focus({preventScroll:true}) }
defineExpose({ snapshot, resetView, zoom, focusHotspot, suspendHover })
watch(()=>props.hoverEnabled,v=>{if(!v)clearQueuedHover()})
watch(() => props.design,applyDesign,{deep:true})
watch(() => props.view,setView)
watch(() => props.spinning,v => { if (controls) controls.autoRotate=v })
onMounted(async () => {
  await nextTick()
  try {
    scene=new THREE.Scene(); scene.background=new THREE.Color('#f1f2f2')
    renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap
    renderer.domElement.setAttribute('aria-label','アルバムの3Dプレビュー。ドラッグで回転、ピンチで拡大縮小できます。')
    renderer.domElement.setAttribute('role','img'); host.value.appendChild(renderer.domElement)
    camera=new THREE.PerspectiveCamera(35,1,.01,150)
    controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.08
    controls.enablePan=false; controls.minDistance=3.2; controls.maxDistance=30
    controls.maxPolarAngle=Math.PI*.49; controls.minPolarAngle=.12; controls.autoRotateSpeed=.7
    controls.addEventListener('change',()=>{ anchorsDirty=true })
    controls.addEventListener('start',()=>{ dragging.value=true;albumHovered.value=false;clearQueuedHover() })
    controls.addEventListener('end',()=>{ dragging.value=false; anchorsDirty=true })
    renderer.domElement.addEventListener('pointerdown',clearQueuedHover)
    pmrem=new THREE.PMREMGenerator(renderer)
    const room=new RoomEnvironment(); environment=pmrem.fromScene(room,.04); room.dispose()
    scene.environment=environment.texture; scene.environmentIntensity=.65
    scene.add(new THREE.HemisphereLight(0xffffff,0xd4d7d0,1.2))
    const key=new THREE.DirectionalLight(0xffffff,2.2); key.position.set(-3,7,5); key.castShadow=true
    key.shadow.mapSize.set(2048,2048); key.shadow.camera.left=-5; key.shadow.camera.right=5; key.shadow.camera.top=5; key.shadow.camera.bottom=-5
    key.shadow.normalBias=.015; key.shadow.bias=-.0002; key.shadow.radius=4; scene.add(key)
    const fill=new THREE.DirectionalLight(0xe9eef8,.8); fill.position.set(4,4,-3); scene.add(fill)
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x48514a,opacity:.10}))
    floor.rotation.x=-Math.PI/2; floor.position.y=-.325; floor.receiveShadow=true; scene.add(floor)
    const loader=new GLTFLoader()
    await Promise.all(['closed','open'].map(async kind => {
      const gltf=await loader.loadAsync(assetUrl('/models/album-'+kind+'.glb'))
      if (disposed) return
      const model=gltf.scene; model.scale.setScalar(1); model.updateMatrixWorld(true)
      const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3())
      model.position.sub(center); model.updateMatrixWorld(true)
      const group=new THREE.Group(); group.add(model)
      const mats=new Map()
      group.traverse(mesh => {
        if (!mesh.isMesh) return
        if (!mats.has(mesh.material)) mats.set(mesh.material,mesh.material.clone())
        mesh.material=mats.get(mesh.material); mesh.castShadow=true; mesh.receiveShadow=true
      })
      groups[kind]=group; baseMin[kind]=new THREE.Box3().setFromObject(group).min.y
      scene.add(group)
      anchors[kind]=createAnchors(kind,group)
    }))
    if (disposed) return
    const resize=() => {
      if (!host.value) return
      const w=host.value.clientWidth,h=host.value.clientHeight
      renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix()
      if(lastFitDistance){
        const offset=camera.position.clone().sub(controls.target),ratio=offset.length()/lastFitDistance
        lastFitDistance=fitDistance()
        camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(THREE.MathUtils.clamp(lastFitDistance*ratio,3.2,30)));controls.update()
      }
      anchorsDirty=true
    }
    observer=new ResizeObserver(resize); observer.observe(host.value); resize(); setView()
    let last=0
    const loop=time => {
      if(disposed) return
      raf=requestAnimationFrame(loop)
      if(document.hidden || time-last<32) return
      last=time; controls.update(); renderer.render(scene,camera)
      if(anchorsDirty){updateHotspots();checkAlbumHover();anchorsDirty=false}
    }
    raf=requestAnimationFrame(loop); emit('ready')
  } catch (e) { console.error(e); emit('error','3Dを表示できませんでした。WebGLに対応したブラウザーでお試しください。') }
})
onBeforeUnmount(() => {
  disposed=true; clearQueuedHover();cancelAnimationFrame(raf); observer?.disconnect(); controls?.dispose()
  renderer?.domElement.removeEventListener('pointerdown',clearQueuedHover)
  scene?.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material?.dispose() } })
  textureCache.forEach(t=>t.dispose()); environment?.dispose(); pmrem?.dispose(); renderer?.dispose()
})
</script>
<template>
 <div ref="host" class="three-stage" :class="{'has-editor':activeTarget,'is-dragging':dragging,'is-album-hovered':albumHovered}" @pointermove="handlePointerMove" @pointerleave="leaveAlbum">
  <div class="model-hotspots" :aria-hidden="!albumHovered || dragging" aria-label="3Dモデルの変更箇所">
   <button v-for="hotspot in hotspots" :key="hotspot.target" class="model-hotspot" :tabindex="albumHovered && !dragging ? 0 : -1" :class="{active:activeTarget===hotspot.target}" :data-part="hotspot.target" :style="{left:hotspot.x+'px',top:hotspot.y+'px'}" :aria-label="hotspot.label" :aria-expanded="activeTarget===hotspot.target" aria-haspopup="dialog" @pointerenter="hoverHotspot($event,hotspot)" @pointerleave="leaveHotspot($event)" @pointerdown.stop @click.stop="editPart(hotspot)">
    <UiIcon :name="hotspot.icon" :size="17"/><span>{{hotspot.label}}</span>
   </button>
  </div>
 </div>
</template>
