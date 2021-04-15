const express = require("express")
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils=require("./utils");
app.use(bodyParser.urlencoded({extended: true}));



app.get("/approve/:employeeID/:coinID",function(req,res){
    dbConnection.checkAccessToken(req.params.employeeID, req,res, function (returned) {
        if(returned){
            let previousUrl=req.header('Referer');
            let approveRequest={
                "$class": "org.example.mynetwork.approve",
                "approver": "org.example.mynetwork.employee#"+req.params.employeeID,
                "coin": req.params.coinID
            }
            console.log("Approve Request",approveRequest);
            request.postRequest(approveRequest,"http://localhost:3001/api/approve?access_token="+utils.getAccessToken(req)).then(approveRes=>{
                res.redirect(previousUrl);
            });
        }

    });

});



app.get("/giftCoin/:employeeID/:recipent?", function (req, res) {
    dbConnection.checkAccessToken(req.params.employeeID, req,res, function (returned) {
        if (returned) {
            request.getRequest("http://localhost:3000/api/employee/" + req.params.employeeID, utils.getAccessToken(req)).then(getRes => {
                console.log("Raw response", getRes.data.email);
                let employee = {
                    employeeId: getRes.data.employeeId,
                    email: getRes.data.email,
                    firstName: getRes.data.firstName,
                    lastName: getRes.data.lastName,
                    coinCount: getRes.data.coinCount,
                    company: getRes.data.company,
                    errors: "",
                    employees: []
                }
                let company = "resource%3Aorg.example.mynetwork.company%23" + getRes.data.company.split("#")[1];
                request.getRequest("http://localhost:3001/api/queries/Q5?paramTeamID=" + company, utils.getAccessToken(req)).then(getAllRes => {
                    console.log("Company", company);
                    console.log("Query response", getAllRes.data);
                    let newArray = utils.addEmployees(employee, getAllRes.data, req.params.employeeID, req.params.recipent);
                    console.log("New array", newArray)
                    res.render('giftCoin.ejs', newArray);
                })

            });

        }
    });

});

app.post("/giftCoin", function (req, res) {
    console.log("Body", req.body);
    request.getRequest("http://localhost:3000/api/employee/" + req.body.employeeID, utils.getAccessToken(req)).then(getRes => {
        console.log("Raw response", getRes.data.email);
        let employee = "";
        if (getRes.data.coinCount != 0) {
            request.getRequest("http://localhost:3000/api/queries/Q1?paramOwner=resource%3Aorg.example.mynetwork.employee%23" + req.body.employeeID, utils.getAccessToken(req)).then(queryRes => {
                let giftRequest={
                    "$class": "org.example.mynetwork.tradeCoin",
                    "asset": queryRes.data[0].coinID,
                    "newOwner": "resource:org.example.mynetwork.employee#"+req.body.recipent
                };
                console.log("Gift request",giftRequest);
                request.postRequest(giftRequest,"http://localhost:3000/api/tradeCoin?access_token="+utils.getAccessToken(req)).then(giftRes=>{
                    console.log("Gift res",giftRes);
                    res.redirect('http://localhost:8080/profile/' + req.body.employeeID);
                })
            });
        }
        else {
            employee = {
                employeeId: getRes.data.employeeId,
                email: getRes.data.email,
                firstName: getRes.data.firstName,
                lastName: getRes.data.lastName,
                coinCount: getRes.data.coinCount,
                company: getRes.data.company,
                errors: "You don't have enough coins",
                employees: []
            };
            let company = "resource%3Aorg.example.mynetwork.company%23" + getRes.data.company.split("#")[1];
            request.getRequest("http://localhost:3001/api/queries/Q5?paramTeamID=" + company, utils.getAccessToken(req)).then(getAllRes => {
                console.log("Company", company);
                console.log("Query response", getAllRes.data);
                let newArray = utils.addEmployees(employee, getAllRes.data, req.params.employeeID, req.params.recipent);
                console.log("New array", newArray)
                res.render('giftCoin.ejs', newArray);
            });
        }
    });

});


module.exports = {app};