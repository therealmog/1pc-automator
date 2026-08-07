import smtplib
from email.mime.text import MIMEText
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.header import Header
import os


def sendEmail():
    message = EmailMessage()
    template = """<html>
    <head>
        <style>
            .preheader {{
                display: none;
                max-height: 0;
                overflow: hidden;
            }}
        </style>
    </head>

    <body>
        <div class="preheader">It's day {day}, and you've saved £{total} so far. Great job! The more you save, the more your future self will thank you!{padding}</div>
        <h2>👛 1p Challenge Automator</h2>
        <br>
        <h1>Date: {date}</h1>
        <h1>Transfer completed: £{amount}</h1>
        <h1>So far: £{total} / £667.95 ({progressPercent}% achieved.)</h1><br><br>

        Happy saving!
        <h3>1pChallengeBot</h3>
    </body>
</html>"""

    EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT")

    # Create multipart message
    message = MIMEMultipart("alternative")
    message["From"] = EMAIL_ADDRESS
    message["To"] = EMAIL_RECIPIENT
    message["Subject"] = "1p Challenge: Day X transfer done."

    """# Read HTML template
    with open("emailTemplate.txt", "r", encoding="utf-8") as f:
        body = f.read()"""

    # Fill in placeholders
    html = template.format(
        date="07/08/2026",
        day="10",
        amount="0.10",
        total="0.55",
        progressPercent="0.082",
        padding="&nbsp;&zwnj;" * 30
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

sendEmail()