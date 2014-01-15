Accounts.config({
	sendVerificationEmail: true,
});

Meteor.publish('rooms', function () {
	return Rooms.find({});
});

Meteor.publish('roomByName', function(roomName){
	console.log('Subscribed');
	return Rooms.find({name: roomName});
});

Rooms.allow({
	insert: function (userId, doc) {
		if(userId && doc.users && doc.users.length) {
			for(var i=0 ; i < doc.users.length ; i++) {
				if(doc.users[i] === userId) {
					return true;
				}
			}
		}
		return false;
	},
	update: function (userId, doc, fields, modifier) {
		//TODO: only allow few things
		return true;
	},
	remove: function (userId, doc) {
		
	},
	fetch: ['owner'],
});

Rooms.deny({
	insert: function (userId, doc) {
		if(Rooms.findOne({name:doc.name})) {
			return true;
		}
	},
	update: function (userId, doc, fields, modifier) {
		//...
	},
	remove: function (userId, doc) {
		return true;
	},
});