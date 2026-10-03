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
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- 2. Demo Profiles (Matched with real Supabase auth.users UIDs)
-- pm1: e31ecfe6-6008-4ae5-aa9c-2cc65d2c191a (pm1@eventgo.vn)
-- supervisor1: 5ec73217-0087-49ec-8e34-5d3ee9402aea (supervisor1@eventgo.vn)
-- approver1: 912cabb3-731e-496a-be52-6d603d8824c9 (approver1@eventgo.vn)
INSERT INTO profiles (id, organization_id, email, full_name, phone, role)
VALUES
    ('e31ecfe6-6008-4ae5-aa9c-2cc65d2c191a', 'a0000000-0000-0000-0000-000000000001', 'pm1@eventgo.vn', 'Nguyễn Văn Quản Lý', '0901234567', 'PROJECT_MANAGER'),
    ('5ec73217-0087-49ec-8e34-5d3ee9402aea', 'a0000000-0000-0000-0000-000000000001', 'supervisor1@eventgo.vn', 'Nguyễn Văn Giám Sát', '0912345678', 'SUPERVISOR'),
    ('912cabb3-731e-496a-be52-6d603d8824c9', 'a0000000-0000-0000-0000-000000000001', 'approver1@eventgo.vn', 'Nguyễn Văn Duyệt', '0923456789', 'APPROVER')
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

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
    'e31ecfe6-6008-4ae5-aa9c-2cc65d2c191a'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    brand_name = EXCLUDED.brand_name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    created_by = EXCLUDED.created_by;

-- 4. Checklist Items (Master criteria for the campaign)
INSERT INTO checklist_items (id, campaign_id, title, description, category, is_required, order_index)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Lắp đặt gian hàng theo thiết kế 3D đã duyệt', 'Chụp góc rộng toàn cảnh gian hàng từ phía trước và hai mặt bên, đảm bảo đúng kết cấu và kích thước.', 'STRUCTURE', TRUE, 1),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Vị trí logo nhận diện thương hiệu', 'Chụp cận cảnh logo trên backdrop trung tâm và mặt trước quầy lễ tân, không bị che khuất hoặc nghiêng lệch.', 'BRANDING', TRUE, 2),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Standee và ấn phẩm POSM đầy đủ', 'Chụp toàn bộ standee khuyến mãi, tờ rơi giới thiệu và bảng báo giá được bố trí tại đúng vị trí quy định.', 'POSM', TRUE, 3),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Khu vực trưng bày sản phẩm hoàn thiện', 'Chụp các line kệ trưng bày sản phẩm thật, sản phẩm dùng thử (sampling) đủ số lượng theo bàn giao.', 'CONDITION', TRUE, 4),
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Nhân sự trực quầy (PG/PB) đúng giờ & trang phục chuẩn', 'Chụp đội ngũ nhân sự PG/PB có mặt tại gian hàng, mang thẻ sự kiện và mặc đồng phục đúng quy chuẩn.', 'STAFFING', TRUE, 5)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    order_index = EXCLUDED.order_index;

-- 5. Locations
INSERT INTO locations (id, campaign_id, organization_id, name, address, city, assigned_supervisor_id, assigned_approver_id, deadline)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Gian Hàng Sảnh A — Vincom Center Bà Triệu', '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng', 'Hà Nội', '5ec73217-0087-49ec-8e34-5d3ee9402aea', '912cabb3-731e-496a-be52-6d603d8824c9', '2026-06-15 18:00:00+07'),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Khu Hoạt Náo Sảnh Đông — Aeon Mall Hà Đông', 'Khu đô thị Dương Nội, Hà Đông', 'Hà Nội', '5ec73217-0087-49ec-8e34-5d3ee9402aea', '912cabb3-731e-496a-be52-6d603d8824c9', '2026-06-20 18:00:00+07'),
    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Quầy Kích Hoạt Trung Tâm — Lotte Mall West Lake', '272 Võ Chí Công, Tây Hồ', 'Hà Nội', '5ec73217-0087-49ec-8e34-5d3ee9402aea', '912cabb3-731e-496a-be52-6d603d8824c9', '2026-06-25 18:00:00+07')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    assigned_supervisor_id = EXCLUDED.assigned_supervisor_id,
    assigned_approver_id = EXCLUDED.assigned_approver_id;

-- 6. Submissions & Evidence Examples
INSERT INTO submissions (id, location_id, checklist_item_id, status, notes, submitted_by, submitted_at)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'APPROVED', 'Đã hoàn thiện lắp đặt khung sắt và sàn nâng theo đúng 3D.', '5ec73217-0087-49ec-8e34-5d3ee9402aea', '2026-06-10 10:00:00+07'),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'NEEDS_REVISION', 'Logo dán trên mặt trước quầy.', '5ec73217-0087-49ec-8e34-5d3ee9402aea', '2026-06-10 10:15:00+07'),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'SUBMITTED', 'Đã dựng 2 standee hai bên lối vào và đặt tờ rơi tại quầy.', '5ec73217-0087-49ec-8e34-5d3ee9402aea', '2026-06-10 14:30:00+07')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    submitted_by = EXCLUDED.submitted_by;

-- 7. Approval History
INSERT INTO approval_history (id, submission_id, reviewer_id, action, notes, created_at)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '912cabb3-731e-496a-be52-6d603d8824c9', 'APPROVE', 'Gian hàng đạt chuẩn thiết kế, kết cấu vững chãi.', '2026-06-10 11:00:00+07'),
    ('b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', '912cabb3-731e-496a-be52-6d603d8824c9', 'REQUEST_REVISION', 'Ảnh logo bị mờ và lóa đèn sảnh, vui lòng chụp lại rõ nét trực diện.', '2026-06-10 11:05:00+07')
ON CONFLICT (id) DO UPDATE SET
    action = EXCLUDED.action,
    notes = EXCLUDED.notes;

