<!-- app/pages/auth/callback.vue -->
<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-md">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin mx-auto mb-4 h-8 w-8" />
        <p>Processing your login...</p>
      </div>
    </UCard>
  </div>
</template>

<script setup>
// The @nuxtjs/supabase module handles the callback automatically
// This page just shows a loading state while processing
</script>
