const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'rodneyrhkk@gmail.com',
		subject: 'Thanks for joining in!',
		text: `Welcome to the the app, ${name}. Let me know how you get along with the app.`
		// use html for fancier emails with images
	});
};

const sendCancelationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'rodneyrhkk@gmail.com',
		subject: 'Sorry to hear about your cancelation!',
		text: `Hi ${name}, it is unfortunate that our services cannot provide more value. Can you help us by telling why you canceled? Thanks for your time.`
	});
};

module.exports = {
	sendWelcomeEmail,
	sendCancelationEmail
};
