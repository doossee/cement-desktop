<template>
    <div class="flex h-screen">
        <Sidebar />
        <main class="p-2 flex-1 h-full overflow-auto">
            <router-view />
        </main>
    </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/sidebar.vue'
</script>