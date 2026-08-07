from dotenv import set_key
import requests
import datetime
import uuid
import json
import os
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
import re

class Automator:
    def __init__(self):
        # Loading the token
        self.TOKEN = os.getenv("STARLING_TOKEN")
        if self.TOKEN == None:
            raise Exception("Token not found in .env file.")
        else:
            print("Token loaded successfully.")

        self.checkForEmail()

        self.baseURL = "https://api.starlingbank.com/api/v2/account/d5c61173-126f-444f-89f8-1d5882d4f3be"    # ID is the Easy Saver spaces ID.
        self.transferURL = self.baseURL + "/savings-goals/2c6a81e0-e1c4-42dd-ba67-f8cf723f6f3c/add-money/"    # Need to add a UUID onto the end.

        self.todaysDate = datetime.date.today().strftime("%d/%m/%Y")

        # Getting amounts details from JSON file.
        self.amountsDict = {}
        with open("amounts.json","r") as f:
            self.amountsDict = json.load(f)

        amount = self.amountsDict[self.todaysDate]["amount"]
        if self.checkCompleted():
            print(f"Today's money (£{amount/100}) has already been transferred.")
        else:
            self.amount = amount
            self.makeTransfer(amount)

    def checkForEmail(self):
        try:
            emailCheck = os.getenv("EMAIL_RECIPIENT")
            if emailCheck == None:
                raise KeyError()
        except KeyError:
            emailInput = ""
            EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

            while True:
                emailInput = input("Enter your email address you would like to receive transfer confirmations at: ").strip()

                if EMAIL_PATTERN.fullmatch(emailInput):
                    break

                print("Invalid email address. Please try again.")
            set_key(Path(".env"),"EMAIL_RECIPIENT",emailInput)

    def checkCompleted(self):
        # Checks the JSON file with todays date to see if transfer has been completed or not.
        if self.amountsDict[self.todaysDate]["completed"] == "false":
            return False
        else:
            return True     # safety case: unless "false" is explicitly seen, program returns true to avoid accidentally sending money again.

    def makeTransfer(self,amount):
        # Making the transfer
        headers = {
            "Authorization" : f"Bearer {self.TOKEN}"
            }
        data = {
                "amount" : {
                    "currency" : "GBP",
                    "minorUnits" : int(amount)
                },
                "reference" : "Sent using 1pC Automator"
            }
        accessURL = self.transferURL + str(uuid.uuid4())    # unique ID for the transfer

        
        # Making the PUT request
        response = requests.put(accessURL,headers=headers, json=data)
        print(response.status_code)

        if response.status_code == 200:
            print(f"Transfer of £{amount/100} completed.")
            self.setCompleted()
        else:
            print("Error")
            print(response.headers)
            print(response.text)

    def setCompleted(self):
        # Sets JSON completed value to "true"
        # Use previously accessed amountsDict
        self.amountsDict[self.todaysDate]["completed"] = "true"

        # Write the new value
        with open("amounts.json","w") as f:
            json.dump(self.amountsDict,f,indent=4)

        # Send completion email
        self.sendEmail()

    def getTotal(self,day):
        # Returns total saved up to a particular day in pence
        total = (0.5 * day * (2*1 + (day-1)*(1)))
        return total

    def getPercentage(self,day):
        total = self.getTotal(day)

        # Trim to 2dp
        percentage = 1000 * (total / 66795)
        percentageTrunc = int(percentage * 1000) / 1000

        return percentageTrunc


    def sendEmail(self):
        message = EmailMessage()

        EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
        EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
        EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT")

        # Create multipart message
        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_ADDRESS
        message["To"] = EMAIL_RECIPIENT
        message["Subject"] = f"1p Challenge: Day {self.amount} transfer confirmation"

        # Read HTML template
        with open("emailTemplate.txt", "r", encoding="utf-8") as f:
            body = f.read()

        # Fill in placeholders
        html = body.format(
            date=self.todaysDate,
            amount=str(self.amount/100),
            total=str(self.getTotal(self.amount)/100),
            progressPercent=str(self.getPercentage(self.amount))
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


    
automator = Automator()





