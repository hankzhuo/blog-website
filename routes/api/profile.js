const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load input validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Model
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route  GET api/profile/test
//@desc   Tests profile route
//@access Public
router.get('/test', (req, res) => {
	res.json({ msg: 'profile success' });
});

//@route  GET api/profile
//@desc   Get current user profile
//@access Private

router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	Profile.findOne({ user: req.user.id })
		.populate('user', [ 'name', 'avatar' ]) // populate 把关联数据一起拿到
		.then((profile) => {
			if (!profile) {
				errors.profile = 'There is no profile for this user';
				return res.status(404).json(errors);
			}
			res.json(profile);
		})
		.catch((err) => {
			res.status(404).json(err);
		});
});

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public

router.get('/all', (req, res) => {
	const errors = {};

	Profile.find()
		.populate('user', [ 'name', 'avatar' ])
		.then((profiles) => {
			if (!profiles) {
				errors.noprofile = 'There are no profiles';
				return res.status(404).json(errors);
			}

			res.json(profiles);
		})
		.catch((err) => res.status(404).json({ profile: 'There are no profiles' }));
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public

router.get('/handle/:handle', (req, res) => {
	const errors = {};

	Profile.findOne({ handle: req.params.handle })
		.populate('user', [ 'name', 'avatar' ])
		.then((profile) => {
			if (!profile) {
				errors.noprofile = 'There is no profile for this user';
				res.status(404).json(errors);
			}

			res.json(profile);
		})
		.catch((err) => res.status(404).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

router.get('/user/:user_id', (req, res) => {
	const errors = {};

	Profile.findOne({ user: req.params.user_id })
		.populate('user', [ 'name', 'avatar' ])
		.then((profile) => {
			if (!profile) {
				errors.noprofile = 'There is no profile for this user';
				res.status(404).json(errors);
			}

			res.json(profile);
		})
		.catch((err) => res.status(404).json({ profile: 'There is no profile for this user' }));
});

//@route  POST api/profile
//@desc   Create user profile
//@access Private

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { errors, isValid } = validateProfileInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
	}

	const profileFileds = {};
	profileFileds.user = req.user.id;
	if (req.body.handle) profileFileds.handle = req.body.handle;
	if (req.body.company) profileFileds.company = req.body.company;
	if (req.body.website) profileFileds.website = req.body.website;
	if (req.body.location) profileFileds.location = req.body.location;
	if (req.body.bio) profileFileds.bio = req.body.bio;
	if (req.body.status) profileFileds.status = req.body.status;
	if (req.body.githubusername) profileFileds.githubusername = req.body.githubusername;
	// skills
	if (typeof req.body.skills !== 'undefined') {
		profileFileds.skills = req.body.skills.split(',');
	}

	// social
	profileFileds.social = {};
	if (req.body.youtube) profileFileds.social.youtube = req.body.youtube;
	if (req.body.twitter) profileFileds.social.twitter = req.body.twitter;
	if (req.body.linkedin) profileFileds.social.linkedin = req.body.linkedin;
	if (req.body.instagram) profileFileds.social.instagram = req.body.instagram;

	Profile.findOne({ user: req.user.id }).then((profile) => {
		if (profile) {
			// update
			Profile.findByIdAndUpdate({ user: req.user.id }, { $set: profileFileds }, { new: true }).then((profile) => {
				res.json(profile);
			});
		} else {
			// check if handle exists
			Profile.findOne({ handle: profileFileds.handle }).then((profile) => {
				if (profile) {
					errors.handle = 'That handle already exists';
					res.status(400).json(errors);
					return;
				}
				// save profile
				new Profile(profileFileds).save().then((profile) => res.json(profile));
			});
		}
	});
});

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { errors, isValid } = validateExperienceInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
	}

	Profile.findOne({ user: req.user.id }).then((profile) => {
		const newExp = {
			title: req.body.title,
			company: req.body.company,
			location: req.body.location,
			from: req.body.from,
			to: req.body.to,
			current: req.body.current,
			description: req.body.description
		};

		// Add to exp array
		profile.experience.unshift(newExp);

		profile.save().then((profile) => res.json(profile));
	});
});

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private

router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { errors, isValid } = validateEducationInput(req.body);

	if (!isValid) {
		return res.status(400).json(errors);
	}

	Profile.findOne({ user: req.user.id }).then((profile) => {
		const newEdu = {
			school: req.body.school,
			degree: req.body.degree,
			fieldofstudy: req.body.fieldofstudy,
			from: req.body.from,
			to: req.body.to,
			current: req.body.current,
			description: req.body.description
		};

		// Add to edu array
		profile.education.unshift(newEdu);

		profile.save().then((profile) => res.json(profile));
	});
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private

router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private

router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id})
    .then(() => {
      User.findOneAndRemove({ _id: req.user.id})
        .then(() => {
          res.json({ success: true })
        })
    })
})

module.exports = router;
