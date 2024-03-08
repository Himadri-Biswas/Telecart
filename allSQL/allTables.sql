create table ADMIN
(
    NAME     VARCHAR2(1000) not null,
    EMAIL    VARCHAR2(1000) primary key,
    PASSWORD VARCHAR2(2000) not null,
    ADDRESS  VARCHAR2(2000) not null,
    PHONE    NUMBER         not null
)

INSERT INTO C##TELECART.ADMIN (NAME, EMAIL, PASSWORD, ADDRESS, PHONE) VALUES ('AdminPower', 'adminpower@gmail.com', 'adminpower', 'Dhanmondi, Dhaka', 67667766578787);

create table USERS
(
    NAME         VARCHAR2(500)  not null,
    EMAIL        VARCHAR2(1000) primary key,
    PASSWORD     VARCHAR2(1000) not null,
    PHONE_NUMBER NUMBER         not null,
    IS_SELLER       VARCHAR2(500)  not null
)
       
create table SELLERS
(
    BUSINESS_NAME VARCHAR2(1000) not null,
    ABOUT         VARCHAR2(1000) not null,
    ADDRESS       VARCHAR2(1000) not null,
    PHONE_NUMBER  NUMBER         not null,
    EMAIL         VARCHAR2(1000) primary key
        references USERS
)


create table CART
(
    EMAIL      VARCHAR2(1000) not null
        references USERS,
    PRODUCT_ID VARCHAR2(1000) not null
        references PRODUCTS,
    ITEM_COUNT  NUMBER  not null
)

create table WISHLIST
(
    EMAIL      VARCHAR2(1000) not null
        references USERS,
    PRODUCT_ID VARCHAR2(1000) not null
        references PRODUCTS,
    ITEM_COUNT       NUMBER         not null
)


create table PRODUCTS
(
    PRODUCT_ID      VARCHAR2(1000) primary key,
    EMAIL           VARCHAR2(1000) not null
        references SELLERS,
    PRODUCT_NAME    VARCHAR2(1000) not null,
    PRODUCT_DETAILS VARCHAR2(2000) not null,
    PRICE    NUMBER         not null,
    STOCK           NUMBER         not null,
    TAGS            VARCHAR2(1000) not null
)


create table DISCOUNT
(
    DISCOUNT_ID VARCHAR2(1000) primary key,
    PRODUCT_ID  VARCHAR2(1000) not null
        references PRODUCTS,
    EMAIL       VARCHAR2(1000) not null
        references SELLERS,
    START_DATE  DATE           not null,
    END_DATE    DATE           not null,
    DISCOUNT_PERCENT  NUMBER         not null
)

create table ORDERS
(
    ORDER_ID        VARCHAR2(2000) primary key,
    EMAIL           VARCHAR2(1000) not null
        references USERS,
    "DATE"          DATE           not null,
    TOTAL_COST      NUMBER         not null,
    ADDRESS         VARCHAR2(2000),
    STREET          VARCHAR2(2000),
    CITY            VARCHAR2(2000),
    STATE           VARCHAR2(2000),
    ZIP_CODE        VARCHAR2(2000),
    LANDMARK        VARCHAR2(2000),
    DELIVERY_STATUS VARCHAR2(1000),
    PAYMENT_STATUS  VARCHAR2(2000) not null
)


create table IMAGES
(
    IMAGE_ID   VARCHAR2(1000) primary key,
    IMAGE_URL  VARCHAR2(1000) not null,
    PRODUCT_ID VARCHAR2(1000) not null
        references PRODUCTS
)

create table NOTIFICATION
(
    NOTIFICATION_TEXT VARCHAR2(3000) not null,
    EMAIL             VARCHAR2(1000) not null
        references USERS,
    "DATE"            DATE           not null
)

create table ORDER_PRODUCT
(
    ORDER_ID   VARCHAR2(2000) not null
        references ORDERS,
    PRODUCT_ID VARCHAR2(1000)
        references PRODUCTS,
    ITEM_COUNT       NUMBER
)

create table REVIEW
(
    EMAIL       VARCHAR2(1000) not null
        references USERS,
    PRODUCT_ID  VARCHAR2(1000) not null
        references PRODUCTS,
    REVIEW_TEXT VARCHAR2(3000) not null,
    RATING_STAR NUMBER         not null,
    "DATE"      DATE           not null
)


create table DELIVERY_MEN
(
    DELIVERY_NAME  VARCHAR2(2000) not null,
    DELIVERY_EMAIL VARCHAR2(2000) primary key,
    PASSWORD       VARCHAR2(2000),
    DELIVERY_PHONE NUMBER         not null,
    AREA           VARCHAR2(2000) not null
)

create table DELIVERY_ORDER
(
    DELIVERY_EMAIL VARCHAR2(2000) not null
        references DELIVERY_MEN,
    ORDER_ID       VARCHAR2(2000) not null
        references ORDERS
)