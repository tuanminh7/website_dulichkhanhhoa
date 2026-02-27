FROM python:3.12-alpine3.23

WORKDIR /webapp

COPY . .

EXPOSE 5000

CMD [ "gunicorn", "--bind", " 0.0.0.0:5000", "manage:app" ]