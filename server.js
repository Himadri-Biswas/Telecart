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
    res.sendFile(path.join(staticPath, "seller.html"))
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
        WHERE p.PRODUCT_ID IN (
            SELECT PRODUCT_ID FROM PRODUCTS
            WHERE EMAIL = :1
        )
        `;
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
        WHERE p.PRODUCT_ID IN (
            SELECT PRODUCT_ID FROM PRODUCTS
            WHERE TAGS LIKE :1
        )
        `;
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
    WHERE p.PRODUCT_ID IN (
        SELECT PRODUCT_ID FROM PRODUCTS
        WHERE LOWER(PRODUCT_NAME) LIKE :1
        OR LOWER(TAGS) LIKE :1
    )
    `;

    let sqlResult = await queryDB(sqlToGetProductByName, [str], false);

    let products = [];

    for (let i = 0; i < sqlResult.rows.length; i++) {
        let product = {
            productId: sqlResult.rows[i][0],
            name: sqlResult.rows[i][1],
            des: sqlResult.rows[i][2],
            actualPrice: sqlResult.rows[i][7],
            discount: 0,
            sellPrice: calculateSellPrice(sqlResult.rows[i][7], 0),
            stock: sqlResult.rows[i][3],
            tags: sqlResult.rows[i][4],
            shortDes: sqlResult.rows[i][6],
            startDate: sqlResult.rows[i][11],
            endDate: sqlResult.rows[i][12],
        };
        let currentDate = new Date();
        let startDate = new Date(sqlResult.rows[i][11]);
        let endDate = new Date(sqlResult.rows[i][12]);
        if(startDate <= currentDate && currentDate <= endDate){
            product.discount = sqlResult.rows[i][13];
            product.sellPrice = calculateSellPrice(sqlResult.rows[i][7], sqlResult.rows[i][13]);
        }

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

app.get('/cart', (req, res) => {
    res.sendFile(path.join(staticPath, 'cart.html'))
})

app.post('/addtocartorwishlist', async (req, res) => {
    let { productId, type, email } = req.body;
    let date = new Date();
    /*
    let actualDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss'
    */
    let pad = (n) => (n < 10) ? '0' + n : n;

    let actualDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss';
    
    if (type === 'cart') {

        //stock checking
        let sqlToCheckStock = `SELECT STOCK FROM PRODUCTS WHERE PRODUCT_ID=:1`
        let resultForStock = await queryDB(sqlToCheckStock, [productId], false)
        if (resultForStock.rows[0][0] == 0) {
            return res.json({ 'warning': 'Sorry! This product is out of stock!' })
        } else {
            let sqlToCheckCart = `SELECT * FROM CART WHERE PRODUCT_ID=:1 AND EMAIL=:2`
            let result = await queryDB(sqlToCheckCart, [productId, email], false);
            if (result.rows.length === 0) {
                let sqlToInsertToCart = `INSERT INTO CART VALUES(:1, :2, :3)`
                await queryDB(sqlToInsertToCart, [email, productId, 1], true);

                //notification
                let sqlToGetProductName = `SELECT product_name FROM products WHERE product_id=:1`
                let resultForProductName = await queryDB(sqlToGetProductName, [productId], false);
                let notification_text = `${resultForProductName.rows[0][0]} has been added to your cart!`
                let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
                await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true);

                return res.json('Added!')
            } else if (result.rows[0][2] === 0) {
                let sqlToModifyCart = `UPDATE CART SET ITEM_COUNT=1 WHERE PRODUCT_ID=:1 AND EMAIL=:2`
                await queryDB(sqlToModifyCart, [productId, email], true);
                //notification
                let sqlToGetProductName = `SELECT product_name FROM products WHERE product_id=:1`
                let resultForProductName = await queryDB(sqlToGetProductName, [productId], false);
                let notification_text = `${resultForProductName.rows[0][0]} has been added to your cart!`
                let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
                await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true);

                return res.json('Added!')
            }
            else {
                return res.json('Already added!')
            }
        }
    } else if (type === 'wishlist') {
        let sqlToCheckWishlist = `SELECT * FROM WISHLIST WHERE PRODUCT_ID=:1 AND EMAIL=:2`
        let result = await queryDB(sqlToCheckWishlist, [productId, email], false);
        if (result.rows.length === 0) {
            let sqlToInsertToWishlist = `INSERT INTO WISHLIST VALUES(:1, :2, :3)`
            await queryDB(sqlToInsertToWishlist, [email, productId, 1], true);

            //notification
            let sqlToGetProductName = `SELECT product_name FROM products WHERE product_id=:1`
            let resultForProductName = await queryDB(sqlToGetProductName, [productId], false);
            let notification_text = `${resultForProductName.rows[0][0]} has been added to your wishlist!`
            let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
            await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true);

            return res.json('Added!')
        } else if (result.rows[0][2] === 0) {
            let sqlToModifyWishlist = `UPDATE WISHLIST SET ITEM_COUNT=1 WHERE PRODUCT_ID=:1 AND EMAIL=:2`
            await queryDB(sqlToModifyWishlist, [productId, email], true);

            //notification
            let sqlToGetProductName = `SELECT product_name FROM products WHERE product_id=:1`
            let resultForProductName = await queryDB(sqlToGetProductName, [productId], false);
            let notification_text = `${resultForProductName.rows[0][0]} has been added to your wishlist!`
            let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
            await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true);

            return res.json('Added!')
        }
        else {
            return res.json('Already added!')
        }
    }
})

app.post('/getCartOrWishlistProducts', async (req, res) => {
    let { email, type } = req.body;
    if (type === 'cart') {
        let sql = `
            SELECT C.EMAIL, C.PRODUCT_ID, C.ITEM_COUNT, 
                P.PRODUCT_NAME, P.PRODUCT_DETAILS, P.PRICE, 
                D.DISCOUNT_PERCENT, P.PRICE * (1 - D.DISCOUNT_PERCENT / 100) AS SELLPRICE,
                P.STOCK, P.TAGS, P.EMAIL, P.SHORT_DES
            FROM CART C
            JOIN PRODUCTS P ON C.PRODUCT_ID = P.PRODUCT_ID
            LEFT OUTER JOIN DISCOUNT D ON P.PRODUCT_ID = D.PRODUCT_ID
            WHERE C.EMAIL = :1`;
            
        let result = await queryDB(sql, [email], false);
        //console.log(result.rows);
        let products = [];
        for (let i = 0; i < result.rows.length; i++) {
            let product = {
                email: result.rows[i][0],
                productId: result.rows[i][1],
                item: result.rows[i][2],
                name: result.rows[i][3],
                productDetails: result.rows[i][4],
                actualPrice: result.rows[i][5],
                discount: result.rows[i][6],
                sellPrice: result.rows[i][7],
                stock: result.rows[i][8],
                tags: result.rows[i][9],
                email: result.rows[i][10],
                shortDes: result.rows[i][11]
            }
            let sqlToGetImage = `SELECT * FROM IMAGES WHERE PRODUCT_ID = :1`
            let resultForImages = await queryDB(sqlToGetImage, [product.productId], false);
            let images = [];
            for (let i = 0; i < resultForImages.rows.length; i++) {
                images.push(resultForImages.rows[i][1])
            }
            product.image = images[0];
            products.push(product);
        }
        return res.json(products);
    } else if (type === 'wishlist') {
        let sql = `
            SELECT W.EMAIL, W.PRODUCT_ID, W.ITEM_COUNT, 
                P.PRODUCT_NAME, P.PRODUCT_DETAILS, P.PRICE, 
                D.DISCOUNT_PERCENT, P.PRICE * (1 - D.DISCOUNT_PERCENT / 100) AS SELLPRICE,
                P.STOCK, P.TAGS, P.EMAIL, P.SHORT_DES
            FROM WISHLIST W
            JOIN PRODUCTS P ON W.PRODUCT_ID = P.PRODUCT_ID
            LEFT OUTER JOIN DISCOUNT D ON P.PRODUCT_ID = D.PRODUCT_ID
            WHERE W.EMAIL = :1`;
            
        let result = await queryDB(sql, [email], false);
        let products = [];
        for (let i = 0; i < result.rows.length; i++) {
            let product = {
                email: result.rows[i][0],
                productId: result.rows[i][1],
                item: result.rows[i][2],
                name: result.rows[i][3],
                productDetails: result.rows[i][4],
                actualPrice: result.rows[i][5],
                discount: result.rows[i][6],
                sellPrice: result.rows[i][7],
                stock: result.rows[i][8],
                tags: result.rows[i][9],
                email: result.rows[i][10],
                shortDes: result.rows[i][11]
            }
            let sqlToGetImage = `SELECT * FROM IMAGES WHERE PRODUCT_ID = :1`
            let resultForImages = await queryDB(sqlToGetImage, [product.productId], false);
            let images = [];
            for (let i = 0; i < resultForImages.rows.length; i++) {
                images.push(resultForImages.rows[i][1])
            }
            product.image = images[0];
            products.push(product);
        }
        return res.json(products);
    }
})

app.post('/checkProductStock', async (req, res) => {
    let { productId, item } = req.body;
    let sql = `SELECT STOCK FROM PRODUCTS WHERE PRODUCT_ID=:1`
    let result = await queryDB(sql, [productId], false);
    if (result.rows[0][0] == 0) {
        return res.json({ 'warning': 'Sorry! This product is out of stock!' })
    } else if (result.rows[0][0] < item) {
        return res.json({ 'warning': `Sorry! Only ${result.rows[0][0]} item/s left of this product!` })
    } else {
        //reduce stock
        let sqlToReduceStock = `UPDATE PRODUCTS SET STOCK=:1 WHERE PRODUCT_ID=:2`
        await queryDB(sqlToReduceStock, [result.rows[0][0] - item, productId], true);
        return res.json('ok')
    }
})

app.put('/updateCartOrWishlist', async (req, res) => {
    let { type, email, productId, item } = req.body;
    console.log(req.body);
    if (type === 'cart') {
        let sql = `UPDATE CART SET ITEM_COUNT=:1 WHERE EMAIL=:2 AND PRODUCT_ID=:3`
        await queryDB(sql, [item, email, productId], true);
        return res.json(`updated ${productId}`)
    } else {
        let sql = `UPDATE WISHLIST SET ITEM_COUNT=:1 WHERE EMAIL=:2 AND PRODUCT_ID=:3`
        await queryDB(sql, [item, email, productId], true);
        return res.json(`updated ${productId}`)
    }
})

app.delete('/deleteFromCartOrWishlist', async (req, res) => {
    let { type, email, productId } = req.body;
    let date = new Date();
    let pad = (n) => (n < 10) ? '0' + n : n;
    let actualDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss';
    
    if (type === 'cart') {
        let sql = `DELETE FROM CART WHERE EMAIL=:1 AND PRODUCT_ID=:2`
        await queryDB(sql, [email, productId], true);

        //notification
        let sqlToGetProductName = `SELECT product_name FROM products WHERE product_id=:1`
        let resultForProductName = await queryDB(sqlToGetProductName, [productId], false);
        let notification_text = `${resultForProductName.rows[0][0]} has been removed from your cart!`
        let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
        await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true);

        return res.json('deleted');
    } else {
        let sql = `DELETE FROM WISHLIST WHERE EMAIL=:1 AND PRODUCT_ID=:2`
        await queryDB(sql, [email, productId], true);

        //notification
        let sqlToGetProductName = `SELECT product_name FROM products WHERE product_id=:1`
        let resultForProductName = await queryDB(sqlToGetProductName, [productId], false);
        let notification_text = `${resultForProductName.rows[0][0]} has been removed from your wishlist!`
        let sqlToInsertIntoNotification = `INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))`
        await queryDB(sqlToInsertIntoNotification, [notification_text, email, actualDate, dateFormat], true);

        return res.json('deleted');
    }
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

app.get('/bkash-gateway', (req, res) => {
    res.sendFile(path.join(staticPath, 'bkash.html'))
})

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(staticPath, 'checkout.html'))
})


app.post('/notification', async (req, res) => {
    let { email } = req.body;
    let sqlToGetNotification = `SELECT NOTIFICATION_TEXT FROM NOTIFICATION WHERE EMAIL=:1 ORDER BY "DATE" DESC`
    let result = await queryDB(sqlToGetNotification, [email], false);
    let notifications = []
    for (let i = 0; i < result.rows.length; i++) {
        notifications.push(result.rows[i][0])
    }
    return res.json(notifications);
})

app.post('/history', async (req, res) => {
    let { email } = req.body;
    let sqlToGetOrder = `SELECT ORDER_ID, TOTAL_COST, ADDRESS, DELIVERY_STATUS FROM ORDERS WHERE EMAIL=:1 ORDER BY "DATE" DESC`
    let result = await queryDB(sqlToGetOrder, [email], false)

    let orderHistory = [];
    for (let i = 0; i < result.rows.length; i++) {
        let orderId = result.rows[i][0]
        let totalCost = result.rows[i][1]
        let address = result.rows[i][2]
        let deliveryStatus = result.rows[i][3]

        let order = `<b>Order No:</b> ${orderId}<br><b>Total Cost:</b> $${totalCost}<br><b>Products: </b><br>`

        let sqlToGetOrderProduct = `SELECT O.PRODUCT_ID, P.PRODUCT_NAME, O.ITEM_COUNT
        FROM ORDER_PRODUCT O JOIN PRODUCTS P on P.PRODUCT_ID = O.PRODUCT_ID
        WHERE O.ORDER_ID=:1`
        let resultForProducts = await queryDB(sqlToGetOrderProduct, [orderId], false)
        for (let j = 0; j < resultForProducts.rows.length; j++) {
            order += `<b>Product Name:</b> ${resultForProducts.rows[j][1]} <b>Quantity:</b> ${resultForProducts.rows[j][2]}<br>`
        }
        order += `<b>Address:</b> ${address}<br><b>Delivery status:</b> ${deliveryStatus}`
        orderHistory.push(order)
    }

    return res.json(orderHistory);
})


app.post('/getReviews', async (req, res) => {
    let { productId } = req.body;
    let reviews = [];
    let sqlToGetReview = `SELECT U.NAME, R.REVIEW_TEXT, R.RATING_STAR
    FROM REVIEW R JOIN USERS U on R.EMAIL = U.EMAIL
    WHERE R.PRODUCT_ID=:1 ORDER BY "DATE" DESC`
    let resultForReview = await queryDB(sqlToGetReview, [productId], false);
    for (let i = 0; i < resultForReview.rows.length; i++) {
        let review = {
            userName: resultForReview.rows[i][0],
            reviewText: resultForReview.rows[i][1],
            star: resultForReview.rows[i][2]
        }
        reviews.push(review)
    }
    return res.json(reviews);
})

app.post('/checkIfTheUserCanGiveReview', async (req, res) => {
    let { productId, email, star, reviewText } = req.body;
    let sqlToCheck = `SELECT OP.ORDER_ID
    from ORDER_PRODUCT OP JOIN ORDERS O on O.ORDER_ID = OP.ORDER_ID
    WHERE OP.PRODUCT_ID=:1 AND O.EMAIL=:2 AND O.DELIVERY_STATUS=:3`
    let resultToCheck = await queryDB(sqlToCheck, [productId, email, 'delivered'], false);
    if (resultToCheck.rows.length < 1) {
        return res.json({ 'alert': 'You have to buy the product to give a review' })
    } else {
        let date = new Date();
        /*
        let actualDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        let dateFormat = 'yyyy/mm/dd hh24:mi:ss'
        */
        let pad = (n) => (n < 10) ? '0' + n : n;

        let actualDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        let dateFormat = 'yyyy/mm/dd hh24:mi:ss';
        let sqlToInsertIntoReview = `INSERT INTO REVIEW VALUES (:1, :2, :3, :4, TO_DATE(:5, :6))`
        await queryDB(sqlToInsertIntoReview, [email, productId, reviewText, star, actualDate, dateFormat], true);
        return res.json('success');
    }
})

app.post('/checkProductStock', async (req, res) => {
    let { productId, item } = req.body;
    let sqlToCheckStock = `SELECT STOCK FROM PRODUCTS WHERE PRODUCT_ID=:1`
    let result = await queryDB(sqlToCheckStock, [productId], false);
    if (result.rows[0][0] == 0) {
        return res.json({ 'warning': `Sorry! This product is out of stock!` })
    } else if (result.rows[0][0] < item) {
        return res.json({ 'warning': `Sorry! Only ${result.rows[0][0]} items left of this product!` })
    } else {
        return res.json('success');
    }
})

app.get('/admin', (req, res) => {
    res.sendFile(path.join(staticPath, 'admin.html'))
})

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(staticPath, 'adminLogin.html'))
})

app.post('/admin-login', async (req, res) => {
    let { email, password } = req.body
    if (!email.length || !password.length) {
        return res.json({ 'alert': 'Fill all the inputs' })
    }

    let sql = `SELECT COUNT(*) FROM ADMIN WHERE EMAIL=:1`
    let result = await queryDB(sql, [email], false)
    if (result.rows[0][0] == 0) {
        return res.json({ 'alert': `email doesn't exist` });
    } else {
        sql = `SELECT * FROM ADMIN WHERE EMAIL=:1`
        result = await queryDB(sql, [email], false)
        console.log(result.rows[0][2]);
        if (result.rows[0][2] === password) {
            return res.json({
                name: result.rows[0][0],
                email: result.rows[0][1]
            })
        } else {
            return res.json({ 'alert': 'password is incorrect' })
        }
    }
})

