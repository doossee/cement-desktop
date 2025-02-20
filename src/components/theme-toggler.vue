<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button size="icon">
          <div className="flex justify-center items-center">
            <Sun v-show="mode == 'light'" className="h-[1.2rem] w-[1.2rem] block dark:hidden" />
            <Moon v-show="mode == 'dark'" className="h-[1.2rem] w-[1.2rem] hidden dark:block" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @click="mode = 'light'">
          Yorug'
        </DropdownMenuItem>
        <DropdownMenuItem @click="mode = 'dark'">
          Qorong'u
        </DropdownMenuItem>
        <DropdownMenuItem @click="mode = 'auto'">
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const mode = useColorMode()
</script>