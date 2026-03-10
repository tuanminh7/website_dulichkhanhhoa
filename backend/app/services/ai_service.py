import google.generativeai as genai
from flask import current_app
import json, os, urllib.parse
from typing import List, Dict, Optional


class GeminiAIService:
    
    def __init__(self):
        self.model = None
        self.knowledge_base = ""
        self._configure()
        self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Load custom knowledge base from data_chat.txt"""
        candidates = [
            os.path.join(current_app.root_path, 'data', 'data_chat.txt'),
            os.path.join(os.path.dirname(current_app.root_path), 'app', 'data', 'data_chat.txt'),
            os.path.join(os.path.dirname(current_app.root_path), 'data', 'data_chat.txt'),
            os.path.normpath(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'data_chat.txt')),
        ]
        for data_path in candidates:
            data_path = os.path.normpath(data_path)
            if os.path.exists(data_path):
                try:
                    with open(data_path, 'r', encoding='utf-8') as f:
                        self.knowledge_base = f.read()
                    current_app.logger.info(f"Loaded knowledge base: {data_path} ({len(self.knowledge_base)} chars)")
                    return
                except Exception as e:
                    current_app.logger.error(f"Error reading {data_path}: {str(e)}")
        current_app.logger.warning("data_chat.txt not found!")
    
    def _configure(self):
        """Configure Gemini API"""
        try:
            api_key = current_app.config.get('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            
            genai.configure(api_key=api_key)

            # Dùng gemini-2.5-flash, fallback về gemini-1.5-flash nếu không có
            self.model_name = current_app.config.get('GEMINI_MODEL', 'gemini-2.5-flash-preview-04-17')
            
            generation_config = {
                "temperature": current_app.config.get('AI_TEMPERATURE', 0.8),
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": current_app.config.get('AI_MAX_TOKENS', 8192),
            }
            
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            
            self.generation_config = generation_config
            self.safety_settings = safety_settings
            
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                system_instruction=self._get_system_instruction(),
                safety_settings=safety_settings
            )
            
        except Exception as e:
            current_app.logger.error(f"Error configuring Gemini: {str(e)}")
            raise
    
    def chat(self, message: str, context: Optional[Dict] = None, 
             chat_history: Optional[List[Dict]] = None) -> Dict:
        """Chat with Gemini AI"""
        try:
            response_text, _ = self._do_chat(message, context, chat_history, stream=False)
            return {
                'success': True,
                'response': response_text,
                'model': self.model_name,
                'finish_reason': 'stop'
            }
        except Exception as e:
            current_app.logger.error(f"Gemini chat error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'response': 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
            }
    
    def _get_system_instruction(self, context: Optional[Dict] = None) -> str:
        """Build system instruction"""
        system = self._build_tourism_system_prompt()
        if context:
            system += f"\n\nThông tin bổ sung về người dùng:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
        return system

    def _do_chat(self, message: str, context: Optional[Dict] = None,
                 chat_history: Optional[List[Dict]] = None, stream: bool = False):
        """Core chat logic using proper system_instruction and multi-turn history."""
        system_instruction = self._get_system_instruction(context)
        
        model_with_system = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=self.generation_config,
            safety_settings=self.safety_settings,
            system_instruction=system_instruction
        )
        
        # Build Gemini chat history
        gemini_history = []
        if chat_history:
            for msg in chat_history[-10:]:
                role = 'user' if msg.get('role') == 'user' else 'model'
                gemini_history.append({'role': role, 'parts': [msg.get('content', '')]})
        
        chat = model_with_system.start_chat(history=gemini_history)
        
        if stream:
            return chat.send_message(message, stream=True), chat
        else:
            response = chat.send_message(message)
            return response.text, chat

    def _build_chat_prompt(self, message: str, context: Optional[Dict] = None, 
                          chat_history: Optional[List[Dict]] = None) -> str:
        """Legacy method - kept for compatibility."""
        return message

    def chat_stream(self, message: str, context: Dict = None, chat_history: List[Dict] = None):
        """Chat với AI mode streaming"""
        try:
            response_stream, _ = self._do_chat(message, context, chat_history, stream=True)
            for chunk in response_stream:
                try:
                    if chunk.text:
                        yield chunk.text
                except Exception:
                    pass
        except Exception as e:
            current_app.logger.error(f"Gemini chat stream error: {str(e)}")
            yield f"Xin lỗi, đã có lỗi: {str(e)}"

    def generate_itinerary(self, preferences: Dict) -> Dict:
        """Generate travel itinerary based on preferences"""
        try:
            prompt = self._build_itinerary_prompt(preferences)
            response = self.model.generate_content(prompt)
            
            try:
                itinerary_data = self._parse_json_response(response.text)
            except:
                itinerary_data = {
                    'title': 'Lịch trình du lịch',
                    'description': response.text,
                    'days': []
                }
            
            return {
                'success': True,
                'itinerary': itinerary_data,
                'model': self.model_name
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini itinerary generation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def suggest_places(self, criteria: dict, available_places: list[dict]) -> dict:
        try:
            prompt = self._build_suggestion_prompt(criteria, available_places)
            response = self.model.generate_content(prompt)
            
            try:
                suggestions = self._parse_json_response(response.text)
            except:
                suggestions = {
                    'places': [],
                    'explanation': response.text
                }
            
            return {
                'success': True,
                'suggestions': suggestions,
                'model': self.model_name
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini suggestion error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def estimate_cost(self, itinerary_data: dict) -> dict:
        try:
            prompt = self._build_cost_estimation_prompt(itinerary_data)
            response = self.model.generate_content(prompt)
            
            try:
                cost_data = self._parse_json_response(response.text)
            except:
                cost_data = {
                    'total': 0,
                    'breakdown': {},
                    'explanation': response.text
                }
            
            return {
                'success': True,
                'cost': cost_data,
                'model': self.model_name
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini cost estimation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _build_image_index(self):
        """Build a mapping from short slug IDs to actual image files."""
        try:
            backend_dir = os.path.dirname(current_app.root_path)
            image_dir = os.path.join(backend_dir, 'static', 'uploads', 'images', 'anh')
            if not os.path.exists(image_dir):
                image_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'images', 'anh')
            if not os.path.exists(image_dir):
                return {}, {}
            images = sorted([f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
            return (
                {str(i+1): os.path.join(image_dir, img) for i, img in enumerate(images)},
                {str(i+1): img for i, img in enumerate(images)}
            )
        except Exception as e:
            current_app.logger.error(f"Error building image index: {str(e)}")
            return {}, {}

    def _build_image_map(self) -> dict:
        """Build map: filename (no ext, lowercase) -> image URL slug ID"""
        try:
            backend_dir = os.path.dirname(current_app.root_path)
            image_dir = os.path.join(backend_dir, 'static', 'uploads', 'images', 'anh')
            if not os.path.exists(image_dir):
                image_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'images', 'anh')
            if not os.path.exists(image_dir):
                return {}
            images = sorted([f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
            return {os.path.splitext(img)[0]: str(i + 1) for i, img in enumerate(images)}
        except Exception as e:
            current_app.logger.error(f"Error building image map: {str(e)}")
            return {}

    def _build_tourism_system_prompt(self) -> str:
        """Build system prompt for tourism assistant"""
        # Danh sách ảnh cứng theo tên file thực tế (sorted alphabetically = ID thứ tự)
        KNOWN_IMAGES = [
            "Bãi Hỏm - Nơi rùa biển về đẻ trứng",
            "Bãi Tràng - Thiên đường cắm trại",
            "Bãi biển Bình Tiên",
            "Bánh căn",
            "Bảo tàng Ninh Thuận - Dấu ấn kiến trúc độc đáo",
            "Biển Cà Ná",
            "Bún sứa",
            "Cánh đồng điện gió Đầm Nại - Biểu tượng năng lượng sạch",
            "Chùa Từ Vân",
            "Du lịch Bình Hưng khanh hoa",
            "Du lịch Bình Lập",
            "Du lịch Bình Tiên",
            "Du lịch Vinpearl - Hòn Tre",
            "Hang Rái",
            "Hòn Chồng - Hòn Vợ Nha Trang",
            "Hòn Nội - Đảo Yến Nha Trang",
            "Hòn Đỏ - Thiên đường san hô dưới lòng biển",
            "Khu du lịch Suối Hoa Lan",
            "Làng Gốm Bàu Trúc",
            "Làng nho Thái An - Thủ phủ nho",
            "Mũi Đá Vách",
            "Mũi Đôi (mũi Điện) - Điểm Cực Đông đất liền của Tổ quốc",
            "Nhà Thờ Núi",
            "Núi Đá Chồng (Núi Phụng Hoàng)",
            "Rừng thông Khánh Sơn",
            "Thành cổ Diên Khánh",
            "Thác Chapơr",
            "Thác Tà Gụ",
            "Tháp Bà Ponagar",
            "Tháp Po Klong Garai",
            "Trùng Sơn Cổ Tự - Ngôi chùa trên đỉnh núi Đá Chồng",
            "Trải nghiệm nét đẹp văn hóa của đồng bào Raglai",
            "Viện Hải Dương Học Nha Trang",
            "Vườn nho Ba Mọi - Trải nghiệm văn hóa nho Ninh Thuận",
            "Vườn quốc gia Núi Chúa - Rừng khô hạn châu Phi của Việt Nam",
            "Vườn quốc gia Phước Bình",
            "Vịnh Vân Phong",
            "Vịnh Vĩnh Hy",
            "Điệp Sơn",
            "Đèo Ngoạn Mục",
            "Đảo Robinson",
            "Đầm Nại",
            "Đồi cát Nam Cương",
            "Đồng Cừu Ysa Núi Hòn Vàng Krong Pha",
            "bãi biển dốc lết nha trang",
        ]

        image_list_str = ""
        for i, name in enumerate(KNOWN_IMAGES):
            image_list_str += f"- {name}: ![{name}](/api/ai/img/{i+1})\n"

        return f"""Bạn là trợ lý du lịch thông minh tên là "Khánh Hòa Travel AI", chuyên tư vấn du lịch tại tỉnh Khánh Hòa và Ninh Thuận, Việt Nam.

