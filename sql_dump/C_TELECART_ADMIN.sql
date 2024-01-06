create table ADMIN
(
    NAME     VARCHAR2(1000) not null,
    EMAIL    VARCHAR2(1000) primary key,
    PASSWORD VARCHAR2(2000) not null,
    ADDRESS  VARCHAR2(2000) not null,
    PHONE    NUMBER         not null
)


INSERT INTO C##TELECART.ADMIN (NAME, EMAIL, PASSWORD, ADDRESS, PHONE) VALUES ('Homelander', 'homelander@gmail.com', 'homelander', 'TheSevenTower, Dhaka', 1773275870);
INSERT INTO C##TELECART.ADMIN (NAME, EMAIL, PASSWORD, ADDRESS, PHONE) VALUES ('Loki', 'loki@gmail.com', 'loki', 'TheAvengersTower, Dhaka', 84983473987);
INSERT INTO C##TELECART.ADMIN (NAME, EMAIL, PASSWORD, ADDRESS, PHONE) VALUES ('Thanos', 'thanos@gmail.com', 'thanos', 'ScareCrow, Dhaka', 67667766578787);