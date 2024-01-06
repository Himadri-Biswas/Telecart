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
