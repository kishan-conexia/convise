<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg blur-sm opacity-75"/>
            <UIcon name="i-heroicons-building-office" class="relative h-8 w-8 text-white bg-gradient-to-r from-emerald-500 to-blue-600 p-1.5 rounded-lg" />
          </div>
          <h1 class="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Convise
          </h1>
        </div>
        
        <nav class="hidden md:flex items-center space-x-8">
          <a href="#features" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">Features</a>
          <a href="#pricing" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">Pricing</a>
          <a href="#about" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">About</a>
        </nav>
        
        <div class="flex items-center space-x-4">
          <UButton 
            v-if="!user" 
            variant="ghost" 
            class="hidden sm:inline-flex"
            @click="$router.push('/auth/login')"
          >
            Sign In
          </UButton>
          <UButton 
            v-if="!user"
            class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300" 
            @click="$router.push('/auth/login')"
          >
            Get Started
          </UButton>
          <UButton 
            v-else 
            class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0" 
            @click="$router.push('/dashboard')"
          >
            Dashboard
          </UButton>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
const user = useSupabaseUser()
</script>
