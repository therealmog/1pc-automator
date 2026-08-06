from dotenv import load_dotenv
import requests
import datetime
import uuid
import json
import os

# Loading the token
TOKEN = os.getenv("STARLING_TOKEN")
if TOKEN == None:
    print("Token not found in .env file.")
else:
    print("Token loaded successfully.")

url = "https://api.starlingbank.com/api/v2/account/1e0f4e68-7893-46f4-ad8f-13cbe6b9ea9d"    # ID is the Easy Saver spaces ID.
spacesURL = url + "/spaces"
transferURL = url + "/savings-goals/5667db85-c91e-4a45-af58-92454ce13b29/add-money/"    # Need to add a UUID onto the end.

paid = False
amount = 0
todaysDate = datetime.date.today().strftime("%d/%m/%Y")
amountsDict = {}

def makeTransfer(amount):
    # Making the transfer
    headers = {"Authorization" : f"Bearer {TOKEN}"}
    accessURL = transferURL + str(uuid.uuid4())    # unique ID for the transfer

    data = {
        "amount" : {
            "currency" : "GBP",
            "minorUnits" : int(amount)
        }
    }
    response = requests.put(accessURL,headers=headers, json=data)
    print(response.status_code)

    if response.status_code == 200:
        setCompleted()
    else:
        print("Error")
        print(response.headers)
        print(response.text)

def setCompleted():
    # Sets JSON completed value to "true"
    # Use previously accessed amountsDict
    amountsDict[todaysDate]["completed"] = "true"

    # Write the new value
    with open("amounts.json","w") as f:
        json.dump(amountsDict,f,indent=4)

# Get the amount for today if not paid, otherwise return "paid"
with open("amounts.json","r") as f:
    amountsDict = json.load(f)
    todayDict = amountsDict[todaysDate]

    if todayDict["completed"] == "true":
        print("Today's amount has already been transfered.")
    elif todayDict["completed"] == "false":
        makeTransfer(amount=todayDict["amount"])
    else:
        print("Error.")






