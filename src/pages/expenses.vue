<template>
    <Card class="shadow-none">
        <CardContent class="p-2">
            <div class="flex flex-col md:flex-row items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <Button @click="$router.push('/')" class="shadow-none" size="icon">
                        <ArrowLeft />
                    </Button>
                    <DateRangePicker v-model="dateFilter" @update:model-value="getItems" />
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button class="shadow-none" size="icon">
                                <CalendarClock />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
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
                    <Button :disabled="!client" @click="handleDownloadPdf" class="shadow-none" size="icon">
                        <Download />
                    </Button>
                </div>
                <div class="flex items-center gap-2 text-nowrap">
                    <h1>
                        Mijoz:
                        <span class="font-bold">{{ client?.name }}</span> 
                        |
                        <span class="font-bold">{{ client?.phone }}</span>
                    </h1>

                    <Popover>
                        <PopoverTrigger as-child>
                            <div class="py-1.5 px-3 rounded-md cursor-pointer" :class="((client?.balance||0) - (client?.initial_debt || 0))!>0?'bg-[#008040] hover:bg-[#009032]':(((client?.balance||0) - (client?.initial_debt || 0))<0?'bg-[#D93333] hover:bg-[#e94433]':'bg-white/10 hover:bg-white/20')">
                                Balansi:
                                {{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(((client?.balance||0) - (client?.initial_debt || 0))) }}
                                so'm
                            </div>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-0" align="end" v-if="!!client?.initial_debt">
                            <div class="flex items-center gap-2 px-3">
                                <p>Avvalgi qolgan qarzi:</p>
                                <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(client?.initial_debt||0) }} so'm</span>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </CardContent>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
        <div class="col-span-1 md:col-span-2 h-min">
            <Purchases
                :loading="loading"
                :clientId="clientId"
                :purchases="purchases"
                :total-purchase="totalPurchase"

                @created="createPurchase"
                @updated="updatePurchase"
                @deleted="deletePurchase" />
        </div>

        <div class="col-span-1 h-min">
            <Incomes
                :loading="loading"
                :incomes="incomes"
                :client-id="clientId"
                :total-income="totalIncome"

                @created="createIncome"
                @deleted="deleteIncome"
                @updated="updateIncome" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { getExpenses } from '@/api'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Incomes from '@/components/incomes.vue'
import { Button } from '@/components/ui/button'
import Purchases from '@/components/purchases.vue'
import { Purchase, Income, Client } from '@/utils/types'
import { generateClientPDF } from '@/utils/generate-pdf'
import { Card, CardContent } from '@/components/ui/card'
import DateRangePicker from '@/components/date-range-picker.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Download, CalendarClock, Calendar, CalendarFold, CalendarDays, CalendarRange, ArrowLeft } from 'lucide-vue-next'

const router = useRoute()

const loading = ref(false)
const incomes = ref<Income[]>([])
const purchases = ref<Purchase[]>([])
const client = ref<Client|null>(null)
const clientId = Number(router.params.id)
const totalIncome = ref<Income|null>(null)
const totalPurchase = ref<Purchase|null>(null)

const dateFilter = ref({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
})

const handleDownloadPdf = () => {
    if(confirm('Fayl mijozning telegramiga junatilsinmi?')) {
        generateClientPDF(client.value!,
            totalPurchase.value ? [...purchases.value, totalPurchase.value] : purchases.value,
            totalIncome.value ? [...incomes.value, totalIncome.value] : incomes.value,
        dateFilter.value.start, dateFilter.value.end, true)
        
        let phone = String(client.value?.phone)
        phone = phone.replace(/\D/g, "");
    
        const telegramUrl = `tg://resolve?phone=${phone}`;
        // console.log(telegramUrl);
        window.open(telegramUrl, "_blank");
    } else {
        generateClientPDF(client.value!,
            totalPurchase.value ? [...purchases.value, totalPurchase.value] : purchases.value,
            totalIncome.value ? [...incomes.value, totalIncome.value] : incomes.value,
        dateFilter.value.start, dateFilter.value.end)
    }
}


const createIncome = (data: Income) => {
    incomes.value.push(data)
    const v = data.currency ? data.currency * data.amount : data.amount
    client.value!.balance += v
    
    if(totalIncome.value) {
        totalIncome.value.amount += v
    }
}

const updateIncome = (data: Income, item: Income, balance: number, index: number) => {
    if(totalIncome.value) {
        const newValue = data.currency ? data.currency * data.amount : data.amount
        const oldValue = item.currency ? item.currency * item.amount : item.amount
        totalIncome.value.amount += (newValue - oldValue)
    }
    
    Object.assign(incomes.value[index], data)

    if(!client.value) return
    client.value.balance = balance
}

const deleteIncome = (last_balance: number, balance: number, index: number) => {
    if(totalIncome.value) {
        totalIncome.value.amount -= last_balance
    }

    incomes.value.splice(index, 1)

    if(!client.value) return
    client.value.balance = balance
}


