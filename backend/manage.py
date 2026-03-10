import os
import sys
import time

from flask_migrate import stamp as migrate_stamp, upgrade as migrate_upgrade
from sqlalchemy import inspect, text

from app import create_app, db, ensure_schema_compatibility
from app.seed import seed_reference_data

app = create_app(os.getenv('FLASK_ENV', 'development'))


def _has_existing_schema_without_alembic():
    with app.app_context():
        table_names = set(inspect(db.engine).get_table_names())
    return bool(table_names) and 'alembic_version' not in table_names


def wait_for_db(timeout=60, interval=2):
    deadline = time.time() + timeout
    last_error = None

    while time.time() < deadline:
        try:
            with app.app_context():
                db.session.execute(text('SELECT 1'))
                return True
        except Exception as exc:
            last_error = exc
            time.sleep(interval)

    raise RuntimeError(f'Database is not ready after {timeout}s: {last_error}')


def db_upgrade():
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    if not os.path.exists(migrations_dir):
        print('Warning: migrations dir not found. Using db.create_all() as fallback.')
        with app.app_context():
            ensure_schema_compatibility()
            db.create_all()
        return

    with app.app_context():
        if _has_existing_schema_without_alembic():
            ensure_schema_compatibility()
            migrate_stamp(revision='head')
            print('Existing schema detected without Alembic history. Stamped current head successfully!')
            return
        migrate_upgrade()
    print('Database migrations applied successfully!')


def seed_baseline(sync_admin_password=False):
    summary = seed_reference_data(app, sync_admin_password=sync_admin_password)
    print(
        'Baseline seed completed: '
        f"categories_created={summary['categories_created']}, "
        f"admin_created={summary['admin_created']}, "
        f"admin_password_synced={summary['admin_password_synced']}"
    )


def runserver():
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)


def bootstrap_production():
    wait_for_db(
        timeout=int(os.environ.get('DB_WAIT_TIMEOUT', 60)),
        interval=float(os.environ.get('DB_WAIT_INTERVAL', 2)),
    )
    db_upgrade()
    seed_baseline()


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else 'runserver'

    try:
        if command == 'runserver':
            runserver()
        elif command == 'wait-for-db':
            wait_for_db(
                timeout=int(os.environ.get('DB_WAIT_TIMEOUT', 60)),
                interval=float(os.environ.get('DB_WAIT_INTERVAL', 2)),
            )
            print('Database is ready!')
        elif command == 'db-upgrade':
            db_upgrade()
        elif command == 'seed-baseline':
            seed_baseline()
        elif command == 'sync-admin':
            seed_baseline(sync_admin_password=True)
        elif command == 'bootstrap-production':
            bootstrap_production()
        else:
            raise ValueError(f'Unknown command: {command}')
    except Exception as exc:
        print(f'Error: {exc}')
        print('Usage: python manage.py [runserver|wait-for-db|db-upgrade|seed-baseline|sync-admin|bootstrap-production]')
        raise SystemExit(1) from exc


if __name__ == '__main__':
    main()