app.get('/manage-customers', (req, res) => {
    res.sendFile(path.join(staticPath, 'manageCustomers.html'))
})

app.get('/manage-only-customers', (req, res) => {
    res.sendFile(path.join(staticPath, 'manageOnlyCustomers.html'))
})

app.get('/manage-orders', (req, res) => {
    res.sendFile(path.join(staticPath, 'manageOrders.html'))
})

app.get('/manage-products', (req, res) => {
    res.sendFile(path.join(staticPath, 'manageProducts.html'))
})

app.get('/manage-sellers', (req, res) => {
    res.sendFile(path.join(staticPath, 'manageSellers.html'))
})

app.get('/manage-delivery', (req, res) => {
    res.sendFile(path.join(staticPath, 'manageDelivery.html'))
})

app.get('/add-new-admin', (req, res) => {
    res.sendFile(path.join(staticPath, 'addNewAdmin.html'))
})

app.post('/get-all-products', async (req, res) => {
    let result = await queryDB(`select * from PRODUCTS;`, [], false);

})

app.post('/new-order', async (req, res) => {
    let result = await queryDB(`SELECT count(*) from orders where delivery_status='not assigned'`, [], false)
    return res.json(result.rows[0][0]);
})

app.post('/customer-num', async (req, res) => {
    let result = await queryDB(`SELECT count(*) from users`, [], false)
    return res.json(result.rows[0][0]);
})

