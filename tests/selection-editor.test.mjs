import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, nextTick } from 'vue'
import { useSelectionEditor } from '../app/composables/useSelectionEditor.js'

function setup(){
  const view=ref('closed'),spinning=ref(true),selectedPhoto=ref('Cover')
  const events=[]
  const editor=useSelectionEditor({view,spinning,selectedPhoto,track:(...event)=>events.push(event)})
  return {...editor,view,spinning,selectedPhoto,events}
}
test('first view has no open editing panel',()=>{
  const s=setup()
  assert.equal(s.editTarget.value,'')
  assert.equal(s.editorItems.length,6)
  assert.equal(s.view.value,'closed')
})
test('hover cannot open a panel or change the current selection',()=>{
  const s=setup()
  s.openPartEditor({target:'paper',trigger:'hover'})
  assert.equal(s.editTarget.value,'')
  assert.equal(s.view.value,'closed')
  assert.equal(s.spinning.value,true)
  assert.equal(s.events.length,0)
  s.openPartEditor({target:'photo-Left',trigger:'click'})
  assert.equal(s.editTarget.value,'photo-Left')
  assert.equal(s.spinning.value,false)
  s.openPartEditor({target:'cover',trigger:'hover'})
  assert.equal(s.editTarget.value,'photo-Left')
  assert.equal(s.events.length,1)
  s.closePartEditor(false)
  s.openPartEditor({target:'cover',trigger:'hover'})
  assert.equal(s.editTarget.value,'')
})
test('bottom choices switch to the appropriate view, and close without reopening',()=>{
  const s=setup()
  s.selectEditor('paper')
  assert.equal(s.view.value,'open')
  assert.equal(s.editTarget.value,'paper')
  s.closePartEditor(false)
  assert.equal(s.editTarget.value,'')
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
  s.openPartEditor({target:'size',trigger:'click'})
  s.dismissPartEditor({target:{closest:()=>({})}})
  assert.equal(s.editTarget.value,'size')
  s.dismissPartEditor({target:{closest:()=>null}})
  assert.equal(s.editTarget.value,'')
})
test('unrecognized parts cannot open a drawer',()=>{
  const s=setup()
  s.openPartEditor({target:'unknown',trigger:'click'})
  assert.equal(s.editTarget.value,'')
})
// The browser handles focus and layout; this suite tests selection state only.
test.after(async()=>{await nextTick()})
