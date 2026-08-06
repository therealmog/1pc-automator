import json
import os
import requests

# Loading the token
TOKEN = os.getenv("STARLING_TOKEN")
if TOKEN == None:
    raise Exception("Token not found in .env file.")
else:
    print("Token loaded successfully.")

headers = {
            "Authorization" : f"Bearer {TOKEN}"
            }
baseURL = "https://api.starlingbank.com/api/v2/account/d5c61173-126f-444f-89f8-1d5882d4f3be"    # ID is the account ID
transferURL = baseURL + "/savings-goals/"    # Need to add a UUID onto the end.

response = requests.get(transferURL,headers=headers)

# store
with open("savingsgoals.json","a") as f:
    json.dump(response.json(),f,indent=4)