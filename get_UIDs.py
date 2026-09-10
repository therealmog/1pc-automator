# Script used to get user's account and space UIDs

import requests
from random import choice
import string

def get():
    token = getToken()
    accountUID = ""
    spaceUID = ""
    randomCode = ""
    for each in range(4):
        randomCode += choice(string.ascii_uppercase)
    randomCode += choice(string.ascii_lowercase)
    for each in range(3):
        randomCode += choice(string.digits)

    input(f"\nTo get the correct UID for your 1pc Challenge space, complete the following: \nCreate a 'Spending Space' (note: The Starling API does not support using 'Saving Spaces' yet.) with the temporary name '{randomCode}'. You are free to name this whatever you like after the setup process is complete.\nEnsure that you have no other savings spaces with this name, and that the name of the space you have created exactly matches the above temporary name.\n\nPress 'ENTER' once you have created this space.")

    headers = {"Authorization" : f"Bearer {token}"}
    response = requests.get("https://api.starlingbank.com/api/v2/accounts",headers=headers)
    
    print("\n")
    userAccounts = response.json()["accounts"]
    for each in userAccounts:
        if each["accountType"] == "PRIMARY":
            accountUID = each["accountUid"]
            break

    # Get space UID
    response = requests.get(f"https://api.starlingbank.com/api/v2/account/{accountUID}/savings-goals",headers=headers)
    savingsGoals = response.json()["savingsGoalList"]
    for each in savingsGoals:
        if each["name"] == randomCode:
            spaceUID = each["savingsGoalUid"]
            break

    print(f"Your details are as follows:\nAccount UID: {accountUID}\nSpace UID: {spaceUID}\n\nFeel free to rename the space to whatever you like.")


def getToken():
    token = input("Enter your Starling API token exactly as copied from the Starling Developer website (note: this is not saved):\n")

    if requests.get("https://api.starlingbank.com/api/v2/accounts",headers={"Authorization" : f"Bearer {token}"}).status_code == 200:
        return token
    else:
        print("Error: Incorrect/Invalid Starling API token.\n")
        getToken()


    


get()