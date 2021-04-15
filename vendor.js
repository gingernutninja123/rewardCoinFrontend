const express = require("express")
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/vendor/:employeeID/:vendorID",function (req,res){
    let error = "";
    if (req.query.error != null) {
        error = "You dont have enough coins for this purchase";
    }

    dbConnection.checkAccessToken(req.params.employeeID, req,res, async function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (employeeReturned) {
                request.getRequest("http://localhost:3001/api/queries/Q9?paramVendorID=resource%3Aorg.example.mynetwork.vendor%23" + req.params.vendorID, utils.getAccessToken(req)).then(vendorRes => {
                    request.getRequest("http://localhost:3000/api/vendor/"+req.params.vendorID,utils.getAccessToken(req)).then(getVendor=> {
                        let employee = {
                            employeeId: employeeReturned.employee.employeeId,
                            email: employeeReturned.employee.email,
                            firstName: employeeReturned.employee.firstName,
                            lastName: employeeReturned.employee.lastName,
                            coinCount: employeeReturned.employee.coinCount,
                            company: employeeReturned.employee.company,
                            teamName: employeeReturned.org.division.team.teamName,
                            errors: "",
                            products: vendorRes.data,
                            error: error,
                            vendorName:getVendor.data.vendorName
                        }
                        console.log(employee);
                        res.render("vendor.ejs", employee);
                    });
                })
            });
        }
    });
})

module.exports={app}