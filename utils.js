const cookieParser = require("cookie-parser");
const dbConnection = require('./databaseConnection.js');
const request = require("./postRequest.js");

function getAccessToken(req) {
    let jsonCookies = cookieParser.JSONCookies(req.cookies);
    let access_token = jsonCookies.access_token;
    access_token = access_token.replace("s:", "");
    access_token = access_token.split('.')[0];
    return access_token;

}

async function getEmployeeDetails(employeeID, req, callback) {
    request.getRequest("http://localhost:3000/api/employee/" + employeeID, getAccessToken(req)).then(employeeRes => {
        getOrg(employeeRes.data.team.split("#")[1], function (orgReturned) {
            let employeeDetails = {
                "employee": employeeRes.data,
                "org": orgReturned
            }

            return callback(employeeDetails);
        });
    });
}

async function getOrg(teamID, callback) {
    let orgJSON = "";
    let divID = "";
    request.getRequest("http://localhost:3001/api/team/" + teamID, "").then(res => {
        orgJSON = {
            "team": {
                "teamID": res.data.orgID,
                "teamName": res.data.orgName,
                "teamCode": res.data.teamCode,
                "division": ""
            }
        };
        divID = JSON.stringify(res.data.organisation).split('#')[1].replace("\"", "");
        console.log("Division ID", divID);
        request.getRequest("http://localhost:3001/api/division/" + divID, "").then(resDiv => {
            if (res.data == "") {
                request.getRequest("http://localhost:3001/api/company/" + divID, "").then(comRes => {
                    orgJSON = JSON.stringify(orgJSON).replace("division", "company");
                    orgJSON = JSON.parse(orgJSON);
                    orgJSON.team.division = divID;
                    let orgJSON3 = {
                        "companyID": comRes.data.orgID,
                        "companyName": comRes.data.orgName,
                        "address": comRes.data.address,
                        "email": comRes.data.email,
                        "team": orgJSON.team
                    }
                    return callback(orgJSON3);
                })
            } else {
                console.log("Division", resDiv.data);
                orgJSON.team.division = divID;
                let orgJSON2 = {
                    "division": {
                        "divisionID": resDiv.data.orgID,
                        "divisionName": resDiv.data.orgName,
                        "divisionEmail": resDiv.data.email,
                        "divisionAddress": resDiv.data.address,
                        "company": resDiv.data.company,
                        "team": orgJSON.team
                    }
                }
                console.log("JSON object", orgJSON2)
                let companyID = JSON.stringify(resDiv.data.company).split('#')[1].replace("\"", "");
                console.log("Company ID", companyID)
                request.getRequest("http://localhost:3001/api/company/" + companyID, "").then(comRes => {
                    orgJSON = JSON.stringify(orgJSON).replace("division", "company");
                    orgJSON = JSON.parse(orgJSON);
                    orgJSON.team.division = divID;
                    let orgJSON3 = {
                        "companyID": comRes.data.orgID,
                        "companyName": comRes.data.orgName,
                        "address": comRes.data.address,
                        "email": comRes.data.email,
                        "division": orgJSON2.division
                    }
                    console.log(orgJSON3);
                    return callback(orgJSON3);
                })
            }
        });

    })
}

async function addCoins(arrayCoins, pageArray, callback) {
    let arrayIDs = [];
    for (i = 0; i < arrayCoins.length; i++) {
        let currentSponsor = arrayCoins[i].sponsor.split("#", 2)[1];
        arrayIDs.push(currentSponsor);
        let currentValue = {
            CoinID: arrayCoins[i].coinID,
            Recipent: arrayCoins[i].recipent,
            RecipentName: "",
            Type: arrayCoins[i].type,
            Description: arrayCoins[i].description,
            Sponsor: currentSponsor,
            SponsorName: currentSponsor + "name",
            Status: arrayCoins[i].status,
            ApprovalIDs: [],
            Approvals: []
        };
        console.log("Approvals", arrayCoins[i].approvals);
        for (n = 0; n < arrayCoins[i].approvals.length; n++) {
            let currentApproval = arrayCoins[i].approvals[n].split("#", 2)[1];
            currentValue.ApprovalIDs.push(currentApproval);
            arrayIDs.push(currentApproval);
            let currentApprovalName = {
                approvalID: currentApproval,
                approvalName: currentApproval + "name"
            }
            console.log("Current approval", currentApproval)
            currentValue.Approvals.push(currentApprovalName);

        }
        await dbConnection.getName(currentValue.Recipent.split("#")[1], async function (name) {
            if (name == false) {

            } else {
                currentValue.RecipentName = name;
            }

            pageArray.myCoins.push(currentValue);
        });

    }
    console.log(pageArray);
    await dbConnection.replaceIDs(arrayIDs, pageArray, async function (returned) {
        console.log("Array", returned)
        return callback(returned);
    });

}

function addEmployees(currentArray, allEmployees, employeeID, recipent) {
    //Adds recipent to the array first to appear first in the dropdown
    // This is for the gift coin and reward coin page
    if (recipent != undefined) {
        for (n = 0; n < allEmployees.length; n++) {
            if (allEmployees[n].employeeId == recipent) {
                currentArray.employees.push(allEmployees[n]);
            }
        }

    }
    for (n = 0; n < allEmployees.length; n++) {
        if (allEmployees[n].employeeId != employeeID && allEmployees[n].employeeId != recipent) {
            currentArray.employees.push(allEmployees[n]);
        }
    }

    console.log("Current array", currentArray);
    return currentArray;
}

function getError(error){
    if(error=="emptyName"){
        return "Name must not be empty"
    }
    else if(error=="emptyDescription"){
        return "Description must not be empty"
    }
    else if(error=="notIntGoal"){
        return "Goal must be an integer"
    }
    else if(error=="goalGreaterZero"){
        return "Goal must be greater than Zero"
    }
    else if(error=="emptyGoal"){
        return "Goal must not be empty"
    }
    else{
        return "";
    }
}


async function arrayCoins(num, array) {
    let arrayCoins = [];
    for (let i = 0; i < num; i++) {
        arrayCoins[i] = array[i].coinID;
    }
    return arrayCoins;


}


module.exports = {getAccessToken, getEmployeeDetails, addCoins, addEmployees,getOrg,getError,arrayCoins}