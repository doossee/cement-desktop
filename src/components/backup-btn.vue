<template>
    <Button @click="handleBackup" variant="outline" size="icon">
        <div className="flex justify-center items-center">
            <DatabaseBackup className="h-[1.2rem] w-[1.2rem] block dark:hidden" />
        </div>
    </Button>
</template>

<script setup lang="ts">
import { createToast } from '@/lib/toast'
import { invoke } from '@tauri-apps/api/core'
import { Button } from '@/components/ui/button'
import { DatabaseBackup } from 'lucide-vue-next'
import { documentDir, appDataDir } from '@tauri-apps/api/path'

const handleBackup = async () => {
    if(!confirm("Malumotlar bazasini bekapda saqlamoqchimisiz?")) return

    try {
        const app_data = await appDataDir()
        const document_path = await documentDir();
    
        const backup_dir = document_path + "\\MyBackups"
        const db_path = `${app_data}\\database.db`
        
        const client_date = new Date().toISOString().replace(/[:.]/g, "-").toString()
    
        await invoke("backup_database", { arg1: client_date, arg2: db_path, arg3: backup_dir })
        createToast(`Bekap ${backup_dir}\\backup_${client_date}.db faylda saqlandi!`, "SUCCESS")
    } catch (error) {
        console.log(error);
        createToast("Bekapni yaratishda xatolik yuz berdi!", "WARNING")
    }
}
</script>