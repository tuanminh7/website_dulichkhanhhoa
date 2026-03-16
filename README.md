# 🌍 Website Quảng Bá Du Lịch Địa Phương

> Hệ thống du lịch thông minh tích hợp AI và Google Maps để quảng bá du lịch địa phương, hỗ trợ tư vấn lịch trình tự động và ước tính chi phí.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Flask](https://img.shields.io/badge/flask-2.0+-red)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Sử dụng](#-sử-dụng)
- [API Endpoints](#-api-endpoints)
- [Phân quyền](#-phân-quyền)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

---

## 🎯 Giới thiệu

Website quảng bá du lịch địa phương là một nền tảng **du lịch thông minh** giúp:

- ✅ Quảng bá điểm du lịch, ẩm thực, lưu trú địa phương
- ✅ Tư vấn lịch trình du lịch tự động bằng AI
- ✅ Ước tính chi phí chuyến đi chi tiết
- ✅ Hiển thị bản đồ và lộ trình di chuyển
- ✅ Cá nhân hóa trải nghiệm theo sở thích người dùng
- ✅ Định hướng du lịch xanh và bền vững

### 🎯 Mục tiêu dự án

| Mục tiêu | Mô tả |
|----------|-------|
| **Quảng bá địa phương** | Giới thiệu điểm đến, văn hóa, ẩm thực độc đáo |
| **Hỗ trợ du khách** | Tìm kiếm thông tin nhanh chóng, dễ dàng |
| **AI tư vấn** | Gợi ý lịch trình thông minh theo sở thích |
| **Trực quan hóa** | Google Maps hiển thị bản đồ và lộ trình |
| **Cá nhân hóa** | Trải nghiệm phù hợp với từng người dùng |
| **Du lịch xanh** | Khuyến khích du lịch bền vững |

---

## ✨ Tính năng

### 🏠 Dành cho tất cả người dùng (Guest & User)

- 🗺️ **Xem danh sách địa điểm du lịch** - Danh mục theo loại hình
- 🍜 **Khám phá ẩm thực địa phương** - Món ăn, quán ăn nổi tiếng
- 🏨 **Tìm kiếm lưu trú** - Homestay, khách sạn, resort
- 🤖 **Chatbot AI tư vấn** - Hỏi đáp tự nhiên về du lịch
- 💰 **Ước tính chi phí** - Tính toán ngân sách chuyến đi
- 📍 **Bản đồ Google Maps** - Hiển thị điểm đến và lộ trình
- 🛣️ **Chỉ đường** - Khoảng cách và thời gian di chuyển

### 👤 Dành cho User đã đăng ký

- 💾 **Lưu lịch trình yêu thích** - Truy cập lại bất cứ lúc nào
- 📜 **Xem lịch sử chat** - Theo dõi các cuộc tư vấn trước đó
- 🎯 **AI cá nhân hóa** - Gợi ý dựa trên sở thích đã lưu
- ⭐ **Đánh giá địa điểm** - Chia sẻ trải nghiệm

### 🔑 Dành cho Admin

- ➕ **Quản lý địa điểm** - Thêm, sửa, xóa điểm du lịch
- 🖼️ **Upload hình ảnh** - Quản lý thư viện ảnh
- 💵 **Cập nhật chi phí** - Dữ liệu tham khảo cho AI
- 📊 **Thống kê** - Xem báo cáo sử dụng hệ thống
- 👥 **Quản lý người dùng** - Danh sách user và hoạt động

---

## 🛠️ Công nghệ sử dụng

### Frontend

```
HTML5, CSS3, JavaScript (ES6+)
Bootstrap 5 - Responsive UI
jQuery - DOM manipulation
Google Maps JavaScript API
```

### Backend

```
Python 3.8+
Flask - Web framework
Flask-SQLAlchemy - ORM
Flask-Login - Authentication
Flask-CORS - API security
```

### AI & Machine Learning

```
OpenAI API / Google AI API - Chatbot & NLP
Prompt Engineering - AI optimization
Python AI libraries
```

### Database

```
SQLite (Development)
MySQL / PostgreSQL (Production)
```

### APIs

```
Google Maps JavaScript API - Bản đồ
Google Places API - Thông tin địa điểm
Google Directions API - Tuyến đường
Google Geocoding API - Tọa độ
OpenAI API - AI chatbot
```

---

## 🏗️ Kiến trúc hệ thống

### Mô hình tổng quan

```
┌─────────────┐
│   Browser   │ (HTML/CSS/JS + Google Maps)
└──────┬──────┘
       │ HTTP/HTTPS
       ↓
┌─────────────┐
│ Flask App   │ (Routes, Business Logic)
└──────┬──────┘
       │
   ────┼────────────────────
   │   │        │          │
   ↓   ↓        ↓          ↓
┌────┐ ┌────┐ ┌────┐  ┌────────┐
│ DB │ │ AI │ │Maps│  │Session │
└────┘ └────┘ └────┘  └────────┘
```



---

## 📦 Cài đặt

### Yêu cầu hệ thống

- Python 3.8 trở lên
- pip hoặc pipenv
- Git

### Các bước cài đặt

1. **Clone repository**

```bash
git clone https://github.com/your-username/tourism-website.git
cd tourism-website
```

2. **Tạo virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. **Cài đặt dependencies**

```bash
pip install -r requirements.txt
```

4. **Cấu hình file .env**

```bash
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn
```

5. **Chạy migration**

```bash
make db-upgrade
```

`Makefile` sẽ tự ưu tiên `.venv/bin/python`, nếu không có sẽ fallback sang `python3`.

Nếu muốn đồng bộ lại tài khoản admin theo `.env` hiện tại, dùng `make sync-admin`.

6. **Seed dữ liệu nền**

```bash
make seed-baseline
```

7. **Chạy ứng dụng**

```bash
make run-backend
```

Truy cập: `http://localhost:5000`

Hoặc nếu muốn chạy liền một mạch theo flow production local:

```bash
make bootstrap
```

---

## ⚙️ Cấu hình

### File `.env`

```env
# Flask
SECRET_KEY=your-secret-key-here
FLASK_ENV=development

# Database
DATABASE_URL=sqlite:///tourism.db

# OpenAI API
GEMINI_API_KEY=.....

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-key-here

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```


### Docker production flow

- Lần deploy đầu, backend container sẽ tự chạy `python manage.py bootstrap-production`
- Lệnh này gồm 3 bước: chờ DB sẵn sàng → `db upgrade` → `seed-baseline`
- `seed-baseline` chỉ tạo dữ liệu nền idempotent: 3 category mặc định và tài khoản admin nếu chưa tồn tại
- Không tự seed dữ liệu demo vào production

```bash
docker compose up -d --build
```

Nếu chỉ muốn chạy backend stack để kiểm tra:

```bash
make docker-backend
```

Các lệnh vận hành nhanh khác:

```bash
make help
make docker-up
make docker-logs-backend
make docker-down
```

### Lấy API Keys

**OpenAI API:**
1. Truy cập https://platform.openai.com/
2. Tạo tài khoản và API key
3. Copy key vào `.env`

**Google Maps API:**
1. Truy cập https://console.cloud.google.com/
2. Tạo project mới
3. Bật các API:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Tạo API key và copy vào `.env`

---

## 🚀 Sử dụng

### Dành cho Guest (Khách vãng lai)

1. Truy cập trang chủ
2. Xem danh sách địa điểm du lịch
3. Chat với AI để được tư vấn lịch trình
4. Xem bản đồ và ước tính chi phí
5. *(Tùy chọn)* Đăng ký để lưu lịch trình

### Dành cho User đã đăng ký

1. Đăng nhập vào hệ thống
2. Sử dụng đầy đủ tính năng như Guest
3. **Thêm:** Lưu lịch trình yêu thích
4. **Thêm:** Xem lại lịch sử chat
5. **Thêm:** Nhận gợi ý cá nhân hóa

### Dành cho Admin

1. Đăng nhập trang quản trị `/admin`
2. Thêm địa điểm mới:
   - Nhập thông tin (tên, mô tả, địa chỉ)
   - Upload hình ảnh
   - Nhập chi phí tham khảo
   - Tọa độ tự động từ địa chỉ
3. Quản lý nội dung
4. Xem thống kê

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | No |
| POST | `/api/auth/login` | Đăng nhập | No |
| POST | `/api/auth/logout` | Đăng xuất | Yes |

### Places

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/places` | Danh sách địa điểm | No |
| GET | `/api/places/<id>` | Chi tiết địa điểm | No |
| POST | `/api/places` | Thêm địa điểm | Admin |
| PUT | `/api/places/<id>` | Cập nhật | Admin |
| DELETE | `/api/places/<id>` | Xóa | Admin |

### AI Chatbot

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/ai/chat` | Chat với AI | No |
| POST | `/api/ai/itinerary` | Tạo lịch trình | No |
| POST | `/api/ai/suggest` | Gợi ý địa điểm | No |
# AI Tourism Chatbot - Khánh Hòa Travel AI

Tính năng chatbot tư vấn du lịch thông minh tích hợp Google Gemini AI, chuyên về du lịch Khánh Hòa và Ninh Thuận.

---

## Tổng quan

Chatbot sử dụng mô hình **Google Gemini 2.5 Flash** để tư vấn du lịch theo thời gian thực (streaming). Hệ thống có khả năng thăm dò sở thích người dùng, gợi ý địa điểm phù hợp kèm ảnh minh họa, và lên lịch trình chi tiết theo yêu cầu.

---

## Kiến trúc hệ thống

```
Frontend (React/TypeScript)
    └── Chatbot.tsx          # Giao diện chat, xử lý SSE stream
    
Backend (Flask/Python)
    ├── routes/ai.py         # API endpoints
    ├── services/ai_service.py   # Tích hợp Gemini API
    └── models/ai.py         # Database models
    
Database
    ├── chat_sessions        # Phiên hội thoại
    └── chat_messages        # Lịch sử tin nhắn

Redis
    └── Rate limiting, Guest limit, Response cache
```

---

## Cài đặt

### Yêu cầu

- Python 3.10+
- Node.js 18+
- Redis (hoặc Docker)
- Google Gemini API Key

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Thêm vào file `.env`:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-preview-04-17
```

Lấy API key miễn phí tại: https://aistudio.google.com/app/apikey

### Redis

```bash
# Dùng Docker
docker run -d -p 6379:6379 --restart always redis
```

### Khởi động

```bash
# Backend
cd backend
python manage.py

# Frontend
cd frontend
npm install
npm run dev
```

---

## Cấu trúc file

```
backend/
├── app/
│   ├── routes/
│   │   └── ai.py                # API routes
│   ├── services/
│   │   └── ai_service.py        # Gemini AI service
│   ├── models/
│   │   └── ai.py                # ChatSession, ChatMessage, CostReference
│   └── data/
│       └── data_chat.txt        # Knowledge base địa điểm du lịch
├── static/
│   └── uploads/
│       └── images/
│           └── anh/             # Ảnh minh họa địa điểm (45 ảnh)
└── .env

frontend/
└── src/
    └── components/
        └── chat/
            └── Chatbot.tsx      # Component giao diện chat
```

---

## API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/ai/chat` | Gửi tin nhắn, nhận stream SSE | Optional |
| POST | `/api/ai/sessions` | Tạo phiên hội thoại mới | Optional |
| GET | `/api/ai/sessions` | Lấy danh sách sessions | Required |
| GET | `/api/ai/sessions/:id/messages` | Lấy lịch sử tin nhắn | Optional |
| GET | `/api/ai/img/:id` | Serve ảnh minh họa | Public |
| POST | `/api/ai/generate-itinerary` | Tạo lịch trình tự động | Public |
| POST | `/api/ai/suggest-places` | Gợi ý địa điểm | Public |
| POST | `/api/ai/estimate-cost` | Ước tính chi phí | Public |

### Ví dụ gửi tin nhắn

```bash
curl -X POST /api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": 1, "message": "Tư vấn địa điểm du lịch Khánh Hòa"}'
```

Response trả về dạng **Server-Sent Events (SSE)**:

```
data: {"session_id": 1}
data: {"text": "Tuyệt vời! Khánh Hòa có..."}
data: {"text": " rất nhiều loại hình..."}
data: {"done": true, "ai_message": {...}}
```

---

## Tính năng chính

### 1. Tư vấn thông minh theo sở thích

Khi người dùng hỏi chung chung, AI sẽ hỏi thăm dò trước:

```
User: "Tư vấn địa điểm du lịch Khánh Hòa"

AI: "Bạn muốn loại hình du lịch nào?
     - Du lịch biển
     - Nghỉ dưỡng
     - Sinh thái / Thiên nhiên
     - Phượt / Khám phá
     - Cắm trại / Glamping
     - Ẩm thực và văn hóa"
```

Sau khi người dùng chọn, AI liệt kê địa điểm phù hợp kèm ảnh minh họa.

### 2. Ảnh minh họa tự động

AI tự động chèn ảnh sau mỗi địa điểm được giới thiệu. Ảnh được phục vụ qua endpoint `/api/ai/img/:id` từ thư mục local.

Hiện có **45 ảnh** bao gồm:
- Bãi biển, vịnh biển (Vịnh Vĩnh Hy, Điệp Sơn, Bãi Tràng...)
- Địa điểm văn hóa (Tháp Po Klong Garai, Tháp Bà Ponagar...)
- Thiên nhiên (Vườn quốc gia Núi Chúa, Rừng thông Khánh Sơn...)
- Ẩm thực (Bún sứa, Bánh căn...)

### 3. Streaming realtime

Phản hồi được trả về từng chunk qua SSE, người dùng thấy chữ hiện ra dần thay vì chờ toàn bộ.

### 4. Giới hạn khách (Guest Limit)

Người dùng chưa đăng nhập được chat tối đa **3 tin nhắn**. Sau đó hiện modal yêu cầu đăng nhập.

### 5. Rate Limiting

Mỗi user/IP tối đa **5 request/phút**. Lưu trữ bằng Redis.

### 6. Cache phản hồi

Các câu hỏi giống nhau sẽ trả về từ cache Redis (TTL 1 giờ) thay vì gọi lại Gemini API.

### 7. Knowledge Base

AI được nạp dữ liệu từ file `data_chat.txt` chứa thông tin chi tiết về các địa điểm du lịch Ninh Thuận và Khánh Hòa. Dữ liệu này được ưu tiên cao nhất trong câu trả lời.

---

## Cấu hình

| Biến môi trường | Mô tả | Mặc định |
|----------------|-------|----------|
| `GEMINI_API_KEY` | API key Google Gemini | Bắt buộc |
| `GEMINI_MODEL` | Tên model Gemini | `gemini-2.5-flash-preview-04-17` |
| `AI_TEMPERATURE` | Độ sáng tạo (0.0 - 1.0) | `0.8` |
| `AI_MAX_TOKENS` | Token tối đa mỗi phản hồi | `8192` |

---

## Xử lý lỗi thường gặp

### Redis không kết nối được

```
redis.exceptions.ConnectionError: Error 10061 connecting to localhost:6379
```

Khởi động Redis:
```bash
docker run -d -p 6379:6379 redis
```

### Gemini API timeout / 503

```
Timeout of 600.0s exceeded
503 failed to connect to all addresses
```

Nguyên nhân: mạng bị chặn kết nối tới Google API. Giải pháp:
- Bật VPN
- Đổi DNS sang `8.8.8.8`
- Kiểm tra firewall

### Ảnh không hiển thị (500)

Kiểm tra đường dẫn thư mục ảnh trong `routes/ai.py`:
```python
pathlib.Path(r'C:\đường\dẫn\thực\tới\backend\static\uploads\images\anh')
```

### GEMINI_API_KEY not configured

Kiểm tra file `.env` có đúng vị trí không (cùng thư mục với `config.py`) và key không bị trống.

---

## Phát triển thêm

- Bổ sung knowledge base Khánh Hòa vào `data_chat.txt`
- Thêm ảnh địa điểm vào thư mục `static/uploads/images/anh/`
- Tích hợp Google Maps để hiển thị bản đồ địa điểm
- Thêm tính năng lưu và xuất lịch trình ra PDF

### Maps

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/maps/route` | Tính lộ trình | No |
| POST | `/api/maps/geocode` | Lấy tọa độ | Admin |

### User Dashboard

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/user/itineraries` | Lịch trình đã lưu | User |
| POST | `/api/user/itineraries` | Lưu lịch trình | User |
| GET | `/api/user/chat-history` | Lịch sử chat | User |

---

## 👥 Phân quyền

### 🌐 Guest (Khách vãng lai)

- ✅ Xem tất cả địa điểm
- ✅ Chat AI tư vấn
- ✅ Xem bản đồ
- ❌ Không lưu được lịch trình
- ❌ Không có lịch sử chat

### 👤 User (Đã đăng ký)

- ✅ Tất cả quyền của Guest
- ✅ **Lưu lịch trình yêu thích**
- ✅ **Xem lịch sử chat**
- ✅ **AI cá nhân hóa**
- ✅ Đánh giá địa điểm

### 🔑 Admin

- ✅ Tất cả quyền của User
- ✅ **Quản lý địa điểm**
- ✅ **Upload hình ảnh**
- ✅ **Xem thống kê**
- ✅ **Quản lý người dùng**

---

## 📸 Screenshots

*(Thêm screenshots của dự án tại đây)*

```
[Trang chủ]  [Danh sách địa điểm]  [AI Chatbot]  [Google Maps]  [Admin Panel]
```

---

## 🗺️ Roadmap

### Phase 1 - MVP (Hiện tại)
- [x] Hệ thống authentication cơ bản
- [x] Quản lý địa điểm
- [x] AI chatbot tư vấn
- [x] Google Maps integration
- [x] Ước tính chi phí

### Phase 2 - Tính năng nâng cao
- [ ] Đa ngôn ngữ (Tiếng Việt, English)
- [ ] Đánh giá và review
- [ ] Tích hợp thanh toán
- [ ] Đặt tour online
- [ ] Ứng dụng mobile (React Native)

### Phase 3 - AI & ML
- [ ] Machine Learning cá nhân hóa
- [ ] Phân tích sentiment review
- [ ] Dự đoán xu hướng du lịch
- [ ] Chatbot đa ngôn ngữ

### Phase 4 - Mở rộng
- [ ] Kết nối doanh nghiệp địa phương
- [ ] Hệ thống đối tác
- [ ] API public cho third-party
- [ ] Social features (chia sẻ lịch trình)

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng làm theo các bước:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### Coding Guidelines

- Sử dụng PEP 8 cho Python code
- Comment code rõ ràng
- Viết unit tests cho features mới
- Cập nhật documentation

---

## 📝 License

Dự án này được phát hành dưới giấy phép MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 📞 Liên hệ

- **Email**: your-email@example.com
- **Website**: https://your-website.com
- **Facebook**: https://facebook.com/your-page

---

## 🙏 Cảm ơn

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Gemini]
- [Google Maps Platform](https://developers.google.com/maps) - Maps API
- [Bootstrap](https://getbootstrap.com/) - UI framework

---

**Made with ❤️ for local tourism**