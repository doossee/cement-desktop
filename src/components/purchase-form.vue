<template>
    <Dialog :open="dialog" @update:open="closeDialog">
        <DialogContent class="max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Sotuv kiritish</DialogTitle>
            </DialogHeader>

            <form @submit="handleCreatePurchase" class="grid grid-cols-2 gap-3">
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
                        <FormLabel>Sochma narxi {{ isCurrency?"$":"so'm" }}</FormLabel>
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
                
                <Button type="submit" class="col-span-2" :disabled="isSubmitting">Saqlash</Button>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import * as z from 'zod'
import { computed, ref } from 'vue'
import { useForm } from 'vee-validate'
import { createToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
// import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { createPurchase } from '@/api/expenses'
import { toTypedSchema } from '@vee-validate/zod'
import { ALERT_MESSAGES } from '@/utils/constants'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormItem, FormMessage, FormLabel, FormControl } from '@/components/ui/form'

const emits = defineEmits(['submited', 'closed'])
const { clientId, dialog } = defineProps<{ clientId: number, dialog: boolean }>()

const currency = ref(1)
const isCurrency = ref(false)

const purchaseformSchema = toTypedSchema(z.object({
    client_id: z.number().default(clientId),
    car_cost: z.coerce.number({ invalid_type_error: "Mashina xarajati 0 dan katta bo'lishi shart" })
    .min(0, { message: "Mashina xarajati 0 dan katta bo'lishi shart" }).default(0),
    other_cost: z.coerce.number({ invalid_type_error: "Olgan naqd puli 0 dan katta bo'lishi shart" })
    .min(0, { message: "Olgan naqd puli 0 dan katta bo'lishi shart" }).default(0),

    sack_num: z.coerce.number({ invalid_type_error: "Qop soni 0 dan katta bo'lishi shart" })
    .min(0, { message: "Qop soni 0 dan katta bo'lishi shart" }),
    sack_price: z.coerce.number({ invalid_type_error: "Qop narxi 0 dan katta bo'lishi shart" })
    .min(0, { message: "Qop narxi 0 dan katta bo'lishi shart" }).default(0),

    scatter_num: z.coerce.number({ invalid_type_error: "Sochma 0 dan katta bo'lishi shart" })
    .min(0, { message: "Sochma 0 dan katta bo'lishi shart" }).default(0),
    scatter_price: z.coerce.number({ invalid_type_error: "Sochma narxi 0 dan katta bo'lishi shart" })
    .min(0, { message: "Sochma narxi 0 dan katta bo'lishi shart" }).default(0),
}))

const { handleSubmit, isSubmitting, values, setFieldValue } = useForm({
    validationSchema: purchaseformSchema,
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

const handleCreatePurchase = handleSubmit(async (values) => {
    try {
        const body = {
            ...values,
            sum_price: purchaseSumPrice.value,
            total_price: purchaseTotalPrice.value,
        }
        // if(isCurrency.value) Object.assign(body, { currency: currency.value })
        const data = await createPurchase(body)
        createToast(ALERT_MESSAGES.DATA_CREATED, 'SUCCESS')
        emits('submited', data)
        closeDialog()
    } catch (error) {
        createToast(ALERT_MESSAGES.OPERATION_FAILED, 'WARNING')
        console.log(error)
    }
})

const closeDialog = () => {
    emits('closed')
    setFieldValue('car_cost', 0)
    setFieldValue('sack_num', 0)
    setFieldValue('other_cost', 0)
    setFieldValue('sack_price', 0)
    setFieldValue('scatter_num', 0)
    setFieldValue('scatter_price', 0)
}
</script>