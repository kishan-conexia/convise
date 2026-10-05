-- 1. Create the profile-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-documents', 'profile-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for profile-documents bucket
DROP POLICY IF EXISTS "admin_update_files" ON "storage"."objects";
CREATE POLICY "admin_update_files" ON "storage"."objects"
FOR UPDATE TO "authenticated"
USING ((("bucket_id" = 'profile-documents'::"text") AND "public"."is_manager_of_administration"()))
WITH CHECK ((("bucket_id" = 'profile-documents'::"text") AND "public"."is_manager_of_administration"()));

DROP POLICY IF EXISTS "user_delete_own_staging" ON "storage"."objects";
CREATE POLICY "user_delete_own_staging" ON "storage"."objects"
FOR DELETE TO "authenticated"
USING ((("bucket_id" = 'profile-documents'::"text") AND (((("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text") AND (("storage"."foldername"("name"))[2] = 'staging'::"text")) OR "public"."is_manager_of_administration"())));

DROP POLICY IF EXISTS "user_insert_own_staging" ON "storage"."objects";
CREATE POLICY "user_insert_own_staging" ON "storage"."objects"
FOR INSERT TO "authenticated"
WITH CHECK ((("bucket_id" = 'profile-documents'::"text") AND (((("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text") AND (("storage"."foldername"("name"))[2] = 'staging'::"text")) OR "public"."is_manager_of_administration"())));

DROP POLICY IF EXISTS "user_select_own_files" ON "storage"."objects";
CREATE POLICY "user_select_own_files" ON "storage"."objects"
FOR SELECT TO "authenticated"
USING ((("bucket_id" = 'profile-documents'::"text") AND ((("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text") OR "public"."is_manager_of_administration"())));
