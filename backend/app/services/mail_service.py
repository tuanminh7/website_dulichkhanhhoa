from flask_mail import Mail, Message


def send_mail(to, subject, body):
    msg = Message(subject, sender='[EMAIL_ADDRESS]', recipients=[to])
    msg.body = body
    mail.send(msg)