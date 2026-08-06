# Run once with given start date.
# Generates all amounts in a JSON file with dates and a "completed" flag.

import json
import datetime
import os
from dotenv import set_key
from pathlib import Path

def calculate():
    while True:
        date_input = input("Enter the challenge start date (DD/MM/YYYY): ")

        try:
            start_date = datetime.datetime.strptime(date_input, "%d/%m/%Y").date()
            break  # Valid date entered, exit the loop
        except ValueError:
            print("Invalid date. Please enter the date in the format DD/MM/YYYY.")


    START = start_date     # Needs to be set.

    amountsDict = {}
    date = START
    amount = 0
    for i in range(1,365,1):
        amount = i
        dateKey = date.strftime("%d/%m/%Y")
        dateDict = {
            "amount" : amount,
            "completed" : "false"
        }
        amountsDict[dateKey] = dateDict
        date += datetime.timedelta(days=1)

    with open("amounts.json","w") as f:
        json.dump(amountsDict,f,indent=4)

    print("Values have been calculated and stored.")
    set_key(Path(".env"),"amountsCalculated","true")    # Set .env variable to true.



# Check if values have already been calculated
if os.getenv("amountsCalculated") == "false":
    calculate()
else:
    accepted = {"Y","N"}
    startAgain = ""
    while startAgain not in accepted:
        startAgain = input("Amounts have already been calculated, would you like to start again (Y/N)? ").upper()

    if startAgain == "Y":
        calculate()

