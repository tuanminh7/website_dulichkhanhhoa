# README Chatbot Du Lịch

## 1. Mục đích

Chatbot trong dự án này là trợ lý du lịch dùng Google Gemini để hỗ trợ người dùng tìm hiểu điểm đến, ẩm thực và gợi ý hành trình du lịch. Bot tập trung chủ yếu vào nội dung du lịch địa phương, đặc biệt là Khánh Hòa và một phần dữ liệu liên quan đến Ninh Thuận.

Chatbot được thiết kế để:

- trả lời câu hỏi tự nhiên về du lịch
- gợi ý địa điểm theo nhu cầu người dùng
- ghi nhớ ngữ cảnh hội thoại ngắn theo từng phiên chat
- chèn ảnh minh họa phù hợp với địa điểm đang được hỏi
- hỗ trợ thêm các API AI như tạo lịch trình, gợi ý nơi đi và ước tính chi phí

## 2. Thành phần chính

- Route API: `backend/app/routes/ai.py`
- AI service: `backend/app/services/ai_service.py`
- Model lưu lịch sử chat: `backend/app/models/ai.py`
- Dữ liệu tri thức: `backend/app/data/data_chat.txt`

## 3. Cách chatbot hoạt động

Luồng xử lý chính:

1. Người dùng gửi câu hỏi đến `POST /api/ai/chat`.
2. Backend kiểm tra tin nhắn, quyền truy cập, giới hạn guest và rate limit.
3. Hệ thống lấy lịch sử của phiên chat hiện tại để tạo ngữ cảnh hội thoại.
4. `GeminiAIService` nạp dữ liệu từ `data_chat.txt` và chọn ra các đoạn nội dung liên quan nhất với câu hỏi.
5. Service tạo `system instruction` để điều khiển cách Gemini trả lời.
6. Gemini trả kết quả theo kiểu streaming, backend đẩy dần từng chunk về frontend qua `text/event-stream`.
7. Sau khi hoàn tất, hệ thống lưu cả tin nhắn của người dùng và phản hồi của AI vào database.

## 4. Dữ liệu và ngữ cảnh

Chatbot không dùng vector database mà dùng file kiến thức cục bộ:

- Nguồn dữ liệu chính: `backend/app/data/data_chat.txt`
- Dữ liệu được tách thành từng đoạn nhỏ
- Mỗi câu hỏi được chuẩn hóa, tách từ khóa và so khớp với các đoạn nội dung phù hợp nhất
- Hệ thống lấy tối đa một số đoạn liên quan để đưa vào prompt

Điểm mạnh của cách làm này là đơn giản, dễ debug, phù hợp cho demo hoặc MVP. Đổi lại, độ chính xác vẫn phụ thuộc khá nhiều vào từ khóa.

## 5. Tính năng nổi bật

### Chat nhiều lượt

- lưu phiên chat bằng `ChatSession`
- lưu từng tin nhắn bằng `ChatMessage`
- dùng tối đa 10 tin nhắn gần nhất để giữ ngữ cảnh hội thoại

### Streaming phản hồi

- phản hồi được gửi về frontend theo từng phần
- giúp trải nghiệm chat tự nhiên hơn thay vì đợi toàn bộ câu trả lời

### Chèn ảnh minh họa

- chatbot có thể tìm ảnh phù hợp theo tên địa điểm
- ảnh được trả qua route `GET /api/ai/img/<slug>`
- nếu phản hồi chưa có ảnh nhưng nội dung phù hợp, backend có thể tự bổ sung ảnh ở cuối câu trả lời

### Hỗ trợ khách chưa đăng nhập

- guest vẫn có thể chat thử
- hiện tại guest bị giới hạn tối đa 3 lượt trong 24 giờ
- user đăng nhập có thể lưu và xem lại lịch sử chat

## 6. Các API chính

- `POST /api/ai/chat`: chat với AI theo dạng stream
- `POST /api/ai/sessions`: tạo phiên chat mới
- `GET /api/ai/sessions`: lấy danh sách phiên chat của user đã đăng nhập
- `GET /api/ai/sessions/<id>/messages`: lấy lịch sử tin nhắn của một phiên
- `GET /api/ai/img/<slug>`: lấy ảnh minh họa chatbot
- `POST /api/ai/generate-itinerary`: tạo lịch trình du lịch
- `POST /api/ai/suggest-places`: gợi ý địa điểm phù hợp
- `POST /api/ai/estimate-cost`: ước tính chi phí cho lịch trình

## 7. Cấu hình AI

Chatbot đang dùng Google Gemini với các biến môi trường chính:

- `GEMINI_API_KEY` hoặc `GEMINI_API_KEYS`
- `GEMINI_MODEL`
- `AI_TEMPERATURE`
- `AI_MAX_TOKENS`

Service có hỗ trợ nhiều API key và tự xoay vòng key khi gặp lỗi quota hoặc rate limit.

## 8. Giới hạn hiện tại

Một số điểm cần lưu ý:

- cache phản hồi hiện đang dựa nhiều vào nội dung câu hỏi, chưa phản ánh đầy đủ lịch sử chat
- guest session có rủi ro truy cập nếu không kiểm soát chặt hơn
- retrieval hiện tại là keyword matching, chưa phải RAG đầy đủ
- frontend có thể tạo session rỗng nếu tạo phiên trước nhưng chat thất bại

## 9. Cập nhật dữ liệu chatbot

Khi cần bổ sung kiến thức cho chatbot, chỉ cần cập nhật file:

- `backend/app/data/data_chat.txt`

Nếu cần nạp dữ liệu production:

```bash
docker compose exec backend sh -c "PYTHONPATH=. python app/utils/production_seeder.py"
```

## 10. Tóm tắt

Đây là một chatbot du lịch theo hướng lightweight:

- dùng Gemini để sinh câu trả lời
- dùng file dữ liệu cục bộ để bổ sung tri thức
- hỗ trợ chat nhiều lượt, streaming và ảnh minh họa
- phù hợp cho website tư vấn du lịch ở mức demo, MVP hoặc hệ thống nội dung địa phương
