<template>
    <DataTable :totalItem="totalPurchase" hideSearch hideBottom clientSide :items="purchases" :loading="loading" :count="purchases.length" :headers="PURCHASE_HEADERS">
        <template #extraTop>
            <div class="col-span-1 sm:col-span-4 flex justify-between items-center">
                <p class="p-2">Sotuvlar ro'yxati</p>
                <Button :disabled="store.getDatabaseType !== 'current'" v-if="store.userData?.role === 'ADMIN'" @click="purchaseDialog=true" class="!bg-[#D93333] hover:!bg-[#aa3333]">Sotuv kiritish</Button>
            </div>
        </template>
        <template #item.date="{item}">
            <span v-if="item.date">{{ new Intl.DateTimeFormat('ru-RU').format(new Date(item.date)) }}</span>
            <span v-else>Jami: </span>
        </template>
        <template #item.currency="{ item }">
            <span>{{ item.currency ? item.currency + " so'm" : "-" }}</span>
        </template>
        <template #item.sack_price="{item}">
            <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.sack_price||0) }} {{ item.currency ? "$" : "so'm" }}</span>
        </template>
        <template #item.scatter_price="{item}">
            <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.scatter_price||0) }} {{ item.currency ? "$" : "so'm" }}</span>
        </template>
        <template #item.sum_price="{item}">
            <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.sum_price||0) }} so'm</span>
        </template>
        <template #item.car_cost="{item}">
            <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.car_cost||0) }} {{ item.currency ? "$" : "so'm" }}</span>
        </template>
        <template #item.other_cost="{item}">
            <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.other_cost||0) }} {{ item.currency ? "$" : "so'm" }}</span>
        </template>
        <template #item.total_price="{item}">
            <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.total_price||0) }} so'm</span>
        </template>
        <template #item.comment="{ item }">
            <p class="text-balance text-sm line-clamp-3 overflow-hidden text-ellipsis">{{ item.comment || '-' }}</p>
        </template>
        <template #item.driver="{ item }">
            <p class="text-sm">{{ item.driver || '-' }}</p>
        </template>
        <template #item.actions="{ item, index }">
            <div v-if="store.userData?.role === 'ADMIN' && item.id" class="flex items-center gap-2 justify-end" @click.stop>
                <Button :disabled="store.getDatabaseType !== 'current'" @click="editItem(item)" size="icon" class="!bg-[#008040] hover:!bg-[#007040]">
                    <Pen />
                </Button>
                <Button :disabled="store.getDatabaseType !== 'current'" v-show="false" @click="handleDeletePurchase(item.id, index)" size="icon" class="!bg-[#D93333] hover:!bg-[#aa3333]">
                    <Trash />
                </Button>
            </div>
            <span v-else>-</span>
        </template>
    </DataTable>
    <Dialog :open="purchaseDialog" @update:open="closeDialog">
        <DialogContent class="max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Sotuv kiritish</DialogTitle>
            </DialogHeader>

            <form @submit="handleSave" class="grid grid-cols-2 gap-3">
                <FormField v-slot="{ componentField }" name="date">
                    <FormItem class="col-span-2">
                        <FormLabel>Sana</FormLabel>
                        <FormControl>
                            <DatePicker v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="sack_num">
                    <FormItem>
                        <FormLabel>Qop donasi</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Qop donasi" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="sack_price">
                    <FormItem>
                        <FormLabel>Qop narxi {{ isCurrency?"$":"so'm" }}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Qop narxi" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="scatter_num">
                    <FormItem>
                        <FormLabel>Sochma</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Sochma" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="scatter_price">
                    <FormItem>
                        <FormLabel>Sochma narxi{{ isCurrency?"$":"so'm" }}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Sochma narxi" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                
                <Input :model-value="`Summasi: ${purchaseSumPrice.toLocaleString('ru-RU')} so'm`" readonly class="col-span-2" />
        
                <FormField v-slot="{ componentField }" name="car_cost">
                    <FormItem>
                        <FormLabel>Mashina xarajati {{ isCurrency?"$":"" }}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Mashina xarajati" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="other_cost">
                    <FormItem>
                        <FormLabel>Olgan naqd puli {{ isCurrency?"$":"" }}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Olgan naqd puli" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                
                <Input :model-value="`Jami Summasi: ${purchaseTotalPrice.toLocaleString('ru-RU')} so'm`" readonly class="col-span-2" />
                
                <!-- <div class="flex items-center gap-2 col-span-2">
                    <div class="flex items-center gap-2">
                        <Switch id="isCurrency" v-model:checked="isCurrency" />
                        <label for="isCurrency" class="cursor-pointer text-nowrap select-none">Valyuta kursi 1$-:</label>
                    </div>
                    <Input type="number" required min="0" step="any" :disabled="!isCurrency" v-model="currency" placeholder="Valyuta kursi" />
                </div> -->
                
                <div class="grid gap-2 col-span-2">
                    <FormField v-slot="{ componentField }" name="driver">
                        <FormItem>
                            <FormLabel>Haydovchi</FormLabel>
                            <FormControl>
                                <Input placeholder="Haydovchi" v-bind="componentField" />
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
                </div>

                <Button type="submit" class="col-span-2" :disabled="isSubmitting">Saqlash</Button>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import * as z from 'zod'
