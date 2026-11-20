import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, nextTick } from 'vue'
import { useSelectionEditor } from '../app/composables/useSelectionEditor.js'

function setup(){
  const view=ref('closed'),spinning=ref(true),selectedPhoto=ref('Cover')
  const pauses=[],events=[]
  const viewer=ref({suspendHover:duration=>pauses.push(duration)})
  const editor=useSelectionEditor({view,spinning,selectedPhoto,viewer,track:(...event)=>events.push(event)})
  return {...editor,view,spinning,selectedPhoto,pauses,events}
}
test('first view has no open editing panel',()=>{
  const s=setup()
  assert.equal(s.editTarget.value,'')
  assert.equal(s.editorItems.length,6)
  assert.equal(s.view.value,'closed')
})
test('hover opens a part without changing the album view or interrupting an open menu',()=>{
  const s=setup()
  s.openPartEditor({target:'paper',trigger:'hover'})
  assert.equal(s.editTarget.value,'paper')
  assert.equal(s.view.value,'closed')
  assert.equal(s.spinning.value,false)
  s.openPartEditor({target:'cover',trigger:'hover'})
  assert.equal(s.editTarget.value,'paper')
})
test('bottom choices switch to the appropriate view, and close without reopening',()=>{
  const s=setup()
  s.selectEditor('paper')
  assert.equal(s.view.value,'open')
  assert.equal(s.editTarget.value,'paper')
  s.closePartEditor(false)
  assert.equal(s.editTarget.value,'')
  assert.equal(s.pauses.at(-1),1000)
  s.selectEditor('initials')
  assert.equal(s.editTarget.value,'initials')
  assert.equal(s.view.value,'closed')
  s.closePartEditor(false)
})
test('left and right photo menus select their individual slots',()=>{
  const s=setup()
  s.openPartEditor({target:'photo-Left',trigger:'button'})
  assert.equal(s.editSection.value,'photo')
  assert.equal(s.editSlot.value,'Left')
  assert.equal(s.selectedPhoto.value,'Left')
  assert.equal(s.view.value,'open')
  s.openPartEditor({target:'photo-Right',trigger:'button'})
  assert.equal(s.editSlot.value,'Right')
  assert.equal(s.selectedPhoto.value,'Right')
  s.openPartEditor({target:'photo-Cover',trigger:'button'})
  assert.equal(s.view.value,'closed')
  s.closePartEditor(false)
})
test('external pointer clicks close a panel; clicks inside controls keep it open',()=>{
  const s=setup()
  s.openPartEditor({target:'size',trigger:'hover'})
  s.dismissPartEditor({target:{closest:()=>({})}})
  assert.equal(s.editTarget.value,'size')
  s.dismissPartEditor({target:{closest:()=>null}})
  assert.equal(s.editTarget.value,'')
})
test('unrecognized parts cannot open a drawer',()=>{
  const s=setup()
  s.openPartEditor({target:'unknown',trigger:'hover'})
  assert.equal(s.editTarget.value,'')
})
// The browser handles focus and layout; this suite tests selection state only.
test.after(async()=>{await nextTick()})
