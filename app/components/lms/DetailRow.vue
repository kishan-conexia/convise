<template>
  <div :class="className">
    <dt class="text-xs font-medium text-gray-600 mb-1">{{ label }}</dt>
    <dd class="text-sm text-gray-900 break-words">
      <a
        v-if="isPhone && value"
        :href="`tel:${value}`"
        class="text-blue-600 hover:text-blue-800 hover:underline flex items-center font-medium"
      >
        <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5 mr-1" />
        {{ value }}
      </a>
      <span v-else>{{ value || '-' }}</span>
    </dd>
  </div>
</template>

<script setup lang="ts">
// ✅ No imports needed!

defineProps<{
  label: string
  value: string | number | undefined
  className?: string
  isPhone?: boolean
}>()
</script>
