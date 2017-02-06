document.addEventListener ('DOMContentLoaded', function (loadedEvent) {
	var e = document.getElementById ('rainbow'),
		numFrames = 11,
		anim = new CSSAnimator (),
		color = 0,
		focusIn = false;
		rainbow = ['red', 'green', 'blue'];


	e.addEventListener ('mouseover', function () {
		anim.animate (e, {'background-color': [rainbow[color % rainbow.length], numFrames, 'trig']});
	});

	e.addEventListener ('mouseout', function () {
		anim.animate (e, {'background-color': ['white', numFrames, 'trig']});
	});

	e.addEventListener ('mousedown', function (ev) {
		if (ev.which === 1) {
			focusIn = !focusIn;
			anim.animate (e, {'background-color': [rainbow[++color % rainbow.length], numFrames, 'trig'],
							  'border': [focusIn? '10px dotted black' : '0px solid white', numFrames, 'spring']});
		}
	});
});
