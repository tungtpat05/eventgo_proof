-- ============================================================================
-- EventGo Proof: Optional Development Seed
-- Google OAuth users are created by Supabase Auth, so this script never creates
-- fake identities. If at least one profile exists, it creates one demo campaign
-- owned by the oldest profile with Location -> Booth -> Checklist hierarchy.
-- ============================================================================

DO $$
DECLARE
    owner_id UUID;
    demo_campaign_id UUID := 'c0000000-0000-0000-0000-000000000001';
    demo_location_id UUID := 'd0000000-0000-0000-0000-000000000001';
    demo_booth_1_id  UUID := 'b0000000-0000-0000-0000-000000000001';
    demo_booth_2_id  UUID := 'b0000000-0000-0000-0000-000000000002';
BEGIN
    SELECT id INTO owner_id FROM profiles ORDER BY created_at LIMIT 1;

    IF owner_id IS NULL THEN
        RAISE NOTICE 'Skipping demo seed: sign in with Google once to create a profile.';
        RETURN;
    END IF;

    -- 1. Campaign mẫu (DRAFT)
    INSERT INTO campaigns (
        id, title, brand_name, description,
        company_name, company_tax_code, company_address,
        company_contact_name, company_contact_email, company_contact_phone,
        start_date, end_date, status, created_by
    ) VALUES (
        demo_campaign_id,
        'Summer Activation 2026 — Trưng Bày Đồ Uống Mùa Hè',
        'FreshJuice Co.',
        'Chiến dịch mẫu demo luồng phân cấp: Địa điểm -> Gian hàng (Booth) -> Tiêu chí kiểm tra riêng.',
        'Công ty TNHH FreshJuice Việt Nam',
        '0101234567',
        'Hà Nội, Việt Nam',
        'Nguyễn Minh Anh',
        'contact@freshjuice.example',
        '0900000000',
        '2026-06-01',
        '2026-08-30',
        'DRAFT',
        owner_id
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Campaign Member (Manager)
    INSERT INTO campaign_members (campaign_id, user_id, role, status, assigned_by)
    VALUES (demo_campaign_id, owner_id, 'MANAGER', 'ACTIVE', owner_id)
    ON CONFLICT (campaign_id, user_id) DO NOTHING;

    -- 3. Location
    INSERT INTO locations (id, campaign_id, name, address, city, deadline)
    VALUES (
        demo_location_id,
        demo_campaign_id,
        'Vincom Center Bà Triệu',
        '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng',
        'Hà Nội',
        '2026-06-15T18:00:00+07:00'
    ) ON CONFLICT (id) DO NOTHING;

    -- 4. Booths
    INSERT INTO booths (id, location_id, name, code, description)
    VALUES
        (
            demo_booth_1_id,
            demo_location_id,
            'Gian Hàng Trải Nghiệm — Sảnh Chính',
            'BOOTH-01',
            'Khu vực trưng bày sản phẩm mới và minigame tương tác.'
        ),
        (
            demo_booth_2_id,
            demo_location_id,
            'Quầy Sampling — Tầng 1',
            'BOOTH-02',
            'Quầy phát mẫu thử nước ép hoa quả tươi.'
        )
    ON CONFLICT (id) DO NOTHING;

    -- 5. Checklist items riêng cho từng Booth
    -- Tiêu chí cho Booth 1 (Gian trải nghiệm)
    INSERT INTO checklist_items (booth_id, title, description, category, is_required, order_index)
    VALUES
        (demo_booth_1_id, 'Lắp đặt kết cấu theo bản vẽ 3D', 'Chụp toàn cảnh mặt trước và mặt sau gian hàng.', 'STRUCTURE', TRUE, 1),
        (demo_booth_1_id, 'Vị trí logo nhận diện thương hiệu', 'Logo rõ nét, đúng quy chuẩn góc nhìn và ánh sáng.', 'BRANDING', TRUE, 2),
        (demo_booth_1_id, 'Màn hình LED và thiết bị minigame', 'Màn hình hiển thị nội dung quảng cáo hoạt động bình thường.', 'POSM', TRUE, 3),
        (demo_booth_1_id, 'Nhân sự trực quầy (PG/PB)', 'PG có mặt đúng giờ, trang phục chuẩn nhận diện.', 'STAFFING', TRUE, 4)
    ON CONFLICT DO NOTHING;

    -- Tiêu chí cho Booth 2 (Quầy Sampling)
    INSERT INTO checklist_items (booth_id, title, description, category, is_required, order_index)
    VALUES
        (demo_booth_2_id, 'Quầy kệ sampling và khay đựng ly', 'Khu vực quầy sạch sẽ, khay và ly mẫu chuẩn bị sẵn sàng.', 'STRUCTURE', TRUE, 1),
        (demo_booth_2_id, 'Standee hướng dẫn tham gia', 'Standee đặt đúng vị trí lối đi dễ thấy.', 'POSM', TRUE, 2),
        (demo_booth_2_id, 'Vệ sinh an toàn thực phẩm & găng tay', 'Nhân viên đeo găng tay và khẩu trang khi phát mẫu.', 'CONDITION', TRUE, 3)
    ON CONFLICT DO NOTHING;
END;
$$;
