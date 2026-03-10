import google.generativeai as genai
from flask import current_app
import json, os, re, unicodedata, urllib.parse
from typing import List, Dict, Optional


class GeminiAIService:
    
    def __init__(self):
        self.model = None
        self.knowledge_base = ""
        self.knowledge_sections = []
        self._load_knowledge_base()
        self._configure()
    
    def _load_knowledge_base(self):
        """Load custom knowledge base from data_chat.txt"""
        try:
            data_path = os.path.join(current_app.root_path, 'data', 'data_chat.txt')
            if not os.path.exists(data_path):
                basedir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
                data_path = os.path.join(basedir, 'app', 'data', 'data_chat.txt')

            if os.path.exists(data_path):
                with open(data_path, 'r', encoding='utf-8') as file_handle:
                    self.knowledge_base = file_handle.read()
            else:
                self.knowledge_base = ""

            raw_sections = re.split(r'\n\s*\n+', self.knowledge_base)
            self.knowledge_sections = [section.strip() for section in raw_sections if section.strip()]
        except Exception as e:
            self.knowledge_base = ""
            self.knowledge_sections = []
            current_app.logger.error(f"Error loading knowledge base: {str(e)}")
    
    def _normalize_text(self, text: str) -> str:
        normalized = text.lower().replace('đ', 'd')
        normalized = unicodedata.normalize('NFD', normalized)
        normalized = ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')
        return re.sub(r'[^a-z0-9\s]', ' ', normalized)

    def _extract_keywords(self, text: str) -> List[str]:
        normalized = self._normalize_text(text)
        stopwords = {
            'toi', 'tu', 'van', 'cho', 'xin', 'hay', 'o', 'di', 'nhe', 'la', 'va', 'nhung', 'cac',
            'nhung', 'mot', 'ngay', 'dem', 'giup', 'minh', 'du', 'lich', 'dia', 'diem', 'tu', 'toi',
            'co', 'the', 'nao', 'khong', 'duoc', 'voi', 've', 'tai', 'den', 'tham', 'quan', 'goi', 'y',
            'nhat', 'nhieu', 'it', 'gan', 'xa', 'an', 'uong', 'luu', 'tru', 'chi', 'phi'
        }
        tokens = [token for token in normalized.split() if len(token) > 2 and token not in stopwords]
        ordered = []
        seen = set()
        for token in tokens:
            if token not in seen:
                seen.add(token)
                ordered.append(token)
        return ordered[:8]

    def _get_relevant_knowledge(self, message: str, max_sections: int = 4, max_chars: int = 4500) -> str:
        if not getattr(self, 'knowledge_sections', None):
            return self.knowledge_base[:max_chars]

        keywords = self._extract_keywords(message)
        if not keywords:
            return '\n\n'.join(self.knowledge_sections[:max_sections])[:max_chars]

        scored_sections = []
        for index, section in enumerate(self.knowledge_sections):
            normalized_section = self._normalize_text(section)
            score = sum(normalized_section.count(keyword) for keyword in keywords)
            if score > 0:
                scored_sections.append((score, index, section))

        if not scored_sections:
            return '\n\n'.join(self.knowledge_sections[:max_sections])[:max_chars]

        scored_sections.sort(key=lambda item: (-item[0], item[1]))
        selected = []
        current_length = 0
        for _, _, section in scored_sections[: max_sections * 2]:
            clean_section = section.strip()
            if not clean_section:
                continue
            projected = current_length + len(clean_section) + 2
            if selected and projected > max_chars:
                break
            selected.append(clean_section)
            current_length = projected
            if len(selected) >= max_sections:
                break

        return '\n\n'.join(selected)[:max_chars]

    def _get_relevant_image_markdown(self, message: str, max_images: int = 2) -> str:
        try:
            backend_dir = os.path.dirname(current_app.root_path)
            image_dir = os.path.join(backend_dir, 'static', 'images', 'anh')
            if not os.path.exists(image_dir):
                image_dir = os.path.join(current_app.root_path, 'static', 'images', 'anh')
            if not os.path.exists(image_dir):
                return ''

            images = sorted([filename for filename in os.listdir(image_dir) if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
            keywords = self._extract_keywords(message)
            selected = []

            if keywords:
                for index, image_name in enumerate(images, start=1):
                    normalized_name = self._normalize_text(os.path.splitext(image_name)[0])
                    score = sum(normalized_name.count(keyword) for keyword in keywords)
                    if score > 0:
                        selected.append((score, index, image_name))
                selected.sort(key=lambda item: (-item[0], item[1]))

            if not selected:
                return ''

            lines = []
            for _, image_index, image_name in selected[:max_images]:
                display_name = os.path.splitext(image_name)[0]
                lines.append(f"- ID={image_index}: `![{display_name}](/api/ai/img/{image_index})` — {display_name}")
            return '\n'.join(lines)
        except Exception as e:
            current_app.logger.error(f"Error listing filtered images: {str(e)}")
            return ''

    def _configure(self):
        """Configure Gemini API"""
        try:
            api_key = current_app.config.get('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            
            genai.configure(api_key=api_key)
            configured_model = current_app.config.get('GEMINI_MODEL') or 'models/gemini-2.5-flash'
            self.model_name = configured_model if configured_model.startswith('models/') else f'models/{configured_model}'
            
            generation_config = {
                "temperature": current_app.config.get('AI_TEMPERATURE', 0.7),
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
            
            # Store generation config for use with chats
            self.generation_config = generation_config
            self.safety_settings = safety_settings
            
            # Create model (system_instruction will be set per-call with knowledge base)
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                system_instruction=self._get_system_instruction(),
                safety_settings=safety_settings
            )
            
            # self.model = genai.GenerativeModel(
            #     model_name=model_name,
            #     generation_config=generation_config
            # )

            
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
    
    def _get_system_instruction(self, message: str = '', context: Optional[Dict] = None) -> str:
        """Build system instruction (separate from chat content)"""
        system = self._build_tourism_system_prompt(message)
        if context:
            system += f"\n\nThông tin bổ sung:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
        return system

    def _do_chat(self, message: str, context: Optional[Dict] = None,
                 chat_history: Optional[List[Dict]] = None, stream: bool = False):
        """Core chat logic using proper system_instruction and multi-turn history."""
        system_instruction = self._get_system_instruction(message, context)

        chat_generation_config = dict(self.generation_config)
        chat_generation_config['max_output_tokens'] = min(chat_generation_config.get('max_output_tokens', 8192), 1200)

        model_with_system = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=chat_generation_config,
            safety_settings=self.safety_settings,
            system_instruction=system_instruction
        )
        
        # Build proper Gemini chat history format
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
        """Legacy method - kept for compatibility but _do_chat is preferred."""
        return message

    def chat_stream(self, message: str, context: Dict = None, chat_history: List[Dict] = None):
        """Chat với AI mode streaming"""
        try:
            response_stream, _ = self._do_chat(message, context, chat_history, stream=True)
            emitted_length = 0
            for chunk in response_stream:
                try:
                    if not chunk.text:
                        continue
                    emitted_length += len(chunk.text)
                    yield chunk.text
                    if emitted_length >= 3500:
                        yield "\n\nBạn muốn mình tiếp tục gợi ý thêm không? Mình có thể chia nhỏ theo từng nhóm địa điểm."
                        break
                except Exception:
                    pass
        except Exception as e:
            current_app.logger.error(f"Gemini chat stream error: {str(e)}")
            yield f"Xin lỗi, đã có lỗi: {str(e)}"


    def generate_itinerary(self, preferences: Dict) -> Dict:
        """
        Generate travel itinerary based on preferences
        
        Args:
            preferences: User preferences (duration, budget, interests, etc.)
        
        Returns:
            Dict with itinerary data
        """
        try:
            prompt = self._build_itinerary_prompt(preferences)
            
            response = self.model.generate_content(prompt)
            
            # Parse JSON response
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
            
            # Parse response
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
            
            # Parse response
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
            image_dir = os.path.join(backend_dir, 'static', 'images', 'anh')
            if not os.path.exists(image_dir):
                image_dir = os.path.join(current_app.root_path, 'static', 'images', 'anh')
            if not os.path.exists(image_dir):
                return {}
            images = sorted([f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
            return {str(i+1): os.path.join(image_dir, img) for i, img in enumerate(images)}, \
                   {str(i+1): img for i, img in enumerate(images)}
        except Exception as e:
            current_app.logger.error(f"Error building image index: {str(e)}")
            return {}, {}

    def _build_tourism_system_prompt(self, message: str = '') -> str:
        """Build system prompt for tourism assistant"""
        relevant_knowledge = self._get_relevant_knowledge(message)
        image_list_str = self._get_relevant_image_markdown(message)

        image_rules = "- Không chèn hình ảnh nếu không thực sự cần.\n- Tối đa 2 hình trong một câu trả lời.\n"
        if image_list_str:
            image_rules += "- Nếu dùng ảnh, chỉ được dùng CHÍNH XÁC các mã Markdown sau:\n" + image_list_str
        else:
            image_rules += "- Hiện tại không có ảnh phù hợp rõ ràng với câu hỏi, nên ưu tiên trả lời bằng chữ.\n"

        return f"""Bạn là trợ lý du lịch thông minh chuyên về du lịch địa phương Việt Nam, đặc biệt là Ninh Thuận và Khánh Hòa.

QUY TẮC TRẢ LỜI BẮT BUỘC:
- Trả lời ngắn gọn, dễ đọc, ưu tiên chất lượng hơn số lượng.
- Với câu hỏi gợi ý địa điểm, chỉ chọn 3 đến 5 địa điểm phù hợp nhất.
- Mỗi địa điểm chỉ mô tả 1 đến 2 ý ngắn.
- Nếu người dùng hỏi rộng, hãy trả lời theo dạng tóm tắt trước rồi hỏi họ có muốn mình đào sâu thêm không.
- Không liệt kê toàn bộ dữ liệu bạn biết trong một lần trả lời.
- Không nhắc lại trùng lặp cùng một địa điểm hoặc cùng một ý.
- Nếu câu trả lời dài, hãy ưu tiên cắt gọn và kết bằng lời đề nghị: 'Nếu bạn muốn, mình sẽ gợi ý thêm phần tiếp theo.'

QUY TẮC ĐỊNH DẠNG:
- Không dùng tiêu đề Markdown kiểu #, ##, ###.
- Không lạm dụng in đậm.
- Ưu tiên danh sách gạch đầu dòng ngắn.
- Không tạo đoạn văn quá dài.

QUY TẮC HÌNH ẢNH:
{image_rules}

PHONG CÁCH:
- Thân thiện, thực tế, đúng trọng tâm.
- Ưu tiên gợi ý có thể áp dụng ngay.

KIẾN THỨC LIÊN QUAN ĐẾN CÂU HỎI HIỆN TẠI:
{relevant_knowledge}
"""

    def _build_itinerary_prompt(self, preferences: dict) -> str:
        """Build prompt for itinerary generation"""
        duration = preferences.get('duration', 3)
        budget = preferences.get('budget', 'medium')
        interests = preferences.get('interests', [])
        location = preferences.get('location', 'Việt Nam')
        
        prompt = f"""Hãy tạo một lịch trình du lịch chi tiết với các thông tin sau:

**Thông tin chuyến đi:**
- Địa điểm: {location}
- Thời gian: {duration} ngày
- Ngân sách: {budget}
- Sở thích: {', '.join(interests) if interests else 'Tổng hợp'}

**Yêu cầu:**
1. Lịch trình theo từng ngày với thời gian cụ thể
2. Gợi ý địa điểm tham quan, ăn uống, nghỉ ngơi
3. Ước tính chi phí từng hoạt động
4. Lời khuyên về di chuyển
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
          "description": "Mô tả",
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

**Tiêu chí:**
- Loại hình: {category}
- Ngân sách: {budget}
- Sở thích: {', '.join(interests) if interests else 'Tổng hợp'}

**Danh sách địa điểm:**
{places_json}

Trả về JSON với cấu trúc:
{{
  "recommendations": [
    {{
      "place_id": 1,
      "name": "Tên địa điểm",
      "reason": "Lý do gợi ý",
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
        
        prompt = f"""Ước tính chi phí chi tiết cho lịch trình du lịch sau:

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

Lưu ý: Tính toán dựa trên giá cả thực tế tại Việt Nam."""
        
        return prompt
    
    def _parse_json_response(self, text: str) -> dict:
        """Parse JSON from AI response"""
        # Try to extract JSON from markdown code blocks
        if '```json' in text:
            start = text.find('```json') + 7
            end = text.find('```', start)
            text = text[start:end].strip()
        elif '```' in text:
            start = text.find('```') + 3
            end = text.find('```', start)
            text = text[start:end].strip()
        
        # Parse JSON
        return json.loads(text)


# Singleton instance
_ai_service = None

def get_ai_service() -> GeminiAIService:
    """Get AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = GeminiAIService()
    return _ai_service


if __name__ == "__main__": 
    get_ai_service()