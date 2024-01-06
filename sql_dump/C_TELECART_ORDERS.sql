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
