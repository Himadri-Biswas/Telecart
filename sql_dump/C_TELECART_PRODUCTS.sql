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
