create table ORDER_PRODUCT
(
    ORDER_ID   VARCHAR2(2000) not null
        references ORDERS,
    PRODUCT_ID VARCHAR2(1000)
        references PRODUCTS,
    ITEM_COUNT       NUMBER
)
