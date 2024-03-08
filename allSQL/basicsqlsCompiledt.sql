-- Selecting the count of users with a specific email address
SELECT COUNT(*) FROM USERS WHERE EMAIL=:1

-- Inserting a new user into the database
INSERT INTO USERS (NAME, EMAIL, PASSWORD, PHONE_NUMBER, IS_SELLER) VALUES (:1, :2, :3, :4, :5)

-- Selecting the count of users with a specific email address
SELECT COUNT(*) FROM USERS WHERE EMAIL=:1

-- Selecting user information based on email
SELECT * FROM USERS WHERE EMAIL=:1

-- Selecting the hashed password of given input to match with the password stored in the database
SELECT ORA_HASH(:1) AS HASHED_PASSWORD FROM DUAL

-- Updating a user to become a seller
UPDATE USERS
SET IS_SELLER = :1
WHERE EMAIL = :2

-- Inserting a new seller into the database
INSERT INTO SELLERS (BUSINESS_NAME, ABOUT, ADDRESS, PHONE_NUMBER, EMAIL) VALUES (:1, :2, :3, :4, :5)

-- Selecting products by product ID
SELECT * FROM PRODUCTS p
JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
WHERE p.PRODUCT_ID = :1

-- Selecting products by seller's email      ...SUBQUERY
SELECT * FROM PRODUCTS p
JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
WHERE p.PRODUCT_ID IN (
    SELECT PRODUCT_ID FROM PRODUCTS
    WHERE EMAIL = :1
)

-- Selecting products by tags
SELECT * FROM PRODUCTS p
JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
WHERE p.TAGS LIKE :1

-- Selecting product by ID
SELECT * FROM PRODUCTS p
JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID

-- Deleting a product
DELETE FROM DISCOUNT WHERE PRODUCT_ID = :1
DELETE FROM IMAGES WHERE PRODUCT_ID = :1
DELETE FROM cart WHERE product_id=:1
DELETE FROM wishlist WHERE product_id=:1
DELETE FROM order_product WHERE product_id=:1
DELETE FROM review WHERE product_id=:1
DELETE FROM PRODUCTS WHERE PRODUCT_ID = :1

-- Selecting products by name or tags      ...SUBQUERY
SELECT * FROM PRODUCTS p
JOIN DISCOUNT d ON p.PRODUCT_ID = d.PRODUCT_ID
WHERE p.PRODUCT_ID IN (
    SELECT PRODUCT_ID FROM PRODUCTS
    WHERE LOWER(PRODUCT_NAME) LIKE :1
    OR LOWER(TAGS) LIKE :1
)

-- Adding a product to cart or wishlist
INSERT INTO CART VALUES(:1, :2, :3)
INSERT INTO NOTIFICATION VALUES (:1, :2, TO_DATE(:3, :4))

-- Modifying cart or wishlist items
UPDATE CART SET ITEM_COUNT=1 WHERE PRODUCT_ID=:1 AND EMAIL=:2
UPDATE WISHLIST SET ITEM_COUNT=1 WHERE PRODUCT_ID=:1 AND EMAIL=:2

-- Selecting cart or wishlist products by user email        JOINED 3 TABLES
SELECT C.EMAIL, C.PRODUCT_ID, C.ITEM_COUNT, 
    P.PRODUCT_NAME, P.PRODUCT_DETAILS, P.PRICE, 
    D.DISCOUNT_PERCENT, P.PRICE * (1 - D.DISCOUNT_PERCENT / 100) AS SELLPRICE,
    P.STOCK, P.TAGS, P.EMAIL, P.SHORT_DES
FROM CART C
JOIN PRODUCTS P ON C.PRODUCT_ID = P.PRODUCT_ID
LEFT OUTER JOIN DISCOUNT D ON P.PRODUCT_ID = D.PRODUCT_ID
WHERE C.EMAIL = :1

-- joined 3 tables
SELECT W.EMAIL, W.PRODUCT_ID, W.ITEM_COUNT,                
    P.PRODUCT_NAME, P.PRODUCT_DETAILS, P.PRICE, 
    D.DISCOUNT_PERCENT, P.PRICE * (1 - D.DISCOUNT_PERCENT / 100) AS SELLPRICE,
    P.STOCK, P.TAGS, P.EMAIL, P.SHORT_DES
FROM WISHLIST W
JOIN PRODUCTS P ON W.PRODUCT_ID = P.PRODUCT_ID
LEFT OUTER JOIN DISCOUNT D ON P.PRODUCT_ID = D.PRODUCT_ID
WHERE W.EMAIL = :1




-- Update the item count in the cart or wishlist
UPDATE CART SET ITEM_COUNT=:1 WHERE EMAIL=:2 AND PRODUCT_ID=:3;

