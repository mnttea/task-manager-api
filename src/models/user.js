const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const options = {
	timestamps: true
};

const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Email is invalid');
				}
			}
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minLength: 7,
			validate(value) {
				if (validator.contains(value, 'password', { ignoreCase: true })) {
					throw new Error('Password cannot contain the word password');
				}
			}
		},
		age: {
			type: Number,
			validate(value) {
				if (value < 0) {
					throw new Error('Age must be a positive number');
				}
			}
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		],
		avatar: {
			type: Buffer // allows us to store buffer with binary image data
		}
	},
	options
);

/**
 * @description mongoose virtual is a property that is NOT stored in MongoDB hence virtual.
 * This particular virtual is populating itself documents from another collection. So the
 * user model is populating a virtual field named 'tasks' with documents from the task model.
 * The local field is the user model's field. The foreign field is the task model's field.
 * So Mongoose will find the first document in the task model whose 'user' field matches
 * the user model's field '_id'.
 *
 *
 * @param string - name for virtual field/property
 * @param object - describes relationship between UserSchema and TaskSchema
 *
 * @ref - the model to populate documents from
 * @localField - the current field to look at (user)
 * @foriegnField - the referenced field to look at (task)
 **/
UserSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'user'
});

UserSchema.methods.toJSON = function () {
	// 'this' keyword is a reference to the user document calling upon toJSON
	const user = this;

	// convert stringified json user to javascript object
	userObject = user.toObject();

	// use delete keyword to remove property from javascript object
	delete userObject.password;
	delete userObject.tokens;
	delete userObject.avatar;

	// return updated object
	// toJSON will stringify the return value
	return userObject;
};

UserSchema.methods.generateAuthToken = async function () {
	const user = this;
	const payload = { _id: user._id.toString() };
	const token = jwt.sign(payload, process.env.JWT_SECRET);
	user.tokens = user.tokens.concat({ token });

	return token;
};

UserSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });
	if (!user) {
		throw new Error('Unable to login');
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Unable to login');
	}

	return user;
};

// first parameter is the name of the event which is save because we want to run the middleware for user.save()
// look up middleware under mongoose documentation and there is a list of middleware names
// second parameter next tells the call stack to go to the next middleware
UserSchema.pre('save', async function (next) {
	// keyword "this" is the document that is being saved.
	// In this case, the document would be a user.

	const user = this;
	// true if user is created
	// true if password is being changed
	if (user.isModified('password')) {
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(user.password, salt);
	}

	next();
});

// delete user tasks when the user is removed
UserSchema.pre('remove', async function (next) {
	const user = this;

	await Task.deleteMany({ user: user._id });

	next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
