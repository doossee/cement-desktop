<template>
    <Card class="shadow-none rounded-lg h-min">
        <CardContent class="p-2">
            <div class="pl-2 flex justify-between items-center">
                <h1>Backup fayllar ro'yxati</h1>
                <Button v-if="store.getDatabase === 'database.db'" @click="handleCreateBackup" :disabled="hasToday">
                    <DatabaseBackup />
                    Bugungi ma'lumotlarni Backup'da saqlash
                </Button>
                <Button v-else @click="handleLoadCurrentDB(store.getDatabase)" variant="destructive">
                    <DatabaseBackup />
                    Hozirgi ma'lumotlar bazasiga qaytish
                </Button>
            </div>
            <div class="mt-2 grid grid-cols-1 gap-2">
                <div v-for="b,i in backups" :key="i" class="flex items-center gap-2">
                    <Button variant="secondary" class="flex-1" @click="handleLoadDatabase(b)" :disabled="b == store.getDatabase">
                        <DatabaseBackup />
                        {{ b }}
                    </Button>
                    <Button class="!bg-[#008040] hover:!bg-[#007040]" @click="handleUseBackup(b)" v-show="b == store.getDatabase">
                        <MonitorDown />
                        faylni faollashtirish
                    </Button>
                </div>
                <div class="text-center mt-2 text-gray-200 text-sm" v-show="backups.length === 0">
                    Bekaplar mavjud emas
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { DB } from '@/utils/sql'
import { useStore } from '@/store'
import { createToast } from '@/lib/toast'
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DatabaseBackup, MonitorDown } from 'lucide-vue-next'
import { documentDir, appDataDir } from '@tauri-apps/api/path'
import { readDir, copyFile, remove, mkdir, rename } from '@tauri-apps/plugin-fs'

const store = useStore()

const backups = ref<string[]>([])
const hasToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/[:.]/g, "-").toString();
    return backups.value.some(backup => backup.includes(`backup_${today}`));
})

const handleLoadBackups = async () => {
    try {
        const document_path = await documentDir();
    
        const backup_dir = document_path + "\\MyBackups"
        const data = await readDir(backup_dir)
        if(!data) return
        backups.value = data.filter(d => d.isFile).map(d => d.name)
    } catch (error) {
        console.log(error);
    }
}

const handleCreateBackup = async () => {
    if(!confirm("Malumotlar bazasini bekapda saqlamoqchimisiz?")) return

    try {
        const client_date = new Date().toISOString().replace(/[:.]/g, "-").toString()

        const app_data = await appDataDir()
        const document_path = await documentDir();
    
        const db_path = `${app_data}\\database.db`
        const backup_db = `backup_${client_date}.db`
        const backup_dir = document_path + "\\MyBackups"
        const backup_path = `${backup_dir}\\${backup_db}`
        
        await mkdir(backup_dir, { recursive: true });
        await copyFile(db_path, backup_path)
    
        backups.value.push(backup_db)

        createToast(`Bekap ${backup_path} faylda saqlandi!`, "SUCCESS")
    } catch (error) {
        console.log(error);
        createToast("Bekapni yaratishda xatolik yuz berdi!", "WARNING")
    }
}

const handleUseBackup = async (file: string) => {
    if(!confirm("Ushbu bekapni faollashtirmoqchimisiz?")) return

    try {
        await handleCreateBackup()
    
        const db = await DB()
        await db.close()
        const app_data = await appDataDir()
        await remove(`${app_data}\\database.db`)
        const db_path = `${app_data}\\${file}`
        await rename(db_path, `${app_data}\\database.db`)
        
        await db.close()
        store.setDatabase(null)
        createToast('Bekap muvaffaqqiyatli faollashtirildi', 'SUCCESS')
    } catch (error) {
        console.log(error);
        createToast('Bekapni faollashtirishda xatolik yuzaga keldi!', 'WARNING')
    }
}

const handleLoadDatabase = async (file: string) => {
    if(!confirm(`${file} Backup faylni yuklamoqchimisiz?`)) return

    const app_data = await appDataDir()
    const document_path = await documentDir();

    const backup_path = document_path + "\\MyBackups\\" + file
    const db_path = `${app_data}\\${file}`
    await copyFile(backup_path, db_path)
    store.setDatabase(file)
    createToast(`Bekap ${file} fayl muvaffaqqiyatli yuklandi!`, "SUCCESS")
}

const handleLoadCurrentDB = async (file: string) => {
    if(!confirm(`Hozirgi ma'lumotlar bazasiga qaytmoqchimisiz?`)) return

    try {
        const db = await DB()
        const app_data = await appDataDir()
        const db_path = `${app_data}\\${file}`
        await db.close()
        store.setDatabase(null)
        await remove(db_path)
        createToast(`Hozirgi ma'lumotlar bazasiga muvaffaqqiyatli o'tildi!`, "SUCCESS")
    } catch (error) {
        console.log(error);
    }
}

onMounted(async () => {
    handleLoadBackups()
})
</script>