app.post('/product-num', async (req, res) => {
    let result = await queryDB(`SELECT count(*) from products`, [], false)
    return res.json(result.rows[0][0]);
})

app.post('/seller-num', async (req, res) => {
    let result = await queryDB(`SELECT count(*) from sellers`, [], false)
    return res.json(result.rows[0][0]);
})

app.post('/delivery-num', async (req, res) => {
    let result = await queryDB(`SELECT count(*) from delivery_men`, [], false)
    return res.json(result.rows[0][0]);
})

app.post('/only-customer-num', async (req, res) => {
    let result = await queryDB(`SELECT COUNT(*) FROM USERS WHERE EMAIL IN (SELECT EMAIL FROM USERS MINUS SELECT EMAIL FROM SELLERS)`, [], false)
    return res.json(result.rows[0][0]);
})


app.post('/getCustomers', async (req, res) => {
    let result = await queryDB(`SELECT * FROM USERS`, [], false)
    let customers = []
    for (let i = 0; i < result.rows.length; i++) {
        let customer = {
            name: result.rows[i][0],
            email: result.rows[i][1],
            phone: result.rows[i][3],
            seller: result.rows[i][4]
        }
        let sqlForOrder = `SELECT * FROM ORDERS WHERE EMAIL=:1`
        let resultForOrder = await queryDB(sqlForOrder, [customer.email], false)
        customer.totalOrder = resultForOrder.rows.length
        customer.totalSpent = 0;
        for (let j = 0; j < resultForOrder.rows.length; j++) {
            customer.totalSpent += resultForOrder.rows[j][3]
        }
        customers.push(customer)
    }
    return res.json(customers)
})

