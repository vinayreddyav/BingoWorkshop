//Azure AD AppConfig
const msalConfig = {
    auth: {
        clientId: 'YOUR CLIENT ID',
        authority: 'https://login.microsoftonline.com/YOUR TENANT ID',
        redirectUri: `${location.origin}`
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    }
};

//API Config
var APIendpoint = "YOUR API ENDPOINT"

//Vars
const myMSALObj = new msal.PublicClientApplication(msalConfig);
var currentAccount = getCurrentAccount();

//API Main Function
async function getApiRespons(uri, method, body = null, login = false) {
    // Create the header
    var header = {}

    //Get the bearer token
    if (login) {
        var id_token = await getUserToken();
        header.Authorization = `Bearer ${id_token}`
    }

    //Extra arguments for fetch
    var arguments = {
        method: method,
        headers: header,
        body: body
    }

    // Storing response
    const response = await fetch(uri, arguments)

    return await response.text();
}

// API Calls
async function getPing() {
    var uri = APIendpoint + "ping";
    $("#pingResponse").html(await getApiRespons(uri, "GET"));
}

async function getStorage() {
    var uri = APIendpoint + "storage?row=" + $(`#Row`).val();
    $("#storageResponse").html(await getApiRespons(uri, "GET"));
}

async function getConvert() {
    var uri = APIendpoint + "base64?string=" + $(`#String`).val();
    $("#base64Response").html(await getApiRespons(uri, "GET", null, true));
}

// Login Functions
async function getUserToken() {
    var userToken = null;
    const UserSession = getUserSession();
    await UserSession.then((session) => {
        userToken = session.idToken
    })
    return userToken;
}

async function getUserRoles() {
    var userRoles = null;
    const UserSession = getUserSession();
    await UserSession.then((session) => {
        userRoles = session.idTokenClaims.roles
    })
    return userRoles;
}

async function getUserSession() {
    if (currentAccount == null) {
        await signinUser();
    }

    // Check if needs refreshing
    var currentTimeStamp = Date.now() / 1000;
    if (currentTimeStamp > currentAccount.idTokenClaims.exp) {
        await signinUser();
    }

    var silentRequest = {
        scopes: ["User.Read", "User.readbasic.all"],
        account: currentAccount,
        forceRefresh: false
    };

    return await myMSALObj.acquireTokenSilent(silentRequest).catch(async (error) => {
        if (error instanceof InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            var request = {
                scopes: ["User.Read", "User.readbasic.all"]
            };

            return await myMSALObj.acquireTokenPopup(request).catch(error => {
                console.log(error);
            });
        }
    });
}

async function signinUser() {
    var request = {
        scopes: ["User.Read", "User.readbasic.all"]
    };

    await myMSALObj.loginPopup(request).then(setCurrentAccount).catch(function (error) {
        console.log(error);
    });
}

function setCurrentAccount(resp) {
    currentAccount = myMSALObj.getAccountByUsername(resp.account.username);
}

function getCurrentAccount() {
    const allaccounts = myMSALObj.getAllAccounts();
    if (allaccounts.length > 0) {
        return myMSALObj.getAccountByUsername(allaccounts[0].username);
    }
    else {
        return myMSALObj.getAccountByUsername(null);
    }
}

//Token Functions
function decodeBase64(base64url) {
    try {
        //Convert base 64 url to base 64
        var base64 = base64url.replace('-', '+').replace('_', '/')
        //atob() is a built in JS function that decodes a base-64 encoded string
        var utf8 = atob(base64)
    } catch (err) {
        utf8 = "Bad String.\nError: " + err.message
    }
    return utf8
}

function getJWTpayload(token) {
    var tokens = token.split(".")
    if (tokens.length == 3) {
        return JSON.parse(decodeBase64(tokens[1]))
    }
}

//Listeners
$($('#GetRow')).on('click', async function (e) {
    // Stop the browser from submitting the form.
    e.preventDefault();

    await getStorage();
});

$($('#GetBase64')).on('click', async function (e) {
    // Stop the browser from submitting the form.
    e.preventDefault();

    await getConvert();
});

//Main Functions
async function login() {
    if (currentAccount == null) {
        await signinUser();
    }
    $("#currentaccount").html((getCurrentAccount()).username)
    $("#currenToken").html(JSON.stringify((getJWTpayload(await getUserToken())).roles))
}

async function logout() {
    // Extract login hint to use as logout hint
    const logoutHint = currentAccount.username;
    await myMSALObj.logoutPopup({ logoutHint: logoutHint });
    window.location.replace(location.origin);
}