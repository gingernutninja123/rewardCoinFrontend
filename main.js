const express=require("express")
const app=express();
const bodyParser=require("body-parser");
const request=require("./postRequest.js");
const dbConnection=require('./databaseConnection.js')
const signinRoute = require('./signin');
const profileScreen=require('./profileScreen');
const feedCoin=require('./feedCoin');
const giftCoin=require('./giftCoin');
const admin=require('./admin');
const purchasing=require('./purchasing');
const orderHistory=require("./orderhistory");
const coins=require("./coins");
const utils=require("./utils");
const challenge=require("./challenges");
const vendor=require("./vendor");
const pot=require("./pots");
const cookieParser = require("cookie-parser");


app.use(cookieParser());
app.use("/",signinRoute.app);
app.use('/',profileScreen.app);
app.use("/",feedCoin.app);
app.use("/",giftCoin.app);
app.use("/",admin.app);
app.use("/",purchasing.app);
app.use("/",orderHistory.app);
app.use("/",coins.app);
app.use("/",vendor.app);
app.use("/",challenge.app);
app.use("/",pot.app);
app.use("/styles",express.static('styles'));
app.use("/images",express.static('images'));

app.use(bodyParser.urlencoded({extended:true}));

app.get("/coins"),function (req,res){
    res.send("Does this work? I don't know");
}

app.get("/",function (req,res){
    res.send("Hello there");
});

app.get("/login",function (req,res){
    res.render('loginpage.ejs',{"errors":""});
});


const { signInRules,validate} = require('./validator.js');


app.post("/loginNow",signInRules(),async (req,res)=>{
    await validate(req,res,function (validate){
        if(validate){
            res.cookie('signingUp',false);
            res.cookie('signIn',true);
            res.cookie('email',req.body.email);
            res.redirect('https://github.com/login/oauth/authorize?client_id=20da68725d03aede2ba7');
        }
    });

});


app.post("/createAccount",async (req,response)=>{
        if(req.body.teamCode==""){
            let requestBody = JSON.stringify(req.body);
            requestBody = requestBody.replace("}", ", \"errors\":\"Team Code must not be left blank\"}");
            requestBody = JSON.parse(requestBody);
            response.render('teamCode.ejs', requestBody);
        }
        let teamID="";
        // Getting team using the team code provided
        request.getRequest("http://localhost:3001/api/queries/Q2?paramTeamCode="+req.body.teamCode,"").then(async res=> {
            console.log("Team code response", res.data)
            //If no response error will be set
            if (res.data == "") {
                let requestBody = JSON.stringify(req.body);
                requestBody = requestBody.replace("}", ", \"errors\":\"Couldn't find the team code\"}");
                requestBody = JSON.parse(requestBody);
                response.render('teamCode.ejs', requestBody);
            } else {
                teamID = res.data[0].orgID
            }
            // Get organisation hierarchy using the team ID
            await utils.getOrg(teamID, async function (fullJSON) {

                console.log("Full JSON", fullJSON);

                var hashPassword = await signinRoute.hashPassword(req.body.password1);
                var employeeID = new Date().valueOf();
                var data = {
                    "$class": "org.example.mynetwork.employee",
                    "products":[],
                    "employeeId": employeeID,
                    "email": req.body.email,
                    "firstName": req.body.firstName,
                    "lastName": req.body.lastName,
                    "team": teamID,
                    "company": fullJSON.companyID
                }

                //Create employee request
                request.postRequest(data, "http://localhost:3001/api/employee").then(res => {
                    if (res.status == 200) {
                        console.log("Post request sent");
                        if (res.status == 200) {
                            //Employee details stored in employee DB
                            dbConnection.connection.query(dbConnection.queryReplacer(employeeID, req.body.email, req.body.firstName, req.body.lastName, hashPassword), function (error, rows, fields) {
                                    if (!!error) {
                                        console.log(error);
                                        console.log("Error with Query")
                                    } else {
                                        console.log("It worked?");
                                        signinRoute.startSignUp(employeeID, req, response);
                                    }
                                }
                            );
                        }

                    }
                });

            });
        });
});
const {signUpRules,validateSignUp}=require('./validator');
app.post("/teamSelect",signUpRules(),async function (req,res){
    await validateSignUp(req,res,async function(validate){
    console.log(req.body);
    let requestBody=JSON.stringify(req.body);
    requestBody=requestBody.replace("}",", \"errors\":\"\"}");
    console.log(requestBody);
    requestBody=JSON.parse(requestBody);
    console.log(requestBody);
    if(validate){
        res.render('teamCode.ejs',requestBody);
    }


    });
})

app.get("/signup",function (req,res){
    res.render('signup.ejs',{"errors":""});



});



app.listen(8080,function (){
    console.log("Working");
});