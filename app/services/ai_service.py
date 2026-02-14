import google.generativeai as genai
from flask import current_app
import json
from typing import List, Dict, Optional


class GeminiAIService:
    """Service for Google Gemini AI"""
    
    def __init__(self):
        self.model = None
        self._configure()
    
    def _configure(self):
        """Configure Gemini API"""
        try:
            api_key = current_app.config.get('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            
            genai.configure(api_key=api_key)
            model_name = current_app.config.get('GEMINI_MODEL', 'gemini-2.5-flash')
            
            # Configure generation settings
            generation_config = {
                "temperature": current_app.config.get('AI_TEMPERATURE', 0.7),
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": current_app.config.get('AI_MAX_TOKENS', 2048),
            }
            
            self.model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=generation_config
            )
            
        except Exception as e:
            current_app.logger.error(f"Error configuring Gemini: {str(e)}")
            raise
    
    def chat(self, message: str, context: Optional[Dict] = None, 
             chat_history: Optional[List[Dict]] = None) -> Dict:
        """
        Chat with Gemini AI
        
        Args:
            message: User message
            context: Additional context (places, preferences, etc.)
            chat_history: Previous chat messages
        
        Returns:
            Dict with response and metadata
        """
        try:
            # Build prompt with context
            system_prompt = self._build_tourism_system_prompt()
            
            if context:
                system_prompt += f"\n\n**Thông tin bổ sung:**\n{json.dumps(context, ensure_ascii=False, indent=2)}"
            
            # Start chat session
            chat = self.model.start_chat(history=[])
            
            # Add chat history if available
            if chat_history:
                for msg in chat_history[-10:]:  # Last 10 messages
                    if msg.get('role') == 'user':
                        chat.send_message(msg.get('content', ''))
            
            # Send current message with system prompt
            full_message = f"{system_prompt}\n\n**Câu hỏi của khách:** {message}"
            response = chat.send_message(full_message)
            
            return {
                'success': True,
                'response': response.text,
                'model': 'gemini-2.0-flash-exp',
                'finish_reason': 'stop'
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini chat error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'response': 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
            }
    
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
                'model': 'gemini-2.0-flash-exp'
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini itinerary generation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def suggest_places(self, criteria: Dict, available_places: List[Dict]) -> Dict:
        """
        Suggest places based on criteria
        
        Args:
            criteria: Search criteria (category, budget, interests, etc.)
            available_places: List of available places
        
        Returns:
            Dict with suggested places
        """
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
                'model': 'gemini-2.0-flash-exp'
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini suggestion error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def estimate_cost(self, itinerary_data: Dict) -> Dict:
        """
        Estimate travel cost
        
        Args:
            itinerary_data: Itinerary details
        
        Returns:
            Dict with cost breakdown
        """
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
                'model': 'gemini-2.0-flash-exp'
            }
            
        except Exception as e:
            current_app.logger.error(f"Gemini cost estimation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _build_tourism_system_prompt(self) -> str:
        """Build system prompt for tourism assistant"""
        return """Bạn là trợ lý du lịch thông minh chuyên về du lịch địa phương Việt Nam. 

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
    
    def _build_itinerary_prompt(self, preferences: Dict) -> str:
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
    
    def _build_suggestion_prompt(self, criteria: Dict, places: List[Dict]) -> str:
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
    
    def _build_cost_estimation_prompt(self, itinerary: Dict) -> str:
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
    
    def _parse_json_response(self, text: str) -> Dict:
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