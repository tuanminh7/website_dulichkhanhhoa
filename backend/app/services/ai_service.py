import google.generativeai as genai
from flask import current_app
import json, os
from typing import List, Dict, Optional


class GeminiAIService:

    def __init__(self):
        self.model = None
        self.knowledge_base = ""
        self._configure()
        self._load_knowledge_base()

    def _load_knowledge_base(self):
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
        try:
            api_key = current_app.config.get('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")

            genai.configure(api_key=api_key)

            self.model_name = current_app.config.get('GEMINI_MODEL', 'gemini-2.5-flash-preview-04-17')

            generation_config = {
                "temperature": current_app.config.get('AI_TEMPERATURE', 0.8),
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": current_app.config.get('AI_MAX_TOKENS', 8192),
            }

            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_NONE"},
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

    def _get_system_instruction(self, context: Optional[Dict] = None) -> str:
        system = self._build_tourism_system_prompt()
        if context:
            system += f"\n\nThong tin bo sung ve nguoi dung:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
        return system

    def _do_chat(self, message: str, context: Optional[Dict] = None,
                 chat_history: Optional[List[Dict]] = None, stream: bool = False):
        system_instruction = self._get_system_instruction(context)

        model_with_system = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=self.generation_config,
            safety_settings=self.safety_settings,
            system_instruction=system_instruction
        )

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

    def chat(self, message: str, context: Optional[Dict] = None,
             chat_history: Optional[List[Dict]] = None) -> Dict:
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
                'response': 'Xin loi, toi dang gap su co ky thuat. Vui long thu lai sau.'
            }

    def chat_stream(self, message: str, context: Dict = None, chat_history: List[Dict] = None):
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
            yield f"Xin loi, da co loi: {str(e)}"

    def _build_tourism_system_prompt(self) -> str:
        """
        Build system prompt.
        Danh sach anh dung TEN FILE thuc te (khong extension, khong so thu tu).
        Route /api/ai/img/<slug> se tim theo ten file.
        """

        # Map: ten hien thi -> ten file (khong extension)
        # Lay chinh xac tu lenh `dir /b` trong folder anh
        IMAGES = [
            ("Bien Ca Na",                                               "Bien Ca Na"),
            ("Banh can",                                                 "Banh can"),
            ("Bai bien Binh Tien",                                       "Bai bien Binh Tien"),
            ("Bai bien Doc Let Nha Trang",                               "bai bien doc let nha trang"),
            ("Bai Hom - Noi rua bien ve de trung",                       "Bai Hom - Noi rua bien ve de trung"),
            ("Bai Trang - Thien duong cam trai",                         "Bai Trang - Thien duong cam trai"),
            ("Bun sua",                                                   "Bun sua"),
            ("Bao tang Ninh Thuan - Dau an kien truc doc dao",           "Bao tang Ninh Thuan - Dau an kien truc doc dao"),
            ("Chua Tu Van",                                              "Chua Tu Van"),
            ("Canh dong dien gio Dam Nai - Bieu tuong nang luong sach",  "Canh dong dien gio Dam Nai - Bieu tuong nang luong sach"),
            ("Du lich Binh Hung Khanh Hoa",                              "Du lich Binh Hung khanh hoa"),
            ("Du lich Binh Lap",                                         "Du lich Binh Lap"),
            ("Du lich Binh Tien",                                        "Du lich Binh Tien"),
            ("Du lich Vinpearl - Hon Tre",                               "Du lich Vinpearl - Hon Tre"),
            ("Hang Rai",                                                  "Hang Rai"),
            ("Hon Chong - Hon Vo Nha Trang",                             "Hon Chong - Hon Vo Nha Trang"),
            ("Hon Noi - Dao Yen Nha Trang",                              "Hon Noi - Dao Yen Nha Trang"),
            ("Hon Do - Thien duong san ho duoi long bien",               "Hon Do - Thien duong san ho duoi long bien"),
            ("Khu du lich Suoi Hoa Lan",                                 "Khu du lich Suoi Hoa Lan"),
            ("Lang Gom Bau Truc",                                        "Lang Gom Bau Truc"),
            ("Lang nho Thai An - Thu phu nho",                           "Lang nho Thai An - Thu phu nho"),
            ("Mui Da Vach",                                              "Mui Da Vach"),
            ("Mui Doi (mui Dien) - Diem Cuc Dong dat lien cua To quoc",  "Mui Doi (mui Dien) - Diem Cuc Dong dat lien cua To quoc"),
            ("Nha Tho Nui",                                              "Nha Tho Nui"),
            ("Nui Da Chong (Nui Phung Hoang)",                           "Nui Da Chong (Nui Phung Hoang)"),
            ("Rung thong Khanh Son",                                     "Rung thong Khanh Son"),
            ("Thanh co Dien Khanh",                                      "Thanh co Dien Khanh"),
            ("Thac Chapo",                                               "Thac Chapo"),
            ("Thac Ta Gu",                                               "Thac Ta Gu"),
            ("Thap Ba Ponagar",                                          "Thap Ba Ponagar"),
            ("Thap Po Klong Garai",                                      "Thap Po Klong Garai"),
            ("Trung Son Co Tu - Ngoi chua tren dinh nui Da Chong",       "Trung Son Co Tu - Ngoi chua tren dinh nui Da Chong"),
            ("Trai nghiem net dep van hoa dong bao Raglai",              "Trai nghiem net dep van hoa cua dong bao Raglai"),
            ("Vien Hai Duong Hoc Nha Trang",                             "Vien Hai Duong Hoc Nha Trang"),
            ("Vuon nho Ba Moi - Trai nghiem van hoa nho Ninh Thuan",     "Vuon nho Ba Moi - Trai nghiem van hoa nho Ninh Thuan"),
            ("Vuon quoc gia Nui Chua - Rung kho han chau Phi cua VN",    "Vuon quoc gia Nui Chua - Rung kho han chau Phi cua Viet Nam"),
            ("Vuon quoc gia Phuoc Binh",                                 "Vuon quoc gia Phuoc Binh"),
            ("Vinh Van Phong",                                           "Vinh Van Phong"),
            ("Vinh Vinh Hy",                                             "Vinh Vinh Hy"),
            ("Diep Son",                                                  "Diep Son"),
            ("Deo Ngoan Muc",                                            "Deo Ngoan Muc"),
            ("Dao Robinson",                                             "Dao Robinson"),
            ("Dam Nai",                                                   "Dam Nai"),
            ("Doi cat Nam Cuong",                                        "Doi cat Nam Cuong"),
            ("Dong Cuu Ysa Nui Hon Vang Krong Pha",                      "Dong Cuu Ysa Nui Hon Vang Krong Pha"),
        ]

        # Sinh danh sach anh cho prompt
        # Dung ten file (slug) de AI tra ve dung anh, khong phu thuoc thu tu
        image_list_str = ""
        for display_name, file_slug in IMAGES:
            image_list_str += f"- {display_name}: ![{display_name}](/api/ai/img/{file_slug})\n"

        return f"""Ban la tro ly du lich thong minh ten la "Khanh Hoa Travel AI", chuyen tu van du lich tai tinh Khanh Hoa va Ninh Thuan, Viet Nam.

=== QUY TAC DINH DANG BAT BUOC ===
- TUYET DOI KHONG dung dau thang (#, ##, ###) lam tieu de.
- TUYET DOI KHONG dung dau sao doi (**text**) de boi dam.
- CHI dung: van ban thuan, xuong dong, dau gach dau dong (-), va so thu tu (1. 2. 3.).
- Khi liet ke dia diem, moi dia diem viet tren mot dong rieng, co gach dau dong.

=== QUY TAC CHEN ANH BAT BUOC ===
- Sau khi gioi thieu mot dia diem, BAT BUOC chen anh minh hoa ngay ben duoi neu co trong danh sach.
- Dung DUNG cu phap Markdown: ![ten dia diem](/api/ai/img/ten-file)
- Chi dung ten file co trong danh sach anh ben duoi, TUYET DOI KHONG tu bia ten file.
- Moi dia diem chen 1 anh, dat tren mot dong rieng ngay sau phan mo ta.
- Vi du dinh dang dung:

- Vinh Vinh Hy: vinh bien dep hoang so, nuoc trong xanh, ly tuong cho nghi duong yen tinh.
![Vinh Vinh Hy](/api/ai/img/Vinh Vinh Hy)

=== CHIEN LUOC TU VAN THONG MINH ===

BUOC 1 - THAM DO SO THICH (quan trong nhat):
Khi khach hoi chung chung ve du lich mot dia diem, ban PHAI hoi tham do truoc khi tu van:

"Tuyet voi! Khanh Hoa co rat nhieu loai hinh du lich thu vi. De tu van phu hop nhat cho ban, minh can hoi them mot chut nhe:

Ban muon loai hinh du lich nao?
- Du lich bien (tam bien, lan san ho, the thao nuoc)
- Nghi duong (resort cao cap, spa, thu gian)
- Sinh thai / Thien nhien (rung, thac, nui)
- Phuot / Kham pha (deo, lang chai, vung xa)
- Cam trai / Glamping
- Am thuc va van hoa dia phuong
- Ket hop nhieu loai hinh

Ngoai ra, ban di may ngay va di cung ai (gia dinh, ban be, cap doi, hay di mot minh)?"

BUOC 2 - TU VAN CHI TIET SAU KHI BIET SO THICH:
Sau khi khach tra loi, hay tu van dia diem phu hop theo tung loai hinh:

Neu khach chon NGHI DUONG:
- Liet ke 5-8 resort/khach san cao cap tai Nha Trang, Cam Ranh
- Moi dia diem ghi ro: ten, vi tri, muc gia uoc tinh/dem, diem noi bat
- Chen anh minh hoa neu co trong danh sach anh
- Goi y them: spa nao ngon, nha hang view dep, hoat dong tai resort

Neu khach chon DU LICH BIEN:
- Liet ke cac bai bien dep: Bai Dai, Bai Tru, Doc Let, Bai Tien, Van Phong
- Goi y hoat dong: lan ngam san ho, cheo kayak, jet-ski, cau ca
- Dao nao dang di: Hon Mun, Hon Tam, Hon Mieu
- Chen anh minh hoa phu hop

Neu khach chon SINH THAI / THIEN NHIEN:
- Thac Yangbay, Ho Suoi Dau, rung quoc gia Hon Ba
- Cac tour sinh thai cong dong
- Chen anh minh hoa phu hop

Neu khach chon PHUOT / KHAM PHA:
- Deo Ca, Deo Ro Tuong, Van Ninh, lang chai Dam Mon
- Cung duong ven bien dep
- Chen anh minh hoa phu hop

Neu khach chon CAM TRAI / GLAMPING:
- Bai Dai Cam Ranh, Van Phong, Doc Let
- Cac diem glamping dang hot
- Chen anh minh hoa phu hop

Neu khach chon AM THUC:
- Bun sua, banh canh cha ca, nem Ninh Hoa, yen sao
- Cho dem, pho am thuc tai Nha Trang
- Nha hang hai san tuoi song nen thu

BUOC 3 - GOI Y THEM SAU KHI TU VAN:
"Ban co muon minh len lich trinh chi tiet theo ngay khong? Chi can cho minh biet ban co bao nhieu ngay va ngan sach du kien la minh se len ke hoach cu the cho ban nhe!"

=== XU LY CAC TINH HUONG DAC BIET ===

Khi khach hoi ve CHI PHI:
- Luon dua ra khoang gia (thap - trung binh - cao cap)
- Uoc tinh tong chi phi cho chuyen di theo so ngay
- Goi y cach tiet kiem

Khi khach hoi ve THOI DIEM DI:
- Khanh Hoa dep nhat thang 1-8 (mua kho)
- Tranh thang 9-12 (mua mua bao)
- Thang 6-8 dong khach, nen dat truoc

Khi khach hoi ve DI CHUYEN:
- Tu TP.HCM: may bay 1 tieng, tau 8-10 tieng, xe khach 10-12 tieng
- Tai Nha Trang: thue xe may 100-150k/ngay, taxi, Grab

Khi khach hoi khong lien quan den du lich Khanh Hoa / Ninh Thuan:
- Lich su tu choi va nhac lai chuyen mon cua ban
- Goi y cau hoi lien quan den du lich

=== DANH SACH ANH (chi dung ten file chinh xac, khong tu bia) ===
{image_list_str}

=== KIEN THUC CHUYEN MON (UU TIEN CAO NHAT) ===
Du lieu ben duoi la thong tin thuc te ve dia diem, khach san, am thuc tai Khanh Hoa va Ninh Thuan. Ban PHAI uu tien dung thong tin nay khi tu van:

{self.knowledge_base}"""

    def generate_itinerary(self, preferences: Dict) -> Dict:
        try:
            prompt = self._build_itinerary_prompt(preferences)
            response = self.model.generate_content(prompt)
            try:
                itinerary_data = self._parse_json_response(response.text)
            except Exception:
                itinerary_data = {
                    'title': 'Lich trinh du lich',
                    'description': response.text,
                    'days': []
                }
            return {'success': True, 'itinerary': itinerary_data, 'model': self.model_name}
        except Exception as e:
            current_app.logger.error(f"Gemini itinerary generation error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def suggest_places(self, criteria: dict, available_places: list) -> dict:
        try:
            prompt = self._build_suggestion_prompt(criteria, available_places)
            response = self.model.generate_content(prompt)
            try:
                suggestions = self._parse_json_response(response.text)
            except Exception:
                suggestions = {'places': [], 'explanation': response.text}
            return {'success': True, 'suggestions': suggestions, 'model': self.model_name}
        except Exception as e:
            current_app.logger.error(f"Gemini suggestion error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def estimate_cost(self, itinerary_data: dict) -> dict:
        try:
            prompt = self._build_cost_estimation_prompt(itinerary_data)
            response = self.model.generate_content(prompt)
            try:
                cost_data = self._parse_json_response(response.text)
            except Exception:
                cost_data = {'total': 0, 'breakdown': {}, 'explanation': response.text}
            return {'success': True, 'cost': cost_data, 'model': self.model_name}
        except Exception as e:
            current_app.logger.error(f"Gemini cost estimation error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _build_itinerary_prompt(self, preferences: dict) -> str:
        duration = preferences.get('duration', 3)
        budget = preferences.get('budget', 'medium')
        interests = preferences.get('interests', [])
        location = preferences.get('location', 'Khanh Hoa')

        budget_map = {
            'low':    'tiet kiem (duoi 500k/ngay)',
            'medium': 'trung binh (500k - 1.5 trieu/ngay)',
            'high':   'cao cap (tren 1.5 trieu/ngay)'
        }
        budget_label = budget_map.get(budget, budget)

        return f"""Hay tao mot lich trinh du lich chi tiet voi cac thong tin sau:

Thong tin chuyen di:
- Dia diem: {location}
- Thoi gian: {duration} ngay
- Ngan sach: {budget_label}
- So thich: {', '.join(interests) if interests else 'Tong hop'}

Yeu cau:
1. Lich trinh theo tung ngay voi thoi gian cu the (sang/trua/chieu/toi)
2. Goi y dia diem tham quan, an uong, nghi ngoi phu hop ngan sach
3. Uoc tinh chi phi tung hoat dong (don vi: VND)
4. Loi khuyen ve di chuyen giua cac diem
5. Tips va luu y quan trong

Tra ve ket qua duoi dang JSON voi cau truc:
{{
  "title": "Ten lich trinh",
  "description": "Mo ta tong quan",
  "duration_days": {duration},
  "estimated_cost": 0,
  "days": [
    {{
      "day": 1,
      "title": "Tieu de ngay 1",
      "activities": [
        {{
          "time": "08:00",
          "activity": "Ten hoat dong",
          "location": "Dia diem",
          "description": "Mo ta chi tiet",
          "estimated_cost": 0,
          "duration": "2 gio"
        }}
      ]
    }}
  ],
  "tips": ["Loi khuyen 1", "Loi khuyen 2"]
}}"""

    def _build_suggestion_prompt(self, criteria: dict, places: list) -> str:
        category  = criteria.get('category', 'all')
        budget    = criteria.get('budget', 'medium')
        interests = criteria.get('interests', [])

        return f"""Dua tren danh sach dia diem sau va tieu chi cua khach, hay goi y 5-10 dia diem phu hop nhat:

Tieu chi:
- Loai hinh: {category}
- Ngan sach: {budget}
- So thich: {', '.join(interests) if interests else 'Tong hop'}

Danh sach dia diem:
{json.dumps(places, ensure_ascii=False, indent=2)}

Tra ve JSON voi cau truc:
{{
  "recommendations": [
    {{
      "place_id": 1,
      "name": "Ten dia diem",
      "reason": "Ly do goi y cu the",
      "rating": 4.5,
      "estimated_cost": 0
    }}
  ],
  "explanation": "Giai thich tong quan ve cac goi y"
}}"""

    def _build_cost_estimation_prompt(self, itinerary: dict) -> str:
        return f"""Uoc tinh chi phi chi tiet cho lich trinh du lich sau tai Khanh Hoa / Ninh Thuan, Viet Nam:

{json.dumps(itinerary, ensure_ascii=False, indent=2)}

Tra ve JSON voi cau truc:
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
  "notes": ["Ghi chu ve chi phi"],
  "tips": ["Tips tiet kiem chi phi"]
}}

Luu y: Tinh toan dua tren gia ca thuc te tai Khanh Hoa, Viet Nam nam 2024-2025."""

    def _parse_json_response(self, text: str) -> dict:
        if '```json' in text:
            start = text.find('```json') + 7
            end = text.find('```', start)
            text = text[start:end].strip()
        elif '```' in text:
            start = text.find('```') + 3
            end = text.find('```', start)
            text = text[start:end].strip()
        return json.loads(text)


# Singleton
_ai_service = None

def get_ai_service() -> GeminiAIService:
    global _ai_service
    if _ai_service is None:
        try:
            _ai_service = GeminiAIService()
        except Exception as e:
            _ai_service = None
            raise
    return _ai_service