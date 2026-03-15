from app import create_app
from app.services.news_service import NewsService

app = create_app()
with app.app_context():
    # Test search with a term that should exist
    mock_params = {'search': 'dfgdfg'}
    result, status = NewsService.get_posts(mock_params)
    print(f"Search for 'dfgdfg': Total = {result['total']}")
    for post in result['posts']:
        print(f" - {post['title']}")

    # Test search with a term that should NOT exist
    mock_params = {'search': 'NONEXISTENTXYZ'}
    result, status = NewsService.get_posts(mock_params)
    print(f"Search for 'NONEXISTENTXYZ': Total = {result['total']}")
