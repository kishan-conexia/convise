<template>
  <footer class="relative bg-gray-900 text-white overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900"/>
    <div class="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"/>
    
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Company Info -->
        <div class="md:col-span-2">
          <div class="flex items-center mb-4">
            <div class="relative">
              <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg blur-sm opacity-75"/>
              <UIcon name="i-heroicons-building-office" class="relative h-8 w-8 text-white bg-gradient-to-r from-emerald-500 to-blue-600 p-1.5 rounded-lg" />
            </div>
            <span class="ml-3 text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Convise
            </span>
          </div>
          <p class="text-gray-400 text-lg leading-relaxed max-w-md">
            Empowering organizations with intelligent HR management solutions for the modern workplace.
          </p>
          
          <!-- Social Links -->
          <div class="flex space-x-4 mt-6">
            <UButton variant="ghost" size="sm" square class="text-gray-400 hover:text-white hover:bg-gray-800">
              <UIcon name="i-heroicons-globe-alt" />
            </UButton>
            <UButton variant="ghost" size="sm" square class="text-gray-400 hover:text-white hover:bg-gray-800">
              <UIcon name="i-heroicons-envelope" />
            </UButton>
            <UButton variant="ghost" size="sm" square class="text-gray-400 hover:text-white hover:bg-gray-800">
              <UIcon name="i-heroicons-phone" />
            </UButton>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div>
          <h3 class="font-semibold text-white mb-4">Product</h3>
          <ul class="space-y-3">
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Features</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Pricing</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Security</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Integrations</a></li>
          </ul>
        </div>
        
        <!-- Support -->
        <div>
          <h3 class="font-semibold text-white mb-4">Support</h3>
          <ul class="space-y-3">
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Help Center</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Documentation</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Contact Us</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Status</a></li>
          </ul>
        </div>
      </div>
      
      <!-- Bottom Section -->
      <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
        <p class="text-gray-400 text-sm">
          &copy; 2025 Convise. All rights reserved.
        </p>
        <div class="flex space-x-6 mt-4 md:mt-0">
          <a href="#" class="text-gray-400 hover:text-white text-sm transition-colors duration-200">Privacy Policy</a>
          <a href="#" class="text-gray-400 hover:text-white text-sm transition-colors duration-200">Terms of Service</a>
          <a href="#" class="text-gray-400 hover:text-white text-sm transition-colors duration-200">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
</template>
