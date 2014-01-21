MY SCYPHO

Technologies
========================
My Scypho is a responsive website based on Jekyll + Foundation 5 + Ember.js + Hammer.js

All views are created in Ember.js, which takes care of routing, views, controllers and models.
Ember.js uses Handlebars syntax for views. Views can be found in "_includes/handlebars".
Application routes and js views can be found in "_assets/javascript/ember"

Hammer.js adds gesture support and makes website faster on mobiles.
All styles are developed with SCSS.

Jekyll generates language-based static pages in "_site" folder.

Website is prepared for translation to other languages. All text can be found in "_i18n/sv.yml".
To activate other language please see "_config.yml"

Usage
========================
Generated website is located under "_site" folder.

If you want to change something, then you have to re-generate website.
Install jekyll och all required for it.
Then do following command to get all gems for project. (Jekyll is based on Ruby)
"bundle"

Update "baseurl" in "_config.yml"

And execute following command from root website directory. 
"sh _scripts/serv.sh"

Jekyll will generate new version of the website and update it in "_site" folder automatically. Then it will continue listen to other file updates and generate new code immediately.


API Requirements
========================

POST login
RESPONSE JSON Some user account info. Need to differ "first-login" user from the returning user

GET comfort periods
RESPONSE JSON Example
[
	{
		'days': [1, 2, 3, 4, 5],
		'periods': [{'start': '06:30', 'end': '08:00'}, {'start': '17:00', 'end': '22:00'}]
	},
	{
		'days': [6, 7],
		'periods': [{'start': '09:00', 'end': '22:00'}]
	}
]

GET statistics
RESPONSE JSON Example
{
	'comfort_temp': {
		id: 'comfort',
		label: "Trivseltemperatur",
		data: [[startHour, 21], [endHour, 21]] // [DATE, TEMPERATURE]
	},
	'mean_temp': {
		id: 'mean',
		fillBetween: 'comfort',
		color: '#93c272', // green
		label: "Medeltemperatur",
		lines: {show: true, fill: true},
		data: [[startHour, 18], [endHour, 18]]
	},
	'bedroom_temp': {
		fillBetween: 'comfort',
		lines: {show: true, fill: true},
		label: "Sovrum",
		data: [[startHour, 17], [endHour, 18]]
	},
	'living_temp': {
		fillBetween: 'comfort',
		lines: {show: true, fill: true},
		label: "Vardagsrum",
		data: [[startHour, 19], [endHour, 20]]
	}
}