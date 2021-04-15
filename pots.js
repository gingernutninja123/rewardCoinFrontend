const express = require("express");
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/pots/:employeeID/:errors?", function (req, res) {
    let errors = utils.getError(req.params.errors);

    dbConnection.checkAccessToken(req.params.employeeID, req, res, function (returned) {
        if (returned) {
            utils.getEmployeeDetails(req.params.employeeID, req, function (returnedEmployee) {
                request.getRequest("http://localhost:3001/api/queries/Q12?paramID=resource%3Aorg.example.mynetwork.employee%23" + req.params.employeeID, utils.getAccessToken(req)).then(queryRes => {
                    let getRequest = {
                        "$class": "org.example.mynetwork.getPots",
                        "companyID": returnedEmployee.employee.company
                    }
                    request.postRequest(getRequest, "http://localhost:3001/api/getPots?access_token=" + utils.getAccessToken(req)).then(async getPotsRes => {
                        await addName(queryRes.data, async function (queryReturned) {
                            await addName(getPotsRes.data, function (getPotReturned) {
                                let potsJSON = {
                                    employeeId: returnedEmployee.employee.employeeId,
                                    email: returnedEmployee.employee.email,
                                    firstName: returnedEmployee.employee.firstName,
                                    lastName: returnedEmployee.employee.lastName,
                                    coinCount: returnedEmployee.employee.coinCount,
                                    company: returnedEmployee.employee.company,
                                    teamName: returnedEmployee.org.division.team.teamName,
                                    myPots: queryReturned,
                                    allPots: getPotReturned,
                                    errors: errors
                                }

                                console.log("Pots json ", potsJSON);
                                res.render("pots.ejs", potsJSON);

                            });
                        });

                    });
                });

            })


        }


    })


});

const {potRules, validatePot} = require('./validator.js');
app.post('/pots', potRules(), async function (req, res) {
    let errors = await validatePot(req);
    if (errors == '') {
        let potRequest = {
            "$class": "org.example.mynetwork.pot",
            "potID": "pot" + Date.now().valueOf(),
            "potName": req.body.name,
            "description": req.body.description,
            "goal": req.body.goal,
            "author": "org.example.mynetwork.employee#" + req.body.employeeID,
            "backers": [],
            "rewardCoins": [],
            "status": "PENDING"
        }
        request.postRequest(potRequest, "http://localhost:3001/api/pot?access_token=" + utils.getAccessToken(req)).then(potRes => {
            console.log("Pot response ", potRes)
            if (potRes.status == 200) {
                res.redirect("http://localhost:8080/pots/" + req.body.employeeID);
            }
        })
    } else {
        res.redirect("http://localhost:8080/pots/" + req.body.employeeID + "/" + errors);
    }


})


async function addName(array, callback) {
    let arrayID = [];
    let returnedArray=[];
    for(let t=0;t<array.length;t++) {
        let returnedJSON = {
            potID: array[t].potID,
            potName: array[t].potName,
            description: array[t].description,
            goal: array[t].goal,
            author: array[t].author.split("#")[1],
            authorName: array[t].author.split("#")[1] + 'name',
            status: array[t].status,
            rewardCoins:array[t].rewardCoins,
            backers: []
        }
        arrayID.push(array[t].author.split("#")[1]);
        if (array[t].backers.length == 0) {

        } else {
            for (let i = 0; i < array[t].backers.length; i++) {
                let currentJSON = {
                    backer: array[t].backers[i].split("#")[1],
                    backerName: array[t].backers[i].split("#")[1] + 'name'
                }
                returnedJSON.backers.push(currentJSON);
                arrayID.push(array[t].backers[i].split("#")[1]);
            }
        }
        returnedArray.push(returnedJSON);
    }

    await dbConnection.replaceIDs(arrayID, returnedArray, function (returnedArray) {
        return callback(returnedArray);
    });
}

app.post("/contribute",function (req,res){
    request.getRequest("http://localhost:3000/api/queries/Q1?paramOwner=resource%3Aorg.example.mynetwork.employee%23" + req.body.employeeID, utils.getAccessToken(req)).then(async queryRes => {
        let coinsArray = await utils.arrayCoins(req.body.coin, queryRes.data);

        let conRequest={
            "$class": "org.example.mynetwork.contribute",
            "pot": req.body.pot,
            "rewardCoins": coinsArray,
            "backer": "org.example.mynetwork.employee#"+req.body.employeeID
        }

        request.postRequest(conRequest,"http://localhost:3001/api/contribute?access_token="+utils.getAccessToken(req)).then(conRes=>{
            if(conRes.status==200){
                res.redirect("http://localhost:8080/pots/"+req.body.employeeID);
            }
        })



    });







})

module.exports = {app}