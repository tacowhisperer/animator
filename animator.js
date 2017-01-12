/**
 * Generic animator object that allows for easy, custom manipulations of values from one state to another. Animations can be tai-
 * lored based on options that can (and must) be provided through an object.
 *
 * Note that animations will be normalized to a default value of 60fps, but that can be changed during construction through the
 * only argument accepted.
 *
 *
 *
 * Arguments:
 *     framesPerSecond - The target fps that all animations will be normalized towards (float or int)
 *
 *
 *
 * Public Methods: (arguments) <method description> [return value]
 *
 *     start - () <Starts the animator's main loop> [this object]
 *
 *     pause - () <Stops the animator's main loop without pausing any animation timers> [this object]
 *
 *     pauseAll - () <Stops the animator's main loop, and pauses all animations as well> [this object]
 *
 *     play  - (replayAnims) OR (anim1, anim2, ..., anim_n) <Starts the animator's main loop and unpauses any animations fed as an
 *                                                           array (replayAnims) or arbitrary animaation names as args> [this obj]
 *
 *     addAnimation - (animationProps) <See below for the animationProps plain object details> [this object]
 *                  Required Animation Properties:
 *                      animationName - String of the name of the animation
 *
 *                      startValue    - Starting value of the data to be animated
 *
 *                      endValue      - Ending value of the data to be animated
 *
 *                      interpolator  - Function that interpolates the starting and ending values. Arguments are provided
 *                                      in the following order: (startValue, endValue, p).
 *                                      The p argument is a number value in [0, 1] generated from within the animator to
 *                                      determine how far along the animation is complete.
 *
 *                      updater       - Function that gets called every time the animator is finished calculating frames.
 *                                      It uses the arguments provided in the updateArgs array (if provided), along with
 *                                      the last (rightmost) argument being the return value of the interpolator function
 *                                      (not to be confused with the interpolation transform function).
 *
 *                  Optional Animation Properties:
 *                      animateNegatively      - True if the animation should animate negatively (1 -> 0), false otherwise.
 *                                               Defaults to false if not provided.
 *
 *                      interpolationTransform - Function that transforms the p argument of the interpolator to another
 *                                               value in [0, 1]. Example: function (v) {return 1 - Math.sqrt (1 - v * v)}
 *
 *                      isActive         - True if the animation should be updated in the main loop, false otherwise.
 *                                         Defaults to true.
 *
 *                      isSymmetric      - Specifies whether the animation transform should play in the same speed order when
 *                                         animating forward vs animating backward. For example, if an animation transform is
 *                                         slow, then fast when going forward, it should be equally slow, then fast when
 *                                         animating backward. Defaults to true.
 *
 *                      onAnimationStart - Function called when the animation is at 0% (even when starting). Is only called once
 *                                         each time the animation is at this percentage. Uses the same argument array as the
 *                                         updater.
 *
 *                      onAnimationEnd   - Function called when the animation is at 100% (even when starting). Is only called
 *                                         once each time the animation is at this percentage. Uses the same argument array as
 *                                         the updater.
 *
 *                      updateArguments  - Additional arguments that will be applied to the updater function for that function's
 *                                         use. Note that there is no need to account for the output of the interpolator function
 *                                         as this value is appended to the rightmost position internally.
 *
 *     hasAnimation - (animationName) <Tests whether an animation is in the animator or not> [Boolean value]
 *
 *     removeAnimation - (animationName) <Removes the animation from the animator if it exists. Does nothing otherwise> [this obj]
 *
 *     playAnimation   - (animationName) <Allows an animation to be updated in the main loop> [this object]
 *
 *     pauseAnimation  - (animationName) <Does not allow an animation to be updated in the main loop> [this object]
 *
 *     setAnimationForward  - (animationName) <Makes the animation be interpolated positively (0 -> 1)> [this object]
 *
 *     setAnimationBackward - (animationName) <Makes the animation be interpolated negatively (1 -> 0)> [this object]
 *
 *     switchAnimationDirection - (animationName) <Makes the animation be interpolated in the opposite direction of its current state> [this object]
 *
 *     resetAnimation - (animationName) <Sets the animation to the 0% state> [this object]
 *
 *     endAnimation   - (animationName) <Sets the animation to the 100% state> [this object]
 *
 *     updateAnimationArgsArray - (animationName, newUpdateArgs) <Re-points the update arguments to the new args array> [this obj]
 *
 *     updateUpdateFunction     - (animationName, newUpdateFunction) <Re-points the updater to newUpdateFunction> [this object]
 *
 *     updateOnStart - (animationName, newOnStart) <Updates the animation's onStart callback function> [this object]
 *
 *     updateOnEnd   - (animationName, newOnEnd) <Updates the animation's onEnd callback function> [this object]
 */
