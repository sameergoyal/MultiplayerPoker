Accounts.config({
	sendVerificationEmail: true,
});

PlayerCardStream.permissions.read(function(eventName) {
	return this.userId === eventName;
});

PlayerCardStream.permissions.write(function(eventName) {
	return false;
});

Meteor.publish('roomByName', function(roomName){
	var self = this;
	var userId = this.userId;
	var connection = this.connection;
	if(userId) {
		var room = Rooms.findOne({name: roomName});
		var playable = false;
	    if(!room) {
	    	Rooms.insert({ 
	    		name: roomName, 
	    		users: [userId],
	    		started: false,
	    		queue: [],
	    	},function(error, result){
		        if(error) {
		            console.log('Error is '+error);
		        } else if(result) {
		            console.log(userId+' joined the new room: '+roomName);
		        }
		    });
	    } else {
	    	if(room.started) {
	    		if(room.users && room.queue && room.users.length + room.queue.length < 9) {
		    		Rooms.update({
				        _id: room._id,
				    }, {
				        $push: {queue: userId },
				    }, function(error, result){
				        if(error) {
				            console.log('Error is '+error);
				        } else if(result) {
				            console.log(userId+' joined the room: '+roomName);
				        }
				    });
	    		}
	    	} else {
		    	if(room.users && room.users.length) {
		    		var users = room.users;
		    		for(var i=0, l=users.length; i<l; i++) {
		    			if(users[i] !== userId) {
		    				playable = true;
		    			}
		    		}
		    	}
			    Rooms.update({
			        _id: room._id,
			    }, {
			    	$set: {started: playable},
			        $push: {users: userId },
			    }, function(error, result){
			        if(error) {
			            console.log('Error is '+error);
			        } else if(result) {
			            console.log(userId+' joined the room: '+roomName);
			            if(playable) {
							startGame(room._id);
						}
						startGame(room._id);
			        }
			    });
			}
		}
		Meteor.users.update({
	    	_id: userId,
	    },{
	    	$push: {publications: connection},
	    });
		this.onStop(function(){
			var user = Meteor.users.findOne(userId);
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

var startGame = function(roomId) {
	var cards = [], suits = ['S','C','H','D'], nos = ['A','2','3','4','5','6','7','8','9','T','J','Q','K'], i, j, l, k;
	for(i=0,l=suits.length; i<l ; i++) {
		for(j=0,k=nos.length; j<k; j++) {
			cards.push(suits[i]+nos[j]);
		}
	}
	cards.sort(function() { return 0.5 - Math.random() });
	var room = Rooms.findOne(roomId);
	var users = room.users;
	var players = [];
	for(i=0,l=users.length; i<l ; i++) {
		if(players.indexOf(users[i]) === -1) {
			players.push(users[i]);
		}
	}
	var playerCards = {};
	for(i=0,l=players.length; i<l ; i++) {
		playerCards[players[i]] = [cards.pop()];
	}
	for(user in playerCards) {
		if(playerCards.hasOwnProperty(user)) {
			playerCards[user].push(cards.pop());
			PlayerCardStream.emit(user, playerCards[user]);
		}
	}
	var flop = [], turn, river;
	cards.pop();	//Burn
	flop.push(cards.pop());
	flop.push(cards.pop());
	flop.push(cards.pop());
	cards.pop();	//Burn
	turn = cards.pop();
	cards.pop();	//Burn
	river = cards.pop();
}