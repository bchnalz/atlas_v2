-- Fix: add missing columns to existing tables
-- Tables were created by earlier migration runs that skipped IF NOT EXISTS
ALTER TABLE perangkat ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE perangkat DROP COLUMN IF EXISTS id_perangkat;
ALTER TABLE ms_lokasi ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE ms_lokasi DROP COLUMN IF EXISTS is_active;
ALTER TABLE ms_jenis_perangkat ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE ms_jenis_perangkat DROP COLUMN IF EXISTS is_active;
ALTER TABLE ms_jenis_barang ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE ms_jenis_barang ADD COLUMN IF NOT EXISTS kode TEXT;
ALTER TABLE ms_jenis_barang DROP COLUMN IF EXISTS is_active;
ALTER TABLE skp_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE skp_categories ADD COLUMN IF NOT EXISTS kode TEXT;
ALTER TABLE skp_categories ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE skp_categories ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE skp_categories DROP COLUMN IF EXISTS is_active;
ALTER TABLE skp_categories DROP COLUMN IF EXISTS description;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE task_assignments DROP COLUMN IF EXISTS asset_id;