app.post('/getOnlyCustomers', async (req, res) => {
    let result = await queryDB(`SELECT * FROM USERS WHERE EMAIL IN (SELECT EMAIL FROM USERS MINUS SELECT EMAIL FROM SELLERS)`, [], false)
    //console.log(result.rows);
    let customers = []
    for (let i = 0; i < result.rows.length; i++) {
        let customer = {
            name: result.rows[i][0],
            email: result.rows[i][1],
            phone: result.rows[i][3],
            seller: result.rows[i][4]
        }
        let sqlForOrder = `SELECT * FROM ORDERS WHERE EMAIL=:1`
        let resultForOrder = await queryDB(sqlForOrder, [customer.email], false)
        customer.totalOrder = resultForOrder.rows.length
        customer.totalSpent = 0;
        for (let j = 0; j < resultForOrder.rows.length; j++) {
            customer.totalSpent += resultForOrder.rows[j][3]
        }
        customers.push(customer)
    }
    return res.json(customers)
})


app.post('/getSellers', async (req, res) => {
    let result = await queryDB(`SELECT * FROM SELLERS`, [], false)
    let sellers = []
    for (let i = 0; i < result.rows.length; i++) {
        let seller = {
            name: result.rows[i][0],
            address: result.rows[i][2],
            phone: result.rows[i][3],
            email: result.rows[i][4]
        }
        let sqlForProducts = `SELECT * FROM products WHERE EMAIL=:1`
        let resultForProducts = await queryDB(sqlForProducts, [seller.email], false)
        seller.totalProducts = resultForProducts.rows.length
        /*
        seller.totalPrice = 0;
        for (let j = 0; j < resultForProducts.rows.length; j++) {
            seller.totalPrice += resultForProducts.rows[j][5];
        }
        */
        sellers.push(seller)
    }
    return res.json(sellers)
})