import { useStore } from '@/store'
import { useForm } from 'vee-validate'
import { Purchase } from '@/utils/types'
import { createToast } from '@/lib/toast'
import { computed, ref, watch } from 'vue'
import { Pen, Trash } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import { ALERT_MESSAGES } from '@/utils/constants'
import DataTable from '@/components/data-table.vue'
import { Textarea } from '@/components/ui/textarea'
import { PURCHASE_HEADERS } from '@/utils/constants'
import DatePicker from '@/components/data-picker.vue'
import { createPurchase, deletePurchase, updatePurchase } from '@/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormItem, FormMessage, FormLabel, FormControl } from '@/components/ui/form'

const emits = defineEmits(['deleted', 'created', 'updated', 'closed'])
const { clientId, totalPurchase, purchases, loading } = defineProps<{ clientId: number, totalPurchase: Purchase|null, purchases: Purchase[], loading: boolean }>()

const store = useStore()

const currency = ref(1)
const isCurrency = ref(false)
const purchaseDialog = ref(false)
const itemId = ref<number|null>(null)

const purchaseformSchema = toTypedSchema(z.object({
    client_id: z.number().default(clientId),
    car_cost: z.coerce.number({ invalid_type_error: "Mashina xarajati 0 dan katta bo'lishi shart" }),
    // .min(0, { message: "Mashina xarajati 0 dan katta bo'lishi shart" }).default(0),
    other_cost: z.coerce.number({ invalid_type_error: "Olgan naqd puli 0 dan katta bo'lishi shart" }),
    // .min(0, { message: "Olgan naqd puli 0 dan katta bo'lishi shart" }).default(0),

    sack_num: z.coerce.number({ invalid_type_error: "Qop soni 0 dan katta bo'lishi shart" }),
    // .min(0, { message: "Qop soni 0 dan katta bo'lishi shart" }),
    sack_price: z.coerce.number({ invalid_type_error: "Qop narxi 0 dan katta bo'lishi shart" }),
    // .min(0, { message: "Qop narxi 0 dan katta bo'lishi shart" }).default(0),

    scatter_num: z.coerce.number({ invalid_type_error: "Sochma 0 dan katta bo'lishi shart" }),
    // .min(0, { message: "Sochma 0 dan katta bo'lishi shart" }).default(0),
    scatter_price: z.coerce.number({ invalid_type_error: "Sochma narxi 0 dan katta bo'lishi shart" }),
    // .min(0, { message: "Sochma narxi 0 dan katta bo'lishi shart" }).default(0),
    date: z.date({ invalid_type_error: "Sana kiritilish shart",
    required_error: "Sana kiritilish shart" }).default(new Date()),
    driver: z.string().optional(),
    comment: z.string().optional(),
}))

const { handleSubmit, isSubmitting, values, setFieldValue, resetForm } = useForm({
    validationSchema: purchaseformSchema,
    initialValues: {
        driver: "",
        comment: "",
        car_cost: 0,
        sack_num: 0,
        other_cost: 0,
        sack_price: 0,
        scatter_num: 0,
        scatter_price: 0,
        date: new Date(),
        client_id: clientId,
    }
})

const purchaseSumPrice = computed(() => {
    const value = (values.sack_num||0) * (values.sack_price||0) +
    (values.scatter_price||0) * (values.scatter_num||0)

    return isCurrency.value ? value * currency.value : value
})

const purchaseTotalPrice = computed(() => {
    const value = (values.car_cost||0) + (values.other_cost||0)

    return +purchaseSumPrice.value + (isCurrency.value ? value * currency.value : value)
})

const editItem = (item: Purchase) => {
    itemId.value = item.id
    purchaseDialog.value = true

    setFieldValue('driver', item.driver)
    setFieldValue('comment', item.comment)
    setFieldValue('date', new Date(item.date))
    setFieldValue('client_id', item.client_id)
    setFieldValue('sack_num', item.sack_num||0)
    setFieldValue('car_cost', item.car_cost||0)
    setFieldValue('other_cost', item.other_cost||0)
    setFieldValue('sack_price', item.sack_price||0)
    setFieldValue('scatter_num', item.scatter_num||0)
    setFieldValue('scatter_price', item.scatter_price||0)
}

const handleSave = handleSubmit(async (values) => {
    try {
        const body = {
            ...values,
            sum_price: purchaseSumPrice.value,
            total_price: purchaseTotalPrice.value,
        }
        if(itemId.value) await update(itemId.value, body)
        else await create(body)

        closeDialog()
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, 'WARNING')
        console.log(error)
    }
})

const create = async (body: Partial<typeof values>) => {
    const data = await createPurchase(body)

    createToast(ALERT_MESSAGES.DATA_UPDATED, "SUCCESS")
    emits('created', data)
}

const update = async (id: number, body: Partial<typeof values>) => {
    const index = purchases.findIndex(p => p.id === id)
    const data = await updatePurchase(id, body, purchases[index]?.total_price||0)
    createToast(ALERT_MESSAGES.DATA_CREATED, "SUCCESS")
    emits('updated', body, Object.assign({}, purchases[index]), data, index)
}

const handleDeletePurchase = async (id: number, index: number) => {
    try {
        if(!confirm("Ushbu sotuv o'chirmoqchimisiz?")) return
    
        const balance = await deletePurchase(id, purchases[index].total_price, clientId)
        createToast(ALERT_MESSAGES.DATA_DELETED, "SUCCESS")
        emits('deleted', purchases[index], balance, index)
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, "WARNING")
    }
}

const closeDialog = () => {
    itemId.value = null
    purchaseDialog.value = false
}

watch(purchaseDialog, (isOpen) => {
  if (isOpen && !itemId.value) {
    resetForm();
  }
});
</script>