/**
 * CONFIG
 **/
var profile = "DEV"; // DEV / PROD
process.argv.forEach(function(arg) {
	if (arg == "PROD" ||  arg == "DEV") {
		profile = arg;
	}
});
var config = {
	ttlToken: 7200, //1H
	debug: profile == "DEV" ? true : false,
	salt: "$2a$10$sU3LKpiKHhQghEezTKuZnY",
	rootDirectory: __dirname,
	server: {
		address: profile == "DEV" ? 'localhost' : '176.31.167.154',
		port: profile == "DEV" ? '8080' : '80'
	},
	storageDirectory: __dirname + "/data",
	itemsPerPage: 10,
	profile: profile
};

// Video properties
config.thumbnailsDirectory = config.storageDirectory + "/thumbnails";
config.tmpDirectory = config.storageDirectory + "/.tmp";
config.videoAllowedExt = ["mp4", "avi", "mkv"];
config.maxVideoSize = 524288000;
config.thumbnailsSize = "300x?"; //Eg: 300x300, 300x?, ?x300
config.videoDirectory = config.storageDirectory + "/videos";

// oAuth properties
config.oauth = {
	google: {
		clientId: "444265549310-0cqu23ggpm4iag48o0rj8317llabq20q.apps.googleusercontent.com",
		clientSecret: "97UPguNB2WUeglkk3mKL7QHz"
	},
	facebook: {
		clientId: "887561407947127",
		clientSecret: "293d897f3e1f8134ba7f1e4f414cb38d"
	}
};

exports.config = config;