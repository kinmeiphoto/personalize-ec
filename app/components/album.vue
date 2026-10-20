<script setup>defineProps(['model'])</script>
<template><label class="setting-field">ページ数（表紙を除く）<select v-model.number="model.pages"><option :value="12">12ページ</option><option :value="20">20ページ</option><option :value="32">32ページ</option></select></label><p class="help">表紙と各ページは、プレビュー下の矢印で切り替えて編集できます。</p></template>
