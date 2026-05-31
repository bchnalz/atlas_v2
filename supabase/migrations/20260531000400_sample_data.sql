-- Seed: sample devices + tasks for testing
-- Run after migration + base seed data

-- ============================================================
-- SAMPLE DEVICES (5 devices in various locations)
-- ============================================================
INSERT INTO perangkat (id, nama_perangkat, serial_number, jenis_perangkat_kode, lokasi_kode, merk, status_perangkat, ip_ethernet, mac_ethernet, spesifikasi_processor, kapasitas_ram, created_at)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'PC Admin 01', 'SN-PC-2024-001', 'KOMP', 'GD-A-LT1-R101', 'Lenovo', 'layak', '192.168.1.10', 'AA:BB:CC:00:11:01', 'Intel i5-12400', '16GB', now() - interval '180 days'),
  ('f1000000-0000-0000-0000-000000000002', 'PC Helpdesk 01', 'SN-PC-2024-002', 'KOMP', 'GD-A-LT1-R102', 'Dell', 'layak', '192.168.1.11', 'AA:BB:CC:00:11:02', 'Intel i5-13400', '16GB', now() - interval '150 days'),
  ('f1000000-0000-0000-0000-000000000003', 'Printer Lobby', 'SN-PR-2023-015', 'PRIN', 'GD-A-LT1-R101', 'Epson', 'rusak', '192.168.1.20', 'AA:BB:CC:00:11:03', NULL, NULL, now() - interval '365 days'),
  ('f1000000-0000-0000-0000-000000000004', 'Switch Floor 2', 'SN-SW-2024-008', 'NET', 'GD-A-LT2-R201', 'Cisco', 'layak', '192.168.1.254', 'AA:BB:CC:00:11:04', NULL, NULL, now() - interval '120 days'),
  ('f1000000-0000-0000-0000-000000000005', 'UPS Server', 'SN-UPS-2023-001', 'UPS', 'GD-B-LT1-R001', 'APC', 'dipinjam', NULL, NULL, NULL, NULL, now() - interval '200 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE TASKS (3 tasks for the admin test user)
-- ============================================================
INSERT INTO task_assignments (id, task_number, title, description, priority, status, assigned_by, created_at, skp_category_id)
VALUES
  ('f2000000-0000-0000-0000-000000000001', 'TASK-0001', 'Replace PC Admin 01 hard drive', 'HDD showing SMART errors, replace with 512GB SSD', 'high', 'completed', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '14 days', 'd0000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002', 'TASK-0002', 'Fix Printer Lobby paper jam', 'Printer keeps jamming on duplex print. Clean rollers and realign.', 'normal', 'in_progress', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '5 days', 'd0000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000003', 'TASK-0003', 'Install antivirus on helpdesk PCs', 'Deploy Windows Defender config via GPO on all helpdesk machines', 'normal', 'pending', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '1 day', 'd0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Assign admin to tasks
INSERT INTO task_assignment_users (task_assignment_id, user_id, status, work_duration_minutes)
VALUES
  ('f2000000-0000-0000-0000-000000000001', '20404b41-7e85-4580-a235-c636018f15b0', 'completed', 120),
  ('f2000000-0000-0000-0000-000000000002', '20404b41-7e85-4580-a235-c636018f15b0', 'in_progress', 45),
  ('f2000000-0000-0000-0000-000000000003', '20404b41-7e85-4580-a235-c636018f15b0', 'pending', 0)
ON CONFLICT DO NOTHING;

-- Link devices to tasks
INSERT INTO task_assignment_devices (task_assignment_id, perangkat_id)
VALUES
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Add some task history
INSERT INTO task_history (task_assignment_id, action, performed_by, created_at)
VALUES
  ('f2000000-0000-0000-0000-000000000001', 'created', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '14 days'),
  ('f2000000-0000-0000-0000-000000000001', 'accepted', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '13 days'),
  ('f2000000-0000-0000-0000-000000000001', 'completed', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '12 days'),
  ('f2000000-0000-0000-0000-000000000002', 'created', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '5 days'),
  ('f2000000-0000-0000-0000-000000000002', 'accepted', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '4 days'),
  ('f2000000-0000-0000-0000-000000000003', 'created', '20404b41-7e85-4580-a235-c636018f15b0', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- SKP achievements for admin
INSERT INTO skp_achievements (user_id, skp_category_id, target_count, completed_count, year)
VALUES
  ('20404b41-7e85-4580-a235-c636018f15b0', 'd0000000-0000-0000-0000-000000000001', 10, 1, EXTRACT(YEAR FROM now())),
  ('20404b41-7e85-4580-a235-c636018f15b0', 'd0000000-0000-0000-0000-000000000002', 8, 0, EXTRACT(YEAR FROM now()))
ON CONFLICT (user_id, skp_category_id, year) DO NOTHING;
