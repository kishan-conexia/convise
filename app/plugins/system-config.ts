export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient();
  const systemConfigStore = useSystemConfigStore();

  // Load config on app boot
  await systemConfigStore.fetchConfig(supabase);
});
