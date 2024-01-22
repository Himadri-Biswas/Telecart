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
    console.log(name, email, password, number, tac);

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


app.post('/get-products', async (req, res) => {
    let { email, productId, tags, manageProducts } = req.body;
    let result;

    if (productId) {
        let sqlToGetProductById = `
            SELECT * FROM PRODUCTS p
            JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
            WHERE p.PRODUCT_ID = :1`;
        result = await queryDB(sqlToGetProductById, [productId], false);
    } else if (email) {
        let sqlToGetProducts = `
            SELECT * FROM PRODUCTS p
            JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
            WHERE p.EMAIL = :1`;
        result = await queryDB(sqlToGetProducts, [email], false);
    } else if (tags) {
        let tagArr = tags.toString().split(',');
        for (let i = 0; i < tagArr.length; i++) {
            let str = `%${tagArr[i].trim().toLowerCase()}%`;
            tagArr[i] = str;
        }
        let sqlToGetProductByTags = `
            SELECT * FROM PRODUCTS p
            JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
            WHERE p.TAGS LIKE :1`;
        for (let i = 2; i <= tagArr.length; i++) {
            sqlToGetProductByTags += ` OR p.TAGS LIKE :${i}`;
        }
        result = await queryDB(sqlToGetProductByTags, [...tagArr], false);
    } else if (manageProducts) {
        result = await queryDB(`
            SELECT * FROM PRODUCTS p
            JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID`, [], false);
    }

    let products = [];
    for (let i = 0; i < result.rows.length; i++) {
        let product = {
            productId: result.rows[i][0],
            name: result.rows[i][1],
            des: result.rows[i][2],
            actualPrice: result.rows[i][7],
            discount: 0, // Default discount to 0

            // Check if the discount is valid based on the current date
            sellPrice: calculateSellPrice(result.rows[i][7], 0),
            stock: result.rows[i][3],
            tags: result.rows[i][4],
            shortDes: result.rows[i][6],
            startDate: result.rows[i][11],
            endDate: result.rows[i][12],
        };

        // Check if the discount is valid based on the current date
        const currentDate = new Date();
        const startDate = new Date(result.rows[i][11]);
        const endDate = new Date(result.rows[i][12]);

        if (startDate <= currentDate && currentDate <= endDate) {
            // If the current date is within the discount period, update the discount
            product.discount = result.rows[i][13];
            // Recalculate the sell price with the updated discount
            product.sellPrice = calculateSellPrice(result.rows[i][7], result.rows[i][13]);
        }
        /*
        else
        {
            
            // If the current date is not within the discount period, delete the discount
            let sqlToDeleteDiscount = `DELETE FROM DISCOUNT WHERE PRODUCT_ID = :1`;
            await queryDB(sqlToDeleteDiscount, [product.productId], true);            
        }
        */

        let sqlToGetImage = `SELECT * FROM IMAGES WHERE PRODUCT_ID = :1`;
        let resultForImages = await queryDB(sqlToGetImage, [product.productId], false);
        let images = [];
        for (let i = 0; i < resultForImages.rows.length; i++) {
            images.push(resultForImages.rows[i][1]);
        }
        product.images = images;
        products.push(product);
    }

    if (products.length === 0) {
        return res.json('no products');
    } else {
        return res.json(products);
    }
});


// Function to calculate the sell price based on discount percentage
function calculateSellPrice(actualPrice, discountPercent) {
    const discountAmount = (actualPrice * discountPercent) / 100;
    return actualPrice - discountAmount;
}

// Route for searching by product name
app.get('/search/name/:productName', async (req, res) => {
    const productName = req.params.productName;
    let str = `%${productName.trim().toLowerCase()}%`;

    let sqlToGetProductByName = `SELECT * FROM PRODUCTS p
                                JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
                                WHERE LOWER(p.PRODUCT_NAME) LIKE :1
                                OR LOWER(p.TAGS) LIKE :1`;

    let sqlResult = await queryDB(sqlToGetProductByName, [str], false);

    let products = [];

    for (let i = 0; i < sqlResult.rows.length; i++) {
        let product = {
            productId: sqlResult.rows[i][0],
            name: sqlResult.rows[i][1],
            des: sqlResult.rows[i][2],
            actualPrice: sqlResult.rows[i][7],
            discount: sqlResult.rows[i][13],
            sellPrice: calculateSellPrice(sqlResult.rows[i][7], sqlResult.rows[i][13]),
            stock: sqlResult.rows[i][3],
            tags: sqlResult.rows[i][4],
            shortDes: sqlResult.rows[i][6],
            startDate: sqlResult.rows[i][11],
            endDate: sqlResult.rows[i][12],
        };

        let sqlToGetImage = `SELECT * FROM IMAGES WHERE PRODUCT_ID = :1`;
        let resultForImages = await queryDB(sqlToGetImage, [product.productId], false);
        let images = [];

        for (let j = 0; j < resultForImages.rows.length; j++) {
            images.push(resultForImages.rows[j][1]);
        }

        product.images = images;
        products.push(product);
    }

    if (products.length === 0) {
        return res.json('no products');
    } else {
        return res.json(products);
    }
});



