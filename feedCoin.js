const express = require("express")
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));

app.post("/routeFeed/:employeeID", function (req, res) {
    console.log("Route fee", req.body);
    let result = req.body.sort.split(" ")[0];
    if (result == "Team") {
        res.redirect("http://localhost:8080/feed/team/" + req.params.employeeID);
    } else if (result == "Division") {
        res.redirect("http://localhost:8080/feed/division/" + req.params.employeeID);
    } else if (result == "Company") {
        res.redirect("http://localhost:8080/feed/company/" + req.params.employeeID);
    }
    res.send(req.body);
});

app.get("/feed/team/:employeeID", function (req, res) {
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (employeeReturned) {
                let employee = {
                    employeeId: employeeReturned.employee.employeeId,
                    company: employeeReturned.org,
                    feed: "Team",
                    pageTitle: employeeReturned.org.division.team.teamName,
                    email: employeeReturned.employee.email,
                    firstName: employeeReturned.employee.firstName,
                    lastName: employeeReturned.employee.lastName,
                    coinCount: employeeReturned.employee.coinCount,
                    team: employeeReturned.employee.team,
                    approvalIDs: [],
                    myCoins: []
                }
                let requestJSON = {
                    "$class": "org.example.mynetwork.getRewardCoinWithID",
                    "teamID": employeeReturned.employee.team.split("#")[1]
                }
                request.postRequest(requestJSON, "http://localhost:3001/api/getRewardCoinWithID").then(queryRes => {
                    console.log("Query response", queryRes.data);

                    utils.addCoins(queryRes.data, employee, function (returned) {
                        res.render('feedCoin.ejs', returned);
                    });


                });
            });

        }
    });

});

app.get("/feed/division/:employeeID", function (req, res) {
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (employeeReturned) {

                let employee = {
                    employeeId: employeeReturned.employee.employeeId,
                    company: employeeReturned.org,
                    feed: "Division",
                    pageTitle: employeeReturned.org.division.divisionName,
                    email: employeeReturned.employee.email,
                    firstName: employeeReturned.employee.firstName,
                    lastName: employeeReturned.employee.lastName,
                    coinCount: employeeReturned.employee.coinCount,
                    team: employeeReturned.employee.team,
                    approvalIDs: [],
                    myCoins: []
                }
                let requestJSON = {
                    "$class": "org.example.mynetwork.getTeam",
                    "divisionID": employee.company.division.divisionID

                }
                console.log("Body", requestJSON);
                request.postRequest(requestJSON, "http://localhost:3001/api/getTeam").then(queryRes => {
                    utils.addCoins(queryRes.data, employee, function (returned) {
                        res.render('feedCoin.ejs', returned);
                    });


                });
            });
        }
    });

});


app.get("/feed/company/:employeeID", function (req, res) {
    let employeeID = req.params.employeeID;
    console.log("Employee ID", employeeID);
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID,req, function (employeeReturned) {
                let employee = {
                    employeeId: employeeReturned.employee.employeeId,
                    company: employeeReturned.org,
                    feed: "Company",
                    pageTitle: employeeReturned.org.companyName,
                    email: employeeReturned.employee.email,
                    firstName: employeeReturned.employee.firstName,
                    lastName: employeeReturned.employee.lastName,
                    coinCount: employeeReturned.employee.coinCount,
                    team: employeeReturned.employee.team,
                    myCoins: []
                }
                let requestJSON = {
                    "$class": "org.example.mynetwork.getCompany",
                    "companyID": employee.company.companyID
                }
                console.log("Body", requestJSON);
                request.postRequest(requestJSON, "http://localhost:3001/api/getCompany").then(queryRes => {
                    console.log("Query response", queryRes);

                    utils.addCoins(queryRes.data, employee, function (returned) {
                        res.render('feedCoin.ejs', returned);
                    });
                });
            });
        }
    })
});

module.exports = {app};