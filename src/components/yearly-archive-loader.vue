<template>
    <Card class="shadow-none rounded-lg h-min">
        <CardContent class="p-2">
            <div class="pl-2 flex justify-between items-center">
                <h1>Yillik arxiv ro'yxati</h1>
                <Button v-if="store.getDatabase === 'database.db'" @click="handleCreateArchive" :disabled="hasArchive">
                    <Archive />
                    Ma'lumotlarni yillik arxivda saqlash
                </Button>
                <Button v-else @click="handleLoadCurrentDB(store.getDatabase)" variant="destructive">
                    <ArchiveRestore />
                    Hozirgi ma'lumotlar bazasiga qaytish
                </Button>
            </div>
            <div class="mt-2 grid grid-cols-1 gap-2">
                <Button v-for="a,i in archives" :key="i" variant="secondary" @click="handleLoadDatabase(a)" :disabled="a == store.getDatabase">
                    <ArchiveRestore />
                    {{ a }}
                    faylni yuklash
                </Button>
                <div class="text-center mt-2 text-gray-200 text-sm" v-show="archives.length === 0">
                    Arxivlar mavjud emas
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { DB } from '@/utils/sql'
import { useStore } from '@/store'
import { deleteExpanses } from '@/api'
import { createToast } from '@/lib/toast'
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Archive, ArchiveRestore } from 'lucide-vue-next'
import { documentDir, appDataDir } from '@tauri-apps/api/path'
import { readDir, copyFile, remove, mkdir } from '@tauri-apps/plugin-fs'

const store = useStore()

const archives = ref<string[]>([])
const hasArchive = computed(() => {
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()

    if(month === 11 && day >= 25) {
        return archives.value.some(archive => archive.includes(`archive_${year}`))
    } else if(month === 0 && day <= 15) {
        return archives.value.some(archive => archive.includes(`archive_${year-1}`))
    }
    return true
})

const handleLoadArchives = async () => {
    try {
        const document_path = await documentDir();
    
        const archive_dir = document_path + "\\MyArchives"
        const data = await readDir(archive_dir)
        if(!data) return
        archives.value = data.filter(d => d.isFile).map(d => d.name)
    } catch (error) {
        console.log(error);
    }
}

const handleCreateArchive = async () => {
    if(!confirm("Malumotlar bazasini arxivlashtirmoqchimisiz?")) return

    try {
        const date = new Date()
        const day = date.getDate()
        const month = date.getMonth()
        let year = 0
        
        if(month === 11 && day >= 25) {
            year = date.getFullYear()
        } else if(month === 0 && day <= 15) {
            year = date.getFullYear() - 1
        }
        const app_data = await appDataDir()
        const document_path = await documentDir();
    
        const db_path = `${app_data}\\database.db`
        const archive_db = `archive_${year}.db`
        const archive_dir = document_path + "\\MyArchives"
        const archive_path = `${archive_dir}\\${archive_db}`
        
        await mkdir(archive_dir, { recursive: true });
        await copyFile(db_path, archive_path)
    
        archives.value.push(archive_db)

        await deleteExpanses()
        createToast(`Malumotlar muvaffaqqiyatli arxivlashtirildi`, "SUCCESS")
        createToast(`Arxiv ${archive_path} faylda saqlandi!`, "SUCCESS")
    } catch (error) {
        console.log(error);
        createToast("Arxivlashtirishda xatolik yuz berdi!", "WARNING")
    }
}

const handleLoadDatabase = async (file: string) => {
    if(!confirm(`${file} Arxiv faylni yuklamoqchimisiz?`)) return

    const app_data = await appDataDir()
    const document_path = await documentDir();

    const archive_path = document_path + "\\MyArchives\\" + file
    const db_path = `${app_data}\\${file}`
    await copyFile(archive_path, db_path)
    store.setDatabase(file)
    createToast(`Arxiv ${file} fayl muvaffaqqiyatli yuklandi!`, "SUCCESS")
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
    handleLoadArchives()
})
</script>