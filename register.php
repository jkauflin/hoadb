<?php include('registrationServer.php') ?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<title>HOA db</title>
	<meta name="keywords" 		content="homewowners association database hoa db" />
	<meta name="description"	content="This is the Homeowners Association database" />
	<meta name="Author" 		content="John J Kauflin"/>
	
    <!-- Place favicon.ico in the root directory -->
    <link rel="icon" href="favicon.ico">

    <!-- Bootstrap core CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-datetimepicker/2.5.20/jquery.datetimepicker.min.css"/>
        <!-- Bootstrap core CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" />
        <link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet"
            integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous" />

    <link rel="stylesheet" href="css/main.css?ver=3.010">
  </head>

<body>
	<nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
    <div class="container-fluid">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" data-toggle="modal" href="#aboutDialog"><img id="header-image" alt="Brand logo photo" src="images/logo-photo.jpg"></a>
          <a class="navbar-brand" style="outline: 0" data-toggle="modal" href="#aboutDialog">HOA DB v1.4</a>
        </div> <!-- navbar-header -->

      </div> <!-- container-fluid -->
	</nav><!-- <nav class="navbar navbar-default navbar-fixed-top"> -->


<div class="container-fluid">
	<div class="tab-content">
		<div class="row">
			<div class="col-sm-4 col-md-3">
			    <h4>Register</h4>
                <form method="post" action="register.php">
                    <div class="form-group">
                        <input type="text" class="form-control resetval" name="email"  	id="email" 	placeholder="Email">
                        <input type="password" class="form-control resetval" name="password_1"  	id="password_1" 	placeholder="Password">
                        <input type="password" class="form-control resetval" name="password_2"  	id="password_2" 	placeholder="Confirm password">
                    </div>
                    <button type="submit" class="btn btn-primary" name="reg_user">Register</button>


  	<p>
  		Already a member? <a href="login.php">Sign in</a>
  	</p>

                    <?php include('errors.php'); ?>
                </form>
			</div>

			<div class="col-sm-8 col-md-9">
			</div>
		</div><!-- row -->	                

	</div><!-- end of main tab content -->
</div><!-- end of main container -->

    
    <!-- Bootstrap core JavaScript
        ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->

    <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" 
        crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" crossorigin="anonymous"
        integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd">
        </script>

	<script src="https://cdn.jsdelivr.net/npm/bootstrap-add-clear@1.0.7/bootstrap-add-clear.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-datetimepicker/2.5.20/jquery.datetimepicker.min.js"></script>

	<script src="js/util.js?ver=1.400"></script>

</body>
</html>
