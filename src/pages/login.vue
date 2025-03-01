<template>
    <main class="flex justify-center items-center h-screen">
        <Card>
            <CardHeader>
                <CardTitle >Tizimga kirish</CardTitle>
            </CardHeader>
            <CardContent class="w-[400px]">
    
                <form @submit="handleLogin" class="grid gap-y-2">
                    <FormField v-slot="{ componentField }" name="username">
                        <FormItem>
                            <FormLabel>Login</FormLabel>
                            <FormControl>
                                <Input placeholder="Login" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
            
                    <FormField v-slot="{ componentField }" name="password">
                        <FormItem>
                            <FormLabel>Parol</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Parol" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
    
                    <Button type="submit" :disabled="isSubmitting">Kirish</Button>
                </form>
            </CardContent>
        </Card>
    </main>
</template>

<script setup lang="ts">
import * as z from 'zod'
import { loginUser } from '@/api'
import { useStore } from '@/store'
import { useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import { createToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import { ALERT_MESSAGES } from '@/utils/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, FormItem, FormMessage, FormLabel, FormControl } from '@/components/ui/form'

const store = useStore()
const router = useRouter()

const incomeformSchema = toTypedSchema(z.object({
    username: z.string({ 
        invalid_type_error: "Login kiritlishi shart",
        required_error: "Login kiritlishi shart" })
        .min(1, { message: "Login kiritlishi shart" }),
    password: z.string({
        invalid_type_error: "Parol 3 ta belgidan katta bo'lishi kerak",
        required_error: "Parol 3 ta belgidan katta bo'lishi kerak", })
        .min(3, { message: "Parol 3 ta belgidan katta bo'lishi kerak" })
}))

const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: incomeformSchema,
})

const handleLogin = handleSubmit(async (values) => {
    try {
        const user = await loginUser(values)
        if(!user) return createToast(ALERT_MESSAGES.LOGIN_FAILED, 'WARNING')
        store.login(user)
        router.push('/')
        resetForm()
    } catch (error) {
        createToast(ALERT_MESSAGES.LOGIN_FAILED, 'WARNING')
        console.log(error)
    }
})
</script>