app.post('/delete-product', async (req, res) => {
    let { productId } = req.body;

    let sql= 'DELETE FROM DISCOUNT WHERE PRODUCT_ID = :1'
    await queryDB(sql, [productId], true);

    sql = `DELETE FROM IMAGES WHERE PRODUCT_ID = :1`
    await queryDB(sql, [productId], true);

    sql = `delete from cart where product_id=:1`
    await queryDB(sql, [productId], true);

    sql = `delete from wishlist where product_id=:1`
    await queryDB(sql, [productId], true);


    sql = `delete from order_product where product_id=:1`
    await queryDB(sql, [productId], true);

    sql = `delete from review where product_id=:1`
    await queryDB(sql, [productId], true);

    sql = `DELETE FROM PRODUCTS WHERE PRODUCT_ID = :1`
    await queryDB(sql, [productId], true);
    //console.log('DELETED SUCCESSFULLY');
    res.json('success')
    
})

app.get('/products/:id', (req, res) => {
    res.sendFile(path.join(staticPath, 'product.html'))
})

app.get('/search/:key', (req, res) => {
    res.sendFile(path.join(staticPath, 'search.html'))
})


app.post('/order', async (req, res) => {

    const { email, add, total_cost, payment } = req.body;

    //check stock of the products
    let sqlToCheckProductStock = `SELECT P.PRODUCT_NAME, P.STOCK, C.ITEM_COUNT, P.PRODUCT_ID
                                    FROM CART C JOIN PRODUCTS P 
                                    on P.PRODUCT_ID = C.PRODUCT_ID
                                    WHERE C.EMAIL=:1`
    let resultForProductStock = await queryDB(sqlToCheckProductStock, [email], false)
    for (let i = 0; i < resultForProductStock.rows.length; i++) {
        let productName = resultForProductStock.rows[i][0];
        let stock = resultForProductStock.rows[i][1];
        let item = resultForProductStock.rows[i][2];
        if (stock == 0) {
            return res.json({ 'warning': `Sorry! This product ${productName} is out of stock!` })
        } else if (stock < item) {
            return res.json({ 'warning': `Sorry! Only ${stock} item/s left of this product ${productName}!` })
        }
    }



    let date = new Date()
    //console.log(email, add, total_cost);
    let sqlToInsertIntoOrders = `INSERT INTO ORDERS VALUES (:1, :2, to_date(:3, :4), :5, :6, :7, :8, :9, :10, :11, :12, :13)`
    let orderId = date.toISOString();
    /*
    let actualDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss'
    */
    let pad = (n) => (n < 10) ? '0' + n : n;

    let actualDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss';
    
    await queryDB(sqlToInsertIntoOrders, [orderId, email, actualDate, dateFormat, total_cost, add.address, add.street, add.city, add.state, add.pincode, add.landmark, 'not assigned', payment], true)

    let sqlToGetCartInfo = `SELECT * FROM CART WHERE EMAIL=:1`
    let result = await queryDB(sqlToGetCartInfo, [email], false)

    let sqlToInsertIntoOrderProduct = `INSERT INTO ORDER_PRODUCT VALUES (:1, :2, :3)`
    for (let i = 0; i < result.rows.length; i++) {
        await queryDB(sqlToInsertIntoOrderProduct, [orderId, result.rows[i][1], result.rows[i][2]], true);
    }

    let sqlToDeleteFromCart = `DELETE FROM CART WHERE EMAIL=:1`
    await queryDB(sqlToDeleteFromCart, [email], true);


    //notification
    let notification_text = `Your order has been successfully placed! Order id: ${orderId}`
    let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
    await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true)

    //stock management
    for (let i = 0; i < resultForProductStock.rows.length; i++) {
        let stock = resultForProductStock.rows[i][1];
        let item = resultForProductStock.rows[i][2];
        let product_id = resultForProductStock.rows[i][3];
        let sqlToReduceStock = `UPDATE PRODUCTS SET STOCK=:1 WHERE PRODUCT_ID=:2`
        await queryDB(sqlToReduceStock, [stock - item, product_id], true);
    }

    return res.json({ 'alert': 'your order is placed', 'payment': `${payment}` })
})




//server listen
app.listen(8080, () => {
    console.log('listening on port 8080');
})