<script setup>defineProps(['model'])</script>
<template><label class="checkbox"><input v-model="model.double" type="checkbox" />両面を作成する</label><p class="help">両面を選ぶと、プレビュー下の矢印で表面・裏面を切り替えられます。</p></template>
