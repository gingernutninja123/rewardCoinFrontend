const express = require("express")
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/profile/:employeeID", function (req, res) {
    let employeeID = req.params.employeeID;
    console.log("Employee ID", employeeID);
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (orgReturned) {
                let employee = {
                    employeeId: orgReturned.employee.employeeId,
                    email: orgReturned.employee.email,
                    firstName: orgReturned.employee.firstName,
                    lastName: orgReturned.employee.lastName,
                    coinCount: orgReturned.employee.coinCount,
                    teamName: orgReturned.org.division.team.teamName
                }
                res.render('profilescreen.ejs', employee);

            });

        }
    });


});


app.get("/viewProfile/:employeeID/:profileID", function (req, res) {
    let employeeID = req.params.employeeID;
    let profileID = req.params.profileID;
    console.log("Employee ID", employeeID);
    dbConnection.checkAccessToken(employeeID, req, res, function (returned) {
        if (returned) {
            request.getRequest("http://localhost:3000/api/employee/" + profileID, utils.getAccessToken(req)).then(getRes => {
                console.log("Testing ",getRes);
                utils.getEmployeeDetails(employeeID, req, function (orgReturned) {
                    let employee = {
                        userId: orgReturned.employee.employeeId,
                        userName: orgReturned.employee.firstName,
                        employeeId: getRes.data.employeeId,
                        email: getRes.data.email,
                        firstName: getRes.data.firstName,
                        lastName: getRes.data.lastName,
                        coinCount: getRes.data.coinCount,
                        teamName: orgReturned.org.division.team.teamName,
                        myCoins: []
                    }
                    request.getRequest("http://localhost:3001/api/queries/Q4?paramTeamID=resource%3Aorg.example.mynetwork.employee%23" + req.params.profileID, utils.getAccessToken(req)).then(queryRes => {
                        console.log("Testing", queryRes.data[0]);
                        utils.addCoins(queryRes.data, employee, function (returned) {
                            res.render('viewProfileScreen.ejs', returned);
                        });
                    });
                });
            });
        }
    });


});

app.get("/signout", function (req, res) {
    res.cookie('access_token', "");
    res.redirect('http://localhost:8080/login');

});


module.exports = {app};