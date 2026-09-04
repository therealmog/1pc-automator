import smtplib
from email.mime.text import MIMEText
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.header import Header
import os
from random import choice


def sendEmail():
    message = EmailMessage()
    template = """<html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap');

            body {
                margin: 0;
                background: var(--bg);
                color: var(--text);
                font-family: 'Space Grotesk', system-ui, sans-serif;
                min-height: 100vh;
                padding: 32px 20px 60px;
            }

            .preheader {
                display: none;
                max-height: 0;
                overflow: hidden;
            }

            .title {
                font-size: 22px;
                font-weight: 700;
                display: flex;
                align-items: baseline;
                gap: 8px;
                white-space: nowrap;
            }

            .text-1p {
                color: orange;
            }
        </style>
    </head>

    <body>
        <div class="preheader">It's day {day}, and you've saved £{total} so far. Great job! The more you save, the more your future self will thank you!{padding}</div>
        <p><div class="title"><span class="text-1p">1p</span> Challenge Automator</div>Confirmation of transfer</p>
        <br>
        <p><div class="title">Date:</div> {date}</p>
        <p><div class="title">Transfer completed:</div> £{amount}</p>
        <p><div class="title">So far:</div> £{total} / £667.95 ({progressPercent}% achieved.)</p><br><br>

        Remember, {quote}
        <h3>1pChallengeBot</h3>
    </body>
</html>"""

    quotes = [
        "a rich man spends when a smart man saves.",
        "do not save what is left after spending; spend what is left after saving.",
        "beware of little expenses; a small leak will sink a great ship.",
        "an investment in knowledge pays the best interest.",
        "the habit of saving is itself an education.",
        "never spend your money before you have earned it.",
        "money is a terrible master but an excellent servant.",
        "a penny saved is a penny earned.",
        "save a little money each month and at the end of the year you will be surprised at how little you had.",
        "the quickest way to double your money is to fold it in half and put it in your pocket.",
        "it is not your salary that makes you rich; it is your spending habits.",
        "small savings today can become big opportunities tomorrow.",
        "financial freedom begins with taking control of your money.",
        "every saved pound is a pound working for your future.",
        "a goal without a plan is just a wish.",
        "success is the sum of small efforts repeated day in and day out.",
        "little by little, a little becomes a lot.",
        "the best time to start saving was yesterday. The next best time is today.",
        "discipline is choosing between what you want now and what you want most.",
        "your future self will thank you for the money you save today."]

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
        padding="&nbsp;&zwnj;" * 30,
        quote=choice(quotes)
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