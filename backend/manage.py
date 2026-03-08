from app import create_app
import sys, os

app = create_app(os.getenv('FLASK_ENV', 'development'))

def main():
    args: list = sys.argv
    try:
        from app.utils import excute_prompt
        if len(sys.argv) < 2:
            excute_prompt.run()
        else:
            excute_prompt.controller(*sys.argv)
    except Exception as e:
        print(f"Error: {e}")
        print("Usage: python manage.py [run|init_db|seed_db|create_admin]")


# gunicorn --bind 0.0.0.0:5000 manage:app
if __name__ == "__main__":
    main()