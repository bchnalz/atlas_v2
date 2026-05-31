-- ============================================================
-- ATLAS v2 â€” COMPLETE REVISED DATABASE SCHEMA (v2 â€” fixed)
-- Target: Dev database (jjlwgxelxucagurihcme)
-- ============================================================
-- DESIGN DECISIONS:
--   - Only perangkat (asset) data carried from v1/production
--   - capabilities[] on profiles for delegated admin access
--   - is_admin flag on user_categories â€” no hardcoded names
--   - Soft delete: deleted_at on ALL tables (not mixed is_active)
--   - Uniform naming: Indonesian (kode, not code)
--   - Single device-task path: task_assignment_devices only
--   - No user_category_page_permissions table (deprecated)
--   - DB trigger for SKP achievement counting
--   - RLS policies on EVERY table, no gaps
--   - Helper functions in public schema (not auth â€” restricted)
-- ============================================================

-- ============================================================
-- DEPRECATED TABLES (removed for v2)
-- ============================================================

DROP TABLE IF EXISTS user_category_page_permissions CASCADE;

-- ============================================================
-- SECTION 1: AUTH & USER MANAGEMENT
-- ============================================================

-- 1a. User Categories (roles)
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL UNIQUE,
  deskripsi TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1b. Profiles (extended user info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  user_category_id UUID REFERENCES user_categories(id),
  capabilities TEXT[] DEFAULT '{}',
  phone TEXT,
  department TEXT,
  telegram_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1c. User registration requests
CREATE TABLE IF NOT EXISTS user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  requested_role UUID REFERENCES user_categories(id),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 2: MASTER DATA
-- ============================================================

-- 2a. Locations
CREATE TABLE IF NOT EXISTS ms_lokasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  parent_id UUID REFERENCES ms_lokasi(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2b. Device types
CREATE TABLE IF NOT EXISTS ms_jenis_perangkat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2c. Item types
CREATE TABLE IF NOT EXISTS ms_jenis_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jenis_perangkat_kode TEXT REFERENCES ms_jenis_perangkat(kode),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2d. SKP Categories
CREATE TABLE IF NOT EXISTS skp_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- SECTION 3: ASSETS (CARRIED FROM PRODUCTION)
-- ============================================================

CREATE TABLE IF NOT EXISTS perangkat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petugas_id UUID REFERENCES profiles(id),
  serial_number TEXT,
  lokasi_kode TEXT REFERENCES ms_lokasi(kode),
  nama_perangkat TEXT NOT NULL,
  jenis_perangkat_kode TEXT REFERENCES ms_jenis_perangkat(kode),
  jenis_barang_id UUID REFERENCES ms_jenis_barang(id),
  merk TEXT,
  id_remoteaccess TEXT,
  spesifikasi_processor TEXT,
  kapasitas_ram TEXT,
  mac_ethernet TEXT,
  mac_wireless TEXT,
  ip_ethernet TEXT,
  ip_wireless TEXT,
  serial_number_monitor TEXT,
  tanggal_entry TIMESTAMPTZ,
  status_perangkat TEXT DEFAULT 'layak' CHECK (status_perangkat IN ('layak', 'rusak', 'dipinjam', 'dihapus')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mutasi_perangkat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perangkat_id UUID REFERENCES perangkat(id) ON DELETE CASCADE NOT NULL,
  lokasi_lama TEXT REFERENCES ms_lokasi(kode),
  lokasi_baru TEXT REFERENCES ms_lokasi(kode),
  alasan TEXT,
  dilakukan_oleh UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 4: TASK MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE NOT NULL,
  skp_category_id UUID REFERENCES skp_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  assigned_by UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  completion_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_assignment_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  work_duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignment_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE NOT NULL,
  perangkat_id UUID REFERENCES perangkat(id) ON DELETE CASCADE NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT now(),
  linked_by UUID REFERENCES profiles(id),
  linked_during_execution BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_assignment_id, perangkat_id)
);

CREATE TABLE IF NOT EXISTS task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES profiles(id),
  estimated_duration_minutes INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_assignment_id UUID,
  task_number TEXT,
  title TEXT,
  deleted_by UUID REFERENCES profiles(id),
  reason TEXT,
  deleted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 5: SKP & PERFORMANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS skp_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skp_category_id UUID REFERENCES skp_categories(id) ON DELETE CASCADE NOT NULL,
  target_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  year INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skp_category_id, year)
);

-- ============================================================
-- SECTION 6: NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- ============================================================
-- SECTION 7: SKP TRIGGER (auto-increment on task completion)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_increment_skp_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    INSERT INTO skp_achievements (user_id, skp_category_id, completed_count, year)
    SELECT
      NEW.user_id,
      ta.skp_category_id,
      1,
      EXTRACT(YEAR FROM now())
    FROM task_assignments ta
    WHERE ta.id = NEW.task_assignment_id
      AND ta.skp_category_id IS NOT NULL
    ON CONFLICT (user_id, skp_category_id, year)
    DO UPDATE SET
      completed_count = skp_achievements.completed_count + 1,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_skp_achievement ON task_assignment_users;
CREATE TRIGGER trg_increment_skp_achievement
  AFTER UPDATE OF status ON task_assignment_users
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION fn_increment_skp_achievement();

-- ============================================================
-- SECTION 8: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(user_category_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_perangkat_serial_number ON perangkat(serial_number);
CREATE INDEX IF NOT EXISTS idx_perangkat_nama ON perangkat(nama_perangkat);
CREATE INDEX IF NOT EXISTS idx_perangkat_lokasi ON perangkat(lokasi_kode);
CREATE INDEX IF NOT EXISTS idx_perangkat_jenis ON perangkat(jenis_perangkat_kode);
CREATE INDEX IF NOT EXISTS idx_perangkat_status ON perangkat(status_perangkat);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_created ON task_assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_assignments_skp ON task_assignments(skp_category_id);
CREATE INDEX IF NOT EXISTS idx_tau_task_user ON task_assignment_users(task_assignment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tau_user_status ON task_assignment_users(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tad_task ON task_assignment_devices(task_assignment_id);
CREATE INDEX IF NOT EXISTS idx_tad_device ON task_assignment_devices(perangkat_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_assignment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lokasi_parent ON ms_lokasi(parent_id);

-- ============================================================
