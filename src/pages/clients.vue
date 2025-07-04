<template>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <Card class="shadow-none mb-2">
            <CardContent class="py-2 pl-2 pr-4 flex justify-between items-center">
                <div class="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[#ff770015]">
                    <CircleAlert class="text-[#ff7700]" />
                </div>
                <div class="flex gap-1 text-sm text-right">
                    <p>Umumiy qarzdorlik:</p>
                    <p class="text-white">{{ (totals.debt + totals.purchase - totals.income).toLocaleString('ru-RU') }} s'om</p>
                </div>
            </CardContent>
        </Card>
        <Card class="shadow-none mb-2">
            <CardContent class="py-2 pl-2 pr-4 flex justify-between items-center">
                <div class="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[#fd323215]">
                    <ArrowDownCircle class="text-[#fd3232]" />
                </div>
                <div class="flex gap-1 text-sm text-right">
                    <p>Umumiy chiqim:</p>
                    <p class="text-white">{{ (totals.purchase ).toLocaleString('ru-RU') }} s'om</p>
                </div>
            </CardContent>
        </Card>
        <Card class="shadow-none mb-2">
            <CardContent class="py-2 pl-2 pr-4 flex justify-between items-center">
                <div class="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[#00e87415]">
                    <ArrowUpCircle class="text-[#00e874]" />
                </div>
                <div class="flex gap-1 text-sm text-right">
                    <p>Umumiy kirim:</p>
                    <p class="text-white">{{ (totals.income ).toLocaleString('ru-RU') }} s'om</p>
                </div>
            </CardContent>
        </Card>
    </div>

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
            <Select @update:model-value="handleFilterbyType($event, handleFetch)">
                <SelectTrigger>
                    <SelectValue placeholder="Turi bo'yicha saralash" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="v,i in types" :key="i" :value="v.value">
                            {{ v.title }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <div class="flex items-center gap-2">
                <Button @click="() => dialog1=true" size="icon">
                    <Download />
                </Button>
                <Button :disabled="store.getDatabaseType !== 'current'" v-if="store.userData?.role === 'ADMIN'" @click="() => dialog=true" class="flex-1">Yangi mijoz kiritish</Button>
            </div>
        </template>
        <template #item.status="{item}">
            <span class="px-2 py-1 rounded-md" :class="CLIENT_STATUS_COLORS[item.status]">{{ CLIENT_STATUSES[item.status] }}</span>
        </template>
        <template #item.type="{item}">
            <span class="px-2 py-1 rounded-md" :class="CLIENT_TYPE_COLORS[item.type]">{{ CLIENT_TYPES[item.type] }}</span>
        </template>
        <template #item.debt="{item}">
            {{ item.initial_debt ? `Avvalgi qolgan qarzi: ${item.initial_debt.toLocaleString('ru-RU')} s'om` : '-' }}
        </template>
        <template #item.balance="{item}">
            <span :class="(item.balance - (item.initial_debt || 0))>0?'text-[#008040]':((item.balance - (item.initial_debt || 0))<0?'text-[#D93333]':'')">
                {{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format((item.balance - (item.initial_debt || 0))) }} so'm
            </span>
        </template>
        <template #item.comment="{ item }">
            <p class="text-balance text-sm line-clamp-3 overflow-hidden text-ellipsis">{{ item.comment || '-' }}</p>
        </template>
        <template #item.actions="{ item, index }">
            <div v-if="store.userData?.role === 'ADMIN'" class="flex items-center gap-2 justify-end" @click.stop>
                <Button :disabled="store.getDatabaseType !== 'current'" @click="editItem(item, index)" size="sm" class="!bg-[#008040] hover:!bg-[#007040]">
                    <Pen />
                    O'zgartirish
                </Button>
                <Button :disabled="store.getDatabaseType !== 'current'" @click="remove(item.id, index)" size="sm" class="!bg-[#D93333] hover:!bg-[#aa3333]">
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

                <FormField v-slot="{ componentField }" name="type">
                    <FormItem>
                        <FormLabel>Mijoz turini belgilang</FormLabel>
                        <Select v-bind="componentField">
                            <FormControl>
                                <SelectTrigger class="w-full">
                                    <SelectValue placeholder="Mijoz turini belgilang" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="t,i in types.slice(1, 3)" :key="i" :value="t.value">
                                        {{ t.title }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="initial_debt">
                    <FormItem>
                        <FormLabel>Avvalgi qolgan qarzi</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Avvalgi qarzi" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="comment">
                    <FormItem>
                        <FormLabel>Izoh</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Izoh" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

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
import { getExpenses } from '@/api/expenses'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import DataTable from '@/components/data-table.vue'
import { Textarea } from '@/components/ui/textarea'
import { generateClientPDF } from '@/utils/generate-pdf'
import { Card, CardContent } from '@/components/ui/card'
import DateRangePicker from '@/components/date-range-picker.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Trash, Pen, Download, CircleAlert, ArrowDownCircle, ArrowUpCircle } from 'lucide-vue-next'
import { CalendarClock, Calendar, CalendarFold, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-vue-next'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getClients, createClient, deleteClient, updateClient, getAllClients, getTotalClientExpenses } from '@/api/clients'
import { CLIENT_STATUSES, CLIENT_HEADERS, ALERT_MESSAGES, CLIENT_STATUS_COLORS, CLIENT_TYPES, CLIENT_TYPE_COLORS } from '@/utils/constants'

const store = useStore()

const totals = ref({
    debt: 0,
    income: 0,
    purchase: 0,
})
const count = ref(0)
const dialog = ref(false)
const dialog1 = ref(false)
const loading = ref(false)
const saveLoading = ref(false)
const items = ref<Client[]>([])
const itemId = ref<null|number>(null)
const itemIndex = ref<null|number>(null)
const userInitialValues = {
    name: "",
    phone: "",
    comment: "",
    type: "DAILY",

    initial_debt: 0,
}

const statuses = computed(() => {
    return [{ title: "BARCHASI", value: "all" }, ...Object.keys(CLIENT_STATUSES).map(k => ({ value: k, title: CLIENT_STATUSES[k] }))]
})

const types = computed(() => {
    return [{ title: "BARCHASI", value: "all" }, ...Object.keys(CLIENT_TYPES).map(k => ({ value: k, title: CLIENT_TYPES[k] }))]
})
    
const formSchema = toTypedSchema(z.object({
  name: z.string({ required_error: "Ism familiya kiritilish shart", invalid_type_error: "Ism familiya kiritilish shart" })
    .min(2, { message: "Ism familiya kiritilish shart" }).max(50),
  phone: z.string({ required_error: "Telefon raqam kiritilish shart", invalid_type_error: "Telefon raqam kiritilish shart" })
    .min(2, { message: "Telefon raqam kiritilish shart" }).max(50),
  type: z.string({ required_error: "Mijoz turi beligilanishi shart", invalid_type_error: "Mijoz turi beligilanishi shart" })
    .min(2, { message: "Mijoz turi beligilanishi shart" }).max(50).nonempty(),

  initial_debt: z.number().default(0).optional(),
  comment: z.string().optional(),
}))

const { handleSubmit, resetForm, setFieldValue, isSubmitting, values } = useForm({
  validationSchema: formSchema,
  initialValues: userInitialValues
})

const handleFilterbyStatus = (status: string, cb: any) => {
    if(status === "all") cb()
    else cb({ filters: { status } })
}

const handleFilterbyType = (type: string, cb: any) => {
    if(type === "all") cb()
    else cb({ filters: { type } })
}

const getItems = async (params: any) => {
    try {
        const data = await getClients(params)
        items.value = data.items as any
        count.value = data.count

        const totalItems = await getTotalClientExpenses(params)
        totals.value.debt = totalItems?.totalDebt||0
        totals.value.income = (totalItems.totalIncomes?.amount||0)
        totals.value.purchase = (totalItems.totalPurchase?.total_price||0)
    } catch (error) {
        console.log(error);
    }
}

const editItem = (item: Client, index: number) => {
    dialog.value = true
    itemId.value = item.id
    itemIndex.value = index

    setFieldValue('name', item.name)
    setFieldValue('type', item.type!)
    setFieldValue('phone', item.phone!)
    setFieldValue('comment', item.comment)
    setFieldValue('initial_debt', item.initial_debt!)
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

const create = async (body: Partial<typeof values>) => {
    if(body.initial_debt) Object.assign(body, { status: 'DEBT' })
    const data = await createClient(body)

    createToast(ALERT_MESSAGES.DATA_UPDATED, "SUCCESS")
    items.value.push(data)
}

const update = async (id: number, body: Partial<typeof values>) => {
    const item = items.value[itemIndex.value!]
    if(item && typeof body.initial_debt == 'number') {
        if(item.balance - body.initial_debt === 0) Object.assign(body, { status: 'CLEAR' }) 
        if(item.balance - body.initial_debt > 0) Object.assign(body, { status: 'OWED' }) 
        if(item.balance - body.initial_debt < 0) Object.assign(body, { status: 'DEBT' }) 
    }
    const data = await updateClient(id, body)
    createToast(ALERT_MESSAGES.DATA_CREATED, "SUCCESS")
    Object.assign(items.value[itemIndex.value!], data)
}

const save = handleSubmit(async (values) => {
    try {
        saveLoading.value = true
        if(itemId.value !== null) {
            await update(itemId.value, values)
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
    if(!dialog.value) return
    
    itemId.value = null
    dialog.value = false
    itemIndex.value = null

    resetForm({ values: userInitialValues })
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
        const { incomes, purchases, totalIncomes, totalPurchase } = await getExpenses({ client_id: client.id, start, end })
        console.log(incomes, purchases, totalIncomes, totalPurchase);
        
        await generateClientPDF(
            client,
            totalPurchase ? [...purchases, totalPurchase] : purchases, 
            totalIncomes ? [...incomes, totalIncomes] : incomes,
            start, end)
    })

    dialog1.value=false
    createToast("Fayllar muvofaqqiyatli yuklandi", "SUCCESS")
}
</script>