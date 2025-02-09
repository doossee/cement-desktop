<template>
    <div :class="cn('grid gap-2', $attrs.class ?? '')">
        <Popover>
            <PopoverTrigger as-child>
                <Button :disabled="disabled" id="date" :class="cn('w-[280px] justify-start text-left font-normal', !model && 'text-muted-foreground', btnClass||'')">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    <span>
                        {{ model.start ? (model.end ?
                            `${format(model.start, 'LLL dd, y')} - ${format(model.end, 'LLL dd, y')}`
                            : format(model.start, 'LLL dd, y')) : 'Sanani belgilang' }}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
                <Calendar v-model.range="model" :columns="1" />
            </PopoverContent>
        </Popover>
    </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/v-calendar'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

defineProps<{
    disabled?: boolean
    btnClass?: string
}>()

const model = defineModel<{
    start: Date
    end: Date
}>({
    default: {
        start: new Date(),
        end: new Date()
    }
})
</script>