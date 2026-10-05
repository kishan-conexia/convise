// app/middleware/spanco.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const systemConfigStore = useSystemConfigStore();
  const supabase = useSupabaseClient();

  if (!systemConfigStore.initialized) {
    await systemConfigStore.fetchConfig(supabase);
  }

  if (!systemConfigStore.isSpancoEnabled) {
    if (to.path.startsWith("/admin")) {
      return navigateTo("/admin");
    }
    return navigateTo("/dashboard");
  }
});
