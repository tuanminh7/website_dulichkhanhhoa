import google.generativeai as genai
from flask import current_app
import json, os, re
import threading
from typing import List, Dict, Optional

from app.utils.chatbot_images import (
    find_best_chatbot_image,
    find_explicit_chatbot_images,
    find_relevant_chatbot_images,
    get_chatbot_image_dir,
    normalize_chatbot_text,
)


class GeminiAIService:
    
    def __init__(self):
        self.model = None
        self.knowledge_base = ""
        self.knowledge_sections = []
        self.api_keys: List[str] = []
        self._rotation_lock = threading.Lock()
        self._genai_lock = threading.RLock()
        self._next_api_key_index = 0
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
        return normalize_chatbot_text(text)

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
            image_dir = get_chatbot_image_dir()
            if image_dir is None:
                return ''

            keywords = self._extract_keywords(message)
            selected = find_relevant_chatbot_images(message, keywords=keywords, max_images=max_images)
            if not selected:
                return ''

            lines = []
            for image in selected:
                display_name = str(image['display_name'])
                slug = str(image['slug'])
                lines.append(f"- slug={slug}: `![{display_name}](/api/ai/img/{slug})` — {display_name}")
            return '\n'.join(lines)
        except Exception as e:
            current_app.logger.error(f"Error listing filtered images: {str(e)}")
            return ''

    def _build_image_gallery_markdown(self, source_text: str, max_images: int = 2) -> str:
        try:
            if not source_text or '![' in source_text:
                return ''

            selected = self._select_response_images(source_text, max_images=max_images)
            if not selected:
                return ''

            lines = []
            for image in selected:
                display_name = str(image['display_name'])
                slug = str(image['slug'])
                lines.append(f"![{display_name}](/api/ai/img/{slug})")
            return '\n\nẢnh minh họa:\n\n' + '\n\n'.join(lines)
        except Exception as e:
            current_app.logger.error(f"Error building image gallery: {str(e)}")
            return ''

    def _select_response_images(self, source_text: str, max_images: int = 2) -> List[Dict[str, object]]:
        selected = []
        seen_slugs = set()

        def extend(images: List[Dict[str, object]]):
            for image in images:
                slug = str(image['slug'])
                if slug in seen_slugs:
                    continue
                selected.append(image)
                seen_slugs.add(slug)
                if len(selected) >= max_images:
                    return True
            return False

        if extend(find_explicit_chatbot_images(source_text, max_images=max_images)):
            return selected
        extend(find_relevant_chatbot_images(source_text, max_images=max_images))
        return selected

    def _strip_existing_image_markdown(self, text: str) -> str:
        if not text:
            return text

        cleaned = re.sub(r'\n?\s*!\[[^\]]*?\]\([^)]*?\)\s*\n?', '\n', text)
        cleaned = re.sub(r'\n\s*[AaẢả][^\n]*minh[^\n]*h[oọ]a\s*:\s*\n?', '\n', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()

    def _extract_place_candidate(self, line: str) -> str:
        candidate = (line or '').strip()
        if not candidate:
            return ''

        candidate = re.sub(r'^\s*(?:[-*•]|\d+[.)])\s*', '', candidate)
        candidate = candidate.replace('**', '').strip()

        for pattern in (r'\s*:\s*', r'\s+[–—-]\s+', r'\s+\(\s*', r'\s{2,}'):
            parts = re.split(pattern, candidate, maxsplit=1)
            if parts and parts[0].strip():
                candidate = parts[0].strip()
                break

        candidate = candidate.strip(' .:-')
        return candidate if len(candidate) >= 3 else ''

    def _inject_inline_images(self, response_text: str, source_text: str, max_images: int = 5) -> str:
        cleaned = self._strip_existing_image_markdown(response_text)
        if not cleaned:
            return response_text

        used_slugs = set()
        inserted_count = 0
        result_lines = []

        for line in cleaned.splitlines():
            result_lines.append(line)

            if inserted_count >= max_images or not line.strip():
                continue

            place_candidate = self._extract_place_candidate(line)
            if not place_candidate:
                continue

            image = find_best_chatbot_image(place_candidate)
            if not image:
                continue

            slug = str(image['slug'])
            if slug in used_slugs:
                continue

            display_name = str(image['display_name'])
            result_lines.append(f"![{display_name}](/api/ai/img/{slug})")
            used_slugs.add(slug)
            inserted_count += 1

        if inserted_count == 0:
            fallback_image = find_best_chatbot_image(source_text)
            if fallback_image:
                display_name = str(fallback_image['display_name'])
                slug = str(fallback_image['slug'])
                result_lines.extend(['', f"![{display_name}](/api/ai/img/{slug})"])

        merged = '\n'.join(result_lines)
        return re.sub(r'\n{3,}', '\n\n', merged).strip()

    def _get_relevant_image_markdown(self, message: str, max_images: int = 5) -> str:
        try:
            image_dir = get_chatbot_image_dir()
            if image_dir is None:
                return ''

            selected = find_explicit_chatbot_images(message, max_images=max_images)
            if not selected:
                keywords = self._extract_keywords(message)
                selected = find_relevant_chatbot_images(message, keywords=keywords, max_images=max_images)
            if not selected:
                return ''

            lines = []
            for image in selected:
                display_name = str(image['display_name'])
                slug = str(image['slug'])
                lines.append(f"- slug={slug}: `![{display_name}](/api/ai/img/{slug})` -> {display_name}")
            return '\n'.join(lines)
        except Exception as e:
            current_app.logger.error(f"Error listing filtered images: {str(e)}")
            return ''

    def append_relevant_images(self, response_text: str, source_text: str, max_images: int = 5) -> str:
        if not response_text:
            return response_text
        return self._inject_inline_images(response_text, source_text, max_images=max_images)

    def _parse_api_keys(self) -> List[str]:
        raw_values = []
        keys_value = current_app.config.get('GEMINI_API_KEYS')
        single_value = current_app.config.get('GEMINI_API_KEY')
        if keys_value:
            raw_values.append(keys_value)
        if single_value:
            raw_values.append(single_value)

        parsed = []
        seen = set()
        for raw_value in raw_values:
            for item in re.split(r'[\r\n,;]+', str(raw_value)):
                key = item.strip()
                if not key or key in seen:
                    continue
                seen.add(key)
                parsed.append(key)
        return parsed

    def _mask_api_key(self, api_key: str) -> str:
        if len(api_key) <= 8:
            return '*' * len(api_key)
        return f"{api_key[:4]}...{api_key[-4:]}"

    def _reserve_api_key_order(self) -> List[str]:
        if not self.api_keys:
            return []
        with self._rotation_lock:
            start = self._next_api_key_index % len(self.api_keys)
            self._next_api_key_index = (start + 1) % len(self.api_keys)
            return self.api_keys[start:] + self.api_keys[:start]

    def _api_key_label(self, api_key: str) -> str:
        try:
            index = self.api_keys.index(api_key) + 1
        except ValueError:
            index = -1
        if index > 0:
            return f'key#{index}/{len(self.api_keys)} ({self._mask_api_key(api_key)})'
        return self._mask_api_key(api_key)

    def _should_try_next_api_key(self, error: Exception) -> bool:
        message = str(error).lower()
        retryable_markers = (
            'quota',
            'rate limit',
            'resource_exhausted',
            '429',
            '503',
            '500',
            'deadline exceeded',
            'timed out',
            'timeout',
            'temporarily unavailable',
            'service unavailable',
            'internal error',
            'api key',
            'permission denied',
            'unauthenticated',
            'invalid argument: api key',
            'invalid api key',
            'authentication',
            'connection reset',
            'connection aborted',
            'unavailable',
        )
        return any(marker in message for marker in retryable_markers)

    def _build_model(
        self,
        generation_config: Optional[Dict] = None,
        system_instruction: Optional[str] = None,
    ):
        return genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=generation_config or self.generation_config,
            safety_settings=self.safety_settings,
            system_instruction=system_instruction,
        )

    def _run_with_api_keys(self, action_name: str, operation):
        ordered_keys = self._reserve_api_key_order()
        last_error = None

        for api_key in ordered_keys:
            key_label = self._api_key_label(api_key)
            try:
                with self._genai_lock:
                    genai.configure(api_key=api_key)
                    result = operation(api_key)
                current_app.logger.info(
                    f"Gemini {action_name} succeeded with {key_label}"
                )
                return result
            except Exception as e:
                last_error = e
                should_try_next = self._should_try_next_api_key(e)
                current_app.logger.warning(
                    f"Gemini {action_name} failed with {key_label}: {str(e)}"
                )
                if not should_try_next:
                    raise e

        if last_error:
            raise last_error
        raise ValueError("No Gemini API key available")

    def _configure(self):
        """Configure Gemini API"""
        try:
            self.api_keys = self._parse_api_keys()
            if not self.api_keys:
                raise ValueError("GEMINI_API_KEY or GEMINI_API_KEYS not configured")

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
            
            with self._genai_lock:
                genai.configure(api_key=self.api_keys[0])
                self.model = self._build_model()

            
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
        chat_generation_config['max_output_tokens'] = min(chat_generation_config.get('max_output_tokens', 8192), 2048)

        # Build proper Gemini chat history format
        gemini_history = []
        if chat_history:
            for msg in chat_history[-10:]:
                role = 'user' if msg.get('role') == 'user' else 'model'
                gemini_history.append({'role': role, 'parts': [msg.get('content', '')]})

        if stream:
            raise NotImplementedError("_do_chat(stream=True) is not used; call chat_stream instead.")

        def operation(_api_key):
            model_with_system = self._build_model(
                generation_config=chat_generation_config,
                system_instruction=system_instruction,
            )
            chat = model_with_system.start_chat(history=gemini_history)
            response = chat.send_message(message)
            return response.text, chat

        return self._run_with_api_keys('chat', operation)

    def _build_chat_prompt(self, message: str, context: Optional[Dict] = None, 
                          chat_history: Optional[List[Dict]] = None) -> str:
        """Legacy method - kept for compatibility but _do_chat is preferred."""
        return message

    def chat_stream(self, message: str, context: Dict = None, chat_history: List[Dict] = None):
        """Stream Gemini response without truncating the answer mid-way."""
        system_instruction = self._get_system_instruction(message, context)
        chat_generation_config = dict(self.generation_config)
        chat_generation_config['max_output_tokens'] = min(chat_generation_config.get('max_output_tokens', 8192), 2048)

        gemini_history = []
        if chat_history:
            for msg in chat_history[-10:]:
                role = 'user' if msg.get('role') == 'user' else 'model'
                gemini_history.append({'role': role, 'parts': [msg.get('content', '')]})

        ordered_keys = self._reserve_api_key_order()
        last_error = None

        for api_key in ordered_keys:
            key_label = self._api_key_label(api_key)
            yielded_any = False
            try:
                with self._genai_lock:
                    genai.configure(api_key=api_key)
                    model_with_system = self._build_model(
                        generation_config=chat_generation_config,
                        system_instruction=system_instruction,
                    )
                    chat = model_with_system.start_chat(history=gemini_history)
                    response_stream = chat.send_message(message, stream=True)

                    for chunk in response_stream:
                        try:
                            text = getattr(chunk, 'text', '')
                            if not text:
                                continue
                            yielded_any = True
                            yield text
                        except Exception:
                            pass

                current_app.logger.info(
                    f"Gemini chat_stream succeeded with {key_label}"
                )
                return
            except Exception as e:
                last_error = e
                should_try_next = self._should_try_next_api_key(e)
                current_app.logger.warning(
                    f"Gemini chat_stream failed with {key_label}: {str(e)}"
                )
                if yielded_any:
                    yield "\n\nXin loi, ket noi toi AI bi gian doan. Ban hay gui lai cau hoi giup minh nhe."
                    return
                if not should_try_next:
                    break

        try:
            if last_error:
                raise last_error
            raise ValueError("No Gemini API key available")
        except Exception as e:
            current_app.logger.error(f"Gemini chat stream error: {str(e)}")
            yield f"Xin loi, da co loi: {str(e)}"
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

            response = self._run_with_api_keys(
                'generate_itinerary',
                lambda _api_key: self._build_model().generate_content(prompt)
            )
            
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

            response = self._run_with_api_keys(
                'suggest_places',
                lambda _api_key: self._build_model().generate_content(prompt)
            )
            
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

            response = self._run_with_api_keys(
                'estimate_cost',
                lambda _api_key: self._build_model().generate_content(prompt)
            )
            
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
    
    def _build_tourism_system_prompt(self, message: str = '') -> str:
        """Build system prompt for tourism assistant"""
        relevant_knowledge = self._get_relevant_knowledge(message)
        image_list_str = self._get_relevant_image_markdown(message)

        image_rules = "- Không chèn hình ảnh nếu không thực sự cần.\n- Tối đa 2 hình trong một câu trả lời.\n"
        if image_list_str:
            image_rules += "- Khi người dùng hỏi về một địa điểm cụ thể và có ảnh khớp, hãy luôn chèn ít nhất 1 ảnh minh họa đúng địa điểm đó ở cuối câu trả lời.\n"
            image_rules += "- Nếu bạn gợi ý nhiều địa điểm, ưu tiên ảnh của địa điểm quan trọng nhất hoặc địa điểm người dùng hỏi trực tiếp.\n"
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

    def _build_tourism_system_prompt(self, message: str = '') -> str:
        """Build system prompt for tourism assistant"""
        relevant_knowledge = self._get_relevant_knowledge(message)
        image_list_str = self._get_relevant_image_markdown(message)

        image_rules = (
            "- Nếu nhắc đến một địa điểm cụ thể và có ảnh khớp, phải đặt ảnh ngay bên dưới dòng mô tả của chính địa điểm đó.\n"
            "- Không gom ảnh thành một cụm minh họa chung ở cuối câu trả lời.\n"
            "- Không dùng ảnh của địa điểm A để minh họa cho địa điểm B.\n"
            "- Mỗi địa điểm chỉ gắn tối đa 1 ảnh, toàn bộ câu trả lời tối đa 5 ảnh.\n"
        )
        if image_list_str:
            image_rules += "- Khi liệt kê nhiều địa điểm, ưu tiên format: `- Tên địa điểm: mô tả ngắn` rồi ngay dòng dưới là markdown ảnh của đúng địa điểm đó.\n"
            image_rules += "- Chỉ được dùng chính xác các markdown ảnh sau:\n" + image_list_str
        else:
            image_rules += "- Nếu không có ảnh khớp rõ ràng thì chỉ trả lời bằng chữ.\n"

        return f"""Bạn là trợ lý du lịch thông minh chuyên về du lịch địa phương Việt Nam, đặc biệt là Ninh Thuận và Khánh Hòa.

QUY TẮC TRẢ LỜI BẮT BUỘC:
- Trả lời ngắn gọn, dễ đọc, ưu tiên chất lượng hơn số lượng.
- Với câu hỏi gợi ý địa điểm, chỉ chọn 3 đến 5 địa điểm phù hợp nhất.
- Mỗi địa điểm chỉ mô tả 1 đến 2 ý ngắn.
- Nếu người dùng hỏi rộng, hãy trả lời tóm tắt trước rồi hỏi họ có muốn đào sâu thêm không.
- Không liệt kê toàn bộ dữ liệu bạn biết trong một lần trả lời.
- Không nhắc lặp cùng một địa điểm hoặc cùng một ý.
- Nếu câu trả lời dài, hãy cắt gọn và kết bằng: 'Nếu bạn muốn, mình sẽ gợi ý thêm phần tiếp theo.'

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
