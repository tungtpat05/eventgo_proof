-- ============================================================================
-- EventGo Proof: Migration 003 - Realistic Vietnam Demo Seed Data
-- ============================================================================

-- 1. Demo Organization
INSERT INTO organizations (id, name, slug)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'EventGo Demo Agency (Hà Nội)',
    'eventgo-demo-agency'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Profiles (Assuming auth.users has been created or inserting for local prototype)
-- Note: In production Supabase, users are created via auth.users first.
-- Here we insert matching UUIDs into profiles for demonstration.
INSERT INTO profiles (id, organization_id, email, full_name, phone, role)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'pm@eventgo.vn', 'Nguyễn Thị Bảo Ngọc (PM)', '0901234567', 'PROJECT_MANAGER'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'supervisor@eventgo.vn', 'Nguyễn Thanh Tùng (Giám sát)', '0912345678', 'SUPERVISOR'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'approver@eventgo.vn', 'Lê Bá Nhật Nam (Duyệt)', '0923456789', 'APPROVER')
ON CONFLICT (id) DO NOTHING;

-- 3. Demo Campaign
INSERT INTO campaigns (id, organization_id, title, brand_name, description, start_date, end_date, status, created_by)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Summer Activation 2026 — Trưng Bày Đồ Uống Mùa Hè',
    'FreshJuice Co.',
    'Chiến dịch kích hoạt thương hiệu và sampling sản phẩm tại các TTTM trọng điểm Hà Nội & TP.HCM.',
    '2026-06-01',
    '2026-08-31',
    'ACTIVE',
    'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Checklist Items (Master criteria for the campaign)
INSERT INTO checklist_items (id, campaign_id, title, description, category, is_required, order_index)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Lắp đặt gian hàng theo thiết kế 3D đã duyệt', 'Chụp góc rộng toàn cảnh gian hàng từ phía trước và hai mặt bên, đảm bảo đúng kết cấu và kích thước.', 'STRUCTURE', TRUE, 1),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Vị trí logo nhận diện thương hiệu', 'Chụp cận cảnh logo trên backdrop trung tâm và mặt trước quầy lễ tân, không bị che khuất hoặc nghiêng lệch.', 'BRANDING', TRUE, 2),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Standee và ấn phẩm POSM đầy đủ', 'Chụp toàn bộ standee khuyến mãi, tờ rơi giới thiệu và bảng báo giá được bố trí tại đúng vị trí quy định.', 'POSM', TRUE, 3),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Khu vực trưng bày sản phẩm hoàn thiện', 'Chụp các line kệ trưng bày sản phẩm thật, sản phẩm dùng thử (sampling) đủ số lượng theo bàn giao.', 'CONDITION', TRUE, 4),
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Nhân sự trực quầy (PG/PB) đúng giờ & trang phục chuẩn', 'Chụp đội ngũ nhân sự PG/PB có mặt tại gian hàng, mang thẻ sự kiện và mặc đồng phục đúng quy chuẩn.', 'STAFFING', TRUE, 5)
ON CONFLICT (id) DO NOTHING;

-- 5. Locations
INSERT INTO locations (id, campaign_id, organization_id, name, address, city, assigned_supervisor_id, assigned_approver_id, deadline)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Gian Hàng Sảnh A — Vincom Center Bà Triệu', '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng', 'Hà Nội', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', '2026-06-15 18:00:00+07'),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Khu Hoạt Náo Sảnh Đông — Aeon Mall Hà Đông', 'Khu đô thị Dương Nội, Hà Đông', 'Hà Nội', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', '2026-06-20 18:00:00+07'),
    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Quầy Kích Hoạt Trung Tâm — Lotte Mall West Lake', '272 Võ Chí Công, Tây Hồ', 'Hà Nội', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', '2026-06-25 18:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 6. Submissions & Evidence Examples
INSERT INTO submissions (id, location_id, checklist_item_id, status, notes, submitted_by, submitted_at)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'APPROVED', 'Đã hoàn thiện lắp đặt khung sắt và sàn nâng theo đúng 3D.', 'b0000000-0000-0000-0000-000000000002', '2026-06-10 10:00:00+07'),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'NEEDS_REVISION', 'Logo dán trên mặt trước quầy.', 'b0000000-0000-0000-0000-000000000002', '2026-06-10 10:15:00+07'),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'SUBMITTED', 'Đã dựng 2 standee hai bên lối vào và đặt tờ rơi tại quầy.', 'b0000000-0000-0000-0000-000000000002', '2026-06-10 14:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- 7. Approval History
INSERT INTO approval_history (id, submission_id, reviewer_id, action, notes, created_at)
VALUES
    ('g0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'APPROVE', 'Gian hàng đạt chuẩn thiết kế, kết cấu vững chãi.', '2026-06-10 11:00:00+07'),
    ('g0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'REQUEST_REVISION', 'Ảnh logo bị mờ và lóa đèn sảnh, vui lòng chụp lại rõ nét trực diện.', '2026-06-10 11:05:00+07')
ON CONFLICT (id) DO NOTHING;
