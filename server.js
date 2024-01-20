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

app.get('/users', async (req, res) => {
    try {
        const sql = `SELECT * FROM USERS`;
        const result = await queryDB(sql, [], false);
        console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ error: 'Internal Server Error' })
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

//add product
app.get('/add-product', (req, res) => {
    res.sendFile(path.join(staticPath, 'addProduct.html'))
})

app.get('/add-product/:id', (req, res) => {
    res.sendFile(path.join(staticPath, 'addProduct.html'))
})



//upload link
app.post('/upload', (req, res) => {
    let file = req.files.image;
    let date = new Date();
    //image name
    let imageName = date.getDate() + date.getTime() + file.name;
    //image upload path
    let path = 'public/uploads/' + imageName;

    //create upload
    file.mv(path, (err, result) => {
        if (err) {
            throw err;
        } else {
            res.json(`uploads/${imageName}`)
        }
    })
})


app.post('/add-product', async (req, res) => {
    let { name, shortDes, des, images, actualPrice, discount, stock, tags, tac, email, startDate, discountStayDays, productId } = req.body;

    // Validation
    if (!name.length || shortDes.length > 100 || shortDes.length < 10 || !des.length || !images.length ||
        !actualPrice.length || !discount.length || stock < 20 || !tags.length || !tac || !startDate || !discountStayDays) {
        return res.json({ 'alert': 'Invalid input data. Please check the form fields.' });
    }

    tags = tags.toLowerCase();
    const end_date = calculateEndDate(startDate, discountStayDays);

    if (!productId) {
        productId = `${name.toLowerCase()}-${Math.floor(Math.random() * 5000)}`;

        // Insert into PRODUCTS table
        let sqlToInsertProduct = `INSERT INTO PRODUCTS (PRODUCT_ID, PRODUCT_NAME, PRODUCT_DETAILS, PRICE, STOCK, TAGS, EMAIL, SHORT_DES) VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`;
        await queryDB(sqlToInsertProduct, [productId, name, des, actualPrice, stock, tags, email, shortDes], true);

        // Insert into DISCOUNT table
        let discountId = `${productId}-discount-${Math.floor(Math.random() * 5000)}`;
        let sqlToInsertDiscount = `INSERT INTO DISCOUNT (DISCOUNT_ID, PRODUCT_ID, START_DATE, END_DATE, DISCOUNT_PERCENT, EMAIL) VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), TO_DATE(:4, 'YYYY-MM-DD'), :5, :6)`;
        await queryDB(sqlToInsertDiscount, [discountId, productId, startDate, end_date, discount, email], true);

        // Insert images into IMAGES table
        for (const image of images) {
            let imageId = `${image}-${Math.floor(Math.random() * 5000)}`;
            let sqlToIsertImage = `INSERT INTO IMAGES (IMAGE_ID, IMAGE_URL, PRODUCT_ID) VALUES (:1, :2, :3)`;
            await queryDB(sqlToIsertImage, [imageId, image, productId], true);
        }

        return res.json({ 'product': name });
    } else {
        // Update PRODUCTS table
        let sqlToUpdateProduct = `UPDATE PRODUCTS SET PRODUCT_NAME=:1, PRODUCT_DETAILS=:2, PRICE=:3, STOCK=:4, TAGS=:5, SHORT_DES=:6 WHERE PRODUCT_ID=:7`;
        await queryDB(sqlToUpdateProduct, [name, des, actualPrice, stock, tags, shortDes, productId], true);

        // Update DISCOUNT table
        let sqlToUpdateDiscount = `UPDATE DISCOUNT SET START_DATE=TO_DATE(:1, 'YYYY-MM-DD'), END_DATE=TO_DATE(:2, 'YYYY-MM-DD'), DISCOUNT_PERCENT=:3 WHERE PRODUCT_ID=:4`;
        await queryDB(sqlToUpdateDiscount, [startDate, end_date, discount, productId], true);

        // Delete existing images from IMAGES table
        let sqlToDeleteImagesFirst = `DELETE FROM IMAGES WHERE PRODUCT_ID = :1`;
        await queryDB(sqlToDeleteImagesFirst, [productId], true);

        // Insert new images into IMAGES table
        for (const image of images) {
            let imageId = `${image}-${Math.floor(Math.random() * 5000)}`;
            let sqlToIsertImage = `INSERT INTO IMAGES (IMAGE_ID, IMAGE_URL, PRODUCT_ID) VALUES (:1, :2, :3)`;
            await queryDB(sqlToIsertImage, [imageId, image, productId], true);
        }

        return res.json({ 'product': name });
    }
});

// Function to calculate the end date of the discount
function calculateEndDate(startDate, discountStayDays) {
    const start_date = new Date(startDate);
    const end_date = new Date(start_date);
    end_date.setDate(start_date.getDate() + parseInt(discountStayDays));
    return end_date.toISOString().split('T')[0];
}

app.listen(9000, () => {
    console.log('listening on port 9000');
})