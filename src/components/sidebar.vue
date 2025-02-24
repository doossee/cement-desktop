<template>
    <div class="sticky bg-card border-r flex flex-col gap-2 justify-between p-2">
        <div class="flex flex-col gap-2">
            <template v-for="link,i in LINKS" :key="i">
                <RouterLink :to="link.url" v-if="link.access.includes(store.user?.role!)">
                    <Button :variant="(store.getDatabaseType !== 'current' && link.url==='/settings')?'destructive':($route.path === link.url ? 'default' : 'outline')" size="icon">
                        <component :is="link.icon" />
                    </Button>
                </RouterLink>
            </template>
        </div>

        <div class="flex flex-col gap-2">
            <Button @click="handleLogout" variant="outline" size="icon">
                <LogOut />
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import { LINKS } from '@/utils/constants'
import { createToast } from '@/lib/toast'
// import ThemeToggler from './theme-toggler.vue'
import { Button } from '@/components/ui/button'
import { ALERT_MESSAGES } from '@/utils/constants'

const store = useStore()
const router = useRouter()

const handleLogout = () => {
    if(!confirm("Akkauntdan chiqishni istaysizmi?")) return
    
    router.push('/login')
    store.logout()
    createToast(ALERT_MESSAGES.OPERATION_SUCCESS, "SUCCESS")
}
</script>