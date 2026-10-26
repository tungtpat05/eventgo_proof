-- Migration: 20261026000001_secure_activation_readiness_rpc.sql
-- Mục đích: Khắc phục lỗ hổng IDOR/BOLA trong RPC check_campaign_activation_readiness.
-- Thêm kiểm tra quyền is_campaign_manager(p_campaign_id) trước khi thực thi trả dữ liệu kiểm tra booth/location.

CREATE OR REPLACE FUNCTION public.check_campaign_activation_readiness(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    errors JSONB := '[]'::JSONB;
    loc_count INT;
    r RECORD;
BEGIN
    -- 0. Kiểm tra quyền của người gọi (chỉ Campaign Manager mới được kiểm tra)
    IF NOT public.is_campaign_manager(p_campaign_id) THEN
        RAISE EXCEPTION 'Chỉ có Manager của chiến dịch mới có quyền kiểm tra điều kiện kích hoạt';
    END IF;

    -- 1. Địa điểm
    SELECT COUNT(*) INTO loc_count FROM locations WHERE campaign_id = p_campaign_id;
    IF loc_count = 0 THEN
        errors := errors || jsonb_build_array('Chiến dịch chưa có địa điểm nào.');
    END IF;

    -- 2. Địa điểm không có booth
    FOR r IN (
        SELECT l.name FROM locations l
        LEFT JOIN booths b ON b.location_id = l.id
        WHERE l.campaign_id = p_campaign_id
        GROUP BY l.id, l.name
        HAVING COUNT(b.id) = 0
    ) LOOP
        errors := errors || jsonb_build_array('Địa điểm "' || r.name || '" chưa có gian hàng (booth) nào.');
    END LOOP;

    -- 3. Booth không có checklist
    FOR r IN (
        SELECT b.name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN checklist_items ci ON ci.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id
        GROUP BY b.id, b.name
        HAVING COUNT(ci.id) = 0
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" chưa có tiêu chí checklist nào.');
    END LOOP;

    -- 4. Booth thiếu Supervisor (Chưa có cả Member lẫn Invite)
    FOR r IN (
        SELECT b.name, l.name AS loc_name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_supervisor_assignments bsa ON bsa.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id 
          AND bsa.supervisor_member_id IS NULL 
          AND bsa.supervisor_invite_id IS NULL
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" tại "' || r.loc_name || '" chưa có Giám sát viên (Supervisor).');
    END LOOP;

    -- 5. Booth thiếu Approver (Chưa có cả Member lẫn Invite)
    FOR r IN (
        SELECT b.name, l.name AS loc_name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_approver_assignments baa ON baa.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id 
          AND baa.approver_member_id IS NULL 
          AND baa.approver_invite_id IS NULL
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" tại "' || r.loc_name || '" chưa có Người phê duyệt (Approver).');
    END LOOP;

    RETURN jsonb_build_object(
        'can_activate', jsonb_array_length(errors) = 0,
        'errors', errors
    );
END;
$$;
