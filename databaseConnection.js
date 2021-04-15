var express = require('express');
var app = express();
var mysql = require('mysql');
const passwordHash = require('password-hash');
var cookieParser = require("cookie-parser");


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'employee',
    queueLimit: 0,
    connectionLimit: 0
})

connection.connect((function (error) {
    if (!!error) {
        console.log('Error');
    } else {
        console.log('Connected');
        connection.query('SELECT * FROM employee', function (error, rows, fields) {
                if (!!error) {
                    console.log(error);
                    console.log("Error with Query")
                } else {
                    console.log("It worked?");
                }
            }
        );
    }
}))

function queryReplacer(ID, email, firstName, lastName, password) {
    var sampleSql = 'INSERT INTO employee (employeeID,email, firstName, lastName, password) VALUES (\'employeeID1\',\'email1\', \'firstName1\', \'lastName1\', \'password1\')'
    var insertQuery = sampleSql.replace("email1", email);
    var insertQuery = insertQuery.replace("employeeID1", ID);
    var insertQuery = insertQuery.replace("firstName1", firstName);
    var insertQuery = insertQuery.replace("lastName1", lastName);
    var insertQuery = insertQuery.replace("password1", password);
    return insertQuery;

}

async function doesAccountExist(req, callback) {
    await connection.query('SELECT email,password FROM employee WHERE email="' + req.body.email + '"', function (error, result) {
        console.log(result);
        if (result.length == 0) {
            console.log("Results length equals 0");
            return callback(false);
        } else {
            console.log("Results length equals 1");
            if (!passwordHash.verify(req.body.password, result[0].password)) {
                return callback('INCORRECT_PASSWORD');
            }

            return callback(true);
        }
    });
}

async function doesEmailExist(email, callback) {
    await connection.query('SELECT email,password FROM employee WHERE email="' + email + '"', function (error, result) {
        console.log(result)
        if (result.length == 0) {
            console.log("Email doesn't exist");
            return callback(false);
        } else {
            return callback(true);
        }
    });

}

async function getEmployeeID(email, callback) {
    console.log("Is function?");
    await connection.query('SELECT employeeID FROM employee WHERE email="' + email + '"', function (error, result) {
        return callback(result[0].employeeID);
    });
}

async function checkAccessToken(employeeID, req, res, callback) {
    var accessToken = getAccessToken(req);
    if (employeeID == "" || accessToken == "") {
        return callback(false);
    }
    await connection.query('SELECT accessToken FROM employee WHERE employeeID="' + employeeID + '"', function (error, result) {
        console.log(employeeID);
        console.log("Checked access token");
        console.log(result);
        if (result == "") {
            res.redirect('http://localhost:8080/login');
        } else if (result[0].accessToken == accessToken) {
            return callback(true);
        } else {
            res.redirect('http://localhost:8080/login');
        }
    });
}


function getAccessToken(req) {
    var jsonCookies = cookieParser.JSONCookies(req.cookies);
    var access_token = jsonCookies.access_token;
    access_token = access_token.replace("s:", "");
    access_token = access_token.split('.')[0];
    return access_token;

}


async function replaceIDs(idArray, currentArray, callback) {
    let baseQuery = "SELECT employeeID, firstName, lastName FROM `employee` WHERE";
    for (k = 0; k < idArray.length; k++) {
        if (k == 0) {
            baseQuery = baseQuery + " employeeID=\"" + idArray[k] + "\"";
        } else {
            baseQuery = baseQuery + " OR employeeID=\"" + idArray[k] + "\"";
        }
    }
    console.log("Base query", baseQuery);
    await connection.query(baseQuery, function (error, result) {
        if (result == null) {
            return callback(currentArray);
        }
        let stringArray = JSON.stringify(currentArray);
        for (n = 0; n < result.length; n++) {
            console.log("For loop activated");
            console.log(result[n].employeeID + "name");
            stringArray = stringArray.replace(new RegExp(result[n].employeeID + "name", 'g'), result[n].firstName + " " + result[n].lastName);
        }
        currentArray = JSON.parse(stringArray);
        return callback(currentArray);
    });
}

async function getName(id, callback) {
    let baseQuery = "SELECT employeeID, firstName, lastName FROM `employee` WHERE employeeID=\"" + id + "\"";
    console.log("Base Query " + baseQuery);
    await connection.query(baseQuery, function (error, result) {
        console.log(error);
        if (result == null) {
            return callback(false);
        } else {
            console.log("Name from db " + result[0]);
            return callback(result[0].firstName + " " + result[0].lastName);
        }

    });

}


module.exports = {
    connection,
    queryReplacer,
    doesAccountExist,
    checkAccessToken,
    getEmployeeID,
    replaceIDs,
    doesEmailExist,
    getName
};
