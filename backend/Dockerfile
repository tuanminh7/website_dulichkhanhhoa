FROM python:3.12-slim

WORKDIR /webapp

# ENV PYTHONUNBUFFERED=1

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# EXPOSE 5000

# CMD [ "gunicorn", "--bind", " 0.0.0.0:5000", "manage:app" ]
CMD [ "python", "manage.py" ]
