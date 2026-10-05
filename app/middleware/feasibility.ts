// app/middleware/feasibility.ts
export default defineNuxtRouteMiddleware(async () => {
  const systemConfigStore = useSystemConfigStore();
  const supabase = useSupabaseClient();

  if (!systemConfigStore.initialized) {
    await systemConfigStore.fetchConfig(supabase);
  }

  if (!systemConfigStore.isFeasibilityEnabled) {
    return navigateTo("/admin");
  }
});
