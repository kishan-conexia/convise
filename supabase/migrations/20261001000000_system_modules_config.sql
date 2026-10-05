
-- ============================================================
-- Face Recognition Feature — Column Additions Only
-- ============================================================

-- 1. Profile: face enrollment data & per-employee match threshold
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS face_recognition boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_embedding float8[],
  ADD COLUMN IF NOT EXISTS face_enrolled_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_enrollment_photo text,
  ADD COLUMN IF NOT EXISTS face_match_threshold float8 DEFAULT 0.75;

-- 2. Attendance: track face verification per punch
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS face_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_confidence float8;

-- 3. Global feature flag (master kill switch)
ALTER TABLE public.user_app_config
  ADD COLUMN IF NOT EXISTS is_face_recognition_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_spanco_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_feasibility_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS office_location text DEFAULT '28.560247, 77.199301';
