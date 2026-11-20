import {ref,computed,nextTick} from 'vue'

export function useSelectionEditor({view,spinning,selectedPhoto,track}){
const editTarget=ref(''), contextEditor=ref(null), isCompact=ref(false), confirming=ref(false)
const editorItems=[
 {target:'size',label:'サイズ',icon:'cube'},
 {target:'cover',label:'表紙',icon:'palette'},
 {target:'photo-Cover',label:'写真',icon:'photo'},
 {target:'paper',label:'本文紙',icon:'layers'},
 {target:'frame',label:'写真枠',icon:'palette'},
 {target:'initials',label:'名入れ',icon:'type'}
]
const editSection=computed(()=>editTarget.value.startsWith('photo-')?'photo':editTarget.value)
const editSlot=computed(()=>editTarget.value.startsWith('photo-')?editTarget.value.slice(6):'Cover')
const editTitle=computed(()=>({'size':'アルバムのサイズ','cover':'表紙のカラー','paper':'本文紙のカラー','frame':'写真枠のカラー','initials':'表紙の名入れ','photo-Cover':'表紙の写真','photo-Left':'左ページの写真','photo-Right':'右ページの写真'}[editTarget.value]||''))
function openPartEditor({target,trigger='click'}){
 if(!['size','cover','paper','frame','initials','photo-Cover','photo-Left','photo-Right'].includes(target))return
 if(!['click','button'].includes(trigger))return
 editTarget.value=target;spinning.value=false
 if(target.startsWith('photo-'))selectedPhoto.value=target.slice(6)
 if(trigger==='button'){
  if(target==='paper'||target==='photo-Left'||target==='photo-Right')view.value='open'
  else if(target!=='size')view.value='closed'
 }
 track('open_part_editor',{part:target,trigger})
 nextTick(()=>contextEditor.value?.querySelector('button')?.focus({preventScroll:true}))
}
function selectEditor(target){
 if(target==='photo-Cover'&&editSection.value==='photo'){closePartEditor();return}
 if(target===editTarget.value){closePartEditor();return}
 openPartEditor({target,trigger:'button'})
}
function closePartEditor(restoreFocus=true){
 const key=editTarget.value;editTarget.value=''
 if(restoreFocus)nextTick(()=>{
  const dockKey=key.startsWith('photo-')?'photo-Cover':key
  document.querySelector('[data-editor="'+dockKey+'"]')?.focus({preventScroll:true})
 })
}
function dismissPartEditor(event){if(editTarget.value&&!event.target.closest('.selection-panel,.model-hotspot,.editor-dock'))closePartEditor(false)}
function syncViewport(){isCompact.value=window.innerWidth<=760}
return {editTarget,contextEditor,isCompact,editorItems,editSection,editSlot,editTitle,openPartEditor,selectEditor,closePartEditor,dismissPartEditor,syncViewport}
}
