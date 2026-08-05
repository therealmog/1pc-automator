from dotenv import load_dotenv
import requests
import datetime
import json
import os

# Loading the token
TOKEN = os.getenv("STARLING_TOKEN")
if TOKEN == None:
    print("Token not found in .env file.")
else:
    print("Token loaded successfully.")

url = "https://api.starlingbank.com/api/v2/account"
accountUID = "1e0f4e68-7893-46f4-ad8f-13cbe6b9ea9d" # This is the Easy Saver spaces ID.
spacesURL = url + "/" + accountUID + "/spaces"
transferURL = url 

paid = False
amount = 0
# Get the amount for today if not paid, otherwise return "paid"
with open("amounts.json","r") as f:
    obj = json.load(f)
    todayDict = obj[datetime.date.today().strftime("%d/%m/%Y")]

    if todayDict["completed"] == "true":
        print("Today's amount has already been transfered.")
    elif todayDict["completed"] == "false":
        amount = todayDict["amount"]
    else:
        print("Error.")


# Making the transfer
headers = {"Authorization" : f"Bearer {TOKEN}"}
response = requests.get(spacesURL,headers=headers)
print(response.status_code)

if response.status_code == 200:
    with open("spaces.json","w") as f:
        json.dump(response.json(),f,indent=4)
else:
    print(response.text)

