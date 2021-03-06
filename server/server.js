//TODO: deny client side changes to chips

var startingChipCount = 500000;
var maxUsers = 9;
var timeoutDelay = 120000;

Accounts.config({
	sendVerificationEmail: true,
});

Accounts.onCreateUser(function(options, user) {
	if (options.profile)
    	user.profile = options.profile;
    if(!user.profile)
    	user.profile = {};
    user.profile.chips = startingChipCount;
    return user;
});

//Game State Variables
var round = {};
var currPlayer = {};
var timer = {};

PlayerCardStream.permissions.read(function(eventName) {
	return this.userId === eventName;
});

PlayerCardStream.permissions.write(function(eventName) {
	return false;
});

TableCardStream.permissions.read(function(eventName) {
	return true;
});

TableCardStream.permissions.write(function(eventName) {
	return false;
});

CurrPlayerStream.permissions.read(function(eventName) {
	return true;
});

CurrPlayerStream.permissions.write(function(eventName) {
	return false;
});

MovesStream.permissions.read(function(eventName) {
	return false;
});

MovesStream.permissions.write(function(eventName) {
	if(currPlayer[eventName] === this.userId) {
		return true;
	}
}, false);

var RoomController = function (roomName, action) {
	if(action === '') {
		
	}
}

MovesStream.addFilter(function(eventName, args) {

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
	    		players: [],
	    		playerInfo: [],
	    	},function(error, result){
		        if(error) {
		            console.log('Error is '+error);
		        } else if(result) {
		            console.log(userId+' joined the new room: '+roomName);
		        }
		    });
	    } else {
	    	if(room.started) {
	    		if(room.users && room.users.length) {
		    		if(room.users.indexOf(userId) === -1 && room.queue && room.users.length + room.queue.length <= maxUsers) {
		    			if(room.queue.indexOf(userId) === -1) {
				    		Rooms.update({
						        _id: room._id,
						    }, {
						        $push: {queue: userId },
						    }, function(error, result){
						        if(error) {
						            console.log('Error is '+error);
						        } else if(result) {
						            console.log(userId+' joined the queue in room: '+roomName);
						        }
						    });
			    		}
		    		}
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
			room = Rooms.findOne({name: roomName});
			var leaving = false;
			if(user && user.publications && user.publications.length && user.publications.length === 1) {
				leaving = true;
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
			if(leaving && room.players && room.players.length === 2) {
				Rooms.update({
			    	name: roomName, 
			    }, {
			    	$set: {started: false},
			    }, function(error, result){
			        if(error) {
			            console.log('Error is '+error);
			        } else if(result) {
			            console.log('Game Stopped');
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
	var cards = [], suits = ['s','c','h','d'], nos = ['1','2','3','4','5','6','7','8','9','10','j','q','k'], i, j, l, k;
	for(i=0,l=suits.length; i<l ; i++) {
		for(j=0,k=nos.length; j<k; j++) {
			cards.push(suits[i]+nos[j]);
		}
	}
	cards.sort(function() { return 0.5 - Math.random() });
	var room = Rooms.findOne(roomId);
	var roomName = room.name;
	var users = room.users;
	var players = [];
	var playerInfo = [];
	for(i=0,l=users.length; i<l ; i++) {
		if(players.indexOf(users[i]) === -1) {
			players.push(users[i]);
			var user = Meteor.users.findOne(users[i]);
			playerInfo.push({
				index: i,
				userId: users[i],
				username: user.username,
				chipCount: user.profile.chips,
			});
		}
	}
	Rooms.update({
        _id: roomId, 
    }, {
        $set: {players: players },
        $set: {playerInfo: playerInfo },
    }, function(error, result){
        if(error) {
            console.log('Error is '+error);
        } else if(result) {
            console.log('Game started');
        }
    });
	var playerCards = {};
	for(i=0,l=players.length; i<l ; i++) {
		playerCards[players[i]] = [{card: cards.pop()}];
	}
	for(user in playerCards) {
		if(playerCards.hasOwnProperty(user)) {
			playerCards[user].push({card: cards.pop()});
			PlayerCardStream.emit(user, playerCards[user]);
		}
	}
	console.log(playerCards);
	var flop = [], turn, river;
	cards.pop();	//Burn
	flop.push(cards.pop());
	flop.push(cards.pop());
	flop.push(cards.pop());
	cards.pop();	//Burn
	turn = cards.pop();
	cards.pop();	//Burn
	river = cards.pop();
	//First Round of Betting
	CurrPlayerStream.emit(roomName, {player: 0, delay: timeoutDelay});
	round[roomName] = 0;
	currPlayer[roomName] = 0;
	timer[roomName] = Meteor.setTimeout(function () {
		RoomController(roomName, "drop");
	}, timeoutDelay);
}