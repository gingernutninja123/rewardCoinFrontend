const express = require("express")
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));


app.get("/mycoins/:employeeID", function (req, res) {
    let employeeID = req.params.employeeID;
    console.log("Employee ID", employeeID);
    //Checks if access token matches one in the DB
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            // Get all employees within the company
            request.getRequest("http://localhost:3001/api/queries/Q4?paramTeamID=resource%3Aorg.example.mynetwork.employee%23" + req.params.employeeID, utils.getAccessToken(req)).then(queryRes => {
                utils.getEmployeeDetails(req.params.employeeID, req, function (detailsReturned) {
                    let employee = {
                        employeeId: detailsReturned.employee.employeeId,
                        email: detailsReturned.employee.email,
                        firstName: detailsReturned.employee.firstName,
                        lastName: detailsReturned.employee.lastName,
                        coinCount: detailsReturned.employee.coinCount,
                        myCoins: []
                    };
                    //Adds the coins into the provide json
                    utils.addCoins(queryRes.data, employee, function (returned) {
                        res.render('profileScreenCoins.ejs', returned);
                    });
                })
            });
        }

    });

});

app.get("/rewardCoin/:employeeID/:recipent?", function (req, res) {
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (returned) {
                let employee = {
                    employeeId: returned.employee.employeeId,
                    email: returned.employee.email,
                    firstName: returned.employee.firstName,
                    lastName: returned.employee.lastName,
                    coinCount: returned.employee.coinCount,
                    company: returned.employee.company,
                    errors: "",
                    employees: []
                }
                let company = "resource%3Aorg.example.mynetwork.company%23" + returned.employee.company.split("#")[1];
                request.getRequest("http://localhost:3000/api/queries/Q5?paramTeamID=" + company, utils.getAccessToken(req)).then(getAllRes => {
                    console.log("Company", company);
                    console.log("Query response", getAllRes.data);
                    let newArray = utils.addEmployees(employee, getAllRes.data, req.params.employeeID, req.params.recipent);
                    console.log("New array", newArray)
                    res.render('rewardCoin.ejs', newArray);
                });
            });
        }
    });

})

const {rewardCoinRules, validateTransaction} = require('./validator.js');
app.post("/rewardCoin", rewardCoinRules(), (req, res) => {
    utils.getEmployeeDetails(req.body.employeeID,req,function (returned){

        let employee = {
            employeeId: returned.employee.employeeId,
            email: returned.employee.email,
            firstName: returned.employee.firstName,
            lastName: returned.employee.lastName,
            coinCount: returned.employee.coinCount,
            errors: "",
            employees: []
        }
        let company = "resource%3Aorg.example.mynetwork.company%23" + returned.employee.company.split("#")[1];
        request.getRequest("http://localhost:3000/api/queries/Q5?paramTeamID=" + company, utils.getAccessToken(req)).then(async getAllRes => {
            let newArray = utils.addEmployees(employee, getAllRes.data, req.body.employeeID);
            console.log("JSON body from form ", req.body);
            let error = await validateTransaction(req, res);
            newArray.errors = error;
            console.log("New array ",newArray);
            let coinID = "coin" + new Date().valueOf();
            if (error == "") {
                let employeeBase = "org.example.mynetwork.employee#"
                let requestRewardCoin = {
                    "$class": "org.example.mynetwork.rewardCoin",
                    "coinID": coinID,
                    "sponsor": employeeBase + req.body.employeeID,
                    "recipent": employeeBase + req.body.recipent,
                    "type": req.body.type,
                    "description": req.body.description,
                    "owner": "org.example.mynetwork.networkAdmin#adminJoe",
                    "status": "PENDING_APPROVAL",
                    "approvalCount": 3,
                    "approvals": []
                }
                console.log("Request JSON", requestRewardCoin);
                request.postRequest(requestRewardCoin, "http://localhost:3000/api/rewardCoin?access_token=" + utils.getAccessToken(req)).then(rewardRes => {
                    console.log("POST has been triggered");
                    let approvalRequest = {
                        "$class": "org.example.mynetwork.approve",
                        "approver": "resource:org.example.mynetwork.employee#" + req.body.employeeID,
                        "coin": "org.example.mynetwork.rewardCoin#" + coinID
                    }
                    console.log("Approval Request", approvalRequest);
                    request.postRequest(approvalRequest, "http://localhost:3000/api/approve?access_token=" + utils.getAccessToken(req)).then(approvalRes => {
                        res.redirect('http://localhost:8080/profile/' + req.body.employeeID);
                    });
                });
            } else {
                res.render('rewardCoin.ejs', newArray);
            }
        })

    });
});

module.exports = {app}