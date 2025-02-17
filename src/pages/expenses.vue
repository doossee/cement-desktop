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
                            <div class="py-1.5 px-3 rounded-md cursor-pointer" :class="client?.balance!>0?'bg-[#008040] hover:bg-[#009032]':(client?.balance!<0?'bg-[#D93333] hover:bg-[#e94433]':'bg-white/10 hover:bg-white/20')">
                                Balansi:
                                {{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(client?.balance||0) }}
                                so'm
                            </div>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-0" align="start">
                            <DataTable hideSearch hideBottom clientSide :items="annual_expenses" :loading="loading" :count="annual_expenses.length" :headers="ANNUAL_EXPENSES_HEADERS">
                                <template #extraTop>
                                    <div class="col-span-1 sm:col-span-4 flex justify-between items-center">
                                        <p class="p-2">Yillik qarzlar ro'yxati</p>
                                    </div>
                                </template>
                                <template #item.purchase="{item}">
                                    <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.purchase||0) }} so'm</span>
                                </template>
                                <template #item.total="{item}">
                                    <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.total||0) }} so'm</span>
                                </template>
                                <template #item.income="{item}">
                                    <span>{{ new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(item.income||0) }} so'm</span>
                                </template>
                            </DataTable>
                        </PopoverContent>
                    </Popover>

                </div>
            </div>
        </CardContent>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">

        <div class="col-span-1 md:col-span-2 h-min">
            <DataTable hideSearch hideBottom clientSide :items="purchases" :loading="loading" :count="purchases.length" :headers="PURCHASE_HEADERS">
                <template #extraTop>
                    <div class="col-span-1 sm:col-span-4 flex justify-between items-center">
                        <p class="p-2">Sotuvlar ro'yxati</p>
                        <!-- -->
                        <Button v-if="store.userData?.role === 'ADMIN'" @click="purchaseDialog=true" class="!bg-[#D93333] hover:!bg-[#aa3333]">Sotuv kiritish</Button>
                    </div>
                </template>
                <template #item.date="{item}">
                    <span>{{ new Intl.DateTimeFormat('ru-RU').format(new Date(item.date)) }}</span>
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
            </DataTable>
        </div>

        <div class="col-span-1 h-min">
            <DataTable hideSearch hideBottom clientSide :items="incomeFilters" :loading="loading" :count="incomes.length" :headers="INCOME_HEADERS">
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
                            <!-- -->
                            <Button v-if="store.userData?.role === 'ADMIN'" @click="incomeDialog=true" class="!bg-[#008040] hover:!bg-[#007040]">To'lov kiritish</Button>
                        </div>
                    </div>
                </template>
                <template #item.date="{ item }">
                    <span>{{ new Intl.DateTimeFormat('ru-RU').format(new Date(item.date)) }}</span>
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
                    <span class="text-nowrap px-2 py-1 rounded-md" :class="PAYMENT_METHOD_COLORS[item.method]">{{ PAYMENT_METHODS[item.method] }}</span>
                </template>
            </DataTable>
        </div>
    </div>

    <IncomeForm
        :clientId="clientId"
        :dialog="incomeDialog"
        @submited="createIncome"
        @closed="incomeDialog=false" />

    <PurchaseForm
        :clientId="clientId"
        :dialog="purchaseDialog"
        @submited="createPurchase"
        @closed="purchaseDialog=false" />
</template>

<script setup lang="ts">
import { useStore } from '@/store'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getExpenses } from '@/api/expenses'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/data-table.vue'
import IncomeForm from '@/components/income-form.vue'
import { generateClientPDF } from '@/utils/generate-pdf'
import { Card, CardContent } from '@/components/ui/card'
import PurchaseForm from '@/components/purchase-form.vue'
import DateRangePicker from '@/components/date-range-picker.vue'
import { Purchase, Income, Client, AnnualExpenses } from '@/utils/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PAYMENT_METHODS, PURCHASE_HEADERS, INCOME_HEADERS, PAYMENT_METHOD_COLORS, ANNUAL_EXPENSES_HEADERS } from '@/utils/constants'
import { Download, CalendarClock, Calendar, CalendarFold, CalendarDays, CalendarRange, ArrowLeft, ListFilter, Check } from 'lucide-vue-next'

const store = useStore()
const router = useRoute()

const loading = ref(false)
const methodFilter = ref("")
const client = ref<Client|null>(null)
const clientId = Number(router.params.id)
const annual_expenses = ref<AnnualExpenses[]>([])
const dateFilter = ref({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
})

const incomeDialog = ref(false)
const incomes = ref<Income[]>([])
const incomeFilters = computed<Income[]>(() => {
    if(methodFilter.value === "") return incomes.value
    else return incomes.value.filter(i => i.method === methodFilter.value)
})

const purchaseDialog = ref(false)
const purchases = ref<Purchase[]>([])

const handleDownloadPdf = () => {
    if(confirm('Fayl mijozning telegramiga junatilsinmi?')) {
        generateClientPDF(client.value!, purchases.value, incomes.value, annual_expenses.value, dateFilter.value.start, dateFilter.value.end, true)
        
        let phone = String(client.value?.phone)
        phone = phone.replace(/\D/g, "");
    
        const telegramUrl = `tg://resolve?phone=${phone}`;
        // console.log(telegramUrl);
        window.open(telegramUrl, "_blank");
    } else {
        generateClientPDF(client.value!, purchases.value, incomes.value, annual_expenses.value, dateFilter.value.start, dateFilter.value.end)
    }
}

const createIncome = (data: Income) => {
    incomes.value.push(data)
    const v = data.currency ? data.currency * data.amount : data.amount
    client.value!.balance += v

    const year = new Date(data.date).getFullYear()
    const index = annual_expenses.value.findIndex(a => a.year === year)

    console.log(year, index, data.date);
    
    if(index > -1) {
        console.log(annual_expenses.value[index]);
        annual_expenses.value[index].income += v
        annual_expenses.value[index].total += v
    } else {
        annual_expenses.value.push({
            year,
            total: v,
            income: v,
            purchase: 0,
            id: Date.now(),
            client_id: clientId,
        } as any)
    }
}

const createPurchase = (data: Purchase) => {
    purchases.value.push(data)
    client.value!.balance -= data.total_price

    const year = new Date(data.date).getFullYear()
    const index = annual_expenses.value.findIndex(a => a.year === year)

    console.log(year, index, data.date);
    if(index > -1) {
        console.log(annual_expenses.value[index]);
        annual_expenses.value[index].purchase -= data.total_price
        annual_expenses.value[index].total -= data.total_price
    } else {
        annual_expenses.value.push({
            year,
            total: -data.total_price,
            income: 0,
            purchase: data.total_price,
            id: Date.now(),
            client_id: clientId,
        } as any)
    }
}

const getItems = async (dates: any) => {
    try {
        loading.value = true
        const data = await getExpenses({ client_id: clientId, ...dates })
        client.value = data.client
        incomes.value = data.incomes
        purchases.value = data.purchases
        annual_expenses.value = data.annual_expenses
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

getItems(dateFilter.value)
</script>