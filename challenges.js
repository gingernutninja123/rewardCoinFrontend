const express = require("express");
const app = express();
const request = require("./postRequest.js");
const dbConnection = require('./databaseConnection.js');
const bodyParser = require("body-parser");
const utils = require("./utils");
app.use(bodyParser.urlencoded({extended: true}));


app.get('/challenges/:employeeID/:errors?', function (req, res) {
    let errors=utils.getError(req.params.errors);
    console.log("Errors ",errors);
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
                    teamName: returned.org.division.team.teamName,
                    employees: []
                }
                let company = "resource%3Aorg.example.mynetwork.company%23" + returned.employee.company.split("#")[1];
                request.getRequest("http://localhost:3001/api/queries/Q5?paramTeamID=" + company, utils.getAccessToken(req)).then(getAllRes => {
                    console.log("Company", company);
                    console.log("Query response", getAllRes.data);
                    let newArray = utils.addEmployees(employee, getAllRes.data, req.params.employeeID, req.params.recipent);
                    request.getRequest("http://localhost:3001/api/queries/Q10?paramID=resource%3Aorg.example.mynetwork.employee%23" + req.params.employeeID, utils.getAccessToken(req)).then(recipRes => {
                        request.getRequest("http://localhost:3001/api/queries/Q11?paramID=resource%3Aorg.example.mynetwork.employee%23" + req.params.employeeID, utils.getAccessToken(req)).then(async sponsorRes => {
                            addNames(recipRes.data, function (returned) {
                                addNames(sponsorRes.data,function (sponsorReturned) {
                                    let request = {
                                        "setChallenge": newArray,
                                        "myChallenges": returned,
                                        "challengesSet": sponsorReturned,
                                        "errors": errors
                                    }
                                    console.log("Request ", request);
                                    res.render('challenge.ejs', request);
                                });
                            });
                        })
                    })

                });
            });
        }
    });
});

const {challengeRules, validateChallenge} = require('./validator.js');
app.post("/challenges", challengeRules(), async function (req, res) {
    let errors = await validateChallenge(req);
    if (errors == '') {
                request.getRequest("http://localhost:3000/api/queries/Q1?paramOwner=resource%3Aorg.example.mynetwork.employee%23" + req.body.employeeID, utils.getAccessToken(req)).then(async queryRes => {
                    let coinsArray = await utils.arrayCoins(req.body.coin, queryRes.data);
                    let challengeRequest = {
                        $class: "org.example.mynetwork.createChallenge",
                        challenge: {
                            $class: "org.example.mynetwork.nochallenge",
                            challengeID: "challenge" + Date.now().valueOf(),
                            challengeName: req.body.name,
                            description: req.body.description,
                            reward: req.body.coin,
                            rewardCoins: coinsArray,
                            recipent: 'org.example.mynetwork.employee#' + req.body.recipent,
                            sponsor: 'org.example.mynetwork.employee#' + req.body.employeeID,
                            status: 'INPROGRESS'
                        }
                    }
                    console.log("Challenge request ", challengeRequest);
                    console.log(coinsArray);
                    request.postRequest(challengeRequest, "http://localhost:3001/api/createChallenge?access_token=" + utils.getAccessToken(req)).then(challengerRes => {
                        console.log(challengerRes);
                        res.redirect("http://localhost:8080/challenges/"+req.body.employeeID);

                    });


                });
            } else {
                res.redirect("http://localhost:8080/challenges/"+req.body.employeeID+"/"+errors);
            }
})



async function addNames(challengeArray, callback) {
    let arrayIDs = [];
    let challenge = [];
    for (let n = 0; n < challengeArray.length; n++) {
        let currentChallenge = {
            "challengeID": challengeArray[n].challengeID,
            "challengeName": challengeArray[n].challengeName,
            "description": challengeArray[n].description,
            "reward": challengeArray[n].reward,
            "recipent": challengeArray[n].recipent.split('#')[1],
            "recipentName": challengeArray[n].recipent.split("#")[1] + "name",
            "sponsor": challengeArray[n].sponsor.split('#')[1],
            "sponsorName": challengeArray[n].sponsor.split("#")[1] + "name",
            "status": challengeArray[n].status
        }
        challenge.push(currentChallenge);
        arrayIDs.push(challengeArray[n].recipent.split("#")[1]);
        arrayIDs.push(challengeArray[n].sponsor.split("#")[1]);
    }
    await dbConnection.replaceIDs(arrayIDs, challenge, async function (returned) {
        return callback(returned);
    });
}

app.post("/confirm",function (req,res){
    console.log(req.body);
    let confirmRequest = {
        "$class": "org.example.mynetwork.confirmChallenge",
        "challenge": req.body.challenge,
        "confirmer": "org.example.mynetwork.employee#"+req.body.employeeID,
    }
    request.postRequest(confirmRequest,"http://localhost:3001/api/confirmChallenge?access_token="+utils.getAccessToken(req)).then(confirmRes=>{
        console.log("Confirm Response ",confirmRes);
        res.redirect("http://localhost:8080/challenges/"+req.body.employeeID);
    })
});

app.post("/deny",function (req,res){
    console.log(req.body);
    let denyRequest = {
        "$class": "org.example.mynetwork.denyChallenge",
        "challenge": req.body.challenge,
        "confirmer": "org.example.mynetwork.employee#"+req.body.employeeID,
    }
    request.postRequest(denyRequest,"http://localhost:3001/api/denyChallenge?access_token="+utils.getAccessToken(req)).then(denyRes=>{
        console.log("Deny Response ",denyRes);
        res.redirect("http://localhost:8080/challenges/"+req.body.employeeID);
    })
});

module.exports = {app};