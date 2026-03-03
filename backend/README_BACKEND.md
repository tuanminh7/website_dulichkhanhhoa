# Tài liệu Backend - Dự án Website Du lịch Khánh Hòa

Tài liệu này cung cấp cái nhìn chi tiết về cấu trúc thư mục, chức năng của từng file và luồng xử lý dữ liệu của hệ thống Backend.

---

## � Cấu trúc Thư mục Gốc (`/backend`)

| File | Chức năng |
| :--- | :--- |
| `run.py` | **Entry point**. Khởi chạy Flask development server. Thiết lập host/port và các thông số chạy nền. |
| `manage.py` | Công cụ dòng lệnh (CLI) để quản lý Database (Migrate, Upgrade, Downgrade) và các tác vụ admin khác. |
| `config.py` | Quản lý cấu hình tập trung. Bao gồm cấu hình cho Development/Production, kết nối SQL, Secret Keys và API Keys (Gemini, Google Maps). |
| `requirements.txt` | Chứa tất cả các phụ thuộc của Python (Flask, SQLAlchemy, Google Generative AI, v.v.). |
| `.env.example` | File mẫu chứa các biến môi trường cần thiết (DB_URL, API_KEYS). |
| `Dockerfile` | Cấu hình Docker để đóng gói ứng dụng lên môi trường production. |

---

## 📦 Gói ứng dụng chính (`/app`)

### `app/__init__.py`
Sử dụng mô hình **Application Factory**. Hàm `create_app()` chịu trách nhiệm:
- Khởi tạo đối tượng Flask.
- Cấu hình SQLAlchemy và CORS.
- Đăng ký tất cả các Blueprint (Route) từ thư mục `routes/`.

---

### 🗄️ Models (`/app/models/`)
Quản lý cấu trúc dữ liệu và logic liên quan đến Database (SQLAlchemy):

- **`user.py`**: Định nghĩa bảng `User` (thông tin cá nhân, mật khẩu hash) và `UserPreference` (sở thích du lịch).
- **`location.py`**: Model quan trọng nhất. 
    - `Location`: Lưu thông tin địa điểm, tọa độ, mô tả. Có property `map_url` để tự động tạo link Google Maps.
    - `Category`: Phân loại địa điểm (Ẩm thực, Lưu trú, Tham quan).
    - `LocationImage`: Quản lý thư viện ảnh cho mỗi địa điểm.
    - `OpeningHour`: Quản lý thời gian đóng/mở cửa.
- **`dish.py`**: Định nghĩa các món ăn đặc sản (`Dish`) gắn liền với các địa điểm ẩm thực.
- **`amenity.py`**: Các tiện ích (Wifi, Chỗ đỗ xe, Hồ bơi...) của địa điểm.
- **`interaction.py`**: Lưu trữ tương tác người dùng gồm `Review` (Đánh giá), `Favorite` (Yêu thích) và `Itinerary` (Lịch trình đã lưu).
- **`ai.py`**: Quản lý lịch sử chat (`ChatSession`, `ChatMessage`) để Chatbot AI có thể nhớ ngữ cảnh.
- **`analytics.py`**: Lưu trữ các thống kê hệ thống ( lượt truy cập, lượt tìm kiếm).

---

### 🛣️ Routes (`/app/routes/`)
Nơi tiếp nhận và phản hồi yêu cầu từ Frontend:

- **`auth.py`**: Xử lý Đăng ký, Đăng nhập (JWT), Đăng xuất.
- **`places.py`**: Tìm kiếm, lọc địa điểm theo danh mục, vị trí và xem chi tiết một địa điểm.
- **`user.py`**: Quản lý Profile, xem danh sách yêu thích và lịch trình đã lưu của người dùng.
- **`admin.py`**: Các Endpoint dành riêng cho quản trị viên: Quản lý người dùng, duyệt địa điểm, xem báo cáo thống kê.
- **`ai.py`**: Cổng kết nối với Chatbot. Tiếp nhận tin nhắn và trả về phản hồi từ Gemini.
- **`maps.py`**: Cung cấp dữ liệu về tọa độ, tính toán khoảng cách/thời gian di chuyển phục vụ cho việc hiển thị bản đồ.
- **`main.py`**: Chứa các route cơ bản và endpoint `/health` để kiểm tra trạng thái server.

---

### 🛠️ Services (`/app/services/`)
Tầng xử lý logic nghiệp vụ phức tạp (Business Logic):

- **`ai_service.py`**: Kết nối trực tiếp với Google Gemini API. Xử lý Prompt engineering để AI tư vấn du lịch chính xác nhất.
- **`itinerary_service.py`**: Thuật toán tự động sắp xếp lịch trình dựa trên các địa điểm người dùng chọn hoặc sở thích của họ.
- **`maps_service.py`**: Giao tiếp với Google Maps Platform để lấy dữ liệu địa lý nâng cao.
- **`places_service.py`**: Xử lý các logic lọc, tìm kiếm phức tạp và thống kê xếp hạng địa điểm.
- **`auth_service.py`**: Logic xử lý Token JWT, kiểm tra quyền hạn và mã hóa mật khẩu.
- **`admin_service.py`**: Logic tổng hợp dữ liệu báo cáo và quản lý tài nguyên hệ thống.
- **`user_service.py`**: Xử lý logic nghiệp vụ liên quan đến thông tin và hành vi người dùng.

---

### 🔧 Utilities (`/app/utils/`)
Công cụ hỗ trợ dùng chung:

- **`auth.py`**: Các Decorator như `@login_required`, `@admin_required` để bảo vệ các Route.
- **`helpers.py`**: Các hàm bổ trợ về xử lý chuỗi, định dạng ngày tháng, phản hồi API chuẩn hóa.

---

## 🔄 Luồng xử lý cơ bản (Request Flow)
1. **Frontend** gửi request tới một Endpoint trong `routes/`.
2. **Routes** kiểm tra quyền (nếu cần) thông qua `utils/auth.py`.
3. **Routes** gọi hàm tương ứng trong tầng **Services**.
4. **Services** tương tác với **Models** để lấy dữ liệu từ DB hoặc gọi API bên ngoài (Gemini/Google Maps).
5. **Services** xử lý logic và trả kết quả cho **Routes**.
6. **Routes** định dạng dữ liệu và gửi phản hồi JSON về cho **Frontend**.

---
*Tài liệu này được cập nhật vào ngày 22/02/2026 bởi Hoàng Nguyên.*
