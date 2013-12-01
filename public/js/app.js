window.location.hash = "";

App = Ember.Application.create({});

App.Router.map(function() {
	this.resource('Status', { path: '/' });
	this.resource('Apps');
	this.resource('Services');
	this.resource('Settings');
	this.resource('About');
});

var statusSocket;
App.StatusRoute = Ember.Route.extend({
    activate: function() {
        
    },
    deactivate: function() {
        
    }
});