var dbConnection = require('./databaseConnection.js')
const {check, validationResult} = require('express-validator')

const signInRules = () => {
    return [
        // username must be an email
        check('email', "Email must be in the correct format").not().isEmpty().withMessage('Email must not be empty'),
        check('email', "Email must be in the correct format").isEmail().withMessage('Email must be in the correct format'),
        // password must be at least 5 chars long
        check('password', "Password must not be empty").notEmpty()
    ]
}

const rewardCoinRules=()=>{
    return [
        check('type',"Type must not be empty").notEmpty(),
        check('description',"Description must not be empty").notEmpty()
    ]
}

const signUpRules=()=>{
    return [
        check('email').not().isEmpty().withMessage('Email must not be empty'),
        check('email',"Email must be in the correct format").isEmail(),
        check('firstName').not().isEmpty().withMessage('First Name must not be empty'),
        check('lastName').not().isEmpty().withMessage('Last Name must not be empty'),
        check('password1').not().isEmpty().withMessage('Password must not be left empty'),
        check('password1').not().isEmpty().withMessage('Password must not be left empty')
    ]
}


const challengeRules=()=>{
    return[
        check('name').not().isEmpty().withMessage('emptyName'),
        check('description').not().isEmpty().withMessage('emptyDescription')
    ]
}

const potRules=()=>{
    return [
        check('name').not().isEmpty().withMessage('emptyName'),
        check('description').not().isEmpty().withMessage('emptyDescription'),
        check('goal').not().isEmpty().withMessage('emptyGoal'),
        check('goal').isInt().withMessage('notIntGoal'),
        check('goal').isInt({gt:0}).withMessage('goalGreaterZero')
    ]
}

async function validatePot(req){
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return errors.array()[0].msg;
    }
    else{
        return "";
    }
}

async function validateChallenge(req){
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return errors.array()[0].msg;
    }
    else{
        return "";
    }
}



async function validateSignUp(req,res,callback){
    const errors=validationResult(req);
    console.log("Validate Request body",req.body);
    dbConnection.doesEmailExist(req.body.email,function (returnedValue){
        if (!errors.isEmpty()) {
            console.log(errors.array()[0].msg);
            res.render('signup.ejs', {errors: errors.array()[0].msg});
        }
        else if(returnedValue==true){
            res.render('signup.ejs', {errors: "Account already exists with this email"});
        }
        else if(req.body.password1!=req.body.password2){
            res.render('signup.ejs', {errors: "Password are not the same"})
        }
        else{
            return callback(true);
        }
    })
}

async function validateTransaction(req,res){
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return errors.array()[0].msg;
    }
    else{
        return "";
    }
}

async function validate(req, res, callback) {
    const errors = validationResult(req)
    //Checks if account exist
    await dbConnection.doesAccountExist(req, function (returnedValue) {
            console.log(returnedValue);
            if (!errors.isEmpty()) {
                console.log(errors.array()[0].msg);
                res.render('loginpage.ejs', {errors: errors.array()[0].msg});
            } else if (!returnedValue) {
                res.render('loginpage.ejs', {errors: "Account does not exist"});
            } else if (returnedValue == 'INCORRECT_PASSWORD') {
                res.render('loginpage.ejs', {errors: "Incorrect Password"});
            } else {
                return callback(true);
            }


        }
    );

}

module.exports = {signInRules, validate,rewardCoinRules,validateTransaction,signUpRules,validateSignUp,challengeRules,validateChallenge,potRules,validatePot}
