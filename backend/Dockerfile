FROM python:3.12-slim

WORKDIR /webapp

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

RUN chmod +x /webapp/docker-entrypoint.sh

CMD ["/webapp/docker-entrypoint.sh"]
