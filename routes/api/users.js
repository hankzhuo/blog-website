const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const password = require('passport');

// Load input validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');

//@route  GET api/users/test
//@desc   Tests users route
//@access Public
router.get('/test', (req, res) => {
	res.json({ msg: 'users success' });
});

//@route  POST api/users/register
//@desc   Register user
//@access Public
router.post('/register', (req, res) => {
	const { errors, isValid } = validateRegisterInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
	}

	User.findOne({ email: req.body.email }).then((user) => {
		if (user) {
      errors.email = 'Email already exists'
			return res.status(400).json(errors);
		} else {
			const avatar = gravatar.url(req.body.email, {
				s: '200', // size
				r: 'pg' // rate
			});
      
			const newUser = new User({
				name: req.body.name,
				email: req.body.email,
				avatar,
				password: req.body.password
			});
			// password bcrypt 密码加密
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newUser.password, salt, (err, hash) => {
					if (err) throw err;
					// 储存 hash 作为密码
					newUser.password = hash;
					newUser
						.save()
						.then((user) => {
							res.json(user);
						})
						.catch((err) => console.log(err));
				});
			});
		}
	});
});

//@route  POST api/users/login
//@desc   Login User / Return JWT token
//@access Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
  }
  
	const email = req.body.email;
	const password = req.body.password;

	// Find user by email
	User.findOne({ email }).then((user) => {
		if (!user) {
      errors.email = 'User not found'
			return res.status(404).json(errors);
		}

		// Check password 检查密码是否匹配
		bcrypt.compare(password, user.password).then((isMatch) => {
			if (isMatch) {
				// Login sucess return token 登陆成功，返回 token
				// token 前端可以使用 jwt-decode 解压出 payload 数据
				const payload = { id: user.id, name: user.name, avatar: user.avatar };
				jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
					res.json({
						success: true,
						token: 'Bearer ' + token
					});
				});
			} else {
        errors.password = 'Password incorrect'
				return res.status(400).json(errors);
			}
		});
	});
});

//@route  GET api/users/current
//@desc   Return current user
//@access Public
router.get('/current', password.authenticate('jwt', { session: false }), (req, res) => {
	res.json({
		id: req.user.id,
		name: req.user.id,
		email: req.user.email
	});
});

module.exports = router;
