<template>
    <Dialog :open="dialog" @update:open="closeDialog">
        <DialogContent class="max-w-[450px]">
            <DialogHeader>
                <DialogTitle>To'lov kiritish</DialogTitle>
            </DialogHeader>

            <form @submit="handleCreateIncome" class="grid gap-y-2">
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
        
                <Button type="submit" :disabled="isSubmitting">Saqlash</Button>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import * as z from 'zod'
import { computed, ref } from 'vue'
import { useForm } from 'vee-validate'
import { createToast } from '@/lib/toast'
import { createIncome } from '@/api/expenses'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toTypedSchema } from '@vee-validate/zod'
import DatePicker from '@/components/data-picker.vue'
import { PAYMENT_METHODS, ALERT_MESSAGES } from '@/utils/constants'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormItem, FormMessage, FormLabel, FormControl } from '@/components/ui/form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emits = defineEmits(['submited', 'closed'])
const { clientId, dialog } = defineProps<{ clientId: number, dialog: boolean }>()

const currency = ref(1)
const isCurrency = ref(false)

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
    required_error: "Sana kiritilish shart" }).default(new Date())
}))

const { handleSubmit, isSubmitting, setFieldValue, values } = useForm({
    validationSchema: incomeformSchema,
    initialValues: {
        amount: 0,
        method: "CASH",
        date: new Date(),
        client_id: clientId,
    }
})

const handleCreateIncome = handleSubmit(async (body) => {
    try {
        if(isCurrency.value) Object.assign(body, { currency: currency.value })
        const data = await createIncome(body as any)
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
    setFieldValue('amount', 0)
    setFieldValue('method', 'CASH')
}
</script>