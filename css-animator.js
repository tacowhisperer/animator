/**
 * CSS JavaScript Animator Framework
 * Tacowhisperer Productions
 *
 * This is a framework for making use of the generic animator, animator.js by Tacowhisperer Productions, with CSS in web design.
 * It allows for more control over how you want to animate the CSS properties of DOM elements, like accelerations, and it allows
 * for smooth transitions between any two valid CSS colors.
 *
 *
 *
 * Arguments:
 *     framesPerSecond - The target fps that all animations will be normalized towards (float or int). If none is given, 60 is
 *                       used.
 *
 *     queueAnimationsLim - The maximum number of animations that the animation queue should store at any point in time. Will
 *                          never be less than 1, and defaults to Infinity if none is given.
 *
 *
 *
 * Public Methods: (arguments) <method description> [return value]
 *
 *     animate - (element, transitions) <Animates the current (or given) CSS properties of element to the target CSS values given
 *                                       by the transitions object. See below for the transitions object structure> [this object]
 *
 *             Valid Transitions Object Structures (cssPropX is a valid CSS property, and "..." means "and so on"):
 *                 {cssProp0: [startingCSSValue, targetCSSValue, numberOfFrames, easingFunctionName], cssProp1: [...], ...}
 *                 {cssProp0: [startingCSSValue, "current", numberOfFrames, easingFunctionName], cssProp1: [...], ...}
 *                 {cssProp0: ["current", targetCSSValue, numberOfFrames, easingFunctionName], cssProp1: [...], ...}
 *                 {cssProp0: [targetCSSValue, numberOfFrames, easingFunctionName], cssProp1: [...], ...}
 *
 *                 {cssProp0: [startingCSSValue, targetCSSValue, numberOfFrames], cssProp1: [...], ...}
 *                 {cssProp0: [startingCSSValue, "current", numberOfFrames], cssProp1: [...], ...}
 *                 {cssProp0: ["current", targetCSSValue, numberOfFrames], cssProp1: [...], ...}
 *                 {cssProp0: [targetCSSValue, numberOfFrames], cssProp1: [...], ...}
 *
 *     thenAnimate - (element, transitions) <Animates and takes the same argument constructs as this.animate, but enqueues 
 *                                           transitions and does them in order instead of doing them concurrently> [this object]
 *
 *     stop - (element, cssProperties) <Stops element's cssProperties from animating. Stops all properties if none are given, and
 *                                      stops all properties of all elements if no arguments are provided.> [this object]
 *
 *     pause - (element, cssProperties) <Pauses element's cssProperties animations. Pauses all properties if none are given, and
 *                                       pauses all properties of all elements if no arguments are provided.> [this object]
 *
 *     play - (element, cssProperties) <Plays element's cssProperties animations if paused. Plays all paused properties if none
 *                                      are given, and plays all paused properties of all elements if no arguments are provided>
 *                                      [this object]
 *
 *     stopQueued - () <Stops the currently active enqueued animation, and clears the animation queue> [this object]
 *
 *     pauseQueued - () <Pauses the currently active enqueued animation, and prevents progression on the queue> [this object]
 *
 *     playQueued - () <Plays the currently active enqueued animation, and continues the enqueue-dequeue process> [this object]
 */
