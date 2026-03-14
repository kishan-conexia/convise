<template>
  <div :class="className">
    <dt class="text-xs font-medium text-gray-600 mb-1">{{ label }}</dt>
    <dd class="text-sm text-gray-900 break-words">{{ value || '-' }}</dd>
  </div>
</template>

<script setup lang="ts">
// ✅ No imports needed!

defineProps<{
  label: string
  value: string | number | undefined
  className?: string
}>()
</script>
