import os
import argparse
from app import create_app, db
from app.models.location import Location, Category

# Dữ liệu được nhúng trực tiếp từ data_entry_template.md
TOURISM_DATA = [
    {
        "name": "Cung đường biển Vĩnh Hy - Bình Tiên",
        "description": "Được mệnh danh là một trong những cung đường ven biển đẹp nhất Việt Nam, nơi này mê hoặc du khách bởi sự kết hợp hoàn hảo giữa một bên là dãy núi Chúa hùng vĩ, một bên là nước biển xanh ngắt tận chân trời. Những khúc cua uốn lượn quanh co mở ra tầm nhìn bao quát toàn cảnh các vịnh biển, bãi đá và những làng chài yên bình thấp thoáng xa xa.",
        "address": "Nối liền vịnh Vĩnh Hy (Ninh Thuận) và biển Bình Tiên",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Bãi biển Bình Tiên",
        "description": "Nằm ẩn mình giữa ranh giới hai tỉnh Ninh Thuận và Khánh Hòa, Bình Tiên như một \"viên ngọc quý\" chưa mài giũa với vẻ đẹp hoang sơ, tĩnh lặng. Bãi biển ở đây thoai thoải, sóng êm, nước trong xanh thấu đáy và được bao bọc bởi những rừng thông xanh mát, rất lý tưởng cho những ai muốn tìm kiếm không gian yên bình để thư giãn và tách biệt khỏi sự ồn ào.",
        "address": "Công Hải, Thuận Bắc, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Bãi Hỏm",
        "description": "Được ví như một \"ốc đảo\" huyền bí, Bãi Hỏm sở hữu những rặng đá vôi đa dạng hình thù và hệ sinh thái biển vô cùng phong phú. Đây là một trong số ít những bãi biển tại Việt Nam được rùa biển lựa chọn làm nơi quay về đẻ trứng hàng năm, minh chứng cho môi trường thiên nhiên trong lành và được bảo tồn nghiêm ngặt.",
        "address": "Vĩnh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Bãi Tràng",
        "description": "Nằm ngay dưới chân mũi Dinh, Bãi Tràng sở hữu bãi cát trắng mịn màng trải dài như sa mạc nhỏ sát cạnh bờ biển xanh ngắt. Đây là địa điểm lý tưởng cho các hoạt động cắm trại qua đêm, nơi bạn có thể ngắm bầu trời sao rực rỡ và thức dậy đón những tia nắng đầu tiên của ngày mới trong tiếng sóng vỗ rì rào.",
        "address": "Phước Dinh, Thuận Nam, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Bánh căn",
        "description": "Món ăn đặc sản dân dã nhưng đầy tinh tế của vùng đất nắng gió. Bánh được đổ trong những khuôn đất nung nhỏ, làm từ bột gạo, kết hợp với nhân trứng, mực hoặc tôm tươi rói. Điểm nhấn của món ăn chính là bát nước chấm đa dạng từ nước mắm đậu phộng béo ngậy đến nước mắm cá kho đậm đà, ăn kèm với xà lách và các loại rau thơm.",
        "address": "Các quán ăn tại Phan Rang - Tháp Chàm",
        "type": "FOOD",
        "price_range_min": 20000.0,
        "price_range_max": 50000.0
    },
    {
        "name": "Bảo tàng Ninh Thuận",
        "description": "Tọa lạc ngay trung tâm thành phố với kiến trúc hình khối kim tự tháp cách điệu cực kỳ ấn tượng, đây là nơi lưu giữ và trưng bày hàng nghìn hiện vật lịch sử, văn hóa của các dân tộc Kinh, Chăm, Raglai. Không gian bảo tàng giúp du khách có cái nhìn sâu sắc về tiến trình hình thành và phát triển của vùng đất Ninh Thuận qua các thời kỳ.",
        "address": "Phan Rang - Tháp Chàm, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 10000.0,
        "price_range_max": 20000.0
    },
    {
        "name": "Biển Cà Ná",
        "description": "Nằm sát cạnh quốc lộ 1A, Cà Ná hiện ra như một bức tranh thủy mặc với sự hòa quyện của núi non, biển cả và những rặng san hô rực rỡ. Nước biển ở đây có độ mặn cao nên rất xanh trong, bãi cát trắng trải dài uốn lượn theo sườn núi tạo nên một khung cảnh hùng vĩ, được mệnh danh là một trong những bãi biển đẹp nhất miền Trung.",
        "address": "Thuận Nam, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Bún sứa",
        "description": "Một món ăn mang đậm hương vị biển cả với những miếng sứa trắng đục, giòn sần sật. Nước dùng được nấu từ các loại cá biển nên có vị ngọt thanh tự nhiên, không hề mỡ màng. Bát bún sứa nóng hổi, ăn kèm với rau sống thái nhỏ, một chút ớt cay và mắm tôm tạo nên hương vị khó quên cho bất kỳ thực khách nào.",
        "address": "Các quán ăn tại TP. Phan Rang",
        "type": "FOOD",
        "price_range_min": 30000.0,
        "price_range_max": 50000.0
    },
    {
        "name": "Cánh đồng điện gió Đầm Nại",
        "description": "Những chiếc \"chong chóng khổng lồ\" trắng muốt nổi bật giữa cánh đồng lúa xanh rì hoặc vàng óng tùy theo mùa, phía xa là dãy núi nhấp nhô. Đây không chỉ là công trình năng lượng sạch hiện đại mà còn là tọa độ check-in \"sống ảo\" cực chất, mang đến khung cảnh thơ mộng tựa như những vùng quê ở châu Âu.",
        "address": "Tân Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Đầm Nại",
        "description": "Một đầm nước mặn rộng lớn có vai trò quan trọng trong hệ sinh thái và kinh tế của địa phương. Tại đây, du khách có thể quan sát cuộc sống thanh bình của ngư dân với những chiếc ghe thuyền tấp nập, tham quan chợ cá sớm hoặc ngắm cảnh hoàng hôn buông xuống nhuộm đỏ cả mặt đầm tĩnh lặng.",
        "address": "Thị trấn Khánh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Đèo Ngoạn Mục",
        "description": "Đúng như tên gọi, đây là một trong những con đèo hiểm trở và có cảnh quan kỳ vĩ nhất Việt Nam nối liền thung lũng Ninh Sơn với cao nguyên Lang Biang. Cung đường uốn lượn với những khúc cua \"tay áo\" gắt gao mang lại cảm giác chinh phục đầy phấn khích cho những tín đồ xê dịch, đồng thời mở ra tầm nhìn bao quát xuống vùng đồng bằng ven biển.",
        "address": "Quốc lộ 27, huyện Ninh Sơn, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Đồi cát Nam Cương",
        "description": "Khác với những đồi cát khác, Nam Cương mang vẻ đẹp dịu dàng và mang đậm hơi thở văn hóa Chăm. Những triền cát nhấp nhô thay đổi hình dáng theo từng đợt gió thổi, tạo nên những đường vân sóng cát đẹp mắt. Hình ảnh những cô gái Chăm trong trang phục truyền thống đội lu nước đi trên cát là khoảnh khắc đặc trưng mà nhiều nhiếp ảnh gia săn đón.",
        "address": "An Hải, Ninh Phước, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Đồng cừu YSá - Núi Hòn Vang",
        "description": "Một địa điểm mang phong cách du mục đậm nét với đàn cừu hàng nghìn con nhởn nhơ gặm cỏ dưới chân núi Hòn Vang hùng vĩ. Không gian bao la, khoáng đạt cùng hình ảnh những chú cừu dễ thương tạo nên một khung cảnh yên bình như vùng thảo nguyên Mông Cổ, cực kỳ thích hợp để chụp ảnh và trải nghiệm cuộc sống chăn nuôi của người dân địa phương.",
        "address": "Krông Pha, Ninh Sơn, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 20000.0,
        "price_range_max": 50000.0
    },
    {
        "name": "Hang Rái",
        "description": "Một tuyệt tác của thiên nhiên với bãi san hô cổ hàng triệu năm tuổi nhô lên mặt biển như một \"thác nước trên đại dương\" khi sóng vỗ vào. Nơi đây sở hữu địa hình đá vôi độc đáo, các hốc đá tự nhiên chứa đầy nước biển trong vắt như những hồ bơi vô cực nhỏ xinh, tạo nên cảnh quan kỳ ảo đặc biệt vào lúc bình minh.",
        "address": "Vĩnh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 20000.0,
        "price_range_max": 35000.0
    },
    {
        "name": "Hòn Đỏ",
        "description": "Không chỉ là một địa danh có cảnh quan hoang sơ với những rừng dương xanh ngắt và đá san hô nhọn hoắt, Hòn Đỏ còn là thiên đường cho những ai yêu thích khám phá đại dương. Dưới làn nước trong xanh là những rặng san hô rực rỡ màu sắc và hệ sinh thái biển đa dạng, rất lý tưởng cho hoạt động lặn ngắm san hô và câu cá giải trí.",
        "address": "Thanh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Làng gốm Bàu Trúc",
        "description": "Được xem là một trong những làng gốm cổ xưa nhất Đông Nam Á còn tồn tại, nơi đây lưu giữ kỹ thuật làm gốm thủ công độc đáo \"tay quay, mông xoay\" - tức là nghệ nhân đi lùi quanh khối đất để tạo hình thay vì dùng bàn xoay. Những sản phẩm gốm mộc mạc với hoa văn mang đậm bản sắc văn hóa Champa luôn có sức hút kỳ lạ với du khách.",
        "address": "Thị trấn Phước Dân, Ninh Phước, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 100000.0
    },
    {
        "name": "Làng nho Thái An",
        "description": "Được mệnh danh là \"thu phủ nho\" của Ninh Thuận, Thái An chào đón du khách bằng những vườn nho xanh mướt, trĩu quả treo lủng lẳng ngay trên đầu. Bạn có thể tự tay hái những chùm nho chín mọng, thưởng thức ngay tại vườn và tìm hiểu về quy trình trồng nho, làm mật nho hay rượu nho từ những người nông dân hiền lành, hiếu khách.",
        "address": "Vĩnh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 100000.0
    },
    {
        "name": "Mũi Đá Vách",
        "description": "Một bức tường đá khổng lồ sừng sững dựng đứng sát mép biển, chịu đựng sự bào mòn của sóng và gió qua hàng ngàn năm tạo nên những vết cắt sắc sảo như được đẽo gọt. Đây là thử thách thú vị cho những tín đồ trekking với con đường ven biển đầy sỏi đá nhưng bù lại là khung cảnh biển trời bao la cực kỳ mãn nhãn.",
        "address": "Vĩnh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Núi Đá Chồng (Núi Phượng Hoàng)",
        "description": "Ngọn núi nổi tiếng với những tảng đá khổng lồ xếp chồng lên nhau một cách chênh vênh nhưng lại vô cùng vững chãi qua bao năm tháng. Từ đỉnh núi, du khách có thể phóng tầm mắt bao quát toàn cảnh đầm Nại, những cánh đồng lúa và bờ biển Ninh Chữ xinh đẹp, cảm nhận luồng gió biển mát rượi thổi qua.",
        "address": "Thị trấn Khánh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Thác Chapơr",
        "description": "Nằm sâu trong những cánh rừng nguyên sinh của huyện miền núi Bác Ái, thác Chapơr đổ từ trên cao xuống như một dải lụa trắng giữa màu xanh của đại ngàn. Đây là dòng thác gắn liền với những truyền thuyết lãng mạn của người Raglai, nơi du khách có thể đắm mình trong làn nước mát lạnh và tận hưởng không gian tĩnh lặng của núi rừng.",
        "address": "Phước Tân, Bác Ái, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 20000.0,
        "price_range_max": 50000.0
    },
    {
        "name": "Tháp Po Klong Garai",
        "description": "Cụm tháp Chàm hùng vĩ và còn nguyên vẹn nhất tại Việt Nam, biểu tượng của văn hóa và kiến trúc Champa tinh xảo. Những viên gạch đỏ được xếp khít nhau không thấy mạch vữa, các phù điêu chạm khắc cầu kỳ trên thân tháp kể lại những câu chuyện về các vị thần và lịch sử dân tộc Chăm, tạo nên một không gian tâm linh đầy huyền bí.",
        "address": "Đồi Trầu, Phan Rang - Tháp Chàm, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 20000.0,
        "price_range_max": 40000.0
    },
    {
        "name": "Trùng Sơn Cổ Tự",
        "description": "Ngôi chùa uy nghi tọa lạc trên sườn núi Đá Chồng với lối kiến trúc kết hợp hài hòa giữa nét truyền thống Việt Nam và kiến trúc vùng đất nắng gió. Với hệ thống bậc thang bằng đá xanh dẫn lên đỉnh, ngôi chùa mang lại không gian thanh tịnh và là điểm ngắm cảnh toàn thành phố Phan Rang từ trên cao cực kỳ lý tưởng.",
        "address": "Thị trấn Khánh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 0.0
    },
    {
        "name": "Vịnh Vĩnh Hy",
        "description": "Được công nhận là một trong 8 vịnh đẹp nhất Việt Nam, Vĩnh Hy mang vẻ đẹp như một bức tranh thủy mặc với biển xanh trong veo bao bọc bởi những dãy núi đá vôi. Tại đây, du khách có thể đi tàu đáy kính ngắm san hô, thưởng thức hải sản tươi sống ngay trên bè hoặc lặn biển khám phá thế giới dưới nước kỳ thú.",
        "address": "Vĩnh Hải, Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 500000.0
    },
    {
        "name": "Vườn nho Ba Mọi",
        "description": "Một trong những vườn nho lâu đời và nổi tiếng nhất Ninh Thuận, nơi đi đầu trong việc phát triển du lịch sinh thái nông nghiệp. Đến đây, du khách được nghe chú Ba Mọi chia sẻ về cách trồng nho sạch, thưởng thức nho tươi, mật nho và rượu nho hoàn toàn miễn phí, cảm nhận sự mộc mạc và chân thành của con người đất Phan.",
        "address": "Hiệp Hòa, Phước Thuận, Ninh Phước, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 0.0,
        "price_range_max": 200000.0
    },
    {
        "name": "Vườn quốc gia Núi Chúa",
        "description": "Khu bảo tồn sinh quyển thế giới với hệ sinh thái rừng khô hạn độc đáo hiếm có, được ví như \"Châu Phi ở Việt Nam\". Nơi đây sở hữu địa hình đa dạng từ núi cao đến bờ biển, là nhà của nhiều loài động thực vật quý hiếm. Những con đường trekking xuyên rừng tại Núi Chúa luôn mang đến trải nghiệm thiên nhiên nguyên sơ và hoang dã đầy thú vị.",
        "address": "Ninh Hải, Ninh Thuận",
        "type": "ATTRACTION",
        "price_range_min": 20000.0,
        "price_range_max": 110000.0
    }
]