function Animator (framesPerSecond) {
    // Used to keep track of all animations added via the addAnimation method
    var animations = {},

        // Frames per second for the frame generators
        FPS = arguments.length? framesPerSecond : 60,

        // Used to prevent the start method from applying more than once
        animatorIsStarted = false,

        // Used to continue the internal loop (or not) via the start, play, and pause methods
        continueLooping = false;

    function mainLoop () {
        // Update each animation
        for (var anim in animations) {
            var a = animations[anim], fG = a.frameGenerator;

            // Start the frame generator if it is not already started
            if (!fG.isStarted ())
                fG.start ();

            // Only update values if the animation is not paused
            if (a.isActive && !fG.isPaused ()) {
                var uA = a.updateArguments,
                    p = fG.next (a.animationDirection).percent ();

                // Reflects the animation transform if the animation should be symmetric
                if (!a.animationDirection && a.isSymmetric) {
                    if (a.experiencedDirectionChange) {

                        // Patches the discontinuity from flipping the animation in linear time
                        var xStar = fG.calculateXStar (a.interpolationTransform, true);
                        fG.revertToPercentage (xStar);
                        uA[uA.length - 1] = a.interpolator (a.endValue, a.startValue, a.interpolationTransform (1 - xStar));
                    
                        a.experiencedDirectionChange = false;
                    }

                    else uA[uA.length - 1] = a.interpolator (a.endValue, a.startValue, a.interpolationTransform (1 - p));
                }
            
                // Reflects the animation transform for either a symmetric or asymmetric animation
                else {
                    if (a.experiencedDirectionChange && a.isSymmetric) {

                        // Patches the discontinuity from flipping the animation in linear time
                        var xStar = fG.calculateXStar (a.interpolationTransform, false);
                        fG.revertToPercentage (xStar);
                        uA[uA.length - 1] = a.interpolator (a.startValue, a.endValue, a.interpolationTransform (xStar));

                        a.experiencedDirectionChange = false;
                    }

                    else uA[uA.length - 1] = a.interpolator (a.startValue, a.endValue, a.interpolationTransform (p));
                }

                // Call the updater to do whatever it needs to do
                a.updater.apply (a.updater, uA);

                // Clear the interpolated value because it will no longer be used
                uA[uA.length - 1] = null;
            }
        }

        // Continue looping if necessary
        if (continueLooping)
            continueLooping = requestAnimationFrame (mainLoop);
    }

    // Adds an animation object to the animator
    this.addAnimation = function (animationProps) {
        animations[animationProps.animationName] = {};

        var anim = animations[animationProps.animationName];

        // Animation values extracted from the animationProps object
        anim.isActive               = typeof animationProps.isActive == 'boolean'? animationProps.isActive : true;
        anim.animationDirection     = !!animationProps.animateNegatively;
        anim.startValue             = animationProps.startValue;
        anim.endValue               = animationProps.endValue;
        anim.interpolator           = animationProps.interpolator;
        anim.updater                = animationProps.updater;
        anim.interpolationTransform = animationProps.interpolationTransform || function (v) {return v};
        anim.updateArguments        = animationProps.updateArguments? animationProps.updateArguments : [];
        anim.isSymmetric            = typeof animationProps.isSymmetric == 'boolean'? animationProps.isSymmetric : true;

        anim.onAnimationStart       = animationProps.onAnimationStart? animationProps.onAnimationStart : function () {};
        anim.onAnimationEnd         = animationProps.onAnimationEnd? animationProps.onAnimationEnd : function () {};

        // Powers each individual animation without cluttering the main object
        anim.frameGenerator = new FrameGenerator (animationProps.numFrames,
                                                  anim.onAnimationStart,
                                                  anim.onAnimationEnd,
                                                  anim.updateArguments);
        
        // For internal use in making animation direction changes fluid
        anim.experiencedDirectionChange    = false;
        anim.initializedADirectionToChange = false;
        anim.previousDirectionWasForward   = false;

        // Append the placeholder for the output of the interpolator
        anim.updateArguments.push (null);

        // Pause the frame generator if the animation should not be active yet
        if (!anim.isActive)
            anim.frameGenerator.pause ();

        return this;
    };

    // Tests whether an animation exists or not in the animator
    this.hasAnimation = function (animationName) {
        if (animations[animationName])
            return true;

        return false;
    };

    // Removes an animation from the animations object
    this.removeAnimation = function (animationName) {
        if (animations[animationName]) {
            // Delete each sub-property to prevent memory leakage
            for (var prop in animations[animationName])
                delete animations[animationName][prop];

            // Delete the main property and call it history
            delete animations[animationName];
        }

        return this;
    };

    // Allows an animation to be updated in the main loop. Does nothing otherwise.
    this.playAnimation = function (animationName) {
        var animation = animations[animationName];

        if (animation && animation.frameGenerator.isPaused ()) {
            animation.isActive = true;
            animation.frameGenerator.unpause ();
        }

        return this;
    };

    // Stops an animation from being updated in the main loop. Does nothing otherwise.
    this.pauseAnimation = function (animationName) {
        var animation = animations[animationName];

        if (animation && !animation.frameGenerator.isPaused ()) {
            animation.isActive = false;
            animation.frameGenerator.pause ();
        }

        return this;
    };

    // Makes the animation's direction positive. Does nothing otherwise.
    this.setAnimationForward = function (animationName) {
        var animation = animations[animationName];

        if (animation) {
            animation.animationDirection = true;

            if (animation.initializedADirectionToChange && !animation.previousDirectionWasForward)
                animation.experiencedDirectionChange = true;

            else animation.initializedADirectionToChange = true;

            animation.previousDirectionWasForward = true;
        }

        return this;
    };

    // Makes the animation's direction negative. Does nothing otherwise.
    this.setAnimationBackward = function (animationName) {
        var animation = animations[animationName];

        if (animation) {
            animation.animationDirection = false;

            if (animation.initializedADirectionToChange && animation.previousDirectionWasForward)
                animation.experiencedDirectionChange = true;

            else animation.initializedADirectionToChange = true;

            animation.previousDirectionWasForward = false;
        }

        return this;
    };

    // Switches the animation's direction if the animation is found in the animator. Does nothing otherwise.
    this.switchAnimationDirection = function (animationName) {
        var animation = animations[animationName];

        if (animation) {
            animation.animationDirection = !animation.animationDirection;
            animation.experiencedDirectionChange = true;
            animation.previousDirectionWasForward = !animation.animationDirection;
        }

        return this;
    };

    // Sets an animation to 0%
    this.resetAnimation = function (animationName) {
        if (animations[animationName])
            animations[animationName].frameGenerator.reset ();

        return this;
    };

    // Sets an animation to 100%
    this.endAnimation = function (animationName) {
        if (animations[animationName])
            animations[animationName].frameGenerator.end ();

        return this;
    };

    // Update the on start function for an animation
    this.updateOnStart = function (animationName, newOnStart) {
        var anim = animations[animationName];

        if (anim) {
            anim.onAnimationStart = newOnStart;
            anim.frameGenerator.updateOnAnimationStart (newOnStart);
        }

        return this;
    };

    // Update the on end function for an animation
    this.updateOnEnd = function (animationName, newOnEnd) {
        var anim = animations[animationName];

        if (anim) {
            anim.onAnimationEnd = newOnEnd;
            anim.frameGenerator.updateOnAnimationEnd (newOnEnd);
        }

        return this;
    };

    // Updates the update function argument array for the specified animation
    this.updateAnimationArgsArray = function (animationName, newUpdateArgs) {
        var anim = animations[animationName];

        if (anim) {
            anim.updateArguments = newUpdateArgs;
            anim.frameGenerator.updateArgumentsArray (newUpdateArgs);
            anim.updateArguments.push (null);
        }

        return this;
    };

    // Updates the update function for the specified animation
    this.updateUpdateFunction = function (animationName, newUpdateFunction) {
        if (animations[animationName])
            animations[animationName].updater = newUpdateFunction;

        return this;
    };

    // Starts the main loop
    this.start = function () {
        if (!animatorIsStarted) {
            animatorIsStarted = true;
            continueLooping = requestAnimationFrame (mainLoop);
        }

        return this;
    };

    // Pauses the animator's main loop without pausing any animation frame generators
    this.pause = function () {
        if (continueLooping) {
            cancelAnimationFrame (continueLooping);
            continueLooping = false;
        }

        return this;
    };

    // Pauses the animator's main loop and all animation's frame generators
    this.pauseAll = function () {
        if (continueLooping) {
            // Pause all frame generators
            for (var animation in animations) {
                animations[animation].isActive = false;
                animations[animation].frameGenerator.pause ();
            }

            cancelAnimationFrame (continueLooping);
            continueLooping = false;
        }

        return this;
    };

    // Unpauses the animator's main loop if paused. Plays any animations fed as arguments (or an array of animations)
    this.play = function (animationsToReplay) {
        if (!continueLooping)
            continueLooping = requestAnimationFrame (mainLoop);

        if (arguments.length) {
            if (animationsToReplay instanceof Array)
                for (var i = 0; i < animationsToReplay.length; i++)
                    animations[animationsToReplay[i]].frameGenerator.unpause ();

            else
                for (var i = 0; i < arguments.length; i++) 
                    if (animations[arguments[i]]) animations[arguments[i]].frameGenerator.unpause ();
        }

        return this;
    };

    /**
     * Normalizes variable framerates to the Animator's fps using 4th order Runge-Kutta integration. This means that frame values
     * are of the double data type.
     *
     * Arguments:
     *     numFrames   - the highest framve value that the generator should produce
     *
     *     onAnimStart - function called when the frame value hits 0
     *
     *     onAnimEnd   - function called when the frame value hits 1
     *
     *     updateArgs  - update arguments array used in the updater function; get called for both anim start and anim end as well
     *
     *
     *
     * Public Methods:
     *     start     - () <Updates to the latest time in milliseconds> [this object]
     *
     *     reset     - () <Sets the frame count to 0> [this object]
     *
     *     end       - () <Sets the frame count to the max frame value> [this object]
     *
     *     pause     - () <Pauses the internal clock, so .next() is constant> [this object]
     *
     *     unpause   - () <Unpauses from a paused state> [this object]
     *
     *     isPaused  - () <Returns whether or not this FrameGenerator is paused> [Boolean]
     *
     *     isStarted - () <Returns whether or not this FrameGenerator was started> [Boolean]
     *
     *     next      - (neg) <Generates the next frame value. Goes backward if !!neg is true> [this object]
     *
     *     frame     - () <Returns the current frame value> [float value]
     *
     *     percent   - () <Returns the current percent value as the frame number divided by the number of frames> [float value]
     *
     *     revertToFrame      - (frame) <Reverts the internal frame value to the value fed> [this object]
     *
     *     revertToPercentage - (percent) <Reverts to the frame value corresponding to percent of the way there> [this object]
     *
     *     calculateXStar     - (f, posToNeg) <Used to patch discontinuity for symmetric animation direction changes> [this obj]
     *
     *     updateArgumentsArray   - (newUpdateArgumentsArray) <Updates the update arguments array for onanimstart/end> [this obj]
     *
     *     updateOnAnimationStart - (newOnStart) <Makes the onAnimationStart callback newOnStart> [this object]
     *
     *     updateOnAnimationEnd   - (newOnEnd) <Makes the onAnimationEnd callback newOnEnd> [this object]
     */
    function FrameGenerator (numFrames, onAnimStart, onAnimEnd, updateArgs) {
        var n   = numFrames,
            oAS = onAnimStart,
            oAE = onAnimEnd,
            uA  = updateArgs,

            // For firing only once on start and on end
            prevWasZero = false,
            prevWasOne  = false,

            t_i = Date.now (),
            i_t = 0,

            offset  = 0,         // Offsets new values of time by the amount of time paused
            tPaused = t_i,       // Time at pause

            isStarted   = false, // Helps with initiation via start method
            isNotPaused = true,

            FPMS     = FPS / 1000,
            BACKWARD = -1,
            FORWARD  = 1;

        // Starts the internal clock
        this.start = function () {
            if (!isStarted) {
                offset = 0;
                t_i = Date.now ();
                isStarted = true;
            }

            return this;
        };

        // Resets the frame generator to default values
        this.reset = function () {
            offset = 0;
            i_t = 0;

            return this;
        };

        // Sets the frame generator to the maximum frame value
        this.end = function () {
            offset = 0;
            i_t = n;

            return this;
        };

        // Pauses frame generation
        this.pause = function () {
            if (isNotPaused) {
                tPaused = t_i;
                isNotPaused = false;
            }

            return this;
        };

        // Unpauses frame generation
        this.unpause = function () {
            if (!isNotPaused) {
                if (isStarted)
                    offset += Date.now () - tPaused;

                isNotPaused = true;
            }

            return this;
        };

        // Returns whether this frame generator is started
        this.isStarted = function () {return isStarted};

        // Returns whether this frame generator is paused
        this.isPaused = function () {return !isNotPaused};

        // Returns the frame value of the frame generator
        this.frame = function () {return i_t};

        // Returns the percent progress of the frame generator from [0, 1]
        this.percent = function () {return i_t / n};

        // Calculates x* for positive to negative symmetric animation direction change
        this.calculateXStar = function (f, isPositiveToNegative) {
            var p = this.percent ();

            // Interpolation is typically   (1 - f(p)) * start + f(p)         * stop   for positive animations
            // and the interpolation is     f(1 - p)   * start + 1 - f(1 - p) * stop   for negative animations
            var value = isPositiveToNegative? 1 - f(p) : f(1 - p),
                closestValue = Infinity,
                xStar = Infinity;

            for (var i = 0; i <= n; i++) {
                var nextValue = isPositiveToNegative? f(1 - i/n) : 1 - f(i/n);

                if (Math.abs (nextValue - value) < Math.abs (closestValue - value)) {
                    closestValue = nextValue;
                    xStar = i / n;
                }

                if (closestValue == value) break;
            }

            return xStar;
        };

        // Generates the next value for i_t. Goes in the direction of the argument fed
        this.next = function (isPositive) {
            if (isNotPaused && isStarted) {
                var dt = (Date.now () - t_i - offset) * (isPositive? FORWARD : BACKWARD);
                i_t = rk4 (i_t, FPMS, dt);

                // Prevents frame over/underflow and does callbacks for start/end
                boundCheck ();

                // Sets the new t_i value for the next call
                t_i = Date.now () - offset;
            }

            return this;
        };

        // Reverts the internal percentage to the percentage fed to the method
        this.revertToPercentage = function (percentage) {
            if (isStarted) {
                offset = 0;
                i_t = percentage * n;

                // Prevents frame over/underflow and does callbacks for start/end
                boundCheck ();
            }

            return this;
        };

        // Reverts to the frame value fed to the method
        this.revertToFrame = function (frame) {
            if (isStarted) {
                offset = 0;
                i_t = frame;

                // Prevents frame over/underflow and does callbacks for start/end
                boundCheck ();
            }

            return this;
        };

        // Updates the arguments array
        this.updateArgumentsArray = function (newUa) {
            uA = newUa;

            return this;
        };

        // Updates the on animation start function
        this.updateOnAnimationStart = function (newOnStart) {
            oAS = newOnStart;

            return this;
        };

        // Updates the on animation end function
        this.updateOnAnimationEnd = function (newOnEnd) {
            oAE = newOnEnd;

            return this;
        };

        // Performs the i_t boundary check, and does callbacks if callbacks are appropriate
        function boundCheck () {
            if (i_t <= 0) {
                i_t = 0;

                if (!prevWasZero)
                    oAS.apply (oAS, uA);

                prevWasZero = true;
            }

            else if (i_t >= n) {
                i_t = n;

                if (!prevWasOne)
                    oAE.apply (oAE, uA);

                prevWasOne = true;
            }

            else {
                prevWasZero = false;
                prevWasOne  = false;
            }
        }

        /**
         * Performs Runge-Kutta integration for a discrete value dt. Used for normalizing i in animation
         * across different framerates by different machines.
         *
         * Arguments:
         *     x  - initial position
         *     v  - initial velocity
         *     dt - timestep
         *     a  - acceleration function handler
         *
         * Returns:
         *     [xf, vf] - array containing the next position and velocity
         */
        /*function rk4 (x, v, dt, a) {
            var C = 0.5 * dt, K = dt / 6;

            var x1 = x,             v1 = v,             a1 = a (x1, v, 0),
                x2 = x + C * v1,    v2 = v + C * a1,    a2 = a (x2, v2, C),
                x3 = x + C * v2,    v3 = v + C * a2,    a3 = a (x3, v3, C),
                x4 = x + v3 * dt,   v4 = v + a3 * dt,   a4 = a (x4, v4, dt);

            var xf = x + K * (v1 + 2 * v2 + 2 * v3 + v4),
                vf = v + K * (a1 + 2 * a2 + 2 * a3 + a4);

            return [xf, vf];
        };*/

        /* Frame-generator-specific Runge-Kutta integration condensed function */
        function rk4 (x, v, dt) {return x + dt * v}
    }
}
