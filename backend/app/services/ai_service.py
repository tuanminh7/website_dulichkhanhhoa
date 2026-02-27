# import google.generativeai as genai
import json

from google import genai
from flask import current_app


class GeminiAIService:
    
    def __init__(self):
        self._model_name = current_app.config.get('GEMINI_MODEL', 'gemini-3-flash-preview')
        self._client = genai.Client(api_key=current_app.config.get('GEMINI_API_KEY'))
        self._chat = None
        self._configure()
    
    def _configure(self):
        """Configure Gemini API"""
        try:
            if not self._client.api:
                raise ValueError("GEMINI_API_KEY not configured")

            self._chat = self._client.chats.create(
                history=[],
                model=self._model_name,
                config=genai.types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=2048,
                    top_p= 0.95,
                    top_k=40,
                    system_instruction=self._build_tourism_system_prompt)
            )
            
            # self.model = genai.GenerativeModel(
            #     model_name=model_name,
            #     generation_config=generation_config
            # )

            
        except Exception as e:
            current_app.logger.error(f"Error configuring Gemini: {str(e)}")
            raise
    

    def chat(self, message: str, context: dict = None, chat_history: list[dict] = None) -> dict:
        try:
            # Build prompt with context
            system_prompt = self._build_tourism_system_prompt()

            
            if chat_history is not None:
                self._chat = self._client.chats.create(
                    history=[],
                    model=self._model_name,
                    config=genai.types.GenerateContentConfig(
                        temperature=0.7,
                        max_output_tokens=2048,
                        top_p= 0.95,
                        top_k=40,
                        system_instruction=self._build_tourism_system_prompt)
                )

                response = self._chat.send_message(message=message)

                model_content = response.text
                

            # Session mới
            else:
                self._chat.send_message("message")
            
            if context:
                system_prompt += f"\n\n**Thông tin bổ sung:**\n{json.dumps(context, ensure_ascii=False, indent=2)}"
            
            # Start chat session
            # chat = self.model.start_chat(history=[])
            # chat = self.model.generate_content(
            #     model="gemini-3-flash-preview",
            #     config=genai.types.GenerateContentConfig(
            #         system_instruction="You are a cat. Your name is Neko."),
            #     contents="Hello there"
            # )
            chat = self.model.start_chat(history=[])
            # self.client.chats.

            # Add chat history if available
            if chat_history:
                for msg in chat_history[-10:]:  # Last 10 messages
                    if msg.get('role') == 'user':
                        chat.send_message(msg.get('content', ''))
            
            # Send current message with system prompt
            full_message = f"{system_prompt}\n\n**Câu hỏi của khách:** {message}"
            print(full_message)
            response = chat.send_message(full_message)
            print(response.text)
            
            return {
                'success': True,
                'response': response.text,
                'model': 'gemini-3-flash-preview',
                'finish_reason': 'stop'
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini chat error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'response': 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
            }
    
    def generate_itinerary(self, preferences: dict) -> dict:
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
                'model': 'gemini-3-flash-preview'
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
                'model': 'gemini-3-flash-preview'
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
                'model': 'gemini-3-flash-preview'
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini cost estimation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _build_tourism_system_prompt(self) -> str:
        """Build system prompt for tourism assistant"""
        return """Bạn là trợ lý du lịch thông minh chuyên về du lịch địa phương Việt Nam. Thiện về Khánh Hoà. 

**Vai trò của bạn:**
- Tư vấn lịch trình du lịch chi tiết và phù hợp
- Giới thiệu địa điểm du lịch, ẩm thực, lưu trú
- Ước tính chi phí chuyến đi hợp lý
- Cung cấp thông tin hữu ích về văn hóa, phong tục địa phương
- Gợi ý các hoạt động thú vị và trải nghiệm độc đáo

**Phong cách giao tiếp:**
- Thân thiện, nhiệt tình và chuyên nghiệp
- Sử dụng tiếng Việt tự nhiên, dễ hiểu
- Đưa ra lời khuyên cụ thể, có căn cứ
- Tôn trọng ngân sách và sở thích của khách

**Nguyên tắc:**
- Ưu tiên du lịch bền vững và có trách nhiệm
- Khuyến khích khám phá văn hóa địa phương
- Cân bằng giữa điểm nổi tiếng và địa điểm ít người biết
- Luôn cập nhật thông tin thực tế và chính xác"""
    
    

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