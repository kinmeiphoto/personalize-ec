<script setup>
const props = defineProps({ name: String, size: { type: [Number, String], default: 20 } })
const paths = {
 palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.4 1.4 0 0 1 1-2.4H17a4 4 0 0 0 4-4 8 8 0 0 0-9-8ZM7 9h.01M11 6h.01M16 7h.01M6 14h.01',
 layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
 type: 'M4 6V3h16v3M12 3v18M8 21h8',
 menu: 'M4 7h16M4 12h16M4 17h16', close: 'm6 6 12 12M6 18 18 6',
 heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 bag: 'M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
 check: 'm5 12 4 4L19 6', chevron: 'm9 5 7 7-7 7', down: 'm6 9 6 6 6-6',
 plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
 expand: 'M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5',
 camera: 'M14.5 4h-5L8 7H3v13h18V7h-5l-1.5-3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 rotate: 'M20 11a8 8 0 1 0-2 6M20 4v7h-7',
 upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
 save: 'M5 3h12l3 3v15H4V3h1ZM8 3v6h8V3M8 21v-8h8v8',
 message: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.4Z',
 cube: 'm12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10v10M3 7l9 5 9-5M7.5 4.5l9 5',
 help: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 gift: 'M20 12v9H4v-9M2 7h20v5H2V7Zm10 0v14M12 7H7a2.5 2.5 0 1 1 2.5-2.5L12 7Zm0 0h5a2.5 2.5 0 1 0-2.5-2.5L12 7Z',
 photo: 'M3 3h18v18H3V3Zm0 14 6-6 4 4 3-3 5 5M17 7h.01',
 mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
 pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 search: 'M21 21l-5.2-5.2M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[props.name] || paths.cube" /></svg></template>
