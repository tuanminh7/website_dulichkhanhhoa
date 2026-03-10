# 🌍 Website Quảng Bá Du Lịch Khánh Hòa (Khanh Hoa Tourism)

> Nền tảng du lịch thông minh tích hợp AI và Google Maps giúp quảng bá vẻ đẹp của vùng đất Khánh Hòa, hỗ trợ du khách tối ưu hóa hành trình và chi phí.

![React](https://img.shields.io/badge/Frontend-React%20+%20Vite-blue?style=flat-square&logo=react)
![Flask](https://img.shields.io/badge/Backend-Flask-red?style=flat-square&logo=flask)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Container-Docker-blue?style=flat-square&logo=docker)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange?style=flat-square&logo=google-gemini)

---

## 📖 Mục lục

- [🎯 Giới thiệu](#-giới-thiệu)
- [✨ Tính năng nổi bật](#-tính-năng-nổi-bật)
- [🛠️ Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [🏗️ Kiến trúc dự án](#-kiến-trúc-dự-án)
- [📦 Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [🔐 Phân quyền hệ thống](#-phân-quyền-hệ-thống)
- [🚀 Lộ trình phát triển](#-lộ-trình-phát-triển)
- [🤝 Đóng góp](#-đóng-góp)

---

## 🎯 Giới thiệu

Dự án **Website Quảng Bá Du Lịch Khánh Hòa** được xây dựng nhằm cung cấp một giải pháp toàn diện cho du khách khi đến với "Xứ Trầm, Biển Yến". Không chỉ dừng lại ở việc cung cấp thông tin, hệ thống còn tích hợp trí tuệ nhân tạo (AI) và bản đồ trực quan để mang lại trải nghiệm cá nhân hóa tốt nhất.

**Giá trị cốt lõi:**
- 🏝️ **Quảng bá:** Giới thiệu sâu rộng về các địa danh, ẩm thực và văn hóa đặc sắc của Khánh Hòa.
- 🤖 **Thông minh:** Chatbot AI tư vấn lịch trình dựa trên sở thích và ngân sách người dùng.
- 🗺️ **Trực quan:** Tích hợp Google Maps API để quản lý tọa độ và lộ trình di chuyển.
- 📊 **Tiện ích:** Công cụ ước tính chi phí chi tiết, giúp du khách chủ động tài chính.

---

## ✨ Tính năng nổi bật

### 🗺️ Dành cho Du khách (Guest & User)
- **Khám phá đa dạng:** Tìm kiếm địa điểm du lịch, món ăn đặc sản và cơ sở lưu trú (khách sạn, homestay).
- **Trợ lý AI (Gemini):** Chatbot hỗ trợ giải đáp thắc mắc, gợi ý lịch trình 1 ngày/3 ngày hoặc theo yêu cầu đặc biệt.
- **Bản đồ tương tác:** Xem vị trí chính xác trên Google Maps, chỉ đường và tính toán khoảng cách.
- **Ước tính chi phí:** Hệ thống tự động tính toán tổng ngân sách dựa trên các địa điểm đã chọn.
- **Tin tức & Sự kiện:** Cập nhật các bài báo, sự kiện văn hóa mới nhất về du lịch tỉnh nhà.

### 👤 Dành cho Thành viên (Registered User)
- **Quản lý hành trình:** Lưu trữ các lịch trình yêu thích để xem lại sau này.
- **Lịch sử tư vấn:** Lưu vết các cuộc hội thoại với AI để tiếp tục hành trình đang dang dở.
- **Cá nhân hóa:** Hồ sơ người dùng lưu lại sở thích để AI đưa ra các gợi ý chính xác hơn.

### 🔑 Dành cho Quản lý (Admin)
- **Dashboard quản trị:** Thống kê tổng quan về dữ liệu hệ thống.
- **Quản lý nội dung:** Thêm/sửa/xóa địa điểm, danh mục, bài viết tin tức một cách linh hoạt.
- **Quản lý người dùng:** Kiểm soát danh sách thành viên và phân quyền truy cập.
- **Tự động hóa dữ liệu:** Công cụ import dữ liệu từ file markdown/template vào hệ thống nhanh chóng.

---

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18** (TypeScript, Vite)
- **Tailwind CSS / Vanilla CSS** - Giao diện hiện đại, responsive.
- **Google Maps JavaScript API** - Hiển thị bản đồ và chỉ đường.

### Backend
- **Python 3.10+** (Flask Framework)
- **SQLAlchemy** - ORM quản lý cơ sở dữ liệu.
- **Alembic/Flask-Migrate** - Quản lý migration.
- **Flask-JWT-Extended** - Bảo mật token.

### Cơ sở dữ liệu & DevOps
- **PostgreSQL** - Database chính cho production.
- **Docker & Docker Compose** - Đóng gói toàn bộ ứng dụng.
- **Nginx** - Reverse proxy serving frontend & media.

---

## 🏗️ Kiến trúc dự án

```bash
website_dulichkhanhhoa/
├── backend/               # Flask API
│   ├── app/               # Models, Routes, Services
│   ├── static/uploads/    # Thư viện hình ảnh
│   └── manage.py          # Lệnh CLI quản lý
├── frontend/              # React SPA
│   ├── src/
│   │   ├── pages/         # Guest, User, Admin Pages
│   │   ├── components/    # Reusable components
│   │   └── services/      # Axios API calls
├── docker-compose.yml     # Quản lý Docker services
└── README.md
```

---

## 📦 Hướng dẫn cài đặt

### 1. Triển khai nhanh với Docker
Gõ các lệnh sau tại thư mục gốc của dự án:

```bash
# Clone và chuyển vào thư mục dự án
git clone https://github.com/your-username/website_dulichkhanhhoa.git
cd website_dulichkhanhhoa

# Tạo file môi trường
cp .env.example .env

# Khởi chạy hệ thống (Frontend, Backend, Database, Nginx)
docker compose up -d --build
```

### 2. Khởi tạo dữ liệu (Lần đầu)
```bash
# Chạy migration database
docker exec website_dulichkhanhhoa-backend-1 python manage.py db upgrade

# Tạo dữ liệu nền tàng (Categories, Admin account)
docker exec website_dulichkhanhhoa-backend-1 python manage.py seed-baseline
```

---

## 🔐 Phân quyền hệ thống

| Tính năng | Guest | User | Admin |
| :--- | :---: | :---: | :---: |
| Xem địa điểm/Tin tức | ✅ | ✅ | ✅ |
| Chat với AI | ✅ | ✅ | ✅ |
| Ước tính chi phí | ✅ | ✅ | ✅ |
| Lưu lịch trình yêu thích | ❌ | ✅ | ✅ |
| Quản lý dữ liệu hệ thống | ❌ | ❌ | ✅ |
| Quản lý thành viên | ❌ | ❌ | ✅ |

---

## 🚀 Lộ trình phát triển

- [x] **Giai đoạn 1:** Xây dựng Core API và UI cơ bản.
- [x] **Giai đoạn 2:** Tích hợp AI Gemini và Google Maps.
- [/] **Giai đoạn 3:** Hoàn thiện hệ thống quản lý CMS & Tin tức.
- [ ] **Giai đoạn 4:** Triển khai Đa ngôn ngữ.
- [ ] **Giai đoạn 5:** Phát triển ứng dụng Mobile (React Native).

---

## 🤝 Đóng góp

1. Fork dự án.
2. Tạo nhánh (`git checkout -b feature/NewFeature`).
3. Commit (`git commit -m 'Add NewFeature'`).
4. Push (`git push origin feature/NewFeature`).
5. Tạo Pull Request.

---

## 📝 Giấy phép (License)

Dự án này được cấp phép theo MIT License.

---
**Phát triển với ❤️ cho du lịch Khánh Hòa**