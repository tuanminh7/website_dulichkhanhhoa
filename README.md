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

5. **Khởi tạo database**

```bash
flask db init
flask db migrate
flask db upgrade
```

6. **Chạy ứng dụng**

```bash
python run.py
```

Truy cập: `http://localhost:5000`

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
- [OpenAI](https://openai.com/) - AI API
- [Google Maps Platform](https://developers.google.com/maps) - Maps API
- [Bootstrap](https://getbootstrap.com/) - UI framework

---

**Made with ❤️ for local tourism**