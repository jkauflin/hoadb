<?php

/*
A = the future value of the investment/loan, including interest
P = the principal investment amount (the initial deposit or loan amount)
r = the annual interest rate (decimal)
n = the number of times that interest is compounded per year
t = the number of years the money is invested or borrowed for
A = P(1+r/n)^nt
*/

// Annaul percentage rate (i.e. 6%)
$rate = 0.06;
// Starting principal value
$principal = 100.0;
// Frequency of compounding (1 = yearly, 12 = monthly)
$annualFrequency = 12.0;
// Time in number of years
//$time = 10;

echo "Compounded Monthly";
for ($time = 1; $time <= 10; $time++) {
	$principalWithInterest = round($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)),2,PHP_ROUND_HALF_DOWN);
	echo "<br>Year = $time ($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)) = " . $principalWithInterest;
}

$annualFrequency = 1.0;
echo "<br><br>Compounded Yearly";
for ($time = 1; $time <= 10; $time++) {
	$principalWithInterest = round($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)),2,PHP_ROUND_HALF_DOWN);
	echo "<br>Year = $time ($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)) = " . $principalWithInterest;
}


$date1=date_create("2015-12-25");
$date2=date_create("2016-01-05");
$diff=date_diff($date1,$date2);
//echo "<br><br>diff days = " . $diff->days;

/*
$date1 = new DateTime("2013-08-07");
$date2 = new DateTime("2013-08-09");
echo "<br><br> diff days = " . $date1->diff($date2)->days;
*/
//(string)$diff->format('%R%a');

/*
$d1=strtotime("July 04");
$d2=ceil(($d1-time())/60/60/24);
echo "There are " . $d2 ." days until 4th of July.";
*/

?>