def import_to_db(dry_run=False):
    app = create_app(os.getenv('FLASK_ENV', 'production'))
    
    with app.app_context():
        # Lấy danh sách Categories
        categories = {c.type: c.id for c in Category.query.all()}
        
        if not categories:
            print("Error: Không tìm thấy Categories trong database. Hãy đảm bảo bạn đã chạy seed-baseline.")
            return

        count = 0
        skipped = 0
        for data in TOURISM_DATA:
            # Kiểm tra trùng lặp theo tên
            exists = Location.query.filter_by(name=data['name']).first()
            if exists:
                print(f"Bỏ qua (đã tồn tại): {data['name']}")
                skipped += 1
                continue
            
            cat_id = categories.get(data['type'])
            if not cat_id:
                print(f"Cảnh báo: Không thấy loại {data['type']} cho {data['name']}. Dùng mặc định ATTRACTION.")
                cat_id = categories.get('ATTRACTION')

            if not dry_run:
                new_location = Location(
                    name=data['name'],
                    description=data['description'],
                    address=data['address'],
                    category_id=cat_id,
                    price_range_min=data['price_range_min'],
                    price_range_max=data['price_range_max'],
                    status='ACTIVE'
                )
                db.session.add(new_location)
                print(f"Đã thêm: {data['name']}")
            else:
                print(f"[DRY-RUN] Sẽ thêm: {data['name']} ({data['type']})")
            
            count += 1

        if not dry_run:
            db.session.commit()
            print(f"--- THÀNH CÔNG ---")
            print(f"Đã thêm mới: {count} địa điểm.")
            print(f"Đã bỏ qua (trùng): {skipped} địa điểm.")
        else:
            print(f"--- KIỂM TRA (DRY-RUN) ---")
            print(f"Tìm thấy {count} địa điểm để thêm. {skipped} sẽ được bỏ qua.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import dữ liệu du lịch vào database.')
    parser.add_argument('--dry-run', action='store_true', help='Chạy thử không ghi vào database')
    args = parser.parse_args()

    print(f"Bắt đầu quá trình {'chạy thử' if args.dry_run else 'import'} {len(TOURISM_DATA)} địa điểm...")
    import_to_db(dry_run=args.dry_run)