/*
app.post('/addAdmin', async (req, res) => {
    let { name, address, email, phone, password } = req.body;
    await queryDB(`INSERT INTO ADMIN VALUES (:1, :2, :3, :4, :5)`, [name, email, password, address, phone], true);
    return res.json('success')
})
*/

app.get('/bkash-gateway', (req, res) => {
    res.sendFile(path.join(staticPath, 'bkash.html'))
})

app.post('/getDeliverySystem', async (req, res) => {
    let result = await queryDB(`SELECT * FROM DELIVERY_MEN`, [], false);
    let delivery_system = []
    for (let i = 0; i < result.rows.length; i++) {
        let delivery = {
            name: result.rows[i][0],
            email: result.rows[i][1],
            phone: result.rows[i][3],
            area: result.rows[i][4]
        }
        delivery_system.push(delivery);
    }
    return res.json(delivery_system);
})

app.post('/deleteDelivery', async (req, res) => {
    let { email } = req.body;

    // USED 1 trigger and 1 function for changing delivery status to 'not assigned' after deleting delivery
    // and to delete all recoreds with that delivery email from delivery_order table


    // let sqlToGetDeliveryOrder = `SELECT * FROM DELIVERY_ORDER WHERE DELIVERY_EMAIL=:1`
    // let result = await queryDB(sqlToGetDeliveryOrder, [email], false)
    // for (let i = 0; i < result.rows.length; i++) {
    //     let orderId = result.rows[i][1];
    //     let resultForOrder = await queryDB(`update orders set delivery_status='not assigned' where order_id=:1 and delivery_status='assigned'`, [orderId], true)
    // }

    //await queryDB(`delete from delivery_order where delivery_email=:1`, [email], true);
    await queryDB(`delete from delivery_men where delivery_email=:1`, [email], true);
    return res.json('success');
})

