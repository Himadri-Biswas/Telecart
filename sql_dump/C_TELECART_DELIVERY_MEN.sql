create table DELIVERY_MEN
(
    DELIVERY_NAME  VARCHAR2(2000) not null,
    DELIVERY_EMAIL VARCHAR2(2000) primary key,
    PASSWORD       VARCHAR2(2000),
    DELIVERY_PHONE NUMBER         not null,
    AREA           VARCHAR2(2000) not null
)
