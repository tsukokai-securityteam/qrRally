CREATE USER 'qruser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'apiserverDB@qruser';
GRANT ALL ON *.* TO 'qruser'@'localhost';

CREATE DATABASE `qrdb`;
USE `qrdb`;

CREATE TABLE `userdata` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`auth_code` CHAR(13) NULL DEFAULT NULL,
	`user_agent` CHAR(250) NULL DEFAULT NULL,
	`os` CHAR(15) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`rally_data` JSON NULL DEFAULT NULL,
	`exchanged_gifts` JSON NULL DEFAULT NULL,
	`suggest_type` CHAR(50) NULL DEFAULT NULL,
	PRIMARY KEY (`id`)
);