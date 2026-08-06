# Run once with given start date.
# Generates all amounts in a JSON file with dates and a "completed" flag.

import json
import datetime

START = datetime.date(2026,8,6)     # Needs to be set.

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