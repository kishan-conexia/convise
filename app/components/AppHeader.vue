<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/20"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center">
          <div class="relative">
            <div
              class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg blur-sm opacity-75"
            />
            <UIcon
              name="i-heroicons-building-office"
              class="relative h-8 w-8 text-white bg-gradient-to-r from-emerald-500 to-blue-600 p-1.5 rounded-lg"
            />
          </div>
          <h1
            class="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            Convise
          </h1>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Improved Sign In Button with Light Background -->
          <!-- Branded Sign In Button -->
          <UButton
            v-if="!user"
            variant="soft"
            color="emerald"
            size="sm"
            class="hidden sm:inline-flex bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/60 text-emerald-700 hover:text-emerald-800 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md"
            @click="$router.push('/auth/login')"
          >
            <UIcon
              name="i-heroicons-arrow-right-on-rectangle"
              class="mr-2 h-4 w-4"
            />
            Sign In
          </UButton>

          <!-- Get Started Button -->
          <UButton
            v-if="!user"
            size="sm"
            class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-white font-medium"
            @click="$router.push('/auth/login')"
          >
            <UIcon name="i-heroicons-rocket-launch" class="mr-2 h-4 w-4" />
            Get Started
          </UButton>

          <!-- Dashboard Button (when user is logged in) -->
          <UButton
            v-else
            size="sm"
            class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0 text-white font-medium"
            @click="$router.push('/dashboard')"
          >
            <UIcon name="i-heroicons-squares-2x2" class="mr-2 h-4 w-4" />
            Dashboard
          </UButton>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
const user = useSupabaseUser();
</script>
