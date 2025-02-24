import { useStore } from '@/store'
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', component: async () => import('@/pages/login.vue') },
        { path: '/', component: async () => import('@/pages/layout.vue'),
            beforeEnter(_, __, next) {
                const store = useStore()
                if(store.isLogged) next()
                else next('/login')
            },
            children: [
            { path: '', component: async () => import('@/pages/clients.vue') },
            { path: 'users', component: async () => import('@/pages/users.vue') },
            { path: 'settings', component: async () => import('@/pages/settings.vue') },
            { path: 'expenses/:id', component: async () => import('@/pages/expenses.vue') },
        ] }
    ]
})