const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

router.post('/users', async (req, res) => {
	const user = new User(req.body);

	try {
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		await user.save();
		res.status(201).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post('/users/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findByCredentials(email, password);
		const token = await user.generateAuthToken();

		await user.save();
		res.send({ user, token });
	} catch (error) {
		res.status(400).send(error.message);
	}
});

router.post('/users/logout', auth, async (req, res) => {
	// req.user is populated by auth middleware
	// req.token is populated by auth middleware
	try {
		req.user.tokens = req.user.tokens.filter(token => {
			return token.token !== req.token;
		});
		await req.user.save();

		res.send(req.user);
	} catch (e) {
		res.status(500).send();
	}
});

router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];
	const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

	if (!isValidUpdate) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		const user = req.user;
		updates.forEach(update => (user[update] = req.body[update]));
		await user.save();
		res.send(user);

		// req.body is an object. req.body is originally json that is parsed by router.use(express.json()); on line 10.
		// new: true means the function should return the updated user
		// runValidators: true means the function should run validation for the update

		// const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true, useFindAndModify: false });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete('/users/me', auth, async (req, res) => {
	try {
		// const user = await User.findByIdAndDelete(req.user._id);
		// if (!user) {
		// 	return res.status(404).send();
		// }

		await req.user.remove();
		sendCancelationEmail(req.user.email, req.user.name);
		res.send(req.user);
	} catch (error) {
		if (error.name === 'CastError') {
			return res.status(400).send('Invalid Id');
		}

		res.status(500).send();
	}
});

const upload = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Only jpg, jpeg, and png files are allowed'));
		}

		cb(undefined, true);
	}
});

// prettier-ignore
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => { 
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
	req.user.avatar = buffer;

    await req.user.save()	
    res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

router.delete('/users/me/avatar', auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error();
		}

		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
	} catch (e) {
		res.status(404).send();
	}
});

module.exports = router;
