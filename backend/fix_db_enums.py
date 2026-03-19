import os
from sqlalchemy import create_engine, text

def fix_enums():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("DATABASE_URL not found in environment.")
        return

    print(f"Connecting to database...")
    engine = create_engine(database_url)
    
    enums_to_check = {
        'user_roles': ['GUEST', 'USER', 'BUSINESS', 'ADMIN'],
        'business_types': ['HOTEL', 'RESTAURANT', 'ATTRACTION'],
        'registration_status': ['PENDING', 'APPROVED', 'REJECTED'],
        'sender_types': ['USER', 'AI']
    }

    with engine.begin() as connection:
        if engine.name == 'postgresql':
            for enum_name, values in enums_to_check.items():
                print(f"Checking enum: {enum_name}")
                type_exists = connection.execute(text(f"SELECT 1 FROM pg_type WHERE typname = '{enum_name}'")).scalar()
                if type_exists:
                    for value in values:
                        try:
                            connection.execute(text(f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}'"))
                            print(f"  - Ensuring value '{value}' exists in {enum_name}")
                        except Exception as e:
                            print(f"  - Error adding value '{value}' to {enum_name}: {e}")
                else:
                    print(f"  - Enum {enum_name} does not exist yet.")
        else:
            print(f"Dialect {engine.name} is not PostgreSQL. Skipping ENUM fix.")

if __name__ == "__main__":
    fix_enums()
