const express = require('express');
const router = express.Router();

// Bring in Article Models
let Article = require('../models/article');
// User Model
let User = require('../models/user');

// Add Route
router.get('/add', ensureAuthenticated, (req, res) => {
	res.render('add_article', {
		title: 'Add Article'
	});
});

// Add Submit POST Route
router.post('/add', (req, res) => {
	req.checkBody('title', 'Title is required').notEmpty();
	// req.checkBody('author', 'author is required').notEmpty();
	req.checkBody('body', 'body is required').notEmpty();

	// Get Errors
	let errors = req.validationErrors();

	if (errors) {
		res.render('add_article', {
			title: 'Add Article',
			errors: errors
		});
	} else {
		let article = new Article();
		article.title = req.body.title;
		article.author = req.user._id;
		article.body = req.body.body;

		article.save((err) => {
			if (err) {
				console.log(err);
				return;
			} else {
				req.flash('success', 'Article Added');
				res.redirect('/');
			}
		});
	}
});

// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, function (req, res) {
	Article.findById(req.params.id, function (err, article) {
		if (article.author != req.user._id) {
			req.flash('danger', 'Not Authorized');
			res.redirect('/');
		}
		res.render('edit_article', {
			title: 'Edit Article',
			article: article
		});
	});
});

// Update Submit POST Route
router.post('/edit/:id', (req, res) => {
	let article = {};
	article.title = req.body.title;
	article.author = req.body.author;
	article.body = req.body.body;

	let query = { _id: req.params.id }

	Article.updateOne(query, article, function (err) {
		if (err) {
			console.log(err);
			return;
		} else {
			req.flash('success', 'Article Updated')
			res.redirect('/');
		}
	});
});

// Delete Article
router.delete('/:id', function (req, res) {
	if (!req.user._id) {
		res.status(500).send();
	}

	let query = { _id: req.params.id }

	Article.findById(req.params.id, function (err, article) {
		if (article.author != req.user._id) {
			res.status(500).send();
		} else {
			Article.remove(query, function (err) {
				if (err) {
					console.log(err);
				}
				res.send('Success');
			});
		}
	});
});

// Get Single Article
router.get('/:id', function (req, res) {
	Article.findById(req.params.id, (err, article) => {
		User.findById(article.author, (err, user) => {
			res.render('article', {
				article: article,
				author: user.name
			});
		});
	});
});

// Access Control
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		req.flash('danger', 'Please login');
		res.redirect('/users/login');
	}
}

module.exports = router;