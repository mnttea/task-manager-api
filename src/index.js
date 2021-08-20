const express = require('express');
require('./db/mongoose');

const app = express();
const port = process.env.PORT;

// middleware must run before route handlers
// so it makes sense that middleware functions be placed above and before route handlers
// app.use((req, res, next) => {
// 	res.status(503).send('Site is currently down. Check back soon!');
// });

app.use(express.json());
app.use(require('./routers/user'));
app.use(require('./routers/task'));

app.listen(port, () => {
	console.log('Server is up on port ' + port);
});

// const Task = require('./models/task');
// const User = require('./models/user');

// const main = async () => {
// 	// We've taken a task and found its user
// 	// const task = await Task.findById('61007e8eca938259cc7db162');
// 	// await task.populate('user').execPopulate();
// 	// console.log(task.user);
// 	//
// 	// Now lets take a user and find its tasks
// 	// const user = await User.findById('61007e30ca938259cc7db15e');
// 	// await user.populate('tasks').execPopulate();
// 	// console.log(user.tasks);
// };

// main();
