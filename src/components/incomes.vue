<template>
    <DataTable :totalItem="totalIncome" hideSearch hideBottom clientSide :items="incomeFilters" :loading="loading" :count="incomes.length" :headers="INCOME_HEADERS">
        <template #extraTop>
            <div class="col-span-1 sm:col-span-2 md:col-span-4 flex justify-between items-center">
                <p class="p-2 text-nowrap">To'lovlar ro'yxati</p>
                <div class="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button class="shadow-none relative" size="icon">
                                <ListFilter />
                                <div v-show="methodFilter!==''" class="absolute w-3 h-3 rounded-full bg-amber-300 -top-1 -right-1"></div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem @click="methodFilter=''" class="cursor-pointer">
                                BARCHA TO'LOV TURLARI
                            </DropdownMenuItem>
                            <DropdownMenuItem v-for="m,i in Object.keys(PAYMENT_METHODS).map(k => ({ title: PAYMENT_METHODS[k], value: k }))" @click="methodFilter=m.value" :key="i" class="cursor-pointer">
                                <Check v-show="methodFilter==m.value" /> {{ m.title }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button :disabled="store.getDatabaseType !== 'current'" v-if="store.userData?.role === 'ADMIN'" @click="incomeDialog=true" class="!bg-[#008040] hover:!bg-[#007040]">To'lov kiritish</Button>
                </div>
            </div>
        </template>
        <template #item.date="{ item }">
            <span v-if="item.date">{{ new Intl.DateTimeFormat('ru-RU').format(new Date(item.date)) }}</span>
            <span v-else>Jami: </span>
        </template>
        <template #item.amount="{ item }">
            <span v-if="item.currency">
                <span class="text-nowrap">
                    {{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.amount || 0)}} $ |
                </span>
                <span class="text-nowrap">
                    {{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.currency * (item.amount || 0)) }} so'm
                </span>
            </span>
            <span v-else>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format((item.amount || 0)) }} so'm</span>
        </template>
        <template #item.currency="{ item }">
            <span>{{ item.currency ? item.currency + " so'm" : "-" }}</span>
        </template>
        <template #item.method="{ item }">
            <span v-if="item.method" class="text-nowrap px-2 py-1 rounded-md" :class="PAYMENT_METHOD_COLORS[item.method]">{{ PAYMENT_METHODS[item.method] }}</span>
            <span v-else>-</span>
        </template>
        <template #item.comment="{ item }">
            <span class="text-balance text-sm line-clamp-3 overflow-hidden text-ellipsis">{{ item.comment || '-' }}</span>
        </template>
        <template #item.actions="{ item, index }">
            <div v-if="store.userData?.role === 'ADMIN' && item.id" class="flex items-center gap-2 justify-end" @click.stop>
                <Button :disabled="store.getDatabaseType !== 'current'" @click="editItem(item)" size="icon" class="!bg-[#008040] hover:!bg-[#007040]">
                    <Pen />
                </Button>
                <Button :disabled="store.getDatabaseType !== 'current'" v-show="false" @click="handleDeleteIncome(item.id, index)" size="icon" class="!bg-[#D93333] hover:!bg-[#aa3333]">
                    <Trash />
                </Button>
            </div>
            <span v-else></span>
        </template>
    </DataTable>
    <Dialog :open="incomeDialog" @update:open="closeDialog">
        <DialogContent class="max-w-[450px]">
            <DialogHeader>
                <DialogTitle>To'lov kiritish</DialogTitle>
            </DialogHeader>

            <form @submit="handleSave" class="grid gap-y-2">
                <FormField v-slot="{ componentField }" name="date">
                    <FormItem>
                        <FormLabel>Sana</FormLabel>
                        <FormControl>
                            <DatePicker v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="amount">
                    <FormItem>
                        <FormLabel>To'lov summasi {{ isCurrency?`$ - (${((currency||0) * (values.amount||0)).toLocaleString('ru-RU')} so'm)`:"so'm" }}</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" placeholder="To'lov summasi" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
        
                <FormField v-slot="{ componentField }" name="method">
                    <FormItem>
                        <FormLabel>To'lov turi</FormLabel>
                        <Select v-bind="componentField">
                            <FormControl>
                                <SelectTrigger class="w-full">
                                    <SelectValue placeholder="To'lov turini belgilang" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="m,i in METHODS" :key="i" :value="m.value">
                                        {{ m.title }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-2">
                        <Switch id="isCurrency" v-model:checked="isCurrency" />
                        <label for="isCurrency" class="cursor-pointer text-nowrap">Valyuta kursi 1$:</label>
                    </div>
                    <Input type="number" required min="0" step="any" :disabled="!isCurrency" v-model="currency" placeholder="Valyuta kursi" />
                </div>
        
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
</template>

<script setup lang="ts">
import * as z from 'zod'
import { useStore } from '@/store'
import { Income } from '@/utils/types'
import { useForm } from 'vee-validate'
import { createToast } from '@/lib/toast'
import { computed, ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import DataTable from '@/components/data-table.vue'
import { Textarea } from '@/components/ui/textarea'
import DatePicker from '@/components/data-picker.vue'
import { ListFilter, Check, Pen, Trash } from 'lucide-vue-next'
import { createIncome, updateIncome, deleteIncome } from '@/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormItem, FormMessage, FormLabel, FormControl } from '@/components/ui/form'
import { PAYMENT_METHODS, ALERT_MESSAGES, INCOME_HEADERS, PAYMENT_METHOD_COLORS } from '@/utils/constants'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const emits = defineEmits(['created', 'deleted', 'updated', 'closed'])
const { clientId, incomes, totalIncome, loading } = defineProps<{ clientId: number, totalIncome: Income|null, incomes: Income[], loading: boolean }>()

const store = useStore()

const currency = ref(1)
const methodFilter = ref("")
const isCurrency = ref(false)
const incomeDialog = ref(false)
const itemId = ref<number|null>(null)

const incomeFilters = computed<Income[]>(() => {
    if(methodFilter.value === "") return incomes
    else return incomes.filter(i => i.method === methodFilter.value)
})

const METHODS = computed(() => {
    return Object.keys(PAYMENT_METHODS).map((key) => ({
        title: PAYMENT_METHODS[key],
        value: key,
    }))
})

const incomeformSchema = toTypedSchema(z.object({
    client_id: z.number().default(clientId),
    amount: z.number({ invalid_type_error: "To'lov summasi kiritlish shart" })
    .min(1, { message: "To'lov summasi kiritlish shart" }).default(0),
    method: z.string({ required_error: "To'lov turi belgilanishi shart",
    invalid_type_error: "To'lov turi belgilanishi shart"})
    .min(1, { message: "To'lov turi belgilanishi shart" }),
    date: z.date({ invalid_type_error: "Sana kiritilish shart",
    required_error: "Sana kiritilish shart" }).default(new Date()),
    comment: z.string().optional(),
}))

const { handleSubmit, isSubmitting, setFieldValue, values, resetForm } = useForm({
    validationSchema: incomeformSchema,
    initialValues: {
        amount: 0,
        comment: "",
        method: "CASH",
        date: new Date(),
        client_id: clientId,
    }
})

const editItem = (item: Income) => {
    itemId.value = item.id
    incomeDialog.value = true

    if(item.currency) {
        isCurrency.value = true
        currency.value = item.currency
    }
    setFieldValue('amount', item.amount)
    setFieldValue('method', item.method)
    setFieldValue('comment', item.comment)
    setFieldValue('date', new Date(item.date))
    setFieldValue('client_id', item.client_id)
}

const handleSave = handleSubmit(async (body) => {
    try {
        if(isCurrency.value) Object.assign(body, { currency: currency.value })
        
        if(itemId.value) await update(itemId.value, body)
        else await create(body)
        closeDialog()
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, 'WARNING')
        console.log(error)
    }
})

const create = async (body: typeof values) => {
    const data = await createIncome(body as any)

    createToast(ALERT_MESSAGES.DATA_UPDATED, "SUCCESS")
    emits('created', data)
}

const update = async (id: number, body: Partial<typeof values>) => {
    const index = incomes.findIndex(p => p.id === id)
    const v = incomes[index].currency ? incomes[index].currency * incomes[index].amount : incomes[index].amount
    
    const balance = await updateIncome(id, body as any, v)
    createToast(ALERT_MESSAGES.DATA_CREATED, "SUCCESS")
    emits('updated', body, Object.assign({}, incomes[index]), balance, index)
}

const handleDeleteIncome = async (id: number, index: number) => {
    try {
        if(!confirm("Ushbu to'lov o'chirmoqchimisiz?")) return

        const v = incomes[index].currency ? incomes[index].currency * incomes[index].amount : incomes[index].amount
    
        const balance = await deleteIncome(id, v, clientId)
        createToast(ALERT_MESSAGES.DATA_DELETED, "SUCCESS")
        emits('deleted', v, balance, index)
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, "WARNING")
    }
}

const closeDialog = () => {
    currency.value = 1
    itemId.value = null
    isCurrency.value = false
    incomeDialog.value = false
}

watch(incomeDialog, (isOpen) => {
  if (isOpen && !itemId.value) {
    resetForm();
  }
});
</script>