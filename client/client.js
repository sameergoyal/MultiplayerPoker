Router.configure({
    layoutTemplate: 'layout'
});

Router.before(isLoggedInUser('login'),{except:['home','login']});

Router.map(function () {
    this.route('home', {
        path: '/',
        template: 'home',
        waitOn: function(){
            return Meteor.subscribe('rooms');
        }
    });
    this.route('login',{
        path: 'login',
        template: 'login',
    });
    this.route('room',{
        path: 'room/:name',
        template: 'room',
        waitOn: function(){
            var self = this;
            return Meteor.subscribe('roomByName', this.params.name, {
                onReady: function(){
                    console.log('ready');
                    var room = Rooms.findOne({name: self.params.name});
                    if(!room) {
                        console.log('Room doesnt exist');
                        Router.go('login');
                    }
                    var found = false;
                    for(var i=0; i < room.users.length ; i++) {
                        if(room.users[i] === Meteor.userId()) { found = true; break; }
                    }
                    if(!found) {
                        Rooms.update({
                            _id: room._id,
                        }, {
                            $push: {users: Meteor.userId() },
                        }, function(error, result){
                            if(error) {
                                console.log('Error is '+error);
                            } else if(result) {
                                console.log('Room updated successfully!');
                            }
                        });
                    }
                },
                onError: function(){
                    console.log('error');
                },
            });
        },
    });
});

function isLoggedInUser(routeName, routeParams) {
    Deps.autorun(function(){
        if(!Meteor.userId()) {
            Router.go(routeName, routeParams);
        }
    });
}

Template.roomOptions.events({
    'submit form': function (e) {
        e.preventDefault();
        var roomName = $('#room-name').val();
        var room = Rooms.findOne({name: roomName});
        if(room) {
            console.log('Room is already present');
            Router.go('room',{name: roomName});
        } else {
            Rooms.insert({
                name: roomName,
                users: [Meteor.userId()],
            }, function(error, result){
                if(error) {
                    Router.go('room',{name: roomName});
                    console.log('Error is '+error);
                } else if(result) {
                    console.log('Room created successfully!');
                    Router.go('room',{name: roomName});
                }
            });
        }
    }
});