create table DELIVERY_ORDER
(
    DELIVERY_EMAIL VARCHAR2(2000) not null
        references DELIVERY_MEN,
    ORDER_ID       VARCHAR2(2000) not null
        references ORDERS
)
