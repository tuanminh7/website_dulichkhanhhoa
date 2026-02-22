from flask import current_app
from app.models.location import Location, Category
from app.models.interaction import Review
from app import db
from sqlalchemy import or_, func
import os
import json
from werkzeug.utils import secure_filename

class PlacesService:
    """Service for managing locations and categories"""

    @staticmethod
    def get_places(params):
        """Get a list of places based on filters"""
        try:
            page = params.get('page', 1)
            per_page = params.get('per_page', current_app.config.get('ITEMS_PER_PAGE', 10))
            category = params.get('category')
            search = params.get('search')
            featured = params.get('featured')
            sort_by = params.get('sort_by', 'created_at')
            order = params.get('order', 'desc')

            query = Location.query.filter(Location.status == 'ACTIVE')

            if category:
                query = query.join(Category).filter(Category.name.ilike(f"%{category}%"))

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
            else:
                sort_column = Location.created_at

            if order == 'asc':
                query = query.order_by(sort_column.asc())
            else:
                query = query.order_by(sort_column.desc())

            pagination = query.paginate(page=page, per_page=per_page, error_out=False)

            return {
                'places': [place.to_dict() for place in pagination.items],
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page,
                'per_page': per_page
            }, 200

        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def get_place(place_id):
        """Get a single place by ID"""
        try:
            location = Location.query.get_or_404(place_id)
            return location.to_dict(), 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def create_place(data, files):
        """Create a new place"""
        try:
            
            # Geocode
            # geocode_result = maps_service.geocode(data['address']) # Assuming maps_service works
            

            location = Location(
                name=data['name'],
                category_id=data.get('category_id'),
                description=data.get('description'),
                address=data['address'],
                price_range_min=float(data.get('price_range_min', 0)),
                price_range_max=float(data.get('price_range_max', 0)),
                path=data.get('path'),
                status='ACTIVE'
            )

            if 'main_image' in files:
                file = files['main_image']
                if file and PlacesService.allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                    file.save(upload_path)
                    location.main_image = f"/static/uploads/{filename}"

            db.session.add(location)
            db.session.commit()

            return {
                'message': 'Tạo địa điểm thành công',
                'place': location.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def update_place(place_id, data, files):
        """Update an existing place"""
        try:
            location = Location.query.get_or_404(place_id)

            if 'name' in data:
                location.name = data['name']
            if 'category_id' in data:
                location.category_id = data['category_id']
            if 'description' in data:
                location.description = data['description']
            if 'address' in data:
                location.address = data['address']
            if 'price_range_min' in data:
                location.price_range_min = float(data['price_range_min'])
            if 'price_range_max' in data:
                location.price_range_max = float(data['price_range_max'])
            if 'path' in data:
                location.path = data['path']
            if 'is_featured' in data:
                location.is_featured = str(data['is_featured']).lower() == 'true'
            if 'is_active' in data:
                location.status = 'ACTIVE' if str(data['is_active']).lower() == 'true' else 'INACTIVE'

            if 'main_image' in files:
                file = files['main_image']
                if file and PlacesService.allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                    file.save(upload_path)
                    location.main_image = f"/static/uploads/{filename}"

            db.session.commit()

            return {
                'message': 'Cập nhật thành công',
                'place': location.to_dict()
            }, 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def delete_place(place_id):
        """Soft delete a place"""
        try:
            location = Location.query.get_or_404(place_id)
            location.status = 'INACTIVE'
            db.session.commit()
            return {'message': 'Xóa địa điểm thành công'}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def add_review(place_id, user_id, data):
        """Add a review for a place"""
        try:
            location = Location.query.get_or_404(place_id)
            rating = data.get('rating')
            
            if not rating or rating < 1 or rating > 5:
                return {'error': 'Rating phải từ 1-5'}, 400

            existing_review = Review.query.filter_by(
                place_id=place_id,
                user_id=user_id
            ).first()

            if existing_review:
                return {'error': 'Bạn đã đánh giá địa điểm này'}, 400

            review = Review(
                place_id=place_id,
                user_id=user_id,
                rating=rating,
                title=data.get('title'),
                content=data.get('content')
            )

            db.session.add(review)
            
            # Update average rating
            avg_rating = db.session.query(func.avg(Review.rating)).filter_by(place_id=place_id).scalar()
            location.rating_avg = round(avg_rating, 1) if avg_rating else 0
            
            db.session.commit()

            return {
                'message': 'Thêm đánh giá thành công',
                'review': review.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in current_app.config.get('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif'])

def get_places_service():
    """Factory for PlacesService"""
    return PlacesService()