app.post('/get-orders', async (req, res) => {
    let result = await queryDB(`SELECT * FROM ORDERS where delivery_status='not assigned' order by "DATE" DESC`, [], false);
    let orders = []
    for (let i = 0; i < result.rows.length; i++) {
        let order = {
            orderId: result.rows[i][0],
            email: result.rows[i][1],
            date: result.rows[i][2],
            totalCost: result.rows[i][3],
            address: result.rows[i][4],
            street: result.rows[i][5],
            city: result.rows[i][6],
            state: result.rows[i][7],
            pincode: result.rows[i][8],
            landmark: result.rows[i][9],
            deliveryStatus: result.rows[i][10],
            payment: result.rows[i][11]
        }
        orders.push(order);
    }
    return res.json(orders);
})

app.post('/cancelOrder', async (req, res) => {
    let { orderId, email } = req.body;
    let date = new Date();
    /*
    let actualDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss'
    */
    let pad = (n) => (n < 10) ? '0' + n : n;

    let actualDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss';
    await queryDB(`delete from delivery_order where order_id=:1`, [orderId], true);
    await queryDB(`insert into notification values(:1, :2, to_date(:3, :4))`, [`Your order ${orderId} has been cancelled`, email, actualDate, dateFormat], true);

    // USED 1 trigger and 1 function for stock management(increasing stock after order cancellation)

    // let result = await queryDB(`SELECT * FROM ORDER_PRODUCT WHERE ORDER_ID=:1`, [orderId], false)
    // for (let i = 0; i < result.rows.length; i++) {
    //     let item = result.rows[i][2]
    //     let product_id = result.rows[i][1]
    //     let resultForStock = await queryDB(`select stock from products where product_id=:1`, [product_id], false)
    //     let stock = resultForStock.rows[0][0];
    //     await queryDB(`update products set stock=:1 where product_id=:2`, [stock + item, product_id], true);
    // }

    await queryDB(`delete from order_product where order_id=:1`, [orderId], true);
    await queryDB(`delete from orders where order_id=:1`, [orderId], true);

    return res.json('success');
})

