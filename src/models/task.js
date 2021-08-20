const mongoose = require('mongoose');

const options = {
	timestamps: true
};

const TaskSchema = new mongoose.Schema(
	{
		description: {
			type: String,
			required: true,
			trim: true
		},
		completed: {
			type: String,
			default: false
		},
		user: {
			// type is going to be an object id
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		}
	},
	options
);

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
