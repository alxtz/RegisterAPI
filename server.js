// Modules Used
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const colors = require('colors');
const emailCheck = require('rfc822-validate');
const pg = require('pg');


// Bosic APIs
const server = express();

// PSQL APIs
const conString = "postgres://AlxTz@localhost:5432/q8_db";
const client = new pg.Client(conString);
client.connect();


// Server Settings
server.listen(60229)
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({extended: true}))

server.get('/' , (req, res)=>{
    const html = fs.readFileSync('./index.html');
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

    } else {
        console.log('你的email填寫了' + lowCaseEmail);
        console.log('註冊失敗')
        console.log('');
        // res.send('無效的Email，註冊失敗！')
    }

})
