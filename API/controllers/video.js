module.exports.controller = function(app, router, config, modules, models, middlewares, sessions) {

	var hbjsProgress = {};

	var convertVideo = function(videoPath, videoExt, videoId, callback) {
		modules.hbjs.spawn({
				input: videoPath + "." + videoExt,
				output: videoPath + ".mp4",
				preset: "Normal"
			})
			.on("error", function(error) {
				return callback("Can't convert video");
			})
			.on("progress", function(progress) {
				console.log("Converting: %s % | ETA: %s", progress.percentComplete, progress.eta);
				hbjsProgress[videoId] = {
					percent: progress.percentComplete,
					eta: progress.eta
				};
			})
			.on("end", function() {
				hbjsProgress[videoId] = undefined;
				modules.fs.unlink(videoPath + "." + videoExt, function(error) {
					if (error) return callback(error);
					return callback();
				});
			});
	};

	/**
	 * GENERATE THUMBNAILS
	 **/
	var generateThumbnails = function(videoName, videoId, callback) {
		modules.ffmpeg(videoName)
			.takeScreenshots({
				filename: videoId + '.png',
				size: config.thumbnailsSize,
				count: 1,
				timemarks: ['20%']
			}, config.thumbnailsDirectory)
			.on('error', function(error) {
				return callback(error);
			})
			.on('end', function(files) {
				return callback();
			});
	};

	/**
	 * GET CONVERT PERCENT
	 **/
	router.get('/videos/getConvertPercent/:vid', function(req, res) {
		if (hbjsProgress[req.params.vid]) {
			return res.json({
				"success": true,
				"data": hbjsProgress[req.params.vid]
			});
		}
		return res.json({
			"success": true,
			"data": {
				percent: 100,
				eta: "00h00m00s"
			}
		});
	});

	/**
	 * DOWNLOAD VIDEO
	 **/
	router.get('/videos/download/:vid', function(req, res) {
		models.Video.findOne({
			_id: req.params.vid
		}).exec(function(error, video) {
			if (error) {
				return res.json({
					"success": false,
					"error": "Can't found this video."
				});
			}
			var videoPath = config.videoDirectory + "/" + video._id + "." + video.ext;
			var videoName = video.name + "." + video.ext;
			res.download(videoPath, videoName);
		});
	});

	/**
	 * VIEW VIDEO
	 **/
	router.get('/videos/play/:vid/:token', middlewares.getUser, middlewares.getIP, function(req, res) {
		models.Video.findOne({
			_id: req.params.vid
		}).exec(function(error, video) {
			if (error) {
				return res.json({
					"success": false,
					"error": "Can't found this video."
				});
			}
			var videoPath = config.videoDirectory + "/" + video._id + "." + video.ext;
			var videoName = video.name + "." + video.ext;
			res.download(videoPath, videoName);
			if (req.mewPipe.user) {
				models.View.findOne({
						_video: video._id,
						_user: req.mewPipe.user
					})
					.exec(function(error, view) {
						if (!view) {
							var newView = new models.View({
								_user: req.mewPipe.user,
								_video: video._id
							});
							newView.save(function(error, view) {
								return;
							});
						}
					});
			}
			if (req.mewPipe.IP) {
				models.View.findOne({
						_video: video._id,
						ipAddr: req.mewPipe.IP
					})
					.exec(function(error, view) {
						if (!view) {
							var newView = new models.View({
								ipAddr: req.mewPipe.IP,
								_video: video._id
							});
							newView.save(function(error, view) {
								return;
							});
						}
					});
			}
		});
	});


	/**
	 * GET VIDEO THUMBNAILS
	 **/
	router.get('/videos/thumbnails/:vid', function(req, res) {
		models.Video.findOne({
			_id: req.params.vid
		}).exec(function(error, video) {
			if (error) {
				return res.json({
					"success": false,
					"error": "Can't found this video."
				});
			}
			var thumbnailPath = config.thumbnailsDirectory + "/" + video._id + ".png";
			var thumbnailName = video.name + ".png";
			if (!modules.fs.existsSync(config.thumbnailsDirectory + "/" + video._id + ".png")) {
				return res.download(config.rootDirectory + "/img/no-thumbnails.png", thumbnailName);
			}
			res.download(thumbnailPath, thumbnailName);
		});
	});


	/**
	 * READ VIDEO
	 **/
	router.get('/videos/:vid', function(req, res) {
		models.Video.findOne({
				_id: req.params.vid
			})
			.select("-__v -archived")
			.populate("_user", "-accessToken -__v")
			.lean()
			.exec(function(error, video) {
				if (error) {
					return res.json({
						"success": false,
						"error": "Can't found this file."
					});
				}
				models.View.find({
						_video: video._id
					})
					.exec(function(error, views) {
						video.views = views.length;
						res.json({
							"success": true,
							"data": video
						});
					});
			});
	});


	/**
	 * UPLOAD Video File
	 **/
	router.post('/videos/upload', middlewares.checkAuth, function(req, res) {
		var tmp_path;
		var ext;
		modules.async.waterfall([
				// Check for errors in filename/size/extension
				function(callback) {
					modules.async.parallel({
							// Was a file sent
							one: function(subCall) {
								if (!req.files.file) return subCall("No video received");
								return subCall();
							},
							// Is the size too important
							two: function(subCall) {
								if (req.files.file.size > config.maxVideoSize) return subCall("Invalid video size (max 500mb)");
								return subCall();
							},
							// Is the name right
							three: function(subCall) {
								if (req.body.data.title == "undefined" || req.body.data.title === undefined || req.body.data.title.replace(/\s+/g, "") === "") {
									req.body.data.title = req.files.file.originalname.replace(/\.[^/.]+$/, "");
								}
								if (req.body.data.title == "/" ||  req.body.data.title === "") return subCall("Can't use this name");
								return subCall();
							},
							// Is the extension right
							four: function(subCall) {
								tmp_path = req.files.file.path;
								ext = tmp_path.split('.').pop().toLowerCase();
								if (!modules._.contains(config.videoAllowedExt, ext)) return subCall("Invalid video extension");
								return subCall();
							}
						},
						function(error) {
							if (error) return callback(error);
							return callback();
						});
				},
				// Create the video object
				function(callback) {
					var metadata = JSON.parse(req.body.data);
					var newVideo = new models.Video({
						_user: req.user._id,
						name: metadata.title,
						description: metadata.description,
						size: req.files.file.size,
						ext: "mp4",
						rights: metadata.rights,
						ready: false
					});
					newVideo.save(function(error, video) {
						if (error) return callback(error);
						return callback(null, video);
					});
				},
				// Move the file to its new folder
				function(video, callback) {
					video.pathNoExt = "/" + video._id;
					video.path = video.pathNoExt + "." + ext;
					var target_path = config.videoDirectory + video.path;
					var size = req.files.file.size;
					modules.fs.rename(tmp_path, target_path, function(error) {
						if (error) return callback(error);
						return callback(null, video);
					});
				},
				// Convert the video to mp4 if it isn't
				function(video, callback) {
					if (ext == "mp4") return callback(null, video);
					convertVideo(config.videoDirectory + video.pathNoExt, ext, video._id,
						function(error) {
							if (error) return callback(error);
							return callback(null, video);
						});
				},
				// Generate the thumbnails
				function(video, callback) {
					generateThumbnails(config.videoDirectory + video.pathNoExt + ".mp4", video._id, function(error) {
						if (error) return callback(error);
						return callback(null, video);
					});
				},
				// Set the video state to ready
				function(video, callback) {
					models.Video.update({
						_id: video._id
					}, {
						ready: true
					}, function() {
						return;
					});
					video.ready = true;
					return callback(null, video);
				}
			],
			//Display an error if there was one | Return the video otherwise
			function(error, video) {
				if (error) {
					return res.json({
						error: error
					});
				}
				video.archived = undefined;
				video.__v = undefined;
				return res.json({
					success: true,
					video: video
				});
			});
	});


	/**
	 * All public Videos
	 **/
	router.get('/videos', function(req, res) {
		models.Video.find({
				rights: "public"
			})
			.where("archived").ne(true)
			.where("ready").equals(true)
			.select("-__v -archived")
			.populate("_user", "-accessToken -__v")
			.sort("-created")
			.lean()
			.exec(function(error, videos) {
				if (error) {
					return res.json({
						"success": false,
						"error": error
					});
				}
				if (videos.length === 0) {
					res.json({
						"success": true,
						"data": videos
					});
				}
				var last = 0;
				var pushNbViews = function(count, i) {
					videos[i].views = count;
					last++;
					if (last >= videos.length) {
						res.json({
							"success": true,
							"data": videos
						});
					}
				};
				for (var i = 0; i < videos.length; i++) {
					models.View.find({
							_video: videos[i]._id
						})
						.exec(function(i, error, views) {
							pushNbViews(views.length, i);
						}.bind(models.View, i));
				}
			});
	});

	/**
	 * SEARCH VIDEO param=> q: keywords, sort: ['views', 'created', 'name'], page: number
	 **/
	router.post("/videos/search", function(req, res) {
		if (typeof req.body.page == "undefined") {
			req.body.page = 0;
		} else {
			if (isNaN(req.body.page)) {
				req.body.page = 0;
			}
		}
		if (typeof req.body.sort == "undefined") {
			req.body.sort = "-created";
		}
		if (req.body.sort == "-views") {
			var sortViews = true;
			req.body.sort = "-created";
		}
		if (typeof req.body.q == "undefined") {
			req.body.q = "";
		}
		var regExSearch = new RegExp(req.body.q, 'i');
		models.Video.find({
				rights: "public"
			})
			.where("archived").equals(false)
			.where("ready").equals(true)
			.populate("_user", "-accessToken -__v")
			.limit(config.itemsPerPage)
			.skip(config.itemsPerPage * req.body.page)
			.sort(req.body.sort)
			.or([{
				'name': {
					$regex: regExSearch
				}
			}, {
				'description': {
					$regex: regExSearch
				}
			}])
			.select("-__v -archived")
			.lean()
			.exec(function(error, videos) {
				if (error) {
					return res.json({
						success: false,
						error: "Une erreur est survenue."
					});
				}

				if (sortViews) {
					modules._.sortBy(videos, '-views');
				}

				modules.async.each(videos,
					function(video, callback) {
						models.View.count({
							_video: video._id
						}, function(error, count) {
							if (error) return callback(error);
							video.views = count;
							return callback();
						});
					},
					function(error) {
						if (error) {
							return res.json({
								error: error
							});
						}
						return res.json({
							success: true,
							data: videos
						});
					});
			});
	});

	/**
	 * LAST VIDEOS
	 **/
	router.get('/videos/last/:number', function(req, res) {
		if (isNaN(req.params.number)) {
			return res.json({
				"success": false,
				"error": "Invalid parameter."
			});
		}
		models.Video.find({
				rights: "public"
			})
			.where("archived").ne(true)
			.where("ready").equals(true)
			.select("-__v -archived")
			.populate("_user", "-accessToken -__v")
			.limit(req.params.number)
			.sort("-created")
			.lean()
			.exec(function(error, videos) {
				if (error) {
					return res.json({
						"success": false,
						"error": error
					});
				}
				if (videos.length == 0) {
					res.json({
						"success": true,
						"data": videos
					});
				}
				var last = 0;
				var pushNbViews = function(count, i) {
					videos[i].views = count;
					last++;
					if (last >= videos.length) {
						res.json({
							"success": true,
							"data": videos
						});
					}
				};
				for (var i = 0; i < videos.length; i++) {
					models.View.find({
							_video: videos[i]._id
						})
						.exec(function(i, error, views) {
							pushNbViews(views.length, i);
						}.bind(models.View, i));
				}
			});
	});

	/**
	 * VIDEO SUGGESTION
	 **/
	router.get('/user/videos/suggest', middlewares.checkAuth, function(req, res) {
		modules.async.waterfall([
			// Get the videos that the user has watched
			function(callback) {
				models.View.find({
					_user: req.user._id
				}, function(error, views) {
					if (error) return callback(error);
					var videoIds = [];
					views.forEach(function(view) {
						videoIds.push(view._video);
					});
					return callback(null, videoIds);
				});
			},
			// Get the user who have also watched these videos
			function(videoIds, callback) {
				models.View.where('_video').in(videoIds).exec(function(error, views) {
					if (error) return callback(error);
					var userIds = [];
					views.forEach(function(view) {
						if (view._user) userIds.push(view._user);
					});
					return callback(null, userIds);
				});
			},
			// Get the videos that all of those users have watched
			function(userIds, callback) {
				models.View.where('_user').in(userIds).populate('_video').exec(function(error, views) {
					if (error) return callback(error);
					var videoIds = [];
					views.forEach(function(view) {
						videoIds.push(view._video._id);
					});
					return callback(null, videoIds);
				});
			},
			// Group the videos by count
			function(videoIds, callback) {
				var videos = [],
					views = [],
					previous, i;

				videoIds.sort();
				for (i = 0; i < videoIds.length; i++) {
					if (videoIds[i] !== previous) {
						videos.push(videoIds[i]);
						views.push(1);
					} else {
						views[views.length - 1]++;
					}
					previous = videoIds[i];
				}
				var suggestedVideos = [];
				for (i = 0; i < videos.length; i++) {
					suggestedVideos.push({
						_id: videos[i],
						count: views[i]
					});
				}
				suggestedVideos = modules._.sortBy(suggestedVideos, 'count');
				suggestedVideos = suggestedVideos.reverse();
				return callback(null, suggestedVideos);
			},
			// Get the videos
			function(suggestedVideos, callback) {
				var videos = [];
				modules.async.each(suggestedVideos,
					function(suggestedVideo, subCallback) {
						models.Video.findById(suggestedVideo._id, function(error, video) {
							if (error) return subCallback(error);
							videos.push(video);
							return subCallback();
						});
					},
					function(error) {
						if (error) return callback(error);
						return callback(null, videos);
					});
			}
		], function(error, videos) {
			if (error) return res.send(error);
			return res.json({
				success: true,
				data: videos
			});
		});
	});

	/**
	 * READ USER'S VIDEOS
	 **/
	router.get('/videos/user/all', middlewares.checkAuth, function(req, res) {
		models.Video.find({
				_user: req.user._id
			})
			.where("archived").ne(true)
			.populate("_user", "-accessToken -__v")
			.select("-__v -archived")
			.sort("-created")
			.lean()
			.exec(function(error, videos) {
				if (error) {
					return res.json({
						"success": false,
						"error": error
					});
				}
				if (videos.length == 0) {
					res.json({
						"success": true,
						"data": videos
					});
				}
				var last = 0;
				var pushNbViews = function(count, i) {
					videos[i].views = count;
					last++;
					if (last >= videos.length) {
						res.json({
							"success": true,
							"data": videos
						});
					}
				};
				for (var i = 0; i < videos.length; i++) {
					models.View.find({
							_video: videos[i]._id
						})
						.exec(function(i, error, views) {
							pushNbViews(views.length, i);
						}.bind(models.View, i));
				}
			});
	});


	/**
	 * BROWSE VIDEO BY USER
	 **/
	router.get('/videos/user/:uid', function(req, res) {
		models.Video.find({
				rights: "public",
				_user: req.params.uid
			})
			.where("archived").ne(true)
			.where("ready").equals(true)
			.populate("_user", "-accessToken -__v")
			.select("-__v -archived")
			.lean()
			.exec(function(error, videos) {
				if (error) {
					return res.json({
						"success": false,
						"error": error
					});
				}
				if (videos.length == 0) {
					res.json({
						"success": true,
						"data": videos
					});
				}
				var last = 0;
				var pushNbViews = function(count, i) {
					videos[i].views = count;
					last++;
					if (last >= videos.length) {
						res.json({
							"success": true,
							"data": videos
						});
					}
				};
				for (var i = 0; i < videos.length; i++) {
					models.View.find({
							_video: videos[i]._id
						})
						.exec(function(i, error, views) {
							pushNbViews(views.length, i);
						}.bind(models.View, i));
				}
			});
	});


	/**
	 * UPDATE 
	 **/
	router.put("/videos/:vid", middlewares.checkAuth, function(req, res) {
		if (req.body.name && req.body.description && req.body.rights) {
			var editVideo = {
				name: req.body.name,
				description: req.body.description,
				rights: req.body.rights
			};
			models.Video.find({
					_id: req.params.vid
				})
				.select("-__v -archived")
				.where("archived").ne(true)
				.exec(function(error, video) {
					if (error) {
						return res.json({
							"success": false,
							"error": "Video not found."
						});
					}
					models.Video.update({
						_id: req.params.vid
					}, editVideo, function(error) {
						if (error) {
							if (config.debug == true) {
								console.log({
									"error_PUT_video": error
								});
							}
							return res.json({
								"success": false,
								"error": "An error occurred."
							});
						}
						return res.json({
							"success": true
						});
					});
				});
		} else {
			res.json({
				"success": false,
				"error": "All fields must be completed."
			});
		}
	});


	/**
	 * DELETE
	 **/
	router.delete('/videos/:vid', middlewares.checkAuth, function(req, res) {
		modules.async.waterfall([
			// Find the video
			function(callback) {
				models.Video.findOne({
					_id: req.params.vid,
					_user: req.user._id
				}, callback);
			},
			// Remove the video and its data
			function(video, callback) {
				modules.async.parallel([
					// Remove from the db
					function(SubCallback) {
						models.Video.remove({
							_id: video._id
						}, SubCallback);
					},
					// Remove the video
					function(SubCallback) {
						var videoPath = config.videoDirectory + "/" + video._id + "." + video.ext;
						modules.fs.unlink(videoPath, SubCallback);
					},
					// Remove the thumbnail
					function(SubCallback) {
						var thumbnailPath = config.thumbnailsDirectory + "/" + video._id + ".png";
						modules.fs.unlink(thumbnailPath, SubCallback);
					},
					// Remove the associated views
					function(SubCallback) {
						models.View.remove({
							_video: video._id
						}, SubCallback);
					}
				], function(error) {
					if (error) return callback(error);
					return callback();
				});
			}
		], function(error) {
			var success = true;
			if (error) success = false;
			return res.json({
				success: success,
				error: error
			});
		});
	});


	/**
	 * ARCHIVE
	 **/
	router.get('/videos/archive/:vid', middlewares.checkAuth, function(req, res) {

		modules.async.waterfall([
				function(callback) {
					models.Video.findOne({
						_id: req.params.vid,
						_user: req.user._id
					}, function(error, video) {
						if (error) return callback(error);
						if (!video) return callback("There is no video to archive");
						return callback(null, video);
					});
				},
				function(video, callback) {
					models.Video.update({
						_id: video._id
					}, {
						archived: true
					}, function(error) {
						if (error) return callback(error);
						return callback();
					});
				}
			],
			function(error) {
				var success = true;
				if (error) success = false;
				return res.json({
					success: success,
					error: error
				});
			});
	});
};