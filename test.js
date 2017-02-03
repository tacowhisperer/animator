var e = document.body,
	e2 = document.getElementById('lga').firstChild,
	transF = {'background-color': ['rgb(66,133,244)', 45]},
	transF2 = {'padding-top': ['0px', 45, 'trig']},
	transB = {'background-color': ['white', 45]},
	transB2 = {'padding-top': ['113px', 45, 'trig']},
	transF3 = {'border': ['10px dotted black', 45, 'arctrig']},
	transB3 = {'border': ['0px solid white', 45, '-exp-medium']},
	cssAnimator = new CSSAnimator();

e.style.border = '1px solid white';
cssAnimator.animate (e, transF3);
