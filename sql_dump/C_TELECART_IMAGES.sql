create table IMAGES
(
    IMAGE_ID   VARCHAR2(1000) primary key,
    IMAGE_URL  VARCHAR2(1000) not null,
    PRODUCT_ID VARCHAR2(1000) not null
        references PRODUCTS
)
