--Function to hash the user password usin gORA_HASH to store in the user table.
-- A trigger is created to call this function before inserting a new user into the database
 
CREATE OR REPLACE FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2
IS
    v_hashed_password VARCHAR2(100);
		temp NUMBER;
BEGIN
		SELECT ORA_HASH(p_password) into temp FROM DUAL;
    v_hashed_password := TO_CHAR(temp);
    RETURN v_hashed_password;
END hash_password;
/

CREATE OR REPLACE TRIGGER hash_password_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    :NEW.password := hash_password(:NEW.password);
END;
/



-- Decreases the stock of the product when an order is placed
-- This is an independent trigger that is called when an order is placed

CREATE OR REPLACE TRIGGER update_product_stock
before INSERT ON ORDER_PRODUCT
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock = stock - :NEW.item_count
    WHERE product_id = :NEW.product_id;
END;
/



--this procedure sends a notification to the customer when an order is placed
--1 trigger is fired to call this procedure when an order is placed

CREATE OR REPLACE PROCEDURE send_order_confirmation_notification(
    order_id IN VARCHAR2,
    customer_email IN VARCHAR2,
    order_date IN DATE
)
AS
    notification_text VARCHAR2(1000);
    actual_date VARCHAR2(20);
BEGIN
    notification_text := 'Your order ' || order_id || ' has been successfully placed!';
    actual_date := TO_CHAR(order_date, 'yyyy-mm-dd hh24:mi:ss');
    INSERT INTO notification VALUES (notification_text, customer_email, TO_DATE(actual_date, 'yyyy-mm-dd hh24:mi:ss'));
END;
/

CREATE OR REPLACE TRIGGER notify_order_placement
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    send_order_confirmation_notification(:NEW.order_id, :NEW.email, :NEW.DATE);
END;
/



-- Function to increase the stock count again after the order is cancelled
-- 1 trigger is fired to call this function when an order is cancelled

CREATE OR REPLACE FUNCTION increase_stock_after_cancel(p_product_id IN VARCHAR2, p_item_count IN NUMBER)
RETURN VARCHAR2
AS
BEGIN
    UPDATE products
    SET stock = stock + p_item_count
    WHERE product_id = p_product_id;
    
    RETURN NULL;
END;
/


CREATE OR REPLACE TRIGGER cancel_order_tr
AFTER DELETE ON ORDER_PRODUCT
FOR EACH ROW
DECLARE
	ret VARCHAR2(100);
BEGIN
	ret:=increase_stock_after_cancel(:OLD.product_id, :OLD.item_count);	
END;
/



--This procedure sets the delivery status of an order to 'assigned' when admin assigns it to a delivery man
--1 trigger is fired to call this procedure
CREATE OR REPLACE PROCEDURE assign_order_to_delivery_procedure(p_order_id IN VARCHAR2)
AS
BEGIN
    UPDATE orders
    SET delivery_status = 'assigned'
    WHERE order_id = p_order_id;
END;
/

CREATE OR REPLACE TRIGGER assign_order_to_delivery_trigger
AFTER INSERT ON delivery_order
FOR EACH ROW
BEGIN
    assign_order_to_delivery_procedure(:NEW.order_id);
END;
/



-- This function sets the delivery status of every order to 'not assigned' that were assigned to a delivery man 
--and deletes the delivery_order records when a delivery man is deleted by the admin
--1 trigger is fired to call this function

CREATE OR REPLACE FUNCTION delete_delivery_function(p_email IN VARCHAR2)
RETURN VARCHAR2
AS
BEGIN
    -- Update delivery statuses to 'not assigned' for all orders that were assigned to that delivery-man
    FOR rec IN (SELECT * FROM delivery_order WHERE delivery_email = p_email)
    LOOP
        UPDATE orders
        SET delivery_status = 'not assigned'
        WHERE order_id = rec.order_id;
    END LOOP;
    -- Delete the delivery_order records for that delivery-man
		DELETE FROM DELIVERY_ORDER
		WHERE DELIVERY_EMAIL=p_email;
    RETURN 'success';
END;
/


CREATE OR REPLACE TRIGGER delete_delivery_trigger
BEFORE DELETE ON delivery_men
FOR EACH ROW
DECLARE
	ret varchar2(100);
BEGIN
    ret:=delete_delivery_function(:OLD.delivery_email);
END;
/


