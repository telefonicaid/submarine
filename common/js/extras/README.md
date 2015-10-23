submarine.extras
============

This extra objects are meant to aid in the process of making fully-fledges visualizations with minimum effort.
Below is a list of the extra objects included

submarine.extras.genericSlider
--------------------------

Generic slider wrapping [jslider](https://github.com/egorkhmelev/jslider)

It inserts in 'sliderId' an slider with play/pause functionality (associated images inserted in 'playId')

In the options object:
- 'sliderId': Id in which to insert the slider
- 'playId': Id in which to insert the 'pause.png' and 'play.png' images
- 'from': 0: first step of the slider
- 'to': 180: last step of the slider
- 'pathToImages': path to playId .png files. If not defined defaults to 'img/'
- 'step': 1: How many steps to increment between slider position
- 'interval': Duration of every 'frame' in play mode (in milliseconds)
- 'skin': Skin to use, see examples [here](http://egorkhmelev.github.io/jslider/)
- 'calculate': anonymous function to calculate display string in html, based on slider value
- 'callback': to be called on slider changed, with 'value' as argument

**Dependencies**

jQuery and jSlider. jSlider lib minified is hosted [here] (../3rdparty) (jquery.slider.min.js) for convenience. Also, you have
to include jquery.slider.min.css as a stylesheet, hosted [here] (../../css). As a hardwired behaviour, it searches for skins
 in relative path '../img/' from the directory hosting the stylesheet, so the 'jquery.*.png' files are hosted [here] (../../img)