const createPurchase = (data: Purchase) => {
    purchases.value.push(data)
    client.value!.balance -= data.total_price
    
    if(totalPurchase.value) {
        if(typeof totalPurchase.value?.car_cost == 'number') totalPurchase.value.car_cost += (data.car_cost || 0)
        if(typeof totalPurchase.value?.other_cost == 'number') totalPurchase.value.other_cost += (data.other_cost || 0)
        if(typeof totalPurchase.value?.sack_num == 'number') totalPurchase.value.sack_num += (data.sack_num || 0)
        if(typeof totalPurchase.value?.sack_price == 'number') totalPurchase.value.sack_price += (data.sack_price || 0)
        if(typeof totalPurchase.value?.scatter_num == 'number') totalPurchase.value.scatter_num += (data.scatter_num || 0)
        if(typeof totalPurchase.value?.scatter_price == 'number') totalPurchase.value.scatter_price += (data.scatter_price || 0)
        if(typeof totalPurchase.value?.sum_price == 'number') totalPurchase.value.sum_price += (data.sum_price || 0)
        if(typeof totalPurchase.value?.total_price == 'number') totalPurchase.value.total_price += (data.total_price || 0)
    }
}

const updatePurchase = (data: Purchase, item: Purchase, balance: number, index: number) => {
    if(totalPurchase.value) {
        if(typeof totalPurchase.value?.car_cost == 'number') totalPurchase.value.car_cost += ((data.car_cost||0) - (item.car_cost||0))
        if(typeof totalPurchase.value?.other_cost == 'number') totalPurchase.value.other_cost += ((data.other_cost||0) - (item.other_cost||0))
        if(typeof totalPurchase.value?.sack_num == 'number') totalPurchase.value.sack_num += ((data.sack_num||0) - (item.sack_num||0))
        if(typeof totalPurchase.value?.sack_price == 'number') totalPurchase.value.sack_price += ((data.sack_price||0) - (item.sack_price||0))
        if(typeof totalPurchase.value?.scatter_num == 'number') totalPurchase.value.scatter_num += ((data.scatter_num||0) - (item.scatter_num||0))
        if(typeof totalPurchase.value?.scatter_price == 'number') totalPurchase.value.scatter_price += ((data.scatter_price||0) - (item.scatter_price||0))
        if(typeof totalPurchase.value?.sum_price == 'number') totalPurchase.value.sum_price += ((data.sum_price||0) - (item.sum_price||0))
        if(typeof totalPurchase.value?.total_price == 'number') totalPurchase.value.total_price += ((data.total_price||0) - (item.total_price||0))
    }

    Object.assign(purchases.value[index], data)

    if(!client.value) return
    client.value.balance = balance
}

const deletePurchase = (data: Purchase, balance: number, index: number) => {
    if(totalPurchase.value) {
        if(typeof totalPurchase.value?.car_cost == 'number') totalPurchase.value.car_cost -= (data.car_cost||0)
        if(typeof totalPurchase.value?.other_cost == 'number') totalPurchase.value.other_cost -= (data.other_cost||0)
        if(typeof totalPurchase.value?.sack_num == 'number') totalPurchase.value.sack_num -= (data.sack_num||0)
        if(typeof totalPurchase.value?.sack_price == 'number') totalPurchase.value.sack_price -= (data.sack_price||0)
        if(typeof totalPurchase.value?.scatter_num == 'number') totalPurchase.value.scatter_num -= (data.scatter_num||0)
        if(typeof totalPurchase.value?.scatter_price == 'number') totalPurchase.value.scatter_price -= (data.scatter_price||0)
        if(typeof totalPurchase.value?.sum_price == 'number') totalPurchase.value.sum_price -= (data.sum_price||0)
        if(typeof totalPurchase.value?.total_price == 'number') totalPurchase.value.total_price -= (data.total_price||0)
    }

    purchases.value.splice(index, 1)

    if(!client.value) return
    client.value.balance = balance
}

const getItems = async (dates: any) => {
    try {
        loading.value = true
        const data = await getExpenses({ client_id: clientId, ...dates })
        client.value = data.client
        incomes.value = data.incomes
        purchases.value = data.purchases
        console.log(data);
        

        if(data.totalIncomes) totalIncome.value = {
            date: null,
            method: null,
            currency: null,
            amount: data.incomes.length === 0 ? 0 : data.totalIncomes.amount,
        } as any

        if(data.totalPurchase) {
            if(data.purchases.length === 0) {
                const obj = {}
                Object.keys(data.totalPurchase).map(k => {
                    Object.assign(obj, { [k]: 0 })
                })
                totalPurchase.value = obj as any
            } else {
                totalPurchase.value = data.totalPurchase
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        loading.value = false
    }
}

const getReportPeriod = async (type: "15_days" | "1_month" | "6_months" | "1_year") => {
    const end = new Date();
    let start = new Date();

    switch (type) {
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

    dateFilter.value = { start, end };
    await getItems({ start, end })
}

onMounted(() => {
    getItems(dateFilter.value)
})
</script>