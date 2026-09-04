import json
import datetime
import re

def config():
    settings = ["Restart challenge"]
    settingStr = ""
    for each in range(len(settings)):
        settingStr += f"{each+1}. {settings[each].title()}\n"
    print(f"Settings you can configure:\n {settingStr}")

    settingInput = ""
    actionComplete = False
    while not actionComplete:
        settingInput = input(f"\nEnter the number of the action you would like to do.\nAlternatively, type 'exit' to exit: ").lower()
        try:
            settingInput = int(settingInput)
            actionComplete = True

        except ValueError:
            if settingInput == "exit":
                exit()
            else:
                print("Invalid input, please try again.")

    settingsDict = {
            1 : calculateAmounts
        }

    settingsDict[settingInput]()

def setValue(settingName,newValue):
    with open("settings.json","r") as f:
        settingsDict = json.load(f)
    
    settingsDict[settingName] = newValue

    with open("settings.json","w") as f:
        json.dump(settingsDict,f,indent=4)

def calculateAmounts():
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
    for i in range(1,366,1):
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
    

    # Change settings to say that values have been stored.
    setValue("valuesCalculated","true")
    setValue("startDate",START.strftime("%d/%m/%Y"))
    setValue("endDate",date.strftime("%d/%m/%Y"))

    
    # set_key(Path(".env"),"amountsCalculated","true")    # Set .env variable to true.

def setEmail():
    emailInput = ""
    EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

    while True:
        emailInput = input("Enter your email address you would like to receive transfer confirmations at: ").strip()

        if EMAIL_PATTERN.fullmatch(emailInput):
            break

        print("Invalid email address. Please try again.")

    setValue("userEmail",emailInput.lower())
