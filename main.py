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
        elif datetime.datetime.today() < datetime.datetime.strptime(self.getSetting("startDate"),"%d/%m/%Y"):
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
                "your future self will thank you for the money you save."]
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
            amount=formatCurrency(self.amount),
            total=formatCurrency(self.getSetting("currentAmount") +self.amount),
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


def formatCurrency(pence):
    # Formats a pence integer as a pounds string with exactly two
    # decimal places. Used by email templates so values like £0.9
    # never appear.
    return f"{pence / 100:.2f}"


class DashboardButtons:
    def __init__(self):
        # Used to delegate settings.json writes via the Automator's
        # helper. A reference to an Automator instance is optional -
        # when not provided, writes fall back to direct JSON edits.
        self.automator = None

    def _writeSettings(self,settingsDict):
        with open("settings.json","w") as f:
            json.dump(settingsDict,f,indent=4)

    def _readSettings(self):
        settingsDict = {}
        with open("settings.json","r") as f:
            settingsDict = json.load(f)
        return settingsDict

    def _send(self,subject,html):
        message = MIMEMultipart("alternative")
        EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
        EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
        EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT")

        message["From"] = EMAIL_ADDRESS
        message["To"] = EMAIL_RECIPIENT
        message["Subject"] = subject

        html_message = MIMEText(html,"html")
        message.attach(html_message)

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com",465) as smtp:
                smtp.login(EMAIL_ADDRESS,EMAIL_PASSWORD)
                smtp.send_message(message)
            print("Email sent successfully!")
        except Exception as e:
            print(f"Failed to send email:\n{e}")

    def sendProgressEmail(self):
        # Mirrors Automator.sendEmail in structure but sends a
        # progress update instead of a transfer confirmation.
        # The exact content can be polished later.
        settingsDict = self._readSettings()
        currentAmount = settingsDict.get("currentAmount",0)
        startDateStr = settingsDict.get("startDate")
        email = settingsDict.get("userEmail") or os.getenv("EMAIL_RECIPIENT")

        # Refuse to send if the challenge has not started yet.
        if startDateStr:
            try:
                startDate = datetime.datetime.strptime(startDateStr,"%d/%m/%Y")
                today = datetime.datetime.today()
                if today < startDate:
                    print(
                        "Cannot send progress email: "
                        "challenge has not started yet."
                    )
                    return False
            except ValueError:
                pass

        day = None
        if startDateStr:
            try:
                startDate = datetime.datetime.strptime(startDateStr,"%d/%m/%Y")
                day = (datetime.datetime.today() - startDate).days + 1
            except ValueError:
                day = None

        # Expected balance at this point in the challenge, based on
        # the 1p challenge formula: day N transfers N pence, so the
        # cumulative total in pence after N days is N*(N+1)/2.
        # Days remaining = totalChallengeDays - day.
        totalChallengeDays = None
        if startDateStr and settingsDict.get("endDate"):
            try:
                startDate = datetime.datetime.strptime(startDateStr,"%d/%m/%Y")
                endDate = datetime.datetime.strptime(settingsDict["endDate"],"%d/%m/%Y")
                totalChallengeDays = (endDate - startDate).days
            except ValueError:
                totalChallengeDays = None

        expectedBalance = None
        if day is not None:
            expectedBalance = day * (day + 1) // 2

        daysRemaining = None
        aheadBy = None
        description = ""

        if expectedBalance is not None and expectedBalance > 0:
            ratio = currentAmount / expectedBalance

            # Within +/- 10% of expected
            if ratio >= 0.9 and ratio <= 1.1:
                description = (
                    "Based on your current balance, you are currently on "
                    "track to reach your goal. If you have any extra cash "
                    "day-to-day, remember to add this in to help you reach "
                    "your goal even faster!"
                )
            # More than 10% behind expected
            elif ratio < 0.9:
                description = (
                    "You are currently not on track to reach your goal. "
                    "If you are finding it difficult to save day-to-day, "
                    "please consider pausing the challenge temporarily "
                    "until you are in a better position to save consistently."
                )
            # More than 10% ahead of expected
            else:
                aheadBy = currentAmount - expectedBalance
                if totalChallengeDays is not None and day is not None:
                    daysRemaining = totalChallengeDays - day
                    # Reduce days remaining by the percentage they are
                    # ahead of expected. E.g. 20% ahead -> 20% fewer
                    # days remaining.
                    if daysRemaining > 0 and expectedBalance > 0:
                        aheadMultiplier = (aheadBy/currentAmount)
                        daysRemaining = max(0,int(daysRemaining / aheadMultiplier))

                daysText = (
                    f"{daysRemaining} days early"
                    if daysRemaining is not None
                    else "ahead of schedule"
                )

                description = (
                    f"You are currently on track to finishing the challenge "
                    f"early, great job! Keep this progress up and you'll "
                    f"finish the challenge {daysText}. However, if you feel "
                    f"that you need to slow down or pause the challenge "
                    f"temporarily, consider letting the automator add the "
                    f"minimum transfer amount each day, or click the \"Pause "
                    f"challenge\" button on the dashboard."
                )

        template = """<html>
            <head>
                <style>
                    body {{
                        margin: 0;
                        background: var(--bg);
                        color: var(--text);
                        font-family: 'Space Grotesk', system-ui, sans-serif;
                        min-height: 100vh;
                        padding: 32px 20px 60px;
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
                <p><div class="title"><span class="text-1p">1p</span> Challenge Automator</div>Progress update</p>
                <br>
                <p><div class="title">Date:</div> {date}</p>
                <p><div class="title">Day:</div> {day}</p>
                <p><div class="title">Saved so far:</div> £{total} / £667.95</p>
                <p>{description}</p>
            </body>
        </html>"""

        html = template.format(
            date=datetime.date.today().strftime("%d/%m/%Y"),
            day=day if day is not None else "—",
            total=formatCurrency(currentAmount),
            description=description,
        )

        self._send(
            f"📈 1p Challenge: Progress update",
            html
        )

    def changeTransferTime(self,newTime):
        # Accepts "HH:MM" and writes it to settings.json under
        # transferTime. Reuses Automator.changeSetting when an
        # Automator instance is available.
        if not re.match(r"^\d{2}:\d{2}$",newTime):
            raise ValueError("Transfer time must be in HH:MM format.")

        if self.automator and hasattr(self.automator,"changeSetting"):
            self.automator.changeSetting("transferTime",newTime)
        else:
            settingsDict = self._readSettings()
            settingsDict["transferTime"] = newTime
            self._writeSettings(settingsDict)

    def changeEmail(self,newEmail):
        # Accepts an email string and writes it to settings.json
        # under userEmail. Reuses Automator.changeSetting when an
        # Automator instance is available.
        if not newEmail or "@" not in newEmail:
            raise ValueError("Invalid email address.")

        if self.automator and hasattr(self.automator,"changeSetting"):
            self.automator.changeSetting("userEmail",newEmail)
        else:
            settingsDict = self._readSettings()
            settingsDict["userEmail"] = newEmail
            self._writeSettings(settingsDict)

    def pauseChallenge(self,restartDate=None):
        # Optional restartDate. If None, just toggle challengePaused
        # to "true". Otherwise also store the given restartDate.
        if self.automator and hasattr(self.automator,"changeSetting"):
            self.automator.changeSetting("challengePaused","true")

            if restartDate is not None:
                self.automator.changeSetting("restartDate",restartDate)
            else:
                # Clear any previously stored restartDate for an
                # indefinite pause.
                settingsDict = self._readSettings()
                if "restartDate" in settingsDict:
                    del settingsDict["restartDate"]
                    self._writeSettings(settingsDict)
        else:
            settingsDict = self._readSettings()
            settingsDict["challengePaused"] = "true"

            if restartDate is not None:
                settingsDict["restartDate"] = restartDate
            elif "restartDate" in settingsDict:
                del settingsDict["restartDate"]

            self._writeSettings(settingsDict)


automator = Automator()
dashboardBtns = DashboardButtons()
#dashboardBtns.sendProgressEmail()
