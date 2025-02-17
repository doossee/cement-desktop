<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline" :class="cn('ps-3 text-start font-normal w-full',!model && 'text-muted-foreground',)">
                <span>{{ model ? df.format(model) : "Sanani belgilang" }}</span>
                <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
            </Button>
            <input hidden>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
            <Calendar
                placeholder="Sanani belgilang"
                v-model="model"
                calendar-label="Sanani belgilang"
                initial-focus
                :min-value="new CalendarDate(1900, 1, 1)"
                :max-value="today(getLocalTimeZone())"
            />
        </PopoverContent>
    </Popover>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/v-calendar'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarDate, getLocalTimeZone, today, DateFormatter } from '@internationalized/date'

const model = defineModel<Date>({default: new Date()})
const df = new DateFormatter('ru-RU', { dateStyle: 'long' })
</script>