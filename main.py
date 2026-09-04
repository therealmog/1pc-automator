from dotenv import set_key
import lib.requests as requests
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
import config
from random import choice

class Automator:
    def __init__(self):
        config.config()
        # Loading the token
        self.TOKEN = os.getenv("STARLING_TOKEN")
        if self.TOKEN == None:
            raise Exception("Token not found in .env file.")
        else:
            print("Token loaded successfully.")

        self.accountUID = os.getenv("ACCOUNT_UID")
        self.spaceUID = os.getenv("SPACE_UID")

        self.checkSettings()
        

        self.baseURL = f"https://api.starlingbank.com/api/v2/account/{self.accountUID}"    # ID is the user ID.
        self.transferURL = self.baseURL + f"/savings-goals/{self.spaceUID}/add-money/"    # Need to add a UUID onto the end.

        self.getCurrentBalance()
        

        self.todaysDate = datetime.date.today().strftime("%d/%m/%Y")
        self.tomorrowsDate = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%d/%m/%Y")

        # Get today's amount to add
        if datetime.datetime.today() > datetime.datetime.strptime(self.getSetting("endDate"),"%d/%m/%Y"):
            print("Challenge already completed. Congratulations!")
        elif datetime.datetime.today() < datetime.datetime.strptime(self.getSetting("endDate"),"%d/%m/%Y"):
            print("Your challenge has not started yet.")
        else:
            amount = (datetime.datetime.today() - datetime.datetime.strptime(self.getSetting("startDate"),"%d/%m/%Y")).days + 1

            # The current space balance goes into the amountsDict json file.

            self.amountsDict = {}
            with open("amounts.json","r") as f:
                self.amountsDict = json.load(f)

            if self.checkCompleted():
                print(f"Today's money (£{amount/100}) has already been transferred.")
            else:
                self.amount = amount
                self.makeTransfer(amount)

        

    def getCurrentBalance(self):
        url = self.baseURL + f"/savings-goals/{self.spaceUID}"
        response = requests.get(url,headers={"Authorization" : f"Bearer {self.TOKEN}"})
        if response.status_code == 200:
            print("Current balance obtained.")
            balance = response.json()["totalSaved"]["minorUnits"]

            # Update saved value.
            self.changeSetting("currentAmount",balance)


    def changeSetting(self,settingToChange,newValue):
        settingsDict = {}
        with open("settings.json", "r") as f:
            settingsDict = json.load(f)

        if settingToChange in settingsDict:
            settingsDict[settingToChange] = newValue

            # Overwrite current settings.json
            with open("settings.json","w") as f:
                json.dump(settingsDict,f,indent=4)
        else:
            print(f"Setting '{settingToChange}' not found.")

    def getSetting(self,settingName):
        settingsDict = {}
        with open("settings.json", "r") as f:
            settingsDict = json.load(f)

        if settingName in settingsDict:
            return settingsDict[settingName]
        else:
            print(f"Setting '{settingName}' not found.")


    def checkSettings(self):
        # Getting settings from JSON file.
        settingsDict = {}
        with open("settings.json","r") as f:
            settingsDict = json.load(f)

        configFuncs = {
            "valuesCalculated" : config.calculateAmounts,   # Also sets setDate and endDate
            "userEmail" : config.setEmail

        }
        # Checking for if amounts have been set.
        for each in configFuncs:
            if settingsDict[each] == "null":
                # Runs corresponding function to set a value to that setting
                configFuncs[each]()



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
                "reference" : f"1pC Automator • £{(self.getSetting("currentAmount")+self.amount)/100} saved so far."
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
        newAmount = self.getSetting("currentAmount")+self.amount

        # Sets JSON completed value to "true" and set value in amountsDict to new amount
        # Use previously accessed amountsDict

        self.amountsDict[self.todaysDate]["amount"] = newAmount
        self.amountsDict[self.todaysDate]["completed"] = "true"

        # Write the new value
        with open("amounts.json","w") as f:
            json.dump(self.amountsDict,f,indent=4)

        # Send completion email
        self.sendEmail()

        # Change next transfer date
        
        self.changeSetting("nextTransferDate",self.tomorrowsDate)
        self.changeSetting("currentAmount",newAmount)

        
        

    def getTotal(self,day):
        # Returns total saved up to a particular day in pence
        return self.getSetting("currentAmount")

    def getPercentage(self,day):
        total = self.getTotal(day)

        # Trim to 2dp
        percentage = 1000 * (total / 66795)
        percentageTrunc = int(percentage * 1000) / 1000

        return percentageTrunc


    def sendEmail(self):
        message = EmailMessage()
        template = """<html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap');

                    body {{
                        margin: 0;
                        background: var(--bg);
                        color: var(--text);
                        font-family: 'Space Grotesk', system-ui, sans-serif;
                        min-height: 100vh;
                        padding: 32px 20px 60px;
                    }}

                    .preheader {{
                        display: none;
                        max-height: 0;
                        overflow: hidden;
                    }}

                    .title {{
                        font-size: 22px;
                        font-weight: 700;
                        display: flex;
                        align-items: baseline;
                        gap: 8px;
                        white-space: nowrap;
                    }}

                    .text-1p {{
                        color: orange;
                    }}
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
        message["Subject"] = f"🪙 1p Challenge: Day {self.amount} transfer confirmation"

        """# Read HTML template
        with open("emailTemplate.txt", "r", encoding="utf-8") as f:
            body = f.read()"""

        # Fill in placeholders
        html = template.format(
            date=self.todaysDate,
            amount=str(self.amount/100),
            total=str((self.getSetting("currentAmount") +self.amount)/100),
            progressPercent=str(self.getPercentage(self.amount)),
            day=self.amount,
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


    
automator = Automator()
