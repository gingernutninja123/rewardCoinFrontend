const express = require("express")
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/products/:employeeID", function (req, res) {
    let error = "";
    if (req.query.error != null) {
        error = "You dont have enough coins for this purchase";
    }
    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (employeeReturned) {
                request.getRequest("http://localhost:3000/api/product", utils.getAccessToken(req)).then(async productRes => {
                    let employee = {
                        employeeId: employeeReturned.employee.employeeId,
                        email: employeeReturned.employee.email,
                        firstName: employeeReturned.employee.firstName,
                        lastName: employeeReturned.employee.lastName,
                        coinCount: employeeReturned.employee.coinCount,
                        company: employeeReturned.employee.company,
                        teamName: employeeReturned.org.division.team.teamName,
                        errors: "",
                        products: await productsArray(productRes.data,req),
                        error: error
                    }
                    console.log(employee);
                    res.render("products.ejs", employee);
                })
            });
        }
    });
})

app.get("/purchase/:employeeID/:productID", function (req, res) {
    let previousUrl=req.header('Referer');
    console.log("previous url ",previousUrl);
    dbConnection.checkAccessToken(req.params.employeeID, req, res,function (returned) {
        if (returned) {
            let purchaseRequest =
                {
                    "$class": "org.example.mynetwork.purchase",
                    "employee": "org.example.mynetwork.employee#" + req.params.employeeID,
                    "product": req.params.productID
                }
            request.postRequest(purchaseRequest, "http://localhost:3000/api/purchase?access_token=" + utils.getAccessToken(req)).then(purchaseRes => {
                if (purchaseRes.status == 200) {
                    console.log("Purchase was successful")
                    res.redirect("http://localhost:8080/orderHistory/"+req.params.employeeID);
                } else {
                    console.log(purchaseRes.response.data.error.message);
                    let message = JSON.stringify(purchaseRes.response.data.error.message);
                    console.log(message);
                    if (message.includes('Error: Not enough coins')) {
                        res.redirect(previousUrl+ '?error=coins')
                    }
                }
            })

        }
    });
})

async function productsArray(array,req){
    for(let i=0;i<array.length;i++){
        await request.getRequest("http://localhost:3001/api/vendor/"+array[i].vendor.split("#")[1],utils.getAccessToken(req)).then(vendorRes=>{
            console.log("Vendor res ",vendorRes)
            let entry={
                productID:array[i].productID,
                productName:array[i].productName,
                description:array[i].description,
                price:array[i].price,
                vendor:array[i].vendor.split("#")[1],
                vendorName:vendorRes.data.vendorName
            }
            array[i]=entry;

        })

    }
    return array;
}


module.exports = {app}