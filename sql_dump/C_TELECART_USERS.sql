create table USERS
(
    NAME         VARCHAR2(500)  not null,
    EMAIL        VARCHAR2(1000) primary key,
    PASSWORD     VARCHAR2(1000) not null,
    PHONE_NUMBER NUMBER         not null,
    IS_SELLER       VARCHAR2(500)  not null
)
       