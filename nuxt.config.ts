// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ssr: false,
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
  ],

  // Add the CSS file
  css: ["@/assets/css/main.css"],

  // Supabase configuration
  supabase: {
    redirectOptions: {
      login: "/auth/login",
      callback: "/auth/callback",
      exclude: ["/"],
    },
  },

  // Runtime configuration
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
      appName: "Convise",
      appVersion: "1.0.0",
    },
  },

  // App configuration
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Convise - Modern Workflow Simplified",
      meta: [
        {
          name: "description",
          content: "Transform your organization with intelligent workflow automation. Streamline attendance, leaves, payroll, and employee management.",
        },
        { name: "format-detection", content: "telephone=no" },
      ],
    },
  },

  // Build optimizations
  nitro: {
    prerender: {
      routes: ["/"],
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
