-- Production Seed Data for PostgreSQL
-- Categories
INSERT INTO categories (name, icon, type) VALUES 
('Điểm đến tiêu biểu', 'map-pin', 'ATTRACTION'),
('Bãi biển & Vịnh', 'waves', 'ATTRACTION'),
('Văn hóa & Lịch sử', 'landmark', 'ATTRACTION'),
('Thiên nhiên & Sinh thái', 'trees', 'ATTRACTION'),
('Ẩm thực Ninh Thuận', 'utensils', 'FOOD'),
('Lưu trú nghỉ dưỡng', 'hotel', 'STAY')
ON CONFLICT DO NOTHING;

-- Locations & Images (Simplified INSERTs - adjust IDs if needed based on category auto-increment)
-- Note: This assumes categories IDs 1-6 in order of insertion above.

DO $$
DECLARE
    attraction_id INT;
    beach_id INT;
    culture_id INT;
    nature_id INT;
    food_id INT;
    stay_id INT;
BEGIN
    SELECT id INTO attraction_id FROM categories WHERE name = 'Điểm đến tiêu biểu';
    SELECT id INTO beach_id FROM categories WHERE name = 'Bãi biển & Vịnh';
    SELECT id INTO culture_id FROM categories WHERE name = 'Văn hóa & Lịch sử';
    SELECT id INTO nature_id FROM categories WHERE name = 'Thiên nhiên & Sinh thái';
    SELECT id INTO food_id FROM categories WHERE name = 'Ẩm thực Ninh Thuận';
    SELECT id INTO stay_id FROM categories WHERE name = 'Lưu trú nghỉ dưỡng';

    -- Insert Locations
    -- Biển Cà Ná
    INSERT INTO locations (name, category_id, description, address, status, rating_avg) 
    VALUES ('Biển Cà Ná', beach_id, 'Biển Cà Ná - Cung đường biển đẹp nhất Việt Nam.', 'Ninh Thuận', 'ACTIVE', 5.0);
    
    -- Bánh căn
    INSERT INTO locations (name, category_id, description, address, status, rating_avg) 
    VALUES ('Bánh căn', food_id, 'Bánh căn Ninh Thuận - Món ăn dân dã đặc trưng.', 'Ninh Thuận', 'ACTIVE', 4.8);
    INSERT INTO dishes (name, description, image_url) VALUES ('Bánh căn', 'Bánh căn Ninh Thuận - Món ăn dân dã đặc trưng.', '/static/images/anh/Bánh căn.webp');

    -- Hang Rái
    INSERT INTO locations (name, category_id, description, address, status, rating_avg) 
    VALUES ('Hang Rái', nature_id, 'Hang Rái - Tuyệt tác thiên nhiên ven biển.', 'Ninh Thuận', 'ACTIVE', 4.9);

    -- Vịnh Vĩnh Hy
    INSERT INTO locations (name, category_id, description, address, status, rating_avg) 
    VALUES ('Vịnh Vĩnh Hy', beach_id, 'Vịnh Vĩnh Hy - Một trong những vịnh đẹp nhất Việt Nam.', 'Ninh Thuận', 'ACTIVE', 5.0);

    -- Tháp Po Klong Garai
    INSERT INTO locations (name, category_id, description, address, status, rating_avg) 
    VALUES ('Tháp Po Klong Garai', culture_id, 'Tháp Po Klong Garai - Di tích Chăm cổ kính.', 'Ninh Thuận', 'ACTIVE', 4.9);

    -- Images
    INSERT INTO location_images (location_id, image_url, is_primary) 
    SELECT id, '/static/images/anh/Biển Cà Ná.jpg', true FROM locations WHERE name = 'Biển Cà Ná';
    
    INSERT INTO location_images (location_id, image_url, is_primary) 
    SELECT id, '/static/images/anh/Bánh căn.webp', true FROM locations WHERE name = 'Bánh căn';
    
    INSERT INTO location_images (location_id, image_url, is_primary) 
    SELECT id, '/static/images/anh/Hang Rái.webp', true FROM locations WHERE name = 'Hang Rái';
    
    INSERT INTO location_images (location_id, image_url, is_primary) 
    SELECT id, '/static/images/anh/Vịnh Vĩnh Hy.jpg', true FROM locations WHERE name = 'Vịnh Vĩnh Hy';
    
    INSERT INTO location_images (location_id, image_url, is_primary) 
    SELECT id, '/static/images/anh/Tháp Po Klong Garai.jpg', true FROM locations WHERE name = 'Tháp Po Klong Garai';

    -- Remaining items can be added similarly...
END $$;
