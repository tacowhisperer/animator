/**
 * CSS animator
 */
function CSSAnimator (framesPerSecond) {
    var FPS = typeof framesPerSecond == 'number'? framesPerSecond : 60,
        animator = new Animator (FPS),

    	// Used to differentiate between animators
    	cssAnimatorId = uniqueAnimatorIdentification (),

        // Used to keep track of all animations under an animation ID
        animations = {},

        // The different animation transition types (interpolation transform functions)
        transforms = {
            linear:            function (x) {return x},

            cosine:            function (x) {return 0.5 * (1 - Math.cos (Math.PI * x))},

            poly3:             function (x) {var c = 3, k = Math.pow (2, c - 1); return k * Math.pow (x - 1 / 2, c) + 1 / 2},

            root3:             function (x) {var c = 3, k = Math.pow (2, (1 - c) / c); return x <= 0.5? -k * Math.pow (1 / 2 - x, 1 / c) + 1 / 2 : k * Math.pow (x - 1 / 2, 1 / c) + 1 / 2},

            poly5:             function (x) {var c = 5, k = Math.pow (2, c - 1); return k * Math.pow (x - 1 / 2, c) + 1 / 2},

            root5:             function (x) {var c = 5, k = Math.pow (2, (1 - c) / c); return x <= 0.5? -k * Math.pow (1 / 2 - x, 1 / c) + 1 / 2 : k * Math.pow (x - 1 / 2, 1 / c) + 1 / 2},

            poly7:             function (x) {var c = 7, k = Math.pow (2, c - 1); return k * Math.pow (x - 1 / 2, c) + 1 / 2},

            root7:             function (x) {var c = 7, k = Math.pow (2, (1 - c) / c); return x <= 0.5? -k * Math.pow (1 / 2 - x, 1 / c) + 1 / 2 : k * Math.pow (x - 1 / 2, 1 / c) + 1 / 2},

            'exp-hard':        function (x) {return (1 - Math.exp (9 * x)) / (1 - Math.exp (9))},

            'exp-medium':      function (x) {return (1 - Math.exp (4 * x)) / (1 - Math.exp (4))},

            'exp-soft':        function (x) {return (1 - Math.exp (x)) / (1 - Math.E)},

            '-exp-hard':       function (x) {return (1 - Math.exp (-9 * x)) / (1 - Math.exp (-9))},

            '-exp-medium':     function (x) {return (1 - Math.exp (-4 * x)) / (1 - Math.exp (-4))},

            '-exp-soft':       function (x) {return (1 - Math.exp (-x)) / (1 - Math.exp (-1))},

            'circular-hill':   function (x) {return Math.sqrt (1 - Math.pow (x - 1, 2))},

            'circular-valley': function (x) {return 1 - Math.sqrt (1 - x * x)}
        },

        // A map of all valid CSS color keywords to their corresponding RGBA array
        colorMap = {

            // CSS Level 1
            black:   [  0,   0,   0, 1],
            silver:  [192, 192, 192, 1],
            gray:    [128, 128, 128, 1],
            white:   [255, 255, 255, 1],
            maroon:  [136,   0,   0, 1],
            red:     [255,   0,   0, 1],
            purple:  [128,   0, 128, 1],
            fuchsia: [255,   0, 255, 1],
            green:   [  0, 128,   0, 1],
            lime:    [  0, 255,   0, 1],
            olive:   [128, 128,   0, 1],
            yellow:  [255, 255,   0, 1],
            navy:    [  0,   0, 128, 1],
            blue:    [  0,   0, 255, 1],
            teal:    [  0, 128, 128, 1],
            aqua:    [  0, 255, 255, 1],

            // CSS Level 2
            orange: [255, 165, 0, 1],

            // CSS Level 3
            aliceblue:            [240, 248, 255, 1],
            antiquewhite:         [250, 235, 215, 1],
            aquamarine:           [127, 255, 212, 1],
            azure:                [240, 255, 255, 1],
            beige:                [245, 245, 220, 1],
            bisque:               [255, 228, 196, 1],
            blanchedalmond:       [255, 235, 205, 1],
            blueviolet:           [138,  43, 226, 1],
            brown:                [165,  42,  42, 1],
            burlywood:            [222, 184, 135, 1],
            cadetblue:            [ 95, 158, 160, 1],
            chartreuse:           [127, 255,   0, 1],
            chocolate:            [210, 105,  30, 1],
            coral:                [255, 127,  80, 1],
            cornflowerblue:       [100, 149, 237, 1],
            cornsilk:             [255, 248, 220, 1],
            crimson:              [220,  20,  60, 1],
            darkblue:             [  0,   0, 139, 1],
            darkcyan:             [  0, 139, 139, 1],
            darkgoldenrod:        [184, 134,  11, 1],
            darkgray:             [169, 169, 169, 1],
            darkgreen:            [  0, 100,   0, 1],
            darkgrey:             [169, 169, 169, 1],
            darkkhaki:            [189, 183, 107, 1],
            darkmagenta:          [139,   0, 139, 1],
            darkolivegreen:       [ 85, 107,  47, 1],
            darkorange:           [255, 140,   0, 1],
            darkorchid:           [153,  50, 204, 1],
            darkred:              [139,   0,   0, 1],
            darksalmon:           [233, 150, 122, 1],
            darkseagreen:         [143, 188, 143, 1],
            darkslateblue:        [ 72,  61, 139, 1],
            darkslategray:        [ 47,  79,  79, 1],
            darkslategrey:        [ 47,  79,  79, 1],
            darkturquoise:        [  0, 206, 209, 1],
            darkviolet:           [148,   0, 211, 1],
            deeppink:             [255,  20, 147, 1],
            deepskyblue:          [  0, 191, 255, 1],
            dimgray:              [105, 105, 105, 1],
            dimgrey:              [105, 105, 105, 1],
            dodgerblue:           [ 30, 144, 255, 1],
            firebrick:            [178,  34,  34, 1],
            floralwhite:          [255, 250, 240, 1],
            forestgreen:          [ 34, 139,  34, 1],
            gainsboro:            [220, 220, 220, 1],
            ghostwhite:           [248, 248, 255, 1],
            gold:                 [255, 215,   0, 1],
            goldenrod:            [218, 165,  32, 1],
            greenyellow:          [173, 255,  47, 1],
            grey:                 [128, 128, 128, 1],
            honeydew:             [240, 255,  24, 1],
            hotpink:              [255, 105, 180, 1],
            indianred:            [205,  92,  92, 1],
            indigo:               [ 75,   0, 130, 1],
            ivory:                [255, 255, 240, 1],
            khaki:                [240, 230, 140, 1],
            lavender:             [230, 230, 250, 1],
            lavenderblush:        [255, 240, 245, 1],
            lawngreen:            [124, 252,   0, 1],
            lemonchiffon:         [255, 250, 205, 1],
            lightblue:            [173, 216, 230, 1],
            lightcoral:           [240, 128, 128, 1],
            lightcyan:            [224, 255, 255, 1],
            lightgoldenrodyellow: [250, 250, 210, 1],
            lightgray:            [211, 211, 211, 1],
            lightgreen:           [144, 238, 144, 1],
            lightgrey:            [211, 211, 211, 1],
            lightpink:            [255, 182, 193, 1],
            lightsalmon:          [255, 160, 122, 1],
            lightseagreen:        [ 32, 178, 170, 1],
            lightskyblue:         [135, 206, 250, 1],
            lightslategray:       [119, 136, 153, 1],
            lightslategrey:       [119, 136, 153, 1],
            lightsteelblue:       [176, 196, 222, 1],
            lightyellow:          [255, 255, 224, 1],
            limegreen:            [ 50, 205,  50, 1],
            linen:                [250, 240, 230, 1],
            mediumaquamarine:     [102, 205, 170, 1],
            mediumblue:           [  0,   0, 205, 1],
            mediumorchid:         [186,  85, 211, 1],
            mediumpurple:         [147, 112,  21, 1],
            mediumseagreen:       [ 60, 179, 113, 1],
            mediumslateblue:      [123, 104, 238, 1],
            mediumspringgreen:    [  0, 250, 154, 1],
            mediumturquoise:      [ 72, 209, 204, 1],
            mediumvioletred:      [199,  21, 133, 1],
            midnightblue:         [ 25,  25, 112, 1],
            mintcream:            [245, 255, 250, 1],
            mistyrose:            [255, 228, 225, 1],
            moccasin:             [255, 228, 181, 1],
            navajowhite:          [255, 222, 173, 1],
            oldlace:              [253, 245, 230, 1],
            olivedrab:            [107, 142,  35, 1],
            orangered:            [255,  69,   0, 1],
            orchid:               [218, 112, 214, 1],
            palegoldenrod:        [238, 232, 170, 1],
            palegreen:            [152, 251, 152, 1],
            paleturquoise:        [175, 238, 238, 1],
            palevioletred:        [219, 112, 147, 1],
            papayawhip:           [255, 239, 213, 1],
            peachpuff:            [255, 218, 185, 1],
            peru:                 [205, 133,  63, 1],
            pink:                 [255, 192, 203, 1],
            plum:                 [221, 160, 221, 1],
            powderblue:           [176, 224, 230, 1],
            rosybrown:            [188, 143, 143, 1],
            royalblue:            [ 65, 105, 225, 1],
            saddlebrown:          [139,  69,  19, 1],
            salmon:               [250, 128, 114, 1],
            sandybrown:           [244, 164,  96, 1],
            seagreen:             [ 46, 139,  87, 1],
            seashell:             [255, 245, 238, 1],
            sienna:               [160,  82,  45, 1],
            skyblue:              [135, 206, 235, 1],
            slateblue:            [106,  90, 205, 1],
            slategray:            [112, 128, 144, 1],
            slategrey:            [112, 128, 144, 1],
            snow:                 [255, 250, 250, 1],
            springgreen:          [  0, 255, 127, 1],
            steelblue:            [ 70, 130, 180, 1],
            tan:                  [210, 180, 140, 1],
            thistle:              [216, 191, 216, 1],
            tomato:               [255,  99,  71, 1],
            turquoise:            [ 64, 224, 208, 1],
            violet:               [238, 130, 238, 1],
            wheat:                [245, 222, 179, 1],
            whitesmoke:           [245, 245, 245, 1],
            yellowgreen:          [154, 205,  50, 1],

            // CSS Level 4
            rebeccapurple: [102, 51, 153, 1],

            // The transparent keyword
            transparent: [0, 0, 0, 0]
        };

    // Used to keep track of animations
    var idCounter = 0;


    // Animates the css properties for the document element as defined in the transitions object. Treats
    // each animation like it is a new one (thus allowing smooth back-and-forth animations)

    // Transitions object format:
    //     transitions = {css0: [startVal, endVal, numFrames(, easing)], ...} ||
    //     transitions = {css0: ["current", endVal, numFrames(, easing)], ...} ||
    //     transitions = {css0: [endVal, numFrames(, easing)]}
    this.animate = function (element, transitions) {
        // Generate a unique ID for the new animation if one is not provided when called
    	if (typeof element.customCSSAnimationIdentification != 'number') {
        	animationId = idCounter++;
        	element.customCSSAnimationIdentification = animationId;
    	}

    	// Allows for the method to be chainable
    	animationId = element.customCSSAnimationIdentification;

        // Get every animation that is given in the transitions object
        var animationsForElement = {};
        for (var css in transitions) {
            animator.addAnimation (generateAnimationObject (element, transitions, css, animationId));
            animator.start ();


            // Store a shallow copy of the transitions object
            animationsForElement[css] = transitions[css];
        }

        // Update the animations mapped to the element
        animations[animationId] = animationsForElement;

        return this;
    };

    // Stops all animations of the element like jQuery.stop () by removing the animations from the animator
    this.stop = function (element, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'removeAnimation', function (animationId) {delete animations[animationId]});

        return this;
    };

    // Pauses all animations for the given element if it exists in the animator
    this.pause = function (element, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'pauseAnimation');

        return this;
    };

    // Plays all animations for the given element if it exists in the animator
    this.play = function (element, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'playAnimation');
        
        return this;
    };

    // Modulates the main work of this.stop, this.pause, and this.play for the CSS Animator object
    function cssAnimatorMethodWorker (element, cssProps, animatorMethodName, callback) {
        // Only work with elements that have animations in the animator
        if (element && typeof element.customCSSAnimationIdentification == 'number') {
            var animationsForElement = animations[element.customCSSAnimationIdentification];

            if (animationsForElement) {
                // Only work with the CSS properties given during method call
                if (cssProps.length) {
                    for (var i = 0; i < cssProps.length; i++) {
                        if (animator.hasAnimation (animName (element.customCSSAnimationIdentification, cssProps[i])))
                            animator[animatorMethodName] (animName (element.customCSSAnimationIdentification, cssProps[i]));
                    }
                }

                // Unless none are specified, so work with all of them
                else {
                    for (var css in animationsForElement) {
                        if (animator.hasAnimation (animName (element.customCSSAnimationIdentification, css)))
                            animator[animatorMethodName] (animName (element.customCSSAnimationIdentification, css));
                    }
                }

                if (callback) 
                    callback (element.customCSSAnimationIdentification)
            }
        }
    }

    // Generates an animation object for a given element and properties to animate
    function generateAnimationObject (element, transitions, css, animationId) {
        // Index values of the transitions object arrays (see this.animate for more details)
        var START_VALUE = 0,
            END_VALUE = 1,
            NUM_FRAMES = 2,
            EASING = 3;

        // Removes the need to do constant type checks of values see what was given from the user
        var trans = [null, null, null, null];

        console.log (transitions[css]);

        // [startValue, endValue, numFrames, easing]
        if (transitions[css].length == 4) {
            trans[START_VALUE] = transitions[css][0];
            trans[END_VALUE] = transitions[css][1];
            trans[NUM_FRAMES] = transitions[css][2];
            trans[EASING] = transitions[css][3];
        }

        else if (transitions[css].length == 3) {
            // [endValue, numFrames, easing]
            if (typeof transitions[css][2] == 'function') {
                trans[START_VALUE] = 'current';
                trans[END_VALUE] = transitions[css][0];
                trans[NUM_FRAMES] = transitions[css][1];
                trans[EASING] = transitions[css][2];
            }

            // [startValue, endValue, numFrames]
            else {
                trans[START_VALUE] = transitions[css][0];
                trans[END_VALUE] = transitions[css][1];
                trans[NUM_FRAMES] = transitions[css][2];
                trans[EASING] = false;
            }
        }

        // [endValue, numFrames]
        else if (transitions[css].length == 2) {
            trans[START_VALUE] = 'current';
            trans[END_VALUE] = transitions[css][0];
            trans[NUM_FRAMES] = transitions[css][1];
            trans[EASING] = false;
        }

        // Because the initial value can be "current", get a valid css property to initialize the object
        var currentCSSValueStart = trans[START_VALUE] == 'current'? element.style[css] : trans[START_VALUE],
        	currentCSSValueEnd = trans[END_VALUE] == 'current'? element.style[css] : trans[END_VALUE];
        
        // Assembly of the pieces to make the object to be fed to the animator
        var animation = {
            animationName: animName (animationId, css),
            startValue:    currentCSSValueStart,
            endValue:      currentCSSValueEnd,
            interpolator:  cssInterpolate,
            numFrames:     trans[NUM_FRAMES],
            updater:       function (el, cssProperty, s, e, intermittentCSSValue) {/*console.log(intermittentCSSValue); */el.style[cssProperty] = intermittentCSSValue},

            interpolationTransform: transforms[trans[EASING]]? transforms[trans[EASING]] : transforms.linear,
            onAnimationStart: function (el, cssProperty, startVal, e) {el.style[cssProperty] = startVal},
            onAnimationEnd: function (el, cssProperty, s, endVal) {el.style[cssProperty] = endVal},
            updateArguments: [element, css, trans[START_VALUE], trans[END_VALUE]]
        };

        return animation;
    }

    /**
     * Interpolates 2 valid CSS units
     */
    function cssInterpolate (v0, v1, q) {
        var css0 = cc (v0),
            css1 = cc (v1);

        // This is going to be a color interpolation
        if (css0 && css1) 
            return rgbaInterpolate (css0, css1, q);

        // One value is a color and another value is a unit measurement
        else if (css0 || css1)
            throw 'CSS values must both be either unit measurements or color values';

        // Both values must be unit measurements of sorts
        else {
            var v0Unit = v0.match (/\D+$/),
                v1Unit = v1.match (/\D+$/);

            v0Unit = v0Unit? v0Unit[0] : v0Unit;
            v1Unit = v1Unit? v1Unit[0] : v1Unit;

            // Units must be of the same type to have any meaning
            if (v0Unit != v1Unit)
            	throw 'CSS unit type mismatch: "' + v0Unit + '" vs "' + v1Unit + '"';

            // Do a linear interpolation of the values and return the value as a string with its unit if one is provided
            else {
            	var v0Value = +v0.match (/\d+(\.\d+)?/)[0],
            		v1Value = +v1.match (/\d+(\.\d+)?/)[0];

            	return ((1 - q) * v0Value + q * v1Value) + v0Unit;
            }
        }
    }

    // Interface for converting incoming css color values to RGBA arrays (color cast function)
    function cc (cssValue) {
        var css = cssValue.toLowerCase ();

        // CSS color keyword
        if (colorMap[css])
            return colorMap[css];

        // #rgb or #rrggbb notation
        else if (css.match (/^#/)) {
            var t = css.replace (/^#/, ''),
                rgb = t.length == 3? t.match (/[0-9a-f]/g).map (function (v) {return v + v}) : t.match (/[0-9a-f]{2}/g);

            // Convert each rgb hex value to decimal
            rgb = rgb.map (function (v) {return +('0x' + v)});

            // Append an alpha value of 1
            rgb.push (1);

            return rgb;
        }

        // rgb() notation
        else if (css.match (/rgb(\s|\t)*\(/)) {
            var rgb = false;

            // Percentage values
            rgb = css.match (/\d+(\.\d+)?%/g);

            // Integer values
            if (!rgb)
                rgb = css.match (/\d+/g);

            // Convert percentages to values
            else 
                rgb = rgb.map (function (p) {return Math.round (+p.replace ('%', '') * 2.55)});

            // Append an alpha value of 1
            rgb.push (1);

            return rgb
        }

        // rgba() notation
        else if (css.match (/rgba(\s|\t)*\(/)) {
            var rgba = false;

            // Percentage values
            rgba = css.match (/\d+(\.\d+)?%/g);

            // Integer values
            if (!rgba)
                rgba = css.match (/\d+/g);

            // Convert percentages to values
            else 
                rgba = rgb.map (function (p) {return Math.round (+p.replace ('%', '') * 2.55)});

            // Extract the alpha value from the rgba string
            var alpha = css.match (/,\s*\d+(\.\d+)?\s*\)/);

            alpha = alpha? +alpha[0].replace (/,|\)|\s/g, '') : 1;
            rgba[3] = alpha;

            return rgba;
        }

        // hsl() notation
        else if (css.match (/hsl(\s|\t)*\(/)) {
            var rgb = h2r (css);

            // Add the default solid color alpha channel value
            rgb.push (1);

            return rgb;
        }

        // hsla() notation
        else if (css.match (/hsla(\s|\t)*\(/)) {
            var rgba = h2r (css);

            // Add the alpha channel value
            var alpha = css.match (/,(\s|\t)*\d+(\.\d+)?(\s|\t)*\)/);
            alpha = alpha? +alpha[0].replace (/,|\)/g, '') : 1;
            rgba.push (alpha);

            return rgba;
        }

        // Value fed is not a valid color
        else return false;

        // Converts HSL to RGB
        function h2r (hslString) {
            // Hue degree
            var H = mod (+hslString.match (/\((\s|\t)*\d+(\.\d+)?(\s|\t)*,/)[0].replace (/\(|,/g, ''), 360),

            // Saturation and lightness
                SL = hslString.match (/\d+%/g).map (function (p) {return +p.replace ('%', '') / 100}),
                S = SL[0],
                L = SL[1];

            var C = (1 - Math.abs (2 * L - 1)) * S,
                X = C * (1 - Math.abs (mod ((H / 60), 2) - 1)),
                m = L - C / 2;

            var R_G_B_ = H < 60?
                            [C, X, 0] :

                         H < 120?
                            [X, C, 0] :

                         H < 180?
                            [0, C, X] :

                         H < 240?
                            [0, X, C] :

                         H < 300?
                            [X, 0, C] : [C, 0, X];

            return [Math.round (255 * (R_G_B_[0] + m)), Math.round (255 * (R_G_B_[1] + m)), Math.round (255 * (R_G_B_[2] + m))];
        }

        // Returns the expected values of modulus mathematics
        function mod (a, b) {return (b + (a % b)) % b}
    }

    /**
     * Interpolates 2 valid RGBA arrays at percent q through the CIE*Lab color space.
     *
     *
     * Arguments:
     *     c0 - Starting CSS RGBA array   // [0-255, 0-255, 0-255, 0-1]
     *
     *     c1 - Ending CSS RGBA array     // [0-255, 0-255, 0-255, 0-1]
     *
     *     q  - Percent (domain: [0, 1]) of linear interpolation through CIE*Lab color space
     *
     *
     * Returns:
     *     The interpolated CSS-valid RGBA string between c0 and c1 at percent q
     */
    function rgbaInterpolate (c0, c1, q) {
        var I = 0,
            RED    = I++,
            L_STAR = RED,

            GREEN  = I++,
            A_STAR = GREEN,

            BLUE   = I++,
            B_STAR = BLUE,

            ALPHA = I++;

        var p = 1 - q,
            r = Math.round,

            sL = x2L (r2X (c0)),
            eL = x2L (r2X (c1)),

            iL = p * sL[L_STAR] + q * eL[L_STAR],
            ia = p * sL[A_STAR] + q * eL[A_STAR],
            ib = p * sL[B_STAR] + q * eL[B_STAR],
            alphaValue = p * c0[ALPHA] + q * c1[ALPHA],

            iRGBA = x2R (l2X ([iL, ia, ib, alphaValue]));

        // Returns the array corresponding to the XYZ values of the input RGB array
        function r2X (rgb) {
            var R = rgb[0] / 255,
                G = rgb[1] / 255,
                B = rgb[2] / 255;

            R = 100 * (R > 0.04045? Math.pow ((R + 0.055) / 1.055, 2.4) : R / 12.92);
            G = 100 * (G > 0.04045? Math.pow ((G + 0.055) / 1.055, 2.4) : G / 12.92);
            B = 100 * (B > 0.04045? Math.pow ((B + 0.055) / 1.055, 2.4) : B / 12.92);

            var X = R * 0.4124 + G * 0.3576 + B * 0.1805,
                Y = R * 0.2126 + G * 0.7152 + B * 0.0722,
                Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

            return [X, Y, Z];
        }

        // Returns the array corresponding to the CIE-L*ab values of the input XYZ array
        function x2L (xyz) {
            var X = xyz[0] / 95.047,
                Y = xyz[1] / 100,
                Z = xyz[2] / 108.883,
                T = 1 / 3,
                K = 16 / 116;

            X = X > 0.008856? Math.pow (X, T) : (7.787 * X) + K;
            Y = Y > 0.008856? Math.pow (Y, T) : (7.787 * Y) + K;
            Z = Z > 0.008856? Math.pow (Z, T) : (7.787 * Z) + K;

            var L = (116 * Y) - 16,
                a = 500 * (X - Y),
                b = 200 * (Y - Z);

            return [L, a, b];
        }

        // Returns the array corresponding to the XYZ values of the input CIE-L*ab array
        function l2X (Lab) {
            var Y = (Lab[0] + 16) / 116,
                X = Lab[1] / 500 + Y,
                Z = Y - Lab[2] / 200,
                K = 16 / 116;

            X = 95.047 * ((X * X * X) > 0.008856? X * X * X : (X - K) / 7.787);
            Y = 100 * ((Y * Y * Y) > 0.008856? Y * Y * Y : (Y - K) / 7.787);
            Z = 108.883 * ((Z * Z * Z) > 0.008856? Z * Z * Z : (Z - K) / 7.787);

            return [X, Y, Z];
        }

        // Returns the array corresponding to the RGB values of the input XYZ array
        function x2R (xyz) {
            var X = xyz[0] / 100,
                Y = xyz[1] / 100,
                Z = xyz[2] / 100,
                T = 1 / 2.4;

            var R = X *  3.2406 + Y * -1.5372 + Z * -0.4986,
                G = X * -0.9689 + Y *  1.8758 + Z *  0.0415,
                B = X *  0.0557 + Y * -0.2040 + Z *  1.0570;

            R = 255 * (R > 0.0031308? 1.055 * Math.pow (R, T) - 0.055 : 12.92 * R);
            G = 255 * (G > 0.0031308? 1.055 * Math.pow (G, T) - 0.055 : 12.92 * G);
            B = 255 * (B > 0.0031308? 1.055 * Math.pow (B, T) - 0.055 : 12.92 * B);

            return [R, G, B];
        }

        var redValue = r(iRGBA[RED]),
            greenValue = r(iRGBA[GREEN]),
            blueValue = r(iRGBA[BLUE]);

        redValue = redValue < 0? 0 : redValue;
        greenValue = greenValue < 0? 0 : greenValue;
        blueValue = blueValue < 0? 0 : greenValue;

        return 'rgba(' + redValue + ',' + greenValue + ',' + blueValue + ',' + alphaValue + ')';
    }

    // Helps distinguish CSS Animators from each other (assumes a synchronous browser)
    function cssAnimatorIdentifier (animationId) {return cssAnimatorId + '-' + animationId}

    // Removes the need to keep track of naming conventions
    function animName (animationId, cssProperty) {return cssAnimatorIdentifier (animationId) + '-' + cssProperty}

    // Used to distinguish between different animator objects (assumes a synchronous web browser)
    function uniqueAnimatorIdentification () {return Date.now ()}
}
