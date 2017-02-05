document.addEventListener ('DOMContentLoaded', function (loadedEvent) {
	var e = document.getElementById ('rainbow'),
		numFrames = 11,
		anim = new CSSAnimator (),
		color = 0,
		rainbow = ['red', 'green', 'blue'];


	e.addEventListener ('mouseover', function () {
		anim.animate (e, {'background-color': [rainbow[color % rainbow.length], numFrames, 'trig']});
	});

	e.addEventListener ('mouseout', function () {
		anim.animate (e, {'background-color': ['white', numFrames, 'trig']});
	});

	e.addEventListener ('mousedown', function (ev) {
		anim.animate (e, {'background-color': [rainbow[color++ % rainbow.length], numFrames, 'trig']});
	});
});
