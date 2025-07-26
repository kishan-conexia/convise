<!-- app/pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">
            Sign in to Convise
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Access your management dashboard
          </p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleLogin">
        <UFormGroup label="Email" name="email">
          <UInput 
            v-model="state.email" 
            type="email" 
            placeholder="Enter your email"
            icon="i-heroicons-envelope"
          />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <UInput 
            v-model="state.password" 
            type="password" 
            placeholder="Enter your password"
            icon="i-heroicons-lock-closed"
          />
        </UFormGroup>

        <UButton 
          type="submit" 
          :loading="loading" 
          block 
          size="lg"
          class="mt-6"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </UButton>
      </UForm>

      <template #footer>
        <div class="text-center">
          <UButton 
            variant="ghost" 
            color="gray" 
            @click="$router.push('/')"
          >
            ← Back to Home
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { z } from 'zod'

// Schema for form validation
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

// Form state
const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

const handleLogin = async () => {
  try {
    loading.value = true
    
    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    })

    if (error) {
      toast.add({
        title: 'Login Failed',
        description: error.message,
        color: 'red'
      })
    } else {
      toast.add({
        title: 'Success',
        description: 'Welcome back!',
        color: 'green'
      })
      await navigateTo('/dashboard')
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'An unexpected error occurred',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>
