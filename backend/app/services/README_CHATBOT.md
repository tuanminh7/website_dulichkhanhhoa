# Chatbot Logic README

## Mục đích

File này mô tả logic hiện tại của chatbot du lịch trong dự án, dựa trên các thành phần chính:

- `backend/app/routes/ai.py`
- `backend/app/services/ai_service.py`
- `backend/app/models/ai.py`
- `backend/app/data/data_chat.txt`

Chatbot dùng Google Gemini để tư vấn du lịch Khánh Hòa và Ninh Thuận, hỗ trợ:

- Chat theo thời gian thực bằng SSE
- Giới hạn lượt chat cho guest
- Rate limit theo user/IP
- Lưu phiên chat và lịch sử tin nhắn
- Gợi ý địa điểm, tạo lịch trình, ước tính chi phí
- Chèn ảnh minh họa vào câu trả lời bằng Markdown

## Thành phần chính

### 1. Route layer

File: `backend/app/routes/ai.py`

Chịu trách nhiệm:

- Nhận request từ frontend
- Kiểm tra quyền truy cập
- Giới hạn số lượt chat và tốc độ chat
- Tạo hoặc lấy `ChatSession`
- Lấy lịch sử chat từ database
- Stream phản hồi AI về frontend qua SSE
- Lưu tin nhắn user và AI sau khi hoàn tất
- Serve ảnh minh họa cho chatbot

### 2. Service layer

File: `backend/app/services/ai_service.py`

Chịu trách nhiệm:

- Khởi tạo Gemini model
- Nạp knowledge base từ `data_chat.txt`
- Tạo system prompt cố định cho chatbot
- Kết hợp thêm context người dùng và chat history
- Gửi prompt sang Gemini
- Trả phản hồi dạng thường hoặc streaming
- Tạo prompt cho itinerary, suggest places, estimate cost
- Parse JSON trả về từ model

### 3. Model layer

File: `backend/app/models/ai.py`

Các bảng chính:

- `chat_sessions`: lưu phiên hội thoại
- `chat_messages`: lưu từng tin nhắn user/AI
- `cost_references`: bảng tham chiếu chi phí

## Luồng chat chính

Endpoint chính: `POST /api/ai/chat`

### Bước 1. Nhận dữ liệu đầu vào

Route nhận JSON:

```json
{
  "session_id": 1,
  "message": "Gợi ý lịch trình 3 ngày ở Khánh Hòa"
}
```

Logic:

- Lấy `message`
- Lấy `session_id` nếu có
- Nếu `message` rỗng thì trả lỗi `400`

### Bước 2. Xác định guest hay user đã đăng nhập

Route dùng:

```python
@jwt_required(optional=True)
```

Nên chatbot cho phép:

- Guest chat không cần đăng nhập
- User chat khi có JWT hợp lệ

Logic hiện tại:

- Nếu `current_user` không có `id` thì xem là guest
- Guest được định danh theo `request.remote_addr`
- User được định danh theo `current_user.id`

### Bước 3. Giới hạn guest

Guest bị giới hạn:

- Tối đa `3` lượt chat
- Thời hạn khóa theo key cache là `86400` giây

Cache key:

```text
guest_chat_limit:<ip>
```

Nếu guest vượt giới hạn:

```json
{
  "error": "GUEST_LIMIT_REACHED",
  "message": "Ban da het luot chat thu. Vui long dang nhap!"
}
```

### Bước 4. Rate limit

Mọi user hoặc guest đều bị giới hạn tốc độ:

- Tối đa `5` request mỗi phút

Cache key:

```text
rate_limit:<user_id_or_ip>
```

Nếu vượt mức:

- Trả lỗi `429`

## Logic session chat

### 1. Nếu client truyền `session_id`

Hệ thống sẽ:

- Tìm `ChatSession` theo id
- Nếu session thuộc user khác thì trả `403`
- Nếu session là guest nhưng request hiện tại là user đăng nhập thì bỏ session cũ và tạo session mới

### 2. Nếu không có session hợp lệ

Hệ thống tạo `ChatSession` mới:

- `user_id = None` nếu là guest
- `user_id = current_user.id` nếu đã đăng nhập
- `title = message[:100]`

### 3. Lịch sử chat

Sau khi có session, hệ thống lấy toàn bộ tin nhắn của session đó, sắp theo thời gian tăng dần, rồi chỉ lấy:

- `10` tin nhắn gần nhất

Format lại thành:

```python
[
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]
```

Format này được dùng để gửi sang Gemini.

## Logic context người dùng

Nếu user đã đăng nhập, route cố gắng thêm thông tin cá nhân hóa vào `context`.

