# Generic JavaScript Animators
The following frameworks have been written with the intention easinig the animation process (while also not using jQuery). That being said, user discretion is advised.

## Animator.js
**Animator.js** is a barebones animator framework that essentially handles the event loop at a normalized FPS (frames-per-second) speed; it gives you the ability to manipulate animations constructed to your specification (see the `addAnimation` method for more details).

### How to: Animator.js
See the document header in the `animator.js` file of this repository.

## CSS-Animator.js
The **CSS-Animator.js** framework takes the raw control that **Animator.js** gives you, and makes it even easier to work with CSS animations on elements of a DOM in the web browser. Note that use of this library manipulates DOM elements' prototype, and as such, it should be used only with caution; further implementations will address the issue.

### How to: CSS-Animator.js
See the document header in the `css-animator.js` file of this repository. Note that **CSS-Animator.js** will not work unless **Animator.js** is loaded into the same project as well.

## Project History
This all started with a sudden strong drive to remove jQuery from web projects and browser extensions. Although CSS3 easily does the things that these projects would need, it doesn't offer a simple way to handle timings between multiple animations. So, the only sensible and logical solution was to open up multiple tabs of Google queries until what was once a small animation function loop loosely based on [this Fade In implementation](http://youmightnotneedjquery.com/#fade_in) evolved into this Dr. Frankenstein's monster of JavaScript.

Maybe it would have been a good idea to see if [someone else hadn't done something like this before](https://github.com/juliangarnier/anime), but by the time that it sauntered its way to this project, both **Animator.js** and **CSS-Animator.js** were too far into development to just scrap the whole thing. 

## Future Development
Future work on this animator is not guaranteed at this time, though there is motivation to add both Bezier curve support of sorts, and an easy way to loop animations for a bounded (or unbounded) number of times. Will update when relevant again.
