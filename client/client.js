Router.configure({
  layoutTemplate: 'layout'
});

Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'home',
    waitOn: function(){
      Meteor.subscribe('rooms');
    }
  });
});

Template.roomOptions.events({
  'submit form': function (e) {
    e.preventDefault();
    var roomName = $('#room-name').val();
    var room = Rooms.findOne({name: roomName});
    if(room) {
      console.log('Room is already present');
      Rooms.update({
        _id: room._id,
      }, {
        $push: {users: Meteor.userId() },
      }, function(error, result){
        if(error) {
          console.log('Error is '+error);
        } else if(result) {
          console.log('Room updated successfully!');
          //Router.go();
        }
      });
    } else {
      Rooms.insert({
        name: roomName,
        users: [Meteor.userId()],
      }, function(error, result){
        if(error) {
          console.log('Error is '+error);
        } else if(result) {
          console.log('Room created successfully!');
          //Router.go();
        }
      });
    }
  }
});