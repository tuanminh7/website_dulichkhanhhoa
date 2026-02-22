import os

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app.models.location import Location, LocationImage, Category
from app.models.interaction import Review
from app import db
from sqlalchemy import or_, func
from werkzeug.utils import secure_filename

bp = Blueprint('places', __name__, url_prefix='/api/places')


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@bp.route('', methods=['GET'])
def get_places():
    """Lấy danh sách địa điểm"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', current_app.config['ITEMS_PER_PAGE'], type=int)
        category = request.args.get('category')
        search = request.args.get('search')
        featured = request.args.get('featured', type=bool)
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')
        
        # Base query
        query = Location.query.filter(Location.status == 'ACTIVE')
        
        # Filters
        if category:
            # Assuming category is passed as ID or we need to join
            query = query.join(Category).filter(Category.name.ilike(f"%{category}%"))
        
        if featured is not None:
            # The Location model doesn't have is_featured, maybe we need to add it or use another field
            # For now, let's skip or check if it exists in another way.
            pass
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Location.name.ilike(search_term),
                    Location.description.ilike(search_term),
                    Location.address.ilike(search_term)
                )
            )
        
        # Sorting
        if sort_by == 'name':
            sort_column = Location.name
        elif sort_by == 'rating':
            sort_column = Location.rating_avg
        elif sort_by == 'view_count':
            sort_column = Location.created_at
        else:
            sort_column = Location.created_at
        
        if order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'places': [place.to_dict() for place in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:place_id>', methods=['GET'])
def get_place(place_id):
    """Lấy chi tiết địa điểm"""
    try:
        location = Location.query.get_or_404(place_id)
        
        # Increment view count - Location doesn't have view_count yet
        # location.view_count += 1
        # db.session.commit()
        
        return jsonify(location.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['POST'])
@login_required
def create_place():
    """Tạo địa điểm mới (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    try:
        data = request.form
        
        # Validate required fields
        required_fields = ['name', 'category', 'description', 'address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Thiếu trường {field}'}), 400
        
        # Create slug
        from slugify import slugify
        slug = slugify(data['name'])
        
        # Check if slug exists
        counter = 1
        original_slug = slug
        while Place.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Geocode address
        from app.services.maps_service import get_maps_service
        maps_service = get_maps_service()
        geocode_result = maps_service.geocode(data['address'])
        ##########
        latitude = None
        longitude = None
        
        # Create location
        location = Location(
            name=data['name'],
            category_id=data.get('category_id'), # Should be category_id now
            description=data.get('description'),
            address=data['address'],
            latitude=latitude,
            longitude=longitude,
            price_range_min=float(data.get('price_range_min', 0)),
            price_range_max=float(data.get('price_range_max', 0)),
            status='ACTIVE'
        )
        
        # Handle file uploads
        if 'main_image' in request.files:
            file = request.files['main_image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(upload_path)
                place.main_image = f"/static/uploads/{filename}"
        
        db.session.add(place)
        db.session.commit()
        
        return jsonify({
            'message': 'Tạo địa điểm thành công',
            'place': place.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"ERROR creating place: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:place_id>', methods=['PUT'])
@login_required
def update_place(place_id):
    """Cập nhật địa điểm (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    try:
        place = Place.query.get_or_404(place_id)
        data = request.form
        
        # Update fields
        if 'name' in data:
            place.name = data['name']
        if 'category' in data:
            place.category = data['category']
        if 'description' in data:
            place.description = data['description']
        if 'short_description' in data:
            place.short_description = data['short_description']
        if 'address' in data:
            place.address = data['address']
            # Re-geocode if address changed
            from app.services.maps_service import get_maps_service
            maps_service = get_maps_service()
            geocode_result = maps_service.geocode(data['address'])
            if geocode_result:
                place.latitude = geocode_result['latitude']
                place.longitude = geocode_result['longitude']
        
        if 'phone' in data:
            place.phone = data['phone']
        if 'email' in data:
            place.email = data['email']
        if 'website' in data:
            place.website = data['website']
        if 'price_range' in data:
            place.price_range = data['price_range']
        if 'estimated_cost' in data:
            place.estimated_cost = float(data['estimated_cost'])
        if 'tags' in data:
            place.tags = data['tags']
        if 'features' in data:
            place.features = data['features']
        if 'opening_hours' in data:
            place.opening_hours = data['opening_hours']
        if 'is_featured' in data:
            place.is_featured = data['is_featured'].lower() == 'true'
        if 'is_active' in data:
            place.is_active = data['is_active'].lower() == 'true'
        
        # Handle file upload
        if 'main_image' in request.files:
            file = request.files['main_image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(upload_path)
                place.main_image = f"/static/uploads/{filename}"
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật thành công',
            'place': place.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:place_id>', methods=['DELETE'])
@login_required
def delete_place(place_id):
    """Xóa địa điểm (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    try:
        location = Location.query.get_or_404(place_id)
        
        # Soft delete
        location.status = 'INACTIVE'
        db.session.commit()
        
        return jsonify({'message': 'Xóa địa điểm thành công'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:place_id>/reviews', methods=['POST'])
@login_required
def add_review(place_id):
    try:
        place = Place.query.get_or_404(place_id)
        data = request.get_json()
        
        rating = data.get('rating')
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating phải từ 1-5'}), 400
        
        # Check if user already reviewed
        existing_review = Review.query.filter_by(
            place_id=place_id,
            user_id=current_user.id
        ).first()
        
        if existing_review:
            return jsonify({'error': 'Bạn đã đánh giá địa điểm này'}), 400
        
        review = Review(
            place_id=place_id,
            user_id=current_user.id,
            rating=rating,
            title=data.get('title'),
            content=data.get('content')
        )
        
        db.session.add(review)
        
        # Update location rating
        avg_rating = db.session.query(func.avg(Review.rating)).filter_by(location_id=place_id).scalar()
        location.rating_avg = round(avg_rating, 1) if avg_rating else 0
        # location.review_count += 1 # Location model doesn't have review_count
        
        db.session.commit()
        
        return jsonify({
            'message': 'Thêm đánh giá thành công',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/categories', methods=['GET'])
def get_categories():
    """Lấy danh sách categories"""
    categories = {
        'tourist_spot': 'Điểm du lịch',
        'restaurant': 'Nhà hàng',
        'accommodation': 'Lưu trú',
        'activity': 'Hoạt động'
    }
    return jsonify(categories)