import smtplib
from email.mime.text import MIMEText
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
import os


def sendEmail(recipient):
    message = EmailMessage()

    EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT")

    # Create multipart message
    message = MIMEMultipart("alternative")
    message["From"] = EMAIL_ADDRESS
    message["To"] = recipient
    message["Subject"] = "1p Challenge: Day X transfer done."

    # Read HTML template
    with open("emailTemplate.txt", "r", encoding="utf-8") as f:
        body = f.read()

    # Fill in placeholders
    html = body.format(
        date="07/08/2026",
        username="moggy",
        amount="0.10",
        total="0.55",
        progressPercent="0.082"
    )

    # Attach HTML
    html_message = MIMEText(html, "html")
    message.attach(html_message)

    # Send email
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(message)

        print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email:\n{e}")

sendEmail("")