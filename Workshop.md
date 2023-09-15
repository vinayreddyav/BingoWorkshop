# Azure Serverless Back-end Workshop

During this workshop you will learn to set-up a serverless back-end API in Azure. To follow along you need an active Azure Subscription. You can create a [trail subscription](https://azure.microsoft.com/en-us/pricing/offers/ms-azr-0044p/) for free if needed.

## Step 1 - Create initial resources

1. First of all create a resourcegroup in Azure. You can name this resourcegroup anyway you want. Make sure the region is set to a region close to you (for example West-Europe for the Netherlands).
2. After you created a resourcegroup create an "API Management". Make sure the subscription and resourcegroup are set right and the region is correct. For the name pick a globally unique name, this name will be used in the url for your API. For the organization name pick something and enter a valid adminitrator email address, you will get a notification on this email once the creation is done. For the pricing tier select "Developer (no SLA)". All other field in other tabs can be left default so you can create the resource. This can take up to 20 minutes.
3. Fork this repository (you need a github account to do this).
4. Create a static web app in Azure. Make sure the subscription, resourcegroup and region are set correct. For the name pick a globally unique name. This is the name you will use to access the test front-end. For the plan type select "Free". For the deployment type select github and sign in. Select the correct organization, repository and branch. Select "HTML" for build presets and set the App location to "/Site" leave all other field default. Create the static web app. You can inspect the github action which is being triggered after the resource is created, this will deploy the site (this can take several minutes).

## Step 2 - Create Simple PING API

1. Create a logic app. Make sure the subscription, resourcegroup and region are set correct. Pick a globally unique name, make sure you remember this name. For the plan type select "consumption". All other fields can be left default.
2. After the resource in created open it and you will be in the designer. Select "Blank Template".
3. In the designer select "code view" and copy the contents of "PingLogicApp.json" in there.
4. Save the Logic App.
5. Go to the APIM you created in step 1. Go to the "API's" and delete the echo api.
6. Create a new HTTP API. Give this a Displayname and Name. Set the API URL Suffix to  "Workshop".
7. Go to the settings and untick the value of "Subscription required" for this API.
8. Add a new operation. Set the Display name and name to "ping". and set the URL to "GET" and the other field to "/ping".
9. In the newly created operation go to the Backend (scroll to the right). And click the edit button next to "HTTP(s) endpoint".
10. In the new screen select Azure Logic App and select the logic app you created earlier in this step (for the "Name" select "manual").
11. Open the file "app.js" (you can do this in github or by cloning the repository and editing it locally) and change the value of "APIendpoint" to the Base URL of the api which you can find in the settings of the newly created API. Commit the changes (if you cloned the file locally make sure you push it too).
12. Open the static web app URL and click the link under the PING API header. The value of ping should now change from ??? to a json containing "Hello World!"

## Step 3 - Create Storage API

1. Create a storage account, make sure the subscription, resourcegroup and region are set correct. Pick a globally unique name for the storage account name. Set the redundancy to LRS. Leave all other fields default.
2. In the storage account create a table with a name (for example TestTable this name you use in the logic app later on).  Go to the storage explorer in the storage account and browse to your table. Add three new entries with the following values:

* PartitionKey: 1
RowKey: 1
Name: PICK SOME UNIQUE NAME

* PartitionKey: 1
RowKey: 2
Name: PICK SOME UNIQUE NAME

* PartitionKey: 1
RowKey: 3
Name: PICK SOME UNIQUE NAME

3. Create a second logic app just like the one in Step 2 with a different name. After selecting a blank template build the logic app like shown in these images. You can refer to the TableLogicApp.json file in the LogicApps folder for more information but you can't copy this directly as it would require setting up a connection. For this connection you can use the secret key from the storage account.

![Logic App 1](\Images\StorageLogicApp1.png)

![Logic App 2](\Images\StorageLogicApp2.png)

4. You'll notice that there now is a body in the trigger which will define a parameter, this parameter is used to retrieve values from a storage account. The response is being parsed and only the name is returned to the user. Save the logic app.
5. Go to APIM and create a new operation named "storage" and set this up in the same way as in step 2 but now link it to the newly created logic app.
6. In the front-end settings for the newly created operation go to the Query tab and add a query parameter called "row" here.
7. At the inbound processing edit the code by clicking the code image and add the contents of AddBodyToAPI.xml after `<base />`. This will make sure the query parameter is send as a body to the logic app.
8. Test the API in the front-end app by entering a number between 1 and 3 in the input box and pressing the button. This will return the name you entered in the storage account.

## Step 4 - Setup Authentication

1. Create a new app registration in Azure AD (Entra ID). Select "accounts in this organizational directory only" and for the redirect URI select the platform "Single-page application (SPA)" and enter the url of the static web app.
2. In the newly created app registration go to "App roles" and create two roles named "Admin" and "User". Both should be assignable to users and groups.
3. Click on the link "how do I assign app roles" and follow the link in there to the enterprise application. In there assign yourself the Admin role (it can take a few minutes for the roles to show up properly). Assign the user role to another user (if you dont have another user create one in Azure AD).
4. Go back to the app registration and copy the "Application (client) ID" and the "Directory (tenant) ID".
5. Go to the app.js file and edit the Azure AD AppConfig setting and replace the client ID and tenant ID in the file. Save this file and make sure it's in the main branch on github so it's deployed to the Static Web App. Check if the github action has ran before testing.
6. Open the webapp and test the login by clicking the link to login, the first time you should get an extra question to allow for the app to read your data, after that it should show the username and roles assigned. You can try the log out link and log in with the different account to test the different roles.

## Step 5 - Function App in APIM

1. Create a new function app in azure, make sure the subscription, resourcegroup and region are set correct. give it a globally unique name. For the runtime stack select "Powershell Core". Leave the operating system and version default. Leave the hosting on "serverless". In the storage tab select the storage account which was created earlier. You can disable application insights but for troubleshooting this is very usefull. Make sure you create the resources in the right location. Leave all other fields default and create the function app.
2. Open the resource and in the overview pane create a function from the portal. Select the type Http Trigger. give the function the name "base64" and set the Authorization on Anonymous.
3. Once the function is created go in the function to "Code + Test". In the dropdown box at the top of the screen it shows two files. Copy the contents of the files in the folder "FunctionApp" to the respective files in Azure.
4. Go back to the function app itself and open the API Management blade. Select the API Management resource and the right api and link it to this function app. Set the checkbox for import functions to true. Make sure the base64 function is imported in the API management.
5. As you notice now the api is imported as a POST command. Open the API management and go to the API, change it to GET instead. Add the contents of AddJWTValidationToAPIM.xml after the `<base />` in the inbound processing rules. Make sure you replace the client id and tenant id.
6. Test the API in the static web app under "Get base64 string from API". You can enter any string and it will be converted to base64. You'll notice if you aren't logged in it will prompt you to login. Test the API with both accounts and you'll notice the account which is just a user can't access the API.
