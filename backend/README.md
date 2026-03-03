# Website Du lịch Khánh Hòa - Backend

Đây là project Backend cho dự án Website Du lịch Khánh Hòa, được xây dựng bằng Flask (Python).

## 🚀 Tính năng chính
- Quản lý địa điểm du lịch, ẩm thực, lưu trú.
- Hệ thống xác thực người dùng (JWT).
- **AI Chatbot**: Tư vấn du lịch thông minh sử dụng Google Gemini.
- Tự động gợi ý lịch trình (Smart Itinerary).
- Tương tác với Google Maps (Vị trí, chỉ đường).

## 🛠️ Yêu cầu hệ thống
- Python 3.9+
- MySQL hoặc PostgreSQL (SQLAlchemy hỗ trợ cả hai).
- API Key của Google Gemini và Google Maps.

## 📦 Cài đặt

1. **Clone repository**:
   ```bash
   git clone <repository_url>
   cd website_dulichkhanhhoa/backend
   ```

2. **Tạo môi trường ảo (Virtual Environment)**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Trên Linux/macOS
   # hoặc
   venv\Scripts\activate     # Trên Windows
   ```

3. **Cài đặt phụ thuộc**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Cấu hình biến môi trường**:
   - Copy file `.env.example` thành `.env`.
   - Cập nhật các thông số: `DB_URL`, `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`.

5. **Khởi tạo Database**:
   ```bash
   flask db upgrade
   ```

## 🏃 Chạy ứng dụng
```bash
python manage.py
# Server sẽ chạy tại http://localhost:5000
```

## 🤖 API AI Chat (Localhost:5000)
Để test tính năng AI Chat, bạn có thể sử dụng endpoint sau:
- **POST** `/api/ai/chat`
- Xem chi tiết tại [POSTMAN_TEST_DATA.md](./POSTMAN_TEST_DATA.md).

## 📄 Tài liệu chi tiết
- [Cấu trúc thư mục & Logic](./README_BACKEND.md)
- [Hướng dẫn Test Postman](./POSTMAN_TEST_DATA.md)

---
*Phát triển bởi Team Website Du lịch Khánh Hòa.*
