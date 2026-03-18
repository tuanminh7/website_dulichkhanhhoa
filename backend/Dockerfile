FROM python:3.12-slim

WORKDIR /webapp

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

RUN sed -i 's/\r$//' /webapp/docker-entrypoint.sh \
    && chmod +x /webapp/docker-entrypoint.sh

CMD ["/webapp/docker-entrypoint.sh"]
