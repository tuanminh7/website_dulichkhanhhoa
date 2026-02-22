from app import create_app
import sys, os

app = create_app(os.getenv('FLASK_ENV', 'development'))

def main():
    args: list = sys.argv
    print(sys.argv)

    if len(args) > 1:
        prompt_command = args[-1]
        if prompt_command == "run":
            app.run(debug=True)
    

if __name__ == "__main__":
    main()