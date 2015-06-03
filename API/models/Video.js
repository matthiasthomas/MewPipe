var mongoose = require('./Db.js').mongoose;

videoSchema = mongoose.Schema({
	_user: {
		type: String,
		required: true,
		ref: 'User'
	},
	name: {
		type: String,
		required: true
	},
	description: {
		type: String
	},
	size: {
		type: Number,
		required: true
	},
	ext: {
		type: String,
		required: true
	},
	rights: {
		type: String,
		required: true,
		enum: ['public', 'private', 'link'],
		default: 'private'
	},
	ready: {
		type: Boolean,
		default: false
	},
	created: {
		type: Date,
		default: Date.now
	},
	archived: {
		type: Boolean,
		default: false
	}
});

videoModel = mongoose.model('Video', videoSchema);

exports.Video = videoModel;