<template>
    <DataTable
        :items="items"
        :count="count"
        :loading="loading"
        :headers="USER_HEADERS"
        
        @fetching="getItems">
        <template #extraTop="{handleFetch}">
            <Select @update:model-value="handleFilterbyRole($event, handleFetch)">
                <SelectTrigger>
                    <SelectValue placeholder="Roli bo'yicha saralash" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="v,i in ALL_ROLES" :key="i" :value="v.value">
                            {{ v.title }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <span class="hidden md:block"></span>
            <Button @click="() => dialog=true">Yangi foydalanuvchi kiritish</Button>
        </template>
        <template #item.role="{item}">
            <span>{{ ROLES[item.role] }}</span>
        </template>
        <template #item.last_login="{item}">
            <span>{{ item.last_login ? new Date(item.last_login).toLocaleString() : '-' }}</span>
        </template>
        <template #item.created_at="{item}">
            <span>{{ item.created_at ? new Date(item.created_at).toLocaleString() : '-' }}</span>
        </template>
        <template #item.actions="{ item, index }">
            <div class="flex items-center gap-2 justify-end">
                <Button @click="editItem(item, index)" size="sm" class="!bg-[#008040] hover:!bg-[#007040]">
                    <Pen />
                    O'zgartirish
                </Button>
                <Button @click="remove(item.id, index)" size="sm" class="!bg-[#D93333] hover:!bg-[#aa3333]">
                    <Trash />
                    O'chirish
                </Button>
            </div>
        </template>
    </DataTable>
    
    <Dialog :open="dialog" @update:open="closeDialog">
        <DialogContent class="max-w-[450px]">
            <DialogHeader>
                <DialogTitle>{{ itemId?"Mijoz ma'lumotlarini o'zgartirish":"Mijoz kiritish" }}</DialogTitle>
            </DialogHeader>

            <form @submit="save" class="grid gap-y-2">
                <FormField v-slot="{ componentField }" name="username">
                    <FormItem>
                        <FormLabel>Login</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="Login" v-bind="componentField" />
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

                <FormField v-slot="{ componentField }" name="role">
                    <FormItem>
                        <FormLabel>Roli</FormLabel>
                        <Select v-bind="componentField">
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Rolni belgilang" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="role,i of roles" :key="i" :value="role.value">
                                        {{ role.title }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <Button type="submit" :disabled="isSubmitting">Saqlash</Button>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import * as z from 'zod'
import { ref, computed } from 'vue'
import { User } from '@/utils/types'
import { useForm } from 'vee-validate'
import { createToast } from '@/lib/toast'
import { Trash, Pen } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import DataTable from '@/components/data-table.vue'
import { createUser, deleteUser, getUsers, updateUser } from '@/api'
import { ROLES, USER_HEADERS, ALERT_MESSAGES } from '@/utils/constants'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const count = ref(0)
const dialog = ref(false)
const loading = ref(false)
const saveLoading = ref(false)
const items = ref<User[]>([])
const itemId = ref<null|number>(null)
const itemIndex = ref<null|number>(null)
    
const formSchema = toTypedSchema(z.object({
  username: z.string({ required_error: "Login kiritilish shart", invalid_type_error: "Login kiritilishi shart" })
    .min(1, { message: "Login kiritilish shart" }),
  password: z.string({ required_error: "Parol 3 tadan ko'p belgidan ko'p bo'lishi kerak", invalid_type_error: "Parol kiritilishi shart" })
    .min(3, { message: "Parol 3 tadan ko'p belgidan ko'p bo'lishi kerak" }),
  role: z.string({ required_error: "Foydalanuvchi roli belgilanishi shart", invalid_type_error: "Foydalanuvchi roli belgilanishi shart" })
    .min(1, { message: "Foydalanuvchi roli belgilanishi shart" }).nonempty(),
}))

const { handleSubmit, resetForm, setFieldValue, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: "",
    password: "",
    role: "VIEWER",
  }
})

const roles = computed(() => {
    return Object.keys(ROLES).map(k => ({
        title: ROLES[k],
        value: k
    }))
})

const ALL_ROLES = computed(() => {
    return [{ title: "BARCHASI", value: "all" }, ...roles.value]
})

const handleFilterbyRole = (role: string, cb: any) => {
    if(role === "all") cb()
    else cb({ filters: { role } })
}

const getItems = async (params: any) => {
    try {
        const data = await getUsers(params)
        items.value = data.items as any
        count.value = data.count
    } catch (error) {
        console.log(error);
    }
}

const editItem = (item: User, index: number) => {
    dialog.value = true
    itemId.value = item.id
    itemIndex.value = index

    setFieldValue('role', item.role)
    setFieldValue('username', item.username)
    setFieldValue('password', item.password)
}

const remove = async (id: number, index: number) => {
    try {
        if(!confirm("Mijoz malumotlarini o'chirmoqchimisiz?")) return
    
        await deleteUser(id)
        createToast(ALERT_MESSAGES.DATA_DELETED, "SUCCESS")
        items.value.splice(index, 1)
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, "WARNING")
        console.log(error)        
    }
}

const create = async (body: Partial<User>) => {
    const data = await createUser(body)
    if(!data) return createToast(ALERT_MESSAGES.ALREADY_EXISTS, "WARNING")
    createToast(ALERT_MESSAGES.DATA_CREATED, "SUCCESS")
    items.value.push(data)
}

const update = async (id: number, body: Partial<User>) => {
    const data = await updateUser(id, body)
    if(!data) return createToast(ALERT_MESSAGES.ALREADY_EXISTS, "WARNING")
    createToast(ALERT_MESSAGES.DATA_UPDATED, "SUCCESS")
    Object.assign(items.value[itemIndex.value!], data)
}

const save = handleSubmit(async (values) => {
    try {
        saveLoading.value = true
        if(itemId.value !== null)
            await update(itemId.value, values)
        else
            await create(values)

        closeDialog()
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, "WARNING")
        console.log(error)
    } finally {
        saveLoading.value = false
    }
})

const closeDialog = () => {
    itemId.value = null
    dialog.value = false
    itemIndex.value = null

    resetForm()
}
</script>