Hiện tại code cố gắng đọc:

```python
current_user.preferences
```

Sau đó parse JSON và đưa vào:

```python
context["user_preferences"]
```

Context này được nối thêm vào system prompt trước khi gọi Gemini.

## Logic khởi tạo AI service

Service dùng singleton:

```python
get_ai_service()
```

Nghĩa là:

- App chỉ khởi tạo `GeminiAIService` khi cần lần đầu
- Các request sau dùng lại cùng instance service

### Khi service khởi tạo

`GeminiAIService.__init__()` sẽ chạy:

1. `_configure()`
2. `_load_knowledge_base()`

## Logic `_configure()`

Service đọc cấu hình từ Flask config:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_TEMPERATURE`
- `AI_MAX_TOKENS`

Sau đó:

1. Gọi `genai.configure(api_key=...)`
2. Khởi tạo `generation_config`
3. Khởi tạo `safety_settings`
4. Tạo `GenerativeModel`

Model mặc định nếu chưa cấu hình:

```text
gemini-2.5-flash-preview-04-17
```

## Logic nạp knowledge base

Hàm `_load_knowledge_base()` tìm file `data_chat.txt` ở nhiều đường dẫn khác nhau để tăng khả năng chạy được trong môi trường local hoặc container.

Nếu tìm thấy file:

- Đọc toàn bộ nội dung vào `self.knowledge_base`

Nếu không tìm thấy:

- Ghi warning log

Knowledge base là nguồn dữ liệu nghiệp vụ ưu tiên cao nhất trong system prompt.

## Logic system prompt

Hàm `_build_tourism_system_prompt()` là phần lõi của chatbot.

Prompt này định nghĩa:

- Vai trò chatbot: trợ lý du lịch Khánh Hòa và Ninh Thuận
- Quy tắc định dạng câu trả lời
- Quy tắc chèn ảnh Markdown
- Chiến lược hỏi thêm thông tin trước khi tư vấn
- Hướng tư vấn theo từng nhóm nhu cầu
- Cách xử lý các câu hỏi về chi phí, thời điểm đi, di chuyển
- Cách từ chối câu hỏi ngoài phạm vi
- Danh sách ảnh được phép dùng
- Knowledge base thực tế từ `data_chat.txt`

### Ý tưởng chính của prompt

Khi người dùng hỏi chung chung, bot không trả lời ngay toàn bộ mà sẽ:

1. Hỏi thăm dò sở thích
2. Phân loại nhu cầu du lịch
3. Tư vấn theo nhóm nhu cầu
4. Gợi ý tiếp sang tạo lịch trình chi tiết

### Danh sách ảnh trong prompt

Prompt chứa mảng `IMAGES` gồm:

- Tên hiển thị
- Slug dùng trong URL ảnh

Sau đó sinh ra Markdown dạng:

```md
![Vinh Vinh Hy](/api/ai/img/Vinh Vinh Hy)
```

Điều này cho phép AI chèn ảnh trực tiếp vào nội dung trả về.

## Logic gọi Gemini

### Hàm `_get_system_instruction(context=None)`

Trả về:

- system prompt gốc
- cộng thêm `context` nếu có

### Hàm `_do_chat(...)`

Đây là hàm trung tâm gọi Gemini.

Nó thực hiện:

1. Tạo lại `system_instruction` cho request hiện tại
2. Tạo `GenerativeModel` mới với prompt đó
3. Chuyển `chat_history` sang format Gemini:

```python
{"role": "user", "parts": ["..."]}
{"role": "model", "parts": ["..."]}
```

4. Gọi `start_chat(history=...)`
5. Gửi message mới bằng `send_message(...)`

Có 2 chế độ:

- `stream=False`: trả về `response.text`
- `stream=True`: trả về generator stream từ Gemini

## Logic streaming

### Hàm `chat_stream(...)`

Service nhận stream từ Gemini rồi yield từng chunk text:

- Nếu `chunk.text` tồn tại thì yield chunk đó
- Nếu lỗi thì yield một chuỗi báo lỗi

### SSE trong route `/api/ai/chat`

Route đóng gói stream theo chuẩn SSE:

1. Gửi `session_id` trước
2. Gửi từng chunk text
3. Kết thúc thì lưu DB
4. Gửi event `done`

Ví dụ luồng SSE:

```text
data: {"session_id": 12}

data: {"text": "Xin chao, "}

data: {"text": "minh co the goi y..."}

