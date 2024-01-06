create table SELLERS
(
    BUSINESS_NAME VARCHAR2(1000) not null,
    ABOUT         VARCHAR2(1000) not null,
    ADDRESS       VARCHAR2(1000) not null,
    PHONE_NUMBER  NUMBER         not null,
    EMAIL         VARCHAR2(1000) primary key
        references USERS
)
