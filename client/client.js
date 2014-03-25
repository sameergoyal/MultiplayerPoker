Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL',
});

Router.configure({
    layoutTemplate: 'layout'
});

Router.map(function () {
    this.route('home', {
        path: '/',
        template: 'home',
    });
    this.route('login',{
        path: 'login',
        template: 'login',
    });
    this.route('room',{
        path: 'room/:name',
        template: 'room',
        waitOn: function() { return Meteor.subscribe('roomByName', this.params.name) },
        data: function() {
            return Rooms.findOne({name:this.params.name});
        },
        before: function() {
            var playerCardHandler = function(message) {
                console.log('Cards dealt!');
                Session.set('myCards',message);
            };
            var timer = function(){
                var timeout = Session.get('timeout');
                if(timeout > 0) {
                    Session.set('timeout', timeout - 1); 
                    Meteor.setTimeout(timer,1000);
                }
            }
            var moveHandler = function(message) {
                console.log('Current player is : ' + message.player);
                Session.set('currPlayer',message.player);
                Session.set('timeout',message.delay/1000);
                Meteor.setTimeout(timer,1000);
            }
            PlayerCardStream.on(Meteor.userId(), playerCardHandler);
            CurrPlayerStream.on(this.params.name, moveHandler);
            var room = Rooms.findOne({name:this.params.name});
            
            if(room && room.users)
            {
                var users = room.users;
                Session.set('users',users);
            }
        },
    });
});

Router.before(function(){isLoggedInUser('login');}, { except:['home','login'] });

function isLoggedInUser(routeName, routeParams) {
    Deps.autorun(function(){
        if(!Meteor.userId()) {
            // TODO: change to .stop & .render
            Router.go(routeName, routeParams);
        }
    });
}

Template.roomOptions.events({
    'submit form': function (e) {
        e.preventDefault();
        var roomName = $('#room-name').val();
        Router.go('room',{name: roomName});
    }
});

Template.table.playable = function(users) {
    if(users && users.length) {
        var u = {}, noOfDistinctUsers = 0,  l = users.length;
        for(var i = 0; i < l; ++i){
            if(u.hasOwnProperty(users[i])) {
                continue;
            }
            noOfDistinctUsers++;
            u[users[i]] = 1;
        }
        if(noOfDistinctUsers > 1) {
            return true;
        }
    }
    return false;
}

Template.table.isUserPlaying = function(users) {
    if(users && users.length) {
        for(var i=0,l=users.length; i<l ; i++) {
            if(users[i] === Meteor.userId()) {
                return true;
            }
        }
    }
    return false;
}

Template.table.isUserWaiting = function(users) {
    if(users && users.length) {
        for(var i=0,l=users.length; i<l ; i++) {
            if(users[i] === Meteor.userId()) {
                return true;
            }
        }
    }
    return false;
}

Template.table.isGameStarted = function() {
    if(Session.get('myCards')) {
        return true;
    }
    return false;
}

Template.game.cards = function() {
    return Session.get('myCards');
}

Template.game.playersInfo = function(players) {
    //TODO: return more info
    var result = [];
    for(var i=0,l=players.length; i<l; i++) {
        result.push({userId: players[i]});
    }
    return result;
}

Template.game.sessionGet = function(key) {
    return Session.get(key);
}

Template.game.chipCount = function() {
    return Meteor.user().profile.chips;
}

Template.game.isCurrPlayer = function(index) {
    return index === Session.get('currPlayer');
}