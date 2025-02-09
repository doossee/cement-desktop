<template>
  <RouterView />
  <Toaster />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from '@/store'
import { Toaster } from '@/components/ui/sonner'

const store = useStore()

onMounted(() => {
  store.checkAuth()
});
</script>