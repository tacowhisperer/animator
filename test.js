var e = document.body,
	e2 = document.getElementById('lga').firstChild,
	transF = {'background-color': ['rgb(66,133,244)', 45]},
	transF2 = {'padding-top': ['0px', 45, 'trig']},
	transB = {'background-color': ['white', 45]},
	transB2 = {'padding-top': ['113px', 45, 'trig']},
	transF3 = {'border': ['10px dotted black', 45, 'arctrig']},
	transB3 = {'border': ['0px solid white', 45, '-exp-medium']},
	transF4 = {'border-width': ['10px', 90, 'trig'], 'border-color': ['black', 10]},
	transB4 = {'border-width': ['0px', 90, 'trig'], 'border-color': ['white', 10]}
	cssAnimator = new CSSAnimator();

e.style.border = '0px solid white';
cssAnimator.thenAnimate (e, transF4).thenAnimate (e, transB4);