function CSSAnimator (framesPerSecond, queueAnimationsLim) {
    var animator = new Animator (typeof framesPerSecond == 'number'? framesPerSecond : 60),
        cssAnimationQueue = new CSSAnimationQueue (typeof queueAnimationsLim == 'number'? queueAnimationsLim : Infinity);

    // Used to differentiate between animators
    var CSS_ANIMATOR_ID = uniqueAnimatorIdentification ();

    // Used to keep track of all animations under an animation ID
    var animations = {};

    // Used to cast between different CSS unit types if applicable
    var cssUnitCaster = new CSSUnitCaster ();

    // Used to process CSS shorthand properties
    var cssInterpreter = new CSSInterpreter ();

    // The different animation transition types (interpolation transform functions)
    var TRANSFORMS = {

            // The value in is the value out. Simple.
            linear:             function (x) {return x},



            // Slower, gentle start to faster than linear halfway to slower, gentle finish
            trig:               function (x) {return 0.5 * (1 - Math.cos (Math.PI * x))},



            // Fast, sudden start to slower than linear halfway to fast, sudden finish
            arctrig:            function (x) {return Math.asin (2 * x - 1) / Math.PI + 0.5},



            // Slower than linear start to sudden spike halfway to slower than linear finish
            poly3:              function (x) {
                                    var c = 3, k = Math.pow (2, c - 1), H = 1 / 2;

                                    return k * Math.pow (x - H, c) + H;
                                },

            // Faster than linear start to sudden slowness halfway to faster than linear finish
            root3:              function (x) {
                                    var c = 3, k = Math.pow (2, (1 - c) / c), H = 1 / 2;

                                    return x <= H? -k * Math.pow (H - x, 1 / c) + H : k * Math.pow (x - H, 1 / c) + H;
                                },

            // Same as poly3, but more intense
            poly5:              function (x) {
                                    var c = 5, k = Math.pow (2, c - 1), H = 1 / 2;

                                    return k * Math.pow (x - H, c) + H;
                                },

            // Same as root3, but more intense
            root5:              function (x) {
                                    var c = 5, k = Math.pow (2, (1 - c) / c), H = 1 / 2;

                                    return x <= H? -k * Math.pow (H - x, 1 / c) + H : k * Math.pow (x - H, 1 / c) + H;
                                },

            // Same as poly5, but more intense
            poly7:              function (x) {
                                    var c = 7, k = Math.pow (2, c - 1), H = 1 / 2;

                                    return k * Math.pow (x - H, c) + H;
                                },

            // Same as root5, but more intense
            root7:              function (x) {
                                    var c = 7, k = Math.pow (2, (1 - c) / c), H = 1 / 2;

                                    return x <= H? -k * Math.pow (H - x, 1 / c) + H : k * Math.pow (x - H, 1 / c) + H
                                },

            // Super slow, gentle start, then sudden spike to finish
            'exp-hard':         function (x) {return (1 - Math.exp (9 * x)) / (1 - Math.exp (9))},


            // Like 'exp-hard', but less intense
            'exp-medium':       function (x) {return (1 - Math.exp (4 * x)) / (1 - Math.exp (4))},


            // Like 'exp-medium', but less intense
            'exp-soft':         function (x) {return (1 - Math.exp (x)) / (1 - Math.E)},


            // Super fast, abrupt start, then sudden drop to a gentle finish
            '-exp-hard':        function (x) {return (1 - Math.exp (-9 * x)) / (1 - Math.exp (-9))},


            // Like '-exp-hard', but less intense
            '-exp-medium':      function (x) {return (1 - Math.exp (-4 * x)) / (1 - Math.exp (-4))},


            // Like '-exp-medium', but less intense
            '-exp-soft':        function (x) {return (1 - Math.exp (-x)) / (1 - Math.exp (-1))},


            // Like '-exp-medium', but there is no sudden transition in speed from fast to slow
            'circular-hill':    function (x) {return Math.sqrt (1 - Math.pow (x - 1, 2))},


            // Like 'exp-medium', but there is no sudden transition in speed from slow to fast
            'circular-valley':  function (x) {return 1 - Math.sqrt (1 - x * x)},

            // Overshoots a bit from the target, then shifts back into place like a spring
            // credit: https://github.com/julianshapiro/velocity/blob/master/velocity.js
            spring:             function (x) {return 1 - (Math.cos (4.5 * Math.PI * x) * Math.exp (-6 * x))}
    };

    // A map of all valid CSS color keywords to their corresponding RGBA array
    var COLOR_MAP = {

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

    // https://developer.mozilla.org/en-US/docs/Web/CSS/number
    var ONE_CSS_NUMBER_PATTERN = /(^\-)?((\d+(\.\d+)?)|\.\d+)(e\-?\d+)?/i,
        ALL_CSS_NUMBER_PATTERN = /(^\-)?((\d+(\.\d+)?)|\.\d+)(e\-?\d+)?/gi; 

    // Used to keep track of animations and their group numbers if synchronous
    var idCounter = 0;


    /**
     * Animates the css properties for the document element as defined in the transitions object. Treats
     * each animation like it is a new one (thus allowing smooth back-and-forth animations)
     *
     * Transitions object format:
     *     transitions = {css0: [startVal, endVal, numFrames(, easing)], ...} ||
     *     transitions = {css0: ["current", endVal, numFrames(, easing)], ...} ||
     *     transitions = {css0: [endVal, numFrames(, easing)]}
     */
    this.animate = function (element, transitions) {
        var animationId;

        // Make the element and transitions object hard requirements
        if (element && transitions) {
            // Generate a unique ID for the new animation if one is not provided when called
            if (typeof element.customCSSAnimationIdentification != 'number') {
                animationId = idCounter++;
                element.customCSSAnimationIdentification = animationId;
            }

            // Adding the value directly to the element as a property allows for the method to be chainable (return this)
            animationId = element.customCSSAnimationIdentification;

            // Get every animation that is given in the transitions object
            var animationsForElement = {};
            for (var css in transitions) {
                var shortTransitions = cssInterpreter.interpret (css, transitions, element);

                // The current CSS property is shorthand, so work with the new object instead
                if (numKeysOf (shortTransitions) > 0) {
                    for (var shortCSS in shortTransitions) {
                        animator.addAnimation(generateAnimationObject (element, shortTransitions, shortCSS, animationId)).start();
                        animationsForElement[shortCSS] = shortTransitions[shortCSS];
                    }
                }

                else {
                    animator.addAnimation (generateAnimationObject (element, transitions, css, animationId)).start ();

                    // Don't accidentally override any shorthand that might have been extracted before
                    if (!animationsForElement[css])
                        animationsForElement[css] = transitions[css];
                }
            }

            // Update the animations mapped to the element
            animations[animationId] = animationsForElement;
        }

        return this;
    };

    // Same as this.animate, but pushes animations to a queue and waits until the previous group is done to start the next anims.
    this.thenAnimate = function (element, transitions) {
        if (element && transitions) {
            var animationsForElement = {};

            for (var css in transitions) {
                var shortTransitions = cssInterpreter.interpret (css, transitions, element);

                if (numKeysOf (shortTransitions) > 0) {
                    for (var shortCSS in shortTransitions)
                        animationsForElement[shortCSS] = shortTransitions[shortCSS];
                }

                else animationsForElement[css] = transitions[css];
            }

            cssAnimationQueue.push (element, animationsForElement);

            // Update the animator on the new active group
            if (cssAnimationQueue.updateAnimator)
                updateAnimatorOnTheAnimationQueue ();
        }

        return this;
    };

    // Stops all animations of the element like jQuery.stop () by removing the animations from the animator
    this.stop = function (element, cssProps) {
        cssAnimatorMethodWorker (element,
                                 cssProps || [],
                                 'removeAnimation',
                                 arguments.length,
                                 function (animationId) {delete animations[animationId]});

        return this;
    };

    // Pauses all animations for the given element if it exists in the animator
    this.pause = function (element, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'pauseAnimation', arguments.length);

        return this;
    };

    // Plays all animations for the given element if it exists in the animator
    this.play = function (element, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'playAnimation', arguments.length);
        
        return this;
    };

    // Flips the direction of the CSS animations associated with the given element
    this.flipAnimationOf = function (element, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'switchAnimationDirection', arguments.length);

        return this;
    };

    // Sets the state of all (or specified) CSS animations to the percentage given
    this.setAnimationStateTo = function (element, percentage, cssProps) {
        cssAnimatorMethodWorker (element, cssProps || [], 'setAnimationTo', arguments.length, null, percentage);

        return this;
    };

    // Stops all animations in the animation queue
    this.stopQueued = function () {
        cssAnimatorMethodEnqueuedWorker ('removeAnimation', []);
        cssAnimationQueue.clearQueue ();

        return this;
    };

    // Pauses all animations in the animation queue
    this.pauseQueued = function (cssProps) {
        cssAnimatorMethodEnqueuedWorker ('pauseAnimation', cssProps || []);

        return this;
    };

    // Plays all animations in the animation queue
    this.playQueued = function (cssProps) {
        cssAnimatorMethodEnqueuedWorker ('playAnimation', cssProps || []);

        return this;
    };

    // Same as this.flipAnimationOf, but for the actively enqueued animation group
    this.flipEnqueuedAnimation = function (cssProps) {
        cssAnimatorMethodEnqueuedWorker ('switchAnimationDirection', cssProps || []);

        return this;
    };

    // Same as this.setAnimationStateTo, but for the actively enqueued animation group
    this.setEnqueuedAnimationStateTo = function (percentage, cssProps) {
        cssAnimatorMethodEnqueuedWorker ('setAnimationTo', cssProps || [], percentage);

        return this;
    };

    // Modulates the main work of this.stop, this.pause, and this.play for the CSS Animator object
    function cssAnimatorMethodWorker (element, cssProps, animatorMethodName, callerArgsLength, callback, percentage) {
        // The user wanted to use the method only on a specific element
        if (callerArgsLength > 0) {
            // Only work with elements that have animations in the animator
            if (element && !Array.isArray (element) && typeof element.customCSSAnimationIdentification == 'number') 
                cssAnimatorMethodWorkerWorker (element.customCSSAnimationIdentification);
        }

        // Assume that the user wanted to perform the method on ALL animations found in the animator
        else {
            var ids = [];
            for (var identification in animations)
                ids.push (identification);

            // Not looping over animations because it's not a good idea to mutate an object that's being iterated over.
            for (var i = 0; i < ids.length; i++) 
                cssAnimatorMethodWorkerWorker (ids[i]);
        }

        // Worker for the worker. Worker-ception.
        function cssAnimatorMethodWorkerWorker (id) {
            var transitions = animations[id];

            if (transitions) {
                // Only work with the CSS properties given during method call
                if (cssProps.length) {
                    for (var i = 0; i < cssProps.length; i++) {
                        var animationName = animName (id, cssProps[i]);

                        if (animator.hasAnimation (animationName))
                            animator.start ()[animatorMethodName] (animationName, percentage);
                    }
                }

                // Unless none are specified, so work with all of them
                else {
                    for (var css in transitions) {
                        var animationName = animName (id, css);

                        if (animator.hasAnimation (animationName))
                            animator.start ()[animatorMethodName] (animationName, percentage);
                    }
                }

                if (typeof callback == 'function') callback (id);
            }
        }
    }

    // Modulates the main work of this.stopQueued, this.pauseQueued, and this.playQueued for the CSS Animator object
    function cssAnimatorMethodEnqueuedWorker (methodName, cssProps, percentage) {
        // There might not be an active group when called
        if (cssAnimationQueue.activeAnimationGroup) {
            var activeElement = cssAnimationQueue.activeAnimationGroup.getElement (),
                activeTransitions = cssAnimationQueue.activeAnimationGroup.getTransitions (),
                activeGroupId = cssAnimationQueue.activeAnimationGroup.getGroupId ();

            // Only work with the specified CSS properties if given
            if (Array.isArray (cssProps) && cssProps.length) {
                for (var i = 0; i < cssProps.length; i++) {
                    if (activeTransitions[cssProps[i]])
                        animator.start ()[methodName] (animName (null, cssProps[i], activeGroupId), percentage);
                }
            }

            // Do the method to all properties otherwise
            else {
                for (var css in activeTransitions)
                    animator.start ()[methodName] (animName (null, css, activeGroupId), percentage);
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

        var trans = extractTransitionsArray (transitions, css, START_VALUE, END_VALUE, NUM_FRAMES, EASING);

        // Because the initial value can be "current", get a valid css property to initialize the object
        var currentCSSValueStart = trans[START_VALUE] == 'current'? element.style[css] : trans[START_VALUE],
            currentCSSValueEnd = trans[END_VALUE] == 'current'? element.style[css] : trans[END_VALUE];
        

        var animation = {
            animationName: animName (animationId, css),
            startValue:    currentCSSValueStart,
            endValue:      currentCSSValueEnd,
            interpolator:  cssInterpolate,
            numFrames:     trans[NUM_FRAMES],
            updater:       function (el, cssProperty, s, e, id, interpolCSSValue) {el.style[cssProperty] = interpolCSSValue},

            interpolationTransform: TRANSFORMS[trans[EASING]]? TRANSFORMS[trans[EASING]] : TRANSFORMS.linear,

            onAnimationStart: function (el, cssProperty, sVal, e, id) {
                // Update screen DPI in case of user zoom or whatnot
                cssUnitCaster.updateDPI ();

                if (sVal !== 'current') el.style[cssProperty] = sVal;

                // Prevents regular animation calls from overriding enqueued animation calls
                animator.start ().playAnimation (animName (id, cssProperty));
            },

            onAnimationEnd:   function (el, cssProperty, s, endVal, id) {
                // Update screen DPI in case of user zoom or whatnot
                cssUnitCaster.updateDPI ();

                if (endVal !== 'current') el.style[cssProperty] = endVal;

                // Prevents regular animation calls from overriding enqueued animation calls
                animator.start ().pauseAnimation (animName (id, cssProperty));
            },
            
            updateArguments:  [element, css, trans[START_VALUE], trans[END_VALUE], animationId]
        };

        return animation;
    }

    // Generates an animation object of a given element and properties to animate for the animation queue
    function generateEnqueuedAnimationObject (element, transitions, css, groupId) {
        var START_VALUE = 0,
            END_VALUE = 1,
            NUM_FRAMES = 2,
            EASING = 3;

        var trans = extractTransitionsArray (transitions, css, START_VALUE, END_VALUE, NUM_FRAMES, EASING);

        // Because the initial value can be "current", get a valid css property to initialize the object
        var currentCSSValueStart = trans[START_VALUE] == 'current'? element.style[css] : trans[START_VALUE],
            currentCSSValueEnd = trans[END_VALUE] == 'current'? element.style[css] : trans[END_VALUE];


        var animation = {
            animationName: animName (null, css, groupId),
            startValue:    currentCSSValueStart,
            endValue:      currentCSSValueEnd,
            interpolator:  cssInterpolate,
            numFrames:     trans[NUM_FRAMES],
            updater:       function (el, cssProperty, s, e, gN, interpolCSSValue) {el.style[cssProperty] = interpolCSSValue},

            interpolationTransform: TRANSFORMS[trans[EASING]]? TRANSFORMS[trans[EASING]] : TRANSFORMS.linear,

            onAnimationStart: function (el, cssProperty, startValue, e, groupNumber) {
                // Update DPI in case of user zoom or whatnot
                cssUnitCaster.updateDPI ();

                if (startValue !== 'current')
                    el.style[cssProperty] = startValue;
            },

            onAnimationEnd:   function (el, cssProperty, s, endValue, groupNumber) {
                // Update DPI in case of user zoom or whatnot
                cssUnitCaster.updateDPI ();

                if (endValue !== 'current')
                    el.style[cssProperty] = endValue;

                cssAnimationQueue.pop (groupNumber);

                // Update the animator on the new active group
                if (cssAnimationQueue.updateAnimator)
                    updateAnimatorOnTheAnimationQueue ();
            },

            updateArguments: [element, css, trans[START_VALUE], trans[END_VALUE], groupId]
        };

        return animation;
    }

    // Updates the animation queue and the animator
    function updateAnimatorOnTheAnimationQueue () {
        // Remove the old animation group from the animator if it is currently present
        if (cssAnimationQueue.previousAnimationGroup) {
            var oldElement = cssAnimationQueue.previousAnimationGroup.getElement (),
                oldTransitions = cssAnimationQueue.previousAnimationGroup.getTransitions (),
                oldGroupId = cssAnimationQueue.previousAnimationGroup.getGroupId ();

            // Go through and remove all old animations from the animator
            for (var css in oldTransitions)
                animator.start ().removeAnimation (animName (null, css, oldGroupId));
        }

        // Animate the newly active animation group in the animator if one is present
        if (cssAnimationQueue.activeAnimationGroup) {
            var element = cssAnimationQueue.activeAnimationGroup.getElement (),
                transitions = cssAnimationQueue.activeAnimationGroup.getTransitions (),
                groupId = cssAnimationQueue.activeAnimationGroup.getGroupId ();

            // Go through and add all new animations to the animator
            for (var css in transitions)
                animator.start ().addAnimation (generateEnqueuedAnimationObject (element, transitions, css, groupId));
        }
    }

    // Lets the user specify less detailed animation properties
    function extractTransitionsArray (transitions, css, START_VALUE, END_VALUE, NUM_FRAMES, EASING) {
        var trans = [null, null, null, null];

        // [startValue, endValue, numFrames, easing]
        if (transitions[css].length == 4) {
            trans[START_VALUE] = transitions[css][0];
            trans[END_VALUE] = transitions[css][1];
            trans[NUM_FRAMES] = transitions[css][2];
            trans[EASING] = transitions[css][3];
        }

        else if (transitions[css].length == 3) {
            // [endValue, numFrames, easingName]
            if (typeof TRANSFORMS[transitions[css][2]] == 'function') {
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

        // Invalid transitions array
        else throw 'Invalid transitions object array, [' + ('' + transitions[css]).replace (/\s*,\s*/g, ', ') + '], given.';

        return trans;
    }

    /**
     * Interpolates 2 valid CSS units
     */
    function cssInterpolate (v0, v1, q) {
        var css0 = cssUnitCaster.colorCast (v0),
            css1 = cssUnitCaster.colorCast (v1);

        // This is going to be a color interpolation
        if (css0 && css1) 
            return rgbaInterpolate (css0, css1, q);

        // One value is a color and another value is a unit measurement
        else if (css0 || css1)
            throw 'CSS values must both be either unit measurements or color values';

        // Both values must be unit measurements of sorts
        else {
            var unitCastArray = cssUnitCaster.cast ('' + v0, '' + v1),
                v0Value = unitCastArray[0][0],
                v1Value = unitCastArray[1][0],
                vUnit = unitCastArray[0][1];

            // Do a linear interpolation of the values and return the value as a string with whatever unit is provided
            return ((1 - q) * v0Value + q * v1Value) + vUnit;
        }
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
        blueValue = blueValue < 0? 0 : blueValue;

        return 'rgba(' + redValue + ',' + greenValue + ',' + blueValue + ',' + alphaValue + ')';
    }

    // Helps distinguish CSS Animators from each other (assumes a synchronous browser)
    function cssAnimatorId (animationId) {return CSS_ANIMATOR_ID + '->' + animationId}

    // Removes the need to keep track of naming conventions
    function animName (animationId, cssProperty, groupId) {
        return cssAnimatorId ((arguments.length > 2? groupId + '->': animationId)) + '->' + cssProperty;
    }

    // Used to distinguish between different animator objects (assumes a synchronous web browser)
    function uniqueAnimatorIdentification () {return Date.now ()}

    // Used to find the length of a plain object
    function numKeysOf (obj) {
        if (Object.keys)
            return Object.keys (obj).length;

        var c = 0;
        for (var p in obj) {
            if (obj.hasOwnProperty (p))
                c++;
        }

        return c;
    }

    /**
     * Simple queue object. Typically taught in introductory computer science classes.
     */
    function Queue () {
        var queueArray = [];

        // Same as array.length
        this.length = queueArray.length;

        this.push = function (e) {
            queueArray.push (e);

            this.length = queueArray.length;

            return this;
        };

        this.pop = function (defaultValue) {
            var e;
            if (queueArray.length)
                e = queueArray.shift ();

            else if (arguments.length)
                e = defaultValue;

            else throw 'Error! Cannot pop from an empty queue.';

            this.length = queueArray.length;

            return e;
        };

        this.empty = function () {
            queueArray = [];

            this.length = queueArray.length;

            return this;
        };

        this.get = function (i) {return queueArray[i]};

        this.toString = function () {
            var s = '';

            for (var i = 0; i < queueArray.length; i++)
                s += i > 0? ', ' + queueArray[i] : queueArray[i];

            return  s;
        };
    }

    /**
     * A specially designed queue for this animator's purpose. Shouldn't be used outside the scope of this function...
     */
    function CSSAnimationQueue (limit) {
        // Without a queue, you can't call it a queue
        var queueObject = new Queue ();

        // Used to help tailor the number of animatios in the queue if memory might be an issue
        var QUEUE_SIZE_LIMIT = arguments.length > 0? limit <= 0? 1 : Math.ceil (limit) : Infinity;

        // Used to keep track of groupId values
        var groupIdValue = 0;

        // Used to differentiate between animation queues
        var QUEUE_ID = uniqueAnimationQueueIdentification ();

        // Used internally for bookeeping animation group statuses
        var ANIMATION_GROUP_STATUS_CLOSED = 'closed',
            ANIMATION_GROUP_STATUS_WORKING  = 'working',
            ANIMATION_GROUP_STATUS_FINISHED = 'finished';

        // Lets external functions operate directly on whatever transitions group should be active
        this.activeAnimationGroup = false;

        // Lets external functions remove the old active animation group from the animator
        this.previousAnimationGroup = false;

        // Flag that lets external functions know whether the animator should be updated on the active animation group or not.
        this.updateAnimator = false;

        // Initialize as queue length because false active group does not count. However, will generally be queue length + 1.
        this.length = 0 + queueObject.length;

        // Enqueues a new animation group from the element and transitions given during method call
        this.push = function (element, transitions) {
            var groupId = uniqueGroupIDValue (),
                animationGroup = new AnimationGroup (element, transitions, groupId);

            // Handle the 2 cases where there is nothing in the queue
            if (queueObject.length === 0) {
                // There is currently an active animation group, but nothing in the queue
                if (this.activeAnimationGroup) {
                    this.updateAnimator = false;
                    queueObject.push (animationGroup);

                    // Pushing the new animation group may have breached the queue limit, so cull the unlucky active animation
                    enforceQueueLimit ();
                }

                // There is no active animation group, AND nothing in the queue
                else {
                    this.updateAnimator = true;
                    this.activeAnimationGroup = animationGroup;
                    this.activeAnimationGroup.activate ();
                }
            }

            // Do standard queue business otherwise
            else {
                this.updateAnimator = false;
                queueObject.push (animationGroup);

                // Pushing the new animation group may have breached the queue limit, so cull the unlucky active animation
                enforceQueueLimit ();
            }

            // Update the length to reflect the number of animation groups in the queue, plus the active one
            this.length = 1 + queueObject.length;

            function enforceQueueLimit () {
                if (this.length + 1 > QUEUE_SIZE_LIMIT) {
                    this.updateAnimator = true;
                    this.previousAnimationGroup = this.activeAnimationGroup;
                    this.previousAnimationGroup.status = ANIMATION_GROUP_STATUS_CLOSED;

                    this.activeAnimationGroup = queueObject.pop ();
                    this.activeAnimationGroup.activate ();
                }
            }

            return groupId;
        };

        // Updates the num. of finished animations in the active group and dequeues the next active animation group if applicable
        this.pop = function (groupId) {
            if (this.activeAnimationGroup && this.activeAnimationGroup.getGroupId () === groupId) {
                // Update the animation group counter
                this.activeAnimationGroup.finishAnimation ();

                // Remove the currently active animation group in favor of the next group in the queue if finished
                if (this.activeAnimationGroup.status === ANIMATION_GROUP_STATUS_FINISHED) {
                    this.updateAnimator = true;
                    this.previousAnimationGroup = this.activeAnimationGroup;
                    this.previousAnimationGroup.status = ANIMATION_GROUP_STATUS_CLOSED;

                    this.activeAnimationGroup = queueObject.pop (false);
                    if (this.activeAnimationGroup) {
                        this.activeAnimationGroup.activate ();
                        this.length = 1 + queueObject.length;
                    }

                    else this.length = 0 + queueObject.length;
                }
            }

            else if (arguments.length) {
                var m0 = 'Out of sequence error: Attempted to pop from AnimationGroup#' + groupId + ' while ',
                    m1 = this.activeAnimationGroup? 'AnimationGroup#' + this.activeAnimationGroup.getGroupId () : 'no group';
                
                throw m0 + m1 + ' is currently active.';
            }

            return this;
        };

        // Used for emptying this CSS Animation queue
        this.clearQueue = function () {
            queueObject.empty ();

            // Reset publicly accessible variables to their default values
            this.activeAnimationGroup = false;
            this.previousAnimationGroup = false;
            this.updateAnimator = false;
            this.length = 0 + queueObject.length;

            return this;
        };

        // Used just in case any implementation might need more than one animation queue at a time
        function uniqueAnimationQueueIdentification () {return Date.now ()}
    
        // Used to uniquely generate a group ID value for every animation group stored in the Animation Queue
        function uniqueGroupIDValue () {return QUEUE_ID + '-' + (groupIdValue++)}

        /**
         * Helps abstract away some of the bookeeping necessary to keep the queue in order
         */
        function AnimationGroup (element, transitions, groupId) {
            var id = groupId,
                el = element,
                trans = transitions;

            // Counters used for determining animation group completion
            var numCSSProperties = 0,
                numCSSPropertiesDone = 0;

            // Count the number of css properties in the transtions object to know when it is finished
            for (var css in transitions) numCSSProperties++;

            // Prevents counters from being updated if it is not this animation group's turn on the queue
            var isActivated = false;

            
            // Publicly check the current animation's status
            this.status = ANIMATION_GROUP_STATUS_CLOSED;

            // Activates the group so that the internal counter may be updated without consequenses
            this.activate = function () {
                isActivated = true;
                this.status = ANIMATION_GROUP_STATUS_WORKING;

                return this;
            };

            // Updates the counter of CSS properties that have finished and sets the status appropriately
            this.finishAnimation = function () {
                if (isActivated) {
                    numCSSPropertiesDone++;

                    if (numCSSPropertiesDone >= numCSSProperties)
                        this.status = ANIMATION_GROUP_STATUS_FINISHED;
                }

                else throw 'Attempted to update AnimationGroup#' + id + ' before active. Check the animation queue.';

                return this;
            };

            // Getters for values fed during construction
            this.getElement = function () {return el}
            this.getTransitions = function () {return trans};
            this.getGroupId = function () {return id};

            // Used for debugging
            this.toString = function () {return 'AnimationGroup#' + id};
        }
    }

    /**
     * Casts common CSS units from their current value to "px"
     */
    function CSSUnitCaster () {
        var dpiObject = dpi ();

        // Maybe the user zooms in the page or something
        this.updateDPI = function () {
            dpiObject = dpi ();

            return this;
        };

        // Method for converting common CSS units to pixels if both CSS properties given do not have the same units
        this.cast = function (css1, css2) {
            // Cast css units to string if not already for regex matching to work
            css1 = '' + css1;
            css2 = '' + css2;

            // Extract the unit type associated with the CSS Property
            var css1Unit = css1.match (/\D+$/),
                css2Unit = css2.match (/\D+$/);

            // Neither value has units associated, so could be degrees or something
            if (!css1Unit && !css2Unit) {
                css1Unit = '';
                css2Unit = '';
            }

            // Assume that no unit for just 1 value means px
            else {
                css1Unit = css1Unit? css1Unit[0] : 'px';
                css2Unit = css2Unit? css2Unit[0] : 'px';
            }

            // Extract the number value given with the CSS Property
            var css1NumberValue = css1.match (ONE_CSS_NUMBER_PATTERN),
                css2NumberValue = css2.match (ONE_CSS_NUMBER_PATTERN);

            css1NumberValue = css1NumberValue? +css1NumberValue[0] : 0;
            css2NumberValue = css2NumberValue? +css2NumberValue[0] : 0;

            // Easy peasy - both units provided are the same
            if (css1Unit === css2Unit)
                return [[css1NumberValue, css1Unit], [css2NumberValue, css2Unit]];

            // Converts the number values of each unit to their respective pixel value
            function convertToPixel (unit, numberValue) {
                var u = unit,
                    n = numberValue;

                if (u === 'in')
                    return n * dpiObject.dpi;

                else if (u === 'cm')
                    return n * dpiObject.dpcm;

                else if (u === 'mm')
                    return n * dpiObject.dpcm / 10;

                else if (u === 'pt')
                    return n * dpiObject.dpi / 72;

                else if (u === 'pc')
                    return n * dpiObject.dpi / 6;


                // The current setup does not allow for elements to be passed to this function in a sensible way.
                var err2 = ' Use "' + u + '" for both CSS values to avoid this error.';

                if (u === 'em' || u === '%' || u === 'rem')
                    throw 'Cannot convert from "' + u + '" to "px" in any meaningful way.' + err2;

                else throw 'Unsupported unit convertion of "' + u + '" to "px".' + err2;
            }

            // Convert all other units to pixels
            return [[convertToPixel (css1Unit, css1NumberValue), 'px'], [convertToPixel (css2Unit, css2NumberValue), 'px']];
        };

        // Method for converting incoming css color values to RGBA arrays. Returns false if not a color
        this.colorCast = function (cssValue) {
            var css = cssValue.toLowerCase ();

            // CSS color keyword
            if (COLOR_MAP[css])
                return COLOR_MAP[css];

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
                var H = mod (+hslString.match (/\((\s|\t)*\d+(\.\d+)?(\s|\t)*,/)[0].replace (/\(|,/g, ''), 360);

                // Saturation and lightness
                var SL = hslString.match (/\d+%/g).map (function (p) {return +p.replace ('%', '') / 100}),
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

                return [Math.round(255 * (R_G_B_[0] + m)), Math.round(255 * (R_G_B_[1] + m)), Math.round(255 * (R_G_B_[2] + m))];
            }

            // Returns the expected values of modulus mathematics
            function mod (a, b) {return (b + (a % b)) % b}
        };

        // Method for checking if a CSS value is of a unit type (e.g. "5px", "3%", etc.)
        this.isUnit = function (cssValue) {
            var cssVal = '' + cssValue,
                number = cssVal.match (ONE_CSS_NUMBER_PATTERN),
                unit = cssVal.match (/\D+$/);

            return unit && number || number && +number[0] === 0;
        };

        // Does the same as this.colorCast, but does not convert the CSS value to an array
        this.isColor = function (cssValue) {
            var css = cssValue.toLowerCase ();

            // CSS color keyword
            if (COLOR_MAP[css])
                return true;

            // #rgb or #rrggbb notation
            else if (css.match (/^#/))
                return true;

            // rgb() notation
            else if (css.match (/rgb(\s|\t)*\(/)) 
                return true;

            // rgba() notation
            else if (css.match (/rgba(\s|\t)*\(/)) 
                return true;

            // hsl() notation
            else if (css.match (/hsl(\s|\t)*\(/)) 
                return true;

            // hsla() notation
            else if (css.match (/hsla(\s|\t)*\(/)) 
                return true;

            // Value fed is not a valid color
            else return false;
        };

        // https://github.com/ryanve/res/blob/master/res.js
        function dpi () {
            var one = {dpi: 96, dpcm: 96 / 2.54};

            var dppx = 0;

            if (window) 
                dppx = +window.devicePixelRatio;

            else if (screen && screen.deviceXDPI)
                dppx = Math.sqrt (screen.deviceXDPI * screen.deviceYDPI) / one.dpi;

            return {'dpi': dppx * one.dpi, 'dpcm': dppx * one.dpcm};
        }
    }

    /**
     * Interprets incoming CSS properties and de-composes them into more basic form if shorthand
     */
    function CSSInterpreter () {
        // Transitions array index values
        var START_VALUE = 0,
            END_VALUE = 1,
            NUM_FRAMES = 2,
            EASING = 3;

        // List of common CSS shorthands to quickly transition from one value to another
        var CSS_SHORTHAND_OF = {
            background: {
                /* Support for non-unit values not implemented yet
                'repeat-x': 'background-repeat',
                'repeat-y': 'background-repeat',
                repeat: 'background-repeat',
                space: 'background-repeat',
                round: 'background-repeat',
                'no-repeat': 'background-repeat',*/

                'color': 'background-color'
            },

            border: {
                /* Support for non-unit values not implemented yet
                none: 'border-style',
                hidden: 'border-style',
                dotted: 'border-style',
                dashed: 'border-style',
                solid: 'border-style',
                double: 'border-style',
                groove: 'border-style',
                ridge: 'border-style',
                inset: 'border-style',
                outset: 'border-style',*/

                'unit': 'border-width',
                'color': 'border-color'
            },

            'border-style': {
                'canonical-order': {
                    1: [['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style']],
                    2: [['border-top-style', 'border-bottom-style'], ['border-left-style', 'border-right-style']],
                    3: [['border-top-style'], ['border-left-style', 'border-right-style'], ['border-bottom-style']],
                    4: [['border-top-style'], ['border-right-style'], ['border-bottom-style'], ['border-left-style']]
                }
            },

            borderStyle: {
                'canonical-order': {
                    1: [['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style']],
                    2: [['border-top-style', 'border-bottom-style'], ['border-left-style', 'border-right-style']],
                    3: [['border-top-style'], ['border-left-style', 'border-right-style'], ['border-bottom-style']],
                    4: [['border-top-style'], ['border-right-style'], ['border-bottom-style'], ['border-left-style']]
                }
            },

            font: {
                'unit': 'font-size'
            },

            margin: {
                'canonical-order': {
                    1: [['margin-top', 'margin-right', 'margin-bottom', 'margin-left']],
                    2: [['margin-top', 'margin-bottom'], ['margin-left', 'margin-right']],
                    3: [['margin-top'], ['margin-left', 'margin-right'], ['margin-bottom']],
                    4: [['margin-top'], ['margin-right'], ['margin-bottom'], ['margin-left']]
                }
            },

            outline: {
                'unit': 'outline-width',
                'color': 'outline-color'
            },

            padding: {
                'canonical-order': {
                    1: [['padding-top', 'padding-right', 'padding-bottom', 'padding-left']],
                    2: [['padding-top', 'padding-bottom'], ['padding-left', 'padding-right']],
                    3: [['padding-top'], ['padding-left', 'padding-right'], ['padding-bottom']],
                    4: [['padding-top'], ['padding-right'], ['padding-bottom'], ['padding-left']]
                }
            }
        };

        // Decomposes shorthand CSS values like "border" into their CSS sub-components like "border-width", "border-style", etc.
        this.interpret = function (css, transitions, el) {
            var trans = extractTransitionsArray (transitions, css, START_VALUE, END_VALUE, NUM_FRAMES, EASING),
                tStrStart = '' + trans[START_VALUE],
                tStrEnd = '' + trans[END_VALUE];

            // Convert "current" string values to CSS values read straight from the DOM
            tStrStart = tStrStart === 'current'? el.style[css] : tStrStart;
            tStrEnd = tStrEnd === 'current'? el.style[css] : tStrEnd;

            var decomStart = decompositionOf (tStrStart),
                decomEnd = decompositionOf (tStrEnd),

                startLen = decomStart.length,
                endLen = decomEnd.length;

            // All of the new CSS values and transitions extracted from decomposing them are stored here
            var processedTrans = {};

            // Go through each extracted value of shorthand and create its simpler CSS property based off the master CSS list
            if (startLen === endLen && startLen > 1) {
                // Process both start and end shorthands and then send them to the animator
                checkShorthand (true);
                checkShorthand (false);
            }

            // Throw an error because both values should use shorthand if applicable
            else if (startLen !== endLen) 
                throw 'Start CSS shorthand length "' + tStrStart + '" does not equal end CSS shorthand length "' + tStrEnd + '"';

            function checkShorthand (isStart) {
                var decom = isStart? decomStart : decomEnd,
                    IDX = isStart? START_VALUE : END_VALUE;

                if (CSS_SHORTHAND_OF[css]) {
                    // The CSS shorthand given has canonical order, so order of values given matters
                    if (CSS_SHORTHAND_OF[css]['canonical-order']) {
                        // The user has given a valid number of canonical-order values
                        if (CSS_SHORTHAND_OF[css]['canonical-order'][decom.length]) {
                            var orderedCSSArray = CSS_SHORTHAND_OF[css]['canonical-order'][decom.length];

                            for (var i = 0; i < orderedCSSArray.length; i++) {
                                var parentCSSAssignedArray = orderedCSSArray[i];

                                for (var j = 0; j < parentCSSAssignedArray.length; j++) {
                                    if (!processedTrans[parentCSSAssignedArray[j]])
                                        processedTrans[parentCSSAssignedArray[j]] = shallowArrayClone (trans);

                                    processedTrans[parentCSSAssignedArray[j]][IDX] = decom[i];
                                }
                            }
                        }

                        // The user has given more values than the specification allows
                        else throw 'Too many values (' + decom.length + ') given for "' + css + '" shorthand.';
                    }

                    // Otherwise determine the unit type and attempt to find what CSS properties are associated with them
                    else {
                        for (var i = 0; i < decom.length; i++) {
                            // The ith decompositional value is a keyword for the CSS property (e.g. "dotted" for "border-style")
                            if (CSS_SHORTHAND_OF[css][decom[i]]) {
                                if (!processedTrans[CSS_SHORTHAND_OF[css][decom[i]]])
                                    processedTrans[CSS_SHORTHAND_OF[css][decom[i]]] = shallowArrayClone (trans);

                                processedTrans[CSS_SHORTHAND_OF[css][decom[i]]][IDX] = decom[i];
                            }

                            // The ith decompositional value is a color value (e.g. "#eee", "red", "rgba(255,255,255,0.5)", etc.)
                            else if (cssUnitCaster.isColor (decom[i])) {
                                if (CSS_SHORTHAND_OF[css].color) {
                                    if (!processedTrans[CSS_SHORTHAND_OF[css].color])
                                        processedTrans[CSS_SHORTHAND_OF[css].color] = shallowArrayClone (trans);

                                    processedTrans[CSS_SHORTHAND_OF[css].color][IDX] = decom[i];
                                }

                                else throw 'There is no color value associated with CSS property "' + css + '"';
                            }

                            // The ith decompositional value is a unit value (e.g. "3px", "4em", "1%", etc.)
                            else if (cssUnitCaster.isUnit (decom[i])) {
                                if (CSS_SHORTHAND_OF[css].unit) {
                                    if (!processedTrans[CSS_SHORTHAND_OF[css].unit])
                                        processedTrans[CSS_SHORTHAND_OF[css].unit] = shallowArrayClone (trans);

                                    processedTrans[CSS_SHORTHAND_OF[css].unit][IDX] = decom[i];
                                }

                                else throw 'There is no unit value associated with CSS property "' + css + '"';
                            }
                        }
                    }
                }

                else throw 'Unknown CSS shorthand property "' + css + '". Add to the CSS_SHORTHAND_OF object if applicable.';
            }

            return processedTrans;
        };

        // Splits incoming CSS values into their separate value (e.g. border: 1px solid black -> ["1px", "solid", "black"])
        function decompositionOf (cssValue) {
            // All non-whitespace matching regex pattern
            var COMMA_SEPARATION = /\s*,\s*/g,
                NON_WHITESPACE = /\S+/g;


            var decomposition = cssValue.replace (COMMA_SEPARATION, ',').match (NON_WHITESPACE);

            return decomposition? decomposition : [''];
        }

        // http://jsperf.com/new-array-vs-splice-vs-slice/113
        function shallowArrayClone (a) {
            var b = new Array (a.length),
                i = a.length;

            while (i--) b[i] = a[i];

            return b;
        }
    }
}
