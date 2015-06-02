angular.module('filters', [])
.filter('nl2br', function() {
	return function(text) {
		if (typeof text === "string"){
			text = text.replace(/&/g, "&amp;");
			text = text.replace(/"/g, "&quot;");
			text = text.replace(/'/g, "&#039;");
			text = text.replace(/</g, "&lt;");
			text = text.replace(/>/g, "&gt;");
			return text.replace(/\n/g, '<br>');
		}else{
			return false;
		}
	};
})

.filter('limit', function() {
	return function(text, nb) {
		if (typeof text === "string"){
			if(text.length > nb){
				text = text.substr(0, nb - 3);
				text = text+" ...";
			}
			return text;
		}else{
			return false;
		}
	};
})