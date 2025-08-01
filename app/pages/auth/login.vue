<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Modern Background -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100"
    />
    <div
      class="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-[size:75px_75px]"
    />

    <!-- Floating Background Elements -->
    <div
      class="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"
    />
    <div
      class="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"
    />
    <div
      class="absolute bottom-20 left-1/3 w-56 h-56 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"
    />

    <div
      class="relative flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="w-full max-w-md space-y-8">
        <!-- Header with Branding -->
        <div class="text-center">
          <div class="flex justify-center mb-6">
            <div class="relative">
              <div
                class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur-sm opacity-75"
              />
              <div
                class="relative bg-gradient-to-r from-emerald-500 to-blue-600 p-4 rounded-2xl"
              >
                <UIcon
                  name="i-heroicons-building-office"
                  class="h-12 w-12 text-white"
                />
              </div>
            </div>
          </div>

          <h1
            class="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2"
          >
            Welcome Back
          </h1>
          <p class="text-lg text-gray-600 mb-8">
            Sign in to your
            <span class="font-semibold text-emerald-600">Convise</span>
            dashboard
          </p>
        </div>

        <!-- Login Card -->
        <div class="relative">
          <!-- Card Glow Effect -->
          <div
            class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20"
          />

          <UCard
            class="relative bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-2xl overflow-hidden"
          >
            <!-- Card Header -->
            <template #header>
              <div class="px-6 py-6 border-b border-gray-100/50">
                <h2 class="text-2xl font-semibold text-gray-900 text-center">
                  Sign In
                </h2>
                <p class="text-sm text-gray-600 text-center mt-2">
                  Enter your credentials to access your account
                </p>
              </div>
            </template>

            <!-- Login Form - Enhanced with Real-time Validation -->
            <div class="px-6 py-6">
              <form class="space-y-6" @submit.prevent="handleLogin">
                <!-- Employee Code Field with Real-time Validation -->
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700"
                    >Employee Code</label
                  >
                  <div class="relative">
                    <input
                      v-model="state.employee_code"
                      type="text"
                      placeholder="Enter your employee code"
                      maxlength="10"
                      :class="[
                        'w-full pl-12 pr-4 py-3 text-base text-gray-900 bg-white rounded-xl focus:outline-none transition-all duration-200 placeholder-gray-400',
                        employeeCodeError
                          ? 'border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                      ]"
                      @input="validateEmployeeCode"
                      @blur="validateEmployeeCode"
                    >
                    <UIcon
                      name="i-heroicons-identification"
                      :class="[
                        'absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5',
                        employeeCodeError ? 'text-red-400' : 'text-gray-400',
                      ]"
                    />
                  </div>
                  <!-- Employee Code Error Message with Animation -->
                  <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <div
                      v-if="employeeCodeError"
                      class="flex items-center mt-2"
                    >
                      <UIcon
                        name="i-heroicons-exclamation-circle"
                        class="h-4 w-4 text-red-500 mr-2"
                      />
                      <p class="text-sm text-red-600 font-medium">
                        {{ employeeCodeError }}
                      </p>
                    </div>
                  </Transition>
                </div>

                <!-- Password Field with Real-time Validation -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-medium text-gray-700"
                      >Password</label
                    >
                    <!-- <a
                      href="#"
                      class="text-sm text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                    >
                      Forgot password?
                    </a> -->
                  </div>
                  <div class="relative">
                    <input
                      v-model="state.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Enter your password"
                      maxlength="20"
                      :class="[
                        'w-full pl-12 pr-12 py-3 text-base text-gray-900 bg-white rounded-xl focus:outline-none transition-all duration-200 placeholder-gray-400',
                        passwordError
                          ? 'border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                      ]"
                      @input="validatePassword"
                      @blur="validatePassword"
                    >
                    <UIcon
                      name="i-heroicons-lock-closed"
                      :class="[
                        'absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5',
                        passwordError ? 'text-red-400' : 'text-gray-400',
                      ]"
                    />
                    <button
                      type="button"
                      class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                      @click="showPassword = !showPassword"
                    >
                      <UIcon
                        :name="
                          showPassword
                            ? 'i-heroicons-eye-slash'
                            : 'i-heroicons-eye'
                        "
                        class="h-5 w-5"
                      />
                    </button>
                  </div>
                  <!-- Password Error Message with Animation -->
                  <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <div v-if="passwordError" class="flex items-center mt-2">
                      <UIcon
                        name="i-heroicons-exclamation-circle"
                        class="h-4 w-4 text-red-500 mr-2"
                      />
                      <p class="text-sm text-red-600 font-medium">
                        {{ passwordError }}
                      </p>
                    </div>
                  </Transition>
                </div>

                <!-- Sign In Button with Enhanced States -->
                <button
                  type="submit"
                  :disabled="loading || hasFormErrors"
                  :class="[
                    'mt-8 w-full flex justify-center items-center px-6 py-3 text-base font-semibold text-white rounded-xl shadow-lg transition-all duration-300',
                    loading || hasFormErrors
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                  ]"
                >
                  <template v-if="loading">
                    <UIcon
                      name="i-heroicons-arrow-path"
                      class="animate-spin mr-2 h-5 w-5"
                    />
                    Signing you in...
                  </template>
                  <template v-else>
                    <UIcon
                      name="i-heroicons-arrow-right-on-rectangle"
                      class="mr-2 h-5 w-5"
                    />
                    Sign In
                  </template>
                </button>
              </form>
            </div>

            <!-- Card Footer -->
            <template #footer>
              <div class="px-6 py-6 bg-gray-50/50 border-t border-gray-100/50">
                <div class="flex flex-col items-center space-y-4">
                  <!-- Back to Home -->
                  <UButton
                    variant="ghost"
                    color="gray"
                    size="sm"
                    class="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                    @click="$router.push('/')"
                  >
                    <UIcon name="i-heroicons-arrow-left" class="mr-2" />
                    Back to Home
                  </UButton>
                </div>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Trust Indicators -->
        <div class="text-center">
          <p class="text-xs text-gray-500 mb-4">
            Trusted by leading organizations
          </p>
          <div class="flex justify-center items-center space-x-6 opacity-60">
            <div class="flex items-center space-x-2">
              <div
                class="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center"
              >
                <span class="text-white text-xs font-bold">M</span>
              </div>
              <span class="text-sm text-gray-600">MNR Telecom</span>
            </div>
            <div class="flex items-center space-x-2">
              <div
                class="w-6 h-6 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center"
              >
                <span class="text-white text-xs font-bold">C</span>
              </div>
              <span class="text-sm text-gray-600">Conexiaworld</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Form state
