const express = require("express");
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
const feedCoin = require("./feedCoin");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.get("/orderHistory/:employeeID", function (req, res) {
    dbConnection.checkAccessToken(req.params.employeeID, req,res, async function (returned) {

        if (returned) {
            request.getRequest("http://localhost:3001/api/queries/Q8?paramEmployeeID=resource%3Aorg.example.mynetwork.employee%23" + req.params.employeeID, utils.getAccessToken(req)).then(queryRes => {
                let productArray = getProductArray(queryRes.data);

                let getProductReq =
                    {
                        "$class": "org.example.mynetwork.getProducts",
                        "productIDs": productArray
                    }
                request.postRequest(getProductReq, "http://localhost:3001/api/getProducts").then(async productsRes => {
                    console.log(productsRes.data);
                    let mergedArray = mergeArrays(queryRes.data, productsRes.data);
                    mergedArray=await getVendorName(mergedArray,req);
                    utils.getEmployeeDetails(req.params.employeeID,req,function (employeeReturned){
                        let employee = {
                            employeeId: employeeReturned.employee.employeeId,
                            email: employeeReturned.employee.email,
                            firstName: employeeReturned.employee.firstName,
                            lastName: employeeReturned.employee.lastName,
                            coinCount: employeeReturned.employee.coinCount,
                            company: employeeReturned.employee.company,
                            teamName: employeeReturned.org.division.team.teamName,
                            errors: "",
                            products: productsRes.data,
                            error: "",
                            history:mergedArray
                        }
                        console.log("Employee JSON ",employee.history[0]);
                        res.render("orderHistory.ejs",employee);


                    });


                });


            });
        }

    });
});

function getProductArray(array) {
    let productsArray = [];
    for (let i = 0; i < array.length; i++) {
        productsArray[i] = array[i].product.split("#")[1];
    }
    return productsArray;

}

function mergeArrays(purchaseArray, productArray) {
    let mergedArray = [];
    for (let i = 0; i < purchaseArray.length; i++) {
        mergedArray[i] = {
            "purchase": purchaseArray[i],
            "product": productArray[i],
            "vendorName":productArray[i].vendor
        }
    }
    return mergedArray;
}

async function getVendorName(historyArray,req){
    for(let t=0;t<historyArray.length;t++){
        request.getRequest("http://localhost:3000/api/vendor/"+historyArray[t].vendorName.split('#')[1],utils.getAccessToken(req)).then(vendorRes=>{
            console.log("Vendor response ",vendorRes);
            historyArray[t].vendorName=vendorRes.data.vendorName;
        })
    }
    return historyArray;
}

module.exports = {app}