app.post('/assignOrderToDelivery', async (req, res) => {
    let { orderId, delivery } = req.body;
    let resultForEmail = await queryDB(`select delivery_email from delivery_men where delivery_name=:1`, [delivery], false)
    let email = resultForEmail.rows[0][0]
    await queryDB(`insert into delivery_order values(:1, :2)`, [email, orderId], true);

    //USED 1 procedure and 1 trigger to change delivery status to 'assigned' after assigning delivery
    //await queryDB(`update orders set delivery_status='assigned' where order_id=:1`, [orderId], true);
    return res.json('success');
})

app.get('/add-delivery', (req, res) => {
    res.sendFile(path.join(staticPath, 'addDelivery.html'))
})

app.post('/add-delivery', async (req, res) => {
    let { name, email, phone, password, area } = req.body;
    await queryDB(`insert into delivery_men values(:1, :2, :3, :4, :5)`, [name, email, password, phone, area], true);
    return res.json('success');
})

app.get('/delivery', (req, res) => {
    res.sendFile(path.join(staticPath, 'delivery.html'))
})
app.get('/delivery-login', (req, res) => {
    res.sendFile(path.join(staticPath, 'deliveryLogin.html'))
})


app.post('/delivery-login', async (req, res) => {
    let { email, password } = req.body;
    if (!email.length || !password.length) {
        return res.json({ 'alert': 'Fill all the inputs' })
    }

    let sql = `SELECT COUNT(*) FROM delivery_men WHERE DELIVERY_EMAIL=:1`
    let result = await queryDB(sql, [email], false)
    if (result.rows[0][0] == 0) {
        return res.json({ 'alert': `email doesn't exist` });
    } else {
        sql = `SELECT * FROM delivery_men WHERE DELIVERY_EMAIL=:1`
        result = await queryDB(sql, [email], false)
        if (result.rows[0][2] === password) {
            return res.json({
                name: result.rows[0][0],
                email: result.rows[0][1]
            })
        } else {
            return res.json({ 'alert': 'password is incorrect' })
        }
    }
})

