from app import create_app
import sys, os

app = create_app(os.getenv('FLASK_ENV', 'development'))

def main():
    args: list = sys.argv
    try:
        from app.utils import excute_prompt
        excute_prompt.controller(*sys.argv)
    except ImportError as e:
        raise e


# gunicorn --bind 0.0.0.0:5000 manage:app
if __name__ == "__main__":
    main()