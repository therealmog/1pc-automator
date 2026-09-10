# The connection to S3 for JSON files.
import boto3
import json

# bucket name is a global variable - needs to be set for a user.
bucket = "1pc-automator"

class OnepCAutomatorDataStore:
    def __init__(self):
        self.s3 = boto3.client("s3")
        self.ssm = boto3.client("ssm",region_name="eu-west-2")

    def loadJSON(self,fileName):
        response = self.s3.get_object(Bucket=bucket,Key=fileName)
        return json.loads(response["Body"].read())
        
        # try:
            

        # except:
        #     print("Invalid filename.")
    
    def putJSON(self,fileName,content):
        self.s3.put_object(Bucket=bucket,Key=fileName,Body=json.dumps(content,indent=4))

    def getParameter(self,paramName,encrypted=False):
        """### encrypted
        Set encrypted flag depending on whether parameter is a String (False) or a SecureString (True)"""

        response = self.ssm.get_parameter(Name=paramName,WithDecryption=encrypted)

        return response["Parameter"]["Value"]

dataStore = OnepCAutomatorDataStore()
settingsJSON = dataStore.loadJSON("settings.json")
settingsJSON["userEmail"] = "amogh12711@gmail.com"
dataStore.putJSON("settings.json",settingsJSON)
print(dataStore.loadJSON("settings.json"))