const state = reactive({
  employee_code: "",
  password: "",
});

// Error states (matching Flutter implementation)
const employeeCodeError = ref(null);
const passwordError = ref(null);

// Component state
const loading = ref(false);
const showPassword = ref(false);

// Composables
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

// Computed property to check if form has errors
const hasFormErrors = computed(() => {
  return (
    !!(employeeCodeError.value || passwordError.value) ||
    !state.employee_code.trim() ||
    !state.password.trim()
  );
});

// Meta tags
useHead({
  title: "Sign In - Convise",
  meta: [
    {
      name: "description",
      content:
        "Sign in to your Convise HR management dashboard using your employee credentials.",
    },
  ],
});

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo("/dashboard");
  }
});

// Real-time validation functions (matching Flutter logic)
const validateEmployeeCode = () => {
  const value = state.employee_code.trim();

  if (value === "") {
    employeeCodeError.value = null; // Don't show error for empty field until submit
  } else if (value.length > 10) {
    employeeCodeError.value = "Max 10 characters allowed";
  } else {
    employeeCodeError.value = null;
  }
};

const validatePassword = () => {
  const value = state.password.trim();

  if (value === "") {
    passwordError.value = null; // Don't show error for empty field until submit
  } else if (value.length < 6) {
    passwordError.value = "Minimum 6 characters";
  } else if (value.length > 20) {
    passwordError.value = "Maximum 20 characters";
  } else {
    passwordError.value = null;
  }
};

