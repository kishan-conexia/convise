// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo("/auth/login");
  }

  const supabase = useSupabaseClient();
  const userProfileStore = useUserProfileStore();

  if (!userProfileStore.initialized) {
    await userProfileStore.fetchUserProfile(user.value.id, supabase);
  }

  const hasAccess = await userProfileStore.checkAdminAccess(supabase);

  if (!hasAccess) {
    return navigateTo("/dashboard");
  }
});
