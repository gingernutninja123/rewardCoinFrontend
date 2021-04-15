const express=require("express")
const app=express();
const bodyParser=require("body-parser");
const request=require("./postRequest.js");

app.use(bodyParser.urlencoded({extended: true}));

app.get("/adminPage",function (req,res){
    console.log("Admin page")
    res.render('adminPage.ejs',{"divisionID":"","teamID":"","companyID":""});
});

app.post("/createCDT",function (req,res){
    console.log(req.body);
    let companyID="company"+Date.now();
    let divisionID="division"+Date.now();
    let teamID="team"+Date.now();
    let companyReq={
        "$class": "org.example.mynetwork.company",
        "address": req.body.companyAddress,
        "email": req.body.companyEmail,
        "orgID": companyID,
        "orgName": req.body.companyName
    };

    let divisionReq={
        "$class": "org.example.mynetwork.division",
        "company": "resource:org.example.mynetwork.company#"+companyID,
        "address": req.body.divisionAddress,
        "email": req.body.divisionEmail,
        "orgID": divisionID,
        "orgName": req.body.divisionName
    }

    let teamReq={
        "$class": "org.example.mynetwork.team",
        "organisation": "resource:org.example.mynetwork.division#"+divisionID,
        "manager": "resource:org.example.mynetwork.employee#1698",
        "teamCode": req.body.teamCode,
        "orgID": teamID,
        "orgName": req.body.teamName

    }
    request.postRequest(companyReq,"http://localhost:3001/api/company").then(companyRes=>{
        request.postRequest(divisionReq,"http://localhost:3001/api/division").then(divisionRes=>{
            request.postRequest(teamReq,"http://localhost:3001/api/team").then(teamRes=>{
                if (teamRes.status==200){
                    res.render('adminPage.ejs',{"divisionID":divisionID,"teamID":teamID,"companyID":companyID});
                }
            });
        });
    });
});

app.post("/createDT",function (req,res){
    let divisionID="division"+Date.now();
    let teamID="team"+Date.now();
    let divisionReq={
        "$class": "org.example.mynetwork.division",
        "company": "resource:org.example.mynetwork.company#"+req.body.companyID,
        "address": req.body.divisionAddress,
        "email": req.body.divisionEmail,
        "orgID": divisionID,
        "orgName": req.body.divisionName
    }

    let teamReq={
        "$class": "org.example.mynetwork.team",
        "organisation": "resource:org.example.mynetwork.division#"+divisionID,
        "manager": "resource:org.example.mynetwork.employee#1698",
        "teamCode": req.body.teamCode,
        "orgID": teamID,
        "orgName": req.body.teamName

    }

    request.postRequest(divisionReq,"http://localhost:3001/api/division").then(divisionRes=>{
        request.postRequest(teamReq,"http://localhost:3001/api/team").then(teamRes=>{

        });
    });
});



module.exports={app}