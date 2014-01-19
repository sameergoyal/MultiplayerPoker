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
        waitOn: function() { Meteor.subscribe('roomByName', this.params.name) },
        data: function() {
            return Rooms.findOne({name:this.params.name});
        },
    });
});

Router.before(function(){isLoggedInUser('login');}, { except:['home','login'] });

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