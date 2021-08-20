const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
	const taskData = {
		...req.body,
		user: req.user._id
	};
	const task = new Task(taskData);

	try {
		await task.save();
		res.status(201).send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

// GET /tasks?completed={boolean}
// GET /tasks?limit={number}&skip={number}
// GET /tasks?sortBy={createdAt:asc/desc}
router.get('/tasks', auth, async (req, res) => {
	const match = {};
	const sort = {};

	// req.query.completed will return a string
	if (req.query.completed) {
		match.completed = req.query.completed === 'true';
	}

	if (req.query.sortBy) {
		const parts = req.query.sortBy.split(':');
		// parts[0] could be createdAt/completed/etc...
		// parts[1] is the value
		sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
	}

	try {
		// 1st way: Find all tasks with matching user id
		// const tasks = await Task.find({ user: req.user._id });
		// res.send(tasks);

		// 2nd way: Find all tasks by using virtual
		// populate virtual property/field 'tasks'
		// then send the virtual property/field as the response
		await req.user
			.populate({
				path: 'tasks', // path is the property/field of the document to populate
				match,
				options: {
					// limit is the number of documents to show
					// skip is the number of documents to skip

					// ex: 10 documents in total
					// limit is 3 docuemnts
					// skip is 0 documents
					// result is showing the first 3 documents

					// limit is 3 documents
					// skip is 5 documents
					// result is showing 3 documents starting from the 6th document
					// reason is because the first 5 documents were skipped
					// then the next documents were shown until the limit reached 3

					limit: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort
				}
			})
			.execPopulate();
		res.send(req.user.tasks);
	} catch (error) {
		res.status(500).send();
	}
});

router.get('/task/:id', auth, async (req, res) => {
	const _id = req.params.id;

	try {
		// find a task filtered by _id and user id
		const task = await Task.findOne({ _id, user: req.user._id });

		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (error) {
		if (e.name === 'CastError') {
			return res.status(400).send('Invalid Id');
		}
		res.status(500).send();
	}
});

router.patch('/task/:id', auth, async (req, res) => {
	const _id = req.params.id;
	const updates = Object.keys(req.body);
	const allowedUpdates = ['description', 'completed'];
	const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

	if (!isValidUpdate) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		const task = await Task.findOne({ _id, user: req.user._id });

		if (!task) {
			return res.status(404).send();
		}

		updates.forEach(update => (task[update] = req.body[update]));
		await task.save();
		// const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true, useFindAndModify: false });

		res.send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete('/task/:id', auth, async (req, res) => {
	const _id = req.params.id;
	try {
		const task = await Task.findOneAndDelete({ _id, user: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (error) {
		if (error.name === 'CastError') {
			return res.status(400).send('Invalid Id');
		}
		res.status(500).send();
	}
});

module.exports = router;