app.post('/getOrderByDeliveryEmail', async (req, res) => {
    let { email } = req.body;
    //let result = await queryDB(`select * from DELIVERY_ORDER join ORDERS O on O.ORDER_ID = DELIVERY_ORDER.ORDER_ID where DELIVERY_ORDER.DELIVERY_EMAIL=:1 and O.DELIVERY_STATUS='assigned'`, [email], false)
    
    /*
    let result = await queryDB(
     `    SELECT * 
        FROM DELIVERY_ORDER 
    WHERE DELIVERY_ORDER.ORDER_ID IN (
    SELECT ORDER_ID 
    FROM ORDERS  
    WHERE DELIVERY_STATUS = 'assigned'
    )
    AND 
    DELIVERY_EMAIL = :1
    ;    `
    )
    */

    let sql= `SELECT * FROM ORDERS WHERE ORDER_ID IN (SELECT ORDER_ID FROM DELIVERY_ORDER WHERE DELIVERY_EMAIL=:1) AND DELIVERY_STATUS='assigned' ORDER BY "DATE" DESC`;
    let result = await queryDB(sql, [email], false);
    let orders = []
    for (let i = 0; i < result.rows.length; i++) {
        let order = {
            /*
            deliveryEmail: result.rows[i][0],
            orderId: result.rows[i][1],
            userEmail: result.rows[i][3],
            totalCost: result.rows[i][5],
            address: result.rows[i][6],
            street: result.rows[i][7],
            city: result.rows[i][8],
            state: result.rows[i][9],
            pincode: result.rows[i][10],
            landmark: result.rows[i][11],
            deliveryStatus: result.rows[i][12],
            payment: result.rows[i][13]
            */
            orderId: result.rows[i][0],
            userEmail: result.rows[i][1],
            date: result.rows[i][2],
            totalCost: result.rows[i][3],
            address: result.rows[i][4],
            street: result.rows[i][5],
            city: result.rows[i][6],
            state: result.rows[i][7],
            pincode: result.rows[i][8],
            landmark: result.rows[i][9],
            deliveryStatus: result.rows[i][10],
            payment: result.rows[i][11]
        }
        orders.push(order)
    }
    return res.json(orders);
})


app.post('/updateDeliveryStatus', async (req, res) => {
    let { orderId, customerEmail } = req.body;

    let date = new Date();

    // let actualDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    // let dateFormat = 'yyyy/mm/dd hh24:mi:ss'


    let pad = (n) => (n < 10) ? '0' + n : n;

    let actualDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    let dateFormat = 'yyyy/mm/dd hh24:mi:ss';

    //console.log(orderId, customerEmail)
    await queryDB(`update orders set delivery_status='delivered' where order_id=:1`, [orderId], true);
    await queryDB(`insert into notification values (:1, :2, to_date(:3, :4))`, [`Your order ${orderId} has been delivered! Please give review on the puchased products. Thank you!`, customerEmail, actualDate, dateFormat], true);
    return res.json('success')
})

//after trigger...ekhono implement kora hoi nai
/*
app.post('/updateDeliveryStatus', async (req, res) => {
    let { orderId, customerEmail } = req.body;

    try {
        // Update the delivery status
        await queryDB(`update orders set delivery_status='delivered' where order_id=:1`, [orderId], true);

        // The trigger will automatically call the procedure to send the delivery notification,
        // so we don't need to call it explicitly here

        return res.json('success');
    } catch (error) {
        console.error('Error updating delivery status:', error);
        return res.status(500).json({ 'error': 'An error occurred while updating delivery status' });
    }
});
*/

//404 route
app.get('/404', (req, res) => {
    res.sendFile(path.join(staticPath, '404.html'))
})
app.use((req, res) => {
    res.redirect('/404')
})


//server listen
app.listen(8080, () => {
    console.log('listening on port 8080');
})

