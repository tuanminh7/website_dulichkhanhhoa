# Hướng dẫn Test API với Postman - Website Du lịch Khánh Hòa

Tài liệu này cung cấp các mẫu dữ liệu (JSON) để bạn dễ dàng nhập vào Postman và kiểm tra các tính năng của Backend.

## 1. Xác thực (Authentication)

### 🔐 Đăng ký tài khoản (Register)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/auth/register`
- **Body (JSON)**:
```json
{
    "username": "nguyentest",
    "email": "test@example.com",
    "password": "password123"
}
```

### 🔑 Đăng nhập (Login)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/auth/login`
- **Body (JSON)**:
```json
{
    "username": "nguyentest",
    "password": "password123",
    "remember": true
}
```

---

## 2. Quản lý Địa điểm (Places/Locations)

### 📍 Tạo địa điểm đơn lẻ (Single Location)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/places`
- **Headers**: `Content-Type: application/json` (Lưu ý: Route hiện tại đang hỗ trợ `multipart/form-data` cho upload ảnh, nhưng bạn có thể test JSON nếu chỉ gửi text)
- **Body (JSON)**:
```json
{
    "name": "Tháp Bà Ponagar",
    "category_id": 1,
    "description": "Di tích lịch sử văn hóa Chăm nổi tiếng tại Nha Trang.",
    "address": "2 Tháng 4, Vĩnh Phước, Nha Trang, Khánh Hòa",
    "latitude": 12.2653,
    "longitude": 109.1958,
    "price_range_min": 30000,
    "price_range_max": 30000
}
```

### 🚌 Tạo một Tour (Location with Path)
Đây là cách lưu Tour mà không cần tọa độ cho từng điểm dừng, chỉ cần danh sách tên.
- **Method**: `POST`
- **URL**: `{{base_url}}/api/places`
- **Body (JSON)**:
```json
{
    "name": "Tour 3 Đảo Nha Trang",
    "category_id": 4,
    "description": "Vịnh San Hô - Làng Chài - Bãi Tranh",
    "address": "Cảng Vĩnh Trường, Nha Trang",
    "path": [
        "Vịnh San Hô, Nha Trang",
        "Làng Chài, Nha Trang",
        "Bãi Tranh, Nha Trang"
    ]
}
```

---

## 3. Bản đồ & Chỉ đường (Maps)

### 🗺️ Lấy Link bản đồ & Chỉ đường (Get Map URLs)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/maps/urls`
- **Body (JSON)**:
```json
{
    "latitude": 12.2467,
    "longitude": 109.1942,
    "name": "Chợ Đầm"
}
```

### 🛣️ Lấy Link chỉ đường giữa 2 điểm (Get Directions)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/maps/directions-link`
- **Body (JSON)**:
```json
{
    "origin": "Sân bay Cam Ranh",
    "destination_latitude": 12.2467,
    "destination_longitude": 109.1942,
    "mode": "driving"
}
```

---

## 4. Lịch trình Thông minh (Smart Itinerary)

### 🤖 Gợi ý lịch trình bằng AI (Generate Itinerary)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/ai/generate-itinerary`
- **Body (JSON)**:
```json
{
    "duration": 3,
    "budget": "ECONOMY",
    "interests": ["Bãi biển", "Ẩm thực", "Lịch sử"],
    "start_date": "2024-06-01"
}
```

---

## 5. AI Chat & Hỗ trợ thông minh (AI Chatbot)

### 💬 Chat với AI (Chat with AI)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/ai/chat`
- **Body (JSON)**:
```json
{
    "message": "Cho tôi biết các địa điểm tham quan nổi tiếng ở Nha Trang!",
    "session_id": null
}
```
> [!TIP]
> **session_id**: Bạn có thể gửi `null` cho tin nhắn đầu tiên. Server sẽ trả về một `session_id`. Hãy dùng ID đó cho các tin nhắn tiếp theo để AI nhớ ngữ cảnh.

### 🔄 Tiếp tục trò chuyện (Continue Chat)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/ai/chat`
- **Body (JSON)**:
```json
{
    "message": "Thế còn ẩm thực thì sao? Chỗ nào ăn ngon?",
    "session_id": "paste-your-session-id-here"
}
```

### 📍 Hỏi về địa điểm cụ thể (Ask about Specific Places)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/ai/chat`
- **Body (JSON)**:
```json
{
    "message": "Tôi nên đi đâu trong số các địa điểm này?",
    "place_ids": [1, 2, 5],
    "session_id": null
}
```

### 💰 Ước tính chi phí (Estimate Cost - AI driven)
- **Method**: `POST`
- **URL**: `{{base_url}}/api/ai/estimate-cost`
- **Body (JSON)**:
```json
{
    "itinerary": {
        "days": 3,
        "places": ["Tháp Bà Ponagar", "Vinpearl Harbour", "Bãi Tranh"],
        "budget": "ECONOMY"
    }
}
```

---

## 💡 Lưu ý quan trọng
- **Base URL**: Thường là `http://127.0.0.1:5000` (nếu chạy local).
- **Cookies**: Postman tự động lưu Session Cookie sau khi Login, nên các request sau đó (như `/me` hoặc `/places` POST) sẽ tự động được authenticate.
- **CSRF**: Hệ thống hiện tại không bắt buộc CSRF token cho API đơn giản, nhưng nếu có lỗi 403, hãy kiểm tra quyền Admin của User.

Bạn có thể copy-paste các JSON trên vào tab **Body** -> **raw** -> **JSON** trong Postman để test nhé!