data: {"done": true, "ai_message": {...}}
```

## Logic lưu lịch sử chat

Sau khi stream xong, route mới lưu vào database:

1. Lưu message của user
2. Lưu full response của AI
3. Commit transaction
4. Trả về `ai_message` đã serialize

Điểm cần lưu ý:

- Trong lúc stream, dữ liệu chưa được lưu ngay từng chunk
- Chỉ lưu khi toàn bộ phản hồi hoàn tất

## Logic ảnh minh họa

Endpoint: `GET /api/ai/img/<slug>`

### Mục tiêu

Cho phép chatbot trả về Markdown ảnh, sau đó frontend render ảnh trực tiếp từ backend.

### Cách hoạt động

1. Tìm thư mục ảnh từ nhiều candidate path
2. Decode `slug`
3. Chuẩn hóa chuỗi để so khớp không phân biệt dấu tiếng Việt
4. Duyệt file ảnh trong thư mục
5. So khớp `slug` với tên file không extension
6. Nếu khớp thì `send_file`

Hệ thống hỗ trợ extension:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

Ngoài ra còn giữ logic fallback cũ:

- Nếu slug là số, dùng index ảnh theo thứ tự file

## Các API AI khác

### 1. `POST /api/ai/generate-itinerary`

Mục đích:

- Tạo lịch trình du lịch thông minh

Luồng:

1. Nhận `duration`, `budget`, `interests`, `location`, `start_date`
2. Gọi `get_itinerary_service().generate_smart_itinerary(...)`
3. Nếu user đang đăng nhập thì lưu itinerary
4. Trả dữ liệu lịch trình về frontend

### 2. `POST /api/ai/suggest-places`

Mục đích:

- Gợi ý địa điểm từ danh sách location hiện có trong database

Luồng:

1. Lấy `criteria` từ request
2. Query tối đa `50` location đang `ACTIVE`
3. Serialize location
4. Gọi `get_ai_service().suggest_places(...)`
5. Parse kết quả và trả về frontend

### 3. `POST /api/ai/estimate-cost`

Mục đích:

- Ước tính chi phí của lịch trình

Luồng:

1. Nhận object `itinerary`
2. Tạo prompt estimate cost
3. Gọi Gemini
4. Parse JSON trả về
5. Trả breakdown chi phí cho frontend

## Logic tạo prompt phụ

Ngoài chat chính, `ai_service.py` còn có 3 nhóm prompt riêng:

- `_build_itinerary_prompt(preferences)`
- `_build_suggestion_prompt(criteria, places)`
- `_build_cost_estimation_prompt(itinerary)`

Các prompt này đều yêu cầu model trả về JSON có cấu trúc rõ ràng.

## Logic parse JSON từ AI

Hàm `_parse_json_response(text)` xử lý:

- Nếu model bọc JSON trong ```json ... ```
- Hoặc bọc trong ``` ... ```

Sau đó:

- Cắt phần JSON ra
- Dùng `json.loads(...)` để parse

Nếu parse lỗi:

- Service fallback sang response text thường

## Dữ liệu lưu trong database

### `ChatSession`

Lưu:

- `id`
- `user_id`
- `title`
- `started_at`
- `updated_at`

### `ChatMessage`

Lưu:

- `id`
- `session_id`
- `sender_type`: `USER` hoặc `AI`
- `message_content`
- `created_at`

## Tóm tắt luồng end-to-end

```text
Frontend gửi message
-> /api/ai/chat
-> kiểm tra message
-> xác định guest/user
-> guest limit + rate limit
-> lấy hoặc tạo ChatSession
-> lấy 10 tin nhắn gần nhất
-> build context
-> get_ai_service()
-> build system prompt + history
-> gọi Gemini stream
-> stream chunk qua SSE về frontend
-> gom full response
-> lưu USER message + AI message vào DB
-> trả event done
```

## Biến môi trường liên quan

Các biến quan trọng:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_TEMPERATURE`
- `AI_MAX_TOKENS`
- `IMAGE_DIR`

Ngoài ra chatbot còn phụ thuộc:

- Redis cache thông qua `cache`
- JWT để nhận diện user
- `data_chat.txt` để làm knowledge base

## Ghi chú triển khai

Nếu muốn chỉnh hành vi chatbot, các điểm nên sửa đầu tiên là:

1. `backend/app/services/ai_service.py`
2. `backend/app/routes/ai.py`
3. `backend/app/data/data_chat.txt`
4. Danh sách ảnh trong `_build_tourism_system_prompt()`

## File liên quan

- `backend/app/services/ai_service.py`
- `backend/app/routes/ai.py`
- `backend/app/models/ai.py`
- `backend/app/data/data_chat.txt`
- `backend/static/uploads/images/anh/`