-- Delete an item from the cart or wishlist
DELETE FROM CART WHERE EMAIL=:1 AND PRODUCT_ID=:2;

-- Check product stock in the cart
SELECT P.PRODUCT_NAME, P.STOCK, C.ITEM_COUNT, P.PRODUCT_ID
FROM CART C JOIN PRODUCTS P ON P.PRODUCT_ID = C.PRODUCT_ID
WHERE C.EMAIL=:1;

-- Insert an order into the ORDERS table
INSERT INTO ORDERS VALUES (:1, :2, to_date(:3, :4), :5, :6, :7, :8, :9, :10, :11, :12, :13);

-- Get cart information
SELECT * FROM CART WHERE EMAIL=:1;

-- Insert order products into the ORDER_PRODUCT table
INSERT INTO ORDER_PRODUCT VALUES (:1, :2, :3);

-- Delete items from the cart
DELETE FROM CART WHERE EMAIL=:1;

-- Get notification text
SELECT NOTIFICATION_TEXT FROM NOTIFICATION WHERE EMAIL=:1 ORDER BY "DATE" DESC;

-- Get order information for history
SELECT ORDER_ID, TOTAL_COST, ADDRESS, DELIVERY_STATUS FROM ORDERS WHERE EMAIL=:1 ORDER BY "DATE" DESC;

-- Get reviews of a product
SELECT U.NAME, R.REVIEW_TEXT, R.RATING_STAR
FROM REVIEW R JOIN USERS U ON R.EMAIL = U.EMAIL
WHERE R.PRODUCT_ID=:1 ORDER BY "DATE" DESC;

-- Check if user can give a review
SELECT OP.ORDER_ID
FROM ORDER_PRODUCT OP JOIN ORDERS O ON O.ORDER_ID = OP.ORDER_ID
WHERE OP.PRODUCT_ID=:1 AND O.EMAIL=:2 AND O.DELIVERY_STATUS=:3;

-- Check product stock before adding to cart
SELECT STOCK FROM PRODUCTS WHERE PRODUCT_ID=:1;

-- Admin login validation
SELECT COUNT(*) FROM ADMIN WHERE EMAIL=:1;

-- Retrieve admin data after login
SELECT * FROM ADMIN WHERE EMAIL=:1;

-- Retrieve all products
SELECT * FROM PRODUCTS;

-- Get count of new orders
SELECT COUNT(*) FROM ORDERS WHERE DELIVERY_STATUS='not assigned';

-- Get customer count
SELECT COUNT(*) FROM USERS;

-- Get product count
SELECT COUNT(*) FROM PRODUCTS;

-- Get seller count
SELECT COUNT(*) FROM SELLERS;

-- Retrieve all customers with order and spending information
SELECT * FROM USERS;

-- Retrieve all sellers with product information
SELECT * FROM SELLERS;

-- Retrieve all users who are not sellers, only customers
SELECT * FROM USERS WHERE EMAIL IN (SELECT EMAIL FROM USERS MINUS SELECT EMAIL FROM SELLERS);

-- Retrieve number of users who are not sellers, only customers
SELECT COUNT(*) FROM USERS WHERE EMAIL IN (SELECT EMAIL FROM USERS MINUS SELECT EMAIL FROM SELLERS);

-- Delete a delivery person from the system
DELETE FROM DELIVERY_MEN WHERE DELIVERY_EMAIL=:1;

-- Get orders to assign to delivery
SELECT * FROM ORDERS WHERE DELIVERY_STATUS='not assigned';

-- Cancel an order
DELETE FROM DELIVERY_ORDER WHERE ORDER_ID=:1;

-- Assign an order to a delivery person
INSERT INTO DELIVERY_ORDER VALUES(:1, :2);

-- Add a new delivery person
INSERT INTO DELIVERY_MEN VALUES(:1, :2, :3, :4, :5);

-- Get orders assigned to a delivery person    ...............SUBQUERY
--SELECT * FROM DELIVERY_ORDER JOIN ORDERS O ON O.ORDER_ID = DELIVERY_ORDER.ORDER_ID WHERE DELIVERY_ORDER.DELIVERY_EMAIL=:1 AND O.DELIVERY_STATUS='assigned';
SELECT * FROM ORDERS WHERE ORDER_ID IN (SELECT ORDER_ID FROM DELIVERY_ORDER WHERE DELIVERY_EMAIL=:1) AND DELIVERY_STATUS='assigned' ORDER BY "DATE" DESC;

-- Update delivery status of an order
UPDATE ORDERS SET DELIVERY_STATUS='delivered' WHERE ORDER_ID=:1;
