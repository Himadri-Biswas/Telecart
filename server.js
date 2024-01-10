//importing all the packages
const express = require('express');
const bcrypt = require('bcrypt')
const path = require('path')
const queryDB = require('./dbcnt')
const fileupload = require('express-fileupload')

//declare static path
let staticPath = path.join(__dirname, 'public')

//inintialize
const app = express();

//middlewares
app.use(express.static(staticPath))
app.use(express.json())
app.use(fileupload())

//routes
//home route
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"))
})

//signup route
app.get('/signup', (req, res) => {
    res.sendFile(path.join(staticPath, 'signup.html'))
})

app.post('/signup', async (req, res) => {
    let { name, email, password, number, tac, seller } = req.body;
    //console.log(name, email, password, number, tac);

    //form validation
    if (name.length < 3) {
        return res.json({ 'alert': 'name must be 3 letters long' })
    } else if (!email.length) {
        return res.json({ 'alert': 'enter your email' })
    } else if (password.length < 8) {
        return res.json({ 'alert': 'password should be at least 8 letters long' })
    } else if (!Number(number) || number.length < 10) {
        return res.json({ 'alert': 'invalid number, please enter valid one' })
    } else if (!tac) {
        return res.json({ 'alert': 'you must agree to our terms and conditions' })
    } else {
        //save user in db
        const sql = `SELECT COUNT(*) FROM USERS WHERE EMAIL=:1`
        const result = await queryDB(sql, [email], false)
        if (result.rows[0][0] != 0) {
            return res.json({ 'alert': 'email already exists' });
        } else {
            let sqlToInsertUserIntoDB = `INSERT INTO USERS (NAME, EMAIL, PASSWORD, PHONE_NUMBER, IS_SELLER) VALUES (:1, :2, :3, :4, :5)`
            await queryDB(sqlToInsertUserIntoDB, [name, email, password, number, seller.toString()], true)
            res.json({
                name,
                email,
                password,
                number,
                seller
            })
        }
    }
})

//login route
app.get('/login', (req, res) => {
    res.sendFile(path.join(staticPath, "login.html"))
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body
    if (!email.length || !password.length) {
        return res.json({ 'alert': 'Fill all the inputs' })
    }

    let sql = `SELECT COUNT(*) FROM USERS WHERE EMAIL=:1`
    console.log("SQL IS NOW.....");
    console.log(sql);

    let result = await queryDB(sql, [email], false)

    console.log("Email from database:", result.rows[0][0]);
    console.log("Email provided during login:", email);

    if (result.rows[0][0] == 0) {
        return res.json({ 'alert': `email doesn't exist` });
    } else {
        sql = `SELECT * FROM USERS WHERE EMAIL=:1`
        result = await queryDB(sql, [email], false)
        console.log(result.rows[0][2]);
        if (result.rows[0][2] === password) {
            return res.json({
                name: result.rows[0][0],
                email: result.rows[0][1],
                seller: result.rows[0][4]
            })
        } else {
            return res.json({ 'alert': 'password is incorrect' })
        }
    }
})

//seller route
app.get('/seller', (req, res) => {
    res.sendFile(path.join(staticPath, 'seller.html'))
})

app.post('/seller', async (req, res) => {
    let { name, about, address, number, tac, legit, email } = req.body;
    if (!name.length || !address.length || !about.length || number.length < 10 || !Number(number)) {
        return res.json({ 'alert': 'some information is invalid' })
    } else if (!tac) {
        return res.json({ 'alert': 'You have to agree to our terms and conditions' })
    } else if (!legit) {
        return res.json({ 'alert': 'You have to put legit information' })
    } else {
        //update users seller status here

        let sqlToUpdateUser = `update USERS
        SET IS_SELLER = :1
        where EMAIL = :2`
        await queryDB(sqlToUpdateUser, ['true', email], true)

        let sqlToInsertSellerIntoDB = `INSERT INTO SELLERS (BUSINESS_NAME, ABOUT, ADDRESS, PHONE_NUMBER, EMAIL) VALUES (:1, :2, :3, :4, :5)`
        await queryDB(sqlToInsertSellerIntoDB, [name, about, address, number, email], true)
        return res.json(true)
    }
})

app.listen(9000, () => {
    console.log('listening on port 9000');
})