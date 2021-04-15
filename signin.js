const express = require("express")
const  app = express();
const request = require("./postRequest.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passwordHash = require('password-hash');
const dbConnection=require('./databaseConnection.js');
const utils=require("./utils");
var employeeID = "";
var networkCard = "";


app.use(cookieParser());

app.get("/github", function (req, res) {
    var jsonCookies = cookieParser.JSONCookies(req.cookies);
    console.log('Signing Up',jsonCookies.signingUp);
    console.log('Sign in',jsonCookies.signIn);
    //Checks what flow the user is on and redirects to certain method
    if(jsonCookies.signIn=='true'){
        console.log("Signing in")
        signIn(req,res)
    }
    //checks what flow the user is on and redirects to method
    else if (jsonCookies.signingUp=='true'){
        console.log('Cookie value inside:',jsonCookies.signingUp);
        signUp(req, res);
    }





});

function signIn(req,res){
    console.log("Start signing in");
    var accessToken=utils.getAccessToken(req);
    var email=getEmail(req);
    var employeeID="";

    dbConnection.getEmployeeID(email,function (returned){
        employeeID=returned;
        var query="UPDATE employee SET accessToken=\'"+accessToken+"\'WHERE employeeID=\'"+employeeID+"\'";
        dbConnection.connection.query(query,function (error){
            if (!!error) {
                console.log(error);
                console.log("Error with Query")
            } else {
                console.log("It worked?");
                res.redirect('http://localhost:8080/profile/'+employeeID);

            }
        });
    });


}
function startSignUp(ID, req, res) {
    console.log("Start signing up");
    res.cookie('signingUp',true);
    res.cookie('signIn',false)
    employeeID = ID;
    res.redirect('https://github.com/login/oauth/authorize?client_id=20da68725d03aede2ba7');
}

function signUp(req, response) {
    let accessToken=utils.getAccessToken(req);
    // JSON request for issuing identity
    let data1 =
        {
            "participant": "org.example.mynetwork.employee#" + employeeID,
            "userID": "'"+employeeID+"'"
        }
        // Issuing identity which returns network card
    request.postRequestBlob(data1, "http://localhost:3001/api/system/identities/issue", 200).then(res => {
        console.log("Posting network card to wallet");
        networkCard = res.data;
        // Network card is post to multi user REST API. User will interact with the API as its actual user
        request.postFile(networkCard, "http://localhost:3000/api/wallet/import?access_token=" + accessToken, employeeID, 204).then(res => {
            var parameter = employeeID + "@mynetwork";
            parameter = parameter.replace("@", "%40");
            request.postRequestPar("http://localhost:3000/api/wallet/" + parameter + "/setDefault?access_token=" + accessToken, 204).then(walletRes => {
                var query="UPDATE employee SET accessToken=\'"+utils.getAccessToken(req)+"\'WHERE employeeID=\'"+employeeID+"\'";
               //Updating DB with access token
                dbConnection.connection.query(query,function (error){
                    if (!!error) {
                        console.log(error);
                        console.log("Error with Query")
                    } else {
                        console.log("It worked?");
                        response.redirect('http://localhost:8080/profile/'+employeeID);

                    }
                });
            });

        });
    });
}

// Get's email from cookies
function getEmail(req){
    let jsonCookies = cookieParser.JSONCookies(req.cookies);
    let email = jsonCookies.email;
    return email;
}

//Return hash of password
async function hashPassword(password) {
    return passwordHash.generate(password);

}


module.exports = {startSignUp, app, hashPassword};
