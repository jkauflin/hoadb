-- phpMyAdmin SQL Dump
-- version 4.7.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 14, 2018 at 12:26 PM
-- Server version: 10.2.11-MariaDB-log
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `user_hoa_db`
--
--
-- Table structure for table `hoa_assessments`
--

CREATE TABLE `hoa_assessments` (
  `OwnerID` int(1) NOT NULL DEFAULT 0,
  `Parcel_ID` varchar(14) NOT NULL DEFAULT '',
  `FY` int(4) NOT NULL DEFAULT 0,
  `DuesAmt` varchar(10) DEFAULT NULL,
  `DateDue` varchar(30) DEFAULT NULL,
  `Paid` int(1) DEFAULT NULL,
  `NonCollectible` int(1) NOT NULL DEFAULT 0,
  `DatePaid` varchar(30) DEFAULT NULL,
  `PaymentMethod` varchar(50) DEFAULT NULL,
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
  `InterestNotPaid` int(1) NOT NULL DEFAULT 0,
  `BankFee` decimal(5,2) DEFAULT NULL,
  `LienComment` varchar(200) DEFAULT NULL,
  `Comments` varchar(255) DEFAULT NULL,
  `LastChangedBy` varchar(40) NOT NULL DEFAULT 'import',
  `LastChangedTs` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_communications`
--

CREATE TABLE `hoa_communications` (
  `Parcel_ID` varchar(14) NOT NULL,
  `CommID` int(7) NOT NULL,
  `CreateTs` datetime NOT NULL DEFAULT current_timestamp(),
  `OwnerID` int(11) NOT NULL DEFAULT 0,
  `CommType` varchar(50) DEFAULT NULL,
  `CommDesc` varchar(200) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_config`
--

CREATE TABLE `hoa_config` (
  `ConfigName` varchar(80) NOT NULL,
  `ConfigDesc` varchar(100) NOT NULL,
  `ConfigValue` varchar(1000) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_owners`
--

CREATE TABLE `hoa_owners` (
  `OwnerID` int(1) DEFAULT NULL,
  `Parcel_ID` varchar(14) DEFAULT NULL,
  `CurrentOwner` int(1) DEFAULT NULL,
  `Owner_Name1` varchar(60) DEFAULT NULL,
  `Owner_Name2` varchar(60) DEFAULT NULL,
  `DatePurchased` varchar(30) DEFAULT NULL,
  `Mailing_Name` varchar(100) DEFAULT NULL,
  `AlternateMailing` int(1) DEFAULT NULL,
  `Alt_Address_Line1` varchar(60) DEFAULT NULL,
  `Alt_Address_Line2` varchar(60) DEFAULT NULL,
  `Alt_City` varchar(60) DEFAULT NULL,
  `Alt_State` varchar(2) DEFAULT NULL,
  `Alt_Zip` varchar(20) DEFAULT NULL,
  `Owner_Phone` varchar(30) DEFAULT NULL,
  `EmailAddr` varchar(100) NOT NULL DEFAULT '',
  `Comments` varchar(255) DEFAULT NULL,
  `EntryTimestamp` varchar(50) DEFAULT NULL,
  `UpdateTimestamp` varchar(50) DEFAULT NULL,
  `LastChangedBy` varchar(40) NOT NULL DEFAULT 'import',
  `LastChangedTs` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_payments`
--

CREATE TABLE `hoa_payments` (
  `Parcel_ID` varchar(14) NOT NULL,
  `OwnerID` int(11) NOT NULL,
  `FY` int(4) NOT NULL,
  `txn_id` varchar(20) NOT NULL,
  `payment_date` varchar(80) NOT NULL,
  `payer_email` varchar(200) NOT NULL,
  `payment_amt` decimal(6,2) NOT NULL,
  `payment_fee` decimal(3,2) NOT NULL,
  `LastChangedTs` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_properties`
--

CREATE TABLE `hoa_properties` (
  `Parcel_ID` varchar(14) DEFAULT NULL,
  `LotNo` int(5) DEFAULT NULL,
  `SubDivParcel` int(3) DEFAULT NULL,
  `Parcel_Location` varchar(50) DEFAULT NULL,
  `Property_Street_No` int(4) DEFAULT NULL,
  `Property_Street_Name` varchar(50) DEFAULT NULL,
  `Property_City` varchar(50) DEFAULT NULL,
  `Property_State` varchar(2) DEFAULT NULL,
  `Property_Zip` varchar(10) DEFAULT NULL,
  `Member` int(1) DEFAULT NULL,
  `Vacant` int(1) DEFAULT NULL,
  `Rental` int(1) DEFAULT NULL,
  `Managed` int(1) DEFAULT NULL,
  `Foreclosure` int(1) DEFAULT NULL,
  `Bankruptcy` int(1) DEFAULT NULL,
  `Liens_2B_Released` int(1) DEFAULT NULL,
  `UseEmail` int(1) NOT NULL DEFAULT 0,
  `Comments` varchar(255) DEFAULT NULL,
  `LastChangedBy` varchar(40) NOT NULL DEFAULT 'import',
  `LastChangedTs` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_sales`
--

CREATE TABLE `hoa_sales` (
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
  `LastChangedTs` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `hoa_assessments`
--
ALTER TABLE `hoa_assessments`
  ADD PRIMARY KEY (`OwnerID`,`Parcel_ID`,`FY`),
  ADD UNIQUE KEY `OwnerID` (`OwnerID`,`Parcel_ID`,`FY`);

--
-- Indexes for table `hoa_communications`
--
ALTER TABLE `hoa_communications`
  ADD PRIMARY KEY (`Parcel_ID`,`CommID`);

--
-- Indexes for table `hoa_owners`
--
ALTER TABLE `hoa_owners`
  ADD UNIQUE KEY `OwnerID` (`OwnerID`,`Parcel_ID`);

--
-- Indexes for table `hoa_properties`
--
ALTER TABLE `hoa_properties`
  ADD UNIQUE KEY `Parcel_ID` (`Parcel_ID`);

--
-- Indexes for table `hoa_sales`
--
ALTER TABLE `hoa_sales`
  ADD PRIMARY KEY (`PARID`,`SALEDT`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `hoa_communications`
--
ALTER TABLE `hoa_communications`
  MODIFY `CommID` int(7) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
