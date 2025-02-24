<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <BackupLoader />
        <YearlyArchive />
    </div>
</template>

<script setup lang="ts">
import BackupLoader from '@/components/backup-loader.vue'
import YearlyArchive from '@/components/yearly-archive-loader.vue'
</script>