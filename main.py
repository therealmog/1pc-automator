from dotenv import load_dotenv
import requests
import datetime
import uuid
import json
import os

class Automator:
    def __init__(self):
        # Loading the token
        self.TOKEN = os.getenv("STARLING_TOKEN")
        if self.TOKEN == None:
            raise Exception("Token not found in .env file.")
        else:
            print("Token loaded successfully.")

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
            self.makeTransfer(amount)


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

    
automator = Automator()





