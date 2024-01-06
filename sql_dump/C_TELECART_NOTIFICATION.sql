create table NOTIFICATION
(
    NOTIFICATION_TEXT VARCHAR2(3000) not null,
    EMAIL             VARCHAR2(1000) not null
        references USERS,
    "DATE"            DATE           not null
)
