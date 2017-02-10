document.addEventListener ('DOMContentLoaded', function (loadedEvent) {
	var e = document.getElementById ('rainbow'),
		numFrames = 120,
		anim = new CSSAnimator (),
		color = 0,
		rainbow = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo'],
		antiColor = Math.ceil ((rainbow.length - 1) / 2);


	e.addEventListener ('mouseover', function () {
		anim.animate (e, {'background-color': [rainbow[color % rainbow.length], numFrames, 'trig'],
						  'border': ['20px dotted ' + rainbow[antiColor % rainbow.length], numFrames, 'trig']});
	});

	e.addEventListener ('mouseout', function () {
		anim.animate (e, {'background-color': ['white', numFrames, 'trig'],
						  'border': ['0px solid rgba(255, 255, 255, 0)', numFrames, 'trig']});
	});

	e.addEventListener ('mousedown', function (ev) {
		if (ev.which === 1) {
			anim.animate (e, {'background-color': [rainbow[++color % rainbow.length], numFrames, 'trig'],
							  'border': ['10px dotted ' + rainbow[++antiColor % rainbow.length], numFrames, 'trig']});
		}
	});
});