// Manual validation before submit (matching Flutter's pre-submit validation)
const validateForm = () => {
  const employeeCode = state.employee_code.trim();
  const password = state.password.trim();

  // Validate employee code
  if (employeeCode === "") {
    employeeCodeError.value = "Employee code is required";
  } else if (employeeCode.length > 10) {
    employeeCodeError.value = "Max 10 characters allowed";
  } else {
    employeeCodeError.value = null;
  }

  // Validate password
  if (password === "") {
    passwordError.value = "Password is required";
  } else if (password.length < 6) {
    passwordError.value = "Minimum 6 characters";
  } else if (password.length > 20) {
    passwordError.value = "Maximum 20 characters";
  } else {
    passwordError.value = null;
  }

  return !employeeCodeError.value && !passwordError.value;
};

const handleLogin = async () => {
  // Validate form before proceeding (matching Flutter logic)
  if (!validateForm()) {
    return;
  }

  try {
    loading.value = true;

    const identifier = state.employee_code.trim();
    const password = state.password.trim();

    let emailToUse = null;

    // Check if input is email format (same regex as Flutter code)
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (emailRegex.test(identifier)) {
      // Input is email
      emailToUse = identifier;
    } else {
      // Input is employee_code, look up the email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("employee_code", identifier)
        .maybeSingle();

      if (profileError) {
        console.error("Profile lookup error:", profileError);

        // Handle network/database errors (matching Flutter error handling)
        if (
          profileError.message?.includes("network") ||
          profileError.message?.includes("connection")
        ) {
          toast.add({
            title: "Network Error",
            description:
              "It seems there's a network issue. Please check your connection and try again.",
            color: "red",
            icon: "i-heroicons-wifi",
            timeout: 5000,
          });
        } else {
          toast.add({
            title: "Database Error",
            description: "Unable to verify employee code. Please try again.",
            color: "red",
            icon: "i-heroicons-exclamation-triangle",
            timeout: 5000,
          });
        }
        return;
      }

      if (!profileData || !profileData.email) {
        // Invalid employee code (matching Flutter's "Invalid employee code." message)
        toast.add({
          title: "Invalid Employee Code",
          description: "Employee code not found. Please check and try again.",
          color: "red",
          icon: "i-heroicons-x-circle",
          timeout: 5000,
        });
        return;
      }

      emailToUse = profileData.email;
    }

    // Sign in with Supabase using the resolved email
    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    if (error) {
      console.error("Authentication error:", error);

      // Handle different types of authentication errors (matching Flutter's detailed error handling)
      if (
        error.message?.includes("Invalid login credentials") ||
        error.message?.includes("Email not confirmed") ||
        error.message?.includes("Invalid email or password")
      ) {
        toast.add({
          title: "Login Failed",
          description:
            "Invalid employee code or password. Please check your credentials and try again.",
          color: "red",
          icon: "i-heroicons-x-circle",
          timeout: 5000,
        });
      } else if (error.message?.includes("Too many requests")) {
        toast.add({
          title: "Too Many Attempts",
          description:
            "Too many login attempts. Please wait a moment and try again.",
          color: "orange",
          icon: "i-heroicons-clock",
          timeout: 5000,
        });
      } else if (error.message?.includes("Network")) {
        toast.add({
          title: "Network Error",
          description:
            "Network connection issue. Please check your internet and try again.",
          color: "red",
          icon: "i-heroicons-wifi",
          timeout: 5000,
        });
      } else {
        toast.add({
          title: "Authentication Failed",
          description: "Close the app completely, restart it, and try again.",
          color: "red",
          icon: "i-heroicons-exclamation-triangle",
          timeout: 5000,
        });
      }
    } else {
      // Success message (matching Flutter's success handling)
      toast.add({
        title: "Welcome Back! 🎉",
        description: "Successfully signed in to your dashboard",
        color: "green",
        icon: "i-heroicons-check-circle",
        timeout: 3000,
      });

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      await navigateTo("/dashboard");
    }
  } catch (error) {
    console.error("Unexpected login error:", error);

    // Handle unexpected errors (matching Flutter's catch-all error handling)
    toast.add({
      title: "Unexpected Error",
      description: "Close the app completely, restart it, and try again.",
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};
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
</style>