=== QUY TẮC ĐỊNH DẠNG BẮT BUỘC ===
- TUYỆT ĐỐI KHÔNG dùng dấu thăng (#, ##, ###) làm tiêu đề.
- TUYỆT ĐỐI KHÔNG dùng dấu sao đôi (**text**) để bôi đậm.
- CHỈ dùng: văn bản thuần, xuống dòng, dấu gạch đầu dòng (-), và số thứ tự (1. 2. 3.).
- Khi liệt kê địa điểm, mỗi địa điểm viết trên một dòng riêng, có gạch đầu dòng.

=== QUY TẮC CHÈN ẢNH BẮT BUỘC ===
- Sau khi giới thiệu một địa điểm, BẮT BUỘC chèn ảnh minh họa ngay bên dưới nếu có trong danh sách.
- Dùng ĐÚNG cú pháp Markdown: ![tên địa điểm](/api/ai/img/ID)
- Chỉ dùng ID có trong danh sách ảnh bên dưới, TUYỆT ĐỐI KHÔNG tự bịa ID.
- Mỗi địa điểm chèn 1 ảnh, đặt trên một dòng riêng ngay sau phần mô tả.
- Ví dụ định dạng đúng:

- Vịnh Vĩnh Hy: vịnh biển đẹp hoang sơ, nước trong xanh, lý tưởng cho nghỉ dưỡng yên tĩnh.
![Vịnh Vĩnh Hy](/api/ai/img/38)

=== CHIẾN LƯỢC TƯ VẤN THÔNG MINH ===

BƯỚC 1 - THĂM DÒ SỞ THÍCH (quan trọng nhất):
Khi khách hỏi chung chung về du lịch một địa điểm (ví dụ: "tư vấn địa điểm ở Khánh Hòa", "muốn đi Nha Trang", "du lịch Khánh Hòa"), bạn PHẢI hỏi thăm dò trước khi tư vấn. Hỏi theo mẫu sau:

"Tuyệt vời! Khánh Hòa có rất nhiều loại hình du lịch thú vị. Để tư vấn phù hợp nhất cho bạn, mình cần hỏi thêm một chút nhé:

Bạn muốn loại hình du lịch nào?
- Du lịch biển (tắm biển, lặn san hô, thể thao nước)
- Nghỉ dưỡng (resort cao cấp, spa, thư giãn)
- Sinh thái / Thiên nhiên (rừng, thác, núi)
- Phượt / Khám phá (đèo, làng chài, vùng xa)
- Cắm trại / Glamping
- Ẩm thực và văn hóa địa phương
- Kết hợp nhiều loại hình

Ngoài ra, bạn đi mấy ngày và đi cùng ai (gia đình, bạn bè, cặp đôi, hay đi một mình)?"

BƯỚC 2 - TƯ VẤN CHI TIẾT SAU KHI BIẾT SỞ THÍCH:
Sau khi khách trả lời, hãy tư vấn địa điểm phù hợp theo từng loại hình:

Nếu khách chọn NGHỈ DƯỠNG:
- Liệt kê 5-8 resort/khách sạn cao cấp tại Nha Trang, Cam Ranh
- Mỗi địa điểm ghi rõ: tên, vị trí, mức giá ước tính/đêm, điểm nổi bật
- Chèn ảnh minh họa nếu có trong danh sách ảnh
- Gợi ý thêm: spa nào ngon, nhà hàng view đẹp, hoạt động tại resort

Nếu khách chọn DU LỊCH BIỂN:
- Liệt kê các bãi biển đẹp: Bãi Dài, Bãi Trũ, Dốc Lết, Bãi Tiên, Vân Phong...
- Gợi ý hoạt động: lặn ngắm san hô, chèo kayak, jet-ski, câu cá
- Đảo nào đáng đi: Hòn Mun, Hòn Tằm, Hòn Miễu...
- Chèn ảnh minh họa phù hợp

Nếu khách chọn SINH THÁI / THIÊN NHIÊN:
- Thác Yangbay, Hồ Suối Dầu, rừng quốc gia Hòn Bà
- Các tour sinh thái cộng đồng
- Chèn ảnh minh họa phù hợp

Nếu khách chọn PHƯỢT / KHÁM PHÁ:
- Đèo Cả, Đèo Rọ Tượng, Vạn Ninh, làng chài Đầm Môn
- Cung đường ven biển đẹp
- Chèn ảnh minh họa phù hợp

Nếu khách chọn CẮM TRẠI / GLAMPING:
- Bãi Dài Cam Ranh, Vân Phong, Dốc Lết
- Các điểm glamping đang hot
- Chèn ảnh minh họa phù hợp

Nếu khách chọn ẨM THỰC:
- Bún sứa, bánh canh chả cá, nem Ninh Hòa, yến sào
- Chợ đêm, phố ẩm thực tại Nha Trang
- Nhà hàng hải sản tươi sống nên thử

BƯỚC 3 - GỢI Ý THÊM SAU KHI TƯ VẤN:
Sau khi đã tư vấn địa điểm, hỏi thêm:
"Bạn có muốn mình lên lịch trình chi tiết theo ngày không? Chỉ cần cho mình biết bạn có bao nhiêu ngày và ngân sách dự kiến là mình sẽ lên kế hoạch cụ thể cho bạn nhé!"

=== XỬ LÝ CÁC TÌNH HUỐNG ĐẶC BIỆT ===

Khi khách hỏi về CHI PHÍ:
- Luôn đưa ra khoảng giá (thấp - trung bình - cao cấp)
- Ước tính tổng chi phí cho chuyến đi theo số ngày
- Gợi ý cách tiết kiệm

Khi khách hỏi về THỜI ĐIỂM ĐI:
- Khánh Hòa đẹp nhất tháng 1-8 (mùa khô)
- Tránh tháng 9-12 (mùa mưa bão)
- Tháng 6-8 đông khách, nên đặt trước

Khi khách hỏi về DI CHUYỂN:
- Từ TP.HCM: máy bay 1 tiếng, tàu 8-10 tiếng, xe khách 10-12 tiếng
- Tại Nha Trang: thuê xe máy 100-150k/ngày, taxi, Grab

Khi khách hỏi không liên quan đến du lịch Khánh Hòa / Ninh Thuận:
- Lịch sự từ chối và nhắc lại chuyên môn của bạn
- Gợi ý câu hỏi liên quan đến du lịch

=== DANH SÁCH ẢNH (dùng đúng ID, không tự bịa) ===
{image_list_str if image_list_str else "- (Chưa có ảnh nào trong thư mục)"}

=== KIẾN THỨC CHUYÊN MÔN (ƯU TIÊN CAO NHẤT) ===
Dữ liệu bên dưới là thông tin thực tế về địa điểm, khách sạn, ẩm thực tại Khánh Hòa và Ninh Thuận. Bạn PHẢI ưu tiên dùng thông tin này khi tư vấn:

{self.knowledge_base}"""

    def _build_itinerary_prompt(self, preferences: dict) -> str:
        """Build prompt for itinerary generation"""
        duration = preferences.get('duration', 3)
        budget = preferences.get('budget', 'medium')
        interests = preferences.get('interests', [])
        location = preferences.get('location', 'Khánh Hòa')
        
        budget_map = {
            'low': 'tiết kiệm (dưới 500k/ngày)',
            'medium': 'trung bình (500k - 1.5 triệu/ngày)',
            'high': 'cao cấp (trên 1.5 triệu/ngày)'
        }
        budget_label = budget_map.get(budget, budget)

        prompt = f"""Hãy tạo một lịch trình du lịch chi tiết với các thông tin sau:

Thông tin chuyến đi:
- Địa điểm: {location}
- Thời gian: {duration} ngày
- Ngân sách: {budget_label}
- Sở thích: {', '.join(interests) if interests else 'Tổng hợp'}

Yêu cầu:
1. Lịch trình theo từng ngày với thời gian cụ thể (sáng/trưa/chiều/tối)
2. Gợi ý địa điểm tham quan, ăn uống, nghỉ ngơi phù hợp ngân sách
3. Ước tính chi phí từng hoạt động (đơn vị: VNĐ)
4. Lời khuyên về di chuyển giữa các điểm
5. Tips và lưu ý quan trọng

Trả về kết quả dưới dạng JSON với cấu trúc:
{{
  "title": "Tên lịch trình",
  "description": "Mô tả tổng quan",
  "duration_days": {duration},
  "estimated_cost": 0,
  "days": [
    {{
      "day": 1,
      "title": "Tiêu đề ngày 1",
      "activities": [
        {{
          "time": "08:00",
          "activity": "Tên hoạt động",
          "location": "Địa điểm",
          "description": "Mô tả chi tiết",
          "estimated_cost": 0,
          "duration": "2 giờ"
        }}
      ]
    }}
  ],
  "tips": ["Lời khuyên 1", "Lời khuyên 2"]
}}"""
        
        return prompt

    def _build_suggestion_prompt(self, criteria: dict, places: list[dict]) -> str:
        """Build prompt for place suggestions"""
        category = criteria.get('category', 'all')
        budget = criteria.get('budget', 'medium')
        interests = criteria.get('interests', [])
        
        places_json = json.dumps(places, ensure_ascii=False, indent=2)
        
        prompt = f"""Dựa trên danh sách địa điểm sau và tiêu chí của khách, hãy gợi ý 5-10 địa điểm phù hợp nhất:

Tiêu chí:
- Loại hình: {category}
- Ngân sách: {budget}
- Sở thích: {', '.join(interests) if interests else 'Tổng hợp'}

Danh sách địa điểm:
{places_json}

Trả về JSON với cấu trúc:
{{
  "recommendations": [
    {{
      "place_id": 1,
      "name": "Tên địa điểm",
      "reason": "Lý do gợi ý cụ thể",
      "rating": 4.5,
      "estimated_cost": 0
    }}
  ],
  "explanation": "Giải thích tổng quan về các gợi ý"
}}"""
        
        return prompt
    
    def _build_cost_estimation_prompt(self, itinerary: dict) -> str:
        """Build prompt for cost estimation"""
        itinerary_json = json.dumps(itinerary, ensure_ascii=False, indent=2)
        
        prompt = f"""Ước tính chi phí chi tiết cho lịch trình du lịch sau tại Khánh Hòa / Ninh Thuận, Việt Nam:

{itinerary_json}

Trả về JSON với cấu trúc:
{{
  "total": 0,
  "breakdown": {{
    "accommodation": 0,
    "food": 0,
    "transportation": 0,
    "activities": 0,
    "shopping": 0,
    "other": 0
  }},
  "daily_average": 0,
  "currency": "VND",
  "notes": ["Ghi chú về chi phí"],
  "tips": ["Tips tiết kiệm chi phí"]
}}

Lưu ý: Tính toán dựa trên giá cả thực tế tại Khánh Hòa, Việt Nam năm 2024-2025."""
        
        return prompt
    
    def _parse_json_response(self, text: str) -> dict:
        """Parse JSON from AI response"""
        if '```json' in text:
            start = text.find('```json') + 7
            end = text.find('```', start)
            text = text[start:end].strip()
        elif '```' in text:
            start = text.find('```') + 3
            end = text.find('```', start)
            text = text[start:end].strip()
        
        return json.loads(text)


# Singleton instance
_ai_service = None

def get_ai_service() -> GeminiAIService:
    """Get AI service instance"""
    global _ai_service
    if _ai_service is None:
        try:
            _ai_service = GeminiAIService()
        except Exception as e:
            _ai_service = None  # Không cache instance lỗi
            raise
    return _ai_service


if __name__ == "__main__":
    get_ai_service()