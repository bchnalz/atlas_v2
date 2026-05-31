-- Sprint 1: Fix remaining schema items + all RLS policies
-- Tables already exist from first migration run (Sections 1-8)

-- Add missing columns
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Helper functions in public schema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_categories uc ON p.user_category_id = uc.id
    WHERE p.id = auth.uid() AND uc.is_admin = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_capability(cap TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND cap = ANY(capabilities)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_capability(cap TEXT)
RETURNS BOOLEAN AS $$
  SELECT public.is_admin() OR public.has_capability(cap);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop all existing RLS policies first, then recreate
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END
$$;

-- PROFILES
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- USER CATEGORIES
CREATE POLICY "authenticated_read_categories" ON user_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_write_categories" ON user_categories FOR ALL USING (public.is_admin());

-- USER REQUESTS
CREATE POLICY "users_insert_own_request" ON user_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin_read_requests" ON user_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_requests" ON user_requests FOR UPDATE USING (public.is_admin());

-- PERANGKAT
CREATE POLICY "authenticated_read_devices" ON perangkat FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_or_delegated_insert_devices" ON perangkat FOR INSERT WITH CHECK (public.is_admin_or_capability('master_data'));
CREATE POLICY "admin_or_delegated_update_devices" ON perangkat FOR UPDATE USING (public.is_admin_or_capability('master_data'));
CREATE POLICY "admin_or_delegated_delete_devices" ON perangkat FOR DELETE USING (public.is_admin());

-- MUTASI
CREATE POLICY "authenticated_read_mutasi" ON mutasi_perangkat FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_insert_mutasi" ON mutasi_perangkat FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_mutasi" ON mutasi_perangkat FOR DELETE USING (public.is_admin());

-- LOKASI
CREATE POLICY "authenticated_read_lokasi" ON ms_lokasi FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_or_delegated_write_lokasi" ON ms_lokasi FOR INSERT WITH CHECK (public.is_admin_or_capability('master_data'));
CREATE POLICY "admin_or_delegated_update_lokasi" ON ms_lokasi FOR UPDATE USING (public.is_admin_or_capability('master_data'));
CREATE POLICY "admin_or_delegated_delete_lokasi" ON ms_lokasi FOR DELETE USING (public.is_admin_or_capability('master_data'));

-- JENIS PERANGKAT
CREATE POLICY "authenticated_read_jenis_perangkat" ON ms_jenis_perangkat FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_or_delegated_write_jenis_perangkat" ON ms_jenis_perangkat FOR ALL USING (public.is_admin_or_capability('master_data'));

-- JENIS BARANG
CREATE POLICY "authenticated_read_jenis_barang" ON ms_jenis_barang FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_or_delegated_write_jenis_barang" ON ms_jenis_barang FOR ALL USING (public.is_admin_or_capability('master_data'));

-- SKP CATEGORIES
CREATE POLICY "authenticated_read_skp_categories" ON skp_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_or_delegated_write_skp_categories" ON skp_categories FOR ALL USING (public.is_admin_or_capability('master_data'));

-- SKP ACHIEVEMENTS
CREATE POLICY "users_read_own_achievements" ON skp_achievements FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "admin_set_targets" ON skp_achievements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_achievements" ON skp_achievements FOR UPDATE USING (public.is_admin());

-- TASK ASSIGNMENTS
CREATE POLICY "read_tasks" ON task_assignments FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM task_assignment_users WHERE task_assignment_id = id)
  OR auth.uid() = assigned_by
  OR public.is_admin()
);
CREATE POLICY "insert_tasks" ON task_assignments FOR INSERT WITH CHECK (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM profiles p JOIN user_categories uc ON p.user_category_id = uc.id WHERE p.id = auth.uid() AND uc.nama = 'Helpdesk')
);
CREATE POLICY "admin_update_tasks" ON task_assignments FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_tasks" ON task_assignments FOR DELETE USING (public.is_admin());

-- TASK-USER ASSIGNMENTS
CREATE POLICY "read_task_assignments" ON task_assignment_users FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR auth.uid() IN (SELECT assigned_by FROM task_assignments WHERE id = task_assignment_id));
CREATE POLICY "insert_task_assignments" ON task_assignment_users FOR INSERT WITH CHECK (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM profiles p JOIN user_categories uc ON p.user_category_id = uc.id WHERE p.id = auth.uid() AND uc.nama = 'Helpdesk')
);
CREATE POLICY "tech_update_own_status" ON task_assignment_users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_update_assignments" ON task_assignment_users FOR UPDATE USING (public.is_admin());

-- TASK-DEVICE ASSIGNMENTS
CREATE POLICY "read_task_devices" ON task_assignment_devices FOR SELECT USING (public.is_admin() OR auth.uid() IN (SELECT assigned_by FROM task_assignments WHERE id = task_assignment_id) OR auth.uid() IN (SELECT user_id FROM task_assignment_users WHERE task_assignment_id = task_assignment_id));
CREATE POLICY "admin_or_helpdesk_link_devices" ON task_assignment_devices FOR INSERT WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM profiles p JOIN user_categories uc ON p.user_category_id = uc.id WHERE p.id = auth.uid() AND uc.nama = 'Helpdesk') OR auth.uid() IN (SELECT user_id FROM task_assignment_users WHERE task_assignment_id = task_assignment_id));
CREATE POLICY "admin_manage_task_devices" ON task_assignment_devices FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_task_devices" ON task_assignment_devices FOR DELETE USING (public.is_admin());

-- SUBTASKS
CREATE POLICY "read_subtasks" ON task_subtasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_or_helpdesk_manage_subtasks" ON task_subtasks FOR INSERT WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM profiles p JOIN user_categories uc ON p.user_category_id = uc.id WHERE p.id = auth.uid() AND uc.nama = 'Helpdesk'));
CREATE POLICY "admin_update_subtasks" ON task_subtasks FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_subtasks" ON task_subtasks FOR DELETE USING (public.is_admin());

-- TASK HISTORY
CREATE POLICY "read_task_history" ON task_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "system_insert_task_history" ON task_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- DELETION LOG
CREATE POLICY "read_deletion_log" ON task_deletion_log FOR SELECT USING (public.is_admin());
CREATE POLICY "system_insert_deletion_log" ON task_deletion_log FOR INSERT WITH CHECK (public.is_admin());

-- NOTIFICATIONS
CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "system_insert_notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- REALTIME
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE perangkat;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
