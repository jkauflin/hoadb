-- phpMyAdmin SQL Dump
-- version 4.1.4
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Apr 15, 2016 at 02:33 PM
-- Server version: 5.6.15-log
-- PHP Version: 5.5.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `hoa_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `hoa_assessments`
--

CREATE TABLE IF NOT EXISTS `hoa_assessments` (
  `OwnerID` int(1) NOT NULL DEFAULT '0',
  `Parcel_ID` varchar(14) NOT NULL DEFAULT '',
  `FY` int(4) NOT NULL DEFAULT '0',
  `DuesAmt` varchar(6) DEFAULT NULL,
  `DateDue` varchar(18) DEFAULT NULL,
  `Paid` int(1) DEFAULT NULL,
  `DatePaid` varchar(10) DEFAULT NULL,
  `PaymentMethod` varchar(14) DEFAULT NULL,
  `Lien` int(1) DEFAULT NULL,
  `LienRefNo` varchar(50) DEFAULT NULL,
  `DateFiled` date DEFAULT NULL,
  `Disposition` varchar(10) DEFAULT NULL,
  `FilingFee` decimal(5,2) DEFAULT NULL,
  `ReleaseFee` decimal(5,2) DEFAULT NULL,
  `DateReleased` date DEFAULT NULL,
  `LienDatePaid` date DEFAULT NULL,
  `AmountPaid` decimal(6,2) DEFAULT NULL,
  `StopInterestCalc` int(1) DEFAULT NULL,
  `FilingFeeInterest` decimal(5,2) DEFAULT NULL,
  `AssessmentInterest` decimal(5,2) DEFAULT NULL,
  `LienComment` varchar(200) DEFAULT NULL,
  `SubDivParcel` int(3) DEFAULT NULL,
  `Comments` varchar(9) DEFAULT NULL,
  `LastChangedBy` varchar(40) NOT NULL DEFAULT 'import',
  `LastChangedTs` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`OwnerID`,`Parcel_ID`,`FY`),
  UNIQUE KEY `OwnerID` (`OwnerID`,`Parcel_ID`,`FY`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_owners`
--

CREATE TABLE IF NOT EXISTS `hoa_owners` (
  `OwnerID` int(1) DEFAULT NULL,
  `Parcel_ID` varchar(14) DEFAULT NULL,
  `CurrentOwner` int(1) DEFAULT NULL,
  `Owner_Name1` varchar(23) DEFAULT NULL,
  `Owner_Name2` varchar(12) DEFAULT NULL,
  `DatePurchased` varchar(18) DEFAULT NULL,
  `Mailing_Name` varchar(16) DEFAULT NULL,
  `AlternateMailing` int(1) DEFAULT NULL,
  `Alt_Address_Line1` varchar(16) DEFAULT NULL,
  `Alt_Address_Line2` varchar(10) DEFAULT NULL,
  `Alt_City` varchar(13) DEFAULT NULL,
  `Alt_State` varchar(2) DEFAULT NULL,
  `Alt_Zip` varchar(6) DEFAULT NULL,
  `Owner_Phone` varchar(14) DEFAULT NULL,
  `Comments` varchar(10) DEFAULT NULL,
  `EntryTimestamp` varchar(19) DEFAULT NULL,
  `UpdateTimestamp` varchar(19) DEFAULT NULL,
  `LastChangedBy` varchar(40) NOT NULL DEFAULT 'import',
  `LastChangedTs` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `OwnerID` (`OwnerID`,`Parcel_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_properties`
--

CREATE TABLE IF NOT EXISTS `hoa_properties` (
  `Parcel_ID` varchar(14) DEFAULT NULL,
  `LotNo` int(5) DEFAULT NULL,
  `SubDivParcel` int(3) DEFAULT NULL,
  `Parcel_Location` varchar(23) DEFAULT NULL,
  `Property_Street_No` int(4) DEFAULT NULL,
  `Property_Street_Name` varchar(18) DEFAULT NULL,
  `Property_City` varchar(6) DEFAULT NULL,
  `Property_State` varchar(2) DEFAULT NULL,
  `Property_Zip` varchar(10) DEFAULT NULL,
  `Member` int(1) DEFAULT NULL,
  `Vacant` int(1) DEFAULT NULL,
  `Rental` int(1) DEFAULT NULL,
  `Managed` int(1) DEFAULT NULL,
  `Foreclosure` int(1) DEFAULT NULL,
  `Bankruptcy` int(1) DEFAULT NULL,
  `Liens_2B_Released` int(1) DEFAULT NULL,
  `Comments` varchar(84) DEFAULT NULL,
  `LastChangedBy` varchar(40) NOT NULL DEFAULT 'import',
  `LastChangedTs` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `Parcel_ID` (`Parcel_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_sales`
--

CREATE TABLE IF NOT EXISTS `hoa_sales` (
  `PARID` varchar(30) NOT NULL,
  `CONVNUM` varchar(100) NOT NULL,
  `SALEDT` varchar(40) NOT NULL,
  `PRICE` varchar(20) NOT NULL,
  `OLDOWN` varchar(100) NOT NULL,
  `OWNERNAME1` varchar(100) NOT NULL,
  `PARCELLOCATION` varchar(100) NOT NULL,
  `MAILINGNAME1` varchar(100) NOT NULL,
  `MAILINGNAME2` varchar(100) NOT NULL,
  `PADDR1` varchar(100) NOT NULL,
  `PADDR2` varchar(100) NOT NULL,
  `PADDR3` varchar(100) NOT NULL,
  `CreateTimestamp` varchar(40) NOT NULL,
  `NotificationFlag` char(1) NOT NULL,
  `ProcessedFlag` char(1) NOT NULL,
  `LastChangedBy` varchar(40) DEFAULT NULL,
  `LastChangedTs` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`PARID`,`SALEDT`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
