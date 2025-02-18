<template>
    <DataTable
        trClass="cursor-pointer"

        :items="items"
        :count="count"
        :loading="loading"
        :headers="CLIENT_HEADERS"

        @fetching="getItems"
        @rowClick="(item) => $router.push(`/expenses/${item.id}`)">
        <template #extraTop="{handleFetch}">
            <Select @update:model-value="handleFilterbyStatus($event, handleFetch)">
                <SelectTrigger>
                    <SelectValue placeholder="Holati bo'yicha saralash" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="v,i in statuses" :key="i" :value="v.value">
                            {{ v.title }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <Button @click="() => dialog1=true">Barcha ma'lumotlarini yuklash</Button>
            <Button v-if="store.userData?.role === 'ADMIN'" @click="() => dialog=true">Yangi mijoz kiritish</Button>
        </template>
        <template #item.status="{item}">
            <span class="px-2 py-1 rounded-md" :class="CLIENT_STATUS_COLORS[item.status]">{{ CLIENT_STATUSES[item.status] }}</span>
        </template>
        <template #item.balance="{item}">
            <span :class="item.balance>0?'text-[#008040]':(item.balance<0?'text-[#D93333]':'')">
                {{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.balance) }} so'm
            </span>
        </template>
        <template #item.actions="{ item, index }">
            <div v-if="store.userData?.role === 'ADMIN'" class="flex items-center gap-2 justify-end" @click.stop>
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
                <FormField v-slot="{ componentField }" name="name">
                    <FormItem>
                        <FormLabel>Ism familiya</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="Ism familiyasi" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="phone">
                    <FormItem>
                        <FormLabel>Telefon raqami</FormLabel>
                        <FormControl>
                            <Input v-mask="'+### ## ### ## ##'" type="text" placeholder="+998 01 234 56 78" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <div v-if="!itemId" class="grid grid-cols-2 gap-2">
                    <FormField v-slot="{ componentField }" name="purchase">
                        <FormItem>
                            <FormLabel>Yillik qarzi</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Yillik qarzi" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="year">
                        <FormItem>
                            <FormLabel>Yil</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Yil" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                </div>

                <Button type="submit" :disabled="isSubmitting">Saqlash</Button>
            </form>
        </DialogContent>
    </Dialog>
    
    <Dialog :open="dialog1" @update:open="() => dialog1=false">
        <DialogContent class="max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Barcha mijozlar ma'lumotlarini yuklab olish</DialogTitle>
            </DialogHeader>

            <div class="flex items-start flex-col gap-4">
                <div class="grid gap-2 w-full">
                    <h1>Kaneldar bo'yicha yuklash</h1>
                    <DateRangePicker @update:model-value="handleDownloadUsersExpanses" btnClass="!w-full !justify-center" />
                </div>

                <div class="grid gap-2 w-full">
                    <h1 class="mb-1">Shablon bo'yicha yuklash</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child class="w-full">
                            <Button class="shadow-none w-full">
                                <CalendarClock />
                                Shablon bo'yicha yuklash
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem @click="getReportPeriod('today')" class="cursor-pointer">
                                <CalendarCheck /> Bugungi kun
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="getReportPeriod('15_days')" class="cursor-pointer">
                                <CalendarDays /> Oxirgi 15 kunlik hisobot
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="getReportPeriod('1_month')" class="cursor-pointer">
                                <CalendarFold /> Oxirgi 1 oylik hisobot
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="getReportPeriod('6_months')" class="cursor-pointer">
                                <CalendarRange /> Oxirgi 6 oylik hisobot
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="getReportPeriod('1_year')" class="cursor-pointer">
                                <Calendar /> Oxirgi 1 yillik hisobot
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import * as z from 'zod'
import { useStore } from '@/store'
import { ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import { Client } from '@/utils/types'
import { createToast } from '@/lib/toast'
import { Trash, Pen } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import DataTable from '@/components/data-table.vue'
import { generateClientPDF } from '@/utils/generate-pdf'
import DateRangePicker from '@/components/date-range-picker.vue'
import { getExpenses, createAnnualExpense } from '@/api/expenses'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { getClients, createClient, deleteClient, updateClient, getAllClients } from '@/api/clients'
import { CLIENT_STATUSES, CLIENT_HEADERS, ALERT_MESSAGES, CLIENT_STATUS_COLORS } from '@/utils/constants'
import { CalendarClock, Calendar, CalendarFold, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-vue-next'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const store = useStore()

const count = ref(0)
const dialog = ref(false)
const dialog1 = ref(false)
const loading = ref(false)
const saveLoading = ref(false)
const items = ref<Client[]>([])
const itemId = ref<null|number>(null)
const itemIndex = ref<null|number>(null)
const currentYear = new Date().getFullYear()

const statuses = computed(() => {
    return [{ title: "BARCHASI", value: "all" }, ...Object.keys(CLIENT_STATUSES).map(k => ({ value: k, title: CLIENT_STATUSES[k] }))]
})
    
const formSchema = toTypedSchema(z.object({
  name: z.string({ required_error: "Ism familiya kiritilish shart" }).min(2).max(50),
  phone: z.string({ required_error: "Telefon raqam kiritilish shart" }).min(2).max(50),

  purchase: z.number().default(0).optional(),
  year: z.number().default(currentYear).optional(),
}))

const { handleSubmit, resetForm, setFieldValue, isSubmitting, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    phone: "",

    purchase: 0,
    year: currentYear,
  }
})

