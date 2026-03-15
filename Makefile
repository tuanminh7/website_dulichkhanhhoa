ROOT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
COMPOSE_PROJECT_NAME ?= khanhhoa
BACKEND_DIR ?= backend
FRONTEND_DIR ?= frontend
FLASK_APP ?= manage:app
PYTHON ?= $(shell if [ -x "$(ROOT_DIR)/.venv/bin/python" ]; then printf %s "$(ROOT_DIR)/.venv/bin/python"; elif command -v python3 >/dev/null 2>&1; then command -v python3; else printf %s python; fi)

.PHONY: help db-upgrade seed-baseline sync-admin bootstrap run-backend docker-up docker-backend docker-logs-backend docker-down

help:
	@printf "Available commands:\n"
	@printf "  make db-upgrade          Apply Alembic migrations locally\n"
	@printf "  make seed-baseline       Seed baseline categories + admin locally\n"
	@printf "  make sync-admin          Force sync admin password from .env\n"
	@printf "  make bootstrap           Wait DB, migrate, then seed locally\n"
	@printf "  make run-backend         Run Flask backend locally\n"
	@printf "  make run-frontend        Run React frontend locally\n"
	@printf "  make docker-up           Build and start full Docker stack\n"
	@printf "  make docker-backend      Build and start DB, Redis, backend only\n"
	@printf "  make docker-logs-backend Tail backend container logs\n"
	@printf "  make docker-down         Stop Docker stack\n"

db-upgrade:
	cd $(BACKEND_DIR) && FLASK_APP=$(FLASK_APP) $(PYTHON) manage.py db-upgrade

seed-baseline:
	cd $(BACKEND_DIR) && FLASK_APP=$(FLASK_APP) $(PYTHON) manage.py seed-baseline

sync-admin:
	cd $(BACKEND_DIR) && FLASK_APP=$(FLASK_APP) $(PYTHON) manage.py sync-admin

bootstrap:
	cd $(BACKEND_DIR) && FLASK_APP=$(FLASK_APP) $(PYTHON) manage.py bootstrap-production

run-backend:
	cd $(BACKEND_DIR) && FLASK_APP=$(FLASK_APP) $(PYTHON) manage.py runserver

run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

docker-up:
	COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) docker compose up -d --build

docker-backend:
	COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) docker compose up -d --build db redis backend

docker-logs-backend:
	COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) docker compose logs -f backend

docker-down:
	COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) docker compose down
