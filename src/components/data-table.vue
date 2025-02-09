<template>
    <Card class="shadow-none rounded-lg">
        <CardHeader v-if="!hideTop" class='p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2'>
            <Input v-if="!hideSearch" @update:model-value="searchItems($event.toString())" placeholder="Qidirish" />
            <slot name="extraTop" :handleFetch="handleFetching" />
        </CardHeader>
        <CardContent class="p-2">
            <div class="overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead v-for="header,i in headers" :key="i" :class="cn('text-nowrap px-2', header.class||'')">
                                <Button v-if="header.sorting" @click="setSorting(header.key as string)" variant="ghost" size="sm" class="px-2 !py-0 text-sm"
                                    :class="(sorting[header.key!]==='asc'||sorting[header.key!]==='desc')?'text-primary':''">
                                    {{ header.title }}
                                    <MoveUp v-show="sorting[header.key!] === 'asc'" />
                                    <MoveDown v-show="sorting[header.key!] === 'desc'" />
                                </Button>
                                <span v-else>{{ header.title }}</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-if="(items.length == 0 && !loading) || loading">
                            <TableCell :colSpan="headers.length" class="text-center text-gray-300 py-2">
                                <span v-show="items.length == 0 && !loading">Ma'lumotlar mavjud emas</span>
                                <span v-show="loading">Yuklanmoqda...</span>
                            </TableCell>
                        </TableRow>
                        <TableRow v-for="item,i in _items" :key="i" @click="emits('rowClick', item, i)" :class="cn('hover:bg-gray-100/5', trClass||'')">
                            <TableCell v-for="header,j in headers" :key="j" class="p-2" :class="header.sorting?'!px-4':''">
                                <slot v-if="$slots[`item.${header.key.toString()}`]" :item="item" :index="i" :name="`item.${header.key.toString()}`" />
                                <span v-else>{{ (item as any)[header.key] }}</span>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter v-if="!hideBottom" class='p-2 flex justify-between items-center gap-2 w-full'>
            <Select @update:model-value="setPagination('perPage', +$event)" :model-value="String(limit)">
                <SelectTrigger class="w-[100px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>

            <div class='flex items-center gap-2'>
                <Button :disabled="page===1" size="sm" @click="() => setPagination('prevPage', 1)">
                    <ArrowLeft />
                </Button>
                <div>{{ page }}/{{ totalPages }}</div>
                <Button :disabled="page===totalPages || count===0" size="sm" @click="() => setPagination('nextPage', 1)">
                    <ArrowRight />
                </Button>
            </div>
        </CardFooter>
    </Card>
</template>

<script setup lang="ts" generic="T">
import { cn } from '@/lib/utils'
import debounce from 'lodash/debounce'
import { ref, computed, reactive } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { type DataTableProps } from '@/utils/types'
import { ArrowLeft, ArrowRight, MoveUp, MoveDown } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const emits = defineEmits(['fetching','searched','rowClick'])
const { count, headers, hideBottom, hideSearch, items, loading, clientSide, trClass, hideTop } = defineProps<DataTableProps<T>>()

const page = ref(1)
const limit = ref(20)
const search = ref('')
const sorting: any = reactive({})
const _items = computed(() => {
    if(clientSide) {
        const sort = Object.entries(sorting)

        if (sort.length === 0) return items;

        const [key, order] = sort[0]
        if(key && order) {
            return [...items].sort((a, b) => {
                if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
                if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            return items
        }
    } else {
        return items
    }
})

const totalPages = computed(() => Math.ceil(count / limit.value))
const queryfilter = computed(() => {
    const qry: any = {}

    if(page.value) qry.page = page.value
    if(limit.value) qry.limit = limit.value
    if(search.value?.trim()) qry.search = search.value

    return { ...qry, sorting }
})

const setSorting = debounce((key: string) => {
    if (sorting[key] === 'asc') sorting[key] = 'desc'
    else if (sorting[key] === 'desc') delete sorting[key]
    else if(Object.keys(sorting).length == 1) {
        Object.keys(sorting).map(d => delete sorting[d])
        setSorting(key)
    }
    else sorting[key] = 'asc'

    if(!clientSide) {
        handleFetching()
    }
}, clientSide ? 10 : 500 )

const searchItems = debounce((text: string) => {
    emits('searched', text)
    search.value = text
    page.value = 1
    handleFetching()
}, 500)

const setPagination = debounce((type: 'nextPage' | 'prevPage' | 'perPage', value: number) => {
    if(type === 'nextPage')
        page.value += value
    else if (type === 'prevPage')
        page.value -= value
    else if(type === 'perPage')
        limit.value = value

    handleFetching()
})

const handleFetching = (cq?: any) => emits('fetching', cq?{...queryfilter.value,...cq}:queryfilter.value)

handleFetching()
</script>