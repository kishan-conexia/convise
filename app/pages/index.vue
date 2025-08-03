<template>
  <div class="min-h-screen">
    <!-- Navigation -->
    <AppHeader />
    
    <!-- Hero Section with Reduced Height -->
    <section class="relative min-h-[80vh] flex items-center overflow-hidden pt-16">
      <!-- Animated Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100"/>
      <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:75px_75px]"/>
      
      <!-- Floating Elements - Reduced Size and Positioning -->
      <div class="absolute top-16 left-10 w-48 h-48 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"/>
      <div class="absolute top-32 right-10 w-56 h-56 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-2000"/>
      <div class="absolute top-48 left-1/3 w-52 h-52 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-4000"/>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Hero Content -->
        <div class="mb-8">
          <div class="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 text-sm text-gray-600 mb-8 hover:bg-white/90 transition-all duration-300">
            <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"/>
            New: Advanced HR automation now available
          </div>
          
          <h1 class="text-5xl md:text-7xl font-extrabold mb-8">
            <span class="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Modern Workflow
            </span>
            <br>
            <span class="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          
          <p class="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Transform your organization with intelligent workflow automation. 
            <span class="font-semibold text-gray-800">Streamline attendance, leaves, payroll,</span> 
            and more with our cutting-edge platform.
          </p>
        </div>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <UButton 
            size="xl" 
            class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0 shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 px-8 py-4" 
            @click="$router.push('/auth/login')"
          >
            <UIcon name="i-heroicons-rocket-launch" class="mr-2" />
            Start Free Trial
          </UButton>
          <UButton 
            variant="outline" 
            size="xl"
            class="border-2 border-gray-300 hover:border-gray-400 bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all duration-300 px-8 py-4"
          >
            <UIcon name="i-heroicons-play-circle" class="mr-2" />
            Watch Demo
          </UButton>
        </div>
        
        <!-- Trust Indicators - Updated with Specific Clients -->
        <div class="flex flex-col items-center gap-4 opacity-70">
          <div class="text-sm text-gray-600 font-medium">Currently serving leading organizations</div>
          <div class="flex flex-wrap justify-center items-center gap-8">
            <div class="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-200/50">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">MNR</span>
              </div>
              <span class="text-gray-700 font-semibold">MNR Telecom</span>
            </div>
            <div class="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-200/50">
              <div class="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">CW</span>
              </div>
              <span class="text-gray-700 font-semibold">Conexiaworld</span>
            </div>
          </div>
          <div class="text-xs text-gray-500">Growing startup, expanding our client base</div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
<section id="features" class="py-24 bg-white relative">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="text-center mb-20">
      <div class="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-4">
        ✨ Why Choose Convise
      </div>
      <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Built for the 
        <span class="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
          Modern Workplace
        </span>
      </h2>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Enterprise-grade security meets intuitive design in our comprehensive HR platform
      </p>
    </div>
    
    <!-- Feature Cards with Equal Heights -->
    <div class="grid md:grid-cols-3 gap-8">
      <div class="group relative h-full">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
        <UCard class="relative bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-8 flex flex-col h-full">
          <div class="text-center flex flex-col flex-grow">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl mb-6 mx-auto">
              <UIcon name="i-heroicons-cloud" class="h-8 w-8 text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Cloud-First Architecture</h3>
            <p class="text-gray-600 leading-relaxed flex-grow">
              Real-time data synchronization with enterprise-grade security. 
              Access your HR data anywhere, anytime, on any device with complete reliability.
            </p>
          </div>
        </UCard>
      </div>

      <div class="group relative h-full">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
        <UCard class="relative bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-8 flex flex-col h-full">
          <div class="text-center flex flex-col flex-grow">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-6 mx-auto">
              <UIcon name="i-heroicons-chart-bar-square" class="h-8 w-8 text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Smart Analytics</h3>
            <p class="text-gray-600 leading-relaxed flex-grow">
              Comprehensive reporting and intelligent insights. Make data-driven 
              decisions with advanced analytics dashboards and automated reports.
            </p>
          </div>
        </UCard>
      </div>

      <div class="group relative h-full">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
        <UCard class="relative bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-8 flex flex-col h-full">
          <div class="text-center flex flex-col flex-grow">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mb-6 mx-auto">
              <UIcon name="i-heroicons-device-phone-mobile" class="h-8 w-8 text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Mobile-First Design</h3>
            <p class="text-gray-600 leading-relaxed flex-grow">
              Responsive design that works flawlessly across all devices. 
              Native mobile experience with intuitive navigation and seamless performance.
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</section>


    <!-- CTA Section -->
    <section class="relative py-24 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-700"/>
      <div class="absolute inset-0 bg-black/20"/>
      <div class="absolute inset-0 bg-grid-white/[0.1] bg-[size:60px_60px]"/>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Transform Your HR?
        </h2>
        <p class="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
          Join MNR Telecom and Conexiaworld who trust Convise for their HR management needs. 
          Be part of our growing family of satisfied clients.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-6 justify-center">
          <UButton 
            size="xl" 
            class="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-2xl hover:scale-105 transition-all duration-300 px-8 py-4" 
            @click="$router.push('/auth/login')"
          >
            <UIcon name="i-heroicons-rocket-launch" class="mr-2" />
            Start Free Trial
          </UButton>
          <UButton 
            variant="outline" 
            size="xl"
            class="border-2 border-white text-white hover:bg-white hover:text-gray-900 hover:scale-105 transition-all duration-300 px-8 py-4"
          >
            <UIcon name="i-heroicons-phone" class="mr-2" />
            Schedule Demo
          </UButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '~/components/AppHeader.vue';


// Meta tags for SEO
useHead({
  title: 'Convise - Modern HR Management Platform',
  meta: [
    { name: 'description', content: 'Transform your organization with intelligent HR management. Streamline attendance, leaves, payroll, and more with our cutting-edge platform.' }
  ]
})
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}

.bg-grid-white {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}
</style>
