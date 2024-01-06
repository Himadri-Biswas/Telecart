create table DISCOUNT
(
    DISCOUNT_ID VARCHAR2(1000) primary key,
    START_DATE  DATE           not null,
    END_DATE    DATE           not null,
    DISCOUNT_PERCENT  NUMBER         not null
)
