Accounts.config({
	sendVerificationEmail: true,
});

Meteor.publish('roomByName', function(roomName){
	var self = this;
	var userId = this.userId;
	var connection = this.connection;
	if(userId) {
		var room = Rooms.findOne({name: roomName});
	    if(!room) {
	    	Rooms.insert({ 
	    		name: roomName, 
	    		users:[userId]
	    	},function(error, result){
		        if(error) {
		            console.log('Error is '+error);
		        } else if(result) {
		            console.log(userId+' joined the new room: '+roomName);
		        }
		    });
	    } else {
		    Rooms.update({
		        _id: room._id,
		    }, {
		        $push: {users: userId },
		    }, function(error, result){
		        if(error) {
		            console.log('Error is '+error);
		        } else if(result) {
		            console.log(userId+' joined the room: '+roomName);
		        }
		    });
		}
		Meteor.users.update({
	    	_id: userId,
	    },{
	    	$push: {publications: connection},
	    });
		this.onStop(function(){
			var user = Meteor.users.findOne(userId);
			console.log(user);
			if(user && user.publications && user.publications.length && user.publications.length === 1) {
				Rooms.update({
			        name: roomName, 
			    }, {
			        $pull: {users: userId },
			    }, function(error, result){
			        if(error) {
			            console.log('Error is '+error);
			        } else if(result) {
			            console.log(userId+' left the room: '+roomName);
			        }
			    });
			}
		    Meteor.users.update({
		    	_id: userId,
		    },{
		    	$pull: {publications: connection},
		    });
		});
		return Rooms.find({name: roomName});
	}
});