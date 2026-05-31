-- ============================================================
-- ATLAS v2 — SEED DATA
-- Target: Dev database (jjlwgxelxucagurihcme)
-- ============================================================

-- ============================================================
-- 1. USER CATEGORIES (Roles)
-- ============================================================
INSERT INTO user_categories (id, nama, deskripsi, is_admin) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administrator', 'Full system access including user management', true),
  ('a0000000-0000-0000-0000-000000000002', 'Helpdesk', 'Task creation, assignment, and evaluation', false),
  ('a0000000-0000-0000-0000-000000000003', 'IT Support', 'Field technician — works on assigned tasks', false),
  ('a0000000-0000-0000-0000-000000000004', 'Management', 'Read-only dashboard and reports', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. DEVICE TYPES
-- ============================================================
INSERT INTO ms_jenis_perangkat (id, kode, nama) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'KOMP', 'Komputer'),
  ('b0000000-0000-0000-0000-000000000002', 'PRIN', 'Printer'),
  ('b0000000-0000-0000-0000-000000000003', 'NET', 'Jaringan'),
  ('b0000000-0000-0000-0000-000000000004', 'UPS', 'UPS'),
  ('b0000000-0000-0000-0000-000000000005', 'MON', 'Monitor')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. ITEM TYPES
-- ============================================================
INSERT INTO ms_jenis_barang (id, kode, nama, jenis_perangkat_kode) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'PC', 'Desktop PC', 'KOMP'),
  ('c0000000-0000-0000-0000-000000000002', 'LAP', 'Laptop', 'KOMP'),
  ('c0000000-0000-0000-0000-000000000003', 'THIN', 'Thin Client', 'KOMP'),
  ('c0000000-0000-0000-0000-000000000004', 'DOT', 'Dot Matrix Printer', 'PRIN'),
  ('c0000000-0000-0000-0000-000000000005', 'LASER', 'Laser Printer', 'PRIN'),
  ('c0000000-0000-0000-0000-000000000006', 'SWITCH', 'Switch', 'NET'),
  ('c0000000-0000-0000-0000-000000000007', 'ROUTER', 'Router', 'NET'),
  ('c0000000-0000-0000-0000-000000000008', 'AP', 'Access Point', 'NET')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. SKP CATEGORIES
-- ============================================================
INSERT INTO skp_categories (id, kode, nama, deskripsi) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'SKP-HW', 'Perbaikan Hardware', 'Perbaikan dan penggantian komponen hardware'),
  ('d0000000-0000-0000-0000-000000000002', 'SKP-SW', 'Instalasi Software', 'Instalasi dan konfigurasi software'),
  ('d0000000-0000-0000-0000-000000000003', 'SKP-NET', 'Jaringan', 'Penanganan masalah jaringan dan konektivitas'),
  ('d0000000-0000-0000-0000-000000000004', 'SKP-INV', 'Inventarisasi', 'Pendataan dan pemutakhiran inventaris')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. LOCATIONS (Sample hierarchy)
-- ============================================================
INSERT INTO ms_lokasi (id, kode, nama, parent_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'GD-A', 'Gedung A', NULL),
  ('e0000000-0000-0000-0000-000000000002', 'GD-B', 'Gedung B', NULL),
  ('e0000000-0000-0000-0000-000000000010', 'GD-A-LT1', 'Lantai 1', 'e0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000011', 'GD-A-LT2', 'Lantai 2', 'e0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000012', 'GD-B-LT1', 'Lantai 1', 'e0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000020', 'GD-A-LT1-R101', 'Ruang 101 (Admin)', 'e0000000-0000-0000-0000-000000000010'),
  ('e0000000-0000-0000-0000-000000000021', 'GD-A-LT1-R102', 'Ruang 102 (Helpdesk)', 'e0000000-0000-0000-0000-000000000010'),
  ('e0000000-0000-0000-0000-000000000022', 'GD-A-LT2-R201', 'Ruang 201 (IT Support)', 'e0000000-0000-0000-0000-000000000011'),
  ('e0000000-0000-0000-0000-000000000023', 'GD-B-LT1-R001', 'Ruang 001 (Server)', 'e0000000-0000-0000-0000-000000000012')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE.
-- ============================================================