-- This procedure sends a notification to the customer when an item is removed from the cart or wishlist
-- 2 triggers are created to call for this procedure when an item is removed from the cart or wishlist

CREATE OR REPLACE PROCEDURE send_item_removed_notification(
    p_product_id IN VARCHAR2,
    p_email IN VARCHAR2,
    p_notification_text IN VARCHAR2,
    p_actual_date IN DATE
)
AS
	actual_date VARCHAR2(20);
BEGIN
    
	actual_date := TO_CHAR(p_actual_date, 'yyyy-mm-dd hh24:mi:ss');
	INSERT INTO notification VALUES (p_notification_text, p_email, TO_DATE(actual_date, 'yyyy-mm-dd hh24:mi:ss'));
END;
/


CREATE OR REPLACE TRIGGER notify_cart_item_removed
AFTER DELETE ON cart
FOR EACH ROW
BEGIN
    DECLARE
        v_product_name VARCHAR2(100);
    BEGIN
        SELECT product_name INTO v_product_name
        FROM products
        WHERE product_id = :OLD.product_id;

        send_item_removed_notification(
            :OLD.product_id,
            :OLD.email,
            v_product_name || ' has been removed from your cart!',
            SYSDATE
        );
    END;
END;


CREATE OR REPLACE TRIGGER notify_wishlist_item_removed
AFTER DELETE ON wishlist
FOR EACH ROW
BEGIN
    DECLARE
        v_product_name VARCHAR2(100);
    BEGIN
        SELECT product_name INTO v_product_name
        FROM products
        WHERE product_id = :OLD.product_id;

        send_item_removed_notification(
            :OLD.product_id,
            :OLD.email,
            v_product_name || ' has been removed from your wishlist!',
            SYSDATE
        );
    END;
END;
/



--Inserting 1000 data


DECLARE
    v_product_id VARCHAR2(1000);
    v_name VARCHAR2(1000);
    v_email VARCHAR2(1000);
    v_short_des VARCHAR2(1000);
    v_des VARCHAR2(2000);
    v_actual_price NUMBER;
    v_stock NUMBER;
    v_tags VARCHAR2(1000);
    v_tac VARCHAR2(1000);
    v_start_date DATE;
    v_discount_stay_days NUMBER;
    v_discount_percent NUMBER;
    v_image_url VARCHAR2(1000);
BEGIN
    FOR i IN 2..20 LOOP
        v_product_id := 'PID' || i;
        v_name := 'Sample Product' || i;
        v_email := 'seller' || MOD(i,10) || '@gmail.com';
        v_short_des := 'Sample Short Description' || i;
        v_des := 'This is a sample product description' || i;
        v_actual_price := ROUND(DBMS_RANDOM.VALUE(10, 1000), 2);
        v_stock := ROUND(DBMS_RANDOM.VALUE(10, 100), 0);
        v_tags := 'sample,test,demo';
        v_tac := 'Sample Terms and Conditions';
        v_start_date := TO_DATE('2024-03-05', 'YYYY-MM-DD') + FLOOR(DBMS_RANDOM.VALUE(0, 10));
        v_discount_stay_days := ROUND(DBMS_RANDOM.VALUE(1, 30), 0);
        v_discount_percent := ROUND(DBMS_RANDOM.VALUE(5, 20), 2);
        v_image_url := 'https://example.com/sample_image_' || i || '.jpg';

        -- Inserting data into PRODUCTS table
        INSERT INTO PRODUCTS (PRODUCT_ID, PRODUCT_NAME, PRODUCT_DETAILS, PRICE, STOCK, TAGS, EMAIL, SHORT_DES)
        VALUES (v_product_id, v_name, v_des, v_actual_price, v_stock, v_tags, v_email, v_short_des);

        -- Inserting data into DISCOUNT table
        INSERT INTO DISCOUNT (DISCOUNT_ID, PRODUCT_ID, START_DATE, END_DATE, DISCOUNT_PERCENT, EMAIL)
        VALUES ('DIS' || i, v_product_id, v_start_date, v_start_date + v_discount_stay_days, v_discount_percent, v_email);

        -- Inserting data into IMAGES table
        INSERT INTO IMAGES (IMAGE_ID, IMAGE_URL, PRODUCT_ID)
        VALUES ('IMG' || i, v_image_url, v_product_id);
    END LOOP;
END;
/