const handleFilterbyStatus = (status: string, cb: any) => {
    if(status === "all") cb()
    else cb({ filters: { status } })
}

const getItems = async (params: any) => {
    try {
        const data = await getClients(params)
        items.value = data.items as any
        count.value = data.count
    } catch (error) {
        console.log(error);
    }
}

const editItem = (item: Client, index: number) => {
    dialog.value = true
    itemId.value = item.id
    itemIndex.value = index

    setFieldValue('name', item.name)
    setFieldValue('phone', item.phone!)
}

const remove = async (id: number, index: number) => {
    try {
        if(!confirm("Mijoz malumotlarini o'chirmoqchimisiz?")) return
    
        await deleteClient(id)
        createToast(ALERT_MESSAGES.DATA_DELETED, "SUCCESS")
        items.value.splice(index, 1)
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, "WARNING")
    }
}

const create = async ({ purchase, year, ...body}: Partial<typeof values>) => {
    if(purchase) Object.assign(body, { balance: -purchase })
    const data = await createClient(body)

    if(purchase && year) {
        await createAnnualExpense({ purchase, year, client_id: data.id })
    }
    createToast(ALERT_MESSAGES.DATA_UPDATED, "SUCCESS")
    items.value.push(data)
}

const update = async (id: number, body: Partial<typeof values>) => {
    const data = await updateClient(id, body)
    createToast(ALERT_MESSAGES.DATA_CREATED, "SUCCESS")
    Object.assign(items.value[itemIndex.value!], data)
}

const save = handleSubmit(async (values) => {
    try {
        saveLoading.value = true
        if(itemId.value !== null) {
            const { name, phone } = values
            await update(itemId.value, { name, phone })
        } else {
            await create(values)
        }

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

const getReportPeriod = async (type: "today" | "15_days" | "1_month" | "6_months" | "1_year") => {
    const end = new Date();
    let start = new Date();

    switch (type) {
        case "today":
            start.setHours(0, 0, 0, 0);
            break;
        case "15_days":
            start.setDate(end.getDate() - 15);
            break;
        case "1_month":
            start.setMonth(end.getMonth() - 1);
            break;
        case "6_months":
            start.setMonth(end.getMonth() - 6);
            break;
        case "1_year":
            start.setFullYear(end.getFullYear() - 1);
            break;
        default:
            console.error("Неверный тип периода");
            return;
    }

    handleDownloadUsersExpanses({ start, end });
}

const handleDownloadUsersExpanses: any = async ({ start, end }: {start: Date, end: Date}) => {
    const { items } = await getAllClients()

    items.map(async (client) => {
        const { incomes, purchases, annual_expenses } = await getExpenses({ client_id: client.id, start, end })

        await generateClientPDF(client, purchases, incomes, annual_expenses, start, end)
    })

    // for(let i = 0; i < items.length - 1; i++) {
    //     const { incomes, purchases, annual_expenses } = await getExpenses({ client_id: items[i].id, start, end })

    //     await generateClientPDF(items[i], purchases, incomes, annual_expenses, start, end)
    // }

    dialog1.value=false
    createToast("Fayllar muvofaqqiyatli yuklandi", "SUCCESS")
}
</script>