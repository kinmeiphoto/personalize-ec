<script setup>defineProps(['model'])</script>
<template><label class="setting-field">余白 {{model.margin}}px<input v-model.number="model.margin" type="range" min="0" max="70" /></label><label class="setting-field">枚数<input v-model.number="model.copies" type="number" min="1" max="999" @change="model.copies=Math.min(999,Math.max(1,Number(model.copies)||1))" /></label></template>
