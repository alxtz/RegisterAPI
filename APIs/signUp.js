// Modules Used
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const colors = require('colors');
const emailCheck = require('rfc822-validate');
const pg = require('pg');
const jwt = require('jsonwebtoken');
const cookie = require('cookie')


// Bosic APIs
// Basic APIs
const server = express();

// PSQL APIs
const conString = "postgres://AlxTz@localhost:5432/q8_db";
const client = new pg.Client(conString);
client.connect();

const psqlDB = new pg.Client(conString);
psqlDB.connect();

// Server Settings
server.listen(60229)
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({extended: true}))
// server.use("/lib/" , express.static(path.resolve(__dirname + './public')));
server.use(express.static('public'));


// GET Handlers
server.get('/' , (req, res)=>{
    const html = fs.readFileSync('./index.html');
    if(req.headers.cookie){
        const reqCookies = cookie.parse(req.headers.cookie)
        const loginToken = reqCookies.loginToken
        // console.log(loginToken);
        jwt.verify(loginToken, 'secret', (err, decoded)=>{
            if(!err){
                console.log(decoded);
                const html = fs.readFileSync('./pages/index_login.html');
                res.setHeader('Content-Type', 'text/html');
                res.send(html)
            } else {
                console.log('The token is fake !');
                const html = fs.readFileSync('./pages/index.html');
                res.setHeader('Content-Type', 'text/html');
                res.send(html)
            }
        })
    } else {
        console.log('No token , No login');
        const html = fs.readFileSync('./pages/index.html');
        res.setHeader('Content-Type', 'text/html');
        res.send(html)
    }
})

server.get('/signUp/' , (req, res)=>{
    const html = fs.readFileSync('./pages/signUp.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(html)
})

server.post('/' , (req, res)=>{

    const lowCaseEmail = req.body.email.toLowerCase();

    // If the email is correct
    if (emailCheck(lowCaseEmail)) {

        const sameEmailQuery =
            client.query(`SELECT * FROM members WHERE email='${lowCaseEmail}'`, [] , (err, result)=>{
                console.log(result.rowCount);
                if(result.rowCount > 0){
                    console.log('抱歉，該email已經有人使用');
                    console.log('');
                } else {
                    const rawPassword = req.body.password;
                    const hashedPs = bcrypt.hash(rawPassword , 10 , (err , hash)=>{
                        console.log(req.body);
                        console.log('the hashed password is ' + hash.red);
                        console.log('註冊成功');
                        console.log('');
                        // res.send('註冊成功！')

                        const query =
                            client.query(`INSERT INTO members(email, password) VALUES('${lowCaseEmail}','${hash}')`)
                    })
                }
            })
server.get('/signIn/' , (req, res)=>{
    const html = fs.readFileSync('./pages/signIn.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(html)
})

server.get('/registerOK/' , (req, res)=>{
    const html = fs.readFileSync('./pages/registerOK.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(html)
})

// POST Handlers
server.post('/signUp/' , (req, res)=>{
    console.log(JSON.stringify(req.headers, null, 4));
    console.log(JSON.stringify(req.body, null, 4))

    const emailLow = req.body.email.toLowerCase();
    const isValidEmail = emailCheck(emailLow)

    if(isValidEmail) {

        const queryStr = `SELECT * FROM members WHERE email='${emailLow}'`

        psqlDB.query(queryStr, [], (err, result) => {
            const sameEmail = result.rowCount;
            if (sameEmail == 0) {
                const username = req.body.username;
                const pwRaw = req.body.password;
                const hashedPw = bcrypt.hash(pwRaw, 10, (err, hash) => {
                    console.log('the hashed password is ' + hash.red);
                    console.log('註冊成功');
                    const insertStr = `INSERT INTO members(email,password,username) VALUES('${emailLow}','${hash}','${username}')`
                    psqlDB.query(insertStr)
                    res.redirect('/registerOK/')
                })
            } else {
                console.log('抱歉，該 email 已經註冊過了。');
            }
        })

    } else {
        console.log('你的email填寫了' + lowCaseEmail);
        console.log('註冊失敗')
        console.log('');
        // res.send('無效的Email，註冊失敗！')
        console.log(emailLow, 'is inValid.');
    }
})

server.post('/login/' , (req, res)=>{
    console.log(JSON.stringify(req.headers, null, 4));
    console.log(JSON.stringify(req.body, null, 4))

    const emailLow = req.body.email.toLowerCase();
    const isValidEmail = emailCheck(emailLow)

    if(isValidEmail) {

        const queryStr = `SELECT * FROM members WHERE email='${emailLow}'`

        psqlDB.query(queryStr, [], (err, result) => {
            const sameEmail = result.rowCount;
            if (sameEmail == 1) {
                const inputPw = req.body.password
                const hashedPw = result.rows[0].password
                bcrypt.compare(inputPw, hashedPw, (err, cptRes) => {
                    if(cptRes==true){
                        console.log('成功登入！');

                        // Create a JWT
                        const token = jwt.sign({
                            name: result.rows[0].username,
                            email: result.rows[0].email
                        },'secret')

                        console.log('JWT為', token);

                        res.json({
                            success: true,
                            message: 'Enjoy Your Token !',
                            token: token,
                            name: result.rows[0].username,
                            email: result.rows[0].email,
                        })

                    } else {
                        console.log('你的帳號或密碼不正確！');
                    }
                })
            } else {
                console.log('抱歉，帳號不存在。');
            }
        })

    } else {
        console.log('你輸入的帳號不符格式。');
    }
})
