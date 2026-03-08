<<<<<<< HEAD
FROM python:3.12-slim

WORKDIR /webapp

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# EXPOSE 5000

CMD [ "gunicorn", "--bind", " 0.0.0.0:5000", "manage:app" ]
=======
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["flask", "run", "--host=0.0.0.0"]
>>>>>>> Tuan
