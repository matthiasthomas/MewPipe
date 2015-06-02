var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/MewPipe', function(err){
	if (err) { 
		console.log('Can\'t connect to mongoDB'); 
		throw err;
	}
});

exports.mongoose = mongoose;