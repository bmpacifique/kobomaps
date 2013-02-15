<?php defined('SYSPATH') or die('No direct script access.');
/***********************************************************
* messageDetails.php - View
* This software is copy righted by Kobo 2013
* Writen by Dylan Gillespie <dylan@ethertontech.com>, Etherton Technologies <http://ethertontech.com>
* Started on 2013-02-08
*************************************************************/
?>

<div class="messageDetails" id="messageDetails_<?php echo $message->id?>">

	<p><strong><?php echo __('Sent');?>:</strong>  <?php echo date('Y-m-d H:i',strtotime($message->date));?> </p>
	

	<p> <strong><?php echo __('From')?>:</strong>
	<?php if($message->poster_name == ""){
			echo __('No name given.');
		}
		else{
			echo $message->poster_name;
		}
	?>
	</p>
	
	<p><strong><?php echo __('Email')?>:</strong>
	<?php if($message->poster_email == ""){
			echo __('No email given.');
		}
		else{
			echo $message->poster_email;
		}
	?>
	</p>
	</br>
	<p><strong><?php echo __('Comment')?>:</strong> </br></br> <?php echo nl2br($message->message);?></p>

</div>

<script type ="text/javascript">
	//changes weight of message text to read
	$("#messageRow<?php echo $message->id ?>").removeClass("unread");
</script>