/*!
 * Modernizr v2.7.1
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */


window.Modernizr = (function( window, document, undefined ) {

    var version = '2.7.1',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq).matches;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   daneden.me/2011/12/putting-up-with-androids-bullshit/
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);
/*!
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 */

(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
var
  // A central reference to the root jQuery(document)
  rootjQuery,

  // The deferred used on DOM ready
  readyList,

  // Support: IE9
  // For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
  core_strundefined = typeof undefined,

  // Use the correct document accordingly with window argument (sandbox)
  location = window.location,
  document = window.document,
  docElem = document.documentElement,

  // Map over jQuery in case of overwrite
  _jQuery = window.jQuery,

  // Map over the $ in case of overwrite
  _$ = window.$,

  // [[Class]] -> type pairs
  class2type = {},

  // List of deleted data cache ids, so we can reuse them
  core_deletedIds = [],

  core_version = "2.0.3",

  // Save a reference to some core methods
  core_concat = core_deletedIds.concat,
  core_push = core_deletedIds.push,
  core_slice = core_deletedIds.slice,
  core_indexOf = core_deletedIds.indexOf,
  core_toString = class2type.toString,
  core_hasOwn = class2type.hasOwnProperty,
  core_trim = core_version.trim,

  // Define a local copy of jQuery
  jQuery = function( selector, context ) {
    // The jQuery object is actually just the init constructor 'enhanced'
    return new jQuery.fn.init( selector, context, rootjQuery );
  },

  // Used for matching numbers
  core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

  // Used for splitting on whitespace
  core_rnotwhite = /\S+/g,

  // A simple way to check for HTML strings
  // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
  // Strict HTML recognition (#11290: must start with <)
  rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

  // Match a standalone tag
  rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

  // Matches dashed string for camelizing
  rmsPrefix = /^-ms-/,
  rdashAlpha = /-([\da-z])/gi,

  // Used by jQuery.camelCase as callback to replace()
  fcamelCase = function( all, letter ) {
    return letter.toUpperCase();
  },

  // The ready event handler and self cleanup method
  completed = function() {
    document.removeEventListener( "DOMContentLoaded", completed, false );
    window.removeEventListener( "load", completed, false );
    jQuery.ready();
  };

jQuery.fn = jQuery.prototype = {
  // The current version of jQuery being used
  jquery: core_version,

  constructor: jQuery,
  init: function( selector, context, rootjQuery ) {
    var match, elem;

    // HANDLE: $(""), $(null), $(undefined), $(false)
    if ( !selector ) {
      return this;
    }

    // Handle HTML strings
    if ( typeof selector === "string" ) {
      if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
        // Assume that strings that start and end with <> are HTML and skip the regex check
        match = [ null, selector, null ];

      } else {
        match = rquickExpr.exec( selector );
      }

      // Match html or make sure no context is specified for #id
      if ( match && (match[1] || !context) ) {

        // HANDLE: $(html) -> $(array)
        if ( match[1] ) {
          context = context instanceof jQuery ? context[0] : context;

          // scripts is true for back-compat
          jQuery.merge( this, jQuery.parseHTML(
            match[1],
            context && context.nodeType ? context.ownerDocument || context : document,
            true
          ) );

          // HANDLE: $(html, props)
          if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
            for ( match in context ) {
              // Properties of context are called as methods if possible
              if ( jQuery.isFunction( this[ match ] ) ) {
                this[ match ]( context[ match ] );

              // ...and otherwise set as attributes
              } else {
                this.attr( match, context[ match ] );
              }
            }
          }

          return this;

        // HANDLE: $(#id)
        } else {
          elem = document.getElementById( match[2] );

          // Check parentNode to catch when Blackberry 4.6 returns
          // nodes that are no longer in the document #6963
          if ( elem && elem.parentNode ) {
            // Inject the element directly into the jQuery object
            this.length = 1;
            this[0] = elem;
          }

          this.context = document;
          this.selector = selector;
          return this;
        }

      // HANDLE: $(expr, $(...))
      } else if ( !context || context.jquery ) {
        return ( context || rootjQuery ).find( selector );

      // HANDLE: $(expr, context)
      // (which is just equivalent to: $(context).find(expr)
      } else {
        return this.constructor( context ).find( selector );
      }

    // HANDLE: $(DOMElement)
    } else if ( selector.nodeType ) {
      this.context = this[0] = selector;
      this.length = 1;
      return this;

    // HANDLE: $(function)
    // Shortcut for document ready
    } else if ( jQuery.isFunction( selector ) ) {
      return rootjQuery.ready( selector );
    }

    if ( selector.selector !== undefined ) {
      this.selector = selector.selector;
      this.context = selector.context;
    }

    return jQuery.makeArray( selector, this );
  },

  // Start with an empty selector
  selector: "",

  // The default length of a jQuery object is 0
  length: 0,

  toArray: function() {
    return core_slice.call( this );
  },

  // Get the Nth element in the matched element set OR
  // Get the whole matched element set as a clean array
  get: function( num ) {
    return num == null ?

      // Return a 'clean' array
      this.toArray() :

      // Return just the object
      ( num < 0 ? this[ this.length + num ] : this[ num ] );
  },

  // Take an array of elements and push it onto the stack
  // (returning the new matched element set)
  pushStack: function( elems ) {

    // Build a new jQuery matched element set
    var ret = jQuery.merge( this.constructor(), elems );

    // Add the old object onto the stack (as a reference)
    ret.prevObject = this;
    ret.context = this.context;

    // Return the newly-formed element set
    return ret;
  },

  // Execute a callback for every element in the matched set.
  // (You can seed the arguments with an array of args, but this is
  // only used internally.)
  each: function( callback, args ) {
    return jQuery.each( this, callback, args );
  },

  ready: function( fn ) {
    // Add the callback
    jQuery.ready.promise().done( fn );

    return this;
  },

  slice: function() {
    return this.pushStack( core_slice.apply( this, arguments ) );
  },

  first: function() {
    return this.eq( 0 );
  },

  last: function() {
    return this.eq( -1 );
  },

  eq: function( i ) {
    var len = this.length,
      j = +i + ( i < 0 ? len : 0 );
    return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
  },

  map: function( callback ) {
    return this.pushStack( jQuery.map(this, function( elem, i ) {
      return callback.call( elem, i, elem );
    }));
  },

  end: function() {
    return this.prevObject || this.constructor(null);
  },

  // For internal use only.
  // Behaves like an Array's method, not like a jQuery method.
  push: core_push,
  sort: [].sort,
  splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  if ( length === i ) {
    target = this;
    --i;
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ( (options = arguments[ i ]) != null ) {
      // Extend the base object
      for ( name in options ) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : [];

          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = jQuery.extend( deep, clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};

jQuery.extend({
  // Unique for each copy of jQuery on the page
  expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

  noConflict: function( deep ) {
    if ( window.$ === jQuery ) {
      window.$ = _$;
    }

    if ( deep && window.jQuery === jQuery ) {
      window.jQuery = _jQuery;
    }

    return jQuery;
  },

  // Is the DOM ready to be used? Set to true once it occurs.
  isReady: false,

  // A counter to track how many items to wait for before
  // the ready event fires. See #6781
  readyWait: 1,

  // Hold (or release) the ready event
  holdReady: function( hold ) {
    if ( hold ) {
      jQuery.readyWait++;
    } else {
      jQuery.ready( true );
    }
  },

  // Handle when the DOM is ready
  ready: function( wait ) {

    // Abort if there are pending holds or we're already ready
    if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
      return;
    }

    // Remember that the DOM is ready
    jQuery.isReady = true;

    // If a normal DOM Ready event fired, decrement, and wait if need be
    if ( wait !== true && --jQuery.readyWait > 0 ) {
      return;
    }

    // If there are functions bound, to execute
    readyList.resolveWith( document, [ jQuery ] );

    // Trigger any bound ready events
    if ( jQuery.fn.trigger ) {
      jQuery( document ).trigger("ready").off("ready");
    }
  },

  // See test/unit/core.js for details concerning isFunction.
  // Since version 1.3, DOM methods and functions like alert
  // aren't supported. They return false on IE (#2968).
  isFunction: function( obj ) {
    return jQuery.type(obj) === "function";
  },

  isArray: Array.isArray,

  isWindow: function( obj ) {
    return obj != null && obj === obj.window;
  },

  isNumeric: function( obj ) {
    return !isNaN( parseFloat(obj) ) && isFinite( obj );
  },

  type: function( obj ) {
    if ( obj == null ) {
      return String( obj );
    }
    // Support: Safari <= 5.1 (functionish RegExp)
    return typeof obj === "object" || typeof obj === "function" ?
      class2type[ core_toString.call(obj) ] || "object" :
      typeof obj;
  },

  isPlainObject: function( obj ) {
    // Not plain objects:
    // - Any object or value whose internal [[Class]] property is not "[object Object]"
    // - DOM nodes
    // - window
    if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
      return false;
    }

    // Support: Firefox <20
    // The try/catch suppresses exceptions thrown when attempting to access
    // the "constructor" property of certain host objects, ie. |window.location|
    // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
    try {
      if ( obj.constructor &&
          !core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
        return false;
      }
    } catch ( e ) {
      return false;
    }

    // If the function hasn't returned already, we're confident that
    // |obj| is a plain object, created by {} or constructed with new Object
    return true;
  },

  isEmptyObject: function( obj ) {
    var name;
    for ( name in obj ) {
      return false;
    }
    return true;
  },

  error: function( msg ) {
    throw new Error( msg );
  },

  // data: string of html
  // context (optional): If specified, the fragment will be created in this context, defaults to document
  // keepScripts (optional): If true, will include scripts passed in the html string
  parseHTML: function( data, context, keepScripts ) {
    if ( !data || typeof data !== "string" ) {
      return null;
    }
    if ( typeof context === "boolean" ) {
      keepScripts = context;
      context = false;
    }
    context = context || document;

    var parsed = rsingleTag.exec( data ),
      scripts = !keepScripts && [];

    // Single tag
    if ( parsed ) {
      return [ context.createElement( parsed[1] ) ];
    }

    parsed = jQuery.buildFragment( [ data ], context, scripts );

    if ( scripts ) {
      jQuery( scripts ).remove();
    }

    return jQuery.merge( [], parsed.childNodes );
  },

  parseJSON: JSON.parse,

  // Cross-browser xml parsing
  parseXML: function( data ) {
    var xml, tmp;
    if ( !data || typeof data !== "string" ) {
      return null;
    }

    // Support: IE9
    try {
      tmp = new DOMParser();
      xml = tmp.parseFromString( data , "text/xml" );
    } catch ( e ) {
      xml = undefined;
    }

    if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
      jQuery.error( "Invalid XML: " + data );
    }
    return xml;
  },

  noop: function() {},

  // Evaluates a script in a global context
  globalEval: function( code ) {
    var script,
        indirect = eval;

    code = jQuery.trim( code );

    if ( code ) {
      // If the code includes a valid, prologue position
      // strict mode pragma, execute code by injecting a
      // script tag into the document.
      if ( code.indexOf("use strict") === 1 ) {
        script = document.createElement("script");
        script.text = code;
        document.head.appendChild( script ).parentNode.removeChild( script );
      } else {
      // Otherwise, avoid the DOM node creation, insertion
      // and removal by using an indirect global eval
        indirect( code );
      }
    }
  },

  // Convert dashed to camelCase; used by the css and data modules
  // Microsoft forgot to hump their vendor prefix (#9572)
  camelCase: function( string ) {
    return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
  },

  nodeName: function( elem, name ) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  },

  // args is for internal usage only
  each: function( obj, callback, args ) {
    var value,
      i = 0,
      length = obj.length,
      isArray = isArraylike( obj );

    if ( args ) {
      if ( isArray ) {
        for ( ; i < length; i++ ) {
          value = callback.apply( obj[ i ], args );

          if ( value === false ) {
            break;
          }
        }
      } else {
        for ( i in obj ) {
          value = callback.apply( obj[ i ], args );

          if ( value === false ) {
            break;
          }
        }
      }

    // A special, fast, case for the most common use of each
    } else {
      if ( isArray ) {
        for ( ; i < length; i++ ) {
          value = callback.call( obj[ i ], i, obj[ i ] );

          if ( value === false ) {
            break;
          }
        }
      } else {
        for ( i in obj ) {
          value = callback.call( obj[ i ], i, obj[ i ] );

          if ( value === false ) {
            break;
          }
        }
      }
    }

    return obj;
  },

  trim: function( text ) {
    return text == null ? "" : core_trim.call( text );
  },

  // results is for internal usage only
  makeArray: function( arr, results ) {
    var ret = results || [];

    if ( arr != null ) {
      if ( isArraylike( Object(arr) ) ) {
        jQuery.merge( ret,
          typeof arr === "string" ?
          [ arr ] : arr
        );
      } else {
        core_push.call( ret, arr );
      }
    }

    return ret;
  },

  inArray: function( elem, arr, i ) {
    return arr == null ? -1 : core_indexOf.call( arr, elem, i );
  },

  merge: function( first, second ) {
    var l = second.length,
      i = first.length,
      j = 0;

    if ( typeof l === "number" ) {
      for ( ; j < l; j++ ) {
        first[ i++ ] = second[ j ];
      }
    } else {
      while ( second[j] !== undefined ) {
        first[ i++ ] = second[ j++ ];
      }
    }

    first.length = i;

    return first;
  },

  grep: function( elems, callback, inv ) {
    var retVal,
      ret = [],
      i = 0,
      length = elems.length;
    inv = !!inv;

    // Go through the array, only saving the items
    // that pass the validator function
    for ( ; i < length; i++ ) {
      retVal = !!callback( elems[ i ], i );
      if ( inv !== retVal ) {
        ret.push( elems[ i ] );
      }
    }

    return ret;
  },

  // arg is for internal usage only
  map: function( elems, callback, arg ) {
    var value,
      i = 0,
      length = elems.length,
      isArray = isArraylike( elems ),
      ret = [];

    // Go through the array, translating each of the items to their
    if ( isArray ) {
      for ( ; i < length; i++ ) {
        value = callback( elems[ i ], i, arg );

        if ( value != null ) {
          ret[ ret.length ] = value;
        }
      }

    // Go through every key on the object,
    } else {
      for ( i in elems ) {
        value = callback( elems[ i ], i, arg );

        if ( value != null ) {
          ret[ ret.length ] = value;
        }
      }
    }

    // Flatten any nested arrays
    return core_concat.apply( [], ret );
  },

  // A global GUID counter for objects
  guid: 1,

  // Bind a function to a context, optionally partially applying any
  // arguments.
  proxy: function( fn, context ) {
    var tmp, args, proxy;

    if ( typeof context === "string" ) {
      tmp = fn[ context ];
      context = fn;
      fn = tmp;
    }

    // Quick check to determine if target is callable, in the spec
    // this throws a TypeError, but we will just return undefined.
    if ( !jQuery.isFunction( fn ) ) {
      return undefined;
    }

    // Simulated bind
    args = core_slice.call( arguments, 2 );
    proxy = function() {
      return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
    };

    // Set the guid of unique handler to the same of original handler, so it can be removed
    proxy.guid = fn.guid = fn.guid || jQuery.guid++;

    return proxy;
  },

  // Multifunctional method to get and set values of a collection
  // The value/s can optionally be executed if it's a function
  access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
    var i = 0,
      length = elems.length,
      bulk = key == null;

    // Sets many values
    if ( jQuery.type( key ) === "object" ) {
      chainable = true;
      for ( i in key ) {
        jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
      }

    // Sets one value
    } else if ( value !== undefined ) {
      chainable = true;

      if ( !jQuery.isFunction( value ) ) {
        raw = true;
      }

      if ( bulk ) {
        // Bulk operations run against the entire set
        if ( raw ) {
          fn.call( elems, value );
          fn = null;

        // ...except when executing function values
        } else {
          bulk = fn;
          fn = function( elem, key, value ) {
            return bulk.call( jQuery( elem ), value );
          };
        }
      }

      if ( fn ) {
        for ( ; i < length; i++ ) {
          fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
        }
      }
    }

    return chainable ?
      elems :

      // Gets
      bulk ?
        fn.call( elems ) :
        length ? fn( elems[0], key ) : emptyGet;
  },

  now: Date.now,

  // A method for quickly swapping in/out CSS properties to get correct calculations.
  // Note: this method belongs to the css module but it's needed here for the support module.
  // If support gets modularized, this method should be moved back to the css module.
  swap: function( elem, options, callback, args ) {
    var ret, name,
      old = {};

    // Remember the old values, and insert the new ones
    for ( name in options ) {
      old[ name ] = elem.style[ name ];
      elem.style[ name ] = options[ name ];
    }

    ret = callback.apply( elem, args || [] );

    // Revert the old values
    for ( name in options ) {
      elem.style[ name ] = old[ name ];
    }

    return ret;
  }
});

jQuery.ready.promise = function( obj ) {
  if ( !readyList ) {

    readyList = jQuery.Deferred();

    // Catch cases where $(document).ready() is called after the browser event has already occurred.
    // we once tried to use readyState "interactive" here, but it caused issues like the one
    // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
    if ( document.readyState === "complete" ) {
      // Handle it asynchronously to allow scripts the opportunity to delay ready
      setTimeout( jQuery.ready );

    } else {

      // Use the handy event callback
      document.addEventListener( "DOMContentLoaded", completed, false );

      // A fallback to window.onload, that will always work
      window.addEventListener( "load", completed, false );
    }
  }
  return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
  class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
  var length = obj.length,
    type = jQuery.type( obj );

  if ( jQuery.isWindow( obj ) ) {
    return false;
  }

  if ( obj.nodeType === 1 && length ) {
    return true;
  }

  return type === "array" || type !== "function" &&
    ( length === 0 ||
    typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
/*!
 * Sizzle CSS Selector Engine v1.9.4-pre
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-06-03
 */
(function( window, undefined ) {

var i,
  support,
  cachedruns,
  Expr,
  getText,
  isXML,
  compile,
  outermostContext,
  sortInput,

  // Local document vars
  setDocument,
  document,
  docElem,
  documentIsHTML,
  rbuggyQSA,
  rbuggyMatches,
  matches,
  contains,

  // Instance-specific data
  expando = "sizzle" + -(new Date()),
  preferredDoc = window.document,
  dirruns = 0,
  done = 0,
  classCache = createCache(),
  tokenCache = createCache(),
  compilerCache = createCache(),
  hasDuplicate = false,
  sortOrder = function( a, b ) {
    if ( a === b ) {
      hasDuplicate = true;
      return 0;
    }
    return 0;
  },

  // General-purpose constants
  strundefined = typeof undefined,
  MAX_NEGATIVE = 1 << 31,

  // Instance methods
  hasOwn = ({}).hasOwnProperty,
  arr = [],
  pop = arr.pop,
  push_native = arr.push,
  push = arr.push,
  slice = arr.slice,
  // Use a stripped-down indexOf if we can't use a native one
  indexOf = arr.indexOf || function( elem ) {
    var i = 0,
      len = this.length;
    for ( ; i < len; i++ ) {
      if ( this[i] === elem ) {
        return i;
      }
    }
    return -1;
  },

  booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

  // Regular expressions

  // Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
  whitespace = "[\\x20\\t\\r\\n\\f]",
  // http://www.w3.org/TR/css3-syntax/#characters
  characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

  // Loosely modeled on CSS identifier characters
  // An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
  // Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
  identifier = characterEncoding.replace( "w", "w#" ),

  // Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
  attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
    "*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

  // Prefer arguments quoted,
  //   then not containing pseudos/brackets,
  //   then attribute selectors/non-parenthetical expressions,
  //   then anything else
  // These preferences are here to reduce the number of selectors
  //   needing tokenize in the PSEUDO preFilter
  pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

  // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
  rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

  rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
  rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

  rsibling = new RegExp( whitespace + "*[+~]" ),
  rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g" ),

  rpseudo = new RegExp( pseudos ),
  ridentifier = new RegExp( "^" + identifier + "$" ),

  matchExpr = {
    "ID": new RegExp( "^#(" + characterEncoding + ")" ),
    "CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
    "TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
    "ATTR": new RegExp( "^" + attributes ),
    "PSEUDO": new RegExp( "^" + pseudos ),
    "CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
      "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
      "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
    "bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
    // For use in libraries implementing .is()
    // We use this for POS matching in `select`
    "needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
      whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
  },

  rnative = /^[^{]+\{\s*\[native \w/,

  // Easily-parseable/retrievable ID or TAG or CLASS selectors
  rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

  rinputs = /^(?:input|select|textarea|button)$/i,
  rheader = /^h\d$/i,

  rescape = /'|\\/g,

  // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
  runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
  funescape = function( _, escaped, escapedWhitespace ) {
    var high = "0x" + escaped - 0x10000;
    // NaN means non-codepoint
    // Support: Firefox
    // Workaround erroneous numeric interpretation of +"0x"
    return high !== high || escapedWhitespace ?
      escaped :
      // BMP codepoint
      high < 0 ?
        String.fromCharCode( high + 0x10000 ) :
        // Supplemental Plane codepoint (surrogate pair)
        String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
  };

// Optimize for push.apply( _, NodeList )
try {
  push.apply(
    (arr = slice.call( preferredDoc.childNodes )),
    preferredDoc.childNodes
  );
  // Support: Android<4.0
  // Detect silently failing push.apply
  arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
  push = { apply: arr.length ?

    // Leverage slice if possible
    function( target, els ) {
      push_native.apply( target, slice.call(els) );
    } :

    // Support: IE<9
    // Otherwise append directly
    function( target, els ) {
      var j = target.length,
        i = 0;
      // Can't trust NodeList.length
      while ( (target[j++] = els[i++]) ) {}
      target.length = j - 1;
    }
  };
}

function Sizzle( selector, context, results, seed ) {
  var match, elem, m, nodeType,
    // QSA vars
    i, groups, old, nid, newContext, newSelector;

  if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
    setDocument( context );
  }

  context = context || document;
  results = results || [];

  if ( !selector || typeof selector !== "string" ) {
    return results;
  }

  if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
    return [];
  }

  if ( documentIsHTML && !seed ) {

    // Shortcuts
    if ( (match = rquickExpr.exec( selector )) ) {
      // Speed-up: Sizzle("#ID")
      if ( (m = match[1]) ) {
        if ( nodeType === 9 ) {
          elem = context.getElementById( m );
          // Check parentNode to catch when Blackberry 4.6 returns
          // nodes that are no longer in the document #6963
          if ( elem && elem.parentNode ) {
            // Handle the case where IE, Opera, and Webkit return items
            // by name instead of ID
            if ( elem.id === m ) {
              results.push( elem );
              return results;
            }
          } else {
            return results;
          }
        } else {
          // Context is not a document
          if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
            contains( context, elem ) && elem.id === m ) {
            results.push( elem );
            return results;
          }
        }

      // Speed-up: Sizzle("TAG")
      } else if ( match[2] ) {
        push.apply( results, context.getElementsByTagName( selector ) );
        return results;

      // Speed-up: Sizzle(".CLASS")
      } else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
        push.apply( results, context.getElementsByClassName( m ) );
        return results;
      }
    }

    // QSA path
    if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
      nid = old = expando;
      newContext = context;
      newSelector = nodeType === 9 && selector;

      // qSA works strangely on Element-rooted queries
      // We can work around this by specifying an extra ID on the root
      // and working up from there (Thanks to Andrew Dupont for the technique)
      // IE 8 doesn't work on object elements
      if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
        groups = tokenize( selector );

        if ( (old = context.getAttribute("id")) ) {
          nid = old.replace( rescape, "\\$&" );
        } else {
          context.setAttribute( "id", nid );
        }
        nid = "[id='" + nid + "'] ";

        i = groups.length;
        while ( i-- ) {
          groups[i] = nid + toSelector( groups[i] );
        }
        newContext = rsibling.test( selector ) && context.parentNode || context;
        newSelector = groups.join(",");
      }

      if ( newSelector ) {
        try {
          push.apply( results,
            newContext.querySelectorAll( newSelector )
          );
          return results;
        } catch(qsaError) {
        } finally {
          if ( !old ) {
            context.removeAttribute("id");
          }
        }
      }
    }
  }

  // All others
  return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *  property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *  deleting the oldest entry
 */
function createCache() {
  var keys = [];

  function cache( key, value ) {
    // Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
    if ( keys.push( key += " " ) > Expr.cacheLength ) {
      // Only keep the most recent entries
      delete cache[ keys.shift() ];
    }
    return (cache[ key ] = value);
  }
  return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
  fn[ expando ] = true;
  return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
  var div = document.createElement("div");

  try {
    return !!fn( div );
  } catch (e) {
    return false;
  } finally {
    // Remove from its parent by default
    if ( div.parentNode ) {
      div.parentNode.removeChild( div );
    }
    // release memory in IE
    div = null;
  }
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
  var arr = attrs.split("|"),
    i = attrs.length;

  while ( i-- ) {
    Expr.attrHandle[ arr[i] ] = handler;
  }
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
  var cur = b && a,
    diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
      ( ~b.sourceIndex || MAX_NEGATIVE ) -
      ( ~a.sourceIndex || MAX_NEGATIVE );

  // Use IE sourceIndex if available on both nodes
  if ( diff ) {
    return diff;
  }

  // Check if b follows a
  if ( cur ) {
    while ( (cur = cur.nextSibling) ) {
      if ( cur === b ) {
        return -1;
      }
    }
  }

  return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
  return function( elem ) {
    var name = elem.nodeName.toLowerCase();
    return name === "input" && elem.type === type;
  };
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
  return function( elem ) {
    var name = elem.nodeName.toLowerCase();
    return (name === "input" || name === "button") && elem.type === type;
  };
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
  return markFunction(function( argument ) {
    argument = +argument;
    return markFunction(function( seed, matches ) {
      var j,
        matchIndexes = fn( [], seed.length, argument ),
        i = matchIndexes.length;

      // Match elements found at the specified indexes
      while ( i-- ) {
        if ( seed[ (j = matchIndexes[i]) ] ) {
          seed[j] = !(matches[j] = seed[j]);
        }
      }
    });
  });
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
  // documentElement is verified for cases where it doesn't yet exist
  // (such as loading iframes in IE - #4833)
  var documentElement = elem && (elem.ownerDocument || elem).documentElement;
  return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
  var doc = node ? node.ownerDocument || node : preferredDoc,
    parent = doc.defaultView;

  // If no document and documentElement is available, return
  if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
    return document;
  }

  // Set our document
  document = doc;
  docElem = doc.documentElement;

  // Support tests
  documentIsHTML = !isXML( doc );

  // Support: IE>8
  // If iframe document is assigned to "document" variable and if iframe has been reloaded,
  // IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
  // IE6-8 do not support the defaultView property so parent will be undefined
  if ( parent && parent.attachEvent && parent !== parent.top ) {
    parent.attachEvent( "onbeforeunload", function() {
      setDocument();
    });
  }

  /* Attributes
  ---------------------------------------------------------------------- */

  // Support: IE<8
  // Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
  support.attributes = assert(function( div ) {
    div.className = "i";
    return !div.getAttribute("className");
  });

  /* getElement(s)By*
  ---------------------------------------------------------------------- */

  // Check if getElementsByTagName("*") returns only elements
  support.getElementsByTagName = assert(function( div ) {
    div.appendChild( doc.createComment("") );
    return !div.getElementsByTagName("*").length;
  });

  // Check if getElementsByClassName can be trusted
  support.getElementsByClassName = assert(function( div ) {
    div.innerHTML = "<div class='a'></div><div class='a i'></div>";

    // Support: Safari<4
    // Catch class over-caching
    div.firstChild.className = "i";
    // Support: Opera<10
    // Catch gEBCN failure to find non-leading classes
    return div.getElementsByClassName("i").length === 2;
  });

  // Support: IE<10
  // Check if getElementById returns elements by name
  // The broken getElementById methods don't pick up programatically-set names,
  // so use a roundabout getElementsByName test
  support.getById = assert(function( div ) {
    docElem.appendChild( div ).id = expando;
    return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
  });

  // ID find and filter
  if ( support.getById ) {
    Expr.find["ID"] = function( id, context ) {
      if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
        var m = context.getElementById( id );
        // Check parentNode to catch when Blackberry 4.6 returns
        // nodes that are no longer in the document #6963
        return m && m.parentNode ? [m] : [];
      }
    };
    Expr.filter["ID"] = function( id ) {
      var attrId = id.replace( runescape, funescape );
      return function( elem ) {
        return elem.getAttribute("id") === attrId;
      };
    };
  } else {
    // Support: IE6/7
    // getElementById is not reliable as a find shortcut
    delete Expr.find["ID"];

    Expr.filter["ID"] =  function( id ) {
      var attrId = id.replace( runescape, funescape );
      return function( elem ) {
        var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
        return node && node.value === attrId;
      };
    };
  }

  // Tag
  Expr.find["TAG"] = support.getElementsByTagName ?
    function( tag, context ) {
      if ( typeof context.getElementsByTagName !== strundefined ) {
        return context.getElementsByTagName( tag );
      }
    } :
    function( tag, context ) {
      var elem,
        tmp = [],
        i = 0,
        results = context.getElementsByTagName( tag );

      // Filter out possible comments
      if ( tag === "*" ) {
        while ( (elem = results[i++]) ) {
          if ( elem.nodeType === 1 ) {
            tmp.push( elem );
          }
        }

        return tmp;
      }
      return results;
    };

  // Class
  Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
    if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
      return context.getElementsByClassName( className );
    }
  };

  /* QSA/matchesSelector
  ---------------------------------------------------------------------- */

  // QSA and matchesSelector support

  // matchesSelector(:active) reports false when true (IE9/Opera 11.5)
  rbuggyMatches = [];

  // qSa(:focus) reports false when true (Chrome 21)
  // We allow this because of a bug in IE8/9 that throws an error
  // whenever `document.activeElement` is accessed on an iframe
  // So, we allow :focus to pass through QSA all the time to avoid the IE error
  // See http://bugs.jquery.com/ticket/13378
  rbuggyQSA = [];

  if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
    // Build QSA regex
    // Regex strategy adopted from Diego Perini
    assert(function( div ) {
      // Select is set to empty string on purpose
      // This is to test IE's treatment of not explicitly
      // setting a boolean content attribute,
      // since its presence should be enough
      // http://bugs.jquery.com/ticket/12359
      div.innerHTML = "<select><option selected=''></option></select>";

      // Support: IE8
      // Boolean attributes and "value" are not treated correctly
      if ( !div.querySelectorAll("[selected]").length ) {
        rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
      }

      // Webkit/Opera - :checked should return selected option elements
      // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
      // IE8 throws error here and will not see later tests
      if ( !div.querySelectorAll(":checked").length ) {
        rbuggyQSA.push(":checked");
      }
    });

    assert(function( div ) {

      // Support: Opera 10-12/IE8
      // ^= $= *= and empty values
      // Should not select anything
      // Support: Windows 8 Native Apps
      // The type attribute is restricted during .innerHTML assignment
      var input = doc.createElement("input");
      input.setAttribute( "type", "hidden" );
      div.appendChild( input ).setAttribute( "t", "" );

      if ( div.querySelectorAll("[t^='']").length ) {
        rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
      }

      // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
      // IE8 throws error here and will not see later tests
      if ( !div.querySelectorAll(":enabled").length ) {
        rbuggyQSA.push( ":enabled", ":disabled" );
      }

      // Opera 10-11 does not throw on post-comma invalid pseudos
      div.querySelectorAll("*,:x");
      rbuggyQSA.push(",.*:");
    });
  }

  if ( (support.matchesSelector = rnative.test( (matches = docElem.webkitMatchesSelector ||
    docElem.mozMatchesSelector ||
    docElem.oMatchesSelector ||
    docElem.msMatchesSelector) )) ) {

    assert(function( div ) {
      // Check to see if it's possible to do matchesSelector
      // on a disconnected node (IE 9)
      support.disconnectedMatch = matches.call( div, "div" );

      // This should fail with an exception
      // Gecko does not error, returns false instead
      matches.call( div, "[s!='']:x" );
      rbuggyMatches.push( "!=", pseudos );
    });
  }

  rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
  rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

  /* Contains
  ---------------------------------------------------------------------- */

  // Element contains another
  // Purposefully does not implement inclusive descendent
  // As in, an element does not contain itself
  contains = rnative.test( docElem.contains ) || docElem.compareDocumentPosition ?
    function( a, b ) {
      var adown = a.nodeType === 9 ? a.documentElement : a,
        bup = b && b.parentNode;
      return a === bup || !!( bup && bup.nodeType === 1 && (
        adown.contains ?
          adown.contains( bup ) :
          a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
      ));
    } :
    function( a, b ) {
      if ( b ) {
        while ( (b = b.parentNode) ) {
          if ( b === a ) {
            return true;
          }
        }
      }
      return false;
    };

  /* Sorting
  ---------------------------------------------------------------------- */

  // Document order sorting
  sortOrder = docElem.compareDocumentPosition ?
  function( a, b ) {

    // Flag for duplicate removal
    if ( a === b ) {
      hasDuplicate = true;
      return 0;
    }

    var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b );

    if ( compare ) {
      // Disconnected nodes
      if ( compare & 1 ||
        (!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

        // Choose the first element that is related to our preferred document
        if ( a === doc || contains(preferredDoc, a) ) {
          return -1;
        }
        if ( b === doc || contains(preferredDoc, b) ) {
          return 1;
        }

        // Maintain original order
        return sortInput ?
          ( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
          0;
      }

      return compare & 4 ? -1 : 1;
    }

    // Not directly comparable, sort on existence of method
    return a.compareDocumentPosition ? -1 : 1;
  } :
  function( a, b ) {
    var cur,
      i = 0,
      aup = a.parentNode,
      bup = b.parentNode,
      ap = [ a ],
      bp = [ b ];

    // Exit early if the nodes are identical
    if ( a === b ) {
      hasDuplicate = true;
      return 0;

    // Parentless nodes are either documents or disconnected
    } else if ( !aup || !bup ) {
      return a === doc ? -1 :
        b === doc ? 1 :
        aup ? -1 :
        bup ? 1 :
        sortInput ?
        ( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
        0;

    // If the nodes are siblings, we can do a quick check
    } else if ( aup === bup ) {
      return siblingCheck( a, b );
    }

    // Otherwise we need full lists of their ancestors for comparison
    cur = a;
    while ( (cur = cur.parentNode) ) {
      ap.unshift( cur );
    }
    cur = b;
    while ( (cur = cur.parentNode) ) {
      bp.unshift( cur );
    }

    // Walk down the tree looking for a discrepancy
    while ( ap[i] === bp[i] ) {
      i++;
    }

    return i ?
      // Do a sibling check if the nodes have a common ancestor
      siblingCheck( ap[i], bp[i] ) :

      // Otherwise nodes in our document sort first
      ap[i] === preferredDoc ? -1 :
      bp[i] === preferredDoc ? 1 :
      0;
  };

  return doc;
};

Sizzle.matches = function( expr, elements ) {
  return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
  // Set document vars if needed
  if ( ( elem.ownerDocument || elem ) !== document ) {
    setDocument( elem );
  }

  // Make sure that attribute selectors are quoted
  expr = expr.replace( rattributeQuotes, "='$1']" );

  if ( support.matchesSelector && documentIsHTML &&
    ( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
    ( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

    try {
      var ret = matches.call( elem, expr );

      // IE 9's matchesSelector returns false on disconnected nodes
      if ( ret || support.disconnectedMatch ||
          // As well, disconnected nodes are said to be in a document
          // fragment in IE 9
          elem.document && elem.document.nodeType !== 11 ) {
        return ret;
      }
    } catch(e) {}
  }

  return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
  // Set document vars if needed
  if ( ( context.ownerDocument || context ) !== document ) {
    setDocument( context );
  }
  return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
  // Set document vars if needed
  if ( ( elem.ownerDocument || elem ) !== document ) {
    setDocument( elem );
  }

  var fn = Expr.attrHandle[ name.toLowerCase() ],
    // Don't get fooled by Object.prototype properties (jQuery #13807)
    val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
      fn( elem, name, !documentIsHTML ) :
      undefined;

  return val === undefined ?
    support.attributes || !documentIsHTML ?
      elem.getAttribute( name ) :
      (val = elem.getAttributeNode(name)) && val.specified ?
        val.value :
        null :
    val;
};

Sizzle.error = function( msg ) {
  throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
  var elem,
    duplicates = [],
    j = 0,
    i = 0;

  // Unless we *know* we can detect duplicates, assume their presence
  hasDuplicate = !support.detectDuplicates;
  sortInput = !support.sortStable && results.slice( 0 );
  results.sort( sortOrder );

  if ( hasDuplicate ) {
    while ( (elem = results[i++]) ) {
      if ( elem === results[ i ] ) {
        j = duplicates.push( i );
      }
    }
    while ( j-- ) {
      results.splice( duplicates[ j ], 1 );
    }
  }

  return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
  var node,
    ret = "",
    i = 0,
    nodeType = elem.nodeType;

  if ( !nodeType ) {
    // If no nodeType, this is expected to be an array
    for ( ; (node = elem[i]); i++ ) {
      // Do not traverse comment nodes
      ret += getText( node );
    }
  } else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
    // Use textContent for elements
    // innerText usage removed for consistency of new lines (see #11153)
    if ( typeof elem.textContent === "string" ) {
      return elem.textContent;
    } else {
      // Traverse its children
      for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
        ret += getText( elem );
      }
    }
  } else if ( nodeType === 3 || nodeType === 4 ) {
    return elem.nodeValue;
  }
  // Do not include comment or processing instruction nodes

  return ret;
};

Expr = Sizzle.selectors = {

  // Can be adjusted by the user
  cacheLength: 50,

  createPseudo: markFunction,

  match: matchExpr,

  attrHandle: {},

  find: {},

  relative: {
    ">": { dir: "parentNode", first: true },
    " ": { dir: "parentNode" },
    "+": { dir: "previousSibling", first: true },
    "~": { dir: "previousSibling" }
  },

  preFilter: {
    "ATTR": function( match ) {
      match[1] = match[1].replace( runescape, funescape );

      // Move the given value to match[3] whether quoted or unquoted
      match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

      if ( match[2] === "~=" ) {
        match[3] = " " + match[3] + " ";
      }

      return match.slice( 0, 4 );
    },

    "CHILD": function( match ) {
      /* matches from matchExpr["CHILD"]
        1 type (only|nth|...)
        2 what (child|of-type)
        3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
        4 xn-component of xn+y argument ([+-]?\d*n|)
        5 sign of xn-component
        6 x of xn-component
        7 sign of y-component
        8 y of y-component
      */
      match[1] = match[1].toLowerCase();

      if ( match[1].slice( 0, 3 ) === "nth" ) {
        // nth-* requires argument
        if ( !match[3] ) {
          Sizzle.error( match[0] );
        }

        // numeric x and y parameters for Expr.filter.CHILD
        // remember that false/true cast respectively to 0/1
        match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
        match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

      // other types prohibit arguments
      } else if ( match[3] ) {
        Sizzle.error( match[0] );
      }

      return match;
    },

    "PSEUDO": function( match ) {
      var excess,
        unquoted = !match[5] && match[2];

      if ( matchExpr["CHILD"].test( match[0] ) ) {
        return null;
      }

      // Accept quoted arguments as-is
      if ( match[3] && match[4] !== undefined ) {
        match[2] = match[4];

      // Strip excess characters from unquoted arguments
      } else if ( unquoted && rpseudo.test( unquoted ) &&
        // Get excess from tokenize (recursively)
        (excess = tokenize( unquoted, true )) &&
        // advance to the next closing parenthesis
        (excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

        // excess is a negative index
        match[0] = match[0].slice( 0, excess );
        match[2] = unquoted.slice( 0, excess );
      }

      // Return only captures needed by the pseudo filter method (type and argument)
      return match.slice( 0, 3 );
    }
  },

  filter: {

    "TAG": function( nodeNameSelector ) {
      var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
      return nodeNameSelector === "*" ?
        function() { return true; } :
        function( elem ) {
          return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
        };
    },

    "CLASS": function( className ) {
      var pattern = classCache[ className + " " ];

      return pattern ||
        (pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
        classCache( className, function( elem ) {
          return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
        });
    },

    "ATTR": function( name, operator, check ) {
      return function( elem ) {
        var result = Sizzle.attr( elem, name );

        if ( result == null ) {
          return operator === "!=";
        }
        if ( !operator ) {
          return true;
        }

        result += "";

        return operator === "=" ? result === check :
          operator === "!=" ? result !== check :
          operator === "^=" ? check && result.indexOf( check ) === 0 :
          operator === "*=" ? check && result.indexOf( check ) > -1 :
          operator === "$=" ? check && result.slice( -check.length ) === check :
          operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
          operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
          false;
      };
    },

    "CHILD": function( type, what, argument, first, last ) {
      var simple = type.slice( 0, 3 ) !== "nth",
        forward = type.slice( -4 ) !== "last",
        ofType = what === "of-type";

      return first === 1 && last === 0 ?

        // Shortcut for :nth-*(n)
        function( elem ) {
          return !!elem.parentNode;
        } :

        function( elem, context, xml ) {
          var cache, outerCache, node, diff, nodeIndex, start,
            dir = simple !== forward ? "nextSibling" : "previousSibling",
            parent = elem.parentNode,
            name = ofType && elem.nodeName.toLowerCase(),
            useCache = !xml && !ofType;

          if ( parent ) {

            // :(first|last|only)-(child|of-type)
            if ( simple ) {
              while ( dir ) {
                node = elem;
                while ( (node = node[ dir ]) ) {
                  if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
                    return false;
                  }
                }
                // Reverse direction for :only-* (if we haven't yet done so)
                start = dir = type === "only" && !start && "nextSibling";
              }
              return true;
            }

            start = [ forward ? parent.firstChild : parent.lastChild ];

            // non-xml :nth-child(...) stores cache data on `parent`
            if ( forward && useCache ) {
              // Seek `elem` from a previously-cached index
              outerCache = parent[ expando ] || (parent[ expando ] = {});
              cache = outerCache[ type ] || [];
              nodeIndex = cache[0] === dirruns && cache[1];
              diff = cache[0] === dirruns && cache[2];
              node = nodeIndex && parent.childNodes[ nodeIndex ];

              while ( (node = ++nodeIndex && node && node[ dir ] ||

                // Fallback to seeking `elem` from the start
                (diff = nodeIndex = 0) || start.pop()) ) {

                // When found, cache indexes on `parent` and break
                if ( node.nodeType === 1 && ++diff && node === elem ) {
                  outerCache[ type ] = [ dirruns, nodeIndex, diff ];
                  break;
                }
              }

            // Use previously-cached element index if available
            } else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
              diff = cache[1];

            // xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
            } else {
              // Use the same loop as above to seek `elem` from the start
              while ( (node = ++nodeIndex && node && node[ dir ] ||
                (diff = nodeIndex = 0) || start.pop()) ) {

                if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
                  // Cache the index of each encountered element
                  if ( useCache ) {
                    (node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
                  }

                  if ( node === elem ) {
                    break;
                  }
                }
              }
            }

            // Incorporate the offset, then check against cycle size
            diff -= last;
            return diff === first || ( diff % first === 0 && diff / first >= 0 );
          }
        };
    },

    "PSEUDO": function( pseudo, argument ) {
      // pseudo-class names are case-insensitive
      // http://www.w3.org/TR/selectors/#pseudo-classes
      // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
      // Remember that setFilters inherits from pseudos
      var args,
        fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
          Sizzle.error( "unsupported pseudo: " + pseudo );

      // The user may use createPseudo to indicate that
      // arguments are needed to create the filter function
      // just as Sizzle does
      if ( fn[ expando ] ) {
        return fn( argument );
      }

      // But maintain support for old signatures
      if ( fn.length > 1 ) {
        args = [ pseudo, pseudo, "", argument ];
        return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
          markFunction(function( seed, matches ) {
            var idx,
              matched = fn( seed, argument ),
              i = matched.length;
            while ( i-- ) {
              idx = indexOf.call( seed, matched[i] );
              seed[ idx ] = !( matches[ idx ] = matched[i] );
            }
          }) :
          function( elem ) {
            return fn( elem, 0, args );
          };
      }

      return fn;
    }
  },

  pseudos: {
    // Potentially complex pseudos
    "not": markFunction(function( selector ) {
      // Trim the selector passed to compile
      // to avoid treating leading and trailing
      // spaces as combinators
      var input = [],
        results = [],
        matcher = compile( selector.replace( rtrim, "$1" ) );

      return matcher[ expando ] ?
        markFunction(function( seed, matches, context, xml ) {
          var elem,
            unmatched = matcher( seed, null, xml, [] ),
            i = seed.length;

          // Match elements unmatched by `matcher`
          while ( i-- ) {
            if ( (elem = unmatched[i]) ) {
              seed[i] = !(matches[i] = elem);
            }
          }
        }) :
        function( elem, context, xml ) {
          input[0] = elem;
          matcher( input, null, xml, results );
          return !results.pop();
        };
    }),

    "has": markFunction(function( selector ) {
      return function( elem ) {
        return Sizzle( selector, elem ).length > 0;
      };
    }),

    "contains": markFunction(function( text ) {
      return function( elem ) {
        return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
      };
    }),

    // "Whether an element is represented by a :lang() selector
    // is based solely on the element's language value
    // being equal to the identifier C,
    // or beginning with the identifier C immediately followed by "-".
    // The matching of C against the element's language value is performed case-insensitively.
    // The identifier C does not have to be a valid language name."
    // http://www.w3.org/TR/selectors/#lang-pseudo
    "lang": markFunction( function( lang ) {
      // lang value must be a valid identifier
      if ( !ridentifier.test(lang || "") ) {
        Sizzle.error( "unsupported lang: " + lang );
      }
      lang = lang.replace( runescape, funescape ).toLowerCase();
      return function( elem ) {
        var elemLang;
        do {
          if ( (elemLang = documentIsHTML ?
            elem.lang :
            elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

            elemLang = elemLang.toLowerCase();
            return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
          }
        } while ( (elem = elem.parentNode) && elem.nodeType === 1 );
        return false;
      };
    }),

    // Miscellaneous
    "target": function( elem ) {
      var hash = window.location && window.location.hash;
      return hash && hash.slice( 1 ) === elem.id;
    },

    "root": function( elem ) {
      return elem === docElem;
    },

    "focus": function( elem ) {
      return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
    },

    // Boolean properties
    "enabled": function( elem ) {
      return elem.disabled === false;
    },

    "disabled": function( elem ) {
      return elem.disabled === true;
    },

    "checked": function( elem ) {
      // In CSS3, :checked should return both checked and selected elements
      // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
      var nodeName = elem.nodeName.toLowerCase();
      return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
    },

    "selected": function( elem ) {
      // Accessing this property makes selected-by-default
      // options in Safari work properly
      if ( elem.parentNode ) {
        elem.parentNode.selectedIndex;
      }

      return elem.selected === true;
    },

    // Contents
    "empty": function( elem ) {
      // http://www.w3.org/TR/selectors/#empty-pseudo
      // :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
      //   not comment, processing instructions, or others
      // Thanks to Diego Perini for the nodeName shortcut
      //   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
      for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
        if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
          return false;
        }
      }
      return true;
    },

    "parent": function( elem ) {
      return !Expr.pseudos["empty"]( elem );
    },

    // Element/input types
    "header": function( elem ) {
      return rheader.test( elem.nodeName );
    },

    "input": function( elem ) {
      return rinputs.test( elem.nodeName );
    },

    "button": function( elem ) {
      var name = elem.nodeName.toLowerCase();
      return name === "input" && elem.type === "button" || name === "button";
    },

    "text": function( elem ) {
      var attr;
      // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
      // use getAttribute instead to test this case
      return elem.nodeName.toLowerCase() === "input" &&
        elem.type === "text" &&
        ( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
    },

    // Position-in-collection
    "first": createPositionalPseudo(function() {
      return [ 0 ];
    }),

    "last": createPositionalPseudo(function( matchIndexes, length ) {
      return [ length - 1 ];
    }),

    "eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
      return [ argument < 0 ? argument + length : argument ];
    }),

    "even": createPositionalPseudo(function( matchIndexes, length ) {
      var i = 0;
      for ( ; i < length; i += 2 ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    }),

    "odd": createPositionalPseudo(function( matchIndexes, length ) {
      var i = 1;
      for ( ; i < length; i += 2 ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    }),

    "lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
      var i = argument < 0 ? argument + length : argument;
      for ( ; --i >= 0; ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    }),

    "gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
      var i = argument < 0 ? argument + length : argument;
      for ( ; ++i < length; ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    })
  }
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
  Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
  Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

function tokenize( selector, parseOnly ) {
  var matched, match, tokens, type,
    soFar, groups, preFilters,
    cached = tokenCache[ selector + " " ];

  if ( cached ) {
    return parseOnly ? 0 : cached.slice( 0 );
  }

  soFar = selector;
  groups = [];
  preFilters = Expr.preFilter;

  while ( soFar ) {

    // Comma and first run
    if ( !matched || (match = rcomma.exec( soFar )) ) {
      if ( match ) {
        // Don't consume trailing commas as valid
        soFar = soFar.slice( match[0].length ) || soFar;
      }
      groups.push( tokens = [] );
    }

    matched = false;

    // Combinators
    if ( (match = rcombinators.exec( soFar )) ) {
      matched = match.shift();
      tokens.push({
        value: matched,
        // Cast descendant combinators to space
        type: match[0].replace( rtrim, " " )
      });
      soFar = soFar.slice( matched.length );
    }

    // Filters
    for ( type in Expr.filter ) {
      if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
        (match = preFilters[ type ]( match ))) ) {
        matched = match.shift();
        tokens.push({
          value: matched,
          type: type,
          matches: match
        });
        soFar = soFar.slice( matched.length );
      }
    }

    if ( !matched ) {
      break;
    }
  }

  // Return the length of the invalid excess
  // if we're just parsing
  // Otherwise, throw an error or return tokens
  return parseOnly ?
    soFar.length :
    soFar ?
      Sizzle.error( selector ) :
      // Cache the tokens
      tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
  var i = 0,
    len = tokens.length,
    selector = "";
  for ( ; i < len; i++ ) {
    selector += tokens[i].value;
  }
  return selector;
}

function addCombinator( matcher, combinator, base ) {
  var dir = combinator.dir,
    checkNonElements = base && dir === "parentNode",
    doneName = done++;

  return combinator.first ?
    // Check against closest ancestor/preceding element
    function( elem, context, xml ) {
      while ( (elem = elem[ dir ]) ) {
        if ( elem.nodeType === 1 || checkNonElements ) {
          return matcher( elem, context, xml );
        }
      }
    } :

    // Check against all ancestor/preceding elements
    function( elem, context, xml ) {
      var data, cache, outerCache,
        dirkey = dirruns + " " + doneName;

      // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
      if ( xml ) {
        while ( (elem = elem[ dir ]) ) {
          if ( elem.nodeType === 1 || checkNonElements ) {
            if ( matcher( elem, context, xml ) ) {
              return true;
            }
          }
        }
      } else {
        while ( (elem = elem[ dir ]) ) {
          if ( elem.nodeType === 1 || checkNonElements ) {
            outerCache = elem[ expando ] || (elem[ expando ] = {});
            if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
              if ( (data = cache[1]) === true || data === cachedruns ) {
                return data === true;
              }
            } else {
              cache = outerCache[ dir ] = [ dirkey ];
              cache[1] = matcher( elem, context, xml ) || cachedruns;
              if ( cache[1] === true ) {
                return true;
              }
            }
          }
        }
      }
    };
}

function elementMatcher( matchers ) {
  return matchers.length > 1 ?
    function( elem, context, xml ) {
      var i = matchers.length;
      while ( i-- ) {
        if ( !matchers[i]( elem, context, xml ) ) {
          return false;
        }
      }
      return true;
    } :
    matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
  var elem,
    newUnmatched = [],
    i = 0,
    len = unmatched.length,
    mapped = map != null;

  for ( ; i < len; i++ ) {
    if ( (elem = unmatched[i]) ) {
      if ( !filter || filter( elem, context, xml ) ) {
        newUnmatched.push( elem );
        if ( mapped ) {
          map.push( i );
        }
      }
    }
  }

  return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
  if ( postFilter && !postFilter[ expando ] ) {
    postFilter = setMatcher( postFilter );
  }
  if ( postFinder && !postFinder[ expando ] ) {
    postFinder = setMatcher( postFinder, postSelector );
  }
  return markFunction(function( seed, results, context, xml ) {
    var temp, i, elem,
      preMap = [],
      postMap = [],
      preexisting = results.length,

      // Get initial elements from seed or context
      elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

      // Prefilter to get matcher input, preserving a map for seed-results synchronization
      matcherIn = preFilter && ( seed || !selector ) ?
        condense( elems, preMap, preFilter, context, xml ) :
        elems,

      matcherOut = matcher ?
        // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
        postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

          // ...intermediate processing is necessary
          [] :

          // ...otherwise use results directly
          results :
        matcherIn;

    // Find primary matches
    if ( matcher ) {
      matcher( matcherIn, matcherOut, context, xml );
    }

    // Apply postFilter
    if ( postFilter ) {
      temp = condense( matcherOut, postMap );
      postFilter( temp, [], context, xml );

      // Un-match failing elements by moving them back to matcherIn
      i = temp.length;
      while ( i-- ) {
        if ( (elem = temp[i]) ) {
          matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
        }
      }
    }

    if ( seed ) {
      if ( postFinder || preFilter ) {
        if ( postFinder ) {
          // Get the final matcherOut by condensing this intermediate into postFinder contexts
          temp = [];
          i = matcherOut.length;
          while ( i-- ) {
            if ( (elem = matcherOut[i]) ) {
              // Restore matcherIn since elem is not yet a final match
              temp.push( (matcherIn[i] = elem) );
            }
          }
          postFinder( null, (matcherOut = []), temp, xml );
        }

        // Move matched elements from seed to results to keep them synchronized
        i = matcherOut.length;
        while ( i-- ) {
          if ( (elem = matcherOut[i]) &&
            (temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

            seed[temp] = !(results[temp] = elem);
          }
        }
      }

    // Add elements to results, through postFinder if defined
    } else {
      matcherOut = condense(
        matcherOut === results ?
          matcherOut.splice( preexisting, matcherOut.length ) :
          matcherOut
      );
      if ( postFinder ) {
        postFinder( null, results, matcherOut, xml );
      } else {
        push.apply( results, matcherOut );
      }
    }
  });
}

function matcherFromTokens( tokens ) {
  var checkContext, matcher, j,
    len = tokens.length,
    leadingRelative = Expr.relative[ tokens[0].type ],
    implicitRelative = leadingRelative || Expr.relative[" "],
    i = leadingRelative ? 1 : 0,

    // The foundational matcher ensures that elements are reachable from top-level context(s)
    matchContext = addCombinator( function( elem ) {
      return elem === checkContext;
    }, implicitRelative, true ),
    matchAnyContext = addCombinator( function( elem ) {
      return indexOf.call( checkContext, elem ) > -1;
    }, implicitRelative, true ),
    matchers = [ function( elem, context, xml ) {
      return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
        (checkContext = context).nodeType ?
          matchContext( elem, context, xml ) :
          matchAnyContext( elem, context, xml ) );
    } ];

  for ( ; i < len; i++ ) {
    if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
      matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
    } else {
      matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

      // Return special upon seeing a positional matcher
      if ( matcher[ expando ] ) {
        // Find the next relative operator (if any) for proper handling
        j = ++i;
        for ( ; j < len; j++ ) {
          if ( Expr.relative[ tokens[j].type ] ) {
            break;
          }
        }
        return setMatcher(
          i > 1 && elementMatcher( matchers ),
          i > 1 && toSelector(
            // If the preceding token was a descendant combinator, insert an implicit any-element `*`
            tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
          ).replace( rtrim, "$1" ),
          matcher,
          i < j && matcherFromTokens( tokens.slice( i, j ) ),
          j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
          j < len && toSelector( tokens )
        );
      }
      matchers.push( matcher );
    }
  }

  return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
  // A counter to specify which element is currently being matched
  var matcherCachedRuns = 0,
    bySet = setMatchers.length > 0,
    byElement = elementMatchers.length > 0,
    superMatcher = function( seed, context, xml, results, expandContext ) {
      var elem, j, matcher,
        setMatched = [],
        matchedCount = 0,
        i = "0",
        unmatched = seed && [],
        outermost = expandContext != null,
        contextBackup = outermostContext,
        // We must always have either seed elements or context
        elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
        // Use integer dirruns iff this is the outermost matcher
        dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

      if ( outermost ) {
        outermostContext = context !== document && context;
        cachedruns = matcherCachedRuns;
      }

      // Add elements passing elementMatchers directly to results
      // Keep `i` a string if there are no elements so `matchedCount` will be "00" below
      for ( ; (elem = elems[i]) != null; i++ ) {
        if ( byElement && elem ) {
          j = 0;
          while ( (matcher = elementMatchers[j++]) ) {
            if ( matcher( elem, context, xml ) ) {
              results.push( elem );
              break;
            }
          }
          if ( outermost ) {
            dirruns = dirrunsUnique;
            cachedruns = ++matcherCachedRuns;
          }
        }

        // Track unmatched elements for set filters
        if ( bySet ) {
          // They will have gone through all possible matchers
          if ( (elem = !matcher && elem) ) {
            matchedCount--;
          }

          // Lengthen the array for every element, matched or not
          if ( seed ) {
            unmatched.push( elem );
          }
        }
      }

      // Apply set filters to unmatched elements
      matchedCount += i;
      if ( bySet && i !== matchedCount ) {
        j = 0;
        while ( (matcher = setMatchers[j++]) ) {
          matcher( unmatched, setMatched, context, xml );
        }

        if ( seed ) {
          // Reintegrate element matches to eliminate the need for sorting
          if ( matchedCount > 0 ) {
            while ( i-- ) {
              if ( !(unmatched[i] || setMatched[i]) ) {
                setMatched[i] = pop.call( results );
              }
            }
          }

          // Discard index placeholder values to get only actual matches
          setMatched = condense( setMatched );
        }

        // Add matches to results
        push.apply( results, setMatched );

        // Seedless set matches succeeding multiple successful matchers stipulate sorting
        if ( outermost && !seed && setMatched.length > 0 &&
          ( matchedCount + setMatchers.length ) > 1 ) {

          Sizzle.uniqueSort( results );
        }
      }

      // Override manipulation of globals by nested matchers
      if ( outermost ) {
        dirruns = dirrunsUnique;
        outermostContext = contextBackup;
      }

      return unmatched;
    };

  return bySet ?
    markFunction( superMatcher ) :
    superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
  var i,
    setMatchers = [],
    elementMatchers = [],
    cached = compilerCache[ selector + " " ];

  if ( !cached ) {
    // Generate a function of recursive functions that can be used to check each element
    if ( !group ) {
      group = tokenize( selector );
    }
    i = group.length;
    while ( i-- ) {
      cached = matcherFromTokens( group[i] );
      if ( cached[ expando ] ) {
        setMatchers.push( cached );
      } else {
        elementMatchers.push( cached );
      }
    }

    // Cache the compiled function
    cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
  }
  return cached;
};

function multipleContexts( selector, contexts, results ) {
  var i = 0,
    len = contexts.length;
  for ( ; i < len; i++ ) {
    Sizzle( selector, contexts[i], results );
  }
  return results;
}

function select( selector, context, results, seed ) {
  var i, tokens, token, type, find,
    match = tokenize( selector );

  if ( !seed ) {
    // Try to minimize operations if there is only one group
    if ( match.length === 1 ) {

      // Take a shortcut and set the context if the root selector is an ID
      tokens = match[0] = match[0].slice( 0 );
      if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
          support.getById && context.nodeType === 9 && documentIsHTML &&
          Expr.relative[ tokens[1].type ] ) {

        context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
        if ( !context ) {
          return results;
        }
        selector = selector.slice( tokens.shift().value.length );
      }

      // Fetch a seed set for right-to-left matching
      i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
      while ( i-- ) {
        token = tokens[i];

        // Abort if we hit a combinator
        if ( Expr.relative[ (type = token.type) ] ) {
          break;
        }
        if ( (find = Expr.find[ type ]) ) {
          // Search, expanding context for leading sibling combinators
          if ( (seed = find(
            token.matches[0].replace( runescape, funescape ),
            rsibling.test( tokens[0].type ) && context.parentNode || context
          )) ) {

            // If seed is empty or no tokens remain, we can return early
            tokens.splice( i, 1 );
            selector = seed.length && toSelector( tokens );
            if ( !selector ) {
              push.apply( results, seed );
              return results;
            }

            break;
          }
        }
      }
    }
  }

  // Compile and execute a filtering function
  // Provide `match` to avoid retokenization if we modified the selector above
  compile( selector, match )(
    seed,
    context,
    !documentIsHTML,
    results,
    rsibling.test( selector )
  );
  return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
  // Should return 1, but returns 4 (following)
  return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
  div.innerHTML = "<a href='#'></a>";
  return div.firstChild.getAttribute("href") === "#" ;
}) ) {
  addHandle( "type|href|height|width", function( elem, name, isXML ) {
    if ( !isXML ) {
      return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
    }
  });
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
  div.innerHTML = "<input/>";
  div.firstChild.setAttribute( "value", "" );
  return div.firstChild.getAttribute( "value" ) === "";
}) ) {
  addHandle( "value", function( elem, name, isXML ) {
    if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
      return elem.defaultValue;
    }
  });
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
  return div.getAttribute("disabled") == null;
}) ) {
  addHandle( booleans, function( elem, name, isXML ) {
    var val;
    if ( !isXML ) {
      return (val = elem.getAttributeNode( name )) && val.specified ?
        val.value :
        elem[ name ] === true ? name.toLowerCase() : null;
    }
  });
}

jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
  var object = optionsCache[ options ] = {};
  jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
    object[ flag ] = true;
  });
  return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *  options: an optional list of space-separated options that will change how
 *      the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *  once:     will ensure the callback list can only be fired once (like a Deferred)
 *
 *  memory:     will keep track of previous values and will call any callback added
 *          after the list has been fired right away with the latest "memorized"
 *          values (like a Deferred)
 *
 *  unique:     will ensure a callback can only be added once (no duplicate in the list)
 *
 *  stopOnFalse:  interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

  // Convert options from String-formatted to Object-formatted if needed
  // (we check in cache first)
  options = typeof options === "string" ?
    ( optionsCache[ options ] || createOptions( options ) ) :
    jQuery.extend( {}, options );

  var // Last fire value (for non-forgettable lists)
    memory,
    // Flag to know if list was already fired
    fired,
    // Flag to know if list is currently firing
    firing,
    // First callback to fire (used internally by add and fireWith)
    firingStart,
    // End of the loop when firing
    firingLength,
    // Index of currently firing callback (modified by remove if needed)
    firingIndex,
    // Actual callback list
    list = [],
    // Stack of fire calls for repeatable lists
    stack = !options.once && [],
    // Fire callbacks
    fire = function( data ) {
      memory = options.memory && data;
      fired = true;
      firingIndex = firingStart || 0;
      firingStart = 0;
      firingLength = list.length;
      firing = true;
      for ( ; list && firingIndex < firingLength; firingIndex++ ) {
        if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
          memory = false; // To prevent further calls using add
          break;
        }
      }
      firing = false;
      if ( list ) {
        if ( stack ) {
          if ( stack.length ) {
            fire( stack.shift() );
          }
        } else if ( memory ) {
          list = [];
        } else {
          self.disable();
        }
      }
    },
    // Actual Callbacks object
    self = {
      // Add a callback or a collection of callbacks to the list
      add: function() {
        if ( list ) {
          // First, we save the current length
          var start = list.length;
          (function add( args ) {
            jQuery.each( args, function( _, arg ) {
              var type = jQuery.type( arg );
              if ( type === "function" ) {
                if ( !options.unique || !self.has( arg ) ) {
                  list.push( arg );
                }
              } else if ( arg && arg.length && type !== "string" ) {
                // Inspect recursively
                add( arg );
              }
            });
          })( arguments );
          // Do we need to add the callbacks to the
          // current firing batch?
          if ( firing ) {
            firingLength = list.length;
          // With memory, if we're not firing then
          // we should call right away
          } else if ( memory ) {
            firingStart = start;
            fire( memory );
          }
        }
        return this;
      },
      // Remove a callback from the list
      remove: function() {
        if ( list ) {
          jQuery.each( arguments, function( _, arg ) {
            var index;
            while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
              list.splice( index, 1 );
              // Handle firing indexes
              if ( firing ) {
                if ( index <= firingLength ) {
                  firingLength--;
                }
                if ( index <= firingIndex ) {
                  firingIndex--;
                }
              }
            }
          });
        }
        return this;
      },
      // Check if a given callback is in the list.
      // If no argument is given, return whether or not list has callbacks attached.
      has: function( fn ) {
        return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
      },
      // Remove all callbacks from the list
      empty: function() {
        list = [];
        firingLength = 0;
        return this;
      },
      // Have the list do nothing anymore
      disable: function() {
        list = stack = memory = undefined;
        return this;
      },
      // Is it disabled?
      disabled: function() {
        return !list;
      },
      // Lock the list in its current state
      lock: function() {
        stack = undefined;
        if ( !memory ) {
          self.disable();
        }
        return this;
      },
      // Is it locked?
      locked: function() {
        return !stack;
      },
      // Call all callbacks with the given context and arguments
      fireWith: function( context, args ) {
        if ( list && ( !fired || stack ) ) {
          args = args || [];
          args = [ context, args.slice ? args.slice() : args ];
          if ( firing ) {
            stack.push( args );
          } else {
            fire( args );
          }
        }
        return this;
      },
      // Call all the callbacks with the given arguments
      fire: function() {
        self.fireWith( this, arguments );
        return this;
      },
      // To know if the callbacks have already been called at least once
      fired: function() {
        return !!fired;
      }
    };

  return self;
};
jQuery.extend({

  Deferred: function( func ) {
    var tuples = [
        // action, add listener, listener list, final state
        [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
        [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
        [ "notify", "progress", jQuery.Callbacks("memory") ]
      ],
      state = "pending",
      promise = {
        state: function() {
          return state;
        },
        always: function() {
          deferred.done( arguments ).fail( arguments );
          return this;
        },
        then: function( /* fnDone, fnFail, fnProgress */ ) {
          var fns = arguments;
          return jQuery.Deferred(function( newDefer ) {
            jQuery.each( tuples, function( i, tuple ) {
              var action = tuple[ 0 ],
                fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
              // deferred[ done | fail | progress ] for forwarding actions to newDefer
              deferred[ tuple[1] ](function() {
                var returned = fn && fn.apply( this, arguments );
                if ( returned && jQuery.isFunction( returned.promise ) ) {
                  returned.promise()
                    .done( newDefer.resolve )
                    .fail( newDefer.reject )
                    .progress( newDefer.notify );
                } else {
                  newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
                }
              });
            });
            fns = null;
          }).promise();
        },
        // Get a promise for this deferred
        // If obj is provided, the promise aspect is added to the object
        promise: function( obj ) {
          return obj != null ? jQuery.extend( obj, promise ) : promise;
        }
      },
      deferred = {};

    // Keep pipe for back-compat
    promise.pipe = promise.then;

    // Add list-specific methods
    jQuery.each( tuples, function( i, tuple ) {
      var list = tuple[ 2 ],
        stateString = tuple[ 3 ];

      // promise[ done | fail | progress ] = list.add
      promise[ tuple[1] ] = list.add;

      // Handle state
      if ( stateString ) {
        list.add(function() {
          // state = [ resolved | rejected ]
          state = stateString;

        // [ reject_list | resolve_list ].disable; progress_list.lock
        }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
      }

      // deferred[ resolve | reject | notify ]
      deferred[ tuple[0] ] = function() {
        deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
        return this;
      };
      deferred[ tuple[0] + "With" ] = list.fireWith;
    });

    // Make the deferred a promise
    promise.promise( deferred );

    // Call given func if any
    if ( func ) {
      func.call( deferred, deferred );
    }

    // All done!
    return deferred;
  },

  // Deferred helper
  when: function( subordinate /* , ..., subordinateN */ ) {
    var i = 0,
      resolveValues = core_slice.call( arguments ),
      length = resolveValues.length,

      // the count of uncompleted subordinates
      remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

      // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
      deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

      // Update function for both resolve and progress values
      updateFunc = function( i, contexts, values ) {
        return function( value ) {
          contexts[ i ] = this;
          values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
          if( values === progressValues ) {
            deferred.notifyWith( contexts, values );
          } else if ( !( --remaining ) ) {
            deferred.resolveWith( contexts, values );
          }
        };
      },

      progressValues, progressContexts, resolveContexts;

    // add listeners to Deferred subordinates; treat others as resolved
    if ( length > 1 ) {
      progressValues = new Array( length );
      progressContexts = new Array( length );
      resolveContexts = new Array( length );
      for ( ; i < length; i++ ) {
        if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
          resolveValues[ i ].promise()
            .done( updateFunc( i, resolveContexts, resolveValues ) )
            .fail( deferred.reject )
            .progress( updateFunc( i, progressContexts, progressValues ) );
        } else {
          --remaining;
        }
      }
    }

    // if we're not waiting on anything, resolve the master
    if ( !remaining ) {
      deferred.resolveWith( resolveContexts, resolveValues );
    }

    return deferred.promise();
  }
});
jQuery.support = (function( support ) {
  var input = document.createElement("input"),
    fragment = document.createDocumentFragment(),
    div = document.createElement("div"),
    select = document.createElement("select"),
    opt = select.appendChild( document.createElement("option") );

  // Finish early in limited environments
  if ( !input.type ) {
    return support;
  }

  input.type = "checkbox";

  // Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
  // Check the default checkbox/radio value ("" on old WebKit; "on" elsewhere)
  support.checkOn = input.value !== "";

  // Must access the parent to make an option select properly
  // Support: IE9, IE10
  support.optSelected = opt.selected;

  // Will be defined later
  support.reliableMarginRight = true;
  support.boxSizingReliable = true;
  support.pixelPosition = false;

  // Make sure checked status is properly cloned
  // Support: IE9, IE10
  input.checked = true;
  support.noCloneChecked = input.cloneNode( true ).checked;

  // Make sure that the options inside disabled selects aren't marked as disabled
  // (WebKit marks them as disabled)
  select.disabled = true;
  support.optDisabled = !opt.disabled;

  // Check if an input maintains its value after becoming a radio
  // Support: IE9, IE10
  input = document.createElement("input");
  input.value = "t";
  input.type = "radio";
  support.radioValue = input.value === "t";

  // #11217 - WebKit loses check when the name is after the checked attribute
  input.setAttribute( "checked", "t" );
  input.setAttribute( "name", "t" );

  fragment.appendChild( input );

  // Support: Safari 5.1, Android 4.x, Android 2.3
  // old WebKit doesn't clone checked state correctly in fragments
  support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

  // Support: Firefox, Chrome, Safari
  // Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
  support.focusinBubbles = "onfocusin" in window;

  div.style.backgroundClip = "content-box";
  div.cloneNode( true ).style.backgroundClip = "";
  support.clearCloneStyle = div.style.backgroundClip === "content-box";

  // Run tests that need a body at doc ready
  jQuery(function() {
    var container, marginDiv,
      // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
      divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",
      body = document.getElementsByTagName("body")[ 0 ];

    if ( !body ) {
      // Return for frameset docs that don't have a body
      return;
    }

    container = document.createElement("div");
    container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

    // Check box-sizing and margin behavior.
    body.appendChild( container ).appendChild( div );
    div.innerHTML = "";
    // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
    div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%";

    // Workaround failing boxSizing test due to offsetWidth returning wrong value
    // with some non-1 values of body zoom, ticket #13543
    jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
      support.boxSizing = div.offsetWidth === 4;
    });

    // Use window.getComputedStyle because jsdom on node.js will break without it.
    if ( window.getComputedStyle ) {
      support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
      support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

      // Support: Android 2.3
      // Check if div with explicit width and no margin-right incorrectly
      // gets computed margin-right based on width of container. (#3333)
      // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
      marginDiv = div.appendChild( document.createElement("div") );
      marginDiv.style.cssText = div.style.cssText = divReset;
      marginDiv.style.marginRight = marginDiv.style.width = "0";
      div.style.width = "1px";

      support.reliableMarginRight =
        !parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
    }

    body.removeChild( container );
  });

  return support;
})( {} );

/*
  Implementation Summary

  1. Enforce API surface and semantic compatibility with 1.9.x branch
  2. Improve the module's maintainability by reducing the storage
    paths to a single mechanism.
  3. Use the same single mechanism to support "private" and "user" data.
  4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
  5. Avoid exposing implementation details on user objects (eg. expando properties)
  6. Provide a clear path for implementation upgrade to WeakMap in 2014
*/
var data_user, data_priv,
  rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
  rmultiDash = /([A-Z])/g;

function Data() {
  // Support: Android < 4,
  // Old WebKit does not have Object.preventExtensions/freeze method,
  // return new empty object instead with no [[set]] accessor
  Object.defineProperty( this.cache = {}, 0, {
    get: function() {
      return {};
    }
  });

  this.expando = jQuery.expando + Math.random();
}

Data.uid = 1;

Data.accepts = function( owner ) {
  // Accepts only:
  //  - Node
  //    - Node.ELEMENT_NODE
  //    - Node.DOCUMENT_NODE
  //  - Object
  //    - Any
  return owner.nodeType ?
    owner.nodeType === 1 || owner.nodeType === 9 : true;
};

Data.prototype = {
  key: function( owner ) {
    // We can accept data for non-element nodes in modern browsers,
    // but we should not, see #8335.
    // Always return the key for a frozen object.
    if ( !Data.accepts( owner ) ) {
      return 0;
    }

    var descriptor = {},
      // Check if the owner object already has a cache key
      unlock = owner[ this.expando ];

    // If not, create one
    if ( !unlock ) {
      unlock = Data.uid++;

      // Secure it in a non-enumerable, non-writable property
      try {
        descriptor[ this.expando ] = { value: unlock };
        Object.defineProperties( owner, descriptor );

      // Support: Android < 4
      // Fallback to a less secure definition
      } catch ( e ) {
        descriptor[ this.expando ] = unlock;
        jQuery.extend( owner, descriptor );
      }
    }

    // Ensure the cache object
    if ( !this.cache[ unlock ] ) {
      this.cache[ unlock ] = {};
    }

    return unlock;
  },
  set: function( owner, data, value ) {
    var prop,
      // There may be an unlock assigned to this node,
      // if there is no entry for this "owner", create one inline
      // and set the unlock as though an owner entry had always existed
      unlock = this.key( owner ),
      cache = this.cache[ unlock ];

    // Handle: [ owner, key, value ] args
    if ( typeof data === "string" ) {
      cache[ data ] = value;

    // Handle: [ owner, { properties } ] args
    } else {
      // Fresh assignments by object are shallow copied
      if ( jQuery.isEmptyObject( cache ) ) {
        jQuery.extend( this.cache[ unlock ], data );
      // Otherwise, copy the properties one-by-one to the cache object
      } else {
        for ( prop in data ) {
          cache[ prop ] = data[ prop ];
        }
      }
    }
    return cache;
  },
  get: function( owner, key ) {
    // Either a valid cache is found, or will be created.
    // New caches will be created and the unlock returned,
    // allowing direct access to the newly created
    // empty data object. A valid owner object must be provided.
    var cache = this.cache[ this.key( owner ) ];

    return key === undefined ?
      cache : cache[ key ];
  },
  access: function( owner, key, value ) {
    var stored;
    // In cases where either:
    //
    //   1. No key was specified
    //   2. A string key was specified, but no value provided
    //
    // Take the "read" path and allow the get method to determine
    // which value to return, respectively either:
    //
    //   1. The entire cache object
    //   2. The data stored at the key
    //
    if ( key === undefined ||
        ((key && typeof key === "string") && value === undefined) ) {

      stored = this.get( owner, key );

      return stored !== undefined ?
        stored : this.get( owner, jQuery.camelCase(key) );
    }

    // [*]When the key is not a string, or both a key and value
    // are specified, set or extend (existing objects) with either:
    //
    //   1. An object of properties
    //   2. A key and value
    //
    this.set( owner, key, value );

    // Since the "set" path can have two possible entry points
    // return the expected data based on which path was taken[*]
    return value !== undefined ? value : key;
  },
  remove: function( owner, key ) {
    var i, name, camel,
      unlock = this.key( owner ),
      cache = this.cache[ unlock ];

    if ( key === undefined ) {
      this.cache[ unlock ] = {};

    } else {
      // Support array or space separated string of keys
      if ( jQuery.isArray( key ) ) {
        // If "name" is an array of keys...
        // When data is initially created, via ("key", "val") signature,
        // keys will be converted to camelCase.
        // Since there is no way to tell _how_ a key was added, remove
        // both plain key and camelCase key. #12786
        // This will only penalize the array argument path.
        name = key.concat( key.map( jQuery.camelCase ) );
      } else {
        camel = jQuery.camelCase( key );
        // Try the string as a key before any manipulation
        if ( key in cache ) {
          name = [ key, camel ];
        } else {
          // If a key with the spaces exists, use it.
          // Otherwise, create an array by matching non-whitespace
          name = camel;
          name = name in cache ?
            [ name ] : ( name.match( core_rnotwhite ) || [] );
        }
      }

      i = name.length;
      while ( i-- ) {
        delete cache[ name[ i ] ];
      }
    }
  },
  hasData: function( owner ) {
    return !jQuery.isEmptyObject(
      this.cache[ owner[ this.expando ] ] || {}
    );
  },
  discard: function( owner ) {
    if ( owner[ this.expando ] ) {
      delete this.cache[ owner[ this.expando ] ];
    }
  }
};

// These may be used throughout the jQuery core codebase
data_user = new Data();
data_priv = new Data();


jQuery.extend({
  acceptData: Data.accepts,

  hasData: function( elem ) {
    return data_user.hasData( elem ) || data_priv.hasData( elem );
  },

  data: function( elem, name, data ) {
    return data_user.access( elem, name, data );
  },

  removeData: function( elem, name ) {
    data_user.remove( elem, name );
  },

  // TODO: Now that all calls to _data and _removeData have been replaced
  // with direct calls to data_priv methods, these can be deprecated.
  _data: function( elem, name, data ) {
    return data_priv.access( elem, name, data );
  },

  _removeData: function( elem, name ) {
    data_priv.remove( elem, name );
  }
});

jQuery.fn.extend({
  data: function( key, value ) {
    var attrs, name,
      elem = this[ 0 ],
      i = 0,
      data = null;

    // Gets all values
    if ( key === undefined ) {
      if ( this.length ) {
        data = data_user.get( elem );

        if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
          attrs = elem.attributes;
          for ( ; i < attrs.length; i++ ) {
            name = attrs[ i ].name;

            if ( name.indexOf( "data-" ) === 0 ) {
              name = jQuery.camelCase( name.slice(5) );
              dataAttr( elem, name, data[ name ] );
            }
          }
          data_priv.set( elem, "hasDataAttrs", true );
        }
      }

      return data;
    }

    // Sets multiple values
    if ( typeof key === "object" ) {
      return this.each(function() {
        data_user.set( this, key );
      });
    }

    return jQuery.access( this, function( value ) {
      var data,
        camelKey = jQuery.camelCase( key );

      // The calling jQuery object (element matches) is not empty
      // (and therefore has an element appears at this[ 0 ]) and the
      // `value` parameter was not undefined. An empty jQuery object
      // will result in `undefined` for elem = this[ 0 ] which will
      // throw an exception if an attempt to read a data cache is made.
      if ( elem && value === undefined ) {
        // Attempt to get data from the cache
        // with the key as-is
        data = data_user.get( elem, key );
        if ( data !== undefined ) {
          return data;
        }

        // Attempt to get data from the cache
        // with the key camelized
        data = data_user.get( elem, camelKey );
        if ( data !== undefined ) {
          return data;
        }

        // Attempt to "discover" the data in
        // HTML5 custom data-* attrs
        data = dataAttr( elem, camelKey, undefined );
        if ( data !== undefined ) {
          return data;
        }

        // We tried really hard, but the data doesn't exist.
        return;
      }

      // Set the data...
      this.each(function() {
        // First, attempt to store a copy or reference of any
        // data that might've been store with a camelCased key.
        var data = data_user.get( this, camelKey );

        // For HTML5 data-* attribute interop, we have to
        // store property names with dashes in a camelCase form.
        // This might not apply to all properties...*
        data_user.set( this, camelKey, value );

        // *... In the case of properties that might _actually_
        // have dashes, we need to also store a copy of that
        // unchanged property.
        if ( key.indexOf("-") !== -1 && data !== undefined ) {
          data_user.set( this, key, value );
        }
      });
    }, null, value, arguments.length > 1, null, true );
  },

  removeData: function( key ) {
    return this.each(function() {
      data_user.remove( this, key );
    });
  }
});

function dataAttr( elem, key, data ) {
  var name;

  // If nothing was found internally, try to fetch any
  // data from the HTML5 data-* attribute
  if ( data === undefined && elem.nodeType === 1 ) {
    name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
    data = elem.getAttribute( name );

    if ( typeof data === "string" ) {
      try {
        data = data === "true" ? true :
          data === "false" ? false :
          data === "null" ? null :
          // Only convert to a number if it doesn't change the string
          +data + "" === data ? +data :
          rbrace.test( data ) ? JSON.parse( data ) :
          data;
      } catch( e ) {}

      // Make sure we set the data so it isn't changed later
      data_user.set( elem, key, data );
    } else {
      data = undefined;
    }
  }
  return data;
}
jQuery.extend({
  queue: function( elem, type, data ) {
    var queue;

    if ( elem ) {
      type = ( type || "fx" ) + "queue";
      queue = data_priv.get( elem, type );

      // Speed up dequeue by getting out quickly if this is just a lookup
      if ( data ) {
        if ( !queue || jQuery.isArray( data ) ) {
          queue = data_priv.access( elem, type, jQuery.makeArray(data) );
        } else {
          queue.push( data );
        }
      }
      return queue || [];
    }
  },

  dequeue: function( elem, type ) {
    type = type || "fx";

    var queue = jQuery.queue( elem, type ),
      startLength = queue.length,
      fn = queue.shift(),
      hooks = jQuery._queueHooks( elem, type ),
      next = function() {
        jQuery.dequeue( elem, type );
      };

    // If the fx queue is dequeued, always remove the progress sentinel
    if ( fn === "inprogress" ) {
      fn = queue.shift();
      startLength--;
    }

    if ( fn ) {

      // Add a progress sentinel to prevent the fx queue from being
      // automatically dequeued
      if ( type === "fx" ) {
        queue.unshift( "inprogress" );
      }

      // clear up the last queue stop function
      delete hooks.stop;
      fn.call( elem, next, hooks );
    }

    if ( !startLength && hooks ) {
      hooks.empty.fire();
    }
  },

  // not intended for public consumption - generates a queueHooks object, or returns the current one
  _queueHooks: function( elem, type ) {
    var key = type + "queueHooks";
    return data_priv.get( elem, key ) || data_priv.access( elem, key, {
      empty: jQuery.Callbacks("once memory").add(function() {
        data_priv.remove( elem, [ type + "queue", key ] );
      })
    });
  }
});

jQuery.fn.extend({
  queue: function( type, data ) {
    var setter = 2;

    if ( typeof type !== "string" ) {
      data = type;
      type = "fx";
      setter--;
    }

    if ( arguments.length < setter ) {
      return jQuery.queue( this[0], type );
    }

    return data === undefined ?
      this :
      this.each(function() {
        var queue = jQuery.queue( this, type, data );

        // ensure a hooks for this queue
        jQuery._queueHooks( this, type );

        if ( type === "fx" && queue[0] !== "inprogress" ) {
          jQuery.dequeue( this, type );
        }
      });
  },
  dequeue: function( type ) {
    return this.each(function() {
      jQuery.dequeue( this, type );
    });
  },
  // Based off of the plugin by Clint Helfers, with permission.
  // http://blindsignals.com/index.php/2009/07/jquery-delay/
  delay: function( time, type ) {
    time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
    type = type || "fx";

    return this.queue( type, function( next, hooks ) {
      var timeout = setTimeout( next, time );
      hooks.stop = function() {
        clearTimeout( timeout );
      };
    });
  },
  clearQueue: function( type ) {
    return this.queue( type || "fx", [] );
  },
  // Get a promise resolved when queues of a certain type
  // are emptied (fx is the type by default)
  promise: function( type, obj ) {
    var tmp,
      count = 1,
      defer = jQuery.Deferred(),
      elements = this,
      i = this.length,
      resolve = function() {
        if ( !( --count ) ) {
          defer.resolveWith( elements, [ elements ] );
        }
      };

    if ( typeof type !== "string" ) {
      obj = type;
      type = undefined;
    }
    type = type || "fx";

    while( i-- ) {
      tmp = data_priv.get( elements[ i ], type + "queueHooks" );
      if ( tmp && tmp.empty ) {
        count++;
        tmp.empty.add( resolve );
      }
    }
    resolve();
    return defer.promise( obj );
  }
});
var nodeHook, boolHook,
  rclass = /[\t\r\n\f]/g,
  rreturn = /\r/g,
  rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
  attr: function( name, value ) {
    return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
  },

  removeAttr: function( name ) {
    return this.each(function() {
      jQuery.removeAttr( this, name );
    });
  },

  prop: function( name, value ) {
    return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
  },

  removeProp: function( name ) {
    return this.each(function() {
      delete this[ jQuery.propFix[ name ] || name ];
    });
  },

  addClass: function( value ) {
    var classes, elem, cur, clazz, j,
      i = 0,
      len = this.length,
      proceed = typeof value === "string" && value;

    if ( jQuery.isFunction( value ) ) {
      return this.each(function( j ) {
        jQuery( this ).addClass( value.call( this, j, this.className ) );
      });
    }

    if ( proceed ) {
      // The disjunction here is for better compressibility (see removeClass)
      classes = ( value || "" ).match( core_rnotwhite ) || [];

      for ( ; i < len; i++ ) {
        elem = this[ i ];
        cur = elem.nodeType === 1 && ( elem.className ?
          ( " " + elem.className + " " ).replace( rclass, " " ) :
          " "
        );

        if ( cur ) {
          j = 0;
          while ( (clazz = classes[j++]) ) {
            if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
              cur += clazz + " ";
            }
          }
          elem.className = jQuery.trim( cur );

        }
      }
    }

    return this;
  },

  removeClass: function( value ) {
    var classes, elem, cur, clazz, j,
      i = 0,
      len = this.length,
      proceed = arguments.length === 0 || typeof value === "string" && value;

    if ( jQuery.isFunction( value ) ) {
      return this.each(function( j ) {
        jQuery( this ).removeClass( value.call( this, j, this.className ) );
      });
    }
    if ( proceed ) {
      classes = ( value || "" ).match( core_rnotwhite ) || [];

      for ( ; i < len; i++ ) {
        elem = this[ i ];
        // This expression is here for better compressibility (see addClass)
        cur = elem.nodeType === 1 && ( elem.className ?
          ( " " + elem.className + " " ).replace( rclass, " " ) :
          ""
        );

        if ( cur ) {
          j = 0;
          while ( (clazz = classes[j++]) ) {
            // Remove *all* instances
            while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
              cur = cur.replace( " " + clazz + " ", " " );
            }
          }
          elem.className = value ? jQuery.trim( cur ) : "";
        }
      }
    }

    return this;
  },

  toggleClass: function( value, stateVal ) {
    var type = typeof value;

    if ( typeof stateVal === "boolean" && type === "string" ) {
      return stateVal ? this.addClass( value ) : this.removeClass( value );
    }

    if ( jQuery.isFunction( value ) ) {
      return this.each(function( i ) {
        jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
      });
    }

    return this.each(function() {
      if ( type === "string" ) {
        // toggle individual class names
        var className,
          i = 0,
          self = jQuery( this ),
          classNames = value.match( core_rnotwhite ) || [];

        while ( (className = classNames[ i++ ]) ) {
          // check each className given, space separated list
          if ( self.hasClass( className ) ) {
            self.removeClass( className );
          } else {
            self.addClass( className );
          }
        }

      // Toggle whole class name
      } else if ( type === core_strundefined || type === "boolean" ) {
        if ( this.className ) {
          // store className if set
          data_priv.set( this, "__className__", this.className );
        }

        // If the element has a class name or if we're passed "false",
        // then remove the whole classname (if there was one, the above saved it).
        // Otherwise bring back whatever was previously saved (if anything),
        // falling back to the empty string if nothing was stored.
        this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
      }
    });
  },

  hasClass: function( selector ) {
    var className = " " + selector + " ",
      i = 0,
      l = this.length;
    for ( ; i < l; i++ ) {
      if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
        return true;
      }
    }

    return false;
  },

  val: function( value ) {
    var hooks, ret, isFunction,
      elem = this[0];

    if ( !arguments.length ) {
      if ( elem ) {
        hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

        if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
          return ret;
        }

        ret = elem.value;

        return typeof ret === "string" ?
          // handle most common string cases
          ret.replace(rreturn, "") :
          // handle cases where value is null/undef or number
          ret == null ? "" : ret;
      }

      return;
    }

    isFunction = jQuery.isFunction( value );

    return this.each(function( i ) {
      var val;

      if ( this.nodeType !== 1 ) {
        return;
      }

      if ( isFunction ) {
        val = value.call( this, i, jQuery( this ).val() );
      } else {
        val = value;
      }

      // Treat null/undefined as ""; convert numbers to string
      if ( val == null ) {
        val = "";
      } else if ( typeof val === "number" ) {
        val += "";
      } else if ( jQuery.isArray( val ) ) {
        val = jQuery.map(val, function ( value ) {
          return value == null ? "" : value + "";
        });
      }

      hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

      // If set returns undefined, fall back to normal setting
      if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
        this.value = val;
      }
    });
  }
});

jQuery.extend({
  valHooks: {
    option: {
      get: function( elem ) {
        // attributes.value is undefined in Blackberry 4.7 but
        // uses .value. See #6932
        var val = elem.attributes.value;
        return !val || val.specified ? elem.value : elem.text;
      }
    },
    select: {
      get: function( elem ) {
        var value, option,
          options = elem.options,
          index = elem.selectedIndex,
          one = elem.type === "select-one" || index < 0,
          values = one ? null : [],
          max = one ? index + 1 : options.length,
          i = index < 0 ?
            max :
            one ? index : 0;

        // Loop through all the selected options
        for ( ; i < max; i++ ) {
          option = options[ i ];

          // IE6-9 doesn't update selected after form reset (#2551)
          if ( ( option.selected || i === index ) &&
              // Don't return options that are disabled or in a disabled optgroup
              ( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
              ( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

            // Get the specific value for the option
            value = jQuery( option ).val();

            // We don't need an array for one selects
            if ( one ) {
              return value;
            }

            // Multi-Selects return an array
            values.push( value );
          }
        }

        return values;
      },

      set: function( elem, value ) {
        var optionSet, option,
          options = elem.options,
          values = jQuery.makeArray( value ),
          i = options.length;

        while ( i-- ) {
          option = options[ i ];
          if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
            optionSet = true;
          }
        }

        // force browsers to behave consistently when non-matching value is set
        if ( !optionSet ) {
          elem.selectedIndex = -1;
        }
        return values;
      }
    }
  },

  attr: function( elem, name, value ) {
    var hooks, ret,
      nType = elem.nodeType;

    // don't get/set attributes on text, comment and attribute nodes
    if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
      return;
    }

    // Fallback to prop when attributes are not supported
    if ( typeof elem.getAttribute === core_strundefined ) {
      return jQuery.prop( elem, name, value );
    }

    // All attributes are lowercase
    // Grab necessary hook if one is defined
    if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
      name = name.toLowerCase();
      hooks = jQuery.attrHooks[ name ] ||
        ( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
    }

    if ( value !== undefined ) {

      if ( value === null ) {
        jQuery.removeAttr( elem, name );

      } else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
        return ret;

      } else {
        elem.setAttribute( name, value + "" );
        return value;
      }

    } else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
      return ret;

    } else {
      ret = jQuery.find.attr( elem, name );

      // Non-existent attributes return null, we normalize to undefined
      return ret == null ?
        undefined :
        ret;
    }
  },

  removeAttr: function( elem, value ) {
    var name, propName,
      i = 0,
      attrNames = value && value.match( core_rnotwhite );

    if ( attrNames && elem.nodeType === 1 ) {
      while ( (name = attrNames[i++]) ) {
        propName = jQuery.propFix[ name ] || name;

        // Boolean attributes get special treatment (#10870)
        if ( jQuery.expr.match.bool.test( name ) ) {
          // Set corresponding property to false
          elem[ propName ] = false;
        }

        elem.removeAttribute( name );
      }
    }
  },

  attrHooks: {
    type: {
      set: function( elem, value ) {
        if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
          // Setting the type on a radio button after the value resets the value in IE6-9
          // Reset value to default in case type is set after value during creation
          var val = elem.value;
          elem.setAttribute( "type", value );
          if ( val ) {
            elem.value = val;
          }
          return value;
        }
      }
    }
  },

  propFix: {
    "for": "htmlFor",
    "class": "className"
  },

  prop: function( elem, name, value ) {
    var ret, hooks, notxml,
      nType = elem.nodeType;

    // don't get/set properties on text, comment and attribute nodes
    if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
      return;
    }

    notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

    if ( notxml ) {
      // Fix name and attach hooks
      name = jQuery.propFix[ name ] || name;
      hooks = jQuery.propHooks[ name ];
    }

    if ( value !== undefined ) {
      return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
        ret :
        ( elem[ name ] = value );

    } else {
      return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
        ret :
        elem[ name ];
    }
  },

  propHooks: {
    tabIndex: {
      get: function( elem ) {
        return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
          elem.tabIndex :
          -1;
      }
    }
  }
});

// Hooks for boolean attributes
boolHook = {
  set: function( elem, value, name ) {
    if ( value === false ) {
      // Remove boolean attributes when set to false
      jQuery.removeAttr( elem, name );
    } else {
      elem.setAttribute( name, name );
    }
    return name;
  }
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
  var getter = jQuery.expr.attrHandle[ name ] || jQuery.find.attr;

  jQuery.expr.attrHandle[ name ] = function( elem, name, isXML ) {
    var fn = jQuery.expr.attrHandle[ name ],
      ret = isXML ?
        undefined :
        /* jshint eqeqeq: false */
        // Temporarily disable this handler to check existence
        (jQuery.expr.attrHandle[ name ] = undefined) !=
          getter( elem, name, isXML ) ?

          name.toLowerCase() :
          null;

    // Restore handler
    jQuery.expr.attrHandle[ name ] = fn;

    return ret;
  };
});

// Support: IE9+
// Selectedness for an option in an optgroup can be inaccurate
if ( !jQuery.support.optSelected ) {
  jQuery.propHooks.selected = {
    get: function( elem ) {
      var parent = elem.parentNode;
      if ( parent && parent.parentNode ) {
        parent.parentNode.selectedIndex;
      }
      return null;
    }
  };
}

jQuery.each([
  "tabIndex",
  "readOnly",
  "maxLength",
  "cellSpacing",
  "cellPadding",
  "rowSpan",
  "colSpan",
  "useMap",
  "frameBorder",
  "contentEditable"
], function() {
  jQuery.propFix[ this.toLowerCase() ] = this;
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
  jQuery.valHooks[ this ] = {
    set: function( elem, value ) {
      if ( jQuery.isArray( value ) ) {
        return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
      }
    }
  };
  if ( !jQuery.support.checkOn ) {
    jQuery.valHooks[ this ].get = function( elem ) {
      // Support: Webkit
      // "" is returned instead of "on" if a value isn't specified
      return elem.getAttribute("value") === null ? "on" : elem.value;
    };
  }
});
var rkeyEvent = /^key/,
  rmouseEvent = /^(?:mouse|contextmenu)|click/,
  rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
  rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
  return true;
}

function returnFalse() {
  return false;
}

function safeActiveElement() {
  try {
    return document.activeElement;
  } catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

  global: {},

  add: function( elem, types, handler, data, selector ) {

    var handleObjIn, eventHandle, tmp,
      events, t, handleObj,
      special, handlers, type, namespaces, origType,
      elemData = data_priv.get( elem );

    // Don't attach events to noData or text/comment nodes (but allow plain objects)
    if ( !elemData ) {
      return;
    }

    // Caller can pass in an object of custom data in lieu of the handler
    if ( handler.handler ) {
      handleObjIn = handler;
      handler = handleObjIn.handler;
      selector = handleObjIn.selector;
    }

    // Make sure that the handler has a unique ID, used to find/remove it later
    if ( !handler.guid ) {
      handler.guid = jQuery.guid++;
    }

    // Init the element's event structure and main handler, if this is the first
    if ( !(events = elemData.events) ) {
      events = elemData.events = {};
    }
    if ( !(eventHandle = elemData.handle) ) {
      eventHandle = elemData.handle = function( e ) {
        // Discard the second event of a jQuery.event.trigger() and
        // when an event is called after a page has unloaded
        return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
          jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
          undefined;
      };
      // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
      eventHandle.elem = elem;
    }

    // Handle multiple events separated by a space
    types = ( types || "" ).match( core_rnotwhite ) || [""];
    t = types.length;
    while ( t-- ) {
      tmp = rtypenamespace.exec( types[t] ) || [];
      type = origType = tmp[1];
      namespaces = ( tmp[2] || "" ).split( "." ).sort();

      // There *must* be a type, no attaching namespace-only handlers
      if ( !type ) {
        continue;
      }

      // If event changes its type, use the special event handlers for the changed type
      special = jQuery.event.special[ type ] || {};

      // If selector defined, determine special event api type, otherwise given type
      type = ( selector ? special.delegateType : special.bindType ) || type;

      // Update special based on newly reset type
      special = jQuery.event.special[ type ] || {};

      // handleObj is passed to all event handlers
      handleObj = jQuery.extend({
        type: type,
        origType: origType,
        data: data,
        handler: handler,
        guid: handler.guid,
        selector: selector,
        needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
        namespace: namespaces.join(".")
      }, handleObjIn );

      // Init the event handler queue if we're the first
      if ( !(handlers = events[ type ]) ) {
        handlers = events[ type ] = [];
        handlers.delegateCount = 0;

        // Only use addEventListener if the special events handler returns false
        if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
          if ( elem.addEventListener ) {
            elem.addEventListener( type, eventHandle, false );
          }
        }
      }

      if ( special.add ) {
        special.add.call( elem, handleObj );

        if ( !handleObj.handler.guid ) {
          handleObj.handler.guid = handler.guid;
        }
      }

      // Add to the element's handler list, delegates in front
      if ( selector ) {
        handlers.splice( handlers.delegateCount++, 0, handleObj );
      } else {
        handlers.push( handleObj );
      }

      // Keep track of which events have ever been used, for event optimization
      jQuery.event.global[ type ] = true;
    }

    // Nullify elem to prevent memory leaks in IE
    elem = null;
  },

  // Detach an event or set of events from an element
  remove: function( elem, types, handler, selector, mappedTypes ) {

    var j, origCount, tmp,
      events, t, handleObj,
      special, handlers, type, namespaces, origType,
      elemData = data_priv.hasData( elem ) && data_priv.get( elem );

    if ( !elemData || !(events = elemData.events) ) {
      return;
    }

    // Once for each type.namespace in types; type may be omitted
    types = ( types || "" ).match( core_rnotwhite ) || [""];
    t = types.length;
    while ( t-- ) {
      tmp = rtypenamespace.exec( types[t] ) || [];
      type = origType = tmp[1];
      namespaces = ( tmp[2] || "" ).split( "." ).sort();

      // Unbind all events (on this namespace, if provided) for the element
      if ( !type ) {
        for ( type in events ) {
          jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
        }
        continue;
      }

      special = jQuery.event.special[ type ] || {};
      type = ( selector ? special.delegateType : special.bindType ) || type;
      handlers = events[ type ] || [];
      tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

      // Remove matching events
      origCount = j = handlers.length;
      while ( j-- ) {
        handleObj = handlers[ j ];

        if ( ( mappedTypes || origType === handleObj.origType ) &&
          ( !handler || handler.guid === handleObj.guid ) &&
          ( !tmp || tmp.test( handleObj.namespace ) ) &&
          ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
          handlers.splice( j, 1 );

          if ( handleObj.selector ) {
            handlers.delegateCount--;
          }
          if ( special.remove ) {
            special.remove.call( elem, handleObj );
          }
        }
      }

      // Remove generic event handler if we removed something and no more handlers exist
      // (avoids potential for endless recursion during removal of special event handlers)
      if ( origCount && !handlers.length ) {
        if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
          jQuery.removeEvent( elem, type, elemData.handle );
        }

        delete events[ type ];
      }
    }

    // Remove the expando if it's no longer used
    if ( jQuery.isEmptyObject( events ) ) {
      delete elemData.handle;
      data_priv.remove( elem, "events" );
    }
  },

  trigger: function( event, data, elem, onlyHandlers ) {

    var i, cur, tmp, bubbleType, ontype, handle, special,
      eventPath = [ elem || document ],
      type = core_hasOwn.call( event, "type" ) ? event.type : event,
      namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

    cur = tmp = elem = elem || document;

    // Don't do events on text and comment nodes
    if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
      return;
    }

    // focus/blur morphs to focusin/out; ensure we're not firing them right now
    if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
      return;
    }

    if ( type.indexOf(".") >= 0 ) {
      // Namespaced trigger; create a regexp to match event type in handle()
      namespaces = type.split(".");
      type = namespaces.shift();
      namespaces.sort();
    }
    ontype = type.indexOf(":") < 0 && "on" + type;

    // Caller can pass in a jQuery.Event object, Object, or just an event type string
    event = event[ jQuery.expando ] ?
      event :
      new jQuery.Event( type, typeof event === "object" && event );

    // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
    event.isTrigger = onlyHandlers ? 2 : 3;
    event.namespace = namespaces.join(".");
    event.namespace_re = event.namespace ?
      new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
      null;

    // Clean up the event in case it is being reused
    event.result = undefined;
    if ( !event.target ) {
      event.target = elem;
    }

    // Clone any incoming data and prepend the event, creating the handler arg list
    data = data == null ?
      [ event ] :
      jQuery.makeArray( data, [ event ] );

    // Allow special events to draw outside the lines
    special = jQuery.event.special[ type ] || {};
    if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
      return;
    }

    // Determine event propagation path in advance, per W3C events spec (#9951)
    // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
    if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

      bubbleType = special.delegateType || type;
      if ( !rfocusMorph.test( bubbleType + type ) ) {
        cur = cur.parentNode;
      }
      for ( ; cur; cur = cur.parentNode ) {
        eventPath.push( cur );
        tmp = cur;
      }

      // Only add window if we got to document (e.g., not plain obj or detached DOM)
      if ( tmp === (elem.ownerDocument || document) ) {
        eventPath.push( tmp.defaultView || tmp.parentWindow || window );
      }
    }

    // Fire handlers on the event path
    i = 0;
    while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

      event.type = i > 1 ?
        bubbleType :
        special.bindType || type;

      // jQuery handler
      handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
      if ( handle ) {
        handle.apply( cur, data );
      }

      // Native handler
      handle = ontype && cur[ ontype ];
      if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
        event.preventDefault();
      }
    }
    event.type = type;

    // If nobody prevented the default action, do it now
    if ( !onlyHandlers && !event.isDefaultPrevented() ) {

      if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
        jQuery.acceptData( elem ) ) {

        // Call a native DOM method on the target with the same name name as the event.
        // Don't do default actions on window, that's where global variables be (#6170)
        if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

          // Don't re-trigger an onFOO event when we call its FOO() method
          tmp = elem[ ontype ];

          if ( tmp ) {
            elem[ ontype ] = null;
          }

          // Prevent re-triggering of the same event, since we already bubbled it above
          jQuery.event.triggered = type;
          elem[ type ]();
          jQuery.event.triggered = undefined;

          if ( tmp ) {
            elem[ ontype ] = tmp;
          }
        }
      }
    }

    return event.result;
  },

  dispatch: function( event ) {

    // Make a writable jQuery.Event from the native event object
    event = jQuery.event.fix( event );

    var i, j, ret, matched, handleObj,
      handlerQueue = [],
      args = core_slice.call( arguments ),
      handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
      special = jQuery.event.special[ event.type ] || {};

    // Use the fix-ed jQuery.Event rather than the (read-only) native event
    args[0] = event;
    event.delegateTarget = this;

    // Call the preDispatch hook for the mapped type, and let it bail if desired
    if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
      return;
    }

    // Determine handlers
    handlerQueue = jQuery.event.handlers.call( this, event, handlers );

    // Run delegates first; they may want to stop propagation beneath us
    i = 0;
    while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
      event.currentTarget = matched.elem;

      j = 0;
      while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

        // Triggered event must either 1) have no namespace, or
        // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
        if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

          event.handleObj = handleObj;
          event.data = handleObj.data;

          ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
              .apply( matched.elem, args );

          if ( ret !== undefined ) {
            if ( (event.result = ret) === false ) {
              event.preventDefault();
              event.stopPropagation();
            }
          }
        }
      }
    }

    // Call the postDispatch hook for the mapped type
    if ( special.postDispatch ) {
      special.postDispatch.call( this, event );
    }

    return event.result;
  },

  handlers: function( event, handlers ) {
    var i, matches, sel, handleObj,
      handlerQueue = [],
      delegateCount = handlers.delegateCount,
      cur = event.target;

    // Find delegate handlers
    // Black-hole SVG <use> instance trees (#13180)
    // Avoid non-left-click bubbling in Firefox (#3861)
    if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

      for ( ; cur !== this; cur = cur.parentNode || this ) {

        // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
        if ( cur.disabled !== true || event.type !== "click" ) {
          matches = [];
          for ( i = 0; i < delegateCount; i++ ) {
            handleObj = handlers[ i ];

            // Don't conflict with Object.prototype properties (#13203)
            sel = handleObj.selector + " ";

            if ( matches[ sel ] === undefined ) {
              matches[ sel ] = handleObj.needsContext ?
                jQuery( sel, this ).index( cur ) >= 0 :
                jQuery.find( sel, this, null, [ cur ] ).length;
            }
            if ( matches[ sel ] ) {
              matches.push( handleObj );
            }
          }
          if ( matches.length ) {
            handlerQueue.push({ elem: cur, handlers: matches });
          }
        }
      }
    }

    // Add the remaining (directly-bound) handlers
    if ( delegateCount < handlers.length ) {
      handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
    }

    return handlerQueue;
  },

  // Includes some event props shared by KeyEvent and MouseEvent
  props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

  fixHooks: {},

  keyHooks: {
    props: "char charCode key keyCode".split(" "),
    filter: function( event, original ) {

      // Add which for key events
      if ( event.which == null ) {
        event.which = original.charCode != null ? original.charCode : original.keyCode;
      }

      return event;
    }
  },

  mouseHooks: {
    props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
    filter: function( event, original ) {
      var eventDoc, doc, body,
        button = original.button;

      // Calculate pageX/Y if missing and clientX/Y available
      if ( event.pageX == null && original.clientX != null ) {
        eventDoc = event.target.ownerDocument || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
        event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
      }

      // Add which for click: 1 === left; 2 === middle; 3 === right
      // Note: button is not normalized, so don't use it
      if ( !event.which && button !== undefined ) {
        event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
      }

      return event;
    }
  },

  fix: function( event ) {
    if ( event[ jQuery.expando ] ) {
      return event;
    }

    // Create a writable copy of the event object and normalize some properties
    var i, prop, copy,
      type = event.type,
      originalEvent = event,
      fixHook = this.fixHooks[ type ];

    if ( !fixHook ) {
      this.fixHooks[ type ] = fixHook =
        rmouseEvent.test( type ) ? this.mouseHooks :
        rkeyEvent.test( type ) ? this.keyHooks :
        {};
    }
    copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

    event = new jQuery.Event( originalEvent );

    i = copy.length;
    while ( i-- ) {
      prop = copy[ i ];
      event[ prop ] = originalEvent[ prop ];
    }

    // Support: Cordova 2.5 (WebKit) (#13255)
    // All events should have a target; Cordova deviceready doesn't
    if ( !event.target ) {
      event.target = document;
    }

    // Support: Safari 6.0+, Chrome < 28
    // Target should not be a text node (#504, #13143)
    if ( event.target.nodeType === 3 ) {
      event.target = event.target.parentNode;
    }

    return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
  },

  special: {
    load: {
      // Prevent triggered image.load events from bubbling to window.load
      noBubble: true
    },
    focus: {
      // Fire native event if possible so blur/focus sequence is correct
      trigger: function() {
        if ( this !== safeActiveElement() && this.focus ) {
          this.focus();
          return false;
        }
      },
      delegateType: "focusin"
    },
    blur: {
      trigger: function() {
        if ( this === safeActiveElement() && this.blur ) {
          this.blur();
          return false;
        }
      },
      delegateType: "focusout"
    },
    click: {
      // For checkbox, fire native event so checked state will be right
      trigger: function() {
        if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
          this.click();
          return false;
        }
      },

      // For cross-browser consistency, don't fire native .click() on links
      _default: function( event ) {
        return jQuery.nodeName( event.target, "a" );
      }
    },

    beforeunload: {
      postDispatch: function( event ) {

        // Support: Firefox 20+
        // Firefox doesn't alert if the returnValue field is not set.
        if ( event.result !== undefined ) {
          event.originalEvent.returnValue = event.result;
        }
      }
    }
  },

  simulate: function( type, elem, event, bubble ) {
    // Piggyback on a donor event to simulate a different one.
    // Fake originalEvent to avoid donor's stopPropagation, but if the
    // simulated event prevents default then we do the same on the donor.
    var e = jQuery.extend(
      new jQuery.Event(),
      event,
      {
        type: type,
        isSimulated: true,
        originalEvent: {}
      }
    );
    if ( bubble ) {
      jQuery.event.trigger( e, null, elem );
    } else {
      jQuery.event.dispatch.call( elem, e );
    }
    if ( e.isDefaultPrevented() ) {
      event.preventDefault();
    }
  }
};

jQuery.removeEvent = function( elem, type, handle ) {
  if ( elem.removeEventListener ) {
    elem.removeEventListener( type, handle, false );
  }
};

jQuery.Event = function( src, props ) {
  // Allow instantiation without the 'new' keyword
  if ( !(this instanceof jQuery.Event) ) {
    return new jQuery.Event( src, props );
  }

  // Event object
  if ( src && src.type ) {
    this.originalEvent = src;
    this.type = src.type;

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    this.isDefaultPrevented = ( src.defaultPrevented ||
      src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

  // Event type
  } else {
    this.type = src;
  }

  // Put explicitly provided properties onto the event object
  if ( props ) {
    jQuery.extend( this, props );
  }

  // Create a timestamp if incoming event doesn't have one
  this.timeStamp = src && src.timeStamp || jQuery.now();

  // Mark it as fixed
  this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
  isDefaultPrevented: returnFalse,
  isPropagationStopped: returnFalse,
  isImmediatePropagationStopped: returnFalse,

  preventDefault: function() {
    var e = this.originalEvent;

    this.isDefaultPrevented = returnTrue;

    if ( e && e.preventDefault ) {
      e.preventDefault();
    }
  },
  stopPropagation: function() {
    var e = this.originalEvent;

    this.isPropagationStopped = returnTrue;

    if ( e && e.stopPropagation ) {
      e.stopPropagation();
    }
  },
  stopImmediatePropagation: function() {
    this.isImmediatePropagationStopped = returnTrue;
    this.stopPropagation();
  }
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
}, function( orig, fix ) {
  jQuery.event.special[ orig ] = {
    delegateType: fix,
    bindType: fix,

    handle: function( event ) {
      var ret,
        target = this,
        related = event.relatedTarget,
        handleObj = event.handleObj;

      // For mousenter/leave call the handler if related is outside the target.
      // NB: No relatedTarget if the mouse left/entered the browser window
      if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
        event.type = handleObj.origType;
        ret = handleObj.handler.apply( this, arguments );
        event.type = fix;
      }
      return ret;
    }
  };
});

// Create "bubbling" focus and blur events
// Support: Firefox, Chrome, Safari
if ( !jQuery.support.focusinBubbles ) {
  jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

    // Attach a single capturing handler while someone wants focusin/focusout
    var attaches = 0,
      handler = function( event ) {
        jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
      };

    jQuery.event.special[ fix ] = {
      setup: function() {
        if ( attaches++ === 0 ) {
          document.addEventListener( orig, handler, true );
        }
      },
      teardown: function() {
        if ( --attaches === 0 ) {
          document.removeEventListener( orig, handler, true );
        }
      }
    };
  });
}

jQuery.fn.extend({

  on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
    var origFn, type;

    // Types can be a map of types/handlers
    if ( typeof types === "object" ) {
      // ( types-Object, selector, data )
      if ( typeof selector !== "string" ) {
        // ( types-Object, data )
        data = data || selector;
        selector = undefined;
      }
      for ( type in types ) {
        this.on( type, selector, data, types[ type ], one );
      }
      return this;
    }

    if ( data == null && fn == null ) {
      // ( types, fn )
      fn = selector;
      data = selector = undefined;
    } else if ( fn == null ) {
      if ( typeof selector === "string" ) {
        // ( types, selector, fn )
        fn = data;
        data = undefined;
      } else {
        // ( types, data, fn )
        fn = data;
        data = selector;
        selector = undefined;
      }
    }
    if ( fn === false ) {
      fn = returnFalse;
    } else if ( !fn ) {
      return this;
    }

    if ( one === 1 ) {
      origFn = fn;
      fn = function( event ) {
        // Can use an empty set, since event contains the info
        jQuery().off( event );
        return origFn.apply( this, arguments );
      };
      // Use same guid so caller can remove using origFn
      fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
    }
    return this.each( function() {
      jQuery.event.add( this, types, fn, data, selector );
    });
  },
  one: function( types, selector, data, fn ) {
    return this.on( types, selector, data, fn, 1 );
  },
  off: function( types, selector, fn ) {
    var handleObj, type;
    if ( types && types.preventDefault && types.handleObj ) {
      // ( event )  dispatched jQuery.Event
      handleObj = types.handleObj;
      jQuery( types.delegateTarget ).off(
        handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
        handleObj.selector,
        handleObj.handler
      );
      return this;
    }
    if ( typeof types === "object" ) {
      // ( types-object [, selector] )
      for ( type in types ) {
        this.off( type, selector, types[ type ] );
      }
      return this;
    }
    if ( selector === false || typeof selector === "function" ) {
      // ( types [, fn] )
      fn = selector;
      selector = undefined;
    }
    if ( fn === false ) {
      fn = returnFalse;
    }
    return this.each(function() {
      jQuery.event.remove( this, types, fn, selector );
    });
  },

  trigger: function( type, data ) {
    return this.each(function() {
      jQuery.event.trigger( type, data, this );
    });
  },
  triggerHandler: function( type, data ) {
    var elem = this[0];
    if ( elem ) {
      return jQuery.event.trigger( type, data, elem, true );
    }
  }
});
var isSimple = /^.[^:#\[\.,]*$/,
  rparentsprev = /^(?:parents|prev(?:Until|All))/,
  rneedsContext = jQuery.expr.match.needsContext,
  // methods guaranteed to produce a unique set when starting from a unique set
  guaranteedUnique = {
    children: true,
    contents: true,
    next: true,
    prev: true
  };

jQuery.fn.extend({
  find: function( selector ) {
    var i,
      ret = [],
      self = this,
      len = self.length;

    if ( typeof selector !== "string" ) {
      return this.pushStack( jQuery( selector ).filter(function() {
        for ( i = 0; i < len; i++ ) {
          if ( jQuery.contains( self[ i ], this ) ) {
            return true;
          }
        }
      }) );
    }

    for ( i = 0; i < len; i++ ) {
      jQuery.find( selector, self[ i ], ret );
    }

    // Needed because $( selector, context ) becomes $( context ).find( selector )
    ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
    ret.selector = this.selector ? this.selector + " " + selector : selector;
    return ret;
  },

  has: function( target ) {
    var targets = jQuery( target, this ),
      l = targets.length;

    return this.filter(function() {
      var i = 0;
      for ( ; i < l; i++ ) {
        if ( jQuery.contains( this, targets[i] ) ) {
          return true;
        }
      }
    });
  },

  not: function( selector ) {
    return this.pushStack( winnow(this, selector || [], true) );
  },

  filter: function( selector ) {
    return this.pushStack( winnow(this, selector || [], false) );
  },

  is: function( selector ) {
    return !!winnow(
      this,

      // If this is a positional/relative selector, check membership in the returned set
      // so $("p:first").is("p:last") won't return true for a doc with two "p".
      typeof selector === "string" && rneedsContext.test( selector ) ?
        jQuery( selector ) :
        selector || [],
      false
    ).length;
  },

  closest: function( selectors, context ) {
    var cur,
      i = 0,
      l = this.length,
      matched = [],
      pos = ( rneedsContext.test( selectors ) || typeof selectors !== "string" ) ?
        jQuery( selectors, context || this.context ) :
        0;

    for ( ; i < l; i++ ) {
      for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
        // Always skip document fragments
        if ( cur.nodeType < 11 && (pos ?
          pos.index(cur) > -1 :

          // Don't pass non-elements to Sizzle
          cur.nodeType === 1 &&
            jQuery.find.matchesSelector(cur, selectors)) ) {

          cur = matched.push( cur );
          break;
        }
      }
    }

    return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
  },

  // Determine the position of an element within
  // the matched set of elements
  index: function( elem ) {

    // No argument, return index in parent
    if ( !elem ) {
      return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
    }

    // index in selector
    if ( typeof elem === "string" ) {
      return core_indexOf.call( jQuery( elem ), this[ 0 ] );
    }

    // Locate the position of the desired element
    return core_indexOf.call( this,

      // If it receives a jQuery object, the first element is used
      elem.jquery ? elem[ 0 ] : elem
    );
  },

  add: function( selector, context ) {
    var set = typeof selector === "string" ?
        jQuery( selector, context ) :
        jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
      all = jQuery.merge( this.get(), set );

    return this.pushStack( jQuery.unique(all) );
  },

  addBack: function( selector ) {
    return this.add( selector == null ?
      this.prevObject : this.prevObject.filter(selector)
    );
  }
});

function sibling( cur, dir ) {
  while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}

  return cur;
}

jQuery.each({
  parent: function( elem ) {
    var parent = elem.parentNode;
    return parent && parent.nodeType !== 11 ? parent : null;
  },
  parents: function( elem ) {
    return jQuery.dir( elem, "parentNode" );
  },
  parentsUntil: function( elem, i, until ) {
    return jQuery.dir( elem, "parentNode", until );
  },
  next: function( elem ) {
    return sibling( elem, "nextSibling" );
  },
  prev: function( elem ) {
    return sibling( elem, "previousSibling" );
  },
  nextAll: function( elem ) {
    return jQuery.dir( elem, "nextSibling" );
  },
  prevAll: function( elem ) {
    return jQuery.dir( elem, "previousSibling" );
  },
  nextUntil: function( elem, i, until ) {
    return jQuery.dir( elem, "nextSibling", until );
  },
  prevUntil: function( elem, i, until ) {
    return jQuery.dir( elem, "previousSibling", until );
  },
  siblings: function( elem ) {
    return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
  },
  children: function( elem ) {
    return jQuery.sibling( elem.firstChild );
  },
  contents: function( elem ) {
    return elem.contentDocument || jQuery.merge( [], elem.childNodes );
  }
}, function( name, fn ) {
  jQuery.fn[ name ] = function( until, selector ) {
    var matched = jQuery.map( this, fn, until );

    if ( name.slice( -5 ) !== "Until" ) {
      selector = until;
    }

    if ( selector && typeof selector === "string" ) {
      matched = jQuery.filter( selector, matched );
    }

    if ( this.length > 1 ) {
      // Remove duplicates
      if ( !guaranteedUnique[ name ] ) {
        jQuery.unique( matched );
      }

      // Reverse order for parents* and prev-derivatives
      if ( rparentsprev.test( name ) ) {
        matched.reverse();
      }
    }

    return this.pushStack( matched );
  };
});

jQuery.extend({
  filter: function( expr, elems, not ) {
    var elem = elems[ 0 ];

    if ( not ) {
      expr = ":not(" + expr + ")";
    }

    return elems.length === 1 && elem.nodeType === 1 ?
      jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
      jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
        return elem.nodeType === 1;
      }));
  },

  dir: function( elem, dir, until ) {
    var matched = [],
      truncate = until !== undefined;

    while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
      if ( elem.nodeType === 1 ) {
        if ( truncate && jQuery( elem ).is( until ) ) {
          break;
        }
        matched.push( elem );
      }
    }
    return matched;
  },

  sibling: function( n, elem ) {
    var matched = [];

    for ( ; n; n = n.nextSibling ) {
      if ( n.nodeType === 1 && n !== elem ) {
        matched.push( n );
      }
    }

    return matched;
  }
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
  if ( jQuery.isFunction( qualifier ) ) {
    return jQuery.grep( elements, function( elem, i ) {
      /* jshint -W018 */
      return !!qualifier.call( elem, i, elem ) !== not;
    });

  }

  if ( qualifier.nodeType ) {
    return jQuery.grep( elements, function( elem ) {
      return ( elem === qualifier ) !== not;
    });

  }

  if ( typeof qualifier === "string" ) {
    if ( isSimple.test( qualifier ) ) {
      return jQuery.filter( qualifier, elements, not );
    }

    qualifier = jQuery.filter( qualifier, elements );
  }

  return jQuery.grep( elements, function( elem ) {
    return ( core_indexOf.call( qualifier, elem ) >= 0 ) !== not;
  });
}
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
  rtagName = /<([\w:]+)/,
  rhtml = /<|&#?\w+;/,
  rnoInnerhtml = /<(?:script|style|link)/i,
  manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
  // checked="checked" or checked
  rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
  rscriptType = /^$|\/(?:java|ecma)script/i,
  rscriptTypeMasked = /^true\/(.*)/,
  rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

  // We have to close these tags to support XHTML (#13200)
  wrapMap = {

    // Support: IE 9
    option: [ 1, "<select multiple='multiple'>", "</select>" ],

    thead: [ 1, "<table>", "</table>" ],
    col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
    tr: [ 2, "<table><tbody>", "</tbody></table>" ],
    td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

    _default: [ 0, "", "" ]
  };

// Support: IE 9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
  text: function( value ) {
    return jQuery.access( this, function( value ) {
      return value === undefined ?
        jQuery.text( this ) :
        this.empty().append( ( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value ) );
    }, null, value, arguments.length );
  },

  append: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.appendChild( elem );
      }
    });
  },

  prepend: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.insertBefore( elem, target.firstChild );
      }
    });
  },

  before: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this );
      }
    });
  },

  after: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this.nextSibling );
      }
    });
  },

  // keepData is for internal use only--do not document
  remove: function( selector, keepData ) {
    var elem,
      elems = selector ? jQuery.filter( selector, this ) : this,
      i = 0;

    for ( ; (elem = elems[i]) != null; i++ ) {
      if ( !keepData && elem.nodeType === 1 ) {
        jQuery.cleanData( getAll( elem ) );
      }

      if ( elem.parentNode ) {
        if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
          setGlobalEval( getAll( elem, "script" ) );
        }
        elem.parentNode.removeChild( elem );
      }
    }

    return this;
  },

  empty: function() {
    var elem,
      i = 0;

    for ( ; (elem = this[i]) != null; i++ ) {
      if ( elem.nodeType === 1 ) {

        // Prevent memory leaks
        jQuery.cleanData( getAll( elem, false ) );

        // Remove any remaining nodes
        elem.textContent = "";
      }
    }

    return this;
  },

  clone: function( dataAndEvents, deepDataAndEvents ) {
    dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
    deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

    return this.map( function () {
      return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
    });
  },

  html: function( value ) {
    return jQuery.access( this, function( value ) {
      var elem = this[ 0 ] || {},
        i = 0,
        l = this.length;

      if ( value === undefined && elem.nodeType === 1 ) {
        return elem.innerHTML;
      }

      // See if we can take a shortcut and just use innerHTML
      if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
        !wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

        value = value.replace( rxhtmlTag, "<$1></$2>" );

        try {
          for ( ; i < l; i++ ) {
            elem = this[ i ] || {};

            // Remove element nodes and prevent memory leaks
            if ( elem.nodeType === 1 ) {
              jQuery.cleanData( getAll( elem, false ) );
              elem.innerHTML = value;
            }
          }

          elem = 0;

        // If using innerHTML throws an exception, use the fallback method
        } catch( e ) {}
      }

      if ( elem ) {
        this.empty().append( value );
      }
    }, null, value, arguments.length );
  },

  replaceWith: function() {
    var
      // Snapshot the DOM in case .domManip sweeps something relevant into its fragment
      args = jQuery.map( this, function( elem ) {
        return [ elem.nextSibling, elem.parentNode ];
      }),
      i = 0;

    // Make the changes, replacing each context element with the new content
    this.domManip( arguments, function( elem ) {
      var next = args[ i++ ],
        parent = args[ i++ ];

      if ( parent ) {
        // Don't use the snapshot next if it has moved (#13810)
        if ( next && next.parentNode !== parent ) {
          next = this.nextSibling;
        }
        jQuery( this ).remove();
        parent.insertBefore( elem, next );
      }
    // Allow new content to include elements from the context set
    }, true );

    // Force removal if there was no new content (e.g., from empty arguments)
    return i ? this : this.remove();
  },

  detach: function( selector ) {
    return this.remove( selector, true );
  },

  domManip: function( args, callback, allowIntersection ) {

    // Flatten any nested arrays
    args = core_concat.apply( [], args );

    var fragment, first, scripts, hasScripts, node, doc,
      i = 0,
      l = this.length,
      set = this,
      iNoClone = l - 1,
      value = args[ 0 ],
      isFunction = jQuery.isFunction( value );

    // We can't cloneNode fragments that contain checked, in WebKit
    if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
      return this.each(function( index ) {
        var self = set.eq( index );
        if ( isFunction ) {
          args[ 0 ] = value.call( this, index, self.html() );
        }
        self.domManip( args, callback, allowIntersection );
      });
    }

    if ( l ) {
      fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, !allowIntersection && this );
      first = fragment.firstChild;

      if ( fragment.childNodes.length === 1 ) {
        fragment = first;
      }

      if ( first ) {
        scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
        hasScripts = scripts.length;

        // Use the original fragment for the last item instead of the first because it can end up
        // being emptied incorrectly in certain situations (#8070).
        for ( ; i < l; i++ ) {
          node = fragment;

          if ( i !== iNoClone ) {
            node = jQuery.clone( node, true, true );

            // Keep references to cloned scripts for later restoration
            if ( hasScripts ) {
              // Support: QtWebKit
              // jQuery.merge because core_push.apply(_, arraylike) throws
              jQuery.merge( scripts, getAll( node, "script" ) );
            }
          }

          callback.call( this[ i ], node, i );
        }

        if ( hasScripts ) {
          doc = scripts[ scripts.length - 1 ].ownerDocument;

          // Reenable scripts
          jQuery.map( scripts, restoreScript );

          // Evaluate executable scripts on first document insertion
          for ( i = 0; i < hasScripts; i++ ) {
            node = scripts[ i ];
            if ( rscriptType.test( node.type || "" ) &&
              !data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

              if ( node.src ) {
                // Hope ajax is available...
                jQuery._evalUrl( node.src );
              } else {
                jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
              }
            }
          }
        }
      }
    }

    return this;
  }
});

jQuery.each({
  appendTo: "append",
  prependTo: "prepend",
  insertBefore: "before",
  insertAfter: "after",
  replaceAll: "replaceWith"
}, function( name, original ) {
  jQuery.fn[ name ] = function( selector ) {
    var elems,
      ret = [],
      insert = jQuery( selector ),
      last = insert.length - 1,
      i = 0;

    for ( ; i <= last; i++ ) {
      elems = i === last ? this : this.clone( true );
      jQuery( insert[ i ] )[ original ]( elems );

      // Support: QtWebKit
      // .get() because core_push.apply(_, arraylike) throws
      core_push.apply( ret, elems.get() );
    }

    return this.pushStack( ret );
  };
});

jQuery.extend({
  clone: function( elem, dataAndEvents, deepDataAndEvents ) {
    var i, l, srcElements, destElements,
      clone = elem.cloneNode( true ),
      inPage = jQuery.contains( elem.ownerDocument, elem );

    // Support: IE >= 9
    // Fix Cloning issues
    if ( !jQuery.support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) && !jQuery.isXMLDoc( elem ) ) {

      // We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
      destElements = getAll( clone );
      srcElements = getAll( elem );

      for ( i = 0, l = srcElements.length; i < l; i++ ) {
        fixInput( srcElements[ i ], destElements[ i ] );
      }
    }

    // Copy the events from the original to the clone
    if ( dataAndEvents ) {
      if ( deepDataAndEvents ) {
        srcElements = srcElements || getAll( elem );
        destElements = destElements || getAll( clone );

        for ( i = 0, l = srcElements.length; i < l; i++ ) {
          cloneCopyEvent( srcElements[ i ], destElements[ i ] );
        }
      } else {
        cloneCopyEvent( elem, clone );
      }
    }

    // Preserve script evaluation history
    destElements = getAll( clone, "script" );
    if ( destElements.length > 0 ) {
      setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
    }

    // Return the cloned set
    return clone;
  },

  buildFragment: function( elems, context, scripts, selection ) {
    var elem, tmp, tag, wrap, contains, j,
      i = 0,
      l = elems.length,
      fragment = context.createDocumentFragment(),
      nodes = [];

    for ( ; i < l; i++ ) {
      elem = elems[ i ];

      if ( elem || elem === 0 ) {

        // Add nodes directly
        if ( jQuery.type( elem ) === "object" ) {
          // Support: QtWebKit
          // jQuery.merge because core_push.apply(_, arraylike) throws
          jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

        // Convert non-html into a text node
        } else if ( !rhtml.test( elem ) ) {
          nodes.push( context.createTextNode( elem ) );

        // Convert html into DOM nodes
        } else {
          tmp = tmp || fragment.appendChild( context.createElement("div") );

          // Deserialize a standard representation
          tag = ( rtagName.exec( elem ) || ["", ""] )[ 1 ].toLowerCase();
          wrap = wrapMap[ tag ] || wrapMap._default;
          tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

          // Descend through wrappers to the right content
          j = wrap[ 0 ];
          while ( j-- ) {
            tmp = tmp.lastChild;
          }

          // Support: QtWebKit
          // jQuery.merge because core_push.apply(_, arraylike) throws
          jQuery.merge( nodes, tmp.childNodes );

          // Remember the top-level container
          tmp = fragment.firstChild;

          // Fixes #12346
          // Support: Webkit, IE
          tmp.textContent = "";
        }
      }
    }

    // Remove wrapper from fragment
    fragment.textContent = "";

    i = 0;
    while ( (elem = nodes[ i++ ]) ) {

      // #4087 - If origin and destination elements are the same, and this is
      // that element, do not do anything
      if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
        continue;
      }

      contains = jQuery.contains( elem.ownerDocument, elem );

      // Append to fragment
      tmp = getAll( fragment.appendChild( elem ), "script" );

      // Preserve script evaluation history
      if ( contains ) {
        setGlobalEval( tmp );
      }

      // Capture executables
      if ( scripts ) {
        j = 0;
        while ( (elem = tmp[ j++ ]) ) {
          if ( rscriptType.test( elem.type || "" ) ) {
            scripts.push( elem );
          }
        }
      }
    }

    return fragment;
  },

  cleanData: function( elems ) {
    var data, elem, events, type, key, j,
      special = jQuery.event.special,
      i = 0;

    for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
      if ( Data.accepts( elem ) ) {
        key = elem[ data_priv.expando ];

        if ( key && (data = data_priv.cache[ key ]) ) {
          events = Object.keys( data.events || {} );
          if ( events.length ) {
            for ( j = 0; (type = events[j]) !== undefined; j++ ) {
              if ( special[ type ] ) {
                jQuery.event.remove( elem, type );

              // This is a shortcut to avoid jQuery.event.remove's overhead
              } else {
                jQuery.removeEvent( elem, type, data.handle );
              }
            }
          }
          if ( data_priv.cache[ key ] ) {
            // Discard any remaining `private` data
            delete data_priv.cache[ key ];
          }
        }
      }
      // Discard any remaining `user` data
      delete data_user.cache[ elem[ data_user.expando ] ];
    }
  },

  _evalUrl: function( url ) {
    return jQuery.ajax({
      url: url,
      type: "GET",
      dataType: "script",
      async: false,
      global: false,
      "throws": true
    });
  }
});

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
  return jQuery.nodeName( elem, "table" ) &&
    jQuery.nodeName( content.nodeType === 1 ? content : content.firstChild, "tr" ) ?

    elem.getElementsByTagName("tbody")[0] ||
      elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
    elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
  elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
  return elem;
}
function restoreScript( elem ) {
  var match = rscriptTypeMasked.exec( elem.type );

  if ( match ) {
    elem.type = match[ 1 ];
  } else {
    elem.removeAttribute("type");
  }

  return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
  var l = elems.length,
    i = 0;

  for ( ; i < l; i++ ) {
    data_priv.set(
      elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
    );
  }
}

function cloneCopyEvent( src, dest ) {
  var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

  if ( dest.nodeType !== 1 ) {
    return;
  }

  // 1. Copy private data: events, handlers, etc.
  if ( data_priv.hasData( src ) ) {
    pdataOld = data_priv.access( src );
    pdataCur = data_priv.set( dest, pdataOld );
    events = pdataOld.events;

    if ( events ) {
      delete pdataCur.handle;
      pdataCur.events = {};

      for ( type in events ) {
        for ( i = 0, l = events[ type ].length; i < l; i++ ) {
          jQuery.event.add( dest, type, events[ type ][ i ] );
        }
      }
    }
  }

  // 2. Copy user data
  if ( data_user.hasData( src ) ) {
    udataOld = data_user.access( src );
    udataCur = jQuery.extend( {}, udataOld );

    data_user.set( dest, udataCur );
  }
}


function getAll( context, tag ) {
  var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
      context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
      [];

  return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
    jQuery.merge( [ context ], ret ) :
    ret;
}

// Support: IE >= 9
function fixInput( src, dest ) {
  var nodeName = dest.nodeName.toLowerCase();

  // Fails to persist the checked state of a cloned checkbox or radio button.
  if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
    dest.checked = src.checked;

  // Fails to return the selected option to the default selected state when cloning options
  } else if ( nodeName === "input" || nodeName === "textarea" ) {
    dest.defaultValue = src.defaultValue;
  }
}
jQuery.fn.extend({
  wrapAll: function( html ) {
    var wrap;

    if ( jQuery.isFunction( html ) ) {
      return this.each(function( i ) {
        jQuery( this ).wrapAll( html.call(this, i) );
      });
    }

    if ( this[ 0 ] ) {

      // The elements to wrap the target around
      wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

      if ( this[ 0 ].parentNode ) {
        wrap.insertBefore( this[ 0 ] );
      }

      wrap.map(function() {
        var elem = this;

        while ( elem.firstElementChild ) {
          elem = elem.firstElementChild;
        }

        return elem;
      }).append( this );
    }

    return this;
  },

  wrapInner: function( html ) {
    if ( jQuery.isFunction( html ) ) {
      return this.each(function( i ) {
        jQuery( this ).wrapInner( html.call(this, i) );
      });
    }

    return this.each(function() {
      var self = jQuery( this ),
        contents = self.contents();

      if ( contents.length ) {
        contents.wrapAll( html );

      } else {
        self.append( html );
      }
    });
  },

  wrap: function( html ) {
    var isFunction = jQuery.isFunction( html );

    return this.each(function( i ) {
      jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
    });
  },

  unwrap: function() {
    return this.parent().each(function() {
      if ( !jQuery.nodeName( this, "body" ) ) {
        jQuery( this ).replaceWith( this.childNodes );
      }
    }).end();
  }
});
var curCSS, iframe,
  // swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
  // see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
  rdisplayswap = /^(none|table(?!-c[ea]).+)/,
  rmargin = /^margin/,
  rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
  rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
  rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
  elemdisplay = { BODY: "block" },

  cssShow = { position: "absolute", visibility: "hidden", display: "block" },
  cssNormalTransform = {
    letterSpacing: 0,
    fontWeight: 400
  },

  cssExpand = [ "Top", "Right", "Bottom", "Left" ],
  cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

  // shortcut for names that are not vendor prefixed
  if ( name in style ) {
    return name;
  }

  // check for vendor prefixed names
  var capName = name.charAt(0).toUpperCase() + name.slice(1),
    origName = name,
    i = cssPrefixes.length;

  while ( i-- ) {
    name = cssPrefixes[ i ] + capName;
    if ( name in style ) {
      return name;
    }
  }

  return origName;
}

function isHidden( elem, el ) {
  // isHidden might be called from jQuery#filter function;
  // in that case, element will be second argument
  elem = el || elem;
  return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
function getStyles( elem ) {
  return window.getComputedStyle( elem, null );
}

function showHide( elements, show ) {
  var display, elem, hidden,
    values = [],
    index = 0,
    length = elements.length;

  for ( ; index < length; index++ ) {
    elem = elements[ index ];
    if ( !elem.style ) {
      continue;
    }

    values[ index ] = data_priv.get( elem, "olddisplay" );
    display = elem.style.display;
    if ( show ) {
      // Reset the inline display of this element to learn if it is
      // being hidden by cascaded rules or not
      if ( !values[ index ] && display === "none" ) {
        elem.style.display = "";
      }

      // Set elements which have been overridden with display: none
      // in a stylesheet to whatever the default browser style is
      // for such an element
      if ( elem.style.display === "" && isHidden( elem ) ) {
        values[ index ] = data_priv.access( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
      }
    } else {

      if ( !values[ index ] ) {
        hidden = isHidden( elem );

        if ( display && display !== "none" || !hidden ) {
          data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css(elem, "display") );
        }
      }
    }
  }

  // Set the display of most of the elements in a second loop
  // to avoid the constant reflow
  for ( index = 0; index < length; index++ ) {
    elem = elements[ index ];
    if ( !elem.style ) {
      continue;
    }
    if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
      elem.style.display = show ? values[ index ] || "" : "none";
    }
  }

  return elements;
}

jQuery.fn.extend({
  css: function( name, value ) {
    return jQuery.access( this, function( elem, name, value ) {
      var styles, len,
        map = {},
        i = 0;

      if ( jQuery.isArray( name ) ) {
        styles = getStyles( elem );
        len = name.length;

        for ( ; i < len; i++ ) {
          map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
        }

        return map;
      }

      return value !== undefined ?
        jQuery.style( elem, name, value ) :
        jQuery.css( elem, name );
    }, name, value, arguments.length > 1 );
  },
  show: function() {
    return showHide( this, true );
  },
  hide: function() {
    return showHide( this );
  },
  toggle: function( state ) {
    if ( typeof state === "boolean" ) {
      return state ? this.show() : this.hide();
    }

    return this.each(function() {
      if ( isHidden( this ) ) {
        jQuery( this ).show();
      } else {
        jQuery( this ).hide();
      }
    });
  }
});

jQuery.extend({
  // Add in style property hooks for overriding the default
  // behavior of getting and setting a style property
  cssHooks: {
    opacity: {
      get: function( elem, computed ) {
        if ( computed ) {
          // We should always get a number back from opacity
          var ret = curCSS( elem, "opacity" );
          return ret === "" ? "1" : ret;
        }
      }
    }
  },

  // Don't automatically add "px" to these possibly-unitless properties
  cssNumber: {
    "columnCount": true,
    "fillOpacity": true,
    "fontWeight": true,
    "lineHeight": true,
    "opacity": true,
    "order": true,
    "orphans": true,
    "widows": true,
    "zIndex": true,
    "zoom": true
  },

  // Add in properties whose names you wish to fix before
  // setting or getting the value
  cssProps: {
    // normalize float css property
    "float": "cssFloat"
  },

  // Get and set the style property on a DOM Node
  style: function( elem, name, value, extra ) {
    // Don't set styles on text and comment nodes
    if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
      return;
    }

    // Make sure that we're working with the right name
    var ret, type, hooks,
      origName = jQuery.camelCase( name ),
      style = elem.style;

    name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

    // gets hook for the prefixed version
    // followed by the unprefixed version
    hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

    // Check if we're setting a value
    if ( value !== undefined ) {
      type = typeof value;

      // convert relative number strings (+= or -=) to relative numbers. #7345
      if ( type === "string" && (ret = rrelNum.exec( value )) ) {
        value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
        // Fixes bug #9237
        type = "number";
      }

      // Make sure that NaN and null values aren't set. See: #7116
      if ( value == null || type === "number" && isNaN( value ) ) {
        return;
      }

      // If a number was passed in, add 'px' to the (except for certain CSS properties)
      if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
        value += "px";
      }

      // Fixes #8908, it can be done more correctly by specifying setters in cssHooks,
      // but it would mean to define eight (for every problematic property) identical functions
      if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
        style[ name ] = "inherit";
      }

      // If a hook was provided, use that value, otherwise just set the specified value
      if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
        style[ name ] = value;
      }

    } else {
      // If a hook was provided get the non-computed value from there
      if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
        return ret;
      }

      // Otherwise just get the value from the style object
      return style[ name ];
    }
  },

  css: function( elem, name, extra, styles ) {
    var val, num, hooks,
      origName = jQuery.camelCase( name );

    // Make sure that we're working with the right name
    name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

    // gets hook for the prefixed version
    // followed by the unprefixed version
    hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

    // If a hook was provided get the computed value from there
    if ( hooks && "get" in hooks ) {
      val = hooks.get( elem, true, extra );
    }

    // Otherwise, if a way to get the computed value exists, use that
    if ( val === undefined ) {
      val = curCSS( elem, name, styles );
    }

    //convert "normal" to computed value
    if ( val === "normal" && name in cssNormalTransform ) {
      val = cssNormalTransform[ name ];
    }

    // Return, converting to number if forced or a qualifier was provided and val looks numeric
    if ( extra === "" || extra ) {
      num = parseFloat( val );
      return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
    }
    return val;
  }
});

curCSS = function( elem, name, _computed ) {
  var width, minWidth, maxWidth,
    computed = _computed || getStyles( elem ),

    // Support: IE9
    // getPropertyValue is only needed for .css('filter') in IE9, see #12537
    ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
    style = elem.style;

  if ( computed ) {

    if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
      ret = jQuery.style( elem, name );
    }

    // Support: Safari 5.1
    // A tribute to the "awesome hack by Dean Edwards"
    // Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
    // this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
    if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

      // Remember the original values
      width = style.width;
      minWidth = style.minWidth;
      maxWidth = style.maxWidth;

      // Put in the new values to get a computed value out
      style.minWidth = style.maxWidth = style.width = ret;
      ret = computed.width;

      // Revert the changed values
      style.width = width;
      style.minWidth = minWidth;
      style.maxWidth = maxWidth;
    }
  }

  return ret;
};


function setPositiveNumber( elem, value, subtract ) {
  var matches = rnumsplit.exec( value );
  return matches ?
    // Guard against undefined "subtract", e.g., when used as in cssHooks
    Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
    value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
  var i = extra === ( isBorderBox ? "border" : "content" ) ?
    // If we already have the right measurement, avoid augmentation
    4 :
    // Otherwise initialize for horizontal or vertical properties
    name === "width" ? 1 : 0,

    val = 0;

  for ( ; i < 4; i += 2 ) {
    // both box models exclude margin, so add it if we want it
    if ( extra === "margin" ) {
      val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
    }

    if ( isBorderBox ) {
      // border-box includes padding, so remove it if we want content
      if ( extra === "content" ) {
        val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
      }

      // at this point, extra isn't border nor margin, so remove border
      if ( extra !== "margin" ) {
        val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
      }
    } else {
      // at this point, extra isn't content, so add padding
      val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

      // at this point, extra isn't content nor padding, so add border
      if ( extra !== "padding" ) {
        val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
      }
    }
  }

  return val;
}

function getWidthOrHeight( elem, name, extra ) {

  // Start with offset property, which is equivalent to the border-box value
  var valueIsBorderBox = true,
    val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
    styles = getStyles( elem ),
    isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

  // some non-html elements return undefined for offsetWidth, so check for null/undefined
  // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
  // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
  if ( val <= 0 || val == null ) {
    // Fall back to computed then uncomputed css if necessary
    val = curCSS( elem, name, styles );
    if ( val < 0 || val == null ) {
      val = elem.style[ name ];
    }

    // Computed unit is not pixels. Stop here and return.
    if ( rnumnonpx.test(val) ) {
      return val;
    }

    // we need the check for style in case a browser which returns unreliable values
    // for getComputedStyle silently falls back to the reliable elem.style
    valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

    // Normalize "", auto, and prepare for extra
    val = parseFloat( val ) || 0;
  }

  // use the active box-sizing model to add/subtract irrelevant styles
  return ( val +
    augmentWidthOrHeight(
      elem,
      name,
      extra || ( isBorderBox ? "border" : "content" ),
      valueIsBorderBox,
      styles
    )
  ) + "px";
}

// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
  var doc = document,
    display = elemdisplay[ nodeName ];

  if ( !display ) {
    display = actualDisplay( nodeName, doc );

    // If the simple way fails, read from inside an iframe
    if ( display === "none" || !display ) {
      // Use the already-created iframe if possible
      iframe = ( iframe ||
        jQuery("<iframe frameborder='0' width='0' height='0'/>")
        .css( "cssText", "display:block !important" )
      ).appendTo( doc.documentElement );

      // Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
      doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
      doc.write("<!doctype html><html><body>");
      doc.close();

      display = actualDisplay( nodeName, doc );
      iframe.detach();
    }

    // Store the correct default display
    elemdisplay[ nodeName ] = display;
  }

  return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
  var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
    display = jQuery.css( elem[0], "display" );
  elem.remove();
  return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
  jQuery.cssHooks[ name ] = {
    get: function( elem, computed, extra ) {
      if ( computed ) {
        // certain elements can have dimension info if we invisibly show them
        // however, it must have a current display style that would benefit from this
        return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
          jQuery.swap( elem, cssShow, function() {
            return getWidthOrHeight( elem, name, extra );
          }) :
          getWidthOrHeight( elem, name, extra );
      }
    },

    set: function( elem, value, extra ) {
      var styles = extra && getStyles( elem );
      return setPositiveNumber( elem, value, extra ?
        augmentWidthOrHeight(
          elem,
          name,
          extra,
          jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
          styles
        ) : 0
      );
    }
  };
});

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
  // Support: Android 2.3
  if ( !jQuery.support.reliableMarginRight ) {
    jQuery.cssHooks.marginRight = {
      get: function( elem, computed ) {
        if ( computed ) {
          // Support: Android 2.3
          // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
          // Work around by temporarily setting element display to inline-block
          return jQuery.swap( elem, { "display": "inline-block" },
            curCSS, [ elem, "marginRight" ] );
        }
      }
    };
  }

  // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
  // getComputedStyle returns percent when specified for top/left/bottom/right
  // rather than make the css module depend on the offset module, we just check for it here
  if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
    jQuery.each( [ "top", "left" ], function( i, prop ) {
      jQuery.cssHooks[ prop ] = {
        get: function( elem, computed ) {
          if ( computed ) {
            computed = curCSS( elem, prop );
            // if curCSS returns percentage, fallback to offset
            return rnumnonpx.test( computed ) ?
              jQuery( elem ).position()[ prop ] + "px" :
              computed;
          }
        }
      };
    });
  }

});

if ( jQuery.expr && jQuery.expr.filters ) {
  jQuery.expr.filters.hidden = function( elem ) {
    // Support: Opera <= 12.12
    // Opera reports offsetWidths and offsetHeights less than zero on some elements
    return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
  };

  jQuery.expr.filters.visible = function( elem ) {
    return !jQuery.expr.filters.hidden( elem );
  };
}

// These hooks are used by animate to expand properties
jQuery.each({
  margin: "",
  padding: "",
  border: "Width"
}, function( prefix, suffix ) {
  jQuery.cssHooks[ prefix + suffix ] = {
    expand: function( value ) {
      var i = 0,
        expanded = {},

        // assumes a single number if not a string
        parts = typeof value === "string" ? value.split(" ") : [ value ];

      for ( ; i < 4; i++ ) {
        expanded[ prefix + cssExpand[ i ] + suffix ] =
          parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
      }

      return expanded;
    }
  };

  if ( !rmargin.test( prefix ) ) {
    jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
  }
});
var r20 = /%20/g,
  rbracket = /\[\]$/,
  rCRLF = /\r?\n/g,
  rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
  rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
  serialize: function() {
    return jQuery.param( this.serializeArray() );
  },
  serializeArray: function() {
    return this.map(function(){
      // Can add propHook for "elements" to filter or add form elements
      var elements = jQuery.prop( this, "elements" );
      return elements ? jQuery.makeArray( elements ) : this;
    })
    .filter(function(){
      var type = this.type;
      // Use .is(":disabled") so that fieldset[disabled] works
      return this.name && !jQuery( this ).is( ":disabled" ) &&
        rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
        ( this.checked || !manipulation_rcheckableType.test( type ) );
    })
    .map(function( i, elem ){
      var val = jQuery( this ).val();

      return val == null ?
        null :
        jQuery.isArray( val ) ?
          jQuery.map( val, function( val ){
            return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
          }) :
          { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
    }).get();
  }
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
  var prefix,
    s = [],
    add = function( key, value ) {
      // If value is a function, invoke it and return its value
      value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
      s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
    };

  // Set traditional to true for jQuery <= 1.3.2 behavior.
  if ( traditional === undefined ) {
    traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
  }

  // If an array was passed in, assume that it is an array of form elements.
  if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
    // Serialize the form elements
    jQuery.each( a, function() {
      add( this.name, this.value );
    });

  } else {
    // If traditional, encode the "old" way (the way 1.3.2 or older
    // did it), otherwise encode params recursively.
    for ( prefix in a ) {
      buildParams( prefix, a[ prefix ], traditional, add );
    }
  }

  // Return the resulting serialization
  return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
  var name;

  if ( jQuery.isArray( obj ) ) {
    // Serialize array item.
    jQuery.each( obj, function( i, v ) {
      if ( traditional || rbracket.test( prefix ) ) {
        // Treat each array item as a scalar.
        add( prefix, v );

      } else {
        // Item is non-scalar (array or object), encode its numeric index.
        buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
      }
    });

  } else if ( !traditional && jQuery.type( obj ) === "object" ) {
    // Serialize object item.
    for ( name in obj ) {
      buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
    }

  } else {
    // Serialize scalar item.
    add( prefix, obj );
  }
}
jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
  "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
  "change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

  // Handle event binding
  jQuery.fn[ name ] = function( data, fn ) {
    return arguments.length > 0 ?
      this.on( name, null, data, fn ) :
      this.trigger( name );
  };
});

jQuery.fn.extend({
  hover: function( fnOver, fnOut ) {
    return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
  },

  bind: function( types, data, fn ) {
    return this.on( types, null, data, fn );
  },
  unbind: function( types, fn ) {
    return this.off( types, null, fn );
  },

  delegate: function( selector, types, data, fn ) {
    return this.on( types, selector, data, fn );
  },
  undelegate: function( selector, types, fn ) {
    // ( namespace ) or ( selector, types [, fn] )
    return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
  }
});
var
  // Document location
  ajaxLocParts,
  ajaxLocation,

  ajax_nonce = jQuery.now(),

  ajax_rquery = /\?/,
  rhash = /#.*$/,
  rts = /([?&])_=[^&]*/,
  rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
  // #7653, #8125, #8152: local protocol detection
  rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
  rnoContent = /^(?:GET|HEAD)$/,
  rprotocol = /^\/\//,
  rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

  // Keep a copy of the old load method
  _load = jQuery.fn.load,

  /* Prefilters
   * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
   * 2) These are called:
   *    - BEFORE asking for a transport
   *    - AFTER param serialization (s.data is a string if s.processData is true)
   * 3) key is the dataType
   * 4) the catchall symbol "*" can be used
   * 5) execution will start with transport dataType and THEN continue down to "*" if needed
   */
  prefilters = {},

  /* Transports bindings
   * 1) key is the dataType
   * 2) the catchall symbol "*" can be used
   * 3) selection will start with transport dataType and THEN go to "*" if needed
   */
  transports = {},

  // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
  allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
  ajaxLocation = location.href;
} catch( e ) {
  // Use the href attribute of an A element
  // since IE will modify it given document.location
  ajaxLocation = document.createElement( "a" );
  ajaxLocation.href = "";
  ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

  // dataTypeExpression is optional and defaults to "*"
  return function( dataTypeExpression, func ) {

    if ( typeof dataTypeExpression !== "string" ) {
      func = dataTypeExpression;
      dataTypeExpression = "*";
    }

    var dataType,
      i = 0,
      dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

    if ( jQuery.isFunction( func ) ) {
      // For each dataType in the dataTypeExpression
      while ( (dataType = dataTypes[i++]) ) {
        // Prepend if requested
        if ( dataType[0] === "+" ) {
          dataType = dataType.slice( 1 ) || "*";
          (structure[ dataType ] = structure[ dataType ] || []).unshift( func );

        // Otherwise append
        } else {
          (structure[ dataType ] = structure[ dataType ] || []).push( func );
        }
      }
    }
  };
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

  var inspected = {},
    seekingTransport = ( structure === transports );

  function inspect( dataType ) {
    var selected;
    inspected[ dataType ] = true;
    jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
      var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
      if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
        options.dataTypes.unshift( dataTypeOrTransport );
        inspect( dataTypeOrTransport );
        return false;
      } else if ( seekingTransport ) {
        return !( selected = dataTypeOrTransport );
      }
    });
    return selected;
  }

  return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
  var key, deep,
    flatOptions = jQuery.ajaxSettings.flatOptions || {};

  for ( key in src ) {
    if ( src[ key ] !== undefined ) {
      ( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
    }
  }
  if ( deep ) {
    jQuery.extend( true, target, deep );
  }

  return target;
}

jQuery.fn.load = function( url, params, callback ) {
  if ( typeof url !== "string" && _load ) {
    return _load.apply( this, arguments );
  }

  var selector, type, response,
    self = this,
    off = url.indexOf(" ");

  if ( off >= 0 ) {
    selector = url.slice( off );
    url = url.slice( 0, off );
  }

  // If it's a function
  if ( jQuery.isFunction( params ) ) {

    // We assume that it's the callback
    callback = params;
    params = undefined;

  // Otherwise, build a param string
  } else if ( params && typeof params === "object" ) {
    type = "POST";
  }

  // If we have elements to modify, make the request
  if ( self.length > 0 ) {
    jQuery.ajax({
      url: url,

      // if "type" variable is undefined, then "GET" method will be used
      type: type,
      dataType: "html",
      data: params
    }).done(function( responseText ) {

      // Save response for use in complete callback
      response = arguments;

      self.html( selector ?

        // If a selector was specified, locate the right elements in a dummy div
        // Exclude scripts to avoid IE 'Permission Denied' errors
        jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

        // Otherwise use the full result
        responseText );

    }).complete( callback && function( jqXHR, status ) {
      self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
    });
  }

  return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
  jQuery.fn[ type ] = function( fn ){
    return this.on( type, fn );
  };
});

jQuery.extend({

  // Counter for holding the number of active queries
  active: 0,

  // Last-Modified header cache for next request
  lastModified: {},
  etag: {},

  ajaxSettings: {
    url: ajaxLocation,
    type: "GET",
    isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
    global: true,
    processData: true,
    async: true,
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    /*
    timeout: 0,
    data: null,
    dataType: null,
    username: null,
    password: null,
    cache: null,
    throws: false,
    traditional: false,
    headers: {},
    */

    accepts: {
      "*": allTypes,
      text: "text/plain",
      html: "text/html",
      xml: "application/xml, text/xml",
      json: "application/json, text/javascript"
    },

    contents: {
      xml: /xml/,
      html: /html/,
      json: /json/
    },

    responseFields: {
      xml: "responseXML",
      text: "responseText",
      json: "responseJSON"
    },

    // Data converters
    // Keys separate source (or catchall "*") and destination types with a single space
    converters: {

      // Convert anything to text
      "* text": String,

      // Text to html (true = no transformation)
      "text html": true,

      // Evaluate text as a json expression
      "text json": jQuery.parseJSON,

      // Parse text as xml
      "text xml": jQuery.parseXML
    },

    // For options that shouldn't be deep extended:
    // you can add your own custom options here if
    // and when you create one that shouldn't be
    // deep extended (see ajaxExtend)
    flatOptions: {
      url: true,
      context: true
    }
  },

  // Creates a full fledged settings object into target
  // with both ajaxSettings and settings fields.
  // If target is omitted, writes into ajaxSettings.
  ajaxSetup: function( target, settings ) {
    return settings ?

      // Building a settings object
      ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

      // Extending ajaxSettings
      ajaxExtend( jQuery.ajaxSettings, target );
  },

  ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
  ajaxTransport: addToPrefiltersOrTransports( transports ),

  // Main method
  ajax: function( url, options ) {

    // If url is an object, simulate pre-1.5 signature
    if ( typeof url === "object" ) {
      options = url;
      url = undefined;
    }

    // Force options to be an object
    options = options || {};

    var transport,
      // URL without anti-cache param
      cacheURL,
      // Response headers
      responseHeadersString,
      responseHeaders,
      // timeout handle
      timeoutTimer,
      // Cross-domain detection vars
      parts,
      // To know if global events are to be dispatched
      fireGlobals,
      // Loop variable
      i,
      // Create the final options object
      s = jQuery.ajaxSetup( {}, options ),
      // Callbacks context
      callbackContext = s.context || s,
      // Context for global events is callbackContext if it is a DOM node or jQuery collection
      globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
        jQuery( callbackContext ) :
        jQuery.event,
      // Deferreds
      deferred = jQuery.Deferred(),
      completeDeferred = jQuery.Callbacks("once memory"),
      // Status-dependent callbacks
      statusCode = s.statusCode || {},
      // Headers (they are sent all at once)
      requestHeaders = {},
      requestHeadersNames = {},
      // The jqXHR state
      state = 0,
      // Default abort message
      strAbort = "canceled",
      // Fake xhr
      jqXHR = {
        readyState: 0,

        // Builds headers hashtable if needed
        getResponseHeader: function( key ) {
          var match;
          if ( state === 2 ) {
            if ( !responseHeaders ) {
              responseHeaders = {};
              while ( (match = rheaders.exec( responseHeadersString )) ) {
                responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
              }
            }
            match = responseHeaders[ key.toLowerCase() ];
          }
          return match == null ? null : match;
        },

        // Raw string
        getAllResponseHeaders: function() {
          return state === 2 ? responseHeadersString : null;
        },

        // Caches the header
        setRequestHeader: function( name, value ) {
          var lname = name.toLowerCase();
          if ( !state ) {
            name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
            requestHeaders[ name ] = value;
          }
          return this;
        },

        // Overrides response content-type header
        overrideMimeType: function( type ) {
          if ( !state ) {
            s.mimeType = type;
          }
          return this;
        },

        // Status-dependent callbacks
        statusCode: function( map ) {
          var code;
          if ( map ) {
            if ( state < 2 ) {
              for ( code in map ) {
                // Lazy-add the new callback in a way that preserves old ones
                statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
              }
            } else {
              // Execute the appropriate callbacks
              jqXHR.always( map[ jqXHR.status ] );
            }
          }
          return this;
        },

        // Cancel the request
        abort: function( statusText ) {
          var finalText = statusText || strAbort;
          if ( transport ) {
            transport.abort( finalText );
          }
          done( 0, finalText );
          return this;
        }
      };

    // Attach deferreds
    deferred.promise( jqXHR ).complete = completeDeferred.add;
    jqXHR.success = jqXHR.done;
    jqXHR.error = jqXHR.fail;

    // Remove hash character (#7531: and string promotion)
    // Add protocol if not provided (prefilters might expect it)
    // Handle falsy url in the settings object (#10093: consistency with old signature)
    // We also use the url parameter if available
    s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
      .replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

    // Alias method option to type as per ticket #12004
    s.type = options.method || options.type || s.method || s.type;

    // Extract dataTypes list
    s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

    // A cross-domain request is in order when we have a protocol:host:port mismatch
    if ( s.crossDomain == null ) {
      parts = rurl.exec( s.url.toLowerCase() );
      s.crossDomain = !!( parts &&
        ( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
          ( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
            ( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
      );
    }

    // Convert data if not already a string
    if ( s.data && s.processData && typeof s.data !== "string" ) {
      s.data = jQuery.param( s.data, s.traditional );
    }

    // Apply prefilters
    inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

    // If request was aborted inside a prefilter, stop there
    if ( state === 2 ) {
      return jqXHR;
    }

    // We can fire global events as of now if asked to
    fireGlobals = s.global;

    // Watch for a new set of requests
    if ( fireGlobals && jQuery.active++ === 0 ) {
      jQuery.event.trigger("ajaxStart");
    }

    // Uppercase the type
    s.type = s.type.toUpperCase();

    // Determine if request has content
    s.hasContent = !rnoContent.test( s.type );

    // Save the URL in case we're toying with the If-Modified-Since
    // and/or If-None-Match header later on
    cacheURL = s.url;

    // More options handling for requests with no content
    if ( !s.hasContent ) {

      // If data is available, append data to url
      if ( s.data ) {
        cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
        // #9682: remove data so that it's not used in an eventual retry
        delete s.data;
      }

      // Add anti-cache in url if needed
      if ( s.cache === false ) {
        s.url = rts.test( cacheURL ) ?

          // If there is already a '_' parameter, set its value
          cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

          // Otherwise add one to the end
          cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
      }
    }

    // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
    if ( s.ifModified ) {
      if ( jQuery.lastModified[ cacheURL ] ) {
        jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
      }
      if ( jQuery.etag[ cacheURL ] ) {
        jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
      }
    }

    // Set the correct header, if data is being sent
    if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
      jqXHR.setRequestHeader( "Content-Type", s.contentType );
    }

    // Set the Accepts header for the server, depending on the dataType
    jqXHR.setRequestHeader(
      "Accept",
      s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
        s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
        s.accepts[ "*" ]
    );

    // Check for headers option
    for ( i in s.headers ) {
      jqXHR.setRequestHeader( i, s.headers[ i ] );
    }

    // Allow custom headers/mimetypes and early abort
    if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
      // Abort if not done already and return
      return jqXHR.abort();
    }

    // aborting is no longer a cancellation
    strAbort = "abort";

    // Install callbacks on deferreds
    for ( i in { success: 1, error: 1, complete: 1 } ) {
      jqXHR[ i ]( s[ i ] );
    }

    // Get transport
    transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

    // If no transport, we auto-abort
    if ( !transport ) {
      done( -1, "No Transport" );
    } else {
      jqXHR.readyState = 1;

      // Send global event
      if ( fireGlobals ) {
        globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
      }
      // Timeout
      if ( s.async && s.timeout > 0 ) {
        timeoutTimer = setTimeout(function() {
          jqXHR.abort("timeout");
        }, s.timeout );
      }

      try {
        state = 1;
        transport.send( requestHeaders, done );
      } catch ( e ) {
        // Propagate exception as error if not done
        if ( state < 2 ) {
          done( -1, e );
        // Simply rethrow otherwise
        } else {
          throw e;
        }
      }
    }

    // Callback for when everything is done
    function done( status, nativeStatusText, responses, headers ) {
      var isSuccess, success, error, response, modified,
        statusText = nativeStatusText;

      // Called once
      if ( state === 2 ) {
        return;
      }

      // State is "done" now
      state = 2;

      // Clear timeout if it exists
      if ( timeoutTimer ) {
        clearTimeout( timeoutTimer );
      }

      // Dereference transport for early garbage collection
      // (no matter how long the jqXHR object will be used)
      transport = undefined;

      // Cache response headers
      responseHeadersString = headers || "";

      // Set readyState
      jqXHR.readyState = status > 0 ? 4 : 0;

      // Determine if successful
      isSuccess = status >= 200 && status < 300 || status === 304;

      // Get response data
      if ( responses ) {
        response = ajaxHandleResponses( s, jqXHR, responses );
      }

      // Convert no matter what (that way responseXXX fields are always set)
      response = ajaxConvert( s, response, jqXHR, isSuccess );

      // If successful, handle type chaining
      if ( isSuccess ) {

        // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
        if ( s.ifModified ) {
          modified = jqXHR.getResponseHeader("Last-Modified");
          if ( modified ) {
            jQuery.lastModified[ cacheURL ] = modified;
          }
          modified = jqXHR.getResponseHeader("etag");
          if ( modified ) {
            jQuery.etag[ cacheURL ] = modified;
          }
        }

        // if no content
        if ( status === 204 || s.type === "HEAD" ) {
          statusText = "nocontent";

        // if not modified
        } else if ( status === 304 ) {
          statusText = "notmodified";

        // If we have data, let's convert it
        } else {
          statusText = response.state;
          success = response.data;
          error = response.error;
          isSuccess = !error;
        }
      } else {
        // We extract error from statusText
        // then normalize statusText and status for non-aborts
        error = statusText;
        if ( status || !statusText ) {
          statusText = "error";
          if ( status < 0 ) {
            status = 0;
          }
        }
      }

      // Set data for the fake xhr object
      jqXHR.status = status;
      jqXHR.statusText = ( nativeStatusText || statusText ) + "";

      // Success/Error
      if ( isSuccess ) {
        deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
      } else {
        deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
      }

      // Status-dependent callbacks
      jqXHR.statusCode( statusCode );
      statusCode = undefined;

      if ( fireGlobals ) {
        globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
          [ jqXHR, s, isSuccess ? success : error ] );
      }

      // Complete
      completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

      if ( fireGlobals ) {
        globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
        // Handle the global AJAX counter
        if ( !( --jQuery.active ) ) {
          jQuery.event.trigger("ajaxStop");
        }
      }
    }

    return jqXHR;
  },

  getJSON: function( url, data, callback ) {
    return jQuery.get( url, data, callback, "json" );
  },

  getScript: function( url, callback ) {
    return jQuery.get( url, undefined, callback, "script" );
  }
});

jQuery.each( [ "get", "post" ], function( i, method ) {
  jQuery[ method ] = function( url, data, callback, type ) {
    // shift arguments if data argument was omitted
    if ( jQuery.isFunction( data ) ) {
      type = type || callback;
      callback = data;
      data = undefined;
    }

    return jQuery.ajax({
      url: url,
      type: method,
      dataType: type,
      data: data,
      success: callback
    });
  };
});

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

  var ct, type, finalDataType, firstDataType,
    contents = s.contents,
    dataTypes = s.dataTypes;

  // Remove auto dataType and get content-type in the process
  while( dataTypes[ 0 ] === "*" ) {
    dataTypes.shift();
    if ( ct === undefined ) {
      ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
    }
  }

  // Check if we're dealing with a known content-type
  if ( ct ) {
    for ( type in contents ) {
      if ( contents[ type ] && contents[ type ].test( ct ) ) {
        dataTypes.unshift( type );
        break;
      }
    }
  }

  // Check to see if we have a response for the expected dataType
  if ( dataTypes[ 0 ] in responses ) {
    finalDataType = dataTypes[ 0 ];
  } else {
    // Try convertible dataTypes
    for ( type in responses ) {
      if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
        finalDataType = type;
        break;
      }
      if ( !firstDataType ) {
        firstDataType = type;
      }
    }
    // Or just use first one
    finalDataType = finalDataType || firstDataType;
  }

  // If we found a dataType
  // We add the dataType to the list if needed
  // and return the corresponding response
  if ( finalDataType ) {
    if ( finalDataType !== dataTypes[ 0 ] ) {
      dataTypes.unshift( finalDataType );
    }
    return responses[ finalDataType ];
  }
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
  var conv2, current, conv, tmp, prev,
    converters = {},
    // Work with a copy of dataTypes in case we need to modify it for conversion
    dataTypes = s.dataTypes.slice();

  // Create converters map with lowercased keys
  if ( dataTypes[ 1 ] ) {
    for ( conv in s.converters ) {
      converters[ conv.toLowerCase() ] = s.converters[ conv ];
    }
  }

  current = dataTypes.shift();

  // Convert to each sequential dataType
  while ( current ) {

    if ( s.responseFields[ current ] ) {
      jqXHR[ s.responseFields[ current ] ] = response;
    }

    // Apply the dataFilter if provided
    if ( !prev && isSuccess && s.dataFilter ) {
      response = s.dataFilter( response, s.dataType );
    }

    prev = current;
    current = dataTypes.shift();

    if ( current ) {

    // There's only work to do if current dataType is non-auto
      if ( current === "*" ) {

        current = prev;

      // Convert response if prev dataType is non-auto and differs from current
      } else if ( prev !== "*" && prev !== current ) {

        // Seek a direct converter
        conv = converters[ prev + " " + current ] || converters[ "* " + current ];

        // If none found, seek a pair
        if ( !conv ) {
          for ( conv2 in converters ) {

            // If conv2 outputs current
            tmp = conv2.split( " " );
            if ( tmp[ 1 ] === current ) {

              // If prev can be converted to accepted input
              conv = converters[ prev + " " + tmp[ 0 ] ] ||
                converters[ "* " + tmp[ 0 ] ];
              if ( conv ) {
                // Condense equivalence converters
                if ( conv === true ) {
                  conv = converters[ conv2 ];

                // Otherwise, insert the intermediate dataType
                } else if ( converters[ conv2 ] !== true ) {
                  current = tmp[ 0 ];
                  dataTypes.unshift( tmp[ 1 ] );
                }
                break;
              }
            }
          }
        }

        // Apply converter (if not an equivalence)
        if ( conv !== true ) {

          // Unless errors are allowed to bubble, catch and return them
          if ( conv && s[ "throws" ] ) {
            response = conv( response );
          } else {
            try {
              response = conv( response );
            } catch ( e ) {
              return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
            }
          }
        }
      }
    }
  }

  return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
  accepts: {
    script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
  },
  contents: {
    script: /(?:java|ecma)script/
  },
  converters: {
    "text script": function( text ) {
      jQuery.globalEval( text );
      return text;
    }
  }
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
  if ( s.cache === undefined ) {
    s.cache = false;
  }
  if ( s.crossDomain ) {
    s.type = "GET";
  }
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
  // This transport only deals with cross domain requests
  if ( s.crossDomain ) {
    var script, callback;
    return {
      send: function( _, complete ) {
        script = jQuery("<script>").prop({
          async: true,
          charset: s.scriptCharset,
          src: s.url
        }).on(
          "load error",
          callback = function( evt ) {
            script.remove();
            callback = null;
            if ( evt ) {
              complete( evt.type === "error" ? 404 : 200, evt.type );
            }
          }
        );
        document.head.appendChild( script[ 0 ] );
      },
      abort: function() {
        if ( callback ) {
          callback();
        }
      }
    };
  }
});
var oldCallbacks = [],
  rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
  jsonp: "callback",
  jsonpCallback: function() {
    var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
    this[ callback ] = true;
    return callback;
  }
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

  var callbackName, overwritten, responseContainer,
    jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
      "url" :
      typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
    );

  // Handle iff the expected data type is "jsonp" or we have a parameter to set
  if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

    // Get callback name, remembering preexisting value associated with it
    callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
      s.jsonpCallback() :
      s.jsonpCallback;

    // Insert callback into url or form data
    if ( jsonProp ) {
      s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
    } else if ( s.jsonp !== false ) {
      s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
    }

    // Use data converter to retrieve json after script execution
    s.converters["script json"] = function() {
      if ( !responseContainer ) {
        jQuery.error( callbackName + " was not called" );
      }
      return responseContainer[ 0 ];
    };

    // force json dataType
    s.dataTypes[ 0 ] = "json";

    // Install callback
    overwritten = window[ callbackName ];
    window[ callbackName ] = function() {
      responseContainer = arguments;
    };

    // Clean-up function (fires after converters)
    jqXHR.always(function() {
      // Restore preexisting value
      window[ callbackName ] = overwritten;

      // Save back as free
      if ( s[ callbackName ] ) {
        // make sure that re-using the options doesn't screw things around
        s.jsonpCallback = originalSettings.jsonpCallback;

        // save the callback name for future use
        oldCallbacks.push( callbackName );
      }

      // Call if it was a function and we have a response
      if ( responseContainer && jQuery.isFunction( overwritten ) ) {
        overwritten( responseContainer[ 0 ] );
      }

      responseContainer = overwritten = undefined;
    });

    // Delegate to script
    return "script";
  }
});
jQuery.ajaxSettings.xhr = function() {
  try {
    return new XMLHttpRequest();
  } catch( e ) {}
};

var xhrSupported = jQuery.ajaxSettings.xhr(),
  xhrSuccessStatus = {
    // file protocol always yields status code 0, assume 200
    0: 200,
    // Support: IE9
    // #1450: sometimes IE returns 1223 when it should be 204
    1223: 204
  },
  // Support: IE9
  // We need to keep track of outbound xhr and abort them manually
  // because IE is not smart enough to do it all by itself
  xhrId = 0,
  xhrCallbacks = {};

if ( window.ActiveXObject ) {
  jQuery( window ).on( "unload", function() {
    for( var key in xhrCallbacks ) {
      xhrCallbacks[ key ]();
    }
    xhrCallbacks = undefined;
  });
}

jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
jQuery.support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
  var callback;
  // Cross domain only allowed if supported through XMLHttpRequest
  if ( jQuery.support.cors || xhrSupported && !options.crossDomain ) {
    return {
      send: function( headers, complete ) {
        var i, id,
          xhr = options.xhr();
        xhr.open( options.type, options.url, options.async, options.username, options.password );
        // Apply custom fields if provided
        if ( options.xhrFields ) {
          for ( i in options.xhrFields ) {
            xhr[ i ] = options.xhrFields[ i ];
          }
        }
        // Override mime type if needed
        if ( options.mimeType && xhr.overrideMimeType ) {
          xhr.overrideMimeType( options.mimeType );
        }
        // X-Requested-With header
        // For cross-domain requests, seeing as conditions for a preflight are
        // akin to a jigsaw puzzle, we simply never set it to be sure.
        // (it can always be set on a per-request basis or even using ajaxSetup)
        // For same-domain requests, won't change header if already provided.
        if ( !options.crossDomain && !headers["X-Requested-With"] ) {
          headers["X-Requested-With"] = "XMLHttpRequest";
        }
        // Set headers
        for ( i in headers ) {
          xhr.setRequestHeader( i, headers[ i ] );
        }
        // Callback
        callback = function( type ) {
          return function() {
            if ( callback ) {
              delete xhrCallbacks[ id ];
              callback = xhr.onload = xhr.onerror = null;
              if ( type === "abort" ) {
                xhr.abort();
              } else if ( type === "error" ) {
                complete(
                  // file protocol always yields status 0, assume 404
                  xhr.status || 404,
                  xhr.statusText
                );
              } else {
                complete(
                  xhrSuccessStatus[ xhr.status ] || xhr.status,
                  xhr.statusText,
                  // Support: IE9
                  // #11426: When requesting binary data, IE9 will throw an exception
                  // on any attempt to access responseText
                  typeof xhr.responseText === "string" ? {
                    text: xhr.responseText
                  } : undefined,
                  xhr.getAllResponseHeaders()
                );
              }
            }
          };
        };
        // Listen to events
        xhr.onload = callback();
        xhr.onerror = callback("error");
        // Create the abort callback
        callback = xhrCallbacks[( id = xhrId++ )] = callback("abort");
        // Do send the request
        // This may raise an exception which is actually
        // handled in jQuery.ajax (so no try/catch here)
        xhr.send( options.hasContent && options.data || null );
      },
      abort: function() {
        if ( callback ) {
          callback();
        }
      }
    };
  }
});
var fxNow, timerId,
  rfxtypes = /^(?:toggle|show|hide)$/,
  rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
  rrun = /queueHooks$/,
  animationPrefilters = [ defaultPrefilter ],
  tweeners = {
    "*": [function( prop, value ) {
      var tween = this.createTween( prop, value ),
        target = tween.cur(),
        parts = rfxnum.exec( value ),
        unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

        // Starting value computation is required for potential unit mismatches
        start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
          rfxnum.exec( jQuery.css( tween.elem, prop ) ),
        scale = 1,
        maxIterations = 20;

      if ( start && start[ 3 ] !== unit ) {
        // Trust units reported by jQuery.css
        unit = unit || start[ 3 ];

        // Make sure we update the tween properties later on
        parts = parts || [];

        // Iteratively approximate from a nonzero starting point
        start = +target || 1;

        do {
          // If previous iteration zeroed out, double until we get *something*
          // Use a string for doubling factor so we don't accidentally see scale as unchanged below
          scale = scale || ".5";

          // Adjust and apply
          start = start / scale;
          jQuery.style( tween.elem, prop, start + unit );

        // Update scale, tolerating zero or NaN from tween.cur()
        // And breaking the loop if scale is unchanged or perfect, or if we've just had enough
        } while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
      }

      // Update tween properties
      if ( parts ) {
        start = tween.start = +start || +target || 0;
        tween.unit = unit;
        // If a +=/-= token was provided, we're doing a relative animation
        tween.end = parts[ 1 ] ?
          start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
          +parts[ 2 ];
      }

      return tween;
    }]
  };

// Animations created synchronously will run synchronously
function createFxNow() {
  setTimeout(function() {
    fxNow = undefined;
  });
  return ( fxNow = jQuery.now() );
}

function createTween( value, prop, animation ) {
  var tween,
    collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
    index = 0,
    length = collection.length;
  for ( ; index < length; index++ ) {
    if ( (tween = collection[ index ].call( animation, prop, value )) ) {

      // we're done with this property
      return tween;
    }
  }
}

function Animation( elem, properties, options ) {
  var result,
    stopped,
    index = 0,
    length = animationPrefilters.length,
    deferred = jQuery.Deferred().always( function() {
      // don't match elem in the :animated selector
      delete tick.elem;
    }),
    tick = function() {
      if ( stopped ) {
        return false;
      }
      var currentTime = fxNow || createFxNow(),
        remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
        // archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
        temp = remaining / animation.duration || 0,
        percent = 1 - temp,
        index = 0,
        length = animation.tweens.length;

      for ( ; index < length ; index++ ) {
        animation.tweens[ index ].run( percent );
      }

      deferred.notifyWith( elem, [ animation, percent, remaining ]);

      if ( percent < 1 && length ) {
        return remaining;
      } else {
        deferred.resolveWith( elem, [ animation ] );
        return false;
      }
    },
    animation = deferred.promise({
      elem: elem,
      props: jQuery.extend( {}, properties ),
      opts: jQuery.extend( true, { specialEasing: {} }, options ),
      originalProperties: properties,
      originalOptions: options,
      startTime: fxNow || createFxNow(),
      duration: options.duration,
      tweens: [],
      createTween: function( prop, end ) {
        var tween = jQuery.Tween( elem, animation.opts, prop, end,
            animation.opts.specialEasing[ prop ] || animation.opts.easing );
        animation.tweens.push( tween );
        return tween;
      },
      stop: function( gotoEnd ) {
        var index = 0,
          // if we are going to the end, we want to run all the tweens
          // otherwise we skip this part
          length = gotoEnd ? animation.tweens.length : 0;
        if ( stopped ) {
          return this;
        }
        stopped = true;
        for ( ; index < length ; index++ ) {
          animation.tweens[ index ].run( 1 );
        }

        // resolve when we played the last frame
        // otherwise, reject
        if ( gotoEnd ) {
          deferred.resolveWith( elem, [ animation, gotoEnd ] );
        } else {
          deferred.rejectWith( elem, [ animation, gotoEnd ] );
        }
        return this;
      }
    }),
    props = animation.props;

  propFilter( props, animation.opts.specialEasing );

  for ( ; index < length ; index++ ) {
    result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
    if ( result ) {
      return result;
    }
  }

  jQuery.map( props, createTween, animation );

  if ( jQuery.isFunction( animation.opts.start ) ) {
    animation.opts.start.call( elem, animation );
  }

  jQuery.fx.timer(
    jQuery.extend( tick, {
      elem: elem,
      anim: animation,
      queue: animation.opts.queue
    })
  );

  // attach callbacks from options
  return animation.progress( animation.opts.progress )
    .done( animation.opts.done, animation.opts.complete )
    .fail( animation.opts.fail )
    .always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
  var index, name, easing, value, hooks;

  // camelCase, specialEasing and expand cssHook pass
  for ( index in props ) {
    name = jQuery.camelCase( index );
    easing = specialEasing[ name ];
    value = props[ index ];
    if ( jQuery.isArray( value ) ) {
      easing = value[ 1 ];
      value = props[ index ] = value[ 0 ];
    }

    if ( index !== name ) {
      props[ name ] = value;
      delete props[ index ];
    }

    hooks = jQuery.cssHooks[ name ];
    if ( hooks && "expand" in hooks ) {
      value = hooks.expand( value );
      delete props[ name ];

      // not quite $.extend, this wont overwrite keys already present.
      // also - reusing 'index' from above because we have the correct "name"
      for ( index in value ) {
        if ( !( index in props ) ) {
          props[ index ] = value[ index ];
          specialEasing[ index ] = easing;
        }
      }
    } else {
      specialEasing[ name ] = easing;
    }
  }
}

jQuery.Animation = jQuery.extend( Animation, {

  tweener: function( props, callback ) {
    if ( jQuery.isFunction( props ) ) {
      callback = props;
      props = [ "*" ];
    } else {
      props = props.split(" ");
    }

    var prop,
      index = 0,
      length = props.length;

    for ( ; index < length ; index++ ) {
      prop = props[ index ];
      tweeners[ prop ] = tweeners[ prop ] || [];
      tweeners[ prop ].unshift( callback );
    }
  },

  prefilter: function( callback, prepend ) {
    if ( prepend ) {
      animationPrefilters.unshift( callback );
    } else {
      animationPrefilters.push( callback );
    }
  }
});

function defaultPrefilter( elem, props, opts ) {
  /* jshint validthis: true */
  var prop, value, toggle, tween, hooks, oldfire,
    anim = this,
    orig = {},
    style = elem.style,
    hidden = elem.nodeType && isHidden( elem ),
    dataShow = data_priv.get( elem, "fxshow" );

  // handle queue: false promises
  if ( !opts.queue ) {
    hooks = jQuery._queueHooks( elem, "fx" );
    if ( hooks.unqueued == null ) {
      hooks.unqueued = 0;
      oldfire = hooks.empty.fire;
      hooks.empty.fire = function() {
        if ( !hooks.unqueued ) {
          oldfire();
        }
      };
    }
    hooks.unqueued++;

    anim.always(function() {
      // doing this makes sure that the complete handler will be called
      // before this completes
      anim.always(function() {
        hooks.unqueued--;
        if ( !jQuery.queue( elem, "fx" ).length ) {
          hooks.empty.fire();
        }
      });
    });
  }

  // height/width overflow pass
  if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
    // Make sure that nothing sneaks out
    // Record all 3 overflow attributes because IE9-10 do not
    // change the overflow attribute when overflowX and
    // overflowY are set to the same value
    opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

    // Set display property to inline-block for height/width
    // animations on inline elements that are having width/height animated
    if ( jQuery.css( elem, "display" ) === "inline" &&
        jQuery.css( elem, "float" ) === "none" ) {

      style.display = "inline-block";
    }
  }

  if ( opts.overflow ) {
    style.overflow = "hidden";
    anim.always(function() {
      style.overflow = opts.overflow[ 0 ];
      style.overflowX = opts.overflow[ 1 ];
      style.overflowY = opts.overflow[ 2 ];
    });
  }


  // show/hide pass
  for ( prop in props ) {
    value = props[ prop ];
    if ( rfxtypes.exec( value ) ) {
      delete props[ prop ];
      toggle = toggle || value === "toggle";
      if ( value === ( hidden ? "hide" : "show" ) ) {

        // If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
        if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
          hidden = true;
        } else {
          continue;
        }
      }
      orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
    }
  }

  if ( !jQuery.isEmptyObject( orig ) ) {
    if ( dataShow ) {
      if ( "hidden" in dataShow ) {
        hidden = dataShow.hidden;
      }
    } else {
      dataShow = data_priv.access( elem, "fxshow", {} );
    }

    // store state if its toggle - enables .stop().toggle() to "reverse"
    if ( toggle ) {
      dataShow.hidden = !hidden;
    }
    if ( hidden ) {
      jQuery( elem ).show();
    } else {
      anim.done(function() {
        jQuery( elem ).hide();
      });
    }
    anim.done(function() {
      var prop;

      data_priv.remove( elem, "fxshow" );
      for ( prop in orig ) {
        jQuery.style( elem, prop, orig[ prop ] );
      }
    });
    for ( prop in orig ) {
      tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

      if ( !( prop in dataShow ) ) {
        dataShow[ prop ] = tween.start;
        if ( hidden ) {
          tween.end = tween.start;
          tween.start = prop === "width" || prop === "height" ? 1 : 0;
        }
      }
    }
  }
}

function Tween( elem, options, prop, end, easing ) {
  return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
  constructor: Tween,
  init: function( elem, options, prop, end, easing, unit ) {
    this.elem = elem;
    this.prop = prop;
    this.easing = easing || "swing";
    this.options = options;
    this.start = this.now = this.cur();
    this.end = end;
    this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
  },
  cur: function() {
    var hooks = Tween.propHooks[ this.prop ];

    return hooks && hooks.get ?
      hooks.get( this ) :
      Tween.propHooks._default.get( this );
  },
  run: function( percent ) {
    var eased,
      hooks = Tween.propHooks[ this.prop ];

    if ( this.options.duration ) {
      this.pos = eased = jQuery.easing[ this.easing ](
        percent, this.options.duration * percent, 0, 1, this.options.duration
      );
    } else {
      this.pos = eased = percent;
    }
    this.now = ( this.end - this.start ) * eased + this.start;

    if ( this.options.step ) {
      this.options.step.call( this.elem, this.now, this );
    }

    if ( hooks && hooks.set ) {
      hooks.set( this );
    } else {
      Tween.propHooks._default.set( this );
    }
    return this;
  }
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
  _default: {
    get: function( tween ) {
      var result;

      if ( tween.elem[ tween.prop ] != null &&
        (!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
        return tween.elem[ tween.prop ];
      }

      // passing an empty string as a 3rd parameter to .css will automatically
      // attempt a parseFloat and fallback to a string if the parse fails
      // so, simple values such as "10px" are parsed to Float.
      // complex values such as "rotate(1rad)" are returned as is.
      result = jQuery.css( tween.elem, tween.prop, "" );
      // Empty strings, null, undefined and "auto" are converted to 0.
      return !result || result === "auto" ? 0 : result;
    },
    set: function( tween ) {
      // use step hook for back compat - use cssHook if its there - use .style if its
      // available and use plain properties where available
      if ( jQuery.fx.step[ tween.prop ] ) {
        jQuery.fx.step[ tween.prop ]( tween );
      } else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
        jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
      } else {
        tween.elem[ tween.prop ] = tween.now;
      }
    }
  }
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
  set: function( tween ) {
    if ( tween.elem.nodeType && tween.elem.parentNode ) {
      tween.elem[ tween.prop ] = tween.now;
    }
  }
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
  var cssFn = jQuery.fn[ name ];
  jQuery.fn[ name ] = function( speed, easing, callback ) {
    return speed == null || typeof speed === "boolean" ?
      cssFn.apply( this, arguments ) :
      this.animate( genFx( name, true ), speed, easing, callback );
  };
});

jQuery.fn.extend({
  fadeTo: function( speed, to, easing, callback ) {

    // show any hidden elements after setting opacity to 0
    return this.filter( isHidden ).css( "opacity", 0 ).show()

      // animate to the value specified
      .end().animate({ opacity: to }, speed, easing, callback );
  },
  animate: function( prop, speed, easing, callback ) {
    var empty = jQuery.isEmptyObject( prop ),
      optall = jQuery.speed( speed, easing, callback ),
      doAnimation = function() {
        // Operate on a copy of prop so per-property easing won't be lost
        var anim = Animation( this, jQuery.extend( {}, prop ), optall );

        // Empty animations, or finishing resolves immediately
        if ( empty || data_priv.get( this, "finish" ) ) {
          anim.stop( true );
        }
      };
      doAnimation.finish = doAnimation;

    return empty || optall.queue === false ?
      this.each( doAnimation ) :
      this.queue( optall.queue, doAnimation );
  },
  stop: function( type, clearQueue, gotoEnd ) {
    var stopQueue = function( hooks ) {
      var stop = hooks.stop;
      delete hooks.stop;
      stop( gotoEnd );
    };

    if ( typeof type !== "string" ) {
      gotoEnd = clearQueue;
      clearQueue = type;
      type = undefined;
    }
    if ( clearQueue && type !== false ) {
      this.queue( type || "fx", [] );
    }

    return this.each(function() {
      var dequeue = true,
        index = type != null && type + "queueHooks",
        timers = jQuery.timers,
        data = data_priv.get( this );

      if ( index ) {
        if ( data[ index ] && data[ index ].stop ) {
          stopQueue( data[ index ] );
        }
      } else {
        for ( index in data ) {
          if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
            stopQueue( data[ index ] );
          }
        }
      }

      for ( index = timers.length; index--; ) {
        if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
          timers[ index ].anim.stop( gotoEnd );
          dequeue = false;
          timers.splice( index, 1 );
        }
      }

      // start the next in the queue if the last step wasn't forced
      // timers currently will call their complete callbacks, which will dequeue
      // but only if they were gotoEnd
      if ( dequeue || !gotoEnd ) {
        jQuery.dequeue( this, type );
      }
    });
  },
  finish: function( type ) {
    if ( type !== false ) {
      type = type || "fx";
    }
    return this.each(function() {
      var index,
        data = data_priv.get( this ),
        queue = data[ type + "queue" ],
        hooks = data[ type + "queueHooks" ],
        timers = jQuery.timers,
        length = queue ? queue.length : 0;

      // enable finishing flag on private data
      data.finish = true;

      // empty the queue first
      jQuery.queue( this, type, [] );

      if ( hooks && hooks.stop ) {
        hooks.stop.call( this, true );
      }

      // look for any active animations, and finish them
      for ( index = timers.length; index--; ) {
        if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
          timers[ index ].anim.stop( true );
          timers.splice( index, 1 );
        }
      }

      // look for any animations in the old queue and finish them
      for ( index = 0; index < length; index++ ) {
        if ( queue[ index ] && queue[ index ].finish ) {
          queue[ index ].finish.call( this );
        }
      }

      // turn off finishing flag
      delete data.finish;
    });
  }
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
  var which,
    attrs = { height: type },
    i = 0;

  // if we include width, step value is 1 to do all cssExpand values,
  // if we don't include width, step value is 2 to skip over Left and Right
  includeWidth = includeWidth? 1 : 0;
  for( ; i < 4 ; i += 2 - includeWidth ) {
    which = cssExpand[ i ];
    attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
  }

  if ( includeWidth ) {
    attrs.opacity = attrs.width = type;
  }

  return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
  slideDown: genFx("show"),
  slideUp: genFx("hide"),
  slideToggle: genFx("toggle"),
  fadeIn: { opacity: "show" },
  fadeOut: { opacity: "hide" },
  fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
  jQuery.fn[ name ] = function( speed, easing, callback ) {
    return this.animate( props, speed, easing, callback );
  };
});

jQuery.speed = function( speed, easing, fn ) {
  var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
    complete: fn || !fn && easing ||
      jQuery.isFunction( speed ) && speed,
    duration: speed,
    easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
  };

  opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
    opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

  // normalize opt.queue - true/undefined/null -> "fx"
  if ( opt.queue == null || opt.queue === true ) {
    opt.queue = "fx";
  }

  // Queueing
  opt.old = opt.complete;

  opt.complete = function() {
    if ( jQuery.isFunction( opt.old ) ) {
      opt.old.call( this );
    }

    if ( opt.queue ) {
      jQuery.dequeue( this, opt.queue );
    }
  };

  return opt;
};

jQuery.easing = {
  linear: function( p ) {
    return p;
  },
  swing: function( p ) {
    return 0.5 - Math.cos( p*Math.PI ) / 2;
  }
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
  var timer,
    timers = jQuery.timers,
    i = 0;

  fxNow = jQuery.now();

  for ( ; i < timers.length; i++ ) {
    timer = timers[ i ];
    // Checks the timer has not already been removed
    if ( !timer() && timers[ i ] === timer ) {
      timers.splice( i--, 1 );
    }
  }

  if ( !timers.length ) {
    jQuery.fx.stop();
  }
  fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
  if ( timer() && jQuery.timers.push( timer ) ) {
    jQuery.fx.start();
  }
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
  if ( !timerId ) {
    timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
  }
};

jQuery.fx.stop = function() {
  clearInterval( timerId );
  timerId = null;
};

jQuery.fx.speeds = {
  slow: 600,
  fast: 200,
  // Default speed
  _default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
  jQuery.expr.filters.animated = function( elem ) {
    return jQuery.grep(jQuery.timers, function( fn ) {
      return elem === fn.elem;
    }).length;
  };
}
jQuery.fn.offset = function( options ) {
  if ( arguments.length ) {
    return options === undefined ?
      this :
      this.each(function( i ) {
        jQuery.offset.setOffset( this, options, i );
      });
  }

  var docElem, win,
    elem = this[ 0 ],
    box = { top: 0, left: 0 },
    doc = elem && elem.ownerDocument;

  if ( !doc ) {
    return;
  }

  docElem = doc.documentElement;

  // Make sure it's not a disconnected DOM node
  if ( !jQuery.contains( docElem, elem ) ) {
    return box;
  }

  // If we don't have gBCR, just use 0,0 rather than error
  // BlackBerry 5, iOS 3 (original iPhone)
  if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
    box = elem.getBoundingClientRect();
  }
  win = getWindow( doc );
  return {
    top: box.top + win.pageYOffset - docElem.clientTop,
    left: box.left + win.pageXOffset - docElem.clientLeft
  };
};

jQuery.offset = {

  setOffset: function( elem, options, i ) {
    var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
      position = jQuery.css( elem, "position" ),
      curElem = jQuery( elem ),
      props = {};

    // Set position first, in-case top/left are set even on static elem
    if ( position === "static" ) {
      elem.style.position = "relative";
    }

    curOffset = curElem.offset();
    curCSSTop = jQuery.css( elem, "top" );
    curCSSLeft = jQuery.css( elem, "left" );
    calculatePosition = ( position === "absolute" || position === "fixed" ) && ( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

    // Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
    if ( calculatePosition ) {
      curPosition = curElem.position();
      curTop = curPosition.top;
      curLeft = curPosition.left;

    } else {
      curTop = parseFloat( curCSSTop ) || 0;
      curLeft = parseFloat( curCSSLeft ) || 0;
    }

    if ( jQuery.isFunction( options ) ) {
      options = options.call( elem, i, curOffset );
    }

    if ( options.top != null ) {
      props.top = ( options.top - curOffset.top ) + curTop;
    }
    if ( options.left != null ) {
      props.left = ( options.left - curOffset.left ) + curLeft;
    }

    if ( "using" in options ) {
      options.using.call( elem, props );

    } else {
      curElem.css( props );
    }
  }
};


jQuery.fn.extend({

  position: function() {
    if ( !this[ 0 ] ) {
      return;
    }

    var offsetParent, offset,
      elem = this[ 0 ],
      parentOffset = { top: 0, left: 0 };

    // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
    if ( jQuery.css( elem, "position" ) === "fixed" ) {
      // We assume that getBoundingClientRect is available when computed position is fixed
      offset = elem.getBoundingClientRect();

    } else {
      // Get *real* offsetParent
      offsetParent = this.offsetParent();

      // Get correct offsets
      offset = this.offset();
      if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
        parentOffset = offsetParent.offset();
      }

      // Add offsetParent borders
      parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
      parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
    }

    // Subtract parent offsets and element margins
    return {
      top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
      left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
    };
  },

  offsetParent: function() {
    return this.map(function() {
      var offsetParent = this.offsetParent || docElem;

      while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
        offsetParent = offsetParent.offsetParent;
      }

      return offsetParent || docElem;
    });
  }
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
  var top = "pageYOffset" === prop;

  jQuery.fn[ method ] = function( val ) {
    return jQuery.access( this, function( elem, method, val ) {
      var win = getWindow( elem );

      if ( val === undefined ) {
        return win ? win[ prop ] : elem[ method ];
      }

      if ( win ) {
        win.scrollTo(
          !top ? val : window.pageXOffset,
          top ? val : window.pageYOffset
        );

      } else {
        elem[ method ] = val;
      }
    }, method, val, arguments.length, null );
  };
});

function getWindow( elem ) {
  return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
  jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
    // margin is only for outerHeight, outerWidth
    jQuery.fn[ funcName ] = function( margin, value ) {
      var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
        extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

      return jQuery.access( this, function( elem, type, value ) {
        var doc;

        if ( jQuery.isWindow( elem ) ) {
          // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
          // isn't a whole lot we can do. See pull request at this URL for discussion:
          // https://github.com/jquery/jquery/pull/764
          return elem.document.documentElement[ "client" + name ];
        }

        // Get document width or height
        if ( elem.nodeType === 9 ) {
          doc = elem.documentElement;

          // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
          // whichever is greatest
          return Math.max(
            elem.body[ "scroll" + name ], doc[ "scroll" + name ],
            elem.body[ "offset" + name ], doc[ "offset" + name ],
            doc[ "client" + name ]
          );
        }

        return value === undefined ?
          // Get width or height on the element, requesting but not forcing parseFloat
          jQuery.css( elem, type, extra ) :

          // Set width or height on the element
          jQuery.style( elem, type, value, extra );
      }, type, chainable ? margin : undefined, chainable, null );
    };
  });
});
// Limit scope pollution from any deprecated API
// (function() {

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
  return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;

// })();
if ( typeof module === "object" && module && typeof module.exports === "object" ) {
  // Expose jQuery as module.exports in loaders that implement the Node
  // module pattern (including browserify). Do not create the global, since
  // the user will be storing it themselves locally, and globals are frowned
  // upon in the Node module world.
  module.exports = jQuery;
} else {
  // Register as a named AMD module, since jQuery can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase jquery is used because AMD module names are
  // derived from file names, and jQuery is normally delivered in a lowercase
  // file name. Do this after creating the global so that if an AMD module wants
  // to call noConflict to hide this version of jQuery, it will work.
  if ( typeof define === "function" && define.amd ) {
    define( "jquery", [], function () { return jQuery; } );
  }
}

// If there is a window object, that at least has a document property,
// define jQuery and $ identifiers
if ( typeof window === "object" && typeof window.document === "object" ) {
  window.jQuery = window.$ = jQuery;
}

})( window );
/*
 * jQuery JSONP Core Plugin 2.4.0 (2012-08-21)
 *
 * https://github.com/jaubourg/jquery-jsonp
 *
 * Copyright (c) 2012 Julian Aubourg
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 */

( function( $ ) {

	// ###################### UTILITIES ##

	// Noop
	function noop() {
	}

	// Generic callback
	function genericCallback( data ) {
		lastValue = [ data ];
	}

	// Call if defined
	function callIfDefined( method , object , parameters ) {
		return method && method.apply && method.apply( object.context || object , parameters );
	}

	// Give joining character given url
	function qMarkOrAmp( url ) {
		return /\?/ .test( url ) ? "&" : "?";
	}

	var // String constants (for better minification)
		STR_ASYNC = "async",
		STR_CHARSET = "charset",
		STR_EMPTY = "",
		STR_ERROR = "error",
		STR_INSERT_BEFORE = "insertBefore",
		STR_JQUERY_JSONP = "_jqjsp",
		STR_ON = "on",
		STR_ON_CLICK = STR_ON + "click",
		STR_ON_ERROR = STR_ON + STR_ERROR,
		STR_ON_LOAD = STR_ON + "load",
		STR_ON_READY_STATE_CHANGE = STR_ON + "readystatechange",
		STR_READY_STATE = "readyState",
		STR_REMOVE_CHILD = "removeChild",
		STR_SCRIPT_TAG = "<script>",
		STR_SUCCESS = "success",
		STR_TIMEOUT = "timeout",

		// Window
		win = window,
		// Deferred
		Deferred = $.Deferred,
		// Head element
		head = $( "head" )[ 0 ] || document.documentElement,
		// Page cache
		pageCache = {},
		// Counter
		count = 0,
		// Last returned value
		lastValue,

		// ###################### DEFAULT OPTIONS ##
		xOptionsDefaults = {
			//beforeSend: undefined,
			//cache: false,
			callback: STR_JQUERY_JSONP,
			//callbackParameter: undefined,
			//charset: undefined,
			//complete: undefined,
			//context: undefined,
			//data: "",
			//dataFilter: undefined,
			//error: undefined,
			//pageCache: false,
			//success: undefined,
			//timeout: 0,
			//traditional: false,
			url: location.href
		},

		// opera demands sniffing :/
		opera = win.opera,

		// IE < 10
		oldIE = !!$( "<div>" ).html( "<!--[if IE]><i><![endif]-->" ).find("i").length;

	// ###################### MAIN FUNCTION ##
	function jsonp( xOptions ) {

		// Build data with default
		xOptions = $.extend( {} , xOptionsDefaults , xOptions );

		// References to xOptions members (for better minification)
		var successCallback = xOptions.success,
			errorCallback = xOptions.error,
			completeCallback = xOptions.complete,
			dataFilter = xOptions.dataFilter,
			callbackParameter = xOptions.callbackParameter,
			successCallbackName = xOptions.callback,
			cacheFlag = xOptions.cache,
			pageCacheFlag = xOptions.pageCache,
			charset = xOptions.charset,
			url = xOptions.url,
			data = xOptions.data,
			timeout = xOptions.timeout,
			pageCached,

			// Abort/done flag
			done = 0,

			// Life-cycle functions
			cleanUp = noop,

			// Support vars
			supportOnload,
			supportOnreadystatechange,

			// Request execution vars
			firstChild,
			script,
			scriptAfter,
			timeoutTimer;

		// If we have Deferreds:
		// - substitute callbacks
		// - promote xOptions to a promise
		Deferred && Deferred(function( defer ) {
			defer.done( successCallback ).fail( errorCallback );
			successCallback = defer.resolve;
			errorCallback = defer.reject;
		}).promise( xOptions );

		// Create the abort method
		xOptions.abort = function() {
			!( done++ ) && cleanUp();
		};

		// Call beforeSend if provided (early abort if false returned)
		if ( callIfDefined( xOptions.beforeSend , xOptions , [ xOptions ] ) === !1 || done ) {
			return xOptions;
		}

		// Control entries
		url = url || STR_EMPTY;
		data = data ? ( (typeof data) == "string" ? data : $.param( data , xOptions.traditional ) ) : STR_EMPTY;

		// Build final url
		url += data ? ( qMarkOrAmp( url ) + data ) : STR_EMPTY;

		// Add callback parameter if provided as option
		callbackParameter && ( url += qMarkOrAmp( url ) + encodeURIComponent( callbackParameter ) + "=?" );

		// Add anticache parameter if needed
		!cacheFlag && !pageCacheFlag && ( url += qMarkOrAmp( url ) + "_" + ( new Date() ).getTime() + "=" );

		// Replace last ? by callback parameter
		url = url.replace( /=\?(&|$)/ , "=" + successCallbackName + "$1" );

		// Success notifier
		function notifySuccess( json ) {

			if ( !( done++ ) ) {

				cleanUp();
				// Pagecache if needed
				pageCacheFlag && ( pageCache [ url ] = { s: [ json ] } );
				// Apply the data filter if provided
				dataFilter && ( json = dataFilter.apply( xOptions , [ json ] ) );
				// Call success then complete
				callIfDefined( successCallback , xOptions , [ json , STR_SUCCESS, xOptions ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , STR_SUCCESS ] );

			}
		}

		// Error notifier
		function notifyError( type ) {

			if ( !( done++ ) ) {

				// Clean up
				cleanUp();
				// If pure error (not timeout), cache if needed
				pageCacheFlag && type != STR_TIMEOUT && ( pageCache[ url ] = type );
				// Call error then complete
				callIfDefined( errorCallback , xOptions , [ xOptions , type ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , type ] );

			}
		}

		// Check page cache
		if ( pageCacheFlag && ( pageCached = pageCache[ url ] ) ) {

			pageCached.s ? notifySuccess( pageCached.s[ 0 ] ) : notifyError( pageCached );

		} else {

			// Install the generic callback
			// (BEWARE: global namespace pollution ahoy)
			win[ successCallbackName ] = genericCallback;

			// Create the script tag
			script = $( STR_SCRIPT_TAG )[ 0 ];
			script.id = STR_JQUERY_JSONP + count++;

			// Set charset if provided
			if ( charset ) {
				script[ STR_CHARSET ] = charset;
			}

			opera && opera.version() < 11.60 ?
				// onerror is not supported: do not set as async and assume in-order execution.
				// Add a trailing script to emulate the event
				( ( scriptAfter = $( STR_SCRIPT_TAG )[ 0 ] ).text = "document.getElementById('" + script.id + "')." + STR_ON_ERROR + "()" )
			:
				// onerror is supported: set the script as async to avoid requests blocking each others
				( script[ STR_ASYNC ] = STR_ASYNC )

			;

			// Internet Explorer: event/htmlFor trick
			if ( oldIE ) {
				script.htmlFor = script.id;
				script.event = STR_ON_CLICK;
			}

			// Attached event handlers
			script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = script[ STR_ON_READY_STATE_CHANGE ] = function ( result ) {

				// Test readyState if it exists
				if ( !script[ STR_READY_STATE ] || !/i/.test( script[ STR_READY_STATE ] ) ) {

					try {

						script[ STR_ON_CLICK ] && script[ STR_ON_CLICK ]();

					} catch( _ ) {}

					result = lastValue;
					lastValue = 0;
					result ? notifySuccess( result[ 0 ] ) : notifyError( STR_ERROR );

				}
			};

			// Set source
			script.src = url;

			// Re-declare cleanUp function
			cleanUp = function( i ) {
				timeoutTimer && clearTimeout( timeoutTimer );
				script[ STR_ON_READY_STATE_CHANGE ] = script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = null;
				head[ STR_REMOVE_CHILD ]( script );
				scriptAfter && head[ STR_REMOVE_CHILD ]( scriptAfter );
			};

			// Append main script
			head[ STR_INSERT_BEFORE ]( script , ( firstChild = head.firstChild ) );

			// Append trailing script if needed
			scriptAfter && head[ STR_INSERT_BEFORE ]( scriptAfter , firstChild );

			// If a timeout is needed, install it
			timeoutTimer = timeout > 0 && setTimeout( function() {
				notifyError( STR_TIMEOUT );
			} , timeout );

		}

		return xOptions;
	}

	// ###################### SETUP FUNCTION ##
	jsonp.setup = function( xOptions ) {
		$.extend( xOptionsDefaults , xOptions );
	};

	// ###################### INSTALL in jQuery ##
	$.jsonp = jsonp;

} )( jQuery );
(function($){

  /**
   * Copyright 2012, Digital Fusion
   * Licensed under the MIT license.
   * http://teamdf.com/jquery-plugins/license/
   *
   * @author Sam Sehnert
   * @desc A small plugin that checks whether elements are within
   *                 the user visible viewport of a web browser.
   *                 only accounts for vertical position, not horizontal.
   */
  $.fn.visible = function(partial,hidden){
      
    var $t             = $(this).eq(0),
        t              = $t.get(0),
        $w             = $(window),
        viewTop        = $w.scrollTop(),
        viewBottom     = viewTop + $w.height(),
        _top           = $t.offset().top,
        _bottom        = _top + $t.height(),
        compareTop     = partial === true ? _bottom : _top,
        compareBottom  = partial === true ? _top : _bottom,
        clientSize     = hidden === true ? t.offsetWidth * t.offsetHeight : true;
      
      return !!clientSize && ((compareBottom <= viewBottom) && (compareTop >= viewTop));
  };
  
})(jQuery);
/* Javascript plotting library for jQuery, version 0.8.2.

Copyright (c) 2007-2013 IOLA and Ole Laursen.
Licensed under the MIT license.

*/

// first an inline dependency, jquery.colorhelpers.js, we inline it here
// for convenience

/* Plugin for jQuery for working with colors.
 *
 * Version 1.1.
 *
 * Inspiration from jQuery color animation plugin by John Resig.
 *
 * Released under the MIT license by Ole Laursen, October 2009.
 *
 * Examples:
 *
 *   $.color.parse("#fff").scale('rgb', 0.25).add('a', -0.5).toString()
 *   var c = $.color.extract($("#mydiv"), 'background-color');
 *   console.log(c.r, c.g, c.b, c.a);
 *   $.color.make(100, 50, 25, 0.4).toString() // returns "rgba(100,50,25,0.4)"
 *
 * Note that .scale() and .add() return the same modified object
 * instead of making a new one.
 *
 * V. 1.1: Fix error handling so e.g. parsing an empty string does
 * produce a color rather than just crashing.
 */

(function($){$.color={};$.color.make=function(r,g,b,a){var o={};o.r=r||0;o.g=g||0;o.b=b||0;o.a=a!=null?a:1;o.add=function(c,d){for(var i=0;i<c.length;++i)o[c.charAt(i)]+=d;return o.normalize()};o.scale=function(c,f){for(var i=0;i<c.length;++i)o[c.charAt(i)]*=f;return o.normalize()};o.toString=function(){if(o.a>=1){return"rgb("+[o.r,o.g,o.b].join(",")+")"}else{return"rgba("+[o.r,o.g,o.b,o.a].join(",")+")"}};o.normalize=function(){function clamp(min,value,max){return value<min?min:value>max?max:value}o.r=clamp(0,parseInt(o.r),255);o.g=clamp(0,parseInt(o.g),255);o.b=clamp(0,parseInt(o.b),255);o.a=clamp(0,o.a,1);return o};o.clone=function(){return $.color.make(o.r,o.b,o.g,o.a)};return o.normalize()};$.color.extract=function(elem,css){var c;do{c=elem.css(css).toLowerCase();if(c!=""&&c!="transparent")break;elem=elem.parent()}while(elem.length&&!$.nodeName(elem.get(0),"body"));if(c=="rgba(0, 0, 0, 0)")c="transparent";return $.color.parse(c)};$.color.parse=function(str){var res,m=$.color.make;if(res=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10));if(res=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10),parseFloat(res[4]));if(res=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55);if(res=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55,parseFloat(res[4]));if(res=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str))return m(parseInt(res[1],16),parseInt(res[2],16),parseInt(res[3],16));if(res=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str))return m(parseInt(res[1]+res[1],16),parseInt(res[2]+res[2],16),parseInt(res[3]+res[3],16));var name=$.trim(str).toLowerCase();if(name=="transparent")return m(255,255,255,0);else{res=lookupColors[name]||[0,0,0];return m(res[0],res[1],res[2])}};var lookupColors={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);

// the actual Flot code
(function($) {

	// Cache the prototype hasOwnProperty for faster access

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	///////////////////////////////////////////////////////////////////////////
	// The Canvas object is a wrapper around an HTML5 <canvas> tag.
	//
	// @constructor
	// @param {string} cls List of classes to apply to the canvas.
	// @param {element} container Element onto which to append the canvas.
	//
	// Requiring a container is a little iffy, but unfortunately canvas
	// operations don't work unless the canvas is attached to the DOM.

	function Canvas(cls, container) {

		var element = container.children("." + cls)[0];

		if (element == null) {

			element = document.createElement("canvas");
			element.className = cls;

			$(element).css({ direction: "ltr", position: "absolute", left: 0, top: 0 })
				.appendTo(container);

			// If HTML5 Canvas isn't available, fall back to [Ex|Flash]canvas

			if (!element.getContext) {
				if (window.G_vmlCanvasManager) {
					element = window.G_vmlCanvasManager.initElement(element);
				} else {
					throw new Error("Canvas is not available. If you're using IE with a fall-back such as Excanvas, then there's either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.");
				}
			}
		}

		this.element = element;

		var context = this.context = element.getContext("2d");

		// Determine the screen's ratio of physical to device-independent
		// pixels.  This is the ratio between the canvas width that the browser
		// advertises and the number of pixels actually present in that space.

		// The iPhone 4, for example, has a device-independent width of 320px,
		// but its screen is actually 640px wide.  It therefore has a pixel
		// ratio of 2, while most normal devices have a ratio of 1.

		var devicePixelRatio = window.devicePixelRatio || 1,
			backingStoreRatio =
				context.webkitBackingStorePixelRatio ||
				context.mozBackingStorePixelRatio ||
				context.msBackingStorePixelRatio ||
				context.oBackingStorePixelRatio ||
				context.backingStorePixelRatio || 1;

		this.pixelRatio = devicePixelRatio / backingStoreRatio;

		// Size the canvas to match the internal dimensions of its container

		this.resize(container.width(), container.height());

		// Collection of HTML div layers for text overlaid onto the canvas

		this.textContainer = null;
		this.text = {};

		// Cache of text fragments and metrics, so we can avoid expensively
		// re-calculating them when the plot is re-rendered in a loop.

		this._textCache = {};
	}

	// Resizes the canvas to the given dimensions.
	//
	// @param {number} width New width of the canvas, in pixels.
	// @param {number} width New height of the canvas, in pixels.

	Canvas.prototype.resize = function(width, height) {

		if (width <= 0 || height <= 0) {
			throw new Error("Invalid dimensions for plot, width = " + width + ", height = " + height);
		}

		var element = this.element,
			context = this.context,
			pixelRatio = this.pixelRatio;

		// Resize the canvas, increasing its density based on the display's
		// pixel ratio; basically giving it more pixels without increasing the
		// size of its element, to take advantage of the fact that retina
		// displays have that many more pixels in the same advertised space.

		// Resizing should reset the state (excanvas seems to be buggy though)

		if (this.width != width) {
			element.width = width * pixelRatio;
			element.style.width = width + "px";
			this.width = width;
		}

		if (this.height != height) {
			element.height = height * pixelRatio;
			element.style.height = height + "px";
			this.height = height;
		}

		// Save the context, so we can reset in case we get replotted.  The
		// restore ensure that we're really back at the initial state, and
		// should be safe even if we haven't saved the initial state yet.

		context.restore();
		context.save();

		// Scale the coordinate space to match the display density; so even though we
		// may have twice as many pixels, we still want lines and other drawing to
		// appear at the same size; the extra pixels will just make them crisper.

		context.scale(pixelRatio, pixelRatio);
	};

	// Clears the entire canvas area, not including any overlaid HTML text

	Canvas.prototype.clear = function() {
		this.context.clearRect(0, 0, this.width, this.height);
	};

	// Finishes rendering the canvas, including managing the text overlay.

	Canvas.prototype.render = function() {

		var cache = this._textCache;

		// For each text layer, add elements marked as active that haven't
		// already been rendered, and remove those that are no longer active.

		for (var layerKey in cache) {
			if (hasOwnProperty.call(cache, layerKey)) {

				var layer = this.getTextLayer(layerKey),
					layerCache = cache[layerKey];

				layer.hide();

				for (var styleKey in layerCache) {
					if (hasOwnProperty.call(layerCache, styleKey)) {
						var styleCache = layerCache[styleKey];
						for (var key in styleCache) {
							if (hasOwnProperty.call(styleCache, key)) {

								var positions = styleCache[key].positions;

								for (var i = 0, position; position = positions[i]; i++) {
									if (position.active) {
										if (!position.rendered) {
											layer.append(position.element);
											position.rendered = true;
										}
									} else {
										positions.splice(i--, 1);
										if (position.rendered) {
											position.element.detach();
										}
									}
								}

								if (positions.length == 0) {
									delete styleCache[key];
								}
							}
						}
					}
				}

				layer.show();
			}
		}
	};

	// Creates (if necessary) and returns the text overlay container.
	//
	// @param {string} classes String of space-separated CSS classes used to
	//     uniquely identify the text layer.
	// @return {object} The jQuery-wrapped text-layer div.

	Canvas.prototype.getTextLayer = function(classes) {

		var layer = this.text[classes];

		// Create the text layer if it doesn't exist

		if (layer == null) {

			// Create the text layer container, if it doesn't exist

			if (this.textContainer == null) {
				this.textContainer = $("<div class='flot-text'></div>")
					.css({
						position: "absolute",
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
						'font-size': "smaller",
						color: "#545454"
					})
					.insertAfter(this.element);
			}

			layer = this.text[classes] = $("<div></div>")
				.addClass(classes)
				.css({
					position: "absolute",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0
				})
				.appendTo(this.textContainer);
		}

		return layer;
	};

	// Creates (if necessary) and returns a text info object.
	//
	// The object looks like this:
	//
	// {
	//     width: Width of the text's wrapper div.
	//     height: Height of the text's wrapper div.
	//     element: The jQuery-wrapped HTML div containing the text.
	//     positions: Array of positions at which this text is drawn.
	// }
	//
	// The positions array contains objects that look like this:
	//
	// {
	//     active: Flag indicating whether the text should be visible.
	//     rendered: Flag indicating whether the text is currently visible.
	//     element: The jQuery-wrapped HTML div containing the text.
	//     x: X coordinate at which to draw the text.
	//     y: Y coordinate at which to draw the text.
	// }
	//
	// Each position after the first receives a clone of the original element.
	//
	// The idea is that that the width, height, and general 'identity' of the
	// text is constant no matter where it is placed; the placements are a
	// secondary property.
	//
	// Canvas maintains a cache of recently-used text info objects; getTextInfo
	// either returns the cached element or creates a new entry.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {string} text Text string to retrieve info for.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which to rotate the text, in degrees.
	//     Angle is currently unused, it will be implemented in the future.
	// @param {number=} width Maximum width of the text before it wraps.
	// @return {object} a text info object.

	Canvas.prototype.getTextInfo = function(layer, text, font, angle, width) {

		var textStyle, layerCache, styleCache, info;

		// Cast the value to a string, in case we were given a number or such

		text = "" + text;

		// If the font is a font-spec object, generate a CSS font definition

		if (typeof font === "object") {
			textStyle = font.style + " " + font.variant + " " + font.weight + " " + font.size + "px/" + font.lineHeight + "px " + font.family;
		} else {
			textStyle = font;
		}

		// Retrieve (or create) the cache for the text's layer and styles

		layerCache = this._textCache[layer];

		if (layerCache == null) {
			layerCache = this._textCache[layer] = {};
		}

		styleCache = layerCache[textStyle];

		if (styleCache == null) {
			styleCache = layerCache[textStyle] = {};
		}

		info = styleCache[text];

		// If we can't find a matching element in our cache, create a new one

		if (info == null) {

			var element = $("<div></div>").html(text)
				.css({
					position: "absolute",
					'max-width': width,
					top: -9999
				})
				.appendTo(this.getTextLayer(layer));

			if (typeof font === "object") {
				element.css({
					font: textStyle,
					color: font.color
				});
			} else if (typeof font === "string") {
				element.addClass(font);
			}

			info = styleCache[text] = {
				width: element.outerWidth(true),
				height: element.outerHeight(true),
				element: element,
				positions: []
			};

			element.detach();
		}

		return info;
	};

	// Adds a text string to the canvas text overlay.
	//
	// The text isn't drawn immediately; it is marked as rendering, which will
	// result in its addition to the canvas on the next render pass.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {number} x X coordinate at which to draw the text.
	// @param {number} y Y coordinate at which to draw the text.
	// @param {string} text Text string to draw.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which to rotate the text, in degrees.
	//     Angle is currently unused, it will be implemented in the future.
	// @param {number=} width Maximum width of the text before it wraps.
	// @param {string=} halign Horizontal alignment of the text; either "left",
	//     "center" or "right".
	// @param {string=} valign Vertical alignment of the text; either "top",
	//     "middle" or "bottom".

	Canvas.prototype.addText = function(layer, x, y, text, font, angle, width, halign, valign) {

		var info = this.getTextInfo(layer, text, font, angle, width),
			positions = info.positions;

		// Tweak the div's position to match the text's alignment

		if (halign == "center") {
			x -= info.width / 2;
		} else if (halign == "right") {
			x -= info.width;
		}

		if (valign == "middle") {
			y -= info.height / 2;
		} else if (valign == "bottom") {
			y -= info.height;
		}

		// Determine whether this text already exists at this position.
		// If so, mark it for inclusion in the next render pass.

		for (var i = 0, position; position = positions[i]; i++) {
			if (position.x == x && position.y == y) {
				position.active = true;
				return;
			}
		}

		// If the text doesn't exist at this position, create a new entry

		// For the very first position we'll re-use the original element,
		// while for subsequent ones we'll clone it.

		position = {
			active: true,
			rendered: false,
			element: positions.length ? info.element.clone() : info.element,
			x: x,
			y: y
		};

		positions.push(position);

		// Move the element to its final position within the container

		position.element.css({
			top: Math.round(y),
			left: Math.round(x),
			'text-align': halign	// In case the text wraps
		});
	};

	// Removes one or more text strings from the canvas text overlay.
	//
	// If no parameters are given, all text within the layer is removed.
	//
	// Note that the text is not immediately removed; it is simply marked as
	// inactive, which will result in its removal on the next render pass.
	// This avoids the performance penalty for 'clear and redraw' behavior,
	// where we potentially get rid of all text on a layer, but will likely
	// add back most or all of it later, as when redrawing axes, for example.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {number=} x X coordinate of the text.
	// @param {number=} y Y coordinate of the text.
	// @param {string=} text Text string to remove.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which the text is rotated, in degrees.
	//     Angle is currently unused, it will be implemented in the future.

	Canvas.prototype.removeText = function(layer, x, y, text, font, angle) {
		if (text == null) {
			var layerCache = this._textCache[layer];
			if (layerCache != null) {
				for (var styleKey in layerCache) {
					if (hasOwnProperty.call(layerCache, styleKey)) {
						var styleCache = layerCache[styleKey];
						for (var key in styleCache) {
							if (hasOwnProperty.call(styleCache, key)) {
								var positions = styleCache[key].positions;
								for (var i = 0, position; position = positions[i]; i++) {
									position.active = false;
								}
							}
						}
					}
				}
			}
		} else {
			var positions = this.getTextInfo(layer, text, font, angle).positions;
			for (var i = 0, position; position = positions[i]; i++) {
				if (position.x == x && position.y == y) {
					position.active = false;
				}
			}
		}
	};

	///////////////////////////////////////////////////////////////////////////
	// The top-level container for the entire plot.

    function Plot(placeholder, data_, options_, plugins) {
        // data is on the form:
        //   [ series1, series2 ... ]
        // where series is either just the data as [ [x1, y1], [x2, y2], ... ]
        // or { data: [ [x1, y1], [x2, y2], ... ], label: "some label", ... }

        var series = [],
            options = {
                // the color theme used for graphs
                colors: ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"],
                legend: {
                    show: true,
                    noColumns: 1, // number of colums in legend table
                    labelFormatter: null, // fn: string -> string
                    labelBoxBorderColor: "#ccc", // border color for the little label boxes
                    container: null, // container (as jQuery object) to put legend in, null means default on top of graph
                    position: "ne", // position of default legend container within plot
                    margin: 5, // distance from grid edge to default legend container within plot
                    backgroundColor: null, // null means auto-detect
                    backgroundOpacity: 0.85, // set to 0 to avoid background
                    sorted: null    // default to no legend sorting
                },
                xaxis: {
                    show: null, // null = auto-detect, true = always, false = never
                    position: "bottom", // or "top"
                    mode: null, // null or "time"
                    font: null, // null (derived from CSS in placeholder) or object like { size: 11, lineHeight: 13, style: "italic", weight: "bold", family: "sans-serif", variant: "small-caps" }
                    color: null, // base color, labels, ticks
                    tickColor: null, // possibly different color of ticks, e.g. "rgba(0,0,0,0.15)"
                    transform: null, // null or f: number -> number to transform axis
                    inverseTransform: null, // if transform is set, this should be the inverse function
                    min: null, // min. value to show, null means set automatically
                    max: null, // max. value to show, null means set automatically
                    autoscaleMargin: null, // margin in % to add if auto-setting min/max
                    ticks: null, // either [1, 3] or [[1, "a"], 3] or (fn: axis info -> ticks) or app. number of ticks for auto-ticks
                    tickFormatter: null, // fn: number -> string
                    labelWidth: null, // size of tick labels in pixels
                    labelHeight: null,
                    reserveSpace: null, // whether to reserve space even if axis isn't shown
                    tickLength: null, // size in pixels of ticks, or "full" for whole line
                    alignTicksWithAxis: null, // axis number or null for no sync
                    tickDecimals: null, // no. of decimals, null means auto
                    tickSize: null, // number or [number, "unit"]
                    minTickSize: null // number or [number, "unit"]
                },
                yaxis: {
                    autoscaleMargin: 0.02,
                    position: "left" // or "right"
                },
                xaxes: [],
                yaxes: [],
                series: {
                    points: {
                        show: false,
                        radius: 3,
                        lineWidth: 2, // in pixels
                        fill: true,
                        fillColor: "#ffffff",
                        symbol: "circle" // or callback
                    },
                    lines: {
                        // we don't put in show: false so we can see
                        // whether lines were actively disabled
                        lineWidth: 2, // in pixels
                        fill: false,
                        fillColor: null,
                        steps: false
                        // Omit 'zero', so we can later default its value to
                        // match that of the 'fill' option.
                    },
                    bars: {
                        show: false,
                        lineWidth: 2, // in pixels
                        barWidth: 1, // in units of the x axis
                        fill: true,
                        fillColor: null,
                        align: "left", // "left", "right", or "center"
                        horizontal: false,
                        zero: true
                    },
                    shadowSize: 3,
                    highlightColor: null
                },
                grid: {
                    show: true,
                    aboveData: false,
                    color: "#545454", // primary color used for outline and labels
                    backgroundColor: null, // null for transparent, else color
                    borderColor: null, // set if different from the grid color
                    tickColor: null, // color for the ticks, e.g. "rgba(0,0,0,0.15)"
                    margin: 0, // distance from the canvas edge to the grid
                    labelMargin: 5, // in pixels
                    axisMargin: 8, // in pixels
                    borderWidth: 2, // in pixels
                    minBorderMargin: null, // in pixels, null means taken from points radius
                    markings: null, // array of ranges or fn: axes -> array of ranges
                    markingsColor: "#f4f4f4",
                    markingsLineWidth: 2,
                    // interactive stuff
                    clickable: false,
                    hoverable: false,
                    autoHighlight: true, // highlight in case mouse is near
                    mouseActiveRadius: 10 // how far the mouse can be away to activate an item
                },
                interaction: {
                    redrawOverlayInterval: 1000/60 // time between updates, -1 means in same flow
                },
                hooks: {}
            },
        surface = null,     // the canvas for the plot itself
        overlay = null,     // canvas for interactive stuff on top of plot
        eventHolder = null, // jQuery object that events should be bound to
        ctx = null, octx = null,
        xaxes = [], yaxes = [],
        plotOffset = { left: 0, right: 0, top: 0, bottom: 0},
        plotWidth = 0, plotHeight = 0,
        hooks = {
            processOptions: [],
            processRawData: [],
            processDatapoints: [],
            processOffset: [],
            drawBackground: [],
            drawSeries: [],
            draw: [],
            bindEvents: [],
            drawOverlay: [],
            shutdown: []
        },
        plot = this;

        // public functions
        plot.setData = setData;
        plot.setupGrid = setupGrid;
        plot.draw = draw;
        plot.getPlaceholder = function() { return placeholder; };
        plot.getCanvas = function() { return surface.element; };
        plot.getPlotOffset = function() { return plotOffset; };
        plot.width = function () { return plotWidth; };
        plot.height = function () { return plotHeight; };
        plot.offset = function () {
            var o = eventHolder.offset();
            o.left += plotOffset.left;
            o.top += plotOffset.top;
            return o;
        };
        plot.getData = function () { return series; };
        plot.getAxes = function () {
            var res = {}, i;
            $.each(xaxes.concat(yaxes), function (_, axis) {
                if (axis)
                    res[axis.direction + (axis.n != 1 ? axis.n : "") + "axis"] = axis;
            });
            return res;
        };
        plot.getXAxes = function () { return xaxes; };
        plot.getYAxes = function () { return yaxes; };
        plot.c2p = canvasToAxisCoords;
        plot.p2c = axisToCanvasCoords;
        plot.getOptions = function () { return options; };
        plot.highlight = highlight;
        plot.unhighlight = unhighlight;
        plot.triggerRedrawOverlay = triggerRedrawOverlay;
        plot.pointOffset = function(point) {
            return {
                left: parseInt(xaxes[axisNumber(point, "x") - 1].p2c(+point.x) + plotOffset.left, 10),
                top: parseInt(yaxes[axisNumber(point, "y") - 1].p2c(+point.y) + plotOffset.top, 10)
            };
        };
        plot.shutdown = shutdown;
        plot.destroy = function () {
            shutdown();
            placeholder.removeData("plot").empty();

            series = [];
            options = null;
            surface = null;
            overlay = null;
            eventHolder = null;
            ctx = null;
            octx = null;
            xaxes = [];
            yaxes = [];
            hooks = null;
            highlights = [];
            plot = null;
        };
        plot.resize = function () {
        	var width = placeholder.width(),
        		height = placeholder.height();
            surface.resize(width, height);
            overlay.resize(width, height);
        };

        // public attributes
        plot.hooks = hooks;

        // initialize
        initPlugins(plot);
        parseOptions(options_);
        setupCanvases();
        setData(data_);
        setupGrid();
        draw();
        bindEvents();


        function executeHooks(hook, args) {
            args = [plot].concat(args);
            for (var i = 0; i < hook.length; ++i)
                hook[i].apply(this, args);
        }

        function initPlugins() {

            // References to key classes, allowing plugins to modify them

            var classes = {
                Canvas: Canvas
            };

            for (var i = 0; i < plugins.length; ++i) {
                var p = plugins[i];
                p.init(plot, classes);
                if (p.options)
                    $.extend(true, options, p.options);
            }
        }

        function parseOptions(opts) {

            $.extend(true, options, opts);

            // $.extend merges arrays, rather than replacing them.  When less
            // colors are provided than the size of the default palette, we
            // end up with those colors plus the remaining defaults, which is
            // not expected behavior; avoid it by replacing them here.

            if (opts && opts.colors) {
            	options.colors = opts.colors;
            }

            if (options.xaxis.color == null)
                options.xaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            if (options.yaxis.color == null)
                options.yaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();

            if (options.xaxis.tickColor == null) // grid.tickColor for back-compatibility
                options.xaxis.tickColor = options.grid.tickColor || options.xaxis.color;
            if (options.yaxis.tickColor == null) // grid.tickColor for back-compatibility
                options.yaxis.tickColor = options.grid.tickColor || options.yaxis.color;

            if (options.grid.borderColor == null)
                options.grid.borderColor = options.grid.color;
            if (options.grid.tickColor == null)
                options.grid.tickColor = $.color.parse(options.grid.color).scale('a', 0.22).toString();

            // Fill in defaults for axis options, including any unspecified
            // font-spec fields, if a font-spec was provided.

            // If no x/y axis options were provided, create one of each anyway,
            // since the rest of the code assumes that they exist.

            var i, axisOptions, axisCount,
                fontSize = placeholder.css("font-size"),
                fontSizeDefault = fontSize ? +fontSize.replace("px", "") : 13,
                fontDefaults = {
                    style: placeholder.css("font-style"),
                    size: Math.round(0.8 * fontSizeDefault),
                    variant: placeholder.css("font-variant"),
                    weight: placeholder.css("font-weight"),
                    family: placeholder.css("font-family")
                };

            axisCount = options.xaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {

                axisOptions = options.xaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.xaxis, axisOptions);
                options.xaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            axisCount = options.yaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {

                axisOptions = options.yaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.yaxis, axisOptions);
                options.yaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            // backwards compatibility, to be removed in future
            if (options.xaxis.noTicks && options.xaxis.ticks == null)
                options.xaxis.ticks = options.xaxis.noTicks;
            if (options.yaxis.noTicks && options.yaxis.ticks == null)
                options.yaxis.ticks = options.yaxis.noTicks;
            if (options.x2axis) {
                options.xaxes[1] = $.extend(true, {}, options.xaxis, options.x2axis);
                options.xaxes[1].position = "top";
            }
            if (options.y2axis) {
                options.yaxes[1] = $.extend(true, {}, options.yaxis, options.y2axis);
                options.yaxes[1].position = "right";
            }
            if (options.grid.coloredAreas)
                options.grid.markings = options.grid.coloredAreas;
            if (options.grid.coloredAreasColor)
                options.grid.markingsColor = options.grid.coloredAreasColor;
            if (options.lines)
                $.extend(true, options.series.lines, options.lines);
            if (options.points)
                $.extend(true, options.series.points, options.points);
            if (options.bars)
                $.extend(true, options.series.bars, options.bars);
            if (options.shadowSize != null)
                options.series.shadowSize = options.shadowSize;
            if (options.highlightColor != null)
                options.series.highlightColor = options.highlightColor;

            // save options on axes for future reference
            for (i = 0; i < options.xaxes.length; ++i)
                getOrCreateAxis(xaxes, i + 1).options = options.xaxes[i];
            for (i = 0; i < options.yaxes.length; ++i)
                getOrCreateAxis(yaxes, i + 1).options = options.yaxes[i];

            // add hooks from options
            for (var n in hooks)
                if (options.hooks[n] && options.hooks[n].length)
                    hooks[n] = hooks[n].concat(options.hooks[n]);

            executeHooks(hooks.processOptions, [options]);
        }

        function setData(d) {
            series = parseData(d);
            fillInSeriesOptions();
            processData();
        }

        function parseData(d) {
            var res = [];
            for (var i = 0; i < d.length; ++i) {
                var s = $.extend(true, {}, options.series);

                if (d[i].data != null) {
                    s.data = d[i].data; // move the data instead of deep-copy
                    delete d[i].data;

                    $.extend(true, s, d[i]);

                    d[i].data = s.data;
                }
                else
                    s.data = d[i];
                res.push(s);
            }

            return res;
        }

        function axisNumber(obj, coord) {
            var a = obj[coord + "axis"];
            if (typeof a == "object") // if we got a real axis, extract number
                a = a.n;
            if (typeof a != "number")
                a = 1; // default to first axis
            return a;
        }

        function allAxes() {
            // return flat array without annoying null entries
            return $.grep(xaxes.concat(yaxes), function (a) { return a; });
        }

        function canvasToAxisCoords(pos) {
            // return an object with x/y corresponding to all used axes
            var res = {}, i, axis;
            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used)
                    res["x" + axis.n] = axis.c2p(pos.left);
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used)
                    res["y" + axis.n] = axis.c2p(pos.top);
            }

            if (res.x1 !== undefined)
                res.x = res.x1;
            if (res.y1 !== undefined)
                res.y = res.y1;

            return res;
        }

        function axisToCanvasCoords(pos) {
            // get canvas coords from the first pair of x/y found in pos
            var res = {}, i, axis, key;

            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used) {
                    key = "x" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "x";

                    if (pos[key] != null) {
                        res.left = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used) {
                    key = "y" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "y";

                    if (pos[key] != null) {
                        res.top = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            return res;
        }

        function getOrCreateAxis(axes, number) {
            if (!axes[number - 1])
                axes[number - 1] = {
                    n: number, // save the number for future reference
                    direction: axes == xaxes ? "x" : "y",
                    options: $.extend(true, {}, axes == xaxes ? options.xaxis : options.yaxis)
                };

            return axes[number - 1];
        }

        function fillInSeriesOptions() {

            var neededColors = series.length, maxIndex = -1, i;

            // Subtract the number of series that already have fixed colors or
            // color indexes from the number that we still need to generate.

            for (i = 0; i < series.length; ++i) {
                var sc = series[i].color;
                if (sc != null) {
                    neededColors--;
                    if (typeof sc == "number" && sc > maxIndex) {
                        maxIndex = sc;
                    }
                }
            }

            // If any of the series have fixed color indexes, then we need to
            // generate at least as many colors as the highest index.

            if (neededColors <= maxIndex) {
                neededColors = maxIndex + 1;
            }

            // Generate all the colors, using first the option colors and then
            // variations on those colors once they're exhausted.

            var c, colors = [], colorPool = options.colors,
                colorPoolSize = colorPool.length, variation = 0;

            for (i = 0; i < neededColors; i++) {

                c = $.color.parse(colorPool[i % colorPoolSize] || "#666");

                // Each time we exhaust the colors in the pool we adjust
                // a scaling factor used to produce more variations on
                // those colors. The factor alternates negative/positive
                // to produce lighter/darker colors.

                // Reset the variation after every few cycles, or else
                // it will end up producing only white or black colors.

                if (i % colorPoolSize == 0 && i) {
                    if (variation >= 0) {
                        if (variation < 0.5) {
                            variation = -variation - 0.2;
                        } else variation = 0;
                    } else variation = -variation;
                }

                colors[i] = c.scale('rgb', 1 + variation);
            }

            // Finalize the series options, filling in their colors

            var colori = 0, s;
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                // assign colors
                if (s.color == null) {
                    s.color = colors[colori].toString();
                    ++colori;
                }
                else if (typeof s.color == "number")
                    s.color = colors[s.color].toString();

                // turn on lines automatically in case nothing is set
                if (s.lines.show == null) {
                    var v, show = true;
                    for (v in s)
                        if (s[v] && s[v].show) {
                            show = false;
                            break;
                        }
                    if (show)
                        s.lines.show = true;
                }

                // If nothing was provided for lines.zero, default it to match
                // lines.fill, since areas by default should extend to zero.

                if (s.lines.zero == null) {
                    s.lines.zero = !!s.lines.fill;
                }

                // setup axes
                s.xaxis = getOrCreateAxis(xaxes, axisNumber(s, "x"));
                s.yaxis = getOrCreateAxis(yaxes, axisNumber(s, "y"));
            }
        }

        function processData() {
            var topSentry = Number.POSITIVE_INFINITY,
                bottomSentry = Number.NEGATIVE_INFINITY,
                fakeInfinity = Number.MAX_VALUE,
                i, j, k, m, length,
                s, points, ps, x, y, axis, val, f, p,
                data, format;

            function updateAxis(axis, min, max) {
                if (min < axis.datamin && min != -fakeInfinity)
                    axis.datamin = min;
                if (max > axis.datamax && max != fakeInfinity)
                    axis.datamax = max;
            }

            $.each(allAxes(), function (_, axis) {
                // init axis
                axis.datamin = topSentry;
                axis.datamax = bottomSentry;
                axis.used = false;
            });

            for (i = 0; i < series.length; ++i) {
                s = series[i];
                s.datapoints = { points: [] };

                executeHooks(hooks.processRawData, [ s, s.data, s.datapoints ]);
            }

            // first pass: clean and copy data
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                data = s.data;
                format = s.datapoints.format;

                if (!format) {
                    format = [];
                    // find out how to copy
                    format.push({ x: true, number: true, required: true });
                    format.push({ y: true, number: true, required: true });

                    if (s.bars.show || (s.lines.show && s.lines.fill)) {
                        var autoscale = !!((s.bars.show && s.bars.zero) || (s.lines.show && s.lines.zero));
                        format.push({ y: true, number: true, required: false, defaultValue: 0, autoscale: autoscale });
                        if (s.bars.horizontal) {
                            delete format[format.length - 1].y;
                            format[format.length - 1].x = true;
                        }
                    }

                    s.datapoints.format = format;
                }

                if (s.datapoints.pointsize != null)
                    continue; // already filled in

                s.datapoints.pointsize = format.length;

                ps = s.datapoints.pointsize;
                points = s.datapoints.points;

                var insertSteps = s.lines.show && s.lines.steps;
                s.xaxis.used = s.yaxis.used = true;

                for (j = k = 0; j < data.length; ++j, k += ps) {
                    p = data[j];

                    var nullify = p == null;
                    if (!nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = p[m];
                            f = format[m];

                            if (f) {
                                if (f.number && val != null) {
                                    val = +val; // convert to number
                                    if (isNaN(val))
                                        val = null;
                                    else if (val == Infinity)
                                        val = fakeInfinity;
                                    else if (val == -Infinity)
                                        val = -fakeInfinity;
                                }

                                if (val == null) {
                                    if (f.required)
                                        nullify = true;

                                    if (f.defaultValue != null)
                                        val = f.defaultValue;
                                }
                            }

                            points[k + m] = val;
                        }
                    }

                    if (nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = points[k + m];
                            if (val != null) {
                                f = format[m];
                                // extract min/max info
                                if (f.autoscale !== false) {
                                    if (f.x) {
                                        updateAxis(s.xaxis, val, val);
                                    }
                                    if (f.y) {
                                        updateAxis(s.yaxis, val, val);
                                    }
                                }
                            }
                            points[k + m] = null;
                        }
                    }
                    else {
                        // a little bit of line specific stuff that
                        // perhaps shouldn't be here, but lacking
                        // better means...
                        if (insertSteps && k > 0
                            && points[k - ps] != null
                            && points[k - ps] != points[k]
                            && points[k - ps + 1] != points[k + 1]) {
                            // copy the point to make room for a middle point
                            for (m = 0; m < ps; ++m)
                                points[k + ps + m] = points[k + m];

                            // middle point has same y
                            points[k + 1] = points[k - ps + 1];

                            // we've added a point, better reflect that
                            k += ps;
                        }
                    }
                }
            }

            // give the hooks a chance to run
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                executeHooks(hooks.processDatapoints, [ s, s.datapoints]);
            }

            // second pass: find datamax/datamin for auto-scaling
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                points = s.datapoints.points;
                ps = s.datapoints.pointsize;
                format = s.datapoints.format;

                var xmin = topSentry, ymin = topSentry,
                    xmax = bottomSentry, ymax = bottomSentry;

                for (j = 0; j < points.length; j += ps) {
                    if (points[j] == null)
                        continue;

                    for (m = 0; m < ps; ++m) {
                        val = points[j + m];
                        f = format[m];
                        if (!f || f.autoscale === false || val == fakeInfinity || val == -fakeInfinity)
                            continue;

                        if (f.x) {
                            if (val < xmin)
                                xmin = val;
                            if (val > xmax)
                                xmax = val;
                        }
                        if (f.y) {
                            if (val < ymin)
                                ymin = val;
                            if (val > ymax)
                                ymax = val;
                        }
                    }
                }

                if (s.bars.show) {
                    // make sure we got room for the bar on the dancing floor
                    var delta;

                    switch (s.bars.align) {
                        case "left":
                            delta = 0;
                            break;
                        case "right":
                            delta = -s.bars.barWidth;
                            break;
                        default:
                            delta = -s.bars.barWidth / 2;
                    }

                    if (s.bars.horizontal) {
                        ymin += delta;
                        ymax += delta + s.bars.barWidth;
                    }
                    else {
                        xmin += delta;
                        xmax += delta + s.bars.barWidth;
                    }
                }

                updateAxis(s.xaxis, xmin, xmax);
                updateAxis(s.yaxis, ymin, ymax);
            }

            $.each(allAxes(), function (_, axis) {
                if (axis.datamin == topSentry)
                    axis.datamin = null;
                if (axis.datamax == bottomSentry)
                    axis.datamax = null;
            });
        }

        function setupCanvases() {

            // Make sure the placeholder is clear of everything except canvases
            // from a previous plot in this container that we'll try to re-use.

            placeholder.css("padding", 0) // padding messes up the positioning
                .children().filter(function(){
                    return !$(this).hasClass("flot-overlay") && !$(this).hasClass('flot-base');
                }).remove();

            if (placeholder.css("position") == 'static')
                placeholder.css("position", "relative"); // for positioning labels and overlay

            surface = new Canvas("flot-base", placeholder);
            overlay = new Canvas("flot-overlay", placeholder); // overlay canvas for interactive features

            ctx = surface.context;
            octx = overlay.context;

            // define which element we're listening for events on
            eventHolder = $(overlay.element).unbind();

            // If we're re-using a plot object, shut down the old one

            var existing = placeholder.data("plot");

            if (existing) {
                existing.shutdown();
                overlay.clear();
            }

            // save in case we get replotted
            placeholder.data("plot", plot);
        }

        function bindEvents() {
            // bind events
            if (options.grid.hoverable) {
                eventHolder.mousemove(onMouseMove);

                // Use bind, rather than .mouseleave, because we officially
                // still support jQuery 1.2.6, which doesn't define a shortcut
                // for mouseenter or mouseleave.  This was a bug/oversight that
                // was fixed somewhere around 1.3.x.  We can return to using
                // .mouseleave when we drop support for 1.2.6.

                eventHolder.bind("mouseleave", onMouseLeave);
            }

            if (options.grid.clickable)
                eventHolder.click(onClick);

            executeHooks(hooks.bindEvents, [eventHolder]);
        }

        function shutdown() {
            if (redrawTimeout)
                clearTimeout(redrawTimeout);

            eventHolder.unbind("mousemove", onMouseMove);
            eventHolder.unbind("mouseleave", onMouseLeave);
            eventHolder.unbind("click", onClick);

            executeHooks(hooks.shutdown, [eventHolder]);
        }

        function setTransformationHelpers(axis) {
            // set helper functions on the axis, assumes plot area
            // has been computed already

            function identity(x) { return x; }

            var s, m, t = axis.options.transform || identity,
                it = axis.options.inverseTransform;

            // precompute how much the axis is scaling a point
            // in canvas space
            if (axis.direction == "x") {
                s = axis.scale = plotWidth / Math.abs(t(axis.max) - t(axis.min));
                m = Math.min(t(axis.max), t(axis.min));
            }
            else {
                s = axis.scale = plotHeight / Math.abs(t(axis.max) - t(axis.min));
                s = -s;
                m = Math.max(t(axis.max), t(axis.min));
            }

            // data point to canvas coordinate
            if (t == identity) // slight optimization
                axis.p2c = function (p) { return (p - m) * s; };
            else
                axis.p2c = function (p) { return (t(p) - m) * s; };
            // canvas coordinate to data point
            if (!it)
                axis.c2p = function (c) { return m + c / s; };
            else
                axis.c2p = function (c) { return it(m + c / s); };
        }

        function measureTickLabels(axis) {

            var opts = axis.options,
                ticks = axis.ticks || [],
                labelWidth = opts.labelWidth || 0,
                labelHeight = opts.labelHeight || 0,
                maxWidth = labelWidth || (axis.direction == "x" ? Math.floor(surface.width / (ticks.length || 1)) : null),
                legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                font = opts.font || "flot-tick-label tickLabel";

            for (var i = 0; i < ticks.length; ++i) {

                var t = ticks[i];

                if (!t.label)
                    continue;

                var info = surface.getTextInfo(layer, t.label, font, null, maxWidth);

                labelWidth = Math.max(labelWidth, info.width);
                labelHeight = Math.max(labelHeight, info.height);
            }

            axis.labelWidth = opts.labelWidth || labelWidth;
            axis.labelHeight = opts.labelHeight || labelHeight;
        }

        function allocateAxisBoxFirstPhase(axis) {
            // find the bounding box of the axis by looking at label
            // widths/heights and ticks, make room by diminishing the
            // plotOffset; this first phase only looks at one
            // dimension per axis, the other dimension depends on the
            // other axes so will have to wait

            var lw = axis.labelWidth,
                lh = axis.labelHeight,
                pos = axis.options.position,
                isXAxis = axis.direction === "x",
                tickLength = axis.options.tickLength,
                axisMargin = options.grid.axisMargin,
                padding = options.grid.labelMargin,
                innermost = true,
                outermost = true,
                first = true,
                found = false;

            // Determine the axis's position in its direction and on its side

            $.each(isXAxis ? xaxes : yaxes, function(i, a) {
                if (a && a.reserveSpace) {
                    if (a === axis) {
                        found = true;
                    } else if (a.options.position === pos) {
                        if (found) {
                            outermost = false;
                        } else {
                            innermost = false;
                        }
                    }
                    if (!found) {
                        first = false;
                    }
                }
            });

            // The outermost axis on each side has no margin

            if (outermost) {
                axisMargin = 0;
            }

            // The ticks for the first axis in each direction stretch across

            if (tickLength == null) {
                tickLength = first ? "full" : 5;
            }

            if (!isNaN(+tickLength))
                padding += +tickLength;

            if (isXAxis) {
                lh += padding;

                if (pos == "bottom") {
                    plotOffset.bottom += lh + axisMargin;
                    axis.box = { top: surface.height - plotOffset.bottom, height: lh };
                }
                else {
                    axis.box = { top: plotOffset.top + axisMargin, height: lh };
                    plotOffset.top += lh + axisMargin;
                }
            }
            else {
                lw += padding;

                if (pos == "left") {
                    axis.box = { left: plotOffset.left + axisMargin, width: lw };
                    plotOffset.left += lw + axisMargin;
                }
                else {
                    plotOffset.right += lw + axisMargin;
                    axis.box = { left: surface.width - plotOffset.right, width: lw };
                }
            }

             // save for future reference
            axis.position = pos;
            axis.tickLength = tickLength;
            axis.box.padding = padding;
            axis.innermost = innermost;
        }

        function allocateAxisBoxSecondPhase(axis) {
            // now that all axis boxes have been placed in one
            // dimension, we can set the remaining dimension coordinates
            if (axis.direction == "x") {
                axis.box.left = plotOffset.left - axis.labelWidth / 2;
                axis.box.width = surface.width - plotOffset.left - plotOffset.right + axis.labelWidth;
            }
            else {
                axis.box.top = plotOffset.top - axis.labelHeight / 2;
                axis.box.height = surface.height - plotOffset.bottom - plotOffset.top + axis.labelHeight;
            }
        }

        function adjustLayoutForThingsStickingOut() {
            // possibly adjust plot offset to ensure everything stays
            // inside the canvas and isn't clipped off

            var minMargin = options.grid.minBorderMargin,
                axis, i;

            // check stuff from the plot (FIXME: this should just read
            // a value from the series, otherwise it's impossible to
            // customize)
            if (minMargin == null) {
                minMargin = 0;
                for (i = 0; i < series.length; ++i)
                    minMargin = Math.max(minMargin, 2 * (series[i].points.radius + series[i].points.lineWidth/2));
            }

            var margins = {
                left: minMargin,
                right: minMargin,
                top: minMargin,
                bottom: minMargin
            };

            // check axis labels, note we don't check the actual
            // labels but instead use the overall width/height to not
            // jump as much around with replots
            $.each(allAxes(), function (_, axis) {
                if (axis.reserveSpace && axis.ticks && axis.ticks.length) {
                    var lastTick = axis.ticks[axis.ticks.length - 1];
                    if (axis.direction === "x") {
                        margins.left = Math.max(margins.left, axis.labelWidth / 2);
                        if (lastTick.v <= axis.max) {
                            margins.right = Math.max(margins.right, axis.labelWidth / 2);
                        }
                    } else {
                        margins.bottom = Math.max(margins.bottom, axis.labelHeight / 2);
                        if (lastTick.v <= axis.max) {
                            margins.top = Math.max(margins.top, axis.labelHeight / 2);
                        }
                    }
                }
            });

            plotOffset.left = Math.ceil(Math.max(margins.left, plotOffset.left));
            plotOffset.right = Math.ceil(Math.max(margins.right, plotOffset.right));
            plotOffset.top = Math.ceil(Math.max(margins.top, plotOffset.top));
            plotOffset.bottom = Math.ceil(Math.max(margins.bottom, plotOffset.bottom));
        }

        function setupGrid() {
            var i, axes = allAxes(), showGrid = options.grid.show;

            // Initialize the plot's offset from the edge of the canvas

            for (var a in plotOffset) {
                var margin = options.grid.margin || 0;
                plotOffset[a] = typeof margin == "number" ? margin : margin[a] || 0;
            }

            executeHooks(hooks.processOffset, [plotOffset]);

            // If the grid is visible, add its border width to the offset

            for (var a in plotOffset) {
                if(typeof(options.grid.borderWidth) == "object") {
                    plotOffset[a] += showGrid ? options.grid.borderWidth[a] : 0;
                }
                else {
                    plotOffset[a] += showGrid ? options.grid.borderWidth : 0;
                }
            }

            // init axes
            $.each(axes, function (_, axis) {
                axis.show = axis.options.show;
                if (axis.show == null)
                    axis.show = axis.used; // by default an axis is visible if it's got data

                axis.reserveSpace = axis.show || axis.options.reserveSpace;

                setRange(axis);
            });

            if (showGrid) {

                var allocatedAxes = $.grep(axes, function (axis) { return axis.reserveSpace; });

                $.each(allocatedAxes, function (_, axis) {
                    // make the ticks
                    setupTickGeneration(axis);
                    setTicks(axis);
                    snapRangeToTicks(axis, axis.ticks);
                    // find labelWidth/Height for axis
                    measureTickLabels(axis);
                });

                // with all dimensions calculated, we can compute the
                // axis bounding boxes, start from the outside
                // (reverse order)
                for (i = allocatedAxes.length - 1; i >= 0; --i)
                    allocateAxisBoxFirstPhase(allocatedAxes[i]);

                // make sure we've got enough space for things that
                // might stick out
                adjustLayoutForThingsStickingOut();

                $.each(allocatedAxes, function (_, axis) {
                    allocateAxisBoxSecondPhase(axis);
                });
            }

            plotWidth = surface.width - plotOffset.left - plotOffset.right;
            plotHeight = surface.height - plotOffset.bottom - plotOffset.top;

            // now we got the proper plot dimensions, we can compute the scaling
            $.each(axes, function (_, axis) {
                setTransformationHelpers(axis);
            });

            if (showGrid) {
                drawAxisLabels();
            }

            insertLegend();
        }

        function setRange(axis) {
            var opts = axis.options,
                min = +(opts.min != null ? opts.min : axis.datamin),
                max = +(opts.max != null ? opts.max : axis.datamax),
                delta = max - min;

            if (delta == 0.0) {
                // degenerate case
                var widen = max == 0 ? 1 : 0.01;

                if (opts.min == null)
                    min -= widen;
                // always widen max if we couldn't widen min to ensure we
                // don't fall into min == max which doesn't work
                if (opts.max == null || opts.min != null)
                    max += widen;
            }
            else {
                // consider autoscaling
                var margin = opts.autoscaleMargin;
                if (margin != null) {
                    if (opts.min == null) {
                        min -= delta * margin;
                        // make sure we don't go below zero if all values
                        // are positive
                        if (min < 0 && axis.datamin != null && axis.datamin >= 0)
                            min = 0;
                    }
                    if (opts.max == null) {
                        max += delta * margin;
                        if (max > 0 && axis.datamax != null && axis.datamax <= 0)
                            max = 0;
                    }
                }
            }
            axis.min = min;
            axis.max = max;
        }

        function setupTickGeneration(axis) {
            var opts = axis.options;

            // estimate number of ticks
            var noTicks;
            if (typeof opts.ticks == "number" && opts.ticks > 0)
                noTicks = opts.ticks;
            else
                // heuristic based on the model a*sqrt(x) fitted to
                // some data points that seemed reasonable
                noTicks = 0.3 * Math.sqrt(axis.direction == "x" ? surface.width : surface.height);

            var delta = (axis.max - axis.min) / noTicks,
                dec = -Math.floor(Math.log(delta) / Math.LN10),
                maxDec = opts.tickDecimals;

            if (maxDec != null && dec > maxDec) {
                dec = maxDec;
            }

            var magn = Math.pow(10, -dec),
                norm = delta / magn, // norm is between 1.0 and 10.0
                size;

            if (norm < 1.5) {
                size = 1;
            } else if (norm < 3) {
                size = 2;
                // special case for 2.5, requires an extra decimal
                if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                    size = 2.5;
                    ++dec;
                }
            } else if (norm < 7.5) {
                size = 5;
            } else {
                size = 10;
            }

            size *= magn;

            if (opts.minTickSize != null && size < opts.minTickSize) {
                size = opts.minTickSize;
            }

            axis.delta = delta;
            axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
            axis.tickSize = opts.tickSize || size;

            // Time mode was moved to a plug-in in 0.8, but since so many people use this
            // we'll add an especially friendly make sure they remembered to include it.

            if (opts.mode == "time" && !axis.tickGenerator) {
                throw new Error("Time mode requires the flot.time plugin.");
            }

            // Flot supports base-10 axes; any other mode else is handled by a plug-in,
            // like flot.time.js.

            if (!axis.tickGenerator) {

                axis.tickGenerator = function (axis) {

                    var ticks = [],
                        start = floorInBase(axis.min, axis.tickSize),
                        i = 0,
                        v = Number.NaN,
                        prev;

                    do {
                        prev = v;
                        v = start + i * axis.tickSize;
                        ticks.push(v);
                        ++i;
                    } while (v < axis.max && v != prev);
                    return ticks;
                };

				axis.tickFormatter = function (value, axis) {

					var factor = axis.tickDecimals ? Math.pow(10, axis.tickDecimals) : 1;
					var formatted = "" + Math.round(value * factor) / factor;

					// If tickDecimals was specified, ensure that we have exactly that
					// much precision; otherwise default to the value's own precision.

					if (axis.tickDecimals != null) {
						var decimal = formatted.indexOf(".");
						var precision = decimal == -1 ? 0 : formatted.length - decimal - 1;
						if (precision < axis.tickDecimals) {
							return (precision ? formatted : formatted + ".") + ("" + factor).substr(1, axis.tickDecimals - precision);
						}
					}

                    return formatted;
                };
            }

            if ($.isFunction(opts.tickFormatter))
                axis.tickFormatter = function (v, axis) { return "" + opts.tickFormatter(v, axis); };

            if (opts.alignTicksWithAxis != null) {
                var otherAxis = (axis.direction == "x" ? xaxes : yaxes)[opts.alignTicksWithAxis - 1];
                if (otherAxis && otherAxis.used && otherAxis != axis) {
                    // consider snapping min/max to outermost nice ticks
                    var niceTicks = axis.tickGenerator(axis);
                    if (niceTicks.length > 0) {
                        if (opts.min == null)
                            axis.min = Math.min(axis.min, niceTicks[0]);
                        if (opts.max == null && niceTicks.length > 1)
                            axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
                    }

                    axis.tickGenerator = function (axis) {
                        // copy ticks, scaled to this axis
                        var ticks = [], v, i;
                        for (i = 0; i < otherAxis.ticks.length; ++i) {
                            v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
                            v = axis.min + v * (axis.max - axis.min);
                            ticks.push(v);
                        }
                        return ticks;
                    };

                    // we might need an extra decimal since forced
                    // ticks don't necessarily fit naturally
                    if (!axis.mode && opts.tickDecimals == null) {
                        var extraDec = Math.max(0, -Math.floor(Math.log(axis.delta) / Math.LN10) + 1),
                            ts = axis.tickGenerator(axis);

                        // only proceed if the tick interval rounded
                        // with an extra decimal doesn't give us a
                        // zero at end
                        if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec))))
                            axis.tickDecimals = extraDec;
                    }
                }
            }
        }

        function setTicks(axis) {
            var oticks = axis.options.ticks, ticks = [];
            if (oticks == null || (typeof oticks == "number" && oticks > 0))
                ticks = axis.tickGenerator(axis);
            else if (oticks) {
                if ($.isFunction(oticks))
                    // generate the ticks
                    ticks = oticks(axis);
                else
                    ticks = oticks;
            }

            // clean up/labelify the supplied ticks, copy them over
            var i, v;
            axis.ticks = [];
            for (i = 0; i < ticks.length; ++i) {
                var label = null;
                var t = ticks[i];
                if (typeof t == "object") {
                    v = +t[0];
                    if (t.length > 1)
                        label = t[1];
                }
                else
                    v = +t;
                if (label == null)
                    label = axis.tickFormatter(v, axis);
                if (!isNaN(v))
                    axis.ticks.push({ v: v, label: label });
            }
        }

        function snapRangeToTicks(axis, ticks) {
            if (axis.options.autoscaleMargin && ticks.length > 0) {
                // snap to ticks
                if (axis.options.min == null)
                    axis.min = Math.min(axis.min, ticks[0].v);
                if (axis.options.max == null && ticks.length > 1)
                    axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
            }
        }

        function draw() {

            surface.clear();

            executeHooks(hooks.drawBackground, [ctx]);

            var grid = options.grid;

            // draw background, if any
            if (grid.show && grid.backgroundColor)
                drawBackground();

            if (grid.show && !grid.aboveData) {
                drawGrid();
            }

            for (var i = 0; i < series.length; ++i) {
                executeHooks(hooks.drawSeries, [ctx, series[i]]);
                drawSeries(series[i]);
            }

            executeHooks(hooks.draw, [ctx]);

            if (grid.show && grid.aboveData) {
                drawGrid();
            }

            surface.render();

            // A draw implies that either the axes or data have changed, so we
            // should probably update the overlay highlights as well.

            triggerRedrawOverlay();
        }

        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = allAxes();

            for (var i = 0; i < axes.length; ++i) {
                axis = axes[i];
                if (axis.direction == coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n == 1)
                        key = coord + "axis"; // support x1axis as xaxis
                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord == "x" ? xaxes[0] : yaxes[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            return { from: from, to: to, axis: axis };
        }

        function drawBackground() {
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            ctx.fillStyle = getColorOrGradient(options.grid.backgroundColor, plotHeight, 0, "rgba(255, 255, 255, 0)");
            ctx.fillRect(0, 0, plotWidth, plotHeight);
            ctx.restore();
        }

        function drawGrid() {
            var i, axes, bw, bc;

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // draw markings
            var markings = options.grid.markings;
            if (markings) {
                if ($.isFunction(markings)) {
                    axes = plot.getAxes();
                    // xmin etc. is backwards compatibility, to be
                    // removed in the future
                    axes.xmin = axes.xaxis.min;
                    axes.xmax = axes.xaxis.max;
                    axes.ymin = axes.yaxis.min;
                    axes.ymax = axes.yaxis.max;

                    markings = markings(axes);
                }

                for (i = 0; i < markings.length; ++i) {
                    var m = markings[i],
                        xrange = extractRange(m, "x"),
                        yrange = extractRange(m, "y");

                    // fill in missing
                    if (xrange.from == null)
                        xrange.from = xrange.axis.min;
                    if (xrange.to == null)
                        xrange.to = xrange.axis.max;
                    if (yrange.from == null)
                        yrange.from = yrange.axis.min;
                    if (yrange.to == null)
                        yrange.to = yrange.axis.max;

                    // clip
                    if (xrange.to < xrange.axis.min || xrange.from > xrange.axis.max ||
                        yrange.to < yrange.axis.min || yrange.from > yrange.axis.max)
                        continue;

                    xrange.from = Math.max(xrange.from, xrange.axis.min);
                    xrange.to = Math.min(xrange.to, xrange.axis.max);
                    yrange.from = Math.max(yrange.from, yrange.axis.min);
                    yrange.to = Math.min(yrange.to, yrange.axis.max);

                    if (xrange.from == xrange.to && yrange.from == yrange.to)
                        continue;

                    // then draw
                    xrange.from = xrange.axis.p2c(xrange.from);
                    xrange.to = xrange.axis.p2c(xrange.to);
                    yrange.from = yrange.axis.p2c(yrange.from);
                    yrange.to = yrange.axis.p2c(yrange.to);

                    if (xrange.from == xrange.to || yrange.from == yrange.to) {
                        // draw line
                        ctx.beginPath();
                        ctx.strokeStyle = m.color || options.grid.markingsColor;
                        ctx.lineWidth = m.lineWidth || options.grid.markingsLineWidth;
                        ctx.moveTo(xrange.from, yrange.from);
                        ctx.lineTo(xrange.to, yrange.to);
                        ctx.stroke();
                    }
                    else {
                        // fill area
                        ctx.fillStyle = m.color || options.grid.markingsColor;
                        ctx.fillRect(xrange.from, yrange.to,
                                     xrange.to - xrange.from,
                                     yrange.from - yrange.to);
                    }
                }
            }

            // draw the ticks
            axes = allAxes();
            bw = options.grid.borderWidth;

            for (var j = 0; j < axes.length; ++j) {
                var axis = axes[j], box = axis.box,
                    t = axis.tickLength, x, y, xoff, yoff;
                if (!axis.show || axis.ticks.length == 0)
                    continue;

                ctx.lineWidth = 1;

                // find the edges
                if (axis.direction == "x") {
                    x = 0;
                    if (t == "full")
                        y = (axis.position == "top" ? 0 : plotHeight);
                    else
                        y = box.top - plotOffset.top + (axis.position == "top" ? box.height : 0);
                }
                else {
                    y = 0;
                    if (t == "full")
                        x = (axis.position == "left" ? 0 : plotWidth);
                    else
                        x = box.left - plotOffset.left + (axis.position == "left" ? box.width : 0);
                }

                // draw tick bar
                if (!axis.innermost) {
                    ctx.strokeStyle = axis.options.color;
                    ctx.beginPath();
                    xoff = yoff = 0;
                    if (axis.direction == "x")
                        xoff = plotWidth + 1;
                    else
                        yoff = plotHeight + 1;

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x") {
                            y = Math.floor(y) + 0.5;
                        } else {
                            x = Math.floor(x) + 0.5;
                        }
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                    ctx.stroke();
                }

                // draw ticks

                ctx.strokeStyle = axis.options.tickColor;

                ctx.beginPath();
                for (i = 0; i < axis.ticks.length; ++i) {
                    var v = axis.ticks[i].v;

                    xoff = yoff = 0;

                    if (isNaN(v) || v < axis.min || v > axis.max
                        // skip those lying on the axes if we got a border
                        || (t == "full"
                            && ((typeof bw == "object" && bw[axis.position] > 0) || bw > 0)
                            && (v == axis.min || v == axis.max)))
                        continue;

                    if (axis.direction == "x") {
                        x = axis.p2c(v);
                        yoff = t == "full" ? -plotHeight : t;

                        if (axis.position == "top")
                            yoff = -yoff;
                    }
                    else {
                        y = axis.p2c(v);
                        xoff = t == "full" ? -plotWidth : t;

                        if (axis.position == "left")
                            xoff = -xoff;
                    }

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x")
                            x = Math.floor(x) + 0.5;
                        else
                            y = Math.floor(y) + 0.5;
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                }

                ctx.stroke();
            }


            // draw border
            if (bw) {
                // If either borderWidth or borderColor is an object, then draw the border
                // line by line instead of as one rectangle
                bc = options.grid.borderColor;
                if(typeof bw == "object" || typeof bc == "object") {
                    if (typeof bw !== "object") {
                        bw = {top: bw, right: bw, bottom: bw, left: bw};
                    }
                    if (typeof bc !== "object") {
                        bc = {top: bc, right: bc, bottom: bc, left: bc};
                    }

                    if (bw.top > 0) {
                        ctx.strokeStyle = bc.top;
                        ctx.lineWidth = bw.top;
                        ctx.beginPath();
                        ctx.moveTo(0 - bw.left, 0 - bw.top/2);
                        ctx.lineTo(plotWidth, 0 - bw.top/2);
                        ctx.stroke();
                    }

                    if (bw.right > 0) {
                        ctx.strokeStyle = bc.right;
                        ctx.lineWidth = bw.right;
                        ctx.beginPath();
                        ctx.moveTo(plotWidth + bw.right / 2, 0 - bw.top);
                        ctx.lineTo(plotWidth + bw.right / 2, plotHeight);
                        ctx.stroke();
                    }

                    if (bw.bottom > 0) {
                        ctx.strokeStyle = bc.bottom;
                        ctx.lineWidth = bw.bottom;
                        ctx.beginPath();
                        ctx.moveTo(plotWidth + bw.right, plotHeight + bw.bottom / 2);
                        ctx.lineTo(0, plotHeight + bw.bottom / 2);
                        ctx.stroke();
                    }

                    if (bw.left > 0) {
                        ctx.strokeStyle = bc.left;
                        ctx.lineWidth = bw.left;
                        ctx.beginPath();
                        ctx.moveTo(0 - bw.left/2, plotHeight + bw.bottom);
                        ctx.lineTo(0- bw.left/2, 0);
                        ctx.stroke();
                    }
                }
                else {
                    ctx.lineWidth = bw;
                    ctx.strokeStyle = options.grid.borderColor;
                    ctx.strokeRect(-bw/2, -bw/2, plotWidth + bw, plotHeight + bw);
                }
            }

            ctx.restore();
        }

        function drawAxisLabels() {

            $.each(allAxes(), function (_, axis) {
                var box = axis.box,
                    legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                    layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                    font = axis.options.font || "flot-tick-label tickLabel",
                    tick, x, y, halign, valign;

                // Remove text before checking for axis.show and ticks.length;
                // otherwise plugins, like flot-tickrotor, that draw their own
                // tick labels will end up with both theirs and the defaults.

                surface.removeText(layer);

                if (!axis.show || axis.ticks.length == 0)
                    return;

                for (var i = 0; i < axis.ticks.length; ++i) {

                    tick = axis.ticks[i];
                    if (!tick.label || tick.v < axis.min || tick.v > axis.max)
                        continue;

                    if (axis.direction == "x") {
                        halign = "center";
                        x = plotOffset.left + axis.p2c(tick.v);
                        if (axis.position == "bottom") {
                            y = box.top + box.padding;
                        } else {
                            y = box.top + box.height - box.padding;
                            valign = "bottom";
                        }
                    } else {
                        valign = "middle";
                        y = plotOffset.top + axis.p2c(tick.v);
                        if (axis.position == "left") {
                            x = box.left + box.width - box.padding;
                            halign = "right";
                        } else {
                            x = box.left + box.padding;
                        }
                    }

                    surface.addText(layer, x, y, tick.label, font, null, null, halign, valign);
                }
            });
        }

        function drawSeries(series) {
            if (series.lines.show)
                drawSeriesLines(series);
            if (series.bars.show)
                drawSeriesBars(series);
            if (series.points.show)
                drawSeriesPoints(series);
        }

        function drawSeriesLines(series) {
            function plotLine(datapoints, xoffset, yoffset, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    prevx = null, prevy = null;

                ctx.beginPath();
                for (var i = ps; i < points.length; i += ps) {
                    var x1 = points[i - ps], y1 = points[i - ps + 1],
                        x2 = points[i], y2 = points[i + 1];

                    if (x1 == null || x2 == null)
                        continue;

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min) {
                        if (y2 < axisy.min)
                            continue;   // line segment is outside
                        // compute new intersection point
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min) {
                        if (y1 < axisy.min)
                            continue;
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max) {
                        if (y2 > axisy.max)
                            continue;
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max) {
                        if (y1 > axisy.max)
                            continue;
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (x1 != prevx || y1 != prevy)
                        ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);

                    prevx = x2;
                    prevy = y2;
                    ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
                }
                ctx.stroke();
            }

            function plotLineArea(datapoints, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    bottom = Math.min(Math.max(0, axisy.min), axisy.max),
                    i = 0, top, areaOpen = false,
                    ypos = 1, segmentStart = 0, segmentEnd = 0;

                // we process each segment in two turns, first forward
                // direction to sketch out top, then once we hit the
                // end we go backwards to sketch the bottom
                while (true) {
                    if (ps > 0 && i > points.length + ps)
                        break;

                    i += ps; // ps is negative if going backwards

                    var x1 = points[i - ps],
                        y1 = points[i - ps + ypos],
                        x2 = points[i], y2 = points[i + ypos];

                    if (areaOpen) {
                        if (ps > 0 && x1 != null && x2 == null) {
                            // at turning point
                            segmentEnd = i;
                            ps = -ps;
                            ypos = 2;
                            continue;
                        }

                        if (ps < 0 && i == segmentStart + ps) {
                            // done with the reverse sweep
                            ctx.fill();
                            areaOpen = false;
                            ps = -ps;
                            ypos = 1;
                            i = segmentStart = segmentEnd + ps;
                            continue;
                        }
                    }

                    if (x1 == null || x2 == null)
                        continue;

                    // clip x values

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (!areaOpen) {
                        // open area
                        ctx.beginPath();
                        ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
                        areaOpen = true;
                    }

                    // now first check the case where both is outside
                    if (y1 >= axisy.max && y2 >= axisy.max) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
                        continue;
                    }
                    else if (y1 <= axisy.min && y2 <= axisy.min) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
                        continue;
                    }

                    // else it's a bit more complicated, there might
                    // be a flat maxed out rectangle first, then a
                    // triangular cutout or reverse; to find these
                    // keep track of the current x values
                    var x1old = x1, x2old = x2;

                    // clip the y values, without shortcutting, we
                    // go through all cases in turn

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // if the x value was changed we got a rectangle
                    // to fill
                    if (x1 != x1old) {
                        ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
                        // it goes to (x1, y1), but we fill that below
                    }

                    // fill triangular section, this sometimes result
                    // in redundant points if (x1, y1) hasn't changed
                    // from previous line to, but we just ignore that
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

                    // fill the other rectangle if it's there
                    if (x2 != x2old) {
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
                        ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
                    }
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);
            ctx.lineJoin = "round";

            var lw = series.lines.lineWidth,
                sw = series.shadowSize;
            // FIXME: consider another form of shadow when filling is turned on
            if (lw > 0 && sw > 0) {
                // draw shadow as a thick and thin line with transparency
                ctx.lineWidth = sw;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                // position shadow at angle from the mid of line
                var angle = Math.PI/18;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/2), Math.cos(angle) * (lw/2 + sw/2), series.xaxis, series.yaxis);
                ctx.lineWidth = sw/2;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/4), Math.cos(angle) * (lw/2 + sw/4), series.xaxis, series.yaxis);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            var fillStyle = getFillStyle(series.lines, series.color, 0, plotHeight);
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
                plotLineArea(series.datapoints, series.xaxis, series.yaxis);
            }

            if (lw > 0)
                plotLine(series.datapoints, 0, 0, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function drawSeriesPoints(series) {
            function plotPoints(datapoints, radius, fillStyle, offset, shadow, axisx, axisy, symbol) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    var x = points[i], y = points[i + 1];
                    if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                        continue;

                    ctx.beginPath();
                    x = axisx.p2c(x);
                    y = axisy.p2c(y) + offset;
                    if (symbol == "circle")
                        ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
                    else
                        symbol(ctx, x, y, radius, shadow);
                    ctx.closePath();

                    if (fillStyle) {
                        ctx.fillStyle = fillStyle;
                        ctx.fill();
                    }
                    ctx.stroke();
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var lw = series.points.lineWidth,
                sw = series.shadowSize,
                radius = series.points.radius,
                symbol = series.points.symbol;

            // If the user sets the line width to 0, we change it to a very 
            // small value. A line width of 0 seems to force the default of 1.
            // Doing the conditional here allows the shadow setting to still be 
            // optional even with a lineWidth of 0.

            if( lw == 0 )
                lw = 0.0001;

            if (lw > 0 && sw > 0) {
                // draw shadow in two steps
                var w = sw / 2;
                ctx.lineWidth = w;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                plotPoints(series.datapoints, radius, null, w + w/2, true,
                           series.xaxis, series.yaxis, symbol);

                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                plotPoints(series.datapoints, radius, null, w/2, true,
                           series.xaxis, series.yaxis, symbol);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            plotPoints(series.datapoints, radius,
                       getFillStyle(series.points, series.color), 0, false,
                       series.xaxis, series.yaxis, symbol);
            ctx.restore();
        }

        function drawBar(x, y, b, barLeft, barRight, fillStyleCallback, axisx, axisy, c, horizontal, lineWidth) {
            var left, right, bottom, top,
                drawLeft, drawRight, drawTop, drawBottom,
                tmp;

            // in horizontal mode, we start the bar from the left
            // instead of from the bottom so it appears to be
            // horizontal rather than vertical
            if (horizontal) {
                drawBottom = drawRight = drawTop = true;
                drawLeft = false;
                left = b;
                right = x;
                top = y + barLeft;
                bottom = y + barRight;

                // account for negative bars
                if (right < left) {
                    tmp = right;
                    right = left;
                    left = tmp;
                    drawLeft = true;
                    drawRight = false;
                }
            }
            else {
                drawLeft = drawRight = drawTop = true;
                drawBottom = false;
                left = x + barLeft;
                right = x + barRight;
                bottom = b;
                top = y;

                // account for negative bars
                if (top < bottom) {
                    tmp = top;
                    top = bottom;
                    bottom = tmp;
                    drawBottom = true;
                    drawTop = false;
                }
            }

            // clip
            if (right < axisx.min || left > axisx.max ||
                top < axisy.min || bottom > axisy.max)
                return;

            if (left < axisx.min) {
                left = axisx.min;
                drawLeft = false;
            }

            if (right > axisx.max) {
                right = axisx.max;
                drawRight = false;
            }

            if (bottom < axisy.min) {
                bottom = axisy.min;
                drawBottom = false;
            }

            if (top > axisy.max) {
                top = axisy.max;
                drawTop = false;
            }

            left = axisx.p2c(left);
            bottom = axisy.p2c(bottom);
            right = axisx.p2c(right);
            top = axisy.p2c(top);

            // fill the bar
            if (fillStyleCallback) {
                c.fillStyle = fillStyleCallback(bottom, top);
                c.fillRect(left, top, right - left, bottom - top)
            }

            // draw outline
            if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
                c.beginPath();

                // FIXME: inline moveTo is buggy with excanvas
                c.moveTo(left, bottom);
                if (drawLeft)
                    c.lineTo(left, top);
                else
                    c.moveTo(left, top);
                if (drawTop)
                    c.lineTo(right, top);
                else
                    c.moveTo(right, top);
                if (drawRight)
                    c.lineTo(right, bottom);
                else
                    c.moveTo(right, bottom);
                if (drawBottom)
                    c.lineTo(left, bottom);
                else
                    c.moveTo(left, bottom);
                c.stroke();
            }
        }

        function drawSeriesBars(series) {
            function plotBars(datapoints, barLeft, barRight, fillStyleCallback, axisx, axisy) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    if (points[i] == null)
                        continue;
                    drawBar(points[i], points[i + 1], points[i + 2], barLeft, barRight, fillStyleCallback, axisx, axisy, ctx, series.bars.horizontal, series.bars.lineWidth);
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // FIXME: figure out a way to add shadows (for instance along the right edge)
            ctx.lineWidth = series.bars.lineWidth;
            ctx.strokeStyle = series.color;

            var barLeft;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -series.bars.barWidth;
                    break;
                default:
                    barLeft = -series.bars.barWidth / 2;
            }

            var fillStyleCallback = series.bars.fill ? function (bottom, top) { return getFillStyle(series.bars, series.color, bottom, top); } : null;
            plotBars(series.datapoints, barLeft, barLeft + series.bars.barWidth, fillStyleCallback, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function getFillStyle(filloptions, seriesColor, bottom, top) {
            var fill = filloptions.fill;
            if (!fill)
                return null;

            if (filloptions.fillColor)
                return getColorOrGradient(filloptions.fillColor, bottom, top, seriesColor);

            var c = $.color.parse(seriesColor);
            c.a = typeof fill == "number" ? fill : 0.4;
            c.normalize();
            return c.toString();
        }

        function insertLegend() {

            if (options.legend.container != null) {
                $(options.legend.container).html("");
            } else {
                placeholder.find(".legend").remove();
            }

            if (!options.legend.show) {
                return;
            }

            var fragments = [], entries = [], rowStarted = false,
                lf = options.legend.labelFormatter, s, label;

            // Build a list of legend entries, with each having a label and a color

            for (var i = 0; i < series.length; ++i) {
                s = series[i];
                if (s.label) {
                    label = lf ? lf(s.label, s) : s.label;
                    if (label) {
                        entries.push({
                            label: label,
                            color: s.color
                        });
                    }
                }
            }

            // Sort the legend using either the default or a custom comparator

            if (options.legend.sorted) {
                if ($.isFunction(options.legend.sorted)) {
                    entries.sort(options.legend.sorted);
                } else if (options.legend.sorted == "reverse") {
                	entries.reverse();
                } else {
                    var ascending = options.legend.sorted != "descending";
                    entries.sort(function(a, b) {
                        return a.label == b.label ? 0 : (
                            (a.label < b.label) != ascending ? 1 : -1   // Logical XOR
                        );
                    });
                }
            }

            // Generate markup for the list of entries, in their final order

            for (var i = 0; i < entries.length; ++i) {

                var entry = entries[i];

                if (i % options.legend.noColumns == 0) {
                    if (rowStarted)
                        fragments.push('</tr>');
                    fragments.push('<tr>');
                    rowStarted = true;
                }

                fragments.push(
                    '<td class="legendColorBox"><div style="border:1px solid ' + options.legend.labelBoxBorderColor + ';padding:1px"><div style="width:4px;height:0;border:5px solid ' + entry.color + ';overflow:hidden"></div></div></td>' +
                    '<td class="legendLabel">' + entry.label + '</td>'
                );
            }

            if (rowStarted)
                fragments.push('</tr>');

            if (fragments.length == 0)
                return;

            var table = '<table style="font-size:smaller;color:' + options.grid.color + '">' + fragments.join("") + '</table>';
            if (options.legend.container != null)
                $(options.legend.container).html(table);
            else {
                var pos = "",
                    p = options.legend.position,
                    m = options.legend.margin;
                if (m[0] == null)
                    m = [m, m];
                if (p.charAt(0) == "n")
                    pos += 'top:' + (m[1] + plotOffset.top) + 'px;';
                else if (p.charAt(0) == "s")
                    pos += 'bottom:' + (m[1] + plotOffset.bottom) + 'px;';
                if (p.charAt(1) == "e")
                    pos += 'right:' + (m[0] + plotOffset.right) + 'px;';
                else if (p.charAt(1) == "w")
                    pos += 'left:' + (m[0] + plotOffset.left) + 'px;';
                var legend = $('<div class="legend">' + table.replace('style="', 'style="position:absolute;' + pos +';') + '</div>').appendTo(placeholder);
                if (options.legend.backgroundOpacity != 0.0) {
                    // put in the transparent background
                    // separately to avoid blended labels and
                    // label boxes
                    var c = options.legend.backgroundColor;
                    if (c == null) {
                        c = options.grid.backgroundColor;
                        if (c && typeof c == "string")
                            c = $.color.parse(c);
                        else
                            c = $.color.extract(legend, 'background-color');
                        c.a = 1;
                        c = c.toString();
                    }
                    var div = legend.children();
                    $('<div style="position:absolute;width:' + div.width() + 'px;height:' + div.height() + 'px;' + pos +'background-color:' + c + ';"> </div>').prependTo(legend).css('opacity', options.legend.backgroundOpacity);
                }
            }
        }


        // interactive features

        var highlights = [],
            redrawTimeout = null;

        // returns the data item the mouse is over, or null if none is found
        function findNearbyItem(mouseX, mouseY, seriesFilter) {
            var maxDistance = options.grid.mouseActiveRadius,
                smallestDistance = maxDistance * maxDistance + 1,
                item = null, foundPoint = false, i, j, ps;

            for (i = series.length - 1; i >= 0; --i) {
                if (!seriesFilter(series[i]))
                    continue;

                var s = series[i],
                    axisx = s.xaxis,
                    axisy = s.yaxis,
                    points = s.datapoints.points,
                    mx = axisx.c2p(mouseX), // precompute some stuff to make the loop faster
                    my = axisy.c2p(mouseY),
                    maxx = maxDistance / axisx.scale,
                    maxy = maxDistance / axisy.scale;

                ps = s.datapoints.pointsize;
                // with inverse transforms, we can't use the maxx/maxy
                // optimization, sadly
                if (axisx.options.inverseTransform)
                    maxx = Number.MAX_VALUE;
                if (axisy.options.inverseTransform)
                    maxy = Number.MAX_VALUE;

                if (s.lines.show || s.points.show) {
                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1];
                        if (x == null)
                            continue;

                        // For points and lines, the cursor must be within a
                        // certain distance to the data point
                        if (x - mx > maxx || x - mx < -maxx ||
                            y - my > maxy || y - my < -maxy)
                            continue;

                        // We have to calculate distances in pixels, not in
                        // data units, because the scales of the axes may be different
                        var dx = Math.abs(axisx.p2c(x) - mouseX),
                            dy = Math.abs(axisy.p2c(y) - mouseY),
                            dist = dx * dx + dy * dy; // we save the sqrt

                        // use <= to ensure last point takes precedence
                        // (last generally means on top of)
                        if (dist < smallestDistance) {
                            smallestDistance = dist;
                            item = [i, j / ps];
                        }
                    }
                }

                if (s.bars.show && !item) { // no other point can be nearby

                    var barLeft, barRight;

                    switch (s.bars.align) {
                        case "left":
                            barLeft = 0;
                            break;
                        case "right":
                            barLeft = -s.bars.barWidth;
                            break;
                        default:
                            barLeft = -s.bars.barWidth / 2;
                    }

                    barRight = barLeft + s.bars.barWidth;

                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1], b = points[j + 2];
                        if (x == null)
                            continue;

                        // for a bar graph, the cursor must be inside the bar
                        if (series[i].bars.horizontal ?
                            (mx <= Math.max(b, x) && mx >= Math.min(b, x) &&
                             my >= y + barLeft && my <= y + barRight) :
                            (mx >= x + barLeft && mx <= x + barRight &&
                             my >= Math.min(b, y) && my <= Math.max(b, y)))
                                item = [i, j / ps];
                    }
                }
            }

            if (item) {
                i = item[0];
                j = item[1];
                ps = series[i].datapoints.pointsize;

                return { datapoint: series[i].datapoints.points.slice(j * ps, (j + 1) * ps),
                         dataIndex: j,
                         series: series[i],
                         seriesIndex: i };
            }

            return null;
        }

        function onMouseMove(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return s["hoverable"] != false; });
        }

        function onMouseLeave(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return false; });
        }

        function onClick(e) {
            triggerClickHoverEvent("plotclick", e,
                                   function (s) { return s["clickable"] != false; });
        }

        // trigger click or hover event (they send the same parameters
        // so we share their code)
        function triggerClickHoverEvent(eventname, event, seriesFilter) {
            var offset = eventHolder.offset(),
                canvasX = event.pageX - offset.left - plotOffset.left,
                canvasY = event.pageY - offset.top - plotOffset.top,
            pos = canvasToAxisCoords({ left: canvasX, top: canvasY });

            pos.pageX = event.pageX;
            pos.pageY = event.pageY;

            var item = findNearbyItem(canvasX, canvasY, seriesFilter);

            if (item) {
                // fill in mouse pos for any listeners out there
                item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + offset.left + plotOffset.left, 10);
                item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + offset.top + plotOffset.top, 10);
            }

            if (options.grid.autoHighlight) {
                // clear auto-highlights
                for (var i = 0; i < highlights.length; ++i) {
                    var h = highlights[i];
                    if (h.auto == eventname &&
                        !(item && h.series == item.series &&
                          h.point[0] == item.datapoint[0] &&
                          h.point[1] == item.datapoint[1]))
                        unhighlight(h.series, h.point);
                }

                if (item)
                    highlight(item.series, item.datapoint, eventname);
            }

            placeholder.trigger(eventname, [ pos, item ]);
        }

        function triggerRedrawOverlay() {
            var t = options.interaction.redrawOverlayInterval;
            if (t == -1) {      // skip event queue
                drawOverlay();
                return;
            }

            if (!redrawTimeout)
                redrawTimeout = setTimeout(drawOverlay, t);
        }

        function drawOverlay() {
            redrawTimeout = null;

            // draw highlights
            octx.save();
            overlay.clear();
            octx.translate(plotOffset.left, plotOffset.top);

            var i, hi;
            for (i = 0; i < highlights.length; ++i) {
                hi = highlights[i];

                if (hi.series.bars.show)
                    drawBarHighlight(hi.series, hi.point);
                else
                    drawPointHighlight(hi.series, hi.point);
            }
            octx.restore();

            executeHooks(hooks.drawOverlay, [octx]);
        }

        function highlight(s, point, auto) {
            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i == -1) {
                highlights.push({ series: s, point: point, auto: auto });

                triggerRedrawOverlay();
            }
            else if (!auto)
                highlights[i].auto = false;
        }

        function unhighlight(s, point) {
            if (s == null && point == null) {
                highlights = [];
                triggerRedrawOverlay();
                return;
            }

            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i != -1) {
                highlights.splice(i, 1);

                triggerRedrawOverlay();
            }
        }

        function indexOfHighlight(s, p) {
            for (var i = 0; i < highlights.length; ++i) {
                var h = highlights[i];
                if (h.series == s && h.point[0] == p[0]
                    && h.point[1] == p[1])
                    return i;
            }
            return -1;
        }

        function drawPointHighlight(series, point) {
            var x = point[0], y = point[1],
                axisx = series.xaxis, axisy = series.yaxis,
                highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString();

            if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                return;

            var pointRadius = series.points.radius + series.points.lineWidth / 2;
            octx.lineWidth = pointRadius;
            octx.strokeStyle = highlightColor;
            var radius = 1.5 * pointRadius;
            x = axisx.p2c(x);
            y = axisy.p2c(y);

            octx.beginPath();
            if (series.points.symbol == "circle")
                octx.arc(x, y, radius, 0, 2 * Math.PI, false);
            else
                series.points.symbol(octx, x, y, radius, false);
            octx.closePath();
            octx.stroke();
        }

        function drawBarHighlight(series, point) {
            var highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString(),
                fillStyle = highlightColor,
                barLeft;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -series.bars.barWidth;
                    break;
                default:
                    barLeft = -series.bars.barWidth / 2;
            }

            octx.lineWidth = series.bars.lineWidth;
            octx.strokeStyle = highlightColor;

            drawBar(point[0], point[1], point[2] || 0, barLeft, barLeft + series.bars.barWidth,
                    function () { return fillStyle; }, series.xaxis, series.yaxis, octx, series.bars.horizontal, series.bars.lineWidth);
        }

        function getColorOrGradient(spec, bottom, top, defaultColor) {
            if (typeof spec == "string")
                return spec;
            else {
                // assume this is a gradient spec; IE currently only
                // supports a simple vertical gradient properly, so that's
                // what we support too
                var gradient = ctx.createLinearGradient(0, top, 0, bottom);

                for (var i = 0, l = spec.colors.length; i < l; ++i) {
                    var c = spec.colors[i];
                    if (typeof c != "string") {
                        var co = $.color.parse(defaultColor);
                        if (c.brightness != null)
                            co = co.scale('rgb', c.brightness);
                        if (c.opacity != null)
                            co.a *= c.opacity;
                        c = co.toString();
                    }
                    gradient.addColorStop(i / (l - 1), c);
                }

                return gradient;
            }
        }
    }

    // Add the plot function to the top level of the jQuery object

    $.plot = function(placeholder, data, options) {
        //var t0 = new Date();
        var plot = new Plot($(placeholder), data, options, $.plot.plugins);
        //(window.console ? console.log : alert)("time used (msecs): " + ((new Date()).getTime() - t0.getTime()));
        return plot;
    };

    $.plot.version = "0.8.2";

    $.plot.plugins = [];

    // Also add the plot function as a chainable property

    $.fn.plot = function(data, options) {
        return this.each(function() {
            $.plot(this, data, options);
        });
    };

    // round to nearby lower multiple of base
    function floorInBase(n, base) {
        return base * Math.floor(n / base);
    }

})(jQuery);
(function($){var options={series:{fillBetween:null}};function init(plot){function findBottomSeries(s,allseries){var i;for(i=0;i<allseries.length;++i){if(allseries[i].id===s.fillBetween){return allseries[i]}}if(typeof s.fillBetween==="number"){if(s.fillBetween<0||s.fillBetween>=allseries.length){return null}return allseries[s.fillBetween]}return null}function computeFillBottoms(plot,s,datapoints){if(s.fillBetween==null){return}var other=findBottomSeries(s,plot.getData());if(!other){return}var ps=datapoints.pointsize,points=datapoints.points,otherps=other.datapoints.pointsize,otherpoints=other.datapoints.points,newpoints=[],px,py,intery,qx,qy,bottom,withlines=s.lines.show,withbottom=ps>2&&datapoints.format[2].y,withsteps=withlines&&s.lines.steps,fromgap=true,i=0,j=0,l,m;while(true){if(i>=points.length){break}l=newpoints.length;if(points[i]==null){for(m=0;m<ps;++m){newpoints.push(points[i+m])}i+=ps}else if(j>=otherpoints.length){if(!withlines){for(m=0;m<ps;++m){newpoints.push(points[i+m])}}i+=ps}else if(otherpoints[j]==null){for(m=0;m<ps;++m){newpoints.push(null)}fromgap=true;j+=otherps}else{px=points[i];py=points[i+1];qx=otherpoints[j];qy=otherpoints[j+1];bottom=0;if(px===qx){for(m=0;m<ps;++m){newpoints.push(points[i+m])}bottom=qy;i+=ps;j+=otherps}else if(px>qx){if(withlines&&i>0&&points[i-ps]!=null){intery=py+(points[i-ps+1]-py)*(qx-px)/(points[i-ps]-px);newpoints.push(qx);newpoints.push(intery);for(m=2;m<ps;++m){newpoints.push(points[i+m])}bottom=qy}j+=otherps}else{if(fromgap&&withlines){i+=ps;continue}for(m=0;m<ps;++m){newpoints.push(points[i+m])}if(withlines&&j>0&&otherpoints[j-otherps]!=null){bottom=qy+(otherpoints[j-otherps+1]-qy)*(px-qx)/(otherpoints[j-otherps]-qx)}i+=ps}fromgap=false;if(l!==newpoints.length&&withbottom){newpoints[l+2]=bottom}}if(withsteps&&l!==newpoints.length&&l>0&&newpoints[l]!==null&&newpoints[l]!==newpoints[l-ps]&&newpoints[l+1]!==newpoints[l-ps+1]){for(m=0;m<ps;++m){newpoints[l+ps+m]=newpoints[l+m]}newpoints[l+1]=newpoints[l-ps+1]}}datapoints.points=newpoints}plot.hooks.processDatapoints.push(computeFillBottoms)}$.plot.plugins.push({init:init,options:options,name:"fillbetween",version:"1.0"})})(jQuery);
(function($){var options={xaxis:{timezone:null,timeformat:null,twelveHourClock:false,monthNames:null}};function floorInBase(n,base){return base*Math.floor(n/base)}function formatDate(d,fmt,monthNames,dayNames){if(typeof d.strftime=="function"){return d.strftime(fmt)}var leftPad=function(n,pad){n=""+n;pad=""+(pad==null?"0":pad);return n.length==1?pad+n:n};var r=[];var escape=false;var hours=d.getHours();var isAM=hours<12;if(monthNames==null){monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}if(dayNames==null){dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}var hours12;if(hours>12){hours12=hours-12}else if(hours==0){hours12=12}else{hours12=hours}for(var i=0;i<fmt.length;++i){var c=fmt.charAt(i);if(escape){switch(c){case"a":c=""+dayNames[d.getDay()];break;case"b":c=""+monthNames[d.getMonth()];break;case"d":c=leftPad(d.getDate());break;case"e":c=leftPad(d.getDate()," ");break;case"h":case"H":c=leftPad(hours);break;case"I":c=leftPad(hours12);break;case"l":c=leftPad(hours12," ");break;case"m":c=leftPad(d.getMonth()+1);break;case"M":c=leftPad(d.getMinutes());break;case"q":c=""+(Math.floor(d.getMonth()/3)+1);break;case"S":c=leftPad(d.getSeconds());break;case"y":c=leftPad(d.getFullYear()%100);break;case"Y":c=""+d.getFullYear();break;case"p":c=isAM?""+"am":""+"pm";break;case"P":c=isAM?""+"AM":""+"PM";break;case"w":c=""+d.getDay();break}r.push(c);escape=false}else{if(c=="%"){escape=true}else{r.push(c)}}}return r.join("")}function makeUtcWrapper(d){function addProxyMethod(sourceObj,sourceMethod,targetObj,targetMethod){sourceObj[sourceMethod]=function(){return targetObj[targetMethod].apply(targetObj,arguments)}}var utc={date:d};if(d.strftime!=undefined){addProxyMethod(utc,"strftime",d,"strftime")}addProxyMethod(utc,"getTime",d,"getTime");addProxyMethod(utc,"setTime",d,"setTime");var props=["Date","Day","FullYear","Hours","Milliseconds","Minutes","Month","Seconds"];for(var p=0;p<props.length;p++){addProxyMethod(utc,"get"+props[p],d,"getUTC"+props[p]);addProxyMethod(utc,"set"+props[p],d,"setUTC"+props[p])}return utc}function dateGenerator(ts,opts){if(opts.timezone=="browser"){return new Date(ts)}else if(!opts.timezone||opts.timezone=="utc"){return makeUtcWrapper(new Date(ts))}else if(typeof timezoneJS!="undefined"&&typeof timezoneJS.Date!="undefined"){var d=new timezoneJS.Date;d.setTimezone(opts.timezone);d.setTime(ts);return d}else{return makeUtcWrapper(new Date(ts))}}var timeUnitSize={second:1e3,minute:60*1e3,hour:60*60*1e3,day:24*60*60*1e3,month:30*24*60*60*1e3,quarter:3*30*24*60*60*1e3,year:365.2425*24*60*60*1e3};var baseSpec=[[1,"second"],[2,"second"],[5,"second"],[10,"second"],[30,"second"],[1,"minute"],[2,"minute"],[5,"minute"],[10,"minute"],[30,"minute"],[1,"hour"],[2,"hour"],[4,"hour"],[8,"hour"],[12,"hour"],[1,"day"],[2,"day"],[3,"day"],[.25,"month"],[.5,"month"],[1,"month"],[2,"month"]];var specMonths=baseSpec.concat([[3,"month"],[6,"month"],[1,"year"]]);var specQuarters=baseSpec.concat([[1,"quarter"],[2,"quarter"],[1,"year"]]);function init(plot){plot.hooks.processOptions.push(function(plot,options){$.each(plot.getAxes(),function(axisName,axis){var opts=axis.options;if(opts.mode=="time"){axis.tickGenerator=function(axis){var ticks=[];var d=dateGenerator(axis.min,opts);var minSize=0;var spec=opts.tickSize&&opts.tickSize[1]==="quarter"||opts.minTickSize&&opts.minTickSize[1]==="quarter"?specQuarters:specMonths;if(opts.minTickSize!=null){if(typeof opts.tickSize=="number"){minSize=opts.tickSize}else{minSize=opts.minTickSize[0]*timeUnitSize[opts.minTickSize[1]]}}for(var i=0;i<spec.length-1;++i){if(axis.delta<(spec[i][0]*timeUnitSize[spec[i][1]]+spec[i+1][0]*timeUnitSize[spec[i+1][1]])/2&&spec[i][0]*timeUnitSize[spec[i][1]]>=minSize){break}}var size=spec[i][0];var unit=spec[i][1];if(unit=="year"){if(opts.minTickSize!=null&&opts.minTickSize[1]=="year"){size=Math.floor(opts.minTickSize[0])}else{var magn=Math.pow(10,Math.floor(Math.log(axis.delta/timeUnitSize.year)/Math.LN10));var norm=axis.delta/timeUnitSize.year/magn;if(norm<1.5){size=1}else if(norm<3){size=2}else if(norm<7.5){size=5}else{size=10}size*=magn}if(size<1){size=1}}axis.tickSize=opts.tickSize||[size,unit];var tickSize=axis.tickSize[0];unit=axis.tickSize[1];var step=tickSize*timeUnitSize[unit];if(unit=="second"){d.setSeconds(floorInBase(d.getSeconds(),tickSize))}else if(unit=="minute"){d.setMinutes(floorInBase(d.getMinutes(),tickSize))}else if(unit=="hour"){d.setHours(floorInBase(d.getHours(),tickSize))}else if(unit=="month"){d.setMonth(floorInBase(d.getMonth(),tickSize))}else if(unit=="quarter"){d.setMonth(3*floorInBase(d.getMonth()/3,tickSize))}else if(unit=="year"){d.setFullYear(floorInBase(d.getFullYear(),tickSize))}d.setMilliseconds(0);if(step>=timeUnitSize.minute){d.setSeconds(0)}if(step>=timeUnitSize.hour){d.setMinutes(0)}if(step>=timeUnitSize.day){d.setHours(0)}if(step>=timeUnitSize.day*4){d.setDate(1)}if(step>=timeUnitSize.month*2){d.setMonth(floorInBase(d.getMonth(),3))}if(step>=timeUnitSize.quarter*2){d.setMonth(floorInBase(d.getMonth(),6))}if(step>=timeUnitSize.year){d.setMonth(0)}var carry=0;var v=Number.NaN;var prev;do{prev=v;v=d.getTime();ticks.push(v);if(unit=="month"||unit=="quarter"){if(tickSize<1){d.setDate(1);var start=d.getTime();d.setMonth(d.getMonth()+(unit=="quarter"?3:1));var end=d.getTime();d.setTime(v+carry*timeUnitSize.hour+(end-start)*tickSize);carry=d.getHours();d.setHours(0)}else{d.setMonth(d.getMonth()+tickSize*(unit=="quarter"?3:1))}}else if(unit=="year"){d.setFullYear(d.getFullYear()+tickSize)}else{d.setTime(v+step)}}while(v<axis.max&&v!=prev);return ticks};axis.tickFormatter=function(v,axis){var d=dateGenerator(v,axis.options);if(opts.timeformat!=null){return formatDate(d,opts.timeformat,opts.monthNames,opts.dayNames)}var useQuarters=axis.options.tickSize&&axis.options.tickSize[1]=="quarter"||axis.options.minTickSize&&axis.options.minTickSize[1]=="quarter";var t=axis.tickSize[0]*timeUnitSize[axis.tickSize[1]];var span=axis.max-axis.min;var suffix=opts.twelveHourClock?" %p":"";var hourCode=opts.twelveHourClock?"%I":"%H";var fmt;if(t<timeUnitSize.minute){fmt=hourCode+":%M:%S"+suffix}else if(t<timeUnitSize.day){if(span<2*timeUnitSize.day){fmt=hourCode+":%M"+suffix}else{fmt="%b %d "+hourCode+":%M"+suffix}}else if(t<timeUnitSize.month){fmt="%b %d"}else if(useQuarters&&t<timeUnitSize.quarter||!useQuarters&&t<timeUnitSize.year){if(span<timeUnitSize.year){fmt="%b"}else{fmt="%b %Y"}}else if(useQuarters&&t<timeUnitSize.year){if(span<timeUnitSize.year){fmt="Q%q"}else{fmt="Q%q %Y"}}else{fmt="%Y"}var rt=formatDate(d,fmt,opts.monthNames,opts.dayNames);return rt}}})})}$.plot.plugins.push({init:init,options:options,name:"time",version:"1.0"});$.plot.formatDate=formatDate})(jQuery);
(function(e,t,n,r){"use strict";function s(e){if(typeof e==="string"||e instanceof String){e=e.replace(/^[\\/'"]+|(;\s?})+|[\\/'"]+$/g,"")}return e}if(e("head").has(".foundation-mq-small").length===0){e("head").append('<meta class="foundation-mq-small">')}if(e("head").has(".foundation-mq-medium").length===0){e("head").append('<meta class="foundation-mq-medium">')}if(e("head").has(".foundation-mq-large").length===0){e("head").append('<meta class="foundation-mq-large">')}if(e("head").has(".foundation-mq-xlarge").length===0){e("head").append('<meta class="foundation-mq-xlarge">')}if(e("head").has(".foundation-mq-xxlarge").length===0){e("head").append('<meta class="foundation-mq-xxlarge">')}e(function(){if(typeof FastClick!=="undefined"){FastClick.attach(n.body)}});if(typeof FastClick!=="undefined"){FastClick.attach(n.body)}var i=function(t,r){if(typeof t==="string"){if(r){return e(r.querySelectorAll(t))}return e(n.querySelectorAll(t))}return e(t,r)};t.matchMedia=t.matchMedia||function(e,t){"use strict";var n,r=e.documentElement,i=r.firstElementChild||r.firstChild,s=e.createElement("body"),o=e.createElement("div");o.id="mq-test-1";o.style.cssText="position:absolute;top:-100em";s.style.background="none";s.appendChild(o);return function(e){o.innerHTML='&shy;<style media="'+e+'"> #mq-test-1 { width: 42px; }</style>';r.insertBefore(s,i);n=o.offsetWidth===42;r.removeChild(s);return{matches:n,media:e}}}(n);(function(e){function u(){if(n){s(u);jQuery.fx.tick()}}var n,r=0,i=["webkit","moz"],s=t.requestAnimationFrame,o=t.cancelAnimationFrame;for(;r<i.length&&!s;r++){s=t[i[r]+"RequestAnimationFrame"];o=o||t[i[r]+"CancelAnimationFrame"]||t[i[r]+"CancelRequestAnimationFrame"]}if(s){t.requestAnimationFrame=s;t.cancelAnimationFrame=o;jQuery.fx.timer=function(e){if(e()&&jQuery.timers.push(e)&&!n){n=true;u()}};jQuery.fx.stop=function(){n=false}}else{t.requestAnimationFrame=function(e,n){var i=(new Date).getTime(),s=Math.max(0,16-(i-r)),o=t.setTimeout(function(){e(i+s)},s);r=i+s;return o};t.cancelAnimationFrame=function(e){clearTimeout(e)}}})(jQuery);t.Foundation={name:"Foundation",version:"5.0.0",media_queries:{small:i(".foundation-mq-small").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),medium:i(".foundation-mq-medium").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),large:i(".foundation-mq-large").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),xlarge:i(".foundation-mq-xlarge").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),xxlarge:i(".foundation-mq-xxlarge").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,"")},stylesheet:e("<style></style>").appendTo("head")[0].sheet,init:function(e,t,n,r,s){var o,u=[e,n,r,s],a=[];this.rtl=/rtl/i.test(i("html").attr("dir"));this.scope=e||this.scope;if(t&&typeof t==="string"&&!/reflow/i.test(t)){if(this.libs.hasOwnProperty(t)){a.push(this.init_lib(t,u))}}else{for(var f in this.libs){a.push(this.init_lib(f,t))}}return e},init_lib:function(e,t){if(this.libs.hasOwnProperty(e)){this.patch(this.libs[e]);if(t&&t.hasOwnProperty(e)){return this.libs[e].init.apply(this.libs[e],[this.scope,t[e]])}return this.libs[e].init.apply(this.libs[e],t)}return function(){}},patch:function(e){e.scope=this.scope;e["data_options"]=this.lib_methods.data_options;e["bindings"]=this.lib_methods.bindings;e["S"]=i;e.rtl=this.rtl},inherit:function(e,t){var n=t.split(" ");for(var r=n.length-1;r>=0;r--){if(this.lib_methods.hasOwnProperty(n[r])){this.libs[e.name][n[r]]=this.lib_methods[n[r]]}}},random_str:function(e){var t="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");if(!e){e=Math.floor(Math.random()*t.length)}var n="";for(var r=0;r<e;r++){n+=t[Math.floor(Math.random()*t.length)]}return n},libs:{},lib_methods:{throttle:function(e,t){var n=null;return function(){var r=this,i=arguments;clearTimeout(n);n=setTimeout(function(){e.apply(r,i)},t)}},data_options:function(t){function a(e){return!isNaN(e-0)&&e!==null&&e!==""&&e!==false&&e!==true}function f(t){if(typeof t==="string")return e.trim(t);return t}var n={},r,i,s,o,u=t.data("options");if(typeof u==="object"){return u}s=(u||":").split(";"),o=s.length;for(r=o-1;r>=0;r--){i=s[r].split(":");if(/true/i.test(i[1]))i[1]=true;if(/false/i.test(i[1]))i[1]=false;if(a(i[1]))i[1]=parseInt(i[1],10);if(i.length===2&&i[0].length>0){n[f(i[0])]=f(i[1])}}return n},delay:function(e,t){return setTimeout(e,t)},empty:function(e){if(e.length&&e.length>0)return false;if(e.length&&e.length===0)return true;for(var t in e){if(hasOwnProperty.call(e,t))return false}return true},register_media:function(t,n){if(Foundation.media_queries[t]===r){e("head").append('<meta class="'+n+'">');Foundation.media_queries[t]=s(e("."+n).css("font-family"))}},addCustomRule:function(e,t){if(t===r){Foundation.stylesheet.insertRule(e,Foundation.stylesheet.cssRules.length)}else{var n=Foundation.media_queries[t];if(n!==r){Foundation.stylesheet.insertRule("@media "+Foundation.media_queries[t]+"{ "+e+" }")}}},loaded:function(e,t){function n(){t(e[0])}function r(){this.one("load",n);if(/MSIE (\d+\.\d+);/.test(navigator.userAgent)){var e=this.attr("src"),t=e.match(/\?/)?"&":"?";t+="random="+(new Date).getTime();this.attr("src",e+t)}}if(!e.attr("src")){n();return}if(e[0].complete||e[0].readyState===4){n()}else{r.call(e)}},bindings:function(t,n){var r=this,s=!i(this).data(this.name+"-init");if(typeof t==="string"){return this[t].call(this)}if(i(this.scope).is("[data-"+this.name+"]")){i(this.scope).data(this.name+"-init",e.extend({},this.settings,n||t,this.data_options(i(this.scope))));if(s){this.events(this.scope)}}else{i("[data-"+this.name+"]",this.scope).each(function(){var s=!i(this).data(r.name+"-init");i(this).data(r.name+"-init",e.extend({},r.settings,n||t,r.data_options(i(this))));if(s){r.events(this)}})}}}};e.fn.foundation=function(){var e=Array.prototype.slice.call(arguments,0);return this.each(function(){Foundation.init.apply(Foundation,[this].concat(e));return this})}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.abide={name:"abide",version:"5.0.0",settings:{focus_on_invalid:true,timeout:1e3,patterns:{alpha:/[a-zA-Z]+/,alpha_numeric:/[a-zA-Z0-9]+/,integer:/-?\d+/,number:/-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?/,password:/(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,card:/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,cvv:/^([0-9]){3,4}$/,email:/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,url:/(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/,domain:/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/,datetime:/([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))/,date:/(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))/,time:/(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}/,dateISO:/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/,month_day_year:/(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d/,color:/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/}},timer:null,init:function(e,t,n){this.bindings(t,n)},events:function(t){var n=this,r=e(t).attr("novalidate","novalidate"),i=r.data("abide-init");r.off(".abide").on("submit.fndtn.abide validate.fndtn.abide",function(t){var r=/ajax/i.test(e(this).attr("data-abide"));return n.validate(e(this).find("input, textarea, select").get(),t,r)}).find("input, textarea, select").off(".abide").on("blur.fndtn.abide change.fndtn.abide",function(e){n.validate([this],e)}).on("keydown.fndtn.abide",function(t){var r=e(this).closest("form").data("abide-init");clearTimeout(n.timer);n.timer=setTimeout(function(){n.validate([this],t)}.bind(this),r.timeout)})},validate:function(t,n,r){var i=this.parse_patterns(t),s=i.length,o=e(t[0]).closest("form"),u=/submit/.test(n.type);for(var a=0;a<s;a++){if(!i[a]&&(u||r)){if(this.settings.focus_on_invalid)t[a].focus();o.trigger("invalid");e(t[a]).closest("form").attr("data-invalid","");return false}}if(u||r){o.trigger("valid")}o.removeAttr("data-invalid");if(r)return false;return true},parse_patterns:function(e){var t=e.length,n=[];for(var r=t-1;r>=0;r--){n.push(this.pattern(e[r]))}return this.check_validation_and_apply_styles(n)},pattern:function(e){var t=e.getAttribute("type"),n=typeof e.getAttribute("required")==="string";if(this.settings.patterns.hasOwnProperty(t)){return[e,this.settings.patterns[t],n]}var r=e.getAttribute("pattern")||"";if(this.settings.patterns.hasOwnProperty(r)&&r.length>0){return[e,this.settings.patterns[r],n]}else if(r.length>0){return[e,new RegExp(r),n]}r=/.*/;return[e,r,n]},check_validation_and_apply_styles:function(t){var n=t.length,r=[];for(var i=n-1;i>=0;i--){var s=t[i][0],o=t[i][2],u=s.value,a=s.getAttribute("data-equalto"),f=s.type==="radio",l=o?s.value.length>0:true;if(f&&o){r.push(this.valid_radio(s,o))}else if(a&&o){r.push(this.valid_equal(s,o))}else{if(t[i][1].test(u)&&l||!o&&s.value.length<1){e(s).removeAttr("data-invalid").parent().removeClass("error");r.push(true)}else{e(s).attr("data-invalid","").parent().addClass("error");r.push(false)}}}return r},valid_radio:function(t,r){var i=t.getAttribute("name"),s=n.getElementsByName(i),o=s.length,u=false;for(var a=0;a<o;a++){if(s[a].checked)u=true}for(var a=0;a<o;a++){if(u){e(s[a]).removeAttr("data-invalid").parent().removeClass("error")}else{e(s[a]).attr("data-invalid","").parent().addClass("error")}}return u},valid_equal:function(t,r){var i=n.getElementById(t.getAttribute("data-equalto")).value,s=t.value,o=i===s;if(o){e(t).removeAttr("data-invalid").parent().removeClass("error")}else{e(t).attr("data-invalid","").parent().addClass("error")}return o}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.accordion={name:"accordion",version:"5.0.1",settings:{active_class:"active",toggleable:true},init:function(e,t,n){this.bindings(t,n)},events:function(){e(this.scope).off(".accordion").on("click.fndtn.accordion","[data-accordion] > dd > a",function(t){var n=e(this).parent(),r=e("#"+this.href.split("#")[1]),i=e("> dd > .content",r.closest("[data-accordion]")),s=n.parent().data("accordion-init"),o=e("> dd > .content."+s.active_class,n.parent());t.preventDefault();if(o[0]==r[0]&&s.toggleable){return r.toggleClass(s.active_class)}i.removeClass(s.active_class);r.addClass(s.active_class)})},off:function(){},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.alert={name:"alert",version:"5.0.0",settings:{animation:"fadeOut",speed:300,callback:function(){}},init:function(e,t,n){this.bindings(t,n)},events:function(){e(this.scope).off(".alert").on("click.fndtn.alert","[data-alert] a.close",function(t){var n=e(this).closest("[data-alert]"),r=n.data("alert-init");t.preventDefault();n[r.animation](r.speed,function(){e(this).trigger("closed").remove();r.callback()})})},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.clearing={name:"clearing",version:"5.0.0",settings:{templates:{viewing:'<a href="#" class="clearing-close">&times;</a>'+'<div class="visible-img" style="display: none"><img src="//:0">'+'<p class="clearing-caption"></p><a href="#" class="clearing-main-prev"><span></span></a>'+'<a href="#" class="clearing-main-next"><span></span></a></div>'},close_selectors:".clearing-close",init:false,locked:false},init:function(t,n,r){var i=this;Foundation.inherit(this,"throttle loaded");this.bindings(n,r);if(e(this.scope).is("[data-clearing]")){this.assemble(e("li",this.scope))}else{e("[data-clearing]",this.scope).each(function(){i.assemble(e("li",this))})}},events:function(n){var r=this;e(this.scope).off(".clearing").on("click.fndtn.clearing","ul[data-clearing] li",function(t,n,i){var n=n||e(this),i=i||n,s=n.next("li"),o=n.closest("[data-clearing]").data("clearing-init"),u=e(t.target);t.preventDefault();if(!o){r.init();o=n.closest("[data-clearing]").data("clearing-init")}if(i.hasClass("visible")&&n[0]===i[0]&&s.length>0&&r.is_open(n)){i=s;u=e("img",i)}r.open(u,n,i);r.update_paddles(i)}).on("click.fndtn.clearing",".clearing-main-next",function(e){r.nav(e,"next")}).on("click.fndtn.clearing",".clearing-main-prev",function(e){r.nav(e,"prev")}).on("click.fndtn.clearing",this.settings.close_selectors,function(e){Foundation.libs.clearing.close(e,this)}).on("keydown.fndtn.clearing",function(e){r.keydown(e)});e(t).off(".clearing").on("resize.fndtn.clearing",function(){r.resize()});this.swipe_events(n)},swipe_events:function(t){var n=this;e(this.scope).on("touchstart.fndtn.clearing",".visible-img",function(t){if(!t.touches){t=t.originalEvent}var n={start_page_x:t.touches[0].pageX,start_page_y:t.touches[0].pageY,start_time:(new Date).getTime(),delta_x:0,is_scrolling:r};e(this).data("swipe-transition",n);t.stopPropagation()}).on("touchmove.fndtn.clearing",".visible-img",function(t){if(!t.touches){t=t.originalEvent}if(t.touches.length>1||t.scale&&t.scale!==1)return;var r=e(this).data("swipe-transition");if(typeof r==="undefined"){r={}}r.delta_x=t.touches[0].pageX-r.start_page_x;if(typeof r.is_scrolling==="undefined"){r.is_scrolling=!!(r.is_scrolling||Math.abs(r.delta_x)<Math.abs(t.touches[0].pageY-r.start_page_y))}if(!r.is_scrolling&&!r.active){t.preventDefault();var i=r.delta_x<0?"next":"prev";r.active=true;n.nav(t,i)}}).on("touchend.fndtn.clearing",".visible-img",function(t){e(this).data("swipe-transition",{});t.stopPropagation()})},assemble:function(t){var n=t.parent();if(n.parent().hasClass("carousel"))return;n.after('<div id="foundationClearingHolder"></div>');var r=e("#foundationClearingHolder"),i=n.data("clearing-init"),s=n.detach(),o={grid:'<div class="carousel">'+s[0].outerHTML+"</div>",viewing:i.templates.viewing},u='<div class="clearing-assembled"><div>'+o.viewing+o.grid+"</div></div>";return r.after(u).remove()},open:function(t,n,r){var i=r.closest(".clearing-assembled"),s=e("div",i).first(),o=e(".visible-img",s),u=e("img",o).not(t);if(!this.locked()){u.attr("src",this.load(t)).css("visibility","hidden");this.loaded(u,function(){u.css("visibility","visible");i.addClass("clearing-blackout");s.addClass("clearing-container");o.show();this.fix_height(r).caption(e(".clearing-caption",o),t).center(u).shift(n,r,function(){r.siblings().removeClass("visible");r.addClass("visible")})}.bind(this))}},close:function(t,n){t.preventDefault();var r=function(e){if(/blackout/.test(e.selector)){return e}else{return e.closest(".clearing-blackout")}}(e(n)),i,s;if(n===t.target&&r){i=e("div",r).first();s=e(".visible-img",i);this.settings.prev_index=0;e("ul[data-clearing]",r).attr("style","").closest(".clearing-blackout").removeClass("clearing-blackout");i.removeClass("clearing-container");s.hide()}return false},is_open:function(e){return e.parent().prop("style").length>0},keydown:function(t){var n=e("ul[data-clearing]",".clearing-blackout");if(t.which===39)this.go(n,"next");if(t.which===37)this.go(n,"prev");if(t.which===27)e("a.clearing-close").trigger("click")},nav:function(t,n){var r=e("ul[data-clearing]",".clearing-blackout");t.preventDefault();this.go(r,n)},resize:function(){var t=e("img",".clearing-blackout .visible-img");if(t.length){this.center(t)}},fix_height:function(t){var n=t.parent().children(),r=this;n.each(function(){var t=e(this),n=t.find("img");if(t.height()>n.outerHeight()){t.addClass("fix-height")}}).closest("ul").width(n.length*100+"%");return this},update_paddles:function(t){var n=t.closest(".carousel").siblings(".visible-img");if(t.next().length>0){e(".clearing-main-next",n).removeClass("disabled")}else{e(".clearing-main-next",n).addClass("disabled")}if(t.prev().length>0){e(".clearing-main-prev",n).removeClass("disabled")}else{e(".clearing-main-prev",n).addClass("disabled")}},center:function(e){if(!this.rtl){e.css({marginLeft:-(e.outerWidth()/2),marginTop:-(e.outerHeight()/2)})}else{e.css({marginRight:-(e.outerWidth()/2),marginTop:-(e.outerHeight()/2)})}return this},load:function(e){if(e[0].nodeName==="A"){var t=e.attr("href")}else{var t=e.parent().attr("href")}this.preload(e);if(t)return t;return e.attr("src")},preload:function(e){this.img(e.closest("li").next()).img(e.closest("li").prev())},img:function(t){if(t.length){var n=new Image,r=e("a",t);if(r.length){n.src=r.attr("href")}else{n.src=e("img",t).attr("src")}}return this},caption:function(e,t){var n=t.data("caption");if(n){e.html(n).show()}else{e.text("").hide()}return this},go:function(t,n){var r=e(".visible",t),i=r[n]();if(i.length){e("img",i).trigger("click",[r,i])}},shift:function(e,t,n){var r=t.parent(),i=this.settings.prev_index||t.index(),s=this.direction(r,e,t),o=parseInt(r.css("left"),10),u=t.outerWidth(),a;if(t.index()!==i&&!/skip/.test(s)){if(/left/.test(s)){this.lock();r.animate({left:o+u},300,this.unlock())}else if(/right/.test(s)){this.lock();r.animate({left:o-u},300,this.unlock())}}else if(/skip/.test(s)){a=t.index()-this.settings.up_count;this.lock();if(a>0){r.animate({left:-(a*u)},300,this.unlock())}else{r.animate({left:0},300,this.unlock())}}n()},direction:function(t,n,r){var i=e("li",t),s=i.outerWidth()+i.outerWidth()/4,o=Math.floor(e(".clearing-container").outerWidth()/s)-1,u=i.index(r),a;this.settings.up_count=o;if(this.adjacent(this.settings.prev_index,u)){if(u>o&&u>this.settings.prev_index){a="right"}else if(u>o-1&&u<=this.settings.prev_index){a="left"}else{a=false}}else{a="skip"}this.settings.prev_index=u;return a},adjacent:function(e,t){for(var n=t+1;n>=t-1;n--){if(n===e)return true}return false},lock:function(){this.settings.locked=true},unlock:function(){this.settings.locked=false},locked:function(){return this.settings.locked},off:function(){e(this.scope).off(".fndtn.clearing");e(t).off(".fndtn.clearing")},reflow:function(){this.init()}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.dropdown={name:"dropdown",version:"5.0.0",settings:{active_class:"open",is_hover:false,opened:function(){},closed:function(){}},init:function(e,t,n){Foundation.inherit(this,"throttle");this.bindings(t,n)},events:function(n){var r=this;e(this.scope).off(".dropdown").on("click.fndtn.dropdown","[data-dropdown]",function(t){var n=e(this).data("dropdown-init");t.preventDefault();if(!n.is_hover||Modernizr.touch)r.toggle(e(this))}).on("mouseenter.fndtn.dropdown","[data-dropdown], [data-dropdown-content]",function(t){var n=e(this);clearTimeout(r.timeout);if(n.data("dropdown")){var i=e("#"+n.data("dropdown")),s=n}else{var i=n;s=e("[data-dropdown='"+i.attr("id")+"']")}var o=s.data("dropdown-init");if(o.is_hover)r.open.apply(r,[i,s])}).on("mouseleave.fndtn.dropdown","[data-dropdown], [data-dropdown-content]",function(t){var n=e(this);r.timeout=setTimeout(function(){if(n.data("dropdown")){var t=n.data("dropdown-init");if(t.is_hover)r.close.call(r,e("#"+n.data("dropdown")))}else{var i=e('[data-dropdown="'+e(this).attr("id")+'"]'),t=i.data("dropdown-init");if(t.is_hover)r.close.call(r,n)}}.bind(this),150)}).on("click.fndtn.dropdown",function(t){var n=e(t.target).closest("[data-dropdown-content]");if(e(t.target).data("dropdown")||e(t.target).parent().data("dropdown")){return}if(!e(t.target).data("revealId")&&n.length>0&&(e(t.target).is("[data-dropdown-content]")||e.contains(n.first()[0],t.target))){t.stopPropagation();return}r.close.call(r,e("[data-dropdown-content]"))}).on("opened.fndtn.dropdown","[data-dropdown-content]",this.settings.opened).on("closed.fndtn.dropdown","[data-dropdown-content]",this.settings.closed);e(t).off(".dropdown").on("resize.fndtn.dropdown",r.throttle(function(){r.resize.call(r)},50)).trigger("resize")},close:function(t){var n=this;t.each(function(){if(e(this).hasClass(n.settings.active_class)){e(this).css(Foundation.rtl?"right":"left","-99999px").removeClass(n.settings.active_class);e(this).trigger("closed")}})},open:function(e,t){this.css(e.addClass(this.settings.active_class),t);e.trigger("opened")},toggle:function(t){var n=e("#"+t.data("dropdown"));if(n.length===0){return}this.close.call(this,e("[data-dropdown-content]").not(n));if(n.hasClass(this.settings.active_class)){this.close.call(this,n)}else{this.close.call(this,e("[data-dropdown-content]"));this.open.call(this,n,t)}},resize:function(){var t=e("[data-dropdown-content].open"),n=e("[data-dropdown='"+t.attr("id")+"']");if(t.length&&n.length){this.css(t,n)}},css:function(n,r){var i=n.offsetParent(),s=r.offset();s.top-=i.offset().top;s.left-=i.offset().left;if(this.small()){n.css({position:"absolute",width:"95%","max-width":"none",top:s.top+r.outerHeight()});n.css(Foundation.rtl?"right":"left","2.5%")}else{if(!Foundation.rtl&&e(t).width()>n.outerWidth()+r.offset().left){var o=s.left;if(n.hasClass("right")){n.removeClass("right")}}else{if(!n.hasClass("right")){n.addClass("right")}var o=s.left-(n.outerWidth()-r.outerWidth())}n.attr("style","").css({position:"absolute",top:s.top+r.outerHeight(),left:o})}return n},small:function(){return matchMedia(Foundation.media_queries.small).matches&&!matchMedia(Foundation.media_queries.medium).matches},off:function(){e(this.scope).off(".fndtn.dropdown");e("html, body").off(".fndtn.dropdown");e(t).off(".fndtn.dropdown");e("[data-dropdown-content]").off(".fndtn.dropdown");this.settings.init=false},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.interchange={name:"interchange",version:"5.0.0",cache:{},images_loaded:false,nodes_loaded:false,settings:{load_attr:"interchange",named_queries:{"default":Foundation.media_queries.small,small:Foundation.media_queries.small,medium:Foundation.media_queries.medium,large:Foundation.media_queries.large,xlarge:Foundation.media_queries.xlarge,xxlarge:Foundation.media_queries.xxlarge,landscape:"only screen and (orientation: landscape)",portrait:"only screen and (orientation: portrait)",retina:"only screen and (-webkit-min-device-pixel-ratio: 2),"+"only screen and (min--moz-device-pixel-ratio: 2),"+"only screen and (-o-min-device-pixel-ratio: 2/1),"+"only screen and (min-device-pixel-ratio: 2),"+"only screen and (min-resolution: 192dpi),"+"only screen and (min-resolution: 2dppx)"},directives:{replace:function(t,n,r){if(/IMG/.test(t[0].nodeName)){var i=t[0].src;if((new RegExp(n,"i")).test(i))return;t[0].src=n;return r(t[0].src)}var s=t.data("interchange-last-path");if(s==n)return;return e.get(n,function(e){t.html(e);t.data("interchange-last-path",n);r()})}}},init:function(e,t,n){Foundation.inherit(this,"throttle");this.data_attr="data-"+this.settings.load_attr;this.bindings(t,n);this.load("images");this.load("nodes")},events:function(){var n=this;e(t).off(".interchange").on("resize.fndtn.interchange",n.throttle(function(){n.resize.call(n)},50));return this},resize:function(){var t=this.cache;if(!this.images_loaded||!this.nodes_loaded){setTimeout(e.proxy(this.resize,this),50);return}for(var n in t){if(t.hasOwnProperty(n)){var r=this.results(n,t[n]);if(r){this.settings.directives[r.scenario[1]](r.el,r.scenario[0],function(){if(arguments[0]instanceof Array){var e=arguments[0]}else{var e=Array.prototype.slice.call(arguments,0)}r.el.trigger(r.scenario[1],e)})}}}},results:function(e,t){var n=t.length;if(n>0){var r=this.S('[data-uuid="'+e+'"]');for(var i=n-1;i>=0;i--){var s,o=t[i][2];if(this.settings.named_queries.hasOwnProperty(o)){s=matchMedia(this.settings.named_queries[o])}else{s=matchMedia(o)}if(s.matches){return{el:r,scenario:t[i]}}}}return false},load:function(e,t){if(typeof this["cached_"+e]==="undefined"||t){this["update_"+e]()}return this["cached_"+e]},update_images:function(){var e=this.S("img["+this.data_attr+"]"),t=e.length,n=0,r=this.data_attr;this.cache={};this.cached_images=[];this.images_loaded=t===0;for(var i=t-1;i>=0;i--){n++;if(e[i]){var s=e[i].getAttribute(r)||"";if(s.length>0){this.cached_images.push(e[i])}}if(n===t){this.images_loaded=true;this.enhance("images")}}return this},update_nodes:function(){var e=this.S("["+this.data_attr+"]:not(img)"),t=e.length,n=0,r=this.data_attr;this.cached_nodes=[];this.nodes_loaded=t===0;for(var i=t-1;i>=0;i--){n++;var s=e[i].getAttribute(r)||"";if(s.length>0){this.cached_nodes.push(e[i])}if(n===t){this.nodes_loaded=true;this.enhance("nodes")}}return this},enhance:function(n){var r=this["cached_"+n].length;for(var i=r-1;i>=0;i--){this.object(e(this["cached_"+n][i]))}return e(t).trigger("resize")},parse_params:function(e,t,n){return[this.trim(e),this.convert_directive(t),this.trim(n)]},convert_directive:function(e){var t=this.trim(e);if(t.length>0){return t}return"replace"},object:function(e){var t=this.parse_data_attr(e),n=[],r=t.length;if(r>0){for(var i=r-1;i>=0;i--){var s=t[i].split(/\((.*?)(\))$/);if(s.length>1){var o=s[0].split(","),u=this.parse_params(o[0],o[1],s[1]);n.push(u)}}}return this.store(e,n)},uuid:function(e){function n(){return((1+Math.random())*65536|0).toString(16).substring(1)}var t=e||"-";return n()+n()+t+n()+t+n()+t+n()+t+n()+n()+n()},store:function(e,t){var n=this.uuid(),r=e.data("uuid");if(r)return this.cache[r];e.attr("data-uuid",n);return this.cache[n]=t},trim:function(t){if(typeof t==="string"){return e.trim(t)}return t},parse_data_attr:function(e){var t=e.data(this.settings.load_attr).split(/\[(.*?)\]/),n=t.length,r=[];for(var i=n-1;i>=0;i--){if(t[i].replace(/[\W\d]+/,"").length>4){r.push(t[i])}}return r},reflow:function(){this.load("images",true);this.load("nodes",true)}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";var i=i||false;Foundation.libs.joyride={name:"joyride",version:"5.0.0",defaults:{expose:false,modal:true,tip_location:"bottom",nub_position:"auto",scroll_speed:1500,scroll_animation:"linear",timer:0,start_timer_on_click:true,start_offset:0,next_button:true,tip_animation:"fade",pause_after:[],exposed:[],tip_animation_fade_speed:300,cookie_monster:false,cookie_name:"joyride",cookie_domain:false,cookie_expires:365,tip_container:"body",tip_location_patterns:{top:["bottom"],bottom:[],left:["right","top","bottom"],right:["left","top","bottom"]},post_ride_callback:function(){},post_step_callback:function(){},pre_step_callback:function(){},pre_ride_callback:function(){},post_expose_callback:function(){},template:{link:'<a href="#close" class="joyride-close-tip">&times;</a>',timer:'<div class="joyride-timer-indicator-wrap"><span class="joyride-timer-indicator"></span></div>',tip:'<div class="joyride-tip-guide"><span class="joyride-nub"></span></div>',wrapper:'<div class="joyride-content-wrapper"></div>',button:'<a href="#" class="small button joyride-next-tip"></a>',modal:'<div class="joyride-modal-bg"></div>',expose:'<div class="joyride-expose-wrapper"></div>',expose_cover:'<div class="joyride-expose-cover"></div>'},expose_add_class:""},init:function(e,t,n){Foundation.inherit(this,"throttle delay");this.settings=this.defaults;this.bindings(t,n)},events:function(){var n=this;e(this.scope).off(".joyride").on("click.fndtn.joyride",".joyride-next-tip, .joyride-modal-bg",function(e){e.preventDefault();if(this.settings.$li.next().length<1){this.end()}else if(this.settings.timer>0){clearTimeout(this.settings.automate);this.hide();this.show();this.startTimer()}else{this.hide();this.show()}}.bind(this)).on("click.fndtn.joyride",".joyride-close-tip",function(e){e.preventDefault();this.end()}.bind(this));e(t).off(".joyride").on("resize.fndtn.joyride",n.throttle(function(){if(e("[data-joyride]").length>0&&n.settings.$next_tip){if(n.settings.exposed.length>0){var t=e(n.settings.exposed);t.each(function(){var t=e(this);n.un_expose(t);n.expose(t)})}if(n.is_phone()){n.pos_phone()}else{n.pos_default(false,true)}}},100))},start:function(){var t=this,n=e("[data-joyride]",this.scope),r=["timer","scrollSpeed","startOffset","tipAnimationFadeSpeed","cookieExpires"],i=r.length;if(!n.length>0)return;if(!this.settings.init)this.events();this.settings=n.data("joyride-init");this.settings.$content_el=n;this.settings.$body=e(this.settings.tip_container);this.settings.body_offset=e(this.settings.tip_container).position();this.settings.$tip_content=this.settings.$content_el.find("> li");this.settings.paused=false;this.settings.attempts=0;if(typeof e.cookie!=="function"){this.settings.cookie_monster=false}if(!this.settings.cookie_monster||this.settings.cookie_monster&&e.cookie(this.settings.cookie_name)===null){this.settings.$tip_content.each(function(n){var s=e(this);this.settings=e.extend({},t.defaults,t.data_options(s));for(var o=i-1;o>=0;o--){t.settings[r[o]]=parseInt(t.settings[r[o]],10)}t.create({$li:s,index:n})});if(!this.settings.start_timer_on_click&&this.settings.timer>0){this.show("init");this.startTimer()}else{this.show("init")}}},resume:function(){this.set_li();this.show()},tip_template:function(t){var n,r;t.tip_class=t.tip_class||"";n=e(this.settings.template.tip).addClass(t.tip_class);r=e.trim(e(t.li).html())+this.button_text(t.button_text)+this.settings.template.link+this.timer_instance(t.index);n.append(e(this.settings.template.wrapper));n.first().attr("data-index",t.index);e(".joyride-content-wrapper",n).append(r);return n[0]},timer_instance:function(t){var n;if(t===0&&this.settings.start_timer_on_click&&this.settings.timer>0||this.settings.timer===0){n=""}else{n=e(this.settings.template.timer)[0].outerHTML}return n},button_text:function(t){if(this.settings.next_button){t=e.trim(t)||"Next";t=e(this.settings.template.button).append(t)[0].outerHTML}else{t=""}return t},create:function(t){var n=t.$li.attr("data-button")||t.$li.attr("data-text"),r=t.$li.attr("class"),i=e(this.tip_template({tip_class:r,index:t.index,button_text:n,li:t.$li}));e(this.settings.tip_container).append(i)},show:function(t){var n=null;if(this.settings.$li===r||e.inArray(this.settings.$li.index(),this.settings.pause_after)===-1){if(this.settings.paused){this.settings.paused=false}else{this.set_li(t)}this.settings.attempts=0;if(this.settings.$li.length&&this.settings.$target.length>0){if(t){this.settings.pre_ride_callback(this.settings.$li.index(),this.settings.$next_tip);if(this.settings.modal){this.show_modal()}}this.settings.pre_step_callback(this.settings.$li.index(),this.settings.$next_tip);if(this.settings.modal&&this.settings.expose){this.expose()}this.settings.tip_settings=e.extend({},this.settings,this.data_options(this.settings.$li));this.settings.timer=parseInt(this.settings.timer,10);this.settings.tip_settings.tip_location_pattern=this.settings.tip_location_patterns[this.settings.tip_settings.tip_location];if(!/body/i.test(this.settings.$target.selector)){this.scroll_to()}if(this.is_phone()){this.pos_phone(true)}else{this.pos_default(true)}n=this.settings.$next_tip.find(".joyride-timer-indicator");if(/pop/i.test(this.settings.tip_animation)){n.width(0);if(this.settings.timer>0){this.settings.$next_tip.show();this.delay(function(){n.animate({width:n.parent().width()},this.settings.timer,"linear")}.bind(this),this.settings.tip_animation_fade_speed)}else{this.settings.$next_tip.show()}}else if(/fade/i.test(this.settings.tip_animation)){n.width(0);if(this.settings.timer>0){this.settings.$next_tip.fadeIn(this.settings.tip_animation_fade_speed).show();this.delay(function(){n.animate({width:n.parent().width()},this.settings.timer,"linear")}.bind(this),this.settings.tip_animation_fadeSpeed)}else{this.settings.$next_tip.fadeIn(this.settings.tip_animation_fade_speed)}}this.settings.$current_tip=this.settings.$next_tip}else if(this.settings.$li&&this.settings.$target.length<1){this.show()}else{this.end()}}else{this.settings.paused=true}},is_phone:function(){return matchMedia(Foundation.media_queries.small).matches&&!matchMedia(Foundation.media_queries.medium).matches},hide:function(){if(this.settings.modal&&this.settings.expose){this.un_expose()}if(!this.settings.modal){e(".joyride-modal-bg").hide()}this.settings.$current_tip.css("visibility","hidden");setTimeout(e.proxy(function(){this.hide();this.css("visibility","visible")},this.settings.$current_tip),0);this.settings.post_step_callback(this.settings.$li.index(),this.settings.$current_tip)},set_li:function(e){if(e){this.settings.$li=this.settings.$tip_content.eq(this.settings.start_offset);this.set_next_tip();this.settings.$current_tip=this.settings.$next_tip}else{this.settings.$li=this.settings.$li.next();this.set_next_tip()}this.set_target()},set_next_tip:function(){this.settings.$next_tip=e(".joyride-tip-guide").eq(this.settings.$li.index());this.settings.$next_tip.data("closed","")},set_target:function(){var t=this.settings.$li.attr("data-class"),r=this.settings.$li.attr("data-id"),i=function(){if(r){return e(n.getElementById(r))}else if(t){return e("."+t).first()}else{return e("body")}};this.settings.$target=i()},scroll_to:function(){var n,r;n=e(t).height()/2;r=Math.ceil(this.settings.$target.offset().top-n+this.settings.$next_tip.outerHeight());if(r>0){e("html, body").animate({scrollTop:r},this.settings.scroll_speed,"swing")}},paused:function(){return e.inArray(this.settings.$li.index()+1,this.settings.pause_after)===-1},restart:function(){this.hide();this.settings.$li=r;this.show("init")},pos_default:function(n,r){var i=Math.ceil(e(t).height()/2),s=this.settings.$next_tip.offset(),o=this.settings.$next_tip.find(".joyride-nub"),u=Math.ceil(o.outerWidth()/2),a=Math.ceil(o.outerHeight()/2),f=n||false;if(f){this.settings.$next_tip.css("visibility","hidden");this.settings.$next_tip.show()}if(typeof r==="undefined"){r=false}if(!/body/i.test(this.settings.$target.selector)){if(this.bottom()){var l=this.settings.$target.offset().left;if(Foundation.rtl){l=this.settings.$target.offset().width-this.settings.$next_tip.width()+l}this.settings.$next_tip.css({top:this.settings.$target.offset().top+a+this.settings.$target.outerHeight(),left:l});this.nub_position(o,this.settings.tip_settings.nub_position,"top")}else if(this.top()){var l=this.settings.$target.offset().left;if(Foundation.rtl){l=this.settings.$target.offset().width-this.settings.$next_tip.width()+l}this.settings.$next_tip.css({top:this.settings.$target.offset().top-this.settings.$next_tip.outerHeight()-a,left:l});this.nub_position(o,this.settings.tip_settings.nub_position,"bottom")}else if(this.right()){this.settings.$next_tip.css({top:this.settings.$target.offset().top,left:this.outerWidth(this.settings.$target)+this.settings.$target.offset().left+u});this.nub_position(o,this.settings.tip_settings.nub_position,"left")}else if(this.left()){this.settings.$next_tip.css({top:this.settings.$target.offset().top,left:this.settings.$target.offset().left-this.outerWidth(this.settings.$next_tip)-u});this.nub_position(o,this.settings.tip_settings.nub_position,"right")}if(!this.visible(this.corners(this.settings.$next_tip))&&this.settings.attempts<this.settings.tip_settings.tip_location_pattern.length){o.removeClass("bottom").removeClass("top").removeClass("right").removeClass("left");this.settings.tip_settings.tip_location=this.settings.tip_settings.tip_location_pattern[this.settings.attempts];this.settings.attempts++;this.pos_default()}}else if(this.settings.$li.length){this.pos_modal(o)}if(f){this.settings.$next_tip.hide();this.settings.$next_tip.css("visibility","visible")}},pos_phone:function(t){var n=this.settings.$next_tip.outerHeight(),r=this.settings.$next_tip.offset(),i=this.settings.$target.outerHeight(),s=e(".joyride-nub",this.settings.$next_tip),o=Math.ceil(s.outerHeight()/2),u=t||false;s.removeClass("bottom").removeClass("top").removeClass("right").removeClass("left");if(u){this.settings.$next_tip.css("visibility","hidden");this.settings.$next_tip.show()}if(!/body/i.test(this.settings.$target.selector)){if(this.top()){this.settings.$next_tip.offset({top:this.settings.$target.offset().top-n-o});s.addClass("bottom")}else{this.settings.$next_tip.offset({top:this.settings.$target.offset().top+i+o});s.addClass("top")}}else if(this.settings.$li.length){this.pos_modal(s)}if(u){this.settings.$next_tip.hide();this.settings.$next_tip.css("visibility","visible")}},pos_modal:function(e){this.center();e.hide();this.show_modal()},show_modal:function(){if(!this.settings.$next_tip.data("closed")){var t=e(".joyride-modal-bg");if(t.length<1){e("body").append(this.settings.template.modal).show()}if(/pop/i.test(this.settings.tip_animation)){t.show()}else{t.fadeIn(this.settings.tip_animation_fade_speed)}}},expose:function(){var n,r,i,s,o,u="expose-"+Math.floor(Math.random()*1e4);if(arguments.length>0&&arguments[0]instanceof e){i=arguments[0]}else if(this.settings.$target&&!/body/i.test(this.settings.$target.selector)){i=this.settings.$target}else{return false}if(i.length<1){if(t.console){console.error("element not valid",i)}return false}n=e(this.settings.template.expose);this.settings.$body.append(n);n.css({top:i.offset().top,left:i.offset().left,width:i.outerWidth(true),height:i.outerHeight(true)});r=e(this.settings.template.expose_cover);s={zIndex:i.css("z-index"),position:i.css("position")};o=i.attr("class")==null?"":i.attr("class");i.css("z-index",parseInt(n.css("z-index"))+1);if(s.position=="static"){i.css("position","relative")}i.data("expose-css",s);i.data("orig-class",o);i.attr("class",o+" "+this.settings.expose_add_class);r.css({top:i.offset().top,left:i.offset().left,width:i.outerWidth(true),height:i.outerHeight(true)});if(this.settings.modal)this.show_modal();this.settings.$body.append(r);n.addClass(u);r.addClass(u);i.data("expose",u);this.settings.post_expose_callback(this.settings.$li.index(),this.settings.$next_tip,i);this.add_exposed(i)},un_expose:function(){var n,r,i,s,o,u=false;if(arguments.length>0&&arguments[0]instanceof e){r=arguments[0]}else if(this.settings.$target&&!/body/i.test(this.settings.$target.selector)){r=this.settings.$target}else{return false}if(r.length<1){if(t.console){console.error("element not valid",r)}return false}n=r.data("expose");i=e("."+n);if(arguments.length>1){u=arguments[1]}if(u===true){e(".joyride-expose-wrapper,.joyride-expose-cover").remove()}else{i.remove()}s=r.data("expose-css");if(s.zIndex=="auto"){r.css("z-index","")}else{r.css("z-index",s.zIndex)}if(s.position!=r.css("position")){if(s.position=="static"){r.css("position","")}else{r.css("position",s.position)}}o=r.data("orig-class");r.attr("class",o);r.removeData("orig-classes");r.removeData("expose");r.removeData("expose-z-index");this.remove_exposed(r)},add_exposed:function(t){this.settings.exposed=this.settings.exposed||[];if(t instanceof e||typeof t==="object"){this.settings.exposed.push(t[0])}else if(typeof t=="string"){this.settings.exposed.push(t)}},remove_exposed:function(t){var n,r;if(t instanceof e){n=t[0]}else if(typeof t=="string"){n=t}this.settings.exposed=this.settings.exposed||[];r=this.settings.exposed.length;for(var i=0;i<r;i++){if(this.settings.exposed[i]==n){this.settings.exposed.splice(i,1);return}}},center:function(){var n=e(t);this.settings.$next_tip.css({top:(n.height()-this.settings.$next_tip.outerHeight())/2+n.scrollTop(),left:(n.width()-this.settings.$next_tip.outerWidth())/2+n.scrollLeft()});return true},bottom:function(){return/bottom/i.test(this.settings.tip_settings.tip_location)},top:function(){return/top/i.test(this.settings.tip_settings.tip_location)},right:function(){return/right/i.test(this.settings.tip_settings.tip_location)},left:function(){return/left/i.test(this.settings.tip_settings.tip_location)},corners:function(n){var r=e(t),i=r.height()/2,s=Math.ceil(this.settings.$target.offset().top-i+this.settings.$next_tip.outerHeight()),o=r.width()+r.scrollLeft(),u=r.height()+s,a=r.height()+r.scrollTop(),f=r.scrollTop();if(s<f){if(s<0){f=0}else{f=s}}if(u>a){a=u}return[n.offset().top<f,o<n.offset().left+n.outerWidth(),a<n.offset().top+n.outerHeight(),r.scrollLeft()>n.offset().left]},visible:function(e){var t=e.length;while(t--){if(e[t])return false}return true},nub_position:function(e,t,n){if(t==="auto"){e.addClass(n)}else{e.addClass(t)}},startTimer:function(){if(this.settings.$li.length){this.settings.automate=setTimeout(function(){this.hide();this.show();this.startTimer()}.bind(this),this.settings.timer)}else{clearTimeout(this.settings.automate)}},end:function(){if(this.settings.cookie_monster){e.cookie(this.settings.cookie_name,"ridden",{expires:this.settings.cookie_expires,domain:this.settings.cookie_domain})}if(this.settings.timer>0){clearTimeout(this.settings.automate)}if(this.settings.modal&&this.settings.expose){this.un_expose()}this.settings.$next_tip.data("closed",true);e(".joyride-modal-bg").hide();this.settings.$current_tip.hide();this.settings.post_step_callback(this.settings.$li.index(),this.settings.$current_tip);this.settings.post_ride_callback(this.settings.$li.index(),this.settings.$current_tip);e(".joyride-tip-guide").remove()},off:function(){e(this.scope).off(".joyride");e(t).off(".joyride");e(".joyride-close-tip, .joyride-next-tip, .joyride-modal-bg").off(".joyride");e(".joyride-tip-guide, .joyride-modal-bg").remove();clearTimeout(this.settings.automate);this.settings={}},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.magellan={name:"magellan",version:"5.0.0",settings:{active_class:"active",threshold:0},init:function(t,n,r){this.fixed_magellan=e("[data-magellan-expedition]");this.set_threshold();this.last_destination=e("[data-magellan-destination]").last();this.events()},events:function(){var n=this;e(this.scope).off(".magellan").on("arrival.fndtn.magellan","[data-magellan-arrival]",function(t){var r=e(this),i=r.closest("[data-magellan-expedition]"),s=i.attr("data-magellan-active-class")||n.settings.active_class;r.closest("[data-magellan-expedition]").find("[data-magellan-arrival]").not(r).removeClass(s);r.addClass(s)});this.fixed_magellan.off(".magellan").on("update-position.fndtn.magellan",function(){var t=e(this)}).trigger("update-position");e(t).off(".magellan").on("resize.fndtn.magellan",function(){this.fixed_magellan.trigger("update-position")}.bind(this)).on("scroll.fndtn.magellan",function(){var r=e(t).scrollTop();n.fixed_magellan.each(function(){var t=e(this);if(typeof t.data("magellan-top-offset")==="undefined"){t.data("magellan-top-offset",t.offset().top)}if(typeof t.data("magellan-fixed-position")==="undefined"){t.data("magellan-fixed-position",false)}var i=r+n.settings.threshold>t.data("magellan-top-offset");var s=t.attr("data-magellan-top-offset");if(t.data("magellan-fixed-position")!=i){t.data("magellan-fixed-position",i);if(i){t.addClass("fixed");t.css({position:"fixed",top:0})}else{t.removeClass("fixed");t.css({position:"",top:""})}if(i&&typeof s!="undefined"&&s!=false){t.css({position:"fixed",top:s+"px"})}}})});if(this.last_destination.length>0){e(t).on("scroll.fndtn.magellan",function(r){var i=e(t).scrollTop(),s=i+e(t).height(),o=Math.ceil(n.last_destination.offset().top);e("[data-magellan-destination]").each(function(){var t=e(this),r=t.attr("data-magellan-destination"),u=t.offset().top-t.outerHeight(true)-i;if(u<=n.settings.threshold){e("[data-magellan-arrival='"+r+"']").trigger("arrival")}if(s>=e(n.scope).height()&&o>i&&o<s){e("[data-magellan-arrival]").last().trigger("arrival")}})})}},set_threshold:function(){if(typeof this.settings.threshold!=="number"){this.settings.threshold=this.fixed_magellan.length>0?this.fixed_magellan.outerHeight(true):0}},off:function(){e(this.scope).off(".fndtn.magellan");e(t).off(".fndtn.magellan")},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.offcanvas={name:"offcanvas",version:"5.0.0",settings:{},init:function(e,t,n){this.events()},events:function(){e(this.scope).off(".offcanvas").on("click.fndtn.offcanvas",".left-off-canvas-toggle",function(t){t.preventDefault();e(this).closest(".off-canvas-wrap").toggleClass("move-right")}).on("click.fndtn.offcanvas",".exit-off-canvas",function(t){t.preventDefault();e(".off-canvas-wrap").removeClass("move-right")}).on("click.fndtn.offcanvas",".right-off-canvas-toggle",function(t){t.preventDefault();e(this).closest(".off-canvas-wrap").toggleClass("move-left")}).on("click.fndtn.offcanvas",".exit-off-canvas",function(t){t.preventDefault();e(".off-canvas-wrap").removeClass("move-left")})},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";var i=function(){};var s=function(i,s){if(i.hasClass(s.slides_container_class)){return this}var f=this,l,c=i,h,p,d,v=0,m,g,y=false,b=false;c.children().first().addClass(s.active_slide_class);f.update_slide_number=function(t){if(s.slide_number){h.find("span:first").text(parseInt(t)+1);h.find("span:last").text(c.children().length)}if(s.bullets){p.children().removeClass(s.bullets_active_class);e(p.children().get(t)).addClass(s.bullets_active_class)}};f.update_active_link=function(t){var n=e('a[data-orbit-link="'+c.children().eq(t).attr("data-orbit-slide")+'"]');n.parents("ul").find("[data-orbit-link]").removeClass(s.bullets_active_class);n.addClass(s.bullets_active_class)};f.build_markup=function(){c.wrap('<div class="'+s.container_class+'"></div>');l=c.parent();c.addClass(s.slides_container_class);if(s.navigation_arrows){l.append(e('<a href="#"><span></span></a>').addClass(s.prev_class));l.append(e('<a href="#"><span></span></a>').addClass(s.next_class))}if(s.timer){d=e("<div>").addClass(s.timer_container_class);d.append("<span>");d.append(e("<div>").addClass(s.timer_progress_class));d.addClass(s.timer_paused_class);l.append(d)}if(s.slide_number){h=e("<div>").addClass(s.slide_number_class);h.append("<span></span> "+s.slide_number_text+" <span></span>");l.append(h)}if(s.bullets){p=e("<ol>").addClass(s.bullets_container_class);l.append(p);p.wrap('<div class="orbit-bullets-container"></div>');c.children().each(function(t,n){var r=e("<li>").attr("data-orbit-slide",t);p.append(r)})}if(s.stack_on_small){l.addClass(s.stack_on_small_class)}f.update_slide_number(0);f.update_active_link(0)};f._goto=function(t,n){if(t===v){return false}if(typeof g==="object"){g.restart()}var r=c.children();var i="next";y=true;if(t<v){i="prev"}if(t>=r.length){t=0}else if(t<0){t=r.length-1}var o=e(r.get(v));var u=e(r.get(t));o.css("zIndex",2);o.removeClass(s.active_slide_class);u.css("zIndex",4).addClass(s.active_slide_class);c.trigger("before-slide-change.fndtn.orbit");s.before_slide_change();f.update_active_link(t);var a=function(){var e=function(){v=t;y=false;if(n===true){g=f.create_timer();g.start()}f.update_slide_number(v);c.trigger("after-slide-change.fndtn.orbit",[{slide_number:v,total_slides:r.length}]);s.after_slide_change(v,r.length)};if(c.height()!=u.height()&&s.variable_height){c.animate({height:u.height()},250,"linear",e)}else{e()}};if(r.length===1){a();return false}var l=function(){if(i==="next"){m.next(o,u,a)}if(i==="prev"){m.prev(o,u,a)}};if(u.height()>c.height()&&s.variable_height){c.animate({height:u.height()},250,"linear",l)}else{l()}};f.next=function(e){e.stopImmediatePropagation();e.preventDefault();f._goto(v+1)};f.prev=function(e){e.stopImmediatePropagation();e.preventDefault();f._goto(v-1)};f.link_custom=function(t){t.preventDefault();var n=e(this).attr("data-orbit-link");if(typeof n==="string"&&(n=e.trim(n))!=""){var r=l.find("[data-orbit-slide="+n+"]");if(r.index()!=-1){f._goto(r.index())}}};f.link_bullet=function(t){var n=e(this).attr("data-orbit-slide");if(typeof n==="string"&&(n=e.trim(n))!=""){f._goto(parseInt(n))}};f.timer_callback=function(){f._goto(v+1,true)};f.compute_dimensions=function(){var t=e(c.children().get(v));var n=t.height();if(!s.variable_height){c.children().each(function(){if(e(this).height()>n){n=e(this).height()}})}c.height(n)};f.create_timer=function(){var e=new o(l.find("."+s.timer_container_class),s,f.timer_callback);return e};f.stop_timer=function(){if(typeof g==="object")g.stop()};f.toggle_timer=function(){var e=l.find("."+s.timer_container_class);if(e.hasClass(s.timer_paused_class)){if(typeof g==="undefined"){g=f.create_timer()}g.start()}else{if(typeof g==="object"){g.stop()}}};f.init=function(){f.build_markup();if(s.timer){g=f.create_timer();g.start()}m=new a(s,c);if(s.animation==="slide")m=new u(s,c);l.on("click","."+s.next_class,f.next);l.on("click","."+s.prev_class,f.prev);l.on("click","[data-orbit-slide]",f.link_bullet);l.on("click",f.toggle_timer);if(s.swipe){l.on("touchstart.fndtn.orbit",function(e){if(!e.touches){e=e.originalEvent}var t={start_page_x:e.touches[0].pageX,start_page_y:e.touches[0].pageY,start_time:(new Date).getTime(),delta_x:0,is_scrolling:r};l.data("swipe-transition",t);e.stopPropagation()}).on("touchmove.fndtn.orbit",function(e){if(!e.touches){e=e.originalEvent}if(e.touches.length>1||e.scale&&e.scale!==1)return;var t=l.data("swipe-transition");if(typeof t==="undefined"){t={}}t.delta_x=e.touches[0].pageX-t.start_page_x;if(typeof t.is_scrolling==="undefined"){t.is_scrolling=!!(t.is_scrolling||Math.abs(t.delta_x)<Math.abs(e.touches[0].pageY-t.start_page_y))}if(!t.is_scrolling&&!t.active){e.preventDefault();var n=t.delta_x<0?v+1:v-1;t.active=true;f._goto(n)}}).on("touchend.fndtn.orbit",function(e){l.data("swipe-transition",{});e.stopPropagation()})}l.on("mouseenter.fndtn.orbit",function(e){if(s.timer&&s.pause_on_hover){f.stop_timer()}}).on("mouseleave.fndtn.orbit",function(e){if(s.timer&&s.resume_on_mouseout){g.start()}});e(n).on("click","[data-orbit-link]",f.link_custom);e(t).on("resize",f.compute_dimensions);e(t).on("load",f.compute_dimensions);e(t).on("load",function(){l.prev(".preloader").css("display","none")});c.trigger("ready.fndtn.orbit")};f.init()};var o=function(e,t,n){var r=this,i=t.timer_speed,s=e.find("."+t.timer_progress_class),o,u,a=-1;this.update_progress=function(e){var t=s.clone();t.attr("style","");t.css("width",e+"%");s.replaceWith(t);s=t};this.restart=function(){clearTimeout(u);e.addClass(t.timer_paused_class);a=-1;r.update_progress(0)};this.start=function(){if(!e.hasClass(t.timer_paused_class)){return true}a=a===-1?i:a;e.removeClass(t.timer_paused_class);o=(new Date).getTime();s.animate({width:"100%"},a,"linear");u=setTimeout(function(){r.restart();n()},a);e.trigger("timer-started.fndtn.orbit")};this.stop=function(){if(e.hasClass(t.timer_paused_class)){return true}clearTimeout(u);e.addClass(t.timer_paused_class);var n=(new Date).getTime();a=a-(n-o);var s=100-a/i*100;r.update_progress(s);e.trigger("timer-stopped.fndtn.orbit")}};var u=function(t,n){var r=t.animation_speed;var i=e("html[dir=rtl]").length===1;var s=i?"marginRight":"marginLeft";var o={};o[s]="0%";this.next=function(e,t,n){e.animate({marginLeft:"-100%"},r);t.animate(o,r,function(){e.css(s,"100%");n()})};this.prev=function(e,t,n){e.animate({marginLeft:"100%"},r);t.css(s,"-100%");t.animate(o,r,function(){e.css(s,"100%");n()})}};var a=function(t,n){var r=t.animation_speed;var i=e("html[dir=rtl]").length===1;var s=i?"marginRight":"marginLeft";this.next=function(e,t,n){t.css({margin:"0%",opacity:"0.01"});t.animate({opacity:"1"},r,"linear",function(){e.css("margin","100%");n()})};this.prev=function(e,t,n){t.css({margin:"0%",opacity:"0.01"});t.animate({opacity:"1"},r,"linear",function(){e.css("margin","100%");n()})}};Foundation.libs=Foundation.libs||{};Foundation.libs.orbit={name:"orbit",version:"5.0.0",settings:{animation:"slide",timer_speed:1e4,pause_on_hover:true,resume_on_mouseout:false,animation_speed:500,stack_on_small:false,navigation_arrows:true,slide_number:true,slide_number_text:"of",container_class:"orbit-container",stack_on_small_class:"orbit-stack-on-small",next_class:"orbit-next",prev_class:"orbit-prev",timer_container_class:"orbit-timer",timer_paused_class:"paused",timer_progress_class:"orbit-progress",slides_container_class:"orbit-slides-container",bullets_container_class:"orbit-bullets",bullets_active_class:"active",slide_number_class:"orbit-slide-number",caption_class:"orbit-caption",active_slide_class:"active",orbit_transition_class:"orbit-transitioning",bullets:true,timer:true,variable_height:false,swipe:true,before_slide_change:i,after_slide_change:i},init:function(t,n,r){var i=this;if(typeof n==="object"){e.extend(true,i.settings,n)}if(e(t).is("[data-orbit]")){var o=e(t);var u=i.data_options(o);new s(o,e.extend({},i.settings,u))}e("[data-orbit]",t).each(function(t,n){var r=e(n);var o=i.data_options(r);new s(r,e.extend({},i.settings,o))})}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.reveal={name:"reveal",version:"5.0.0",locked:false,settings:{animation:"fadeAndPop",animation_speed:250,close_on_background_click:true,close_on_esc:true,dismiss_modal_class:"close-reveal-modal",bg_class:"reveal-modal-bg",open:function(){},opened:function(){},close:function(){},closed:function(){},bg:e(".reveal-modal-bg"),css:{open:{opacity:0,visibility:"visible",display:"block"},close:{opacity:1,visibility:"hidden",display:"none"}}},init:function(e,t,n){Foundation.inherit(this,"delay");this.bindings(t,n)},events:function(t){var n=this;e("[data-reveal-id]",this.scope).off(".reveal").on("click.fndtn.reveal",function(t){t.preventDefault();if(!n.locked){var r=e(this),i=r.data("reveal-ajax");n.locked=true;if(typeof i==="undefined"){n.open.call(n,r)}else{var s=i===true?r.attr("href"):i;n.open.call(n,r,{url:s})}}});e(this.scope).off(".reveal").on("click.fndtn.reveal",this.close_targets(),function(t){t.preventDefault();if(!n.locked){var r=e("[data-reveal].open").data("reveal-init"),i=e(t.target)[0]===e("."+r.bg_class)[0];if(i&&!r.close_on_background_click){return}n.locked=true;n.close.call(n,i?e("[data-reveal].open"):e(this).closest("[data-reveal]"))}});if(e("[data-reveal]",this.scope).length>0){e(this.scope).on("open.fndtn.reveal",this.settings.open).on("opened.fndtn.reveal",this.settings.opened).on("opened.fndtn.reveal",this.open_video).on("close.fndtn.reveal",this.settings.close).on("closed.fndtn.reveal",this.settings.closed).on("closed.fndtn.reveal",this.close_video)}else{e(this.scope).on("open.fndtn.reveal","[data-reveal]",this.settings.open).on("opened.fndtn.reveal","[data-reveal]",this.settings.opened).on("opened.fndtn.reveal","[data-reveal]",this.open_video).on("close.fndtn.reveal","[data-reveal]",this.settings.close).on("closed.fndtn.reveal","[data-reveal]",this.settings.closed).on("closed.fndtn.reveal","[data-reveal]",this.close_video)}e("body").on("keyup.fndtn.reveal",function(t){var n=e("[data-reveal].open"),r=n.data("reveal-init");if(t.which===27&&r.close_on_esc){n.foundation("reveal","close")}});return true},open:function(t,n){if(t){if(typeof t.selector!=="undefined"){var r=e("#"+t.data("reveal-id"))}else{var r=e(this.scope);n=t}}else{var r=e(this.scope)}if(!r.hasClass("open")){var i=e("[data-reveal].open");if(typeof r.data("css-top")==="undefined"){r.data("css-top",parseInt(r.css("top"),10)).data("offset",this.cache_offset(r))}r.trigger("open");if(i.length<1){this.toggle_bg()}if(typeof n==="undefined"||!n.url){this.hide(i,this.settings.css.close);this.show(r,this.settings.css.open)}else{var s=this,o=typeof n.success!=="undefined"?n.success:null;e.extend(n,{success:function(t,n,u){if(e.isFunction(o)){o(t,n,u)}r.html(t);e(r).foundation("section","reflow");s.hide(i,s.settings.css.close);s.show(r,s.settings.css.open)}});e.ajax(n)}}},close:function(t){var t=t&&t.length?t:e(this.scope),n=e("[data-reveal].open");if(n.length>0){this.locked=true;t.trigger("close");this.toggle_bg();this.hide(n,this.settings.css.close)}},close_targets:function(){var e="."+this.settings.dismiss_modal_class;if(this.settings.close_on_background_click){return e+", ."+this.settings.bg_class}return e},toggle_bg:function(){if(e("."+this.settings.bg_class).length===0){this.settings.bg=e("<div />",{"class":this.settings.bg_class}).appendTo("body")}if(this.settings.bg.filter(":visible").length>0){this.hide(this.settings.bg)}else{this.show(this.settings.bg)}},show:function(n,r){if(r){if(n.parent("body").length===0){var i=n.wrap('<div style="display: none;" />').parent();n.on("closed.fndtn.reveal.wrapped",function(){n.detach().appendTo(i);n.unwrap().unbind("closed.fndtn.reveal.wrapped")});n.detach().appendTo("body")}if(/pop/i.test(this.settings.animation)){r.top=e(t).scrollTop()-n.data("offset")+"px";var s={top:e(t).scrollTop()+n.data("css-top")+"px",opacity:1};return this.delay(function(){return n.css(r).animate(s,this.settings.animation_speed,"linear",function(){this.locked=false;n.trigger("opened")}.bind(this)).addClass("open")}.bind(this),this.settings.animation_speed/2)}if(/fade/i.test(this.settings.animation)){var s={opacity:1};return this.delay(function(){return n.css(r).animate(s,this.settings.animation_speed,"linear",function(){this.locked=false;n.trigger("opened")}.bind(this)).addClass("open")}.bind(this),this.settings.animation_speed/2)}return n.css(r).show().css({opacity:1}).addClass("open").trigger("opened")}if(/fade/i.test(this.settings.animation)){return n.fadeIn(this.settings.animation_speed/2)}return n.show()},hide:function(n,r){if(r){if(/pop/i.test(this.settings.animation)){var i={top:-e(t).scrollTop()-n.data("offset")+"px",opacity:0};return this.delay(function(){return n.animate(i,this.settings.animation_speed,"linear",function(){this.locked=false;n.css(r).trigger("closed")}.bind(this)).removeClass("open")}.bind(this),this.settings.animation_speed/2)}if(/fade/i.test(this.settings.animation)){var i={opacity:0};return this.delay(function(){return n.animate(i,this.settings.animation_speed,"linear",function(){this.locked=false;n.css(r).trigger("closed")}.bind(this)).removeClass("open")}.bind(this),this.settings.animation_speed/2)}return n.hide().css(r).removeClass("open").trigger("closed")}if(/fade/i.test(this.settings.animation)){return n.fadeOut(this.settings.animation_speed/2)}return n.hide()},close_video:function(t){var n=e(this).find(".flex-video"),r=n.find("iframe");if(r.length>0){r.attr("data-src",r[0].src);r.attr("src","about:blank");n.hide()}},open_video:function(t){var n=e(this).find(".flex-video"),i=n.find("iframe");if(i.length>0){var s=i.attr("data-src");if(typeof s==="string"){i[0].src=i.attr("data-src")}else{var o=i[0].src;i[0].src=r;i[0].src=o}n.show()}},cache_offset:function(e){var t=e.show().height()+parseInt(e.css("top"),10);e.hide();return t},off:function(){e(this.scope).off(".fndtn.reveal")},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.tab={name:"tab",version:"5.0.1",settings:{active_class:"active"},init:function(e,t,n){this.bindings(t,n)},events:function(){e(this.scope).off(".tab").on("click.fndtn.tab","[data-tab] > dd > a",function(t){t.preventDefault();var n=e(this).parent(),r=e("#"+this.href.split("#")[1]),i=n.siblings(),s=n.closest("[data-tab]").data("tab-init");n.addClass(s.active_class);i.removeClass(s.active_class);r.siblings().removeClass(s.active_class).end().addClass(s.active_class)})},off:function(){},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.tooltip={name:"tooltip",version:"5.0.0",settings:{additional_inheritable_classes:[],tooltip_class:".tooltip",append_to:"body",touch_close_text:"Tap To Close",disable_for_touch:false,tip_template:function(e,t){return'<span data-selector="'+e+'" class="'+Foundation.libs.tooltip.settings.tooltip_class.substring(1)+'">'+t+'<span class="nub"></span></span>'}},cache:{},init:function(e,t,n){this.bindings(t,n)},events:function(){var t=this;if(Modernizr.touch){e(this.scope).off(".tooltip").on("click.fndtn.tooltip touchstart.fndtn.tooltip touchend.fndtn.tooltip","[data-tooltip]",function(n){var r=e.extend({},t.settings,t.data_options(e(this)));if(!r.disable_for_touch){n.preventDefault();e(r.tooltip_class).hide();t.showOrCreateTip(e(this))}}).on("click.fndtn.tooltip touchstart.fndtn.tooltip touchend.fndtn.tooltip",this.settings.tooltip_class,function(t){t.preventDefault();e(this).fadeOut(150)})}else{e(this.scope).off(".tooltip").on("mouseenter.fndtn.tooltip mouseleave.fndtn.tooltip","[data-tooltip]",function(n){var r=e(this);if(/enter|over/i.test(n.type)){t.showOrCreateTip(r)}else if(n.type==="mouseout"||n.type==="mouseleave"){t.hide(r)}})}},showOrCreateTip:function(e){var t=this.getTip(e);if(t&&t.length>0){return this.show(e)}return this.create(e)},getTip:function(t){var n=this.selector(t),r=null;if(n){r=e('span[data-selector="'+n+'"]'+this.settings.tooltip_class)}return typeof r==="object"?r:false},selector:function(e){var t=e.attr("id"),n=e.attr("data-tooltip")||e.attr("data-selector");if((t&&t.length<1||!t)&&typeof n!="string"){n="tooltip"+Math.random().toString(36).substring(7);e.attr("data-selector",n)}return t&&t.length>0?t:n},create:function(t){var n=e(this.settings.tip_template(this.selector(t),e("<div></div>").html(t.attr("title")).html())),r=this.inheritable_classes(t);n.addClass(r).appendTo(this.settings.append_to);if(Modernizr.touch){n.append('<span class="tap-to-close">'+this.settings.touch_close_text+"</span>")}t.removeAttr("title").attr("title","");this.show(t)},reposition:function(t,n,r){var i,s,o,u,a,f;n.css("visibility","hidden").show();i=t.data("width");s=n.children(".nub");o=s.outerHeight();u=s.outerHeight();f=function(e,t,n,r,i,s){return e.css({top:t?t:"auto",bottom:r?r:"auto",left:i?i:"auto",right:n?n:"auto",width:s?s:"auto"}).end()};f(n,t.offset().top+t.outerHeight()+10,"auto","auto",t.offset().left,i);if(this.small()){f(n,t.offset().top+t.outerHeight()+10,"auto","auto",12.5,e(this.scope).width());n.addClass("tip-override");f(s,-o,"auto","auto",t.offset().left)}else{var l=t.offset().left;if(Foundation.rtl){l=t.offset().left+t.offset().width-n.outerWidth()}f(n,t.offset().top+t.outerHeight()+10,"auto","auto",l,i);n.removeClass("tip-override");if(r&&r.indexOf("tip-top")>-1){f(n,t.offset().top-n.outerHeight(),"auto","auto",l,i).removeClass("tip-override")}else if(r&&r.indexOf("tip-left")>-1){f(n,t.offset().top+t.outerHeight()/2-o*2.5,"auto","auto",t.offset().left-n.outerWidth()-o,i).removeClass("tip-override")}else if(r&&r.indexOf("tip-right")>-1){f(n,t.offset().top+t.outerHeight()/2-o*2.5,"auto","auto",t.offset().left+t.outerWidth()+o,i).removeClass("tip-override")}}n.css("visibility","visible").hide()},small:function(){return matchMedia(Foundation.media_queries.small).matches},inheritable_classes:function(t){var n=["tip-top","tip-left","tip-bottom","tip-right","noradius"].concat(this.settings.additional_inheritable_classes),r=t.attr("class"),i=r?e.map(r.split(" "),function(t,r){if(e.inArray(t,n)!==-1){return t}}).join(" "):"";return e.trim(i)},show:function(e){var t=this.getTip(e);this.reposition(e,t,e.attr("class"));t.fadeIn(150)},hide:function(e){var t=this.getTip(e);t.fadeOut(150)},reload:function(){var t=e(this);return t.data("fndtn-tooltips")?t.foundationTooltips("destroy").foundationTooltips("init"):t.foundationTooltips("init")},off:function(){e(this.scope).off(".fndtn.tooltip");e(this.settings.tooltip_class).each(function(t){e("[data-tooltip]").get(t).attr("title",e(this).text())}).remove()},reflow:function(){}}})(jQuery,this,this.document);(function(e,t,n,r){"use strict";Foundation.libs.topbar={name:"topbar",version:"5.0.1",settings:{index:0,sticky_class:"sticky",custom_back_text:true,back_text:"Back",is_hover:true,mobile_show_parent_link:false,scrolltop:true},init:function(t,n,r){Foundation.inherit(this,"addCustomRule register_media throttle");var i=this;i.register_media("topbar","foundation-mq-topbar");this.bindings(n,r);e("[data-topbar]",this.scope).each(function(){var t=e(this),n=t.data("topbar-init"),r=e("section",this),s=e("> ul",this).first();t.data("index",0);var o=t.parent();if(o.hasClass("fixed")||o.hasClass(n.sticky_class)){i.settings.sticky_class=n.sticky_class;i.settings.stick_topbar=t;t.data("height",o.outerHeight());t.data("stickyoffset",o.offset().top)}else{t.data("height",t.outerHeight())}if(!n.assembled)i.assemble(t);if(n.is_hover){e(".has-dropdown",t).addClass("not-click")}else{e(".has-dropdown",t).removeClass("not-click")}i.addCustomRule(".f-topbar-fixed { padding-top: "+t.data("height")+"px }");if(o.hasClass("fixed")){e("body").addClass("f-topbar-fixed")}})},toggle:function(n){var r=this;if(n){var i=e(n).closest("[data-topbar]")}else{var i=e("[data-topbar]")}var s=i.data("topbar-init");var o=e("section, .section",i);if(r.breakpoint()){if(!r.rtl){o.css({left:"0%"});e(">.name",o).css({left:"100%"})}else{o.css({right:"0%"});e(">.name",o).css({right:"100%"})}e("li.moved",o).removeClass("moved");i.data("index",0);i.toggleClass("expanded").css("height","")}if(s.scrolltop){if(!i.hasClass("expanded")){if(i.hasClass("fixed")){i.parent().addClass("fixed");i.removeClass("fixed");e("body").addClass("f-topbar-fixed")}}else if(i.parent().hasClass("fixed")){if(s.scrolltop){i.parent().removeClass("fixed");i.addClass("fixed");e("body").removeClass("f-topbar-fixed");t.scrollTo(0,0)}else{i.parent().removeClass("expanded")}}}else{if(i.parent().hasClass(r.settings.sticky_class)){i.parent().addClass("fixed")}if(i.parent().hasClass("fixed")){if(!i.hasClass("expanded")){i.removeClass("fixed");i.parent().removeClass("expanded");r.update_sticky_positioning()}else{i.addClass("fixed");i.parent().addClass("expanded")}}}},timer:null,events:function(n){var r=this;e(this.scope).off(".topbar").on("click.fndtn.topbar","[data-topbar] .toggle-topbar",function(e){e.preventDefault();r.toggle(this)}).on("click.fndtn.topbar","[data-topbar] li.has-dropdown",function(t){var n=e(this),i=e(t.target),s=n.closest("[data-topbar]"),o=s.data("topbar-init");if(i.data("revealId")){r.toggle();return}if(r.breakpoint())return;if(o.is_hover&&!Modernizr.touch)return;t.stopImmediatePropagation();if(n.hasClass("hover")){n.removeClass("hover").find("li").removeClass("hover");n.parents("li.hover").removeClass("hover")}else{n.addClass("hover");if(i[0].nodeName==="A"&&i.parent().hasClass("has-dropdown")){t.preventDefault()}}}).on("click.fndtn.topbar","[data-topbar] .has-dropdown>a",function(t){if(r.breakpoint()){t.preventDefault();var n=e(this),i=n.closest("[data-topbar]"),s=i.find("section, .section"),o=n.next(".dropdown").outerHeight(),u=n.closest("li");i.data("index",i.data("index")+1);u.addClass("moved");if(!r.rtl){s.css({left:-(100*i.data("index"))+"%"});s.find(">.name").css({left:100*i.data("index")+"%"})}else{s.css({right:-(100*i.data("index"))+"%"});s.find(">.name").css({right:100*i.data("index")+"%"})}i.css("height",n.siblings("ul").outerHeight(true)+i.data("height"))}});e(t).off(".topbar").on("resize.fndtn.topbar",r.throttle(function(){r.resize.call(r)},50)).trigger("resize");e("body").off(".topbar").on("click.fndtn.topbar touchstart.fndtn.topbar",function(t){var n=e(t.target).closest("li").closest("li.hover");if(n.length>0){return}e("[data-topbar] li").removeClass("hover")});e(this.scope).on("click.fndtn.topbar","[data-topbar] .has-dropdown .back",function(t){t.preventDefault();var n=e(this),i=n.closest("[data-topbar]"),s=i.find("section, .section"),o=i.data("topbar-init"),u=n.closest("li.moved"),a=u.parent();i.data("index",i.data("index")-1);if(!r.rtl){s.css({left:-(100*i.data("index"))+"%"});s.find(">.name").css({left:100*i.data("index")+"%"})}else{s.css({right:-(100*i.data("index"))+"%"});s.find(">.name").css({right:100*i.data("index")+"%"})}if(i.data("index")===0){i.css("height","")}else{i.css("height",a.outerHeight(true)+i.data("height"))}setTimeout(function(){u.removeClass("moved")},300)})},resize:function(){var t=this;e("[data-topbar]").each(function(){var r=e(this),i=r.data("topbar-init");var s=r.parent("."+t.settings.sticky_class);var o;if(!t.breakpoint()){var u=r.hasClass("expanded");r.css("height","").removeClass("expanded").find("li").removeClass("hover");if(u){t.toggle(r)}}if(s.length>0){if(s.hasClass("fixed")){s.removeClass("fixed");o=s.offset().top;if(e(n.body).hasClass("f-topbar-fixed")){o-=r.data("height")}r.data("stickyoffset",o);s.addClass("fixed")}else{o=s.offset().top;r.data("stickyoffset",o)}}})},breakpoint:function(){return!matchMedia(Foundation.media_queries["topbar"]).matches},assemble:function(t){var n=this,r=t.data("topbar-init"),i=e("section",t),s=e("> ul",t).first();i.detach();e(".has-dropdown>a",i).each(function(){var t=e(this),n=t.siblings(".dropdown"),i=t.attr("href");if(r.mobile_show_parent_link&&i&&i.length>1){var s=e('<li class="title back js-generated"><h5><a href="#"></a></h5></li><li><a class="parent-link js-generated" href="'+i+'">'+t.text()+"</a></li>")}else{var s=e('<li class="title back js-generated"><h5><a href="#"></a></h5></li>')}if(r.custom_back_text==true){e("h5>a",s).html(r.back_text)}else{e("h5>a",s).html("&laquo; "+t.html())}n.prepend(s)});i.appendTo(t);this.sticky();this.assembled(t)},assembled:function(t){t.data("topbar-init",e.extend({},t.data("topbar-init"),{assembled:true}))},height:function(t){var n=0,r=this;e("> li",t).each(function(){n+=e(this).outerHeight(true)});return n},sticky:function(){var n=e(t),r=this;e(t).on("scroll",function(){r.update_sticky_positioning()})},update_sticky_positioning:function(){var n="."+this.settings.sticky_class;var r=e(t);if(e(n).length>0){var i=this.settings.sticky_topbar.data("stickyoffset");if(!e(n).hasClass("expanded")){if(r.scrollTop()>i){if(!e(n).hasClass("fixed")){e(n).addClass("fixed");e("body").addClass("f-topbar-fixed")}}else if(r.scrollTop()<=i){if(e(n).hasClass("fixed")){e(n).removeClass("fixed");e("body").removeClass("f-topbar-fixed")}}}}},off:function(){e(this.scope).off(".fndtn.topbar");e(t).off(".fndtn.topbar")},reflow:function(){}}})(jQuery,this,this.document)
;
;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.topbar = {
    name : 'topbar',

    version: '5.0.1',

    settings : {
      index : 0,
      sticky_class : 'sticky',
      custom_back_text: true,
      back_text: 'Back',
      is_hover: true,
      mobile_show_parent_link: false,
      scrolltop : true // jump to top when sticky nav menu toggle is clicked
    },

    init : function (section, method, options) {
      Foundation.inherit(this, 'addCustomRule register_media throttle');
      var self = this;

      self.register_media('topbar', 'foundation-mq-topbar');

      this.bindings(method, options);

      $('[data-topbar]', this.scope).each(function () {
        var topbar = $(this),
            settings = topbar.data('topbar-init'),
            section = $('section', this),
            titlebar = $('> ul', this).first();

        topbar.data('index', 0);

        var topbarContainer = topbar.parent();
        if(topbarContainer.hasClass('fixed') || topbarContainer.hasClass(settings.sticky_class)) {
          self.settings.sticky_class = settings.sticky_class;
          self.settings.stick_topbar = topbar;
          topbar.data('height', topbarContainer.outerHeight());
          topbar.data('stickyoffset', topbarContainer.offset().top);
        } else {
          topbar.data('height', topbar.outerHeight());
        }

        if (!settings.assembled) self.assemble(topbar);

        if (settings.is_hover) {
          $('.has-dropdown', topbar).addClass('not-click');
        } else {
          $('.has-dropdown', topbar).removeClass('not-click');
        }

        // Pad body when sticky (scrolled) or fixed.
        self.addCustomRule('.f-topbar-fixed { padding-top: ' + topbar.data('height') + 'px }');

        if (topbarContainer.hasClass('fixed')) {
          $('body').addClass('f-topbar-fixed');
        }
      });

    },

    toggle: function (toggleEl) {
      var self = this;

      if (toggleEl) {
        var topbar = $(toggleEl).closest('[data-topbar]');
      } else {
        var topbar = $('[data-topbar]');
      }

      var settings = topbar.data('topbar-init');

      var section = $('section, .section', topbar);

      if (self.breakpoint()) {
        if (!self.rtl) {
          section.css({left: '0%'});
          $('>.name', section).css({left: '100%'});
        } else {
          section.css({right: '0%'});
          $('>.name', section).css({right: '100%'});
        }

        $('li.moved', section).removeClass('moved');
        topbar.data('index', 0);

        topbar
          .toggleClass('expanded')
          .css('height', '');
      }

      if (settings.scrolltop) {
        if (!topbar.hasClass('expanded')) {
          if (topbar.hasClass('fixed')) {
            topbar.parent().addClass('fixed');
            topbar.removeClass('fixed');
            $('body').addClass('f-topbar-fixed');
          }
        } else if (topbar.parent().hasClass('fixed')) {
          if (settings.scrolltop) {
            topbar.parent().removeClass('fixed');
            topbar.addClass('fixed');
            $('body').removeClass('f-topbar-fixed');

            window.scrollTo(0,0);
          } else {
              topbar.parent().removeClass('expanded');
          }
        }
      } else {
        if(topbar.parent().hasClass(self.settings.sticky_class)) {
          topbar.parent().addClass('fixed');
        }

        if(topbar.parent().hasClass('fixed')) {
          if (!topbar.hasClass('expanded')) {
            topbar.removeClass('fixed');
            topbar.parent().removeClass('expanded');
            self.update_sticky_positioning();
          } else {
            topbar.addClass('fixed');
            topbar.parent().addClass('expanded');
          }
        }
      }
    },

    timer : null,

    events : function (bar) {
      var self = this;
      $(this.scope)
        .off('.topbar')
        .on('click.fndtn.topbar', '[data-topbar] .toggle-topbar', function (e) {
          e.preventDefault();
          self.toggle(this);
        })
        .on('click.fndtn.topbar', '[data-topbar] li.has-dropdown', function (e) {
          var li = $(this),
              target = $(e.target),
              topbar = li.closest('[data-topbar]'),
              settings = topbar.data('topbar-init');

          if(target.data('revealId')) {
            self.toggle();
            return;
          }

          if (self.breakpoint()) return;
          if (settings.is_hover && !Modernizr.touch) return;

          e.stopImmediatePropagation();

          if (li.hasClass('hover')) {
            li
              .removeClass('hover')
              .find('li')
              .removeClass('hover');

            li.parents('li.hover')
              .removeClass('hover');
          } else {
            li.addClass('hover');

            if (target[0].nodeName === 'A' && target.parent().hasClass('has-dropdown')) {
              e.preventDefault();
            }
          }
        })
        .on('click.fndtn.topbar', '[data-topbar] .has-dropdown>a', function (e) {
          if (self.breakpoint()) {

            e.preventDefault();

            var $this = $(this),
                topbar = $this.closest('[data-topbar]'),
                section = topbar.find('section, .section'),
                dropdownHeight = $this.next('.dropdown').outerHeight(),
                $selectedLi = $this.closest('li');

            topbar.data('index', topbar.data('index') + 1);
            $selectedLi.addClass('moved');

            if (!self.rtl) {
              section.css({left: -(100 * topbar.data('index')) + '%'});
              section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
            } else {
              section.css({right: -(100 * topbar.data('index')) + '%'});
              section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
            }

            topbar.css('height', $this.siblings('ul').outerHeight(true) + topbar.data('height'));
          }
        });
      
      $(window).off('.topbar').on('resize.fndtn.topbar', self.throttle(function () {
        self.resize.call(self);
      }, 50)).trigger('resize');

      $('body').off('.topbar').on('click.fndtn.topbar touchstart.fndtn.topbar', function (e) {
        var parent = $(e.target).closest('li').closest('li.hover');

        if (parent.length > 0) {
          return;
        }

        $('[data-topbar] li').removeClass('hover');
      });

      // Go up a level on Click
      $(this.scope).on('click.fndtn.topbar', '[data-topbar] .has-dropdown .back', function (e) {
        e.preventDefault();

        var $this = $(this),
            topbar = $this.closest('[data-topbar]'),
            section = topbar.find('section, .section'),
            settings = topbar.data('topbar-init'),
            $movedLi = $this.closest('li.moved'),
            $previousLevelUl = $movedLi.parent();

        topbar.data('index', topbar.data('index') - 1);

        if (!self.rtl) {
          section.css({left: -(100 * topbar.data('index')) + '%'});
          section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
        } else {
          section.css({right: -(100 * topbar.data('index')) + '%'});
          section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
        }

        if (topbar.data('index') === 0) {
          topbar.css('height', '');
        } else {
          topbar.css('height', $previousLevelUl.outerHeight(true) + topbar.data('height'));
        }

        setTimeout(function () {
          $movedLi.removeClass('moved');
        }, 300);
      });
    },

    resize : function () {
      var self = this;
      $('[data-topbar]').each(function () {
        var topbar = $(this),
            settings = topbar.data('topbar-init');

        var stickyContainer = topbar.parent('.' + self.settings.sticky_class);
        var stickyOffset;

        if (!self.breakpoint()) {
          var doToggle = topbar.hasClass('expanded');
          topbar
            .css('height', '')
            .removeClass('expanded')
            .find('li')
            .removeClass('hover');

            if(doToggle) {
              self.toggle(topbar);
            }
        }

        if(stickyContainer.length > 0) {
          if(stickyContainer.hasClass('fixed')) {
            // Remove the fixed to allow for correct calculation of the offset.
            stickyContainer.removeClass('fixed');

            stickyOffset = stickyContainer.offset().top;
            if($(document.body).hasClass('f-topbar-fixed')) {
              stickyOffset -= topbar.data('height');
            }

            topbar.data('stickyoffset', stickyOffset);
            stickyContainer.addClass('fixed');
          } else {
            stickyOffset = stickyContainer.offset().top;
            topbar.data('stickyoffset', stickyOffset);
          }
        }

      });
    },

    breakpoint : function () {
      return !matchMedia(Foundation.media_queries['topbar']).matches;
    },

    assemble : function (topbar) {
      var self = this,
          settings = topbar.data('topbar-init'),
          section = $('section', topbar),
          titlebar = $('> ul', topbar).first();

      // Pull element out of the DOM for manipulation
      section.detach();

      $('.has-dropdown>a', section).each(function () {
        var $link = $(this),
            $dropdown = $link.siblings('.dropdown'),
            url = $link.attr('href');

        if (settings.mobile_show_parent_link && url && url.length > 1) {
          var $titleLi = $('<li class="title back js-generated"><h5><a href="#"></a></h5></li><li><a class="parent-link js-generated" href="' + url + '">' + $link.text() +'</a></li>');
        } else {
          var $titleLi = $('<li class="title back js-generated"><h5><a href="#"></a></h5></li>');
        }

        // Copy link to subnav
        if (settings.custom_back_text == true) {
          $('h5>a', $titleLi).html(settings.back_text);
        } else {
          $('h5>a', $titleLi).html('&laquo; ' + $link.html());
        }
        $dropdown.prepend($titleLi);
      });

      // Put element back in the DOM
      section.appendTo(topbar);

      // check for sticky
      this.sticky();

      this.assembled(topbar);
    },

    assembled : function (topbar) {
      topbar.data('topbar-init', $.extend({}, topbar.data('topbar-init'), {assembled: true}));
    },

    height : function (ul) {
      var total = 0,
          self = this;

      $('> li', ul).each(function () { total += $(this).outerHeight(true); });

      return total;
    },

    sticky : function () {
      var $window = $(window),
          self = this;

      $(window).on('scroll', function() {
        self.update_sticky_positioning();
      });
    },

    update_sticky_positioning: function() {
      var klass = '.' + this.settings.sticky_class;
      var $window = $(window);

      if ($(klass).length > 0) {
        var distance = this.settings.sticky_topbar.data('stickyoffset');
        if (!$(klass).hasClass('expanded')) {
          if ($window.scrollTop() > (distance)) {
            if (!$(klass).hasClass('fixed')) {
              $(klass).addClass('fixed');
              $('body').addClass('f-topbar-fixed');
            }
          } else if ($window.scrollTop() <= distance) {
            if ($(klass).hasClass('fixed')) {
              $(klass).removeClass('fixed');
              $('body').removeClass('f-topbar-fixed');
            }
          }
        }
      }
    },

    off : function () {
      $(this.scope).off('.fndtn.topbar');
      $(window).off('.fndtn.topbar');
    },

    reflow : function () {}
  };
}(jQuery, this, this.document));
var one_hour = 14; //Height of the one hour in px

function getDayName(i) {
	var days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
	return days[i - 1];
}

function updateComfZone() {
	if ($('#schedule-cont').length) {
		var comf_zone_form = $('#comf-zone-form');
		$('.comf-zone').each(function(e) {
			var top = $(this).data('top') + 'px';
			var start = $(this).data('start').split(':');
			var top = start[0] * one_hour;
			if (start[1] != '00'){
				top += one_hour / 2;
			}
			var duration = $(this).data('duration') * one_hour + 'px';
			$(this).css('top', top + 'px');
			$(this).css('height', duration);

			if ($(this).hasClass('touchEn')) {
				$(this).on("mousedown", function(e){
					$('.selected').removeClass('selected');
					$(this).addClass('selected');
					comf_zone_form
						.show()
						.data('cz', $(this).attr('id'))
						.find('h3').html(getDayName($(this).data("day")));
				});
			}

		});
		$('#comf-zone-form-cancel').on('click', function(e){
			comf_zone_form.hide();
			$('.selected').removeClass('selected');
		});
		$('#comf-zone-form-submit').on('click', function(e){
			comf_zone_form.hide();
			$('.selected').removeClass('selected');
		});
	}
}

$(function(){
	var comf_zone_form = $('#comf-zone-form');
	if ($('#schedule-cont').length) {
		updateComfZone();

	}
});
/*!

 handlebars v1.1.2

Copyright (C) 2011 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/

var Handlebars = (function() {
// handlebars/safe-string.js
var __module4__ = (function() {
  "use strict";
  var __exports__;
  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = function() {
    return "" + this.string;
  };

  __exports__ = SafeString;
  return __exports__;
})();

// handlebars/utils.js
var __module3__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  var SafeString = __dependency1__;

  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /[&<>"'`]/g;
  var possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr] || "&amp;";
  }

  function extend(obj, value) {
    for(var key in value) {
      if(value.hasOwnProperty(key)) {
        obj[key] = value[key];
      }
    }
  }

  __exports__.extend = extend;var toString = Object.prototype.toString;
  __exports__.toString = toString;
  // Sourced from lodash
  // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
  var isFunction = function(value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  __exports__.isFunction = isFunction;
  var isArray = Array.isArray || function(value) {
    return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
  };
  __exports__.isArray = isArray;

  function escapeExpression(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof SafeString) {
      return string.toString();
    } else if (!string && string !== 0) {
      return "";
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = "" + string;

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }

  __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  __exports__.isEmpty = isEmpty;
  return __exports__;
})(__module4__);

// handlebars/exception.js
var __module5__ = (function() {
  "use strict";
  var __exports__;

  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  function Exception(/* message */) {
    var tmp = Error.prototype.constructor.apply(this, arguments);

    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }
  }

  Exception.prototype = new Error();

  __exports__ = Exception;
  return __exports__;
})();

// handlebars/base.js
var __module2__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  /*globals Exception, Utils */
  var Utils = __dependency1__;
  var Exception = __dependency2__;

  var VERSION = "1.1.2";
  __exports__.VERSION = VERSION;var COMPILER_REVISION = 4;
  __exports__.COMPILER_REVISION = COMPILER_REVISION;
  var REVISION_CHANGES = {
    1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
    2: '== 1.0.0-rc.3',
    3: '== 1.0.0-rc.4',
    4: '>= 1.0.0'
  };
  __exports__.REVISION_CHANGES = REVISION_CHANGES;
  var isArray = Utils.isArray,
      isFunction = Utils.isFunction,
      toString = Utils.toString,
      objectType = '[object Object]';

  function HandlebarsEnvironment(helpers, partials) {
    this.helpers = helpers || {};
    this.partials = partials || {};

    registerDefaultHelpers(this);
  }

  __exports__.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
    constructor: HandlebarsEnvironment,

    logger: logger,
    log: log,

    registerHelper: function(name, fn, inverse) {
      if (toString.call(name) === objectType) {
        if (inverse || fn) { throw new Exception('Arg not supported with multiple helpers'); }
        Utils.extend(this.helpers, name);
      } else {
        if (inverse) { fn.not = inverse; }
        this.helpers[name] = fn;
      }
    },

    registerPartial: function(name, str) {
      if (toString.call(name) === objectType) {
        Utils.extend(this.partials,  name);
      } else {
        this.partials[name] = str;
      }
    }
  };

  function registerDefaultHelpers(instance) {
    instance.registerHelper('helperMissing', function(arg) {
      if(arguments.length === 2) {
        return undefined;
      } else {
        throw new Error("Missing helper: '" + arg + "'");
      }
    });

    instance.registerHelper('blockHelperMissing', function(context, options) {
      var inverse = options.inverse || function() {}, fn = options.fn;

      if (isFunction(context)) { context = context.call(this); }

      if(context === true) {
        return fn(this);
      } else if(context === false || context == null) {
        return inverse(this);
      } else if (isArray(context)) {
        if(context.length > 0) {
          return instance.helpers.each(context, options);
        } else {
          return inverse(this);
        }
      } else {
        return fn(context);
      }
    });

    instance.registerHelper('each', function(context, options) {
      var fn = options.fn, inverse = options.inverse;
      var i = 0, ret = "", data;

      if (isFunction(context)) { context = context.call(this); }

      if (options.data) {
        data = createFrame(options.data);
      }

      if(context && typeof context === 'object') {
        if (isArray(context)) {
          for(var j = context.length; i<j; i++) {
            if (data) {
              data.index = i;
              data.first = (i === 0)
              data.last  = (i === (context.length-1));
            }
            ret = ret + fn(context[i], { data: data });
          }
        } else {
          for(var key in context) {
            if(context.hasOwnProperty(key)) {
              if(data) { data.key = key; }
              ret = ret + fn(context[key], {data: data});
              i++;
            }
          }
        }
      }

      if(i === 0){
        ret = inverse(this);
      }

      return ret;
    });

    instance.registerHelper('if', function(conditional, options) {
      if (isFunction(conditional)) { conditional = conditional.call(this); }

      // Default behavior is to render the positive path if the value is truthy and not empty.
      // The `includeZero` option may be set to treat the condtional as purely not empty based on the
      // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
      if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });

    instance.registerHelper('unless', function(conditional, options) {
      return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
    });

    instance.registerHelper('with', function(context, options) {
      if (isFunction(context)) { context = context.call(this); }

      if (!Utils.isEmpty(context)) return options.fn(context);
    });

    instance.registerHelper('log', function(context, options) {
      var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
      instance.log(level, context);
    });
  }

  var logger = {
    methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

    // State enum
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    level: 3,

    // can be overridden in the host environment
    log: function(level, obj) {
      if (logger.level <= level) {
        var method = logger.methodMap[level];
        if (typeof console !== 'undefined' && console[method]) {
          console[method].call(console, obj);
        }
      }
    }
  };
  __exports__.logger = logger;
  function log(level, obj) { logger.log(level, obj); }

  __exports__.log = log;var createFrame = function(object) {
    var obj = {};
    Utils.extend(obj, object);
    return obj;
  };
  __exports__.createFrame = createFrame;
  return __exports__;
})(__module3__, __module5__);

// handlebars/runtime.js
var __module6__ = (function(__dependency1__, __dependency2__, __dependency3__) {
  "use strict";
  var __exports__ = {};
  /*global Utils */
  var Utils = __dependency1__;
  var Exception = __dependency2__;
  var COMPILER_REVISION = __dependency3__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency3__.REVISION_CHANGES;

  function checkRevision(compilerInfo) {
    var compilerRevision = compilerInfo && compilerInfo[0] || 1,
        currentRevision = COMPILER_REVISION;

    if (compilerRevision !== currentRevision) {
      if (compilerRevision < currentRevision) {
        var runtimeVersions = REVISION_CHANGES[currentRevision],
            compilerVersions = REVISION_CHANGES[compilerRevision];
        throw new Error("Template was precompiled with an older version of Handlebars than the current runtime. "+
              "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
      } else {
        // Use the embedded version info since the runtime doesn't know about this revision yet
        throw new Error("Template was precompiled with a newer version of Handlebars than the current runtime. "+
              "Please update your runtime to a newer version ("+compilerInfo[1]+").");
      }
    }
  }

  // TODO: Remove this line and break up compilePartial

  function template(templateSpec, env) {
    if (!env) {
      throw new Error("No environment passed to template");
    }

    var invokePartialWrapper;
    if (env.compile) {
      invokePartialWrapper = function(partial, name, context, helpers, partials, data) {
        // TODO : Check this for all inputs and the options handling (partial flag, etc). This feels
        // like there should be a common exec path
        var result = invokePartial.apply(this, arguments);
        if (result) { return result; }

        var options = { helpers: helpers, partials: partials, data: data };
        partials[name] = env.compile(partial, { data: data !== undefined }, env);
        return partials[name](context, options);
      };
    } else {
      invokePartialWrapper = function(partial, name /* , context, helpers, partials, data */) {
        var result = invokePartial.apply(this, arguments);
        if (result) { return result; }
        throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
      };
    }

    // Just add water
    var container = {
      escapeExpression: Utils.escapeExpression,
      invokePartial: invokePartialWrapper,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          programWrapper = program(i, fn, data);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = program(i, fn);
        }
        return programWrapper;
      },
      merge: function(param, common) {
        var ret = param || common;

        if (param && common && (param !== common)) {
          ret = {};
          Utils.extend(ret, common);
          Utils.extend(ret, param);
        }
        return ret;
      },
      programWithDepth: programWithDepth,
      noop: noop,
      compilerInfo: null
    };

    return function(context, options) {
      options = options || {};
      var namespace = options.partial ? options : env,
          helpers,
          partials;

      if (!options.partial) {
        helpers = options.helpers;
        partials = options.partials;
      }
      var result = templateSpec.call(
            container,
            namespace, context,
            helpers,
            partials,
            options.data);

      if (!options.partial) {
        checkRevision(container.compilerInfo);
      }

      return result;
    };
  }

  __exports__.template = template;function programWithDepth(i, fn, data /*, $depth */) {
    var args = Array.prototype.slice.call(arguments, 3);

    var prog = function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
    prog.program = i;
    prog.depth = args.length;
    return prog;
  }

  __exports__.programWithDepth = programWithDepth;function program(i, fn, data) {
    var prog = function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
    prog.program = i;
    prog.depth = 0;
    return prog;
  }

  __exports__.program = program;function invokePartial(partial, name, context, helpers, partials, data) {
    var options = { partial: true, helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    }
  }

  __exports__.invokePartial = invokePartial;function noop() { return ""; }

  __exports__.noop = noop;
  return __exports__;
})(__module3__, __module5__, __module2__);

// handlebars.runtime.js
var __module1__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  var base = __dependency1__;

  // Each of these augment the Handlebars object. No need to setup here.
  // (This is done to easily share code between commonjs and browse envs)
  var SafeString = __dependency2__;
  var Exception = __dependency3__;
  var Utils = __dependency4__;
  var runtime = __dependency5__;

  // For compatibility and usage outside of module systems, make the Handlebars object a namespace
  var create = function() {
    var hb = new base.HandlebarsEnvironment();

    Utils.extend(hb, base);
    hb.SafeString = SafeString;
    hb.Exception = Exception;
    hb.Utils = Utils;

    hb.VM = runtime;
    hb.template = function(spec) {
      return runtime.template(spec, hb);
    };

    return hb;
  };

  var Handlebars = create();
  Handlebars.create = create;

  __exports__ = Handlebars;
  return __exports__;
})(__module2__, __module4__, __module5__, __module3__, __module6__);

// handlebars/compiler/ast.js
var __module7__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  var Exception = __dependency1__;

  function ProgramNode(statements, inverseStrip, inverse) {
    this.type = "program";
    this.statements = statements;
    this.strip = {};

    if(inverse) {
      this.inverse = new ProgramNode(inverse, inverseStrip);
      this.strip.right = inverseStrip.left;
    } else if (inverseStrip) {
      this.strip.left = inverseStrip.right;
    }
  }

  __exports__.ProgramNode = ProgramNode;function MustacheNode(rawParams, hash, open, strip) {
    this.type = "mustache";
    this.hash = hash;
    this.strip = strip;

    var escapeFlag = open[3] || open[2];
    this.escaped = escapeFlag !== '{' && escapeFlag !== '&';

    var id = this.id = rawParams[0];
    var params = this.params = rawParams.slice(1);

    // a mustache is an eligible helper if:
    // * its id is simple (a single part, not `this` or `..`)
    var eligibleHelper = this.eligibleHelper = id.isSimple;

    // a mustache is definitely a helper if:
    // * it is an eligible helper, and
    // * it has at least one parameter or hash segment
    this.isHelper = eligibleHelper && (params.length || hash);

    // if a mustache is an eligible helper but not a definite
    // helper, it is ambiguous, and will be resolved in a later
    // pass or at runtime.
  }

  __exports__.MustacheNode = MustacheNode;function PartialNode(partialName, context, strip) {
    this.type         = "partial";
    this.partialName  = partialName;
    this.context      = context;
    this.strip = strip;
  }

  __exports__.PartialNode = PartialNode;function BlockNode(mustache, program, inverse, close) {
    if(mustache.id.original !== close.path.original) {
      throw new Exception(mustache.id.original + " doesn't match " + close.path.original);
    }

    this.type = "block";
    this.mustache = mustache;
    this.program  = program;
    this.inverse  = inverse;

    this.strip = {
      left: mustache.strip.left,
      right: close.strip.right
    };

    (program || inverse).strip.left = mustache.strip.right;
    (inverse || program).strip.right = close.strip.left;

    if (inverse && !program) {
      this.isInverse = true;
    }
  }

  __exports__.BlockNode = BlockNode;function ContentNode(string) {
    this.type = "content";
    this.string = string;
  }

  __exports__.ContentNode = ContentNode;function HashNode(pairs) {
    this.type = "hash";
    this.pairs = pairs;
  }

  __exports__.HashNode = HashNode;function IdNode(parts) {
    this.type = "ID";

    var original = "",
        dig = [],
        depth = 0;

    for(var i=0,l=parts.length; i<l; i++) {
      var part = parts[i].part;
      original += (parts[i].separator || '') + part;

      if (part === ".." || part === "." || part === "this") {
        if (dig.length > 0) { throw new Exception("Invalid path: " + original); }
        else if (part === "..") { depth++; }
        else { this.isScoped = true; }
      }
      else { dig.push(part); }
    }

    this.original = original;
    this.parts    = dig;
    this.string   = dig.join('.');
    this.depth    = depth;

    // an ID is simple if it only has one part, and that part is not
    // `..` or `this`.
    this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;

    this.stringModeValue = this.string;
  }

  __exports__.IdNode = IdNode;function PartialNameNode(name) {
    this.type = "PARTIAL_NAME";
    this.name = name.original;
  }

  __exports__.PartialNameNode = PartialNameNode;function DataNode(id) {
    this.type = "DATA";
    this.id = id;
  }

  __exports__.DataNode = DataNode;function StringNode(string) {
    this.type = "STRING";
    this.original =
      this.string =
      this.stringModeValue = string;
  }

  __exports__.StringNode = StringNode;function IntegerNode(integer) {
    this.type = "INTEGER";
    this.original =
      this.integer = integer;
    this.stringModeValue = Number(integer);
  }

  __exports__.IntegerNode = IntegerNode;function BooleanNode(bool) {
    this.type = "BOOLEAN";
    this.bool = bool;
    this.stringModeValue = bool === "true";
  }

  __exports__.BooleanNode = BooleanNode;function CommentNode(comment) {
    this.type = "comment";
    this.comment = comment;
  }

  __exports__.CommentNode = CommentNode;
  return __exports__;
})(__module5__);

// handlebars/compiler/parser.js
var __module9__ = (function() {
  "use strict";
  var __exports__;
  /* Jison generated parser */
  var handlebars = (function(){
  var parser = {trace: function trace() { },
  yy: {},
  symbols_: {"error":2,"root":3,"statements":4,"EOF":5,"program":6,"simpleInverse":7,"statement":8,"openInverse":9,"closeBlock":10,"openBlock":11,"mustache":12,"partial":13,"CONTENT":14,"COMMENT":15,"OPEN_BLOCK":16,"inMustache":17,"CLOSE":18,"OPEN_INVERSE":19,"OPEN_ENDBLOCK":20,"path":21,"OPEN":22,"OPEN_UNESCAPED":23,"CLOSE_UNESCAPED":24,"OPEN_PARTIAL":25,"partialName":26,"partial_option0":27,"inMustache_repetition0":28,"inMustache_option0":29,"dataName":30,"param":31,"STRING":32,"INTEGER":33,"BOOLEAN":34,"hash":35,"hash_repetition_plus0":36,"hashSegment":37,"ID":38,"EQUALS":39,"DATA":40,"pathSegments":41,"SEP":42,"$accept":0,"$end":1},
  terminals_: {2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"CLOSE_UNESCAPED",25:"OPEN_PARTIAL",32:"STRING",33:"INTEGER",34:"BOOLEAN",38:"ID",39:"EQUALS",40:"DATA",42:"SEP"},
  productions_: [0,[3,2],[3,1],[6,2],[6,3],[6,2],[6,1],[6,1],[6,0],[4,1],[4,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,4],[7,2],[17,3],[17,1],[31,1],[31,1],[31,1],[31,1],[31,1],[35,1],[37,3],[26,1],[26,1],[26,1],[30,2],[21,1],[41,3],[41,1],[27,0],[27,1],[28,0],[28,2],[29,0],[29,1],[36,1],[36,2]],
  performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

  var $0 = $$.length - 1;
  switch (yystate) {
  case 1: return new yy.ProgramNode($$[$0-1]); 
  break;
  case 2: return new yy.ProgramNode([]); 
  break;
  case 3:this.$ = new yy.ProgramNode([], $$[$0-1], $$[$0]);
  break;
  case 4:this.$ = new yy.ProgramNode($$[$0-2], $$[$0-1], $$[$0]);
  break;
  case 5:this.$ = new yy.ProgramNode($$[$0-1], $$[$0], []);
  break;
  case 6:this.$ = new yy.ProgramNode($$[$0]);
  break;
  case 7:this.$ = new yy.ProgramNode([]);
  break;
  case 8:this.$ = new yy.ProgramNode([]);
  break;
  case 9:this.$ = [$$[$0]];
  break;
  case 10: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
  break;
  case 11:this.$ = new yy.BlockNode($$[$0-2], $$[$0-1].inverse, $$[$0-1], $$[$0]);
  break;
  case 12:this.$ = new yy.BlockNode($$[$0-2], $$[$0-1], $$[$0-1].inverse, $$[$0]);
  break;
  case 13:this.$ = $$[$0];
  break;
  case 14:this.$ = $$[$0];
  break;
  case 15:this.$ = new yy.ContentNode($$[$0]);
  break;
  case 16:this.$ = new yy.CommentNode($$[$0]);
  break;
  case 17:this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], $$[$0-2], stripFlags($$[$0-2], $$[$0]));
  break;
  case 18:this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], $$[$0-2], stripFlags($$[$0-2], $$[$0]));
  break;
  case 19:this.$ = {path: $$[$0-1], strip: stripFlags($$[$0-2], $$[$0])};
  break;
  case 20:this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], $$[$0-2], stripFlags($$[$0-2], $$[$0]));
  break;
  case 21:this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], $$[$0-2], stripFlags($$[$0-2], $$[$0]));
  break;
  case 22:this.$ = new yy.PartialNode($$[$0-2], $$[$0-1], stripFlags($$[$0-3], $$[$0]));
  break;
  case 23:this.$ = stripFlags($$[$0-1], $$[$0]);
  break;
  case 24:this.$ = [[$$[$0-2]].concat($$[$0-1]), $$[$0]];
  break;
  case 25:this.$ = [[$$[$0]], null];
  break;
  case 26:this.$ = $$[$0];
  break;
  case 27:this.$ = new yy.StringNode($$[$0]);
  break;
  case 28:this.$ = new yy.IntegerNode($$[$0]);
  break;
  case 29:this.$ = new yy.BooleanNode($$[$0]);
  break;
  case 30:this.$ = $$[$0];
  break;
  case 31:this.$ = new yy.HashNode($$[$0]);
  break;
  case 32:this.$ = [$$[$0-2], $$[$0]];
  break;
  case 33:this.$ = new yy.PartialNameNode($$[$0]);
  break;
  case 34:this.$ = new yy.PartialNameNode(new yy.StringNode($$[$0]));
  break;
  case 35:this.$ = new yy.PartialNameNode(new yy.IntegerNode($$[$0]));
  break;
  case 36:this.$ = new yy.DataNode($$[$0]);
  break;
  case 37:this.$ = new yy.IdNode($$[$0]);
  break;
  case 38: $$[$0-2].push({part: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
  break;
  case 39:this.$ = [{part: $$[$0]}];
  break;
  case 42:this.$ = [];
  break;
  case 43:$$[$0-1].push($$[$0]);
  break;
  case 46:this.$ = [$$[$0]];
  break;
  case 47:$$[$0-1].push($$[$0]);
  break;
  }
  },
  table: [{3:1,4:2,5:[1,3],8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[3]},{5:[1,16],8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[2,2]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],25:[2,9]},{4:20,6:18,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{4:20,6:22,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{5:[2,13],14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],25:[2,13]},{5:[2,14],14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],25:[2,14]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],25:[2,15]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],25:[2,16]},{17:23,21:24,30:25,38:[1,28],40:[1,27],41:26},{17:29,21:24,30:25,38:[1,28],40:[1,27],41:26},{17:30,21:24,30:25,38:[1,28],40:[1,27],41:26},{17:31,21:24,30:25,38:[1,28],40:[1,27],41:26},{21:33,26:32,32:[1,34],33:[1,35],38:[1,28],41:26},{1:[2,1]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],25:[2,10]},{10:36,20:[1,37]},{4:38,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,7],22:[1,13],23:[1,14],25:[1,15]},{7:39,8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,6],22:[1,13],23:[1,14],25:[1,15]},{17:23,18:[1,40],21:24,30:25,38:[1,28],40:[1,27],41:26},{10:41,20:[1,37]},{18:[1,42]},{18:[2,42],24:[2,42],28:43,32:[2,42],33:[2,42],34:[2,42],38:[2,42],40:[2,42]},{18:[2,25],24:[2,25]},{18:[2,37],24:[2,37],32:[2,37],33:[2,37],34:[2,37],38:[2,37],40:[2,37],42:[1,44]},{21:45,38:[1,28],41:26},{18:[2,39],24:[2,39],32:[2,39],33:[2,39],34:[2,39],38:[2,39],40:[2,39],42:[2,39]},{18:[1,46]},{18:[1,47]},{24:[1,48]},{18:[2,40],21:50,27:49,38:[1,28],41:26},{18:[2,33],38:[2,33]},{18:[2,34],38:[2,34]},{18:[2,35],38:[2,35]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],25:[2,11]},{21:51,38:[1,28],41:26},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,3],22:[1,13],23:[1,14],25:[1,15]},{4:52,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,5],22:[1,13],23:[1,14],25:[1,15]},{14:[2,23],15:[2,23],16:[2,23],19:[2,23],20:[2,23],22:[2,23],23:[2,23],25:[2,23]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],25:[2,12]},{14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],25:[2,18]},{18:[2,44],21:56,24:[2,44],29:53,30:60,31:54,32:[1,57],33:[1,58],34:[1,59],35:55,36:61,37:62,38:[1,63],40:[1,27],41:26},{38:[1,64]},{18:[2,36],24:[2,36],32:[2,36],33:[2,36],34:[2,36],38:[2,36],40:[2,36]},{14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],25:[2,17]},{5:[2,20],14:[2,20],15:[2,20],16:[2,20],19:[2,20],20:[2,20],22:[2,20],23:[2,20],25:[2,20]},{5:[2,21],14:[2,21],15:[2,21],16:[2,21],19:[2,21],20:[2,21],22:[2,21],23:[2,21],25:[2,21]},{18:[1,65]},{18:[2,41]},{18:[1,66]},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],25:[1,15]},{18:[2,24],24:[2,24]},{18:[2,43],24:[2,43],32:[2,43],33:[2,43],34:[2,43],38:[2,43],40:[2,43]},{18:[2,45],24:[2,45]},{18:[2,26],24:[2,26],32:[2,26],33:[2,26],34:[2,26],38:[2,26],40:[2,26]},{18:[2,27],24:[2,27],32:[2,27],33:[2,27],34:[2,27],38:[2,27],40:[2,27]},{18:[2,28],24:[2,28],32:[2,28],33:[2,28],34:[2,28],38:[2,28],40:[2,28]},{18:[2,29],24:[2,29],32:[2,29],33:[2,29],34:[2,29],38:[2,29],40:[2,29]},{18:[2,30],24:[2,30],32:[2,30],33:[2,30],34:[2,30],38:[2,30],40:[2,30]},{18:[2,31],24:[2,31],37:67,38:[1,68]},{18:[2,46],24:[2,46],38:[2,46]},{18:[2,39],24:[2,39],32:[2,39],33:[2,39],34:[2,39],38:[2,39],39:[1,69],40:[2,39],42:[2,39]},{18:[2,38],24:[2,38],32:[2,38],33:[2,38],34:[2,38],38:[2,38],40:[2,38],42:[2,38]},{5:[2,22],14:[2,22],15:[2,22],16:[2,22],19:[2,22],20:[2,22],22:[2,22],23:[2,22],25:[2,22]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],25:[2,19]},{18:[2,47],24:[2,47],38:[2,47]},{39:[1,69]},{21:56,30:60,31:70,32:[1,57],33:[1,58],34:[1,59],38:[1,28],40:[1,27],41:26},{18:[2,32],24:[2,32],38:[2,32]}],
  defaultActions: {3:[2,2],16:[2,1],50:[2,41]},
  parseError: function parseError(str, hash) {
      throw new Error(str);
  },
  parse: function parse(input) {
      var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
      this.yy.lexer = this.lexer;
      this.yy.parser = this;
      if (typeof this.lexer.yylloc == "undefined")
          this.lexer.yylloc = {};
      var yyloc = this.lexer.yylloc;
      lstack.push(yyloc);
      var ranges = this.lexer.options && this.lexer.options.ranges;
      if (typeof this.yy.parseError === "function")
          this.parseError = this.yy.parseError;
      function popStack(n) {
          stack.length = stack.length - 2 * n;
          vstack.length = vstack.length - n;
          lstack.length = lstack.length - n;
      }
      function lex() {
          var token;
          token = self.lexer.lex() || 1;
          if (typeof token !== "number") {
              token = self.symbols_[token] || token;
          }
          return token;
      }
      var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
      while (true) {
          state = stack[stack.length - 1];
          if (this.defaultActions[state]) {
              action = this.defaultActions[state];
          } else {
              if (symbol === null || typeof symbol == "undefined") {
                  symbol = lex();
              }
              action = table[state] && table[state][symbol];
          }
          if (typeof action === "undefined" || !action.length || !action[0]) {
              var errStr = "";
              if (!recovering) {
                  expected = [];
                  for (p in table[state])
                      if (this.terminals_[p] && p > 2) {
                          expected.push("'" + this.terminals_[p] + "'");
                      }
                  if (this.lexer.showPosition) {
                      errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                  } else {
                      errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                  }
                  this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
              }
          }
          if (action[0] instanceof Array && action.length > 1) {
              throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
          }
          switch (action[0]) {
          case 1:
              stack.push(symbol);
              vstack.push(this.lexer.yytext);
              lstack.push(this.lexer.yylloc);
              stack.push(action[1]);
              symbol = null;
              if (!preErrorSymbol) {
                  yyleng = this.lexer.yyleng;
                  yytext = this.lexer.yytext;
                  yylineno = this.lexer.yylineno;
                  yyloc = this.lexer.yylloc;
                  if (recovering > 0)
                      recovering--;
              } else {
                  symbol = preErrorSymbol;
                  preErrorSymbol = null;
              }
              break;
          case 2:
              len = this.productions_[action[1]][1];
              yyval.$ = vstack[vstack.length - len];
              yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
              if (ranges) {
                  yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
              }
              r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
              if (typeof r !== "undefined") {
                  return r;
              }
              if (len) {
                  stack = stack.slice(0, -1 * len * 2);
                  vstack = vstack.slice(0, -1 * len);
                  lstack = lstack.slice(0, -1 * len);
              }
              stack.push(this.productions_[action[1]][0]);
              vstack.push(yyval.$);
              lstack.push(yyval._$);
              newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
              stack.push(newState);
              break;
          case 3:
              return true;
          }
      }
      return true;
  }
  };


  function stripFlags(open, close) {
    return {
      left: open[2] === '~',
      right: close[0] === '~' || close[1] === '~'
    };
  }

  /* Jison generated lexer */
  var lexer = (function(){
  var lexer = ({EOF:1,
  parseError:function parseError(str, hash) {
          if (this.yy.parser) {
              this.yy.parser.parseError(str, hash);
          } else {
              throw new Error(str);
          }
      },
  setInput:function (input) {
          this._input = input;
          this._more = this._less = this.done = false;
          this.yylineno = this.yyleng = 0;
          this.yytext = this.matched = this.match = '';
          this.conditionStack = ['INITIAL'];
          this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
          if (this.options.ranges) this.yylloc.range = [0,0];
          this.offset = 0;
          return this;
      },
  input:function () {
          var ch = this._input[0];
          this.yytext += ch;
          this.yyleng++;
          this.offset++;
          this.match += ch;
          this.matched += ch;
          var lines = ch.match(/(?:\r\n?|\n).*/g);
          if (lines) {
              this.yylineno++;
              this.yylloc.last_line++;
          } else {
              this.yylloc.last_column++;
          }
          if (this.options.ranges) this.yylloc.range[1]++;

          this._input = this._input.slice(1);
          return ch;
      },
  unput:function (ch) {
          var len = ch.length;
          var lines = ch.split(/(?:\r\n?|\n)/g);

          this._input = ch + this._input;
          this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
          //this.yyleng -= len;
          this.offset -= len;
          var oldLines = this.match.split(/(?:\r\n?|\n)/g);
          this.match = this.match.substr(0, this.match.length-1);
          this.matched = this.matched.substr(0, this.matched.length-1);

          if (lines.length-1) this.yylineno -= lines.length-1;
          var r = this.yylloc.range;

          this.yylloc = {first_line: this.yylloc.first_line,
            last_line: this.yylineno+1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
                this.yylloc.first_column - len
            };

          if (this.options.ranges) {
              this.yylloc.range = [r[0], r[0] + this.yyleng - len];
          }
          return this;
      },
  more:function () {
          this._more = true;
          return this;
      },
  less:function (n) {
          this.unput(this.match.slice(n));
      },
  pastInput:function () {
          var past = this.matched.substr(0, this.matched.length - this.match.length);
          return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
      },
  upcomingInput:function () {
          var next = this.match;
          if (next.length < 20) {
              next += this._input.substr(0, 20-next.length);
          }
          return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
      },
  showPosition:function () {
          var pre = this.pastInput();
          var c = new Array(pre.length + 1).join("-");
          return pre + this.upcomingInput() + "\n" + c+"^";
      },
  next:function () {
          if (this.done) {
              return this.EOF;
          }
          if (!this._input) this.done = true;

          var token,
              match,
              tempMatch,
              index,
              col,
              lines;
          if (!this._more) {
              this.yytext = '';
              this.match = '';
          }
          var rules = this._currentRules();
          for (var i=0;i < rules.length; i++) {
              tempMatch = this._input.match(this.rules[rules[i]]);
              if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                  match = tempMatch;
                  index = i;
                  if (!this.options.flex) break;
              }
          }
          if (match) {
              lines = match[0].match(/(?:\r\n?|\n).*/g);
              if (lines) this.yylineno += lines.length;
              this.yylloc = {first_line: this.yylloc.last_line,
                             last_line: this.yylineno+1,
                             first_column: this.yylloc.last_column,
                             last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
              this.yytext += match[0];
              this.match += match[0];
              this.matches = match;
              this.yyleng = this.yytext.length;
              if (this.options.ranges) {
                  this.yylloc.range = [this.offset, this.offset += this.yyleng];
              }
              this._more = false;
              this._input = this._input.slice(match[0].length);
              this.matched += match[0];
              token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
              if (this.done && this._input) this.done = false;
              if (token) return token;
              else return;
          }
          if (this._input === "") {
              return this.EOF;
          } else {
              return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                      {text: "", token: null, line: this.yylineno});
          }
      },
  lex:function lex() {
          var r = this.next();
          if (typeof r !== 'undefined') {
              return r;
          } else {
              return this.lex();
          }
      },
  begin:function begin(condition) {
          this.conditionStack.push(condition);
      },
  popState:function popState() {
          return this.conditionStack.pop();
      },
  _currentRules:function _currentRules() {
          return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
      },
  topState:function () {
          return this.conditionStack[this.conditionStack.length-2];
      },
  pushState:function begin(condition) {
          this.begin(condition);
      }});
  lexer.options = {};
  lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {


  function strip(start, end) {
    return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng-end);
  }


  var YYSTATE=YY_START
  switch($avoiding_name_collisions) {
  case 0:
                                     if(yy_.yytext.slice(-2) === "\\\\") {
                                       strip(0,1);
                                       this.begin("mu");
                                     } else if(yy_.yytext.slice(-1) === "\\") {
                                       strip(0,1);
                                       this.begin("emu");
                                     } else {
                                       this.begin("mu");
                                     }
                                     if(yy_.yytext) return 14;
                                   
  break;
  case 1:return 14;
  break;
  case 2:
                                     if(yy_.yytext.slice(-1) !== "\\") this.popState();
                                     if(yy_.yytext.slice(-1) === "\\") strip(0,1);
                                     return 14;
                                   
  break;
  case 3:strip(0,4); this.popState(); return 15;
  break;
  case 4:return 25;
  break;
  case 5:return 16;
  break;
  case 6:return 20;
  break;
  case 7:return 19;
  break;
  case 8:return 19;
  break;
  case 9:return 23;
  break;
  case 10:return 22;
  break;
  case 11:this.popState(); this.begin('com');
  break;
  case 12:strip(3,5); this.popState(); return 15;
  break;
  case 13:return 22;
  break;
  case 14:return 39;
  break;
  case 15:return 38;
  break;
  case 16:return 38;
  break;
  case 17:return 42;
  break;
  case 18:/*ignore whitespace*/
  break;
  case 19:this.popState(); return 24;
  break;
  case 20:this.popState(); return 18;
  break;
  case 21:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 32;
  break;
  case 22:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 32;
  break;
  case 23:return 40;
  break;
  case 24:return 34;
  break;
  case 25:return 34;
  break;
  case 26:return 33;
  break;
  case 27:return 38;
  break;
  case 28:yy_.yytext = strip(1,2); return 38;
  break;
  case 29:return 'INVALID';
  break;
  case 30:return 5;
  break;
  }
  };
  lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|$)))/,/^(?:[\s\S]*?--\}\})/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{!--)/,/^(?:\{\{![\s\S]*?\}\})/,/^(?:\{\{(~)?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s])))/,/^(?:false(?=([~}\s])))/,/^(?:-?[0-9]+(?=([~}\s])))/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.]))))/,/^(?:\[[^\]]*\])/,/^(?:.)/,/^(?:$)/];
  lexer.conditions = {"mu":{"rules":[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[3],"inclusive":false},"INITIAL":{"rules":[0,1,30],"inclusive":true}};
  return lexer;})()
  parser.lexer = lexer;
  function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
  return new Parser;
  })();__exports__ = handlebars;
  return __exports__;
})();

// handlebars/compiler/base.js
var __module8__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var parser = __dependency1__;
  var AST = __dependency2__;

  __exports__.parser = parser;

  function parse(input) {
    // Just return if an already-compile AST was passed in.
    if(input.constructor === AST.ProgramNode) { return input; }

    parser.yy = AST;
    return parser.parse(input);
  }

  __exports__.parse = parse;
  return __exports__;
})(__module9__, __module7__);

// handlebars/compiler/javascript-compiler.js
var __module11__ = (function(__dependency1__) {
  "use strict";
  var __exports__;
  var COMPILER_REVISION = __dependency1__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency1__.REVISION_CHANGES;
  var log = __dependency1__.log;

  function Literal(value) {
    this.value = value;
  }

  function JavaScriptCompiler() {}

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name /* , type*/) {
      var wrap,
          ret;
      if (parent.indexOf('depth') === 0) {
        wrap = true;
      }

      if (/^[0-9]+$/.test(name)) {
        ret = parent + "[" + name + "]";
      } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
        ret = parent + "." + name;
      }
      else {
        ret = parent + "['" + name + "']";
      }

      if (wrap) {
        return '(' + parent + ' && ' + ret + ')';
      } else {
        return ret;
      }
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return {
          appendToBuffer: true,
          content: string,
          toString: function() { return "buffer += " + string + ";"; }
        };
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options || {};

      log('debug', this.environment.disassemble() + "\n\n");

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        environments: [],
        aliases: { }
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];
      this.registers = { list: [] };
      this.compileStack = [];
      this.inlineStack = [];

      this.compileChildren(environment, options);

      var opcodes = environment.opcodes, opcode;

      this.i = 0;

      for(var l=opcodes.length; this.i<l; this.i++) {
        opcode = opcodes[this.i];

        if(opcode.opcode === 'DECLARE') {
          this[opcode.name] = opcode.value;
        } else {
          this[opcode.opcode].apply(this, opcode.args);
        }

        // Reset the stripNext flag if it was not set by this operation.
        if (opcode.opcode !== this.stripNext) {
          this.stripNext = false;
        }
      }

      // Flush any trailing content that might be pending.
      this.pushSource('');

      return this.createFunctionContext(asObject);
    },

    preamble: function() {
      var out = [];

      if (!this.isChild) {
        var namespace = this.namespace;

        var copies = "helpers = this.merge(helpers, " + namespace + ".helpers);";
        if (this.environment.usePartial) { copies = copies + " partials = this.merge(partials, " + namespace + ".partials);"; }
        if (this.options.data) { copies = copies + " data = data || {};"; }
        out.push(copies);
      } else {
        out.push('');
      }

      if (!this.environment.isSimple) {
        out.push(", buffer = " + this.initializeBuffer());
      } else {
        out.push("");
      }

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunctionContext: function(asObject) {
      var locals = this.stackVars.concat(this.registers.list);

      if(locals.length > 0) {
        this.source[1] = this.source[1] + ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      if (!this.isChild) {
        for (var alias in this.context.aliases) {
          if (this.context.aliases.hasOwnProperty(alias)) {
            this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
          }
        }
      }

      if (this.source[1]) {
        this.source[1] = "var " + this.source[1].substring(2) + ";";
      }

      // Merge children
      if (!this.isChild) {
        this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
      }

      if (!this.environment.isSimple) {
        this.pushSource("return buffer;");
      }

      var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      // Perform a second pass over the output to merge content when possible
      var source = this.mergeSource();

      if (!this.isChild) {
        var revision = COMPILER_REVISION,
            versions = REVISION_CHANGES[revision];
        source = "this.compilerInfo = ["+revision+",'"+versions+"'];\n"+source;
      }

      if (asObject) {
        params.push(source);

        return Function.apply(this, params);
      } else {
        var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + source + '}';
        log('debug', functionSource + "\n\n");
        return functionSource;
      }
    },
    mergeSource: function() {
      // WARN: We are not handling the case where buffer is still populated as the source should
      // not have buffer append operations as their final action.
      var source = '',
          buffer;
      for (var i = 0, len = this.source.length; i < len; i++) {
        var line = this.source[i];
        if (line.appendToBuffer) {
          if (buffer) {
            buffer = buffer + '\n    + ' + line.content;
          } else {
            buffer = line.content;
          }
        } else {
          if (buffer) {
            source += 'buffer += ' + buffer + ';\n  ';
            buffer = undefined;
          }
          source += line + '\n  ';
        }
      }
      return source;
    },

    // [blockValue]
    //
    // On stack, before: hash, inverse, program, value
    // On stack, after: return value of blockHelperMissing
    //
    // The purpose of this opcode is to take a block of the form
    // `{{#foo}}...{{/foo}}`, resolve the value of `foo`, and
    // replace it on the stack with the result of properly
    // invoking blockHelperMissing.
    blockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      this.replaceStack(function(current) {
        params.splice(1, 0, current);
        return "blockHelperMissing.call(" + params.join(", ") + ")";
      });
    },

    // [ambiguousBlockValue]
    //
    // On stack, before: hash, inverse, program, value
    // Compiler value, before: lastHelper=value of last found helper, if any
    // On stack, after, if no lastHelper: same as [blockValue]
    // On stack, after, if lastHelper: value
    ambiguousBlockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      var current = this.topStack();
      params.splice(1, 0, current);

      // Use the options value generated from the invocation
      params[params.length-1] = 'options';

      this.pushSource("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
    },

    // [appendContent]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Appends the string value of `content` to the current buffer
    appendContent: function(content) {
      if (this.pendingContent) {
        content = this.pendingContent + content;
      }
      if (this.stripNext) {
        content = content.replace(/^\s+/, '');
      }

      this.pendingContent = content;
    },

    // [strip]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Removes any trailing whitespace from the prior content node and flags
    // the next operation for stripping if it is a content node.
    strip: function() {
      if (this.pendingContent) {
        this.pendingContent = this.pendingContent.replace(/\s+$/, '');
      }
      this.stripNext = 'strip';
    },

    // [append]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Coerces `value` to a String and appends it to the current buffer.
    //
    // If `value` is truthy, or 0, it is coerced into a string and appended
    // Otherwise, the empty string is appended
    append: function() {
      // Force anything that is inlined onto the stack so we don't have duplication
      // when we examine local
      this.flushInline();
      var local = this.popStack();
      this.pushSource("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
      if (this.environment.isSimple) {
        this.pushSource("else { " + this.appendToBuffer("''") + " }");
      }
    },

    // [appendEscaped]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Escape `value` and append it to the buffer
    appendEscaped: function() {
      this.context.aliases.escapeExpression = 'this.escapeExpression';

      this.pushSource(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
    },

    // [getContext]
    //
    // On stack, before: ...
    // On stack, after: ...
    // Compiler value, after: lastContext=depth
    //
    // Set the value of the `lastContext` compiler value to the depth
    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;
      }
    },

    // [lookupOnContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext[name], ...
    //
    // Looks up the value of `name` on the current context and pushes
    // it onto the stack.
    lookupOnContext: function(name) {
      this.push(this.nameLookup('depth' + this.lastContext, name, 'context'));
    },

    // [pushContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext, ...
    //
    // Pushes the value of the current context onto the stack.
    pushContext: function() {
      this.pushStackLiteral('depth' + this.lastContext);
    },

    // [resolvePossibleLambda]
    //
    // On stack, before: value, ...
    // On stack, after: resolved value, ...
    //
    // If the `value` is a lambda, replace it on the stack by
    // the return value of the lambda
    resolvePossibleLambda: function() {
      this.context.aliases.functionType = '"function"';

      this.replaceStack(function(current) {
        return "typeof " + current + " === functionType ? " + current + ".apply(depth0) : " + current;
      });
    },

    // [lookup]
    //
    // On stack, before: value, ...
    // On stack, after: value[name], ...
    //
    // Replace the value on the stack with the result of looking
    // up `name` on `value`
    lookup: function(name) {
      this.replaceStack(function(current) {
        return current + " == null || " + current + " === false ? " + current + " : " + this.nameLookup(current, name, 'context');
      });
    },

    // [lookupData]
    //
    // On stack, before: ...
    // On stack, after: data, ...
    //
    // Push the data lookup operator
    lookupData: function() {
      this.push('data');
    },

    // [pushStringParam]
    //
    // On stack, before: ...
    // On stack, after: string, currentContext, ...
    //
    // This opcode is designed for use in string mode, which
    // provides the string value of a parameter along with its
    // depth rather than resolving it immediately.
    pushStringParam: function(string, type) {
      this.pushStackLiteral('depth' + this.lastContext);

      this.pushString(type);

      if (typeof string === 'string') {
        this.pushString(string);
      } else {
        this.pushStackLiteral(string);
      }
    },

    emptyHash: function() {
      this.pushStackLiteral('{}');

      if (this.options.stringParams) {
        this.register('hashTypes', '{}');
        this.register('hashContexts', '{}');
      }
    },
    pushHash: function() {
      this.hash = {values: [], types: [], contexts: []};
    },
    popHash: function() {
      var hash = this.hash;
      this.hash = undefined;

      if (this.options.stringParams) {
        this.register('hashContexts', '{' + hash.contexts.join(',') + '}');
        this.register('hashTypes', '{' + hash.types.join(',') + '}');
      }
      this.push('{\n    ' + hash.values.join(',\n    ') + '\n  }');
    },

    // [pushString]
    //
    // On stack, before: ...
    // On stack, after: quotedString(string), ...
    //
    // Push a quoted version of `string` onto the stack
    pushString: function(string) {
      this.pushStackLiteral(this.quotedString(string));
    },

    // [push]
    //
    // On stack, before: ...
    // On stack, after: expr, ...
    //
    // Push an expression onto the stack
    push: function(expr) {
      this.inlineStack.push(expr);
      return expr;
    },

    // [pushLiteral]
    //
    // On stack, before: ...
    // On stack, after: value, ...
    //
    // Pushes a value onto the stack. This operation prevents
    // the compiler from creating a temporary variable to hold
    // it.
    pushLiteral: function(value) {
      this.pushStackLiteral(value);
    },

    // [pushProgram]
    //
    // On stack, before: ...
    // On stack, after: program(guid), ...
    //
    // Push a program expression onto the stack. This takes
    // a compile-time guid and converts it into a runtime-accessible
    // expression.
    pushProgram: function(guid) {
      if (guid != null) {
        this.pushStackLiteral(this.programExpression(guid));
      } else {
        this.pushStackLiteral(null);
      }
    },

    // [invokeHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // Pops off the helper's parameters, invokes the helper,
    // and pushes the helper's return value onto the stack.
    //
    // If the helper is not found, `helperMissing` is called.
    invokeHelper: function(paramSize, name) {
      this.context.aliases.helperMissing = 'helpers.helperMissing';

      var helper = this.lastHelper = this.setupHelper(paramSize, name, true);
      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');

      this.push(helper.name + ' || ' + nonHelper);
      this.replaceStack(function(name) {
        return name + ' ? ' + name + '.call(' +
            helper.callParams + ") " + ": helperMissing.call(" +
            helper.helperMissingParams + ")";
      });
    },

    // [invokeKnownHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // This operation is used when the helper is known to exist,
    // so a `helperMissing` fallback is not required.
    invokeKnownHelper: function(paramSize, name) {
      var helper = this.setupHelper(paramSize, name);
      this.push(helper.name + ".call(" + helper.callParams + ")");
    },

    // [invokeAmbiguous]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of disambiguation
    //
    // This operation is used when an expression like `{{foo}}`
    // is provided, but we don't know at compile-time whether it
    // is a helper or a path.
    //
    // This operation emits more code than the other options,
    // and can be avoided by passing the `knownHelpers` and
    // `knownHelpersOnly` flags at compile-time.
    invokeAmbiguous: function(name, helperCall) {
      this.context.aliases.functionType = '"function"';

      this.pushStackLiteral('{}');    // Hash value
      var helper = this.setupHelper(0, name, helperCall);

      var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');
      var nextStack = this.nextStack();

      this.pushSource('if (' + nextStack + ' = ' + helperName + ') { ' + nextStack + ' = ' + nextStack + '.call(' + helper.callParams + '); }');
      this.pushSource('else { ' + nextStack + ' = ' + nonHelper + '; ' + nextStack + ' = typeof ' + nextStack + ' === functionType ? ' + nextStack + '.call(' + helper.callParams + ') : ' + nextStack + '; }');
    },

    // [invokePartial]
    //
    // On stack, before: context, ...
    // On stack after: result of partial invocation
    //
    // This operation pops off a context, invokes a partial with that context,
    // and pushes the result of the invocation back.
    invokePartial: function(name) {
      var params = [this.nameLookup('partials', name, 'partial'), "'" + name + "'", this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      }

      this.context.aliases.self = "this";
      this.push("self.invokePartial(" + params.join(", ") + ")");
    },

    // [assignToHash]
    //
    // On stack, before: value, hash, ...
    // On stack, after: hash, ...
    //
    // Pops a value and hash off the stack, assigns `hash[key] = value`
    // and pushes the hash back onto the stack.
    assignToHash: function(key) {
      var value = this.popStack(),
          context,
          type;

      if (this.options.stringParams) {
        type = this.popStack();
        context = this.popStack();
      }

      var hash = this.hash;
      if (context) {
        hash.contexts.push("'" + key + "': " + context);
      }
      if (type) {
        hash.types.push("'" + key + "': " + type);
      }
      hash.values.push("'" + key + "': (" + value + ")");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        var index = this.matchExistingProgram(child);

        if (index == null) {
          this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
          index = this.context.programs.length;
          child.index = index;
          child.name = 'program' + index;
          this.context.programs[index] = compiler.compile(child, options, this.context);
          this.context.environments[index] = child;
        } else {
          child.index = index;
          child.name = 'program' + index;
        }
      }
    },
    matchExistingProgram: function(child) {
      for (var i = 0, len = this.context.environments.length; i < len; i++) {
        var environment = this.context.environments[i];
        if (environment && environment.equals(child)) {
          return i;
        }
      }
    },

    programExpression: function(guid) {
      this.context.aliases.self = "this";

      if(guid == null) {
        return "self.noop";
      }

      var child = this.environment.children[guid],
          depths = child.depths.list, depth;

      var programParams = [child.index, child.name, "data"];

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("depth0"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      return (depths.length === 0 ? "self.program(" : "self.programWithDepth(") + programParams.join(", ") + ")";
    },

    register: function(name, val) {
      this.useRegister(name);
      this.pushSource(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },

    pushStackLiteral: function(item) {
      return this.push(new Literal(item));
    },

    pushSource: function(source) {
      if (this.pendingContent) {
        this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));
        this.pendingContent = undefined;
      }

      if (source) {
        this.source.push(source);
      }
    },

    pushStack: function(item) {
      this.flushInline();

      var stack = this.incrStack();
      if (item) {
        this.pushSource(stack + " = " + item + ";");
      }
      this.compileStack.push(stack);
      return stack;
    },

    replaceStack: function(callback) {
      var prefix = '',
          inline = this.isInline(),
          stack;

      // If we are currently inline then we want to merge the inline statement into the
      // replacement statement via ','
      if (inline) {
        var top = this.popStack(true);

        if (top instanceof Literal) {
          // Literals do not need to be inlined
          stack = top.value;
        } else {
          // Get or create the current stack name for use by the inline
          var name = this.stackSlot ? this.topStackName() : this.incrStack();

          prefix = '(' + this.push(name) + ' = ' + top + '),';
          stack = this.topStack();
        }
      } else {
        stack = this.topStack();
      }

      var item = callback.call(this, stack);

      if (inline) {
        if (this.inlineStack.length || this.compileStack.length) {
          this.popStack();
        }
        this.push('(' + prefix + item + ')');
      } else {
        // Prevent modification of the context depth variable. Through replaceStack
        if (!/^stack/.test(stack)) {
          stack = this.nextStack();
        }

        this.pushSource(stack + " = (" + prefix + item + ");");
      }
      return stack;
    },

    nextStack: function() {
      return this.pushStack();
    },

    incrStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return this.topStackName();
    },
    topStackName: function() {
      return "stack" + this.stackSlot;
    },
    flushInline: function() {
      var inlineStack = this.inlineStack;
      if (inlineStack.length) {
        this.inlineStack = [];
        for (var i = 0, len = inlineStack.length; i < len; i++) {
          var entry = inlineStack[i];
          if (entry instanceof Literal) {
            this.compileStack.push(entry);
          } else {
            this.pushStack(entry);
          }
        }
      }
    },
    isInline: function() {
      return this.inlineStack.length;
    },

    popStack: function(wrapped) {
      var inline = this.isInline(),
          item = (inline ? this.inlineStack : this.compileStack).pop();

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        if (!inline) {
          this.stackSlot--;
        }
        return item;
      }
    },

    topStack: function(wrapped) {
      var stack = (this.isInline() ? this.inlineStack : this.compileStack),
          item = stack[stack.length - 1];

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        return item;
      }
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\u2028/g, '\\u2028')   // Per Ecma-262 7.3 + 7.8.4
        .replace(/\u2029/g, '\\u2029') + '"';
    },

    setupHelper: function(paramSize, name, missingParams) {
      var params = [];
      this.setupParams(paramSize, params, missingParams);
      var foundHelper = this.nameLookup('helpers', name, 'helper');

      return {
        params: params,
        name: foundHelper,
        callParams: ["depth0"].concat(params).join(", "),
        helperMissingParams: missingParams && ["depth0", this.quotedString(name)].concat(params).join(", ")
      };
    },

    // the params and contexts arguments are passed in arrays
    // to fill in
    setupParams: function(paramSize, params, useRegister) {
      var options = [], contexts = [], types = [], param, inverse, program;

      options.push("hash:" + this.popStack());

      inverse = this.popStack();
      program = this.popStack();

      // Avoid setting fn and inverse if neither are set. This allows
      // helpers to do a check for `if (options.fn)`
      if (program || inverse) {
        if (!program) {
          this.context.aliases.self = "this";
          program = "self.noop";
        }

        if (!inverse) {
         this.context.aliases.self = "this";
          inverse = "self.noop";
        }

        options.push("inverse:" + inverse);
        options.push("fn:" + program);
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          types.push(this.popStack());
          contexts.push(this.popStack());
        }
      }

      if (this.options.stringParams) {
        options.push("contexts:[" + contexts.join(",") + "]");
        options.push("types:[" + types.join(",") + "]");
        options.push("hashContexts:hashContexts");
        options.push("hashTypes:hashTypes");
      }

      if(this.options.data) {
        options.push("data:data");
      }

      options = "{" + options.join(",") + "}";
      if (useRegister) {
        this.register('options', options);
        params.push('options');
      } else {
        params.push(options);
      }
      return params.join(", ");
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

  JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
    if(!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]+$/.test(name)) {
      return true;
    }
    return false;
  };

  __exports__ = JavaScriptCompiler;
  return __exports__;
})(__module2__);

// handlebars/compiler/compiler.js
var __module10__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
  "use strict";
  var __exports__ = {};
  var Exception = __dependency1__;
  var parse = __dependency2__.parse;
  var JavaScriptCompiler = __dependency3__;
  var AST = __dependency4__;

  function Compiler() {}

  __exports__.Compiler = Compiler;// the foundHelper register will disambiguate helper lookup from finding a
  // function in a context. This is necessary for mustache compatibility, which
  // requires that context functions in blocks are evaluated by blockHelperMissing,
  // and then proceed as if the resulting value was provided to blockHelperMissing.

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, out = [], params, param;

      for (var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if (opcode.opcode === 'DECLARE') {
          out.push("DECLARE " + opcode.name + "=" + opcode.value);
        } else {
          params = [];
          for (var j=0; j<opcode.args.length; j++) {
            param = opcode.args[j];
            if (typeof param === "string") {
              param = "\"" + param.replace("\n", "\\n") + "\"";
            }
            params.push(param);
          }
          out.push(opcode.opcode + " " + params.join(" "));
        }
      }

      return out.join("\n");
    },

    equals: function(other) {
      var len = this.opcodes.length;
      if (other.opcodes.length !== len) {
        return false;
      }

      for (var i = 0; i < len; i++) {
        var opcode = this.opcodes[i],
            otherOpcode = other.opcodes[i];
        if (opcode.opcode !== otherOpcode.opcode || opcode.args.length !== otherOpcode.args.length) {
          return false;
        }
        for (var j = 0; j < opcode.args.length; j++) {
          if (opcode.args[j] !== otherOpcode.args[j]) {
            return false;
          }
        }
      }

      len = this.children.length;
      if (other.children.length !== len) {
        return false;
      }
      for (i = 0; i < len; i++) {
        if (!this.children[i].equals(other.children[i])) {
          return false;
        }
      }

      return true;
    },

    guid: 0,

    compile: function(program, options) {
      this.opcodes = [];
      this.children = [];
      this.depths = {list: []};
      this.options = options;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.accept(program);
    },

    accept: function(node) {
      var strip = node.strip || {},
          ret;
      if (strip.left) {
        this.opcode('strip');
      }

      ret = this[node.type](node);

      if (strip.right) {
        this.opcode('strip');
      }

      return ret;
    },

    program: function(program) {
      var statements = program.statements;

      for(var i=0, l=statements.length; i<l; i++) {
        this.accept(statements[i]);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++, depth;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache,
          program = block.program,
          inverse = block.inverse;

      if (program) {
        program = this.compileProgram(program);
      }

      if (inverse) {
        inverse = this.compileProgram(inverse);
      }

      var type = this.classifyMustache(mustache);

      if (type === "helper") {
        this.helperMustache(mustache, program, inverse);
      } else if (type === "simple") {
        this.simpleMustache(mustache);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('blockValue');
      } else {
        this.ambiguousMustache(mustache, program, inverse);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('ambiguousBlockValue');
      }

      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('pushHash');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        if (this.options.stringParams) {
          if(val.depth) {
            this.addDepth(val.depth);
          }
          this.opcode('getContext', val.depth || 0);
          this.opcode('pushStringParam', val.stringModeValue, val.type);
        } else {
          this.accept(val);
        }

        this.opcode('assignToHash', pair[0]);
      }
      this.opcode('popHash');
    },

    partial: function(partial) {
      var partialName = partial.partialName;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'depth0');
      }

      this.opcode('invokePartial', partialName.name);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      var options = this.options;
      var type = this.classifyMustache(mustache);

      if (type === "simple") {
        this.simpleMustache(mustache);
      } else if (type === "helper") {
        this.helperMustache(mustache);
      } else {
        this.ambiguousMustache(mustache);
      }

      if(mustache.escaped && !options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ambiguousMustache: function(mustache, program, inverse) {
      var id = mustache.id,
          name = id.parts[0],
          isBlock = program != null || inverse != null;

      this.opcode('getContext', id.depth);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      this.opcode('invokeAmbiguous', name, isBlock);
    },

    simpleMustache: function(mustache) {
      var id = mustache.id;

      if (id.type === 'DATA') {
        this.DATA(id);
      } else if (id.parts.length) {
        this.ID(id);
      } else {
        // Simplified ID for `this`
        this.addDepth(id.depth);
        this.opcode('getContext', id.depth);
        this.opcode('pushContext');
      }

      this.opcode('resolvePossibleLambda');
    },

    helperMustache: function(mustache, program, inverse) {
      var params = this.setupFullMustacheParams(mustache, program, inverse),
          name = mustache.id.parts[0];

      if (this.options.knownHelpers[name]) {
        this.opcode('invokeKnownHelper', params.length, name);
      } else if (this.options.knownHelpersOnly) {
        throw new Error("You specified knownHelpersOnly, but used the unknown helper " + name);
      } else {
        this.opcode('invokeHelper', params.length, name);
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);
      this.opcode('getContext', id.depth);

      var name = id.parts[0];
      if (!name) {
        this.opcode('pushContext');
      } else {
        this.opcode('lookupOnContext', id.parts[0]);
      }

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    DATA: function(data) {
      this.options.data = true;
      if (data.id.isScoped || data.id.depth) {
        throw new Exception('Scoped data references are not supported: ' + data.original);
      }

      this.opcode('lookupData');
      var parts = data.id.parts;
      for(var i=0, l=parts.length; i<l; i++) {
        this.opcode('lookup', parts[i]);
      }
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('pushLiteral', integer.integer);
    },

    BOOLEAN: function(bool) {
      this.opcode('pushLiteral', bool.bool);
    },

    comment: function() {},

    // HELPERS
    opcode: function(name) {
      this.opcodes.push({ opcode: name, args: [].slice.call(arguments, 1) });
    },

    declare: function(name, value) {
      this.opcodes.push({ opcode: 'DECLARE', name: name, value: value });
    },

    addDepth: function(depth) {
      if(isNaN(depth)) { throw new Error("EWOT"); }
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    classifyMustache: function(mustache) {
      var isHelper   = mustache.isHelper;
      var isEligible = mustache.eligibleHelper;
      var options    = this.options;

      // if ambiguous, we can possibly resolve the ambiguity now
      if (isEligible && !isHelper) {
        var name = mustache.id.parts[0];

        if (options.knownHelpers[name]) {
          isHelper = true;
        } else if (options.knownHelpersOnly) {
          isEligible = false;
        }
      }

      if (isHelper) { return "helper"; }
      else if (isEligible) { return "ambiguous"; }
      else { return "simple"; }
    },

    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.stringModeValue, param.type);
        } else {
          this[param.type](param);
        }
      }
    },

    setupMustacheParams: function(mustache) {
      var params = mustache.params;
      this.pushParams(params);

      if(mustache.hash) {
        this.hash(mustache.hash);
      } else {
        this.opcode('emptyHash');
      }

      return params;
    },

    // this will replace setupMustacheParams when we're done
    setupFullMustacheParams: function(mustache, program, inverse) {
      var params = mustache.params;
      this.pushParams(params);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      if(mustache.hash) {
        this.hash(mustache.hash);
      } else {
        this.opcode('emptyHash');
      }

      return params;
    }
  };

  function precompile(input, options) {
    if (input == null || (typeof input !== 'string' && input.constructor !== AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
    }

    options = options || {};
    if (!('data' in options)) {
      options.data = true;
    }

    var ast = parse(input);
    var environment = new Compiler().compile(ast, options);
    return new JavaScriptCompiler().compile(environment, options);
  }

  __exports__.precompile = precompile;function compile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
    }

    options = options || {};

    if (!('data' in options)) {
      options.data = true;
    }

    var compiled;

    function compileInput() {
      var ast = parse(input);
      var environment = new Compiler().compile(ast, options);
      var templateSpec = new JavaScriptCompiler().compile(environment, options, undefined, true);
      return env.template(templateSpec);
    }

    // Template is only compiled on first use and cached after that point.
    return function(context, options) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled.call(this, context, options);
    };
  }

  __exports__.compile = compile;
  return __exports__;
})(__module5__, __module8__, __module11__, __module7__);

// handlebars.js
var __module0__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  var Handlebars = __dependency1__;

  // Compiler imports
  var AST = __dependency2__;
  var Parser = __dependency3__.parser;
  var parse = __dependency3__.parse;
  var Compiler = __dependency4__.Compiler;
  var compile = __dependency4__.compile;
  var precompile = __dependency4__.precompile;
  var JavaScriptCompiler = __dependency5__;

  var _create = Handlebars.create;
  var create = function() {
    var hb = _create();

    hb.compile = function(input, options) {
      return compile(input, options, hb);
    };
    hb.precompile = precompile;

    hb.AST = AST;
    hb.Compiler = Compiler;
    hb.JavaScriptCompiler = JavaScriptCompiler;
    hb.Parser = Parser;
    hb.parse = parse;

    return hb;
  };

  Handlebars = create();
  Handlebars.create = create;

  __exports__ = Handlebars;
  return __exports__;
})(__module1__, __module7__, __module8__, __module10__, __module11__);

  return __module0__;
})();
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: Copyright 2011-2013 Tilde Inc. and contributors
//            Portions Copyright 2006-2011 Strobe Inc.
//            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license
//            See https://raw.github.com/emberjs/ember.js/master/LICENSE
// ==========================================================================


 // Version: 1.2.0

// Copyright: Copyright 2011-2013 Tilde Inc. and contributors
//            Portions Copyright 2006-2011 Strobe Inc.
//            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
!function(){var e,t;!function(){var r={},n={};e=function(e,t,n){r[e]={deps:t,callback:n}},t=function(e){if(n[e])return n[e];n[e]={};var i,o,a,s,u;if(i=r[e],!i)throw new Error("Module '"+e+"' not found.");o=i.deps,a=i.callback,s=[];for(var c=0,l=o.length;l>c;c++)"exports"===o[c]?s.push(u={}):s.push(t(o[c]));var h=a.apply(this,s);return n[e]=u||h}}(),function(){"undefined"==typeof Ember&&(Ember={}),Ember.imports=Ember.imports||this;var e=Ember.exports=Ember.exports||this;Ember.lookup=Ember.lookup||this,e.Em=e.Ember=Em=Ember,Ember.isNamespace=!0,Ember.toString=function(){return"Ember"},Ember.VERSION="1.2.0","undefined"==typeof ENV&&(e.ENV={}),"undefined"==typeof ENV.DISABLE_RANGE_API&&(ENV.DISABLE_RANGE_API=!0),Ember.ENV=Ember.ENV||ENV,Ember.config=Ember.config||{},Ember.FEATURES=Ember.ENV.FEATURES||{},Ember.FEATURES.isEnabled=function(e){var t=Ember.FEATURES[e];return Ember.ENV.ENABLE_ALL_FEATURES?!0:t===!0||t===!1||void 0===t?t:Ember.ENV.ENABLE_OPTIONAL_FEATURES?!0:!1},Ember.EXTEND_PROTOTYPES=Ember.ENV.EXTEND_PROTOTYPES,"undefined"==typeof Ember.EXTEND_PROTOTYPES&&(Ember.EXTEND_PROTOTYPES=!0),Ember.LOG_STACKTRACE_ON_DEPRECATION=Ember.ENV.LOG_STACKTRACE_ON_DEPRECATION!==!1,Ember.SHIM_ES5=Ember.ENV.SHIM_ES5===!1?!1:Ember.EXTEND_PROTOTYPES,Ember.LOG_VERSION=Ember.ENV.LOG_VERSION===!1?!1:!0,Ember.K=function(){return this},"undefined"==typeof Ember.assert&&(Ember.assert=Ember.K),"undefined"==typeof Ember.warn&&(Ember.warn=Ember.K),"undefined"==typeof Ember.debug&&(Ember.debug=Ember.K),"undefined"==typeof Ember.deprecate&&(Ember.deprecate=Ember.K),"undefined"==typeof Ember.deprecateFunc&&(Ember.deprecateFunc=function(e,t){return t}),Ember.uuid=0,Ember.merge=function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);return e},Ember.isNone=function(e){return null===e||void 0===e},Ember.none=Ember.deprecateFunc("Ember.none is deprecated. Please use Ember.isNone instead.",Ember.isNone),Ember.isEmpty=function(e){return Ember.isNone(e)||0===e.length&&"function"!=typeof e||"object"==typeof e&&0===Ember.get(e,"length")},Ember.empty=Ember.deprecateFunc("Ember.empty is deprecated. Please use Ember.isEmpty instead.",Ember.isEmpty)}(),function(){var e=Ember.platform={};if(Ember.create=Object.create,Ember.create&&2!==Ember.create({a:1},{a:{value:2}}).a&&(Ember.create=null),!Ember.create||Ember.ENV.STUB_OBJECT_CREATE){var t=function(){};Ember.create=function(e,r){if(t.prototype=e,e=new t,r){t.prototype=e;for(var n in r)t.prototype[n]=r[n].value;e=new t}return t.prototype=null,e},Ember.create.isSimulated=!0}var r,n,i=Object.defineProperty;if(i)try{i({},"a",{get:function(){}})}catch(o){i=null}i&&(r=function(){var e={};return i(e,"a",{configurable:!0,enumerable:!0,get:function(){},set:function(){}}),i(e,"a",{configurable:!0,enumerable:!0,writable:!0,value:!0}),e.a===!0}(),n=function(){try{return i(document.createElement("div"),"definePropertyOnDOM",{}),!0}catch(e){}return!1}(),r?n||(i=function(e,t,r){var n;return n="object"==typeof Node?e instanceof Node:"object"==typeof e&&"number"==typeof e.nodeType&&"string"==typeof e.nodeName,n?e[t]=r.value:Object.defineProperty(e,t,r)}):i=null),e.defineProperty=i,e.hasPropertyAccessors=!0,e.defineProperty||(e.hasPropertyAccessors=!1,e.defineProperty=function(e,t,r){r.get||(e[t]=r.value)},e.defineProperty.isSimulated=!0),Ember.ENV.MANDATORY_SETTER&&!e.hasPropertyAccessors&&(Ember.ENV.MANDATORY_SETTER=!1)}(),function(){var e=function(e){return e&&Function.prototype.toString.call(e).indexOf("[native code]")>-1},t=e(Array.prototype.map)?Array.prototype.map:function(e){if(void 0===this||null===this)throw new TypeError;var t=Object(this),r=t.length>>>0;if("function"!=typeof e)throw new TypeError;for(var n=new Array(r),i=arguments[1],o=0;r>o;o++)o in t&&(n[o]=e.call(i,t[o],o,t));return n},r=e(Array.prototype.forEach)?Array.prototype.forEach:function(e){if(void 0===this||null===this)throw new TypeError;var t=Object(this),r=t.length>>>0;if("function"!=typeof e)throw new TypeError;for(var n=arguments[1],i=0;r>i;i++)i in t&&e.call(n,t[i],i,t)},n=e(Array.prototype.indexOf)?Array.prototype.indexOf:function(e,t){null===t||void 0===t?t=0:0>t&&(t=Math.max(0,this.length+t));for(var r=t,n=this.length;n>r;r++)if(this[r]===e)return r;return-1};Ember.ArrayPolyfills={map:t,forEach:r,indexOf:n},Ember.SHIM_ES5&&(Array.prototype.map||(Array.prototype.map=t),Array.prototype.forEach||(Array.prototype.forEach=r),Array.prototype.indexOf||(Array.prototype.indexOf=n))}(),function(){var e=["description","fileName","lineNumber","message","name","number","stack"];Ember.Error=function(){for(var t=Error.apply(this,arguments),r=0;r<e.length;r++)this[e[r]]=t[e[r]]},Ember.Error.prototype=Ember.create(Error.prototype),Ember.onerror=null,Ember.handleErrors=function(e,t){if("function"!=typeof Ember.onerror)return e.call(t||this);try{return e.call(t||this)}catch(r){Ember.onerror(r)}}}(),function(){function e(e){this.descs={},this.watching={},this.cache={},this.source=e}function t(e,t){return!(!e||"function"!=typeof e[t])}Ember.GUID_PREFIX="ember";var r=Ember.platform.defineProperty,n=Ember.create,i="__ember"+ +new Date,o=0,a=[],s={},u=Ember.ENV.MANDATORY_SETTER;Ember.GUID_KEY=i;var c={writable:!1,configurable:!1,enumerable:!1,value:null};Ember.generateGuid=function(e,t){t||(t=Ember.GUID_PREFIX);var n=t+o++;return e&&(c.value=n,r(e,i,c)),n},Ember.guidFor=function(e){if(void 0===e)return"(undefined)";if(null===e)return"(null)";var t,n=typeof e;switch(n){case"number":return t=a[e],t||(t=a[e]="nu"+e),t;case"string":return t=s[e],t||(t=s[e]="st"+o++),t;case"boolean":return e?"(true)":"(false)";default:return e[i]?e[i]:e===Object?"(Object)":e===Array?"(Array)":(t="ember"+o++,c.value=t,r(e,i,c),t)}};var l={writable:!0,configurable:!1,enumerable:!1,value:null},h=Ember.GUID_KEY+"_meta";Ember.META_KEY=h;var m={descs:{},watching:{}};u&&(m.values={}),Ember.EMPTY_META=m,Object.freeze&&Object.freeze(m);var f=Ember.platform.defineProperty.isSimulated;f&&(e.prototype.__preventPlainObject__=!0,e.prototype.toJSON=function(){}),Ember.meta=function(t,i){var o=t[h];return i===!1?o||m:(o?o.source!==t&&(f||r(t,h,l),o=n(o),o.descs=n(o.descs),o.watching=n(o.watching),o.cache={},o.source=t,u&&(o.values=n(o.values)),t[h]=o):(f||r(t,h,l),o=new e(t),u&&(o.values={}),t[h]=o,o.descs.constructor=null),o)},Ember.getMeta=function(e,t){var r=Ember.meta(e,!1);return r[t]},Ember.setMeta=function(e,t,r){var n=Ember.meta(e,!0);return n[t]=r,r},Ember.metaPath=function(e,t,r){for(var i,o,a=Ember.meta(e,r),s=0,u=t.length;u>s;s++){if(i=t[s],o=a[i]){if(o.__ember_source__!==e){if(!r)return void 0;o=a[i]=n(o),o.__ember_source__=e}}else{if(!r)return void 0;o=a[i]={__ember_source__:e}}a=o}return o},Ember.wrap=function(e,t){function r(){}function n(){var n,i=this._super;return this._super=t||r,n=e.apply(this,arguments),this._super=i,n}return n.wrappedFunction=e,n.__ember_observes__=e.__ember_observes__,n.__ember_observesBefore__=e.__ember_observesBefore__,n.__ember_listens__=e.__ember_listens__,n},Ember.isArray=function(e){return!e||e.setInterval?!1:Array.isArray&&Array.isArray(e)?!0:Ember.Array&&Ember.Array.detect(e)?!0:void 0!==e.length&&"object"==typeof e?!0:!1},Ember.makeArray=function(e){return null===e||void 0===e?[]:Ember.isArray(e)?e:[e]},Ember.canInvoke=t,Ember.tryInvoke=function(e,r,n){return t(e,r)?e[r].apply(e,n||[]):void 0};var p=function(){var e=0;try{try{}finally{throw e++,new Error("needsFinallyFixTest")}}catch(t){}return 1!==e}();Ember.tryFinally=p?function(e,t,r){var n,i,o;r=r||this;try{n=e.call(r)}finally{try{i=t.call(r)}catch(a){o=a}}if(o)throw o;return void 0===i?n:i}:function(e,t,r){var n,i;r=r||this;try{n=e.call(r)}finally{i=t.call(r)}return void 0===i?n:i},Ember.tryCatchFinally=p?function(e,t,r,n){var i,o,a;n=n||this;try{i=e.call(n)}catch(s){i=t.call(n,s)}finally{try{o=r.call(n)}catch(u){a=u}}if(a)throw a;return void 0===o?i:o}:function(e,t,r,n){var i,o;n=n||this;try{i=e.call(n)}catch(a){i=t.call(n,a)}finally{o=r.call(n)}return void 0===o?i:o};var d={},b="Boolean Number String Function Array Date RegExp Object".split(" ");Ember.ArrayPolyfills.forEach.call(b,function(e){d["[object "+e+"]"]=e.toLowerCase()});var v=Object.prototype.toString;Ember.typeOf=function(e){var t;return t=null===e||void 0===e?String(e):d[v.call(e)]||"object","function"===t?Ember.Object&&Ember.Object.detect(e)&&(t="class"):"object"===t&&(t=e instanceof Error?"error":Ember.Object&&e instanceof Ember.Object?"instance":"object"),t}}(),function(){Ember.Instrumentation={};var e=[],t={},r=function(r){for(var n,i=[],o=0,a=e.length;a>o;o++)n=e[o],n.regex.test(r)&&i.push(n.object);return t[r]=i,i},n=function(){var e="undefined"!=typeof window?window.performance||{}:{},t=e.now||e.mozNow||e.webkitNow||e.msNow||e.oNow;return t?t.bind(e):function(){return+new Date}}();Ember.Instrumentation.instrument=function(e,i,o,a){function s(){for(p=0,d=m.length;d>p;p++)f=m[p],b[p]=f.before(e,n(),i);return o.call(a)}function u(e){i=i||{},i.exception=e}function c(){for(p=0,d=m.length;d>p;p++)f=m[p],f.after(e,n(),i,b[p]);Ember.STRUCTURED_PROFILE&&console.timeEnd(l)}var l,h,m=t[e];if(Ember.STRUCTURED_PROFILE&&(l=e+": "+i.object,console.time(l)),m||(m=r(e)),0===m.length)return h=o.call(a),Ember.STRUCTURED_PROFILE&&console.timeEnd(l),h;var f,p,d,b=[];return Ember.tryCatchFinally(s,u,c)},Ember.Instrumentation.subscribe=function(r,n){for(var i,o=r.split("."),a=[],s=0,u=o.length;u>s;s++)i=o[s],"*"===i?a.push("[^\\.]*"):a.push(i);a=a.join("\\."),a+="(\\..*)?";var c={pattern:r,regex:new RegExp("^"+a+"$"),object:n};return e.push(c),t={},c},Ember.Instrumentation.unsubscribe=function(r){for(var n,i=0,o=e.length;o>i;i++)e[i]===r&&(n=i);e.splice(n,1),t={}},Ember.Instrumentation.reset=function(){e=[],t={}},Ember.instrument=Ember.Instrumentation.instrument,Ember.subscribe=Ember.Instrumentation.subscribe}(),function(){var e,t,r,n;e=Array.prototype.map||Ember.ArrayPolyfills.map,t=Array.prototype.forEach||Ember.ArrayPolyfills.forEach,r=Array.prototype.indexOf||Ember.ArrayPolyfills.indexOf,n=Array.prototype.splice;var i=Ember.EnumerableUtils={map:function(t,r,n){return t.map?t.map.call(t,r,n):e.call(t,r,n)},forEach:function(e,r,n){return e.forEach?e.forEach.call(e,r,n):t.call(e,r,n)},indexOf:function(e,t,n){return e.indexOf?e.indexOf.call(e,t,n):r.call(e,t,n)},indexesOf:function(e,t){return void 0===t?[]:i.map(t,function(t){return i.indexOf(e,t)})},addObject:function(e,t){var r=i.indexOf(e,t);-1===r&&e.push(t)},removeObject:function(e,t){var r=i.indexOf(e,t);-1!==r&&e.splice(r,1)},_replace:function(e,t,r,i){for(var o,a,s=[].concat(i),u=[],c=6e4,l=t,h=r;s.length;)a=h>c?c:h,0>=a&&(a=0),o=s.splice(0,c),o=[l,a].concat(o),l+=c,h-=a,u=u.concat(n.apply(e,o));return u},replace:function(e,t,r,n){return e.replace?e.replace(t,r,n):i._replace(e,t,r,n)},intersection:function(e,t){var r=[];return i.forEach(e,function(e){i.indexOf(t,e)>=0&&r.push(e)}),r}}}(),function(){var e,t=Ember.META_KEY,r=Ember.ENV.MANDATORY_SETTER,n=/^([A-Z$]|([0-9][A-Z$])).*[\.\*]/,i=/^this[\.\*]/,o=/^([^\.\*]+)/;e=function(e,n){if(""===n)return e;if(n||"string"!=typeof e||(n=e,e=null),null===e||-1!==n.indexOf("."))return s(e,n);var i,o=e[t],a=o&&o.descs[n];return a?a.get(e,n):(i=r&&o&&o.watching[n]>0?o.values[n]:e[n],void 0!==i||"object"!=typeof e||n in e||"function"!=typeof e.unknownProperty?i:e.unknownProperty(n))},Ember.config.overrideAccessors&&(Ember.get=e,Ember.config.overrideAccessors(),e=Ember.get);var a=Ember.normalizeTuple=function(t,r){var a,s=i.test(r),u=!s&&n.test(r);if((!t||u)&&(t=Ember.lookup),s&&(r=r.slice(5)),t===Ember.lookup&&(a=r.match(o)[0],t=e(t,a),r=r.slice(a.length+1)),!r||0===r.length)throw new Ember.Error("Invalid Path");return[t,r]},s=Ember._getPath=function(t,r){var n,o,s,u,c;if(null===t&&-1===r.indexOf("."))return e(Ember.lookup,r);for(n=i.test(r),(!t||n)&&(s=a(t,r),t=s[0],r=s[1],s.length=0),o=r.split("."),c=o.length,u=0;null!=t&&c>u;u++)if(t=e(t,o[u],!0),t&&t.isDestroyed)return void 0;return t};Ember.getWithDefault=function(t,r,n){var i=e(t,r);return void 0===i?n:i},Ember.get=e}(),function(){function e(e,t,r){for(var n=-1,i=0,o=e.length;o>i;i+=3)if(t===e[i]&&r===e[i+1]){n=i;break}return n}function t(e,t){var r,n=f(e,!0);return n.listeners||(n.listeners={}),n.hasOwnProperty("listeners")||(n.listeners=m(n.listeners)),r=n.listeners[t],r&&!n.listeners.hasOwnProperty(t)?r=n.listeners[t]=n.listeners[t].slice():r||(r=n.listeners[t]=[]),r}function r(t,r,n){var i=t[p],o=i&&i.listeners&&i.listeners[r];if(o)for(var a=o.length-3;a>=0;a-=3){var s=o[a],u=o[a+1],c=o[a+2],l=e(n,s,u);-1===l&&n.push(s,u,c)}}function n(t,r,n){var i=t[p],o=i&&i.listeners&&i.listeners[r],a=[];if(o){for(var s=o.length-3;s>=0;s-=3){var u=o[s],c=o[s+1],l=o[s+2],h=e(n,u,c);-1===h&&(n.push(u,c,l),a.push(u,c,l))}return a}}function i(r,n,i,o,a){o||"function"!=typeof i||(o=i,i=null);var s=t(r,n),u=e(s,i,o),c=0;a&&(c|=b),-1===u&&(s.push(i,o,c),"function"==typeof r.didAddListener&&r.didAddListener(n,i,o))}function o(r,n,i,o){function a(i,o){var a=t(r,n),s=e(a,i,o);-1!==s&&(a.splice(s,3),"function"==typeof r.didRemoveListener&&r.didRemoveListener(n,i,o))}if(o||"function"!=typeof i||(o=i,i=null),o)a(i,o);else{var s=r[p],u=s&&s.listeners&&s.listeners[n];if(!u)return;for(var c=u.length-3;c>=0;c-=3)a(u[c],u[c+1])}}function a(r,n,i,o,a){function s(){return a.call(i)}function u(){-1!==l&&(c[l+2]&=~v)}o||"function"!=typeof i||(o=i,i=null);var c=t(r,n),l=e(c,i,o);return-1!==l&&(c[l+2]|=v),Ember.tryFinally(s,u)}function s(r,n,i,o,a){function s(){return a.call(i)}function u(){for(var e=0,t=f.length;t>e;e++){var r=f[e];p[e][r+2]&=~v}}o||"function"!=typeof i||(o=i,i=null);var c,l,h,m,f=[],p=[];for(h=0,m=n.length;m>h;h++){c=n[h],l=t(r,c);var d=e(l,i,o);-1!==d&&(l[d+2]|=v,f.push(d),p.push(l))}return Ember.tryFinally(s,u)}function u(e){var t=e[p].listeners,r=[];if(t)for(var n in t)t[n]&&r.push(n);return r}function c(e,t,r,n){if(e!==Ember&&"function"==typeof e.sendEvent&&e.sendEvent(t,r),!n){var i=e[p];n=i&&i.listeners&&i.listeners[t]}if(n){for(var a=n.length-3;a>=0;a-=3){var s=n[a],u=n[a+1],c=n[a+2];u&&(c&v||(c&b&&o(e,t,s,u),s||(s=e),"string"==typeof u&&(u=s[u]),r?u.apply(s,r):u.call(s)))}return!0}}function l(e,t){var r=e[p],n=r&&r.listeners&&r.listeners[t];return!(!n||!n.length)}function h(e,t){var r=[],n=e[p],i=n&&n.listeners&&n.listeners[t];if(!i)return r;for(var o=0,a=i.length;a>o;o+=3){var s=i[o],u=i[o+1];r.push([s,u])}return r}var m=Ember.create,f=Ember.meta,p=Ember.META_KEY,d=[].slice,b=1,v=2;Ember.on=function(){var e=d.call(arguments,-1)[0],t=d.call(arguments,0,-1);return e.__ember_listens__=t,e},Ember.addListener=i,Ember.removeListener=o,Ember._suspendListener=a,Ember._suspendListeners=s,Ember.sendEvent=c,Ember.hasListeners=l,Ember.watchedEvents=u,Ember.listenersFor=h,Ember.listenersDiff=n,Ember.listenersUnion=r}(),function(){var e=Ember.guidFor,t=Ember.sendEvent,r=Ember._ObserverSet=function(){this.clear()};r.prototype.add=function(t,r,n){var i,o=this.observerSet,a=this.observers,s=e(t),u=o[s];return u||(o[s]=u={}),i=u[r],void 0===i&&(i=a.push({sender:t,keyName:r,eventName:n,listeners:[]})-1,u[r]=i),a[i].listeners},r.prototype.flush=function(){var e,r,n,i,o=this.observers;for(this.clear(),e=0,r=o.length;r>e;++e)n=o[e],i=n.sender,i.isDestroying||i.isDestroyed||t(i,n.eventName,[i,n.keyName],n.listeners)},r.prototype.clear=function(){this.observerSet={},this.observers=[]}}(),function(){function e(e,t){var n=h(e,!1),i=n.watching[t]>0||"length"===t,a=n.proto,s=n.descs[t];i&&a!==e&&(s&&s.willChange&&s.willChange(e,t),r(e,t,n),o(e,t,n),c(e,t))}function t(e,t){var r=h(e,!1),i=r.watching[t]>0||"length"===t,o=r.proto,s=r.descs[t];o!==e&&(s&&s.didChange&&s.didChange(e,t),(i||"length"===t)&&(n(e,t,r),a(e,t,r,!1),l(e,t)))}function r(t,r,n){if(!t.isDestroying){var o=w,a=!o;a&&(o=w={}),i(e,t,r,o,n),a&&(w=null)}}function n(e,r,n){if(!e.isDestroying){var o=_,a=!o;a&&(o=_={}),i(t,e,r,o,n),a&&(_=null)}}function i(e,t,r,n,i){var o=m(t);if(n[o]||(n[o]={}),!n[o][r]){n[o][r]=!0;var a=i.deps;if(a=a&&a[r])for(var s in a){var u=i.descs[s];u&&u._suspended===t||e(t,s)}}}function o(t,r,n){if(n.hasOwnProperty("chainWatchers")&&n.chainWatchers[r]){var i,o,a=n.chainWatchers[r],s=[];for(i=0,o=a.length;o>i;i++)a[i].willChange(s);for(i=0,o=s.length;o>i;i+=2)e(s[i],s[i+1])}}function a(e,r,n,i){if(n.hasOwnProperty("chainWatchers")&&n.chainWatchers[r]){var o,a,s=n.chainWatchers[r],u=i?null:[];for(o=0,a=s.length;a>o;o++)s[o].didChange(u);if(!i)for(o=0,a=u.length;a>o;o+=2)t(u[o],u[o+1])}}function s(){y++}function u(){y--,0>=y&&(E.clear(),g.flush())}function c(e,t){if(!e.isDestroying){var r,n,i=t+":before";y?(r=E.add(e,t,i),n=b(e,i,r),p(e,i,[e,t],n)):p(e,i,[e,t])}}function l(e,t){if(!e.isDestroying){var r,n=t+":change";y?(r=g.add(e,t,n),d(e,n,r)):p(e,n,[e,t])}}var h=Ember.meta,m=Ember.guidFor,f=Ember.tryFinally,p=Ember.sendEvent,d=Ember.listenersUnion,b=Ember.listenersDiff,v=Ember._ObserverSet,E=new v,g=new v,y=0;Ember.propertyWillChange=e,Ember.propertyDidChange=t;var w,_;Ember.overrideChains=function(e,t,r){a(e,t,r,!0)},Ember.beginPropertyChanges=s,Ember.endPropertyChanges=u,Ember.changeProperties=function(e,t){s(),f(e,u,t)}}(),function(){function e(e,t,r,o){var a;if(a=t.slice(t.lastIndexOf(".")+1),t=t.slice(0,t.length-(a.length+1)),"this"!==t&&(e=n(e,t)),!a||0===a.length)throw new Ember.Error("You passed an empty path");if(!e){if(o)return;throw new Ember.Error("Object in path "+t+" could not be found or was destroyed.")}return i(e,a,r)}var t=Ember.META_KEY,r=Ember.ENV.MANDATORY_SETTER,n=Ember._getPath,i=function(n,i,o,a){if("string"==typeof n&&(o=i,i=n,n=null),!n||-1!==i.indexOf("."))return e(n,i,o,a);var s,u,c=n[t],l=c&&c.descs[i];return l?l.set(n,i,o):(s="object"==typeof n&&!(i in n),s&&"function"==typeof n.setUnknownProperty?n.setUnknownProperty(i,o):c&&c.watching[i]>0?(u=r?c.values[i]:n[i],o!==u&&(Ember.propertyWillChange(n,i),r?void 0!==u||i in n?c.values[i]=o:Ember.defineProperty(n,i,null,o):n[i]=o,Ember.propertyDidChange(n,i))):n[i]=o),o};Ember.config.overrideAccessors&&(Ember.set=i,Ember.config.overrideAccessors(),i=Ember.set),Ember.set=i,Ember.trySet=function(e,t,r){return i(e,t,r,!0)}}(),function(){var e=Ember.set,t=Ember.guidFor,r=Ember.ArrayPolyfills.indexOf,n=function(e){var t={};for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r]);return t},i=function(e,t){var r=e.keys.copy(),i=n(e.values);return t.keys=r,t.values=i,t.length=e.length,t},o=Ember.OrderedSet=function(){this.clear()};o.create=function(){return new o},o.prototype={clear:function(){this.presenceSet={},this.list=[]},add:function(e){var r=t(e),n=this.presenceSet,i=this.list;r in n||(n[r]=!0,i.push(e))},remove:function(e){var n=t(e),i=this.presenceSet,o=this.list;delete i[n];var a=r.call(o,e);a>-1&&o.splice(a,1)},isEmpty:function(){return 0===this.list.length},has:function(e){var r=t(e),n=this.presenceSet;return r in n},forEach:function(e,t){for(var r=this.toArray(),n=0,i=r.length;i>n;n++)e.call(t,r[n])},toArray:function(){return this.list.slice()},copy:function(){var e=new o;return e.presenceSet=n(this.presenceSet),e.list=this.toArray(),e}};var a=Ember.Map=function(){this.keys=Ember.OrderedSet.create(),this.values={}};a.create=function(){return new a},a.prototype={length:0,get:function(e){var r=this.values,n=t(e);return r[n]},set:function(r,n){var i=this.keys,o=this.values,a=t(r);i.add(r),o[a]=n,e(this,"length",i.list.length)},remove:function(r){var n=this.keys,i=this.values,o=t(r);return i.hasOwnProperty(o)?(n.remove(r),delete i[o],e(this,"length",n.list.length),!0):!1},has:function(e){var r=this.values,n=t(e);return r.hasOwnProperty(n)},forEach:function(e,r){var n=this.keys,i=this.values;n.forEach(function(n){var o=t(n);e.call(r,n,i[o])})},copy:function(){return i(this,new a)}};var s=Ember.MapWithDefault=function(e){a.call(this),this.defaultValue=e.defaultValue};s.create=function(e){return e?new s(e):new a},s.prototype=Ember.create(a.prototype),s.prototype.get=function(e){var t=this.has(e);if(t)return a.prototype.get.call(this,e);var r=this.defaultValue(e);return this.set(e,r),r},s.prototype.copy=function(){return i(this,new s({defaultValue:this.defaultValue}))}}(),function(){function e(e){var t;Ember.imports.console?t=Ember.imports.console:"undefined"!=typeof console&&(t=console);var r="object"==typeof t?t[e]:null;return r?r.apply?function(){r.apply(t,arguments)}:function(){var e=Array.prototype.join.call(arguments,", ");r(e)}:void 0}function t(e,t){if(!e)try{throw new Ember.Error("assertion failed: "+t)}catch(r){setTimeout(function(){throw r},0)}}Ember.Logger={log:e("log")||Ember.K,warn:e("warn")||Ember.K,error:e("error")||Ember.K,info:e("info")||Ember.K,debug:e("debug")||e("info")||Ember.K,assert:e("assert")||t}}(),function(){var e=Ember.META_KEY,t=Ember.meta,r=Ember.platform.defineProperty,n=Ember.ENV.MANDATORY_SETTER;Ember.Descriptor=function(){};var i=Ember.MANDATORY_SETTER_FUNCTION=function(){},o=Ember.DEFAULT_GETTER_FUNCTION=function(t){return function(){var r=this[e];return r&&r.values[t]}};Ember.defineProperty=function(e,a,s,u,c){var l,h,m,f;return c||(c=t(e)),l=c.descs,h=c.descs[a],m=c.watching[a]>0,h instanceof Ember.Descriptor&&h.teardown(e,a),s instanceof Ember.Descriptor?(f=s,l[a]=s,n&&m?r(e,a,{configurable:!0,enumerable:!0,writable:!0,value:void 0}):e[a]=void 0):(l[a]=void 0,null==s?(f=u,n&&m?(c.values[a]=u,r(e,a,{configurable:!0,enumerable:!0,set:i,get:o(a)})):e[a]=u):(f=s,r(e,a,s))),m&&Ember.overrideChains(e,a,c),e.didDefineProperty&&e.didDefineProperty(e,a,f),this}}(),function(){var e=Ember.get;Ember.getProperties=function(t){var r={},n=arguments,i=1;2===arguments.length&&"array"===Ember.typeOf(arguments[1])&&(i=0,n=arguments[1]);for(var o=n.length;o>i;i++)r[n[i]]=e(t,n[i]);return r}}(),function(){var e=Ember.changeProperties,t=Ember.set;Ember.setProperties=function(r,n){return e(function(){for(var e in n)n.hasOwnProperty(e)&&t(r,e,n[e])}),r}}(),function(){var e=Ember.meta,t=Ember.typeOf,r=Ember.ENV.MANDATORY_SETTER,n=Ember.platform.defineProperty;Ember.watchKey=function(i,o){if("length"!==o||"array"!==t(i)){var a=e(i),s=a.watching;s[o]?s[o]=(s[o]||0)+1:(s[o]=1,"function"==typeof i.willWatchProperty&&i.willWatchProperty(o),r&&o in i&&(a.values[o]=i[o],n(i,o,{configurable:!0,enumerable:!0,set:Ember.MANDATORY_SETTER_FUNCTION,get:Ember.DEFAULT_GETTER_FUNCTION(o)})))}},Ember.unwatchKey=function(t,i){var o=e(t),a=o.watching;1===a[i]?(a[i]=0,"function"==typeof t.didUnwatchProperty&&t.didUnwatchProperty(i),r&&i in t&&(n(t,i,{configurable:!0,enumerable:!0,writable:!0,value:o.values[i]}),delete o.values[i])):a[i]>1&&a[i]--}}(),function(){function e(e){return e.match(l)[0]}function t(e,t,r){if(e&&"object"==typeof e){var i=n(e),o=i.chainWatchers;i.hasOwnProperty("chainWatchers")||(o=i.chainWatchers={}),o[t]||(o[t]=[]),o[t].push(r),u(e,t)}}function r(e,t){if(!e)return void 0;var r=n(e,!1);if(r.proto===e)return void 0;if("@each"===t)return i(e,t);var o=r.descs[t];return o&&o._cacheable?t in r.cache?r.cache[t]:void 0:i(e,t)}var n=Ember.meta,i=Ember.get,o=Ember.normalizeTuple,a=Ember.ArrayPolyfills.forEach,s=Ember.warn,u=Ember.watchKey,c=Ember.unwatchKey,l=/^([^\.\*]+)/,h=[];Ember.flushPendingChains=function(){if(0!==h.length){var e=h;h=[],a.call(e,function(e){e[0].add(e[1])}),s("Watching an undefined global, Ember expects watched globals to be setup by the time the run loop is flushed, check for typos",0===h.length)}};var m=Ember.removeChainWatcher=function(e,t,r){if(e&&"object"==typeof e){var i=n(e,!1);if(i.hasOwnProperty("chainWatchers")){var o=i.chainWatchers;if(o[t]){o=o[t];for(var a=0,s=o.length;s>a;a++)o[a]===r&&o.splice(a,1)}c(e,t)}}},f=Ember._ChainNode=function(e,r,n){this._parent=e,this._key=r,this._watching=void 0===n,this._value=n,this._paths={},this._watching&&(this._object=e.value(),this._object&&t(this._object,this._key,this)),this._parent&&"@each"===this._parent._key&&this.value()},p=f.prototype;p.value=function(){if(void 0===this._value&&this._watching){var e=this._parent.value();this._value=r(e,this._key)}return this._value},p.destroy=function(){if(this._watching){var e=this._object;e&&m(e,this._key,this),this._watching=!1}},p.copy=function(e){var t,r=new f(null,null,e),n=this._paths;for(t in n)n[t]<=0||r.add(t);return r},p.add=function(t){var r,n,i,a,s;if(s=this._paths,s[t]=(s[t]||0)+1,r=this.value(),n=o(r,t),n[0]&&n[0]===r)t=n[1],i=e(t),t=t.slice(i.length+1);else{if(!n[0])return h.push([this,t]),n.length=0,void 0;a=n[0],i=t.slice(0,0-(n[1].length+1)),t=n[1]}n.length=0,this.chain(i,t,a)},p.remove=function(t){var r,n,i,a,s;s=this._paths,s[t]>0&&s[t]--,r=this.value(),n=o(r,t),n[0]===r?(t=n[1],i=e(t),t=t.slice(i.length+1)):(a=n[0],i=t.slice(0,0-(n[1].length+1)),t=n[1]),n.length=0,this.unchain(i,t)},p.count=0,p.chain=function(t,r,n){var i,o=this._chains;o||(o=this._chains={}),i=o[t],i||(i=o[t]=new f(this,t,n)),i.count++,r&&r.length>0&&(t=e(r),r=r.slice(t.length+1),i.chain(t,r))},p.unchain=function(t,r){var n=this._chains,i=n[t];r&&r.length>1&&(t=e(r),r=r.slice(t.length+1),i.unchain(t,r)),i.count--,i.count<=0&&(delete n[i._key],i.destroy())},p.willChange=function(e){var t=this._chains;if(t)for(var r in t)t.hasOwnProperty(r)&&t[r].willChange(e);this._parent&&this._parent.chainWillChange(this,this._key,1,e)},p.chainWillChange=function(e,t,r,n){this._key&&(t=this._key+"."+t),this._parent?this._parent.chainWillChange(this,t,r+1,n):(r>1&&n.push(this.value(),t),t="this."+t,this._paths[t]>0&&n.push(this.value(),t))},p.chainDidChange=function(e,t,r,n){this._key&&(t=this._key+"."+t),this._parent?this._parent.chainDidChange(this,t,r+1,n):(r>1&&n.push(this.value(),t),t="this."+t,this._paths[t]>0&&n.push(this.value(),t))},p.didChange=function(e){if(this._watching){var r=this._parent.value();r!==this._object&&(m(this._object,this._key,this),this._object=r,t(r,this._key,this)),this._value=void 0,this._parent&&"@each"===this._parent._key&&this.value()}var n=this._chains;if(n)for(var i in n)n.hasOwnProperty(i)&&n[i].didChange(e);null!==e&&this._parent&&this._parent.chainDidChange(this,this._key,1,e)},Ember.finishChains=function(e){var t=n(e,!1),r=t.chains;r&&(r.value()!==e&&(t.chains=r=r.copy(e)),r.didChange(null))}}(),function(){function e(e){var r=t(e),i=r.chains;return i?i.value()!==e&&(i=r.chains=i.copy(e)):i=r.chains=new n(null,null,e),i}var t=Ember.meta,r=Ember.typeOf,n=Ember._ChainNode;Ember.watchPath=function(n,i){if("length"!==i||"array"!==r(n)){var o=t(n),a=o.watching;a[i]?a[i]=(a[i]||0)+1:(a[i]=1,e(n).add(i))}},Ember.unwatchPath=function(r,n){var i=t(r),o=i.watching;1===o[n]?(o[n]=0,e(r).remove(n)):o[n]>1&&o[n]--}}(),function(){function e(e){return"*"===e||!h.test(e)}var t=Ember.meta,r=Ember.GUID_KEY,n=Ember.META_KEY,i=Ember.removeChainWatcher,o=Ember.watchKey,a=Ember.unwatchKey,s=Ember.watchPath,u=Ember.unwatchPath,c=Ember.typeOf,l=Ember.generateGuid,h=/[\.\*]/;Ember.watch=function(t,r){("length"!==r||"array"!==c(t))&&(e(r)?o(t,r):s(t,r))},Ember.isWatching=function(e,t){var r=e[n];return(r&&r.watching[t])>0},Ember.watch.flushPending=Ember.flushPendingChains,Ember.unwatch=function(t,r){("length"!==r||"array"!==c(t))&&(e(r)?a(t,r):u(t,r))},Ember.rewatch=function(e){var n=t(e,!1),i=n.chains;r in e&&!e.hasOwnProperty(r)&&l(e),i&&i.value()!==e&&(n.chains=i.copy(e))};var m=[];Ember.destroy=function(e){var t,r,o,a,s=e[n];if(s&&(e[n]=null,t=s.chains))for(m.push(t);m.length>0;){if(t=m.pop(),r=t._chains)for(o in r)r.hasOwnProperty(o)&&m.push(r[o]);t._watching&&(a=t._object,a&&i(a,t._key,t))}}}(),function(){function e(e,t){var r=e[t];return r?e.hasOwnProperty(t)||(r=e[t]=f(r)):r=e[t]={},r}function t(t){return e(t,"deps")}function r(r,n,i,o){var a,s,u,c,l,h=r._dependentKeys;if(h)for(a=t(o),s=0,u=h.length;u>s;s++)c=h[s],l=e(a,c),l[i]=(l[i]||0)+1,p(n,c)}function n(r,n,i,o){var a,s,u,c,l,h=r._dependentKeys;if(h)for(a=t(o),s=0,u=h.length;u>s;s++)c=h[s],l=e(a,c),l[i]=(l[i]||0)-1,d(n,c)}function i(e,t){this.func=e,this._cacheable=t&&void 0!==t.cacheable?t.cacheable:!0,this._dependentKeys=t&&t.dependentKeys,this._readOnly=t&&(void 0!==t.readOnly||!!t.readOnly)}function o(e){for(var t=0,r=e.length;r>t;t++)e[t].didChange(null)}function a(e,t){for(var r={},n=0;n<t.length;n++)r[t[n]]=c(e,t[n]);return r}function s(e,t){Ember.computed[e]=function(e){var r=m.call(arguments);return Ember.computed(e,function(){return t.apply(this,r)})}}function u(e,t){Ember.computed[e]=function(){var e=m.call(arguments),r=Ember.computed(function(){return t.apply(this,[a(this,e)])});return r.property.apply(r,e)}}var c=Ember.get,l=Ember.set,h=Ember.meta,m=[].slice,f=Ember.create,p=(Ember.META_KEY,Ember.watch),d=Ember.unwatch;Ember.ComputedProperty=i,i.prototype=new Ember.Descriptor;var b=i.prototype;b.cacheable=function(e){return this._cacheable=e!==!1,this},b.volatile=function(){return this.cacheable(!1)},b.readOnly=function(e){return this._readOnly=void 0===e||!!e,this},b.property=function(){for(var e=[],t=0,r=arguments.length;r>t;t++)e.push(arguments[t]);return this._dependentKeys=e,this},b.meta=function(e){return 0===arguments.length?this._meta||{}:(this._meta=e,this)},b.didChange=function(e,t){if(this._cacheable&&this._suspended!==e){var r=h(e);t in r.cache&&(delete r.cache[t],n(this,e,t,r))}},b.get=function(e,t){var n,i,a,s;if(this._cacheable){if(a=h(e),i=a.cache,t in i)return i[t];n=i[t]=this.func.call(e,t),s=a.chainWatchers&&a.chainWatchers[t],s&&o(s),r(this,e,t,a)}else n=this.func.call(e,t);return n},b.set=function(e,t,n){var i,o,a,s=this._cacheable,u=this.func,c=h(e,s),l=c.watching[t],m=this._suspended,f=!1,p=c.cache;if(this._readOnly)throw new Ember.Error("Cannot Set: "+t+" on: "+e.toString());this._suspended=e;try{if(s&&p.hasOwnProperty(t)&&(o=p[t],f=!0),i=u.wrappedFunction?u.wrappedFunction.length:u.length,3===i)a=u.call(e,t,n,o);else{if(2!==i)return Ember.defineProperty(e,t,null,o),Ember.set(e,t,n),void 0;a=u.call(e,t,n)}if(f&&o===a)return;l&&Ember.propertyWillChange(e,t),f&&delete p[t],s&&(f||r(this,e,t,c),p[t]=a),l&&Ember.propertyDidChange(e,t)}finally{this._suspended=m}return a},b.teardown=function(e,t){var r=h(e);return t in r.cache&&n(this,e,t,r),this._cacheable&&delete r.cache[t],null},Ember.computed=function(e){var t;if(arguments.length>1&&(t=m.call(arguments,0,-1),e=m.call(arguments,-1)[0]),"function"!=typeof e)throw new Ember.Error("Computed Property declared without a property function");var r=new i(e);return t&&r.property.apply(r,t),r},Ember.cacheFor=function(e,t){var r=h(e,!1).cache;return r&&t in r?r[t]:void 0},s("empty",function(e){return Ember.isEmpty(c(this,e))}),s("notEmpty",function(e){return!Ember.isEmpty(c(this,e))}),s("none",function(e){return Ember.isNone(c(this,e))}),s("not",function(e){return!c(this,e)}),s("bool",function(e){return!!c(this,e)}),s("match",function(e,t){var r=c(this,e);return"string"==typeof r?t.test(r):!1}),s("equal",function(e,t){return c(this,e)===t}),s("gt",function(e,t){return c(this,e)>t}),s("gte",function(e,t){return c(this,e)>=t}),s("lt",function(e,t){return c(this,e)<t}),s("lte",function(e,t){return c(this,e)<=t}),u("and",function(e){for(var t in e)if(e.hasOwnProperty(t)&&!e[t])return!1;return!0}),u("or",function(e){for(var t in e)if(e.hasOwnProperty(t)&&e[t])return!0;return!1}),u("any",function(e){for(var t in e)if(e.hasOwnProperty(t)&&e[t])return e[t];return null}),u("collect",function(e){var t=[];for(var r in e)e.hasOwnProperty(r)&&(Ember.isNone(e[r])?t.push(null):t.push(e[r]));return t}),Ember.computed.alias=function(e){return Ember.computed(e,function(t,r){return arguments.length>1?(l(this,e,r),r):c(this,e)})},Ember.computed.oneWay=function(e){return Ember.computed(e,function(){return c(this,e)})},Ember.computed.defaultTo=function(e){return Ember.computed(function(t,r,n){return 1===arguments.length?null!=n?n:c(this,e):null!=r?r:c(this,e)})}}(),function(){function e(e){return e+r}function t(e){return e+n}var r=":change",n=":before";Ember.addObserver=function(t,r,n,i){return Ember.addListener(t,e(r),n,i),Ember.watch(t,r),this},Ember.observersFor=function(t,r){return Ember.listenersFor(t,e(r))},Ember.removeObserver=function(t,r,n,i){return Ember.unwatch(t,r),Ember.removeListener(t,e(r),n,i),this},Ember.addBeforeObserver=function(e,r,n,i){return Ember.addListener(e,t(r),n,i),Ember.watch(e,r),this},Ember._suspendBeforeObserver=function(e,r,n,i,o){return Ember._suspendListener(e,t(r),n,i,o)},Ember._suspendObserver=function(t,r,n,i,o){return Ember._suspendListener(t,e(r),n,i,o)};var i=Ember.ArrayPolyfills.map;Ember._suspendBeforeObservers=function(e,r,n,o,a){var s=i.call(r,t);return Ember._suspendListeners(e,s,n,o,a)},Ember._suspendObservers=function(t,r,n,o,a){var s=i.call(r,e);return Ember._suspendListeners(t,s,n,o,a)},Ember.beforeObserversFor=function(e,r){return Ember.listenersFor(e,t(r))},Ember.removeBeforeObserver=function(e,r,n,i){return Ember.unwatch(e,r),Ember.removeListener(e,t(r),n,i),this}}(),function(){e("backburner/queue",["exports"],function(e){"use strict";function t(e,t,r){this.daq=e,this.name=t,this.options=r,this._queue=[]}t.prototype={daq:null,name:null,options:null,_queue:null,push:function(e,t,r,n){var i=this._queue;
return i.push(e,t,r,n),{queue:this,target:e,method:t}},pushUnique:function(e,t,r,n){var i,o,a,s,u=this._queue;for(a=0,s=u.length;s>a;a+=4)if(i=u[a],o=u[a+1],i===e&&o===t)return u[a+2]=r,u[a+3]=n,{queue:this,target:e,method:t};return this._queue.push(e,t,r,n),{queue:this,target:e,method:t}},flush:function(){var e,t,r,n,i,o=this._queue,a=this.options,s=a&&a.before,u=a&&a.after,c=o.length;for(c&&s&&s(),i=0;c>i;i+=4)e=o[i],t=o[i+1],r=o[i+2],n=o[i+3],r&&r.length>0?t.apply(e,r):t.call(e);c&&u&&u(),o.length>c?(this._queue=o.slice(c),this.flush()):this._queue.length=0},cancel:function(e){var t,r,n,i,o=this._queue;for(n=0,i=o.length;i>n;n+=4)if(t=o[n],r=o[n+1],t===e.target&&r===e.method)return o.splice(n,4),!0;if(o=this._queueBeingFlushed)for(n=0,i=o.length;i>n;n+=4)if(t=o[n],r=o[n+1],t===e.target&&r===e.method)return o[n+1]=null,!0}},e.Queue=t}),e("backburner/deferred_action_queues",["backburner/queue","exports"],function(e,t){"use strict";function r(e,t){var r=this.queues={};this.queueNames=e=e||[];for(var n,o=0,a=e.length;a>o;o++)n=e[o],r[n]=new i(this,n,t[n])}function n(e,t){for(var r,n,i=0,o=t;o>=i;i++)if(r=e.queueNames[i],n=e.queues[r],n._queue.length)return i;return-1}var i=e.Queue;r.prototype={queueNames:null,queues:null,schedule:function(e,t,r,n,i,o){var a=this.queues,s=a[e];if(!s)throw new Error("You attempted to schedule an action in a queue ("+e+") that doesn't exist");return i?s.pushUnique(t,r,n,o):s.push(t,r,n,o)},flush:function(){for(var e,t,r,i,o=this.queues,a=this.queueNames,s=0,u=a.length;u>s;){e=a[s],t=o[e],r=t._queueBeingFlushed=t._queue.slice(),t._queue=[];var c,l,h,m,f=t.options,p=f&&f.before,d=f&&f.after,b=0,v=r.length;for(v&&p&&p();v>b;)c=r[b],l=r[b+1],h=r[b+2],m=r[b+3],"string"==typeof l&&(l=c[l]),l&&(h&&h.length>0?l.apply(c,h):l.call(c)),b+=4;t._queueBeingFlushed=null,v&&d&&d(),-1===(i=n(this,s))?s++:s=i}}},t.DeferredActionQueues=r}),e("backburner",["backburner/deferred_action_queues","exports"],function(e,t){"use strict";function r(e){return"number"==typeof e||v.test(e)}function n(e,t){this.queueNames=e,this.options=t||{},this.options.defaultQueue||(this.options.defaultQueue=e[0]),this.instanceStack=[]}function i(e){e.begin(),s=b.setTimeout(function(){s=null,e.end()})}function o(e){var t,r,n,i,a=+new Date;e.run(function(){for(n=0,i=d.length;i>n&&(t=d[n],!(t>a));n+=2);for(r=d.splice(0,n),n=1,i=r.length;i>n;n+=2)e.schedule(e.options.defaultQueue,null,r[n])}),d.length&&(u=b.setTimeout(function(){o(e),u=null,c=null},d[0]-a),c=d[0])}function a(e,t){for(var r,n=-1,i=0,o=p.length;o>i;i++)if(r=p[i],r[0]===e&&r[1]===t){n=i;break}return n}var s,u,c,l=e.DeferredActionQueues,h=[].slice,m=[].pop,f=[],p=[],d=[],b=this,v=/\d+/;n.prototype={queueNames:null,options:null,currentInstance:null,instanceStack:null,begin:function(){var e=this.options&&this.options.onBegin,t=this.currentInstance;t&&this.instanceStack.push(t),this.currentInstance=new l(this.queueNames,this.options),e&&e(this.currentInstance,t)},end:function(){var e=this.options&&this.options.onEnd,t=this.currentInstance,r=null;try{t.flush()}finally{this.currentInstance=null,this.instanceStack.length&&(r=this.instanceStack.pop(),this.currentInstance=r),e&&e(t,r)}},run:function(e,t){var r;this.begin(),t||(t=e,e=null),"string"==typeof t&&(t=e[t]);var n=!1;try{r=arguments.length>2?t.apply(e,h.call(arguments,2)):t.call(e)}finally{n||(n=!0,this.end())}return r},defer:function(e,t,r){r||(r=t,t=null),"string"==typeof r&&(r=t[r]);var n=this.DEBUG?(new Error).stack:void 0,o=arguments.length>3?h.call(arguments,3):void 0;return this.currentInstance||i(this),this.currentInstance.schedule(e,t,r,o,!1,n)},deferOnce:function(e,t,r){r||(r=t,t=null),"string"==typeof r&&(r=t[r]);var n=this.DEBUG?(new Error).stack:void 0,o=arguments.length>3?h.call(arguments,3):void 0;return this.currentInstance||i(this),this.currentInstance.schedule(e,t,r,o,!0,n)},setTimeout:function(){function e(){t.apply(i,m)}var t,n,i,a,s,l,m=h.call(arguments),f=m.length,p=this;if(0!==f){if(1===f)t=m.shift(),n=0;else if(2===f)a=m[0],s=m[1],"function"==typeof s||"function"==typeof a[s]?(i=m.shift(),t=m.shift(),n=0):r(s)?(t=m.shift(),n=m.shift()):(t=m.shift(),n=0);else{var v=m[m.length-1];r(v)&&(n=m.pop()),a=m[0],l=m[1],"function"==typeof l||"string"==typeof l&&null!==a&&l in a?(i=m.shift(),t=m.shift()):t=m.shift()}var E=+new Date+parseInt(n,10);"string"==typeof t&&(t=i[t]);var g,y;for(g=0,y=d.length;y>g&&!(E<d[g]);g+=2);return d.splice(g,0,E,e),u&&E>c?e:(u&&(clearTimeout(u),u=null),u=b.setTimeout(function(){o(p),u=null,c=null},n),c=E,e)}},throttle:function(e,t){for(var r,n=this,i=arguments,o=parseInt(m.call(i),10),a=0,s=f.length;s>a;a++)if(r=f[a],r[0]===e&&r[1]===t)return;var u=b.setTimeout(function(){n.run.apply(n,i);for(var o=-1,a=0,s=f.length;s>a;a++)if(r=f[a],r[0]===e&&r[1]===t){o=a;break}o>-1&&f.splice(o,1)},o);f.push([e,t,u])},debounce:function(e,t){var r,n,i,o=this,s=arguments,u=m.call(s);"number"==typeof u||"string"==typeof u?(r=u,u=!1):r=m.call(s),r=parseInt(r,10),n=a(e,t),-1!==n&&(i=p[n],p.splice(n,1),clearTimeout(i[2]));var c=b.setTimeout(function(){u||o.run.apply(o,s),n=a(e,t),n&&p.splice(n,1)},r);u&&-1===n&&o.run.apply(o,s),p.push([e,t,c])},cancelTimers:function(){var e,t;for(e=0,t=f.length;t>e;e++)clearTimeout(f[e][2]);for(f=[],e=0,t=p.length;t>e;e++)clearTimeout(p[e][2]);p=[],u&&(clearTimeout(u),u=null),d=[],s&&(clearTimeout(s),s=null)},hasTimers:function(){return!!d.length||s},cancel:function(e){if(e&&"object"==typeof e&&e.queue&&e.method)return e.queue.cancel(e);if("function"==typeof e)for(var t=0,r=d.length;r>t;t+=2)if(d[t+1]===e)return d.splice(t,2),!0}},n.prototype.schedule=n.prototype.defer,n.prototype.scheduleOnce=n.prototype.deferOnce,n.prototype.later=n.prototype.setTimeout,t.Backburner=n})}(),function(){function e(){!Ember.run.currentRunLoop}var r=function(e){Ember.run.currentRunLoop=e},n=function(e,t){Ember.run.currentRunLoop=t},i=t("backburner").Backburner,o=new i(["sync","actions","destroy"],{sync:{before:Ember.beginPropertyChanges,after:Ember.endPropertyChanges},defaultQueue:"actions",onBegin:r,onEnd:n}),a=[].slice;Ember.run=function(){var e;if(Ember.onerror)try{e=o.run.apply(o,arguments)}catch(t){Ember.onerror(t)}else e=o.run.apply(o,arguments);return e},Ember.run.join=function(){if(!Ember.run.currentRunLoop)return Ember.run.apply(Ember.run,arguments);var e=a.call(arguments);e.unshift("actions"),Ember.run.schedule.apply(Ember.run,e)},Ember.run.backburner=o,Ember.run,Ember.run.currentRunLoop=null,Ember.run.queues=o.queueNames,Ember.run.begin=function(){o.begin()},Ember.run.end=function(){o.end()},Ember.run.schedule=function(){e(),o.schedule.apply(o,arguments)},Ember.run.hasScheduledTimers=function(){return o.hasTimers()},Ember.run.cancelTimers=function(){o.cancelTimers()},Ember.run.sync=function(){o.currentInstance&&o.currentInstance.queues.sync.flush()},Ember.run.later=function(){return o.later.apply(o,arguments)},Ember.run.once=function(){e();var t=a.call(arguments);return t.unshift("actions"),o.scheduleOnce.apply(o,t)},Ember.run.scheduleOnce=function(){return e(),o.scheduleOnce.apply(o,arguments)},Ember.run.next=function(){var e=a.call(arguments);return e.push(1),o.later.apply(o,e)},Ember.run.cancel=function(e){return o.cancel(e)},Ember.run.debounce=function(){return o.debounce.apply(o,arguments)},Ember.run.throttle=function(){return o.throttle.apply(o,arguments)}}(),function(){function e(e,t){return r(o(t)?Ember.lookup:e,t)}function t(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])}Ember.LOG_BINDINGS=!1||!!Ember.ENV.LOG_BINDINGS;var r=Ember.get,n=(Ember.set,Ember.guidFor),i=/^([A-Z$]|([0-9][A-Z$]))/,o=Ember.isGlobalPath=function(e){return i.test(e)},a=function(e,t){this._direction="fwd",this._from=t,this._to=e,this._directionMap=Ember.Map.create()};a.prototype={copy:function(){var e=new a(this._to,this._from);return this._oneWay&&(e._oneWay=!0),e},from:function(e){return this._from=e,this},to:function(e){return this._to=e,this},oneWay:function(){return this._oneWay=!0,this},toString:function(){var e=this._oneWay?"[oneWay]":"";return"Ember.Binding<"+n(this)+">("+this._from+" -> "+this._to+")"+e},connect:function(t){var r=this._from,n=this._to;return Ember.trySet(t,n,e(t,r)),Ember.addObserver(t,r,this,this.fromDidChange),this._oneWay||Ember.addObserver(t,n,this,this.toDidChange),this._readyToSync=!0,this},disconnect:function(e){var t=!this._oneWay;return Ember.removeObserver(e,this._from,this,this.fromDidChange),t&&Ember.removeObserver(e,this._to,this,this.toDidChange),this._readyToSync=!1,this},fromDidChange:function(e){this._scheduleSync(e,"fwd")},toDidChange:function(e){this._scheduleSync(e,"back")},_scheduleSync:function(e,t){var r=this._directionMap,n=r.get(e);n||(Ember.run.schedule("sync",this,this._sync,e),r.set(e,t)),"back"===n&&"fwd"===t&&r.set(e,"fwd")},_sync:function(t){var n=Ember.LOG_BINDINGS;if(!t.isDestroyed&&this._readyToSync){var i=this._directionMap,o=i.get(t),a=this._from,s=this._to;if(i.remove(t),"fwd"===o){var u=e(t,this._from);n&&Ember.Logger.log(" ",this.toString(),"->",u,t),this._oneWay?Ember.trySet(t,s,u):Ember._suspendObserver(t,s,this,this.toDidChange,function(){Ember.trySet(t,s,u)})}else if("back"===o){var c=r(t,this._to);n&&Ember.Logger.log(" ",this.toString(),"<-",c,t),Ember._suspendObserver(t,a,this,this.fromDidChange,function(){Ember.trySet(Ember.isGlobalPath(a)?Ember.lookup:t,a,c)})}}}},t(a,{from:function(){var e=this,t=new e;return t.from.apply(t,arguments)},to:function(){var e=this,t=new e;return t.to.apply(t,arguments)},oneWay:function(e,t){var r=this,n=new r(null,e);return n.oneWay(t)}}),Ember.Binding=a,Ember.bind=function(e,t,r){return new Ember.Binding(t,r).connect(e)},Ember.oneWay=function(e,t,r){return new Ember.Binding(t,r).oneWay().connect(e)}}(),function(){function e(e){var t=Ember.meta(e,!0),r=t.mixins;return r?t.hasOwnProperty("mixins")||(r=t.mixins=x(r)):r=t.mixins={},r}function t(e,t){return t&&t.length>0&&(e.mixins=C.call(t,function(e){if(e instanceof y)return e;var t=new y;return t.properties=e,t})),e}function r(e){return"function"==typeof e&&e.isMethod!==!1&&e!==Boolean&&e!==Object&&e!==Number&&e!==Array&&e!==Date&&e!==String}function n(e,t){var r;return t instanceof y?(r=T(t),e[r]?S:(e[r]=t,t.properties)):t}function i(e,t,r,n){var i;return i=r[e]||n[e],t[e]&&(i=i?i.concat(t[e]):t[e]),i}function o(e,t,r,n,i){var o;return void 0===n[t]&&(o=i[t]),o=o||e.descs[t],o&&o instanceof Ember.ComputedProperty?(r=x(r),r.func=Ember.wrap(r.func,o.func),r):r}function a(e,t,r,n,i){var o;return void 0===i[t]&&(o=n[t]),o=o||e[t],"function"!=typeof o?r:Ember.wrap(r,o)}function s(e,t,r,n){var i=n[t]||e[t];return i?"function"==typeof i.concat?i.concat(r):Ember.makeArray(i).concat(r):Ember.makeArray(r)}function u(e,t,n,i){var o=i[t]||e[t];if(!o)return n;var s=Ember.merge({},o);for(var u in n)if(n.hasOwnProperty(u)){var c=n[u];s[u]=r(c)?a(e,u,c,o,{}):c}return s}function c(e,t,n,i,c,l,h,m){if(n instanceof Ember.Descriptor){if(n===w&&c[t])return S;n.func&&(n=o(i,t,n,l,c)),c[t]=n,l[t]=void 0}else h&&O.call(h,t)>=0||"concatenatedProperties"===t||"mergedProperties"===t?n=s(e,t,n,l):m&&O.call(m,t)>=0?n=u(e,t,n,l):r(n)&&(n=a(e,t,n,l,c)),c[t]=void 0,l[t]=n}function l(e,t,r,o,a,s){function u(e){delete r[e],delete o[e]}for(var h,m,f,p,d,b,v=0,E=e.length;E>v;v++)if(h=e[v],m=n(t,h),m!==S)if(m){b=Ember.meta(a),a.willMergeMixin&&a.willMergeMixin(m),p=i("concatenatedProperties",m,o,a),d=i("mergedProperties",m,o,a);for(f in m)m.hasOwnProperty(f)&&(s.push(f),c(a,f,m[f],b,r,o,p,d));m.hasOwnProperty("toString")&&(a.toString=m.toString)}else h.mixins&&(l(h.mixins,t,r,o,a,s),h._without&&A.call(h._without,u))}function h(e,t,r,n){if(N.test(t)){var i=n.bindings;i?n.hasOwnProperty("bindings")||(i=n.bindings=x(n.bindings)):i=n.bindings={},i[t]=r}}function m(e,t){var r,n,i,o=t.bindings;if(o){for(r in o)n=o[r],n&&(i=r.slice(0,-7),n instanceof Ember.Binding?(n=n.copy(),n.to(i)):n=new Ember.Binding(i,n),n.connect(e),e[r]=n);t.bindings={}}}function f(e,t){return m(e,t||Ember.meta(e)),e}function p(e,t,r,n,i){var o,a=t.methodName;return n[a]||i[a]?(o=i[a],t=n[a]):r.descs[a]?(t=r.descs[a],o=void 0):(t=void 0,o=e[a]),{desc:t,value:o}}function d(e,t,r,n,i){var o=r[n];if(o)for(var a=0,s=o.length;s>a;a++)Ember[i](e,o[a],null,t)}function b(e,t,r){var n=e[t];"function"==typeof n&&(d(e,t,n,"__ember_observesBefore__","removeBeforeObserver"),d(e,t,n,"__ember_observes__","removeObserver"),d(e,t,n,"__ember_listens__","removeListener")),"function"==typeof r&&(d(e,t,r,"__ember_observesBefore__","addBeforeObserver"),d(e,t,r,"__ember_observes__","addObserver"),d(e,t,r,"__ember_listens__","addListener"))}function v(t,r,n){var i,o,a,s={},u={},c=Ember.meta(t),m=[];l(r,e(t),s,u,t,m);for(var d=0,v=m.length;v>d;d++)if(i=m[d],"constructor"!==i&&u.hasOwnProperty(i)&&(a=s[i],o=u[i],a!==w)){for(;a&&a instanceof _;){var E=p(t,a,c,s,u);a=E.desc,o=E.value}(void 0!==a||void 0!==o)&&(b(t,i,o),h(t,i,o,c),V(t,i,a,o,c))}return n||f(t,c),t}function E(e,t,r){var n=T(e);if(r[n])return!1;if(r[n]=!0,e===t)return!0;for(var i=e.mixins,o=i?i.length:0;--o>=0;)if(E(i[o],t,r))return!0;return!1}function g(e,t,r){if(!r[T(t)])if(r[T(t)]=!0,t.properties){var n=t.properties;for(var i in n)n.hasOwnProperty(i)&&(e[i]=!0)}else t.mixins&&A.call(t.mixins,function(t){g(e,t,r)})}var y,w,_,C=Ember.ArrayPolyfills.map,O=Ember.ArrayPolyfills.indexOf,A=Ember.ArrayPolyfills.forEach,P=[].slice,x=Ember.create,V=Ember.defineProperty,T=Ember.guidFor,S={},N=Ember.IS_BINDING=/^.+Binding$/;Ember.mixin=function(e){var t=P.call(arguments,1);return v(e,t,!1),e},Ember.Mixin=function(){return t(this,arguments)},y=Ember.Mixin,y.prototype={properties:null,mixins:null,ownerConstructor:null},y._apply=v,y.applyPartial=function(e){var t=P.call(arguments,1);return v(e,t,!0)},y.finishPartial=f,Ember.anyUnprocessedMixins=!1,y.create=function(){Ember.anyUnprocessedMixins=!0;var e=this;return t(new e,arguments)};var D=y.prototype;D.reopen=function(){var e,t;this.properties?(e=y.create(),e.properties=this.properties,delete this.properties,this.mixins=[e]):this.mixins||(this.mixins=[]);var r,n=arguments.length,i=this.mixins;for(r=0;n>r;r++)e=arguments[r],e instanceof y?i.push(e):(t=y.create(),t.properties=e,i.push(t));return this},D.apply=function(e){return v(e,[this],!1)},D.applyPartial=function(e){return v(e,[this],!0)},D.detect=function(e){if(!e)return!1;if(e instanceof y)return E(e,this,{});var t=Ember.meta(e,!1).mixins;return t?!!t[T(this)]:!1},D.without=function(){var e=new y(this);return e._without=P.call(arguments),e},D.keys=function(){var e={},t={},r=[];g(e,this,t);for(var n in e)e.hasOwnProperty(n)&&r.push(n);return r},y.mixins=function(e){var t=Ember.meta(e,!1).mixins,r=[];if(!t)return r;for(var n in t){var i=t[n];i.properties||r.push(i)}return r},w=new Ember.Descriptor,w.toString=function(){return"(Required Property)"},Ember.required=function(){return w},_=function(e){this.methodName=e},_.prototype=new Ember.Descriptor,Ember.alias=function(e){return new _(e)},Ember.aliasMethod=function(e){return new _(e)},Ember.observer=function(){var e=P.call(arguments,-1)[0],t=P.call(arguments,0,-1);if("function"!=typeof e&&(e=arguments[0],t=P.call(arguments,1)),"function"!=typeof e)throw new Ember.Error("Ember.observer called without a function");return e.__ember_observes__=t,e},Ember.immediateObserver=function(){for(var e=0,t=arguments.length;t>e;e++)arguments[e];return Ember.observer.apply(this,arguments)},Ember.beforeObserver=function(){var e=P.call(arguments,-1)[0],t=P.call(arguments,0,-1);if("function"!=typeof e&&(e=arguments[0],t=P.call(arguments,1)),"function"!=typeof e)throw new Ember.Error("Ember.beforeObserver called without a function");return e.__ember_observesBefore__=t,e}}(),function(){var e=Ember.EnumerableUtils.forEach,t=Ember.EnumerableUtils.indexOf;Ember.libraries=function(){var r=[],n=0,i=function(e){for(var t=0;t<r.length;t++)if(r[t].name===e)return r[t]};return r.register=function(e,t){i(e)||r.push({name:e,version:t})},r.registerCoreLibrary=function(e,t){i(e)||r.splice(n++,0,{name:e,version:t})},r.deRegister=function(e){var n=i(e);n&&r.splice(t(r,n),1)},r.each=function(t){e(r,function(e){t(e.name,e.version)})},r}(),Ember.libraries.registerCoreLibrary("Ember",Ember.VERSION)}(),function(){e("rsvp/all",["rsvp/promise","exports"],function(e,t){"use strict";function r(e){if("[object Array]"!==Object.prototype.toString.call(e))throw new TypeError("You must pass an array to all.");return new n(function(t,r){function n(e){return function(t){i(e,t)}}function i(e,r){a[e]=r,0===--s&&t(a)}var o,a=[],s=e.length;0===s&&t([]);for(var u=0;u<e.length;u++)o=e[u],o&&"function"==typeof o.then?o.then(n(u),r):i(u,o)})}var n=e.Promise;t.all=r}),e("rsvp/async",["exports"],function(e){"use strict";function t(){return function(e,t){process.nextTick(function(){e(t)})}}function r(){return function(e,t){setImmediate(function(){e(t)})}}function n(){var e=[],t=new s(function(){var t=e.slice();e=[],t.forEach(function(e){var t=e[0],r=e[1];t(r)})}),r=document.createElement("div");return t.observe(r,{attributes:!0}),window.addEventListener("unload",function(){t.disconnect(),t=null},!1),function(t,n){e.push([t,n]),r.setAttribute("drainQueue","drainQueue")}}function i(){return function(e,t){u.setTimeout(function(){e(t)},1)}}var o,a="undefined"!=typeof window?window:{},s=a.MutationObserver||a.WebKitMutationObserver,u="undefined"!=typeof global?global:this;o="function"==typeof setImmediate?r():"undefined"!=typeof process&&"[object process]"==={}.toString.call(process)?t():s?n():i(),e.async=o}),e("rsvp/config",["rsvp/async","exports"],function(e,t){"use strict";var r=e.async,n={};n.async=r,t.config=n}),e("rsvp/defer",["rsvp/promise","exports"],function(e,t){"use strict";function r(){var e={resolve:void 0,reject:void 0,promise:void 0};return e.promise=new n(function(t,r){e.resolve=t,e.reject=r}),e}var n=e.Promise;t.defer=r}),e("rsvp/events",["exports"],function(e){"use strict";var t=function(e,t){this.type=e;for(var r in t)t.hasOwnProperty(r)&&(this[r]=t[r])},r=function(e,t){for(var r=0,n=e.length;n>r;r++)if(e[r][0]===t)return r;return-1},n=function(e){var t=e._promiseCallbacks;return t||(t=e._promiseCallbacks={}),t},i={mixin:function(e){return e.on=this.on,e.off=this.off,e.trigger=this.trigger,e},on:function(e,t,i){var o,a,s=n(this);for(e=e.split(/\s+/),i=i||this;a=e.shift();)o=s[a],o||(o=s[a]=[]),-1===r(o,t)&&o.push([t,i])},off:function(e,t){var i,o,a,s=n(this);for(e=e.split(/\s+/);o=e.shift();)t?(i=s[o],a=r(i,t),-1!==a&&i.splice(a,1)):s[o]=[]},trigger:function(e,r){var i,o,a,s,u,c=n(this);if(i=c[e])for(var l=0;l<i.length;l++)o=i[l],a=o[0],s=o[1],"object"!=typeof r&&(r={detail:r}),u=new t(e,r),a.call(s,u)}};e.EventTarget=i}),e("rsvp/hash",["rsvp/defer","exports"],function(e,t){"use strict";function r(e){var t=0;for(var r in e)t++;return t}function n(e){var t={},n=i(),o=r(e);0===o&&n.resolve({});var a=function(e){return function(t){s(e,t)}},s=function(e,r){t[e]=r,0===--o&&n.resolve(t)},u=function(e){n.reject(e)};for(var c in e)e[c]&&"function"==typeof e[c].then?e[c].then(a(c),u):s(c,e[c]);return n.promise}var i=e.defer;t.hash=n}),e("rsvp/node",["rsvp/promise","rsvp/all","exports"],function(e,t,r){"use strict";function n(e,t){return function(r,n){r?t(r):arguments.length>2?e(Array.prototype.slice.call(arguments,1)):e(n)}}function i(e){return function(){var t,r,i=Array.prototype.slice.call(arguments),s=this,u=new o(function(e,n){t=e,r=n});return a(i).then(function(i){i.push(n(t,r));try{e.apply(s,i)}catch(o){r(o)}}),u}}var o=e.Promise,a=t.all;r.denodeify=i}),e("rsvp/promise",["rsvp/config","rsvp/events","exports"],function(e,t,r){"use strict";function n(e){return i(e)||"object"==typeof e&&null!==e}function i(e){return"function"==typeof e}function o(e){l.onerror&&l.onerror(e.detail)}function a(e,t){e===t?u(e,t):s(e,t)||u(e,t)}function s(e,t){var r,o=null;try{if(e===t)throw new TypeError("A promises callback cannot return that same promise.");if(n(t)&&(o=t.then,i(o)))return o.call(t,function(n){return r?!0:(r=!0,t!==n?a(e,n):u(e,n),void 0)},function(t){return r?!0:(r=!0,c(e,t),void 0)}),!0}catch(s){return c(e,s),!0}return!1}function u(e,t){l.async(function(){e.trigger("promise:resolved",{detail:t}),e.isFulfilled=!0,e.fulfillmentValue=t})}function c(e,t){l.async(function(){e.trigger("promise:failed",{detail:t}),e.isRejected=!0,e.rejectedReason=t})}var l=e.config,h=t.EventTarget,m=function(e){var t=this,r=!1;if("function"!=typeof e)throw new TypeError("You must pass a resolver function as the sole argument to the promise constructor");if(!(t instanceof m))return new m(e);var n=function(e){r||(r=!0,a(t,e))},i=function(e){r||(r=!0,c(t,e))};this.on("promise:resolved",function(e){this.trigger("success",{detail:e.detail})},this),this.on("promise:failed",function(e){this.trigger("error",{detail:e.detail})},this),this.on("error",o);try{e(n,i)}catch(s){i(s)}},f=function(e,t,r,n){var o,u,l,h,m=i(r);if(m)try{o=r(n.detail),l=!0}catch(f){h=!0,u=f}else o=n.detail,l=!0;s(t,o)||(m&&l?a(t,o):h?c(t,u):"resolve"===e?a(t,o):"reject"===e&&c(t,o))};m.prototype={constructor:m,isRejected:void 0,isFulfilled:void 0,rejectedReason:void 0,fulfillmentValue:void 0,then:function(e,t){this.off("error",o);var r=new this.constructor(function(){});return this.isFulfilled&&l.async(function(t){f("resolve",r,e,{detail:t.fulfillmentValue})},this),this.isRejected&&l.async(function(e){f("reject",r,t,{detail:e.rejectedReason})},this),this.on("promise:resolved",function(t){f("resolve",r,e,t)}),this.on("promise:failed",function(e){f("reject",r,t,e)}),r},fail:function(e){return this.then(null,e)}},h.mixin(m.prototype),r.Promise=m}),e("rsvp/reject",["rsvp/promise","exports"],function(e,t){"use strict";function r(e){return new n(function(t,r){r(e)})}var n=e.Promise;t.reject=r}),e("rsvp/resolve",["rsvp/promise","exports"],function(e,t){"use strict";function r(e){return new n(function(t){t(e)})}var n=e.Promise;t.resolve=r}),e("rsvp/rethrow",["exports"],function(e){"use strict";function t(e){throw r.setTimeout(function(){throw e}),e}var r="undefined"==typeof global?this:global;e.rethrow=t}),e("rsvp",["rsvp/events","rsvp/promise","rsvp/node","rsvp/all","rsvp/hash","rsvp/rethrow","rsvp/defer","rsvp/config","rsvp/resolve","rsvp/reject","exports"],function(e,t,r,n,i,o,a,s,u,c,l){"use strict";function h(e,t){g[e]=t}var m=e.EventTarget,f=t.Promise,p=r.denodeify,d=n.all,b=i.hash,v=o.rethrow,E=a.defer,g=s.config,y=u.resolve,w=c.reject;l.Promise=f,l.EventTarget=m,l.all=d,l.hash=b,l.rethrow=v,l.defer=E,l.denodeify=p,l.configure=h,l.resolve=y,l.reject=w})}(),function(){Ember.MODEL_FACTORY_INJECTIONS=!1||!!Ember.ENV.MODEL_FACTORY_INJECTIONS,e("container",[],function(){function e(e){this.parent=e,this.dict={}}function t(t){this.parent=t,this.children=[],this.resolver=t&&t.resolver||function(){},this.registry=new e(t&&t.registry),this.cache=new e(t&&t.cache),this.factoryCache=new e(t&&t.cache),this.typeInjections=new e(t&&t.typeInjections),this.injections={},this.factoryTypeInjections=new e(t&&t.factoryTypeInjections),this.factoryInjections={},this._options=new e(t&&t._options),this._typeOptions=new e(t&&t._typeOptions)}function r(e){throw new Error(e+" is not currently supported on child containers")}function n(e,t){var r=o(e,t,"singleton");return r!==!1}function i(e,t){var r={};if(!t)return r;for(var n,i,o=0,a=t.length;a>o;o++){if(n=t[o],i=e.lookup(n.fullName),void 0===i)throw new Error("Attempting to inject an unknown injection: `"+n.fullName+"`");r[n.property]=i}return r}function o(e,t,r){var n=e._options.get(t);if(n&&void 0!==n[r])return n[r];var i=t.split(":")[0];return n=e._typeOptions.get(i),n?n[r]:void 0}function a(e,t){var r,n=e.normalize(t),i=e.resolve(n),o=e.factoryCache,a=t.split(":")[0];if(void 0!==i){if(o.has(t))return o.get(t);if(!i||"function"!=typeof i.extend||!Ember.MODEL_FACTORY_INJECTIONS&&"model"===a)return i;var c=s(e,t),l=u(e,t);return l._toString=e.makeToString(i,t),r=i.extend(c),r.reopenClass(l),o.set(t,r),r}}function s(e,t){var r=t.split(":"),n=r[0],o=[];return o=o.concat(e.typeInjections.get(n)||[]),o=o.concat(e.injections[t]||[]),o=i(e,o),o._debugContainerKey=t,o.container=e,o}function u(e,t){var r=t.split(":"),n=r[0],o=[];return o=o.concat(e.factoryTypeInjections.get(n)||[]),o=o.concat(e.factoryInjections[t]||[]),o=i(e,o),o._debugContainerKey=t,o}function c(e,t){var r=a(e,t);return o(e,t,"instantiate")===!1?r:r?"function"==typeof r.extend?r.create():r.create(s(e,t)):void 0}function l(e,t){e.cache.eachLocal(function(r,n){o(e,r,"instantiate")!==!1&&t(n)})}function h(e){e.cache.eachLocal(function(t,r){o(e,t,"instantiate")!==!1&&r.destroy()}),e.cache.dict={}}function m(e,t,r,n){var i=e.get(t);i||(i=[],e.set(t,i)),i.push({property:r,fullName:n})}function f(e,t,r,n){var i=e[t]=e[t]||[];i.push({property:r,fullName:n})}return e.prototype={parent:null,dict:null,get:function(e){var t=this.dict;return t.hasOwnProperty(e)?t[e]:this.parent?this.parent.get(e):void 0},set:function(e,t){this.dict[e]=t},remove:function(e){delete this.dict[e]},has:function(e){var t=this.dict;return t.hasOwnProperty(e)?!0:this.parent?this.parent.has(e):!1},eachLocal:function(e,t){var r=this.dict;for(var n in r)r.hasOwnProperty(n)&&e.call(t,n,r[n])}},t.prototype={parent:null,children:null,resolver:null,registry:null,cache:null,typeInjections:null,injections:null,_options:null,_typeOptions:null,child:function(){var e=new t(this);return this.children.push(e),e},set:function(e,t,r){e[t]=r},register:function(e,t,r){if(-1===e.indexOf(":"))throw new TypeError("malformed fullName, expected: `type:name` got: "+e);if(void 0===t)throw new TypeError("Attempting to register an unknown factory: `"+e+"`");var n=this.normalize(e);if(this.cache.has(n))throw new Error("Cannot re-register: `"+e+"`, as it has already been looked up.");this.registry.set(n,t),this._options.set(n,r||{})},unregister:function(e){var t=this.normalize(e);this.registry.remove(t),this.cache.remove(t),this.factoryCache.remove(t),this._options.remove(t)},resolve:function(e){return this.resolver(e)||this.registry.get(e)},describe:function(e){return e},normalize:function(e){return e},makeToString:function(e){return e.toString()},lookup:function(e,t){if(e=this.normalize(e),t=t||{},this.cache.has(e)&&t.singleton!==!1)return this.cache.get(e);var r=c(this,e);return void 0!==r?(n(this,e)&&t.singleton!==!1&&this.cache.set(e,r),r):void 0},lookupFactory:function(e){return a(this,e)},has:function(e){return this.cache.has(e)?!0:!!a(this,e)},optionsForType:function(e,t){this.parent&&r("optionsForType"),this._typeOptions.set(e,t)},options:function(e,t){this.optionsForType(e,t)},typeInjection:function(e,t,n){this.parent&&r("typeInjection"),m(this.typeInjections,e,t,n)},injection:function(e,t,n){return this.parent&&r("injection"),-1===e.indexOf(":")?this.typeInjection(e,t,n):(f(this.injections,e,t,n),void 0)},factoryTypeInjection:function(e,t,n){this.parent&&r("factoryTypeInjection"),m(this.factoryTypeInjections,e,t,n)},factoryInjection:function(e,t,n){return this.parent&&r("injection"),-1===e.indexOf(":")?this.factoryTypeInjection(e,t,n):(f(this.factoryInjections,e,t,n),void 0)},destroy:function(){this.isDestroyed=!0;for(var e=0,t=this.children.length;t>e;e++)this.children[e].destroy();this.children=[],l(this,function(e){e.destroy()}),this.parent=void 0,this.isDestroyed=!0},reset:function(){for(var e=0,t=this.children.length;t>e;e++)h(this.children[e]);h(this)}},t})}(),function(){function e(r,n,i,o){var a,s,u;if("object"!=typeof r||null===r)return r;if(n&&(s=t(i,r))>=0)return o[s];if("array"===Ember.typeOf(r)){if(a=r.slice(),n)for(s=a.length;--s>=0;)a[s]=e(a[s],n,i,o)}else if(Ember.Copyable&&Ember.Copyable.detect(r))a=r.copy(n,i,o);else{a={};for(u in r)r.hasOwnProperty(u)&&"__"!==u.substring(0,2)&&(a[u]=n?e(r[u],n,i,o):r[u])}return n&&(i.push(r),o.push(a)),a}var t=Ember.EnumerableUtils.indexOf;if(Ember.compare=function i(e,t){if(e===t)return 0;var r=Ember.typeOf(e),n=Ember.typeOf(t),o=Ember.Comparable;if(o){if("instance"===r&&o.detect(e.constructor))return e.constructor.compare(e,t);if("instance"===n&&o.detect(t.constructor))return 1-t.constructor.compare(t,e)}var a=Ember.ORDER_DEFINITION_MAPPING;if(!a){var s=Ember.ORDER_DEFINITION;a=Ember.ORDER_DEFINITION_MAPPING={};var u,c;for(u=0,c=s.length;c>u;++u)a[s[u]]=u;delete Ember.ORDER_DEFINITION}var l=a[r],h=a[n];if(h>l)return-1;if(l>h)return 1;switch(r){case"boolean":case"number":return t>e?-1:e>t?1:0;case"string":var m=e.localeCompare(t);return 0>m?-1:m>0?1:0;case"array":for(var f=e.length,p=t.length,d=Math.min(f,p),b=0,v=0;0===b&&d>v;)b=i(e[v],t[v]),v++;return 0!==b?b:p>f?-1:f>p?1:0;case"instance":return Ember.Comparable&&Ember.Comparable.detect(e)?e.compare(e,t):0;case"date":var E=e.getTime(),g=t.getTime();return g>E?-1:E>g?1:0;default:return 0}},Ember.copy=function(t,r){return"object"!=typeof t||null===t?t:Ember.Copyable&&Ember.Copyable.detect(t)?t.copy(r):e(t,r,r?[]:null,r?[]:null)},Ember.inspect=function(e){var t=Ember.typeOf(e);if("array"===t)return"["+e+"]";if("object"!==t)return e+"";var r,n=[];for(var i in e)if(e.hasOwnProperty(i)){if(r=e[i],"toString"===r)continue;"function"===Ember.typeOf(r)&&(r="function() { ... }"),n.push(i+": "+r)}return"{"+n.join(", ")+"}"},Ember.isEqual=function(e,t){return e&&"function"==typeof e.isEqual?e.isEqual(t):e===t},Ember.ORDER_DEFINITION=Ember.ENV.ORDER_DEFINITION||["undefined","null","boolean","number","string","array","object","instance","function","class","date"],Ember.keys=Object.keys,!Ember.keys||Ember.create.isSimulated){var r=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","valueOf","toLocaleString","toString"],n=function(e,r,n){"__"!==n.substring(0,2)&&"_super"!==n&&(t(r,n)>=0||e.hasOwnProperty(n)&&r.push(n))};Ember.keys=function(e){var t,i=[];for(t in e)n(e,i,t);for(var o=0,a=r.length;a>o;o++)t=r[o],n(e,i,t);return i}}}(),function(){var e=/[ _]/g,t={},r=/([a-z\d])([A-Z])/g,n=/(\-|_|\.|\s)+(.)?/g,i=/([a-z\d])([A-Z]+)/g,o=/\-|\s+/g;Ember.STRINGS={},Ember.String={fmt:function(e,t){var r=0;return e.replace(/%@([0-9]+)?/g,function(e,n){return n=n?parseInt(n,10)-1:r++,e=t[n],null===e?"(null)":void 0===e?"":Ember.inspect(e)})},loc:function(e,t){return e=Ember.STRINGS[e]||e,Ember.String.fmt(e,t)},w:function(e){return e.split(/\s+/)},decamelize:function(e){return e.replace(r,"$1_$2").toLowerCase()},dasherize:function(r){var n,i=t,o=i.hasOwnProperty(r);return o?i[r]:(n=Ember.String.decamelize(r).replace(e,"-"),i[r]=n,n)},camelize:function(e){return e.replace(n,function(e,t,r){return r?r.toUpperCase():""}).replace(/^([A-Z])/,function(e){return e.toLowerCase()})},classify:function(e){for(var t=e.split("."),r=[],n=0,i=t.length;i>n;n++){var o=Ember.String.camelize(t[n]);r.push(o.charAt(0).toUpperCase()+o.substr(1))}return r.join(".")},underscore:function(e){return e.replace(i,"$1_$2").replace(o,"_").toLowerCase()},capitalize:function(e){return e.charAt(0).toUpperCase()+e.substr(1)}}}(),function(){var e=Ember.String.fmt,t=Ember.String.w,r=Ember.String.loc,n=Ember.String.camelize,i=Ember.String.decamelize,o=Ember.String.dasherize,a=Ember.String.underscore,s=Ember.String.capitalize,u=Ember.String.classify;(Ember.EXTEND_PROTOTYPES===!0||Ember.EXTEND_PROTOTYPES.String)&&(String.prototype.fmt=function(){return e(this,arguments)},String.prototype.w=function(){return t(this)},String.prototype.loc=function(){return r(this,arguments)},String.prototype.camelize=function(){return n(this)},String.prototype.decamelize=function(){return i(this)},String.prototype.dasherize=function(){return o(this)},String.prototype.underscore=function(){return a(this)},String.prototype.classify=function(){return u(this)},String.prototype.capitalize=function(){return s(this)})}(),function(){var e=Ember.get,t=Ember.set,r=Array.prototype.slice,n=Ember.getProperties;Ember.Observable=Ember.Mixin.create({get:function(t){return e(this,t)},getProperties:function(){return n.apply(null,[this].concat(r.call(arguments)))},set:function(e,r){return t(this,e,r),this},setProperties:function(e){return Ember.setProperties(this,e)},beginPropertyChanges:function(){return Ember.beginPropertyChanges(),this},endPropertyChanges:function(){return Ember.endPropertyChanges(),this},propertyWillChange:function(e){return Ember.propertyWillChange(this,e),this},propertyDidChange:function(e){return Ember.propertyDidChange(this,e),this},notifyPropertyChange:function(e){return this.propertyWillChange(e),this.propertyDidChange(e),this},addBeforeObserver:function(e,t,r){Ember.addBeforeObserver(this,e,t,r)},addObserver:function(e,t,r){Ember.addObserver(this,e,t,r)},removeObserver:function(e,t,r){Ember.removeObserver(this,e,t,r)},hasObserverFor:function(e){return Ember.hasListeners(this,e+":change")},getWithDefault:function(e,t){return Ember.getWithDefault(this,e,t)},incrementProperty:function(r,n){return Ember.isNone(n)&&(n=1),t(this,r,(e(this,r)||0)+n),e(this,r)},decrementProperty:function(r,n){return Ember.isNone(n)&&(n=1),t(this,r,(e(this,r)||0)-n),e(this,r)
},toggleProperty:function(r){return t(this,r,!e(this,r)),e(this,r)},cacheFor:function(e){return Ember.cacheFor(this,e)},observersForKey:function(e){return Ember.observersFor(this,e)}})}(),function(){function e(){var e,t,o=!1,a=function(){o||a.proto(),n(this,i,g),n(this,"_super",g);var u=s(this),h=u.proto;if(u.proto=this,e){var m=e;e=null,this.reopen.apply(this,m)}if(t){var f=t;t=null;for(var p=this.concatenatedProperties,b=0,y=f.length;y>b;b++){var w=f[b];if(null!==w&&"object"==typeof w)for(var _=Ember.keys(w),C=0,O=_.length;O>C;C++){var A=_[C];if(w.hasOwnProperty(A)){var P=w[A],x=Ember.IS_BINDING;if(x.test(A)){var V=u.bindings;V?u.hasOwnProperty("bindings")||(V=u.bindings=r(u.bindings)):V=u.bindings={},V[A]=P}var T=u.descs[A];if(p&&E(p,A)>=0){var S=this[A];P=S?"function"==typeof S.concat?S.concat(P):Ember.makeArray(S).concat(P):Ember.makeArray(P)}T?T.set(this,A,P):"function"!=typeof this.setUnknownProperty||A in this?v?Ember.defineProperty(this,A,null,P):this[A]=P:this.setUnknownProperty(A,P)}}}}d(this,u),this.init.apply(this,arguments),u.proto=h,c(this),l(this,"init")};return a.toString=f.prototype.toString,a.willReopen=function(){o&&(a.PrototypeMixin=f.create(a.PrototypeMixin)),o=!1},a._initMixins=function(t){e=t},a._initProperties=function(e){t=e},a.proto=function(){var e=a.superclass;return e&&e.proto(),o||(o=!0,a.PrototypeMixin.applyPartial(a.prototype),u(a.prototype)),this.prototype},a}function t(e){return function(){return e}}var r=(Ember.set,Ember.get,Ember.create),n=Ember.platform.defineProperty,i=Ember.GUID_KEY,o=Ember.guidFor,a=Ember.generateGuid,s=Ember.meta,u=Ember.rewatch,c=Ember.finishChains,l=Ember.sendEvent,h=Ember.destroy,m=Ember.run.schedule,f=Ember.Mixin,p=f._apply,d=f.finishPartial,b=f.prototype.reopen,v=Ember.ENV.MANDATORY_SETTER,E=Ember.EnumerableUtils.indexOf,g={configurable:!0,writable:!0,enumerable:!1,value:void 0},y=e();y.toString=function(){return"Ember.CoreObject"},y.PrototypeMixin=f.create({reopen:function(){return p(this,arguments,!0),this},init:function(){},concatenatedProperties:null,isDestroyed:!1,isDestroying:!1,destroy:function(){return this.isDestroying?void 0:(this.isDestroying=!0,m("actions",this,this.willDestroy),m("destroy",this,this._scheduledDestroy),this)},willDestroy:Ember.K,_scheduledDestroy:function(){this.isDestroyed||(h(this),this.isDestroyed=!0)},bind:function(e,t){return t instanceof Ember.Binding||(t=Ember.Binding.from(t)),t.to(e).connect(this),t},toString:function(){var e="function"==typeof this.toStringExtension,r=e?":"+this.toStringExtension():"",n="<"+this.constructor.toString()+":"+o(this)+r+">";return this.toString=t(n),n}}),y.PrototypeMixin.ownerConstructor=y,Ember.config.overridePrototypeMixin&&Ember.config.overridePrototypeMixin(y.PrototypeMixin),y.__super__=null;var w=f.create({ClassMixin:Ember.required(),PrototypeMixin:Ember.required(),isClass:!0,isMethod:!1,extend:function(){var t,n=e();return n.ClassMixin=f.create(this.ClassMixin),n.PrototypeMixin=f.create(this.PrototypeMixin),n.ClassMixin.ownerConstructor=n,n.PrototypeMixin.ownerConstructor=n,b.apply(n.PrototypeMixin,arguments),n.superclass=this,n.__super__=this.prototype,t=n.prototype=r(this.prototype),t.constructor=n,a(t),s(t).proto=t,n.ClassMixin.apply(n),n},createWithMixins:function(){var e=this;return arguments.length>0&&this._initMixins(arguments),new e},create:function(){var e=this;return arguments.length>0&&this._initProperties(arguments),new e},reopen:function(){return this.willReopen(),b.apply(this.PrototypeMixin,arguments),this},reopenClass:function(){return b.apply(this.ClassMixin,arguments),p(this,arguments,!1),this},detect:function(e){if("function"!=typeof e)return!1;for(;e;){if(e===this)return!0;e=e.superclass}return!1},detectInstance:function(e){return e instanceof this},metaForProperty:function(e){var t=s(this.proto(),!1).descs[e];return t._meta||{}},eachComputedProperty:function(e,t){var r,n=this.proto(),i=s(n).descs,o={};for(var a in i)r=i[a],r instanceof Ember.ComputedProperty&&e.call(t||this,a,r._meta||o)}});w.ownerConstructor=y,Ember.config.overrideClassMixin&&Ember.config.overrideClassMixin(w),y.ClassMixin=w,w.apply(y),Ember.CoreObject=y}(),function(){Ember.Object=Ember.CoreObject.extend(Ember.Observable),Ember.Object.toString=function(){return"Ember.Object"}}(),function(){function e(t,r,i){var a=t.length;c[t.join(".")]=r;for(var s in r)if(l.call(r,s)){var u=r[s];if(t[a]=s,u&&u.toString===n)u.toString=o(t.join(".")),u[m]=t.join(".");else if(u&&u.isNamespace){if(i[h(u)])continue;i[h(u)]=!0,e(t,u,i)}}t.length=a}function t(){var e,t,r=Ember.Namespace,n=Ember.lookup;if(!r.PROCESSED)for(var i in n)if("parent"!==i&&"top"!==i&&"frameElement"!==i&&"webkitStorageInfo"!==i&&!("globalStorage"===i&&n.StorageList&&n.globalStorage instanceof n.StorageList||n.hasOwnProperty&&!n.hasOwnProperty(i))){try{e=Ember.lookup[i],t=e&&e.isNamespace}catch(o){continue}t&&(e[m]=i)}}function r(e){var t=e.superclass;return t?t[m]?t[m]:r(t):void 0}function n(){Ember.BOOTED||this[m]||i();var e;if(this[m])e=this[m];else if(this._toString)e=this._toString;else{var t=r(this);e=t?"(subclass of "+t+")":"(unknown mixin)",this.toString=o(e)}return e}function i(){var r=!u.PROCESSED,n=Ember.anyUnprocessedMixins;if(r&&(t(),u.PROCESSED=!0),r||n){for(var i,o=u.NAMESPACES,a=0,s=o.length;s>a;a++)i=o[a],e([i.toString()],i,{});Ember.anyUnprocessedMixins=!1}}function o(e){return function(){return e}}var a=Ember.get,s=Ember.ArrayPolyfills.indexOf,u=Ember.Namespace=Ember.Object.extend({isNamespace:!0,init:function(){Ember.Namespace.NAMESPACES.push(this),Ember.Namespace.PROCESSED=!1},toString:function(){var e=a(this,"name");return e?e:(t(),this[Ember.GUID_KEY+"_name"])},nameClasses:function(){e([this.toString()],this,{})},destroy:function(){var e=Ember.Namespace.NAMESPACES;Ember.lookup[this.toString()]=void 0,e.splice(s.call(e,this),1),this._super()}});u.reopenClass({NAMESPACES:[Ember],NAMESPACES_BY_ID:{},PROCESSED:!1,processAll:i,byName:function(e){return Ember.BOOTED||i(),c[e]}});var c=u.NAMESPACES_BY_ID,l={}.hasOwnProperty,h=Ember.guidFor,m=Ember.NAME_KEY=Ember.GUID_KEY+"_name";Ember.Mixin.prototype.toString=n}(),function(){function e(e,t){var r=t.slice(8);r in this||u(this,r)}function t(e,t){var r=t.slice(8);r in this||c(this,r)}var r=Ember.get,n=Ember.set,i=(Ember.String.fmt,Ember.addBeforeObserver),o=Ember.addObserver,a=Ember.removeBeforeObserver,s=Ember.removeObserver,u=Ember.propertyWillChange,c=Ember.propertyDidChange,l=Ember.meta,h=Ember.defineProperty;Ember.ObjectProxy=Ember.Object.extend({content:null,_contentDidChange:Ember.observer("content",function(){}),isTruthy:Ember.computed.bool("content"),_debugContainerKey:null,willWatchProperty:function(r){var n="content."+r;i(this,n,null,e),o(this,n,null,t)},didUnwatchProperty:function(r){var n="content."+r;a(this,n,null,e),s(this,n,null,t)},unknownProperty:function(e){var t=r(this,"content");return t?r(t,e):void 0},setUnknownProperty:function(e,t){var i=l(this);if(i.proto===this)return h(this,e,null,t),t;var o=r(this,"content");return n(o,e,t)}})}(),function(){function e(){return 0===s.length?{}:s.pop()}function t(e){return s.push(e),null}function r(e,t){function r(r){var o=n(r,e);return i?t===o:!!o}var i=2===arguments.length;return r}var n=Ember.get,i=Ember.set,o=Array.prototype.slice,a=Ember.EnumerableUtils.indexOf,s=[];Ember.Enumerable=Ember.Mixin.create({nextObject:Ember.required(Function),firstObject:Ember.computed(function(){if(0===n(this,"length"))return void 0;var r,i=e();return r=this.nextObject(0,null,i),t(i),r}).property("[]"),lastObject:Ember.computed(function(){var r=n(this,"length");if(0===r)return void 0;var i,o=e(),a=0,s=null;do s=i,i=this.nextObject(a++,s,o);while(void 0!==i);return t(o),s}).property("[]"),contains:function(e){return void 0!==this.find(function(t){return t===e})},forEach:function(r,i){if("function"!=typeof r)throw new TypeError;var o=n(this,"length"),a=null,s=e();void 0===i&&(i=null);for(var u=0;o>u;u++){var c=this.nextObject(u,a,s);r.call(i,c,u,this),a=c}return a=null,s=t(s),this},getEach:function(e){return this.mapBy(e)},setEach:function(e,t){return this.forEach(function(r){i(r,e,t)})},map:function(e,t){var r=Ember.A();return this.forEach(function(n,i,o){r[i]=e.call(t,n,i,o)}),r},mapBy:function(e){return this.map(function(t){return n(t,e)})},mapProperty:Ember.aliasMethod("mapBy"),filter:function(e,t){var r=Ember.A();return this.forEach(function(n,i,o){e.call(t,n,i,o)&&r.push(n)}),r},reject:function(e,t){return this.filter(function(){return!e.apply(t,arguments)})},filterBy:function(){return this.filter(r.apply(this,arguments))},filterProperty:Ember.aliasMethod("filterBy"),rejectBy:function(e,t){var r=function(r){return n(r,e)===t},i=function(t){return!!n(t,e)},o=2===arguments.length?r:i;return this.reject(o)},rejectProperty:Ember.aliasMethod("rejectBy"),find:function(r,i){var o=n(this,"length");void 0===i&&(i=null);for(var a,s,u=null,c=!1,l=e(),h=0;o>h&&!c;h++)a=this.nextObject(h,u,l),(c=r.call(i,a,h,this))&&(s=a),u=a;return a=u=null,l=t(l),s},findBy:function(){return this.find(r.apply(this,arguments))},findProperty:Ember.aliasMethod("findBy"),every:function(e,t){return!this.find(function(r,n,i){return!e.call(t,r,n,i)})},everyBy:function(){return this.every(r.apply(this,arguments))},everyProperty:Ember.aliasMethod("everyBy"),any:function(e,t){var r=this.find(function(r,n,i){return!!e.call(t,r,n,i)});return"undefined"!=typeof r},some:Ember.aliasMethod("any"),anyBy:function(){return this.any(r.apply(this,arguments))},someProperty:Ember.aliasMethod("anyBy"),reduce:function(e,t,r){if("function"!=typeof e)throw new TypeError;var n=t;return this.forEach(function(t,i){n=e.call(null,n,t,i,this,r)},this),n},invoke:function(e){var t,r=Ember.A();return arguments.length>1&&(t=o.call(arguments,1)),this.forEach(function(n,i){var o=n&&n[e];"function"==typeof o&&(r[i]=t?o.apply(n,t):o.call(n))},this),r},toArray:function(){var e=Ember.A();return this.forEach(function(t,r){e[r]=t}),e},compact:function(){return this.filter(function(e){return null!=e})},without:function(e){if(!this.contains(e))return this;var t=Ember.A();return this.forEach(function(r){r!==e&&(t[t.length]=r)}),t},uniq:function(){var e=Ember.A();return this.forEach(function(t){a(e,t)<0&&e.push(t)}),e},"[]":Ember.computed(function(){return this}),addEnumerableObserver:function(e,t){var r=t&&t.willChange||"enumerableWillChange",i=t&&t.didChange||"enumerableDidChange",o=n(this,"hasEnumerableObservers");return o||Ember.propertyWillChange(this,"hasEnumerableObservers"),Ember.addListener(this,"@enumerable:before",e,r),Ember.addListener(this,"@enumerable:change",e,i),o||Ember.propertyDidChange(this,"hasEnumerableObservers"),this},removeEnumerableObserver:function(e,t){var r=t&&t.willChange||"enumerableWillChange",i=t&&t.didChange||"enumerableDidChange",o=n(this,"hasEnumerableObservers");return o&&Ember.propertyWillChange(this,"hasEnumerableObservers"),Ember.removeListener(this,"@enumerable:before",e,r),Ember.removeListener(this,"@enumerable:change",e,i),o&&Ember.propertyDidChange(this,"hasEnumerableObservers"),this},hasEnumerableObservers:Ember.computed(function(){return Ember.hasListeners(this,"@enumerable:change")||Ember.hasListeners(this,"@enumerable:before")}),enumerableContentWillChange:function(e,t){var r,i,o;return r="number"==typeof e?e:e?n(e,"length"):e=-1,i="number"==typeof t?t:t?n(t,"length"):t=-1,o=0>i||0>r||0!==i-r,-1===e&&(e=null),-1===t&&(t=null),Ember.propertyWillChange(this,"[]"),o&&Ember.propertyWillChange(this,"length"),Ember.sendEvent(this,"@enumerable:before",[this,e,t]),this},enumerableContentDidChange:function(e,t){var r,i,o;return r="number"==typeof e?e:e?n(e,"length"):e=-1,i="number"==typeof t?t:t?n(t,"length"):t=-1,o=0>i||0>r||0!==i-r,-1===e&&(e=null),-1===t&&(t=null),Ember.sendEvent(this,"@enumerable:change",[this,e,t]),o&&Ember.propertyDidChange(this,"length"),Ember.propertyDidChange(this,"[]"),this}}),Ember.Enumerable.reopen({sortBy:function(){var e=arguments;return this.toArray().sort(function(t,r){for(var i=0;i<e.length;i++){var o=e[i],a=n(t,o),s=n(r,o),u=Ember.compare(a,s);if(u)return u}return 0})}})}(),function(){var e=Ember.get,t=(Ember.set,Ember.isNone),r=Ember.EnumerableUtils.map,n=Ember.cacheFor;Ember.Array=Ember.Mixin.create(Ember.Enumerable,{length:Ember.required(),objectAt:function(t){return 0>t||t>=e(this,"length")?void 0:e(this,t)},objectsAt:function(e){var t=this;return r(e,function(e){return t.objectAt(e)})},nextObject:function(e){return this.objectAt(e)},"[]":Ember.computed(function(t,r){return void 0!==r&&this.replace(0,e(this,"length"),r),this}),firstObject:Ember.computed(function(){return this.objectAt(0)}),lastObject:Ember.computed(function(){return this.objectAt(e(this,"length")-1)}),contains:function(e){return this.indexOf(e)>=0},slice:function(r,n){var i=Ember.A(),o=e(this,"length");for(t(r)&&(r=0),(t(n)||n>o)&&(n=o),0>r&&(r=o+r),0>n&&(n=o+n);n>r;)i[i.length]=this.objectAt(r++);return i},indexOf:function(t,r){var n,i=e(this,"length");for(void 0===r&&(r=0),0>r&&(r+=i),n=r;i>n;n++)if(this.objectAt(n)===t)return n;return-1},lastIndexOf:function(t,r){var n,i=e(this,"length");for((void 0===r||r>=i)&&(r=i-1),0>r&&(r+=i),n=r;n>=0;n--)if(this.objectAt(n)===t)return n;return-1},addArrayObserver:function(t,r){var n=r&&r.willChange||"arrayWillChange",i=r&&r.didChange||"arrayDidChange",o=e(this,"hasArrayObservers");return o||Ember.propertyWillChange(this,"hasArrayObservers"),Ember.addListener(this,"@array:before",t,n),Ember.addListener(this,"@array:change",t,i),o||Ember.propertyDidChange(this,"hasArrayObservers"),this},removeArrayObserver:function(t,r){var n=r&&r.willChange||"arrayWillChange",i=r&&r.didChange||"arrayDidChange",o=e(this,"hasArrayObservers");return o&&Ember.propertyWillChange(this,"hasArrayObservers"),Ember.removeListener(this,"@array:before",t,n),Ember.removeListener(this,"@array:change",t,i),o&&Ember.propertyDidChange(this,"hasArrayObservers"),this},hasArrayObservers:Ember.computed(function(){return Ember.hasListeners(this,"@array:change")||Ember.hasListeners(this,"@array:before")}),arrayContentWillChange:function(t,r,n){void 0===t?(t=0,r=n=-1):(void 0===r&&(r=-1),void 0===n&&(n=-1)),Ember.isWatching(this,"@each")&&e(this,"@each"),Ember.sendEvent(this,"@array:before",[this,t,r,n]);var i,o;if(t>=0&&r>=0&&e(this,"hasEnumerableObservers")){i=[],o=t+r;for(var a=t;o>a;a++)i.push(this.objectAt(a))}else i=r;return this.enumerableContentWillChange(i,n),this},arrayContentDidChange:function(t,r,i){void 0===t?(t=0,r=i=-1):(void 0===r&&(r=-1),void 0===i&&(i=-1));var o,a;if(t>=0&&i>=0&&e(this,"hasEnumerableObservers")){o=[],a=t+i;for(var s=t;a>s;s++)o.push(this.objectAt(s))}else o=i;this.enumerableContentDidChange(r,o),Ember.sendEvent(this,"@array:change",[this,t,r,i]);var u=e(this,"length"),c=n(this,"firstObject"),l=n(this,"lastObject");return this.objectAt(0)!==c&&(Ember.propertyWillChange(this,"firstObject"),Ember.propertyDidChange(this,"firstObject")),this.objectAt(u-1)!==l&&(Ember.propertyWillChange(this,"lastObject"),Ember.propertyDidChange(this,"lastObject")),this},"@each":Ember.computed(function(){return this.__each||(this.__each=new Ember.EachProxy(this)),this.__each})})}(),function(){function e(e,t){return"@this"===t?e:h(e,t)}function t(e,t,r){this.callbacks=e,this.cp=t,this.instanceMeta=r,this.dependentKeysByGuid={},this.trackedArraysByGuid={},this.suspended=!1,this.changedItems={}}function r(e,t,r){this.dependentArray=e,this.index=t,this.item=e.objectAt(t),this.trackedArray=r,this.beforeObserver=null,this.observer=null,this.destroyed=!1}function n(e,t,r){return 0>e?Math.max(0,t+e):t>e?e:Math.min(t-r,e)}function i(e,t,r){return Math.min(r,t-e)}function o(e,t,r,n,i,o){var a={arrayChanged:e,index:r,item:t,propertyName:n,property:i};return o&&(a.previousValues=o),a}function a(e,t,r,n,i){C(e,function(a,s){i.setValue(t.addedItem.call(this,i.getValue(),a,o(e,a,s,n,r),i.sugarMeta))},this)}function s(e,t){var r;e._callbacks(),e._hasInstanceMeta(this,t)?(r=e._instanceMeta(this,t),r.setValue(e.resetValue(r.getValue()))):r=e._instanceMeta(this,t),e.options.initialize&&e.options.initialize.call(this,r.getValue(),{property:e,propertyName:t},r.sugarMeta)}function u(e,t,r){this.context=e,this.propertyName=t,this.cache=f(e).cache,this.dependentArrays={},this.sugarMeta={},this.initialValue=r}function c(t){var r=this;this.options=t,this._instanceMetas={},this._dependentKeys=null,this._itemPropertyKeys={},this._previousItemPropertyKeys={},this.readOnly(),this.cacheable(),this.recomputeOnce=function(e){Ember.run.once(this,n,e)};var n=function(t){var n=(r._dependentKeys,r._instanceMeta(this,t)),i=r._callbacks();s.call(this,r,t),n.dependentArraysObserver.suspendArrayObservers(function(){C(r._dependentKeys,function(t){var i=e(this,t),o=n.dependentArrays[t];i===o?r._previousItemPropertyKeys[t]&&(delete r._previousItemPropertyKeys[t],n.dependentArraysObserver.setupPropertyObservers(t,r._itemPropertyKeys[t])):(n.dependentArrays[t]=i,o&&n.dependentArraysObserver.teardownObservers(o,t),i&&n.dependentArraysObserver.setupObservers(i,t))},this)},this),C(r._dependentKeys,function(o){var s=e(this,o);s&&a.call(this,s,i,r,t,n)},this)};this.func=function(e){return n.call(this,e),r._instanceMeta(this,e).getValue()}}function l(e){return e}var h=Ember.get,m=(Ember.set,Ember.guidFor),f=Ember.meta,p=Ember.propertyWillChange,d=Ember.propertyDidChange,b=Ember.addBeforeObserver,v=Ember.removeBeforeObserver,E=Ember.addObserver,g=Ember.removeObserver,y=Ember.ComputedProperty,w=[].slice,_=Ember.create,C=Ember.EnumerableUtils.forEach,O=/^(.*)\.@each\.(.*)/,A=/(.*\.@each){2,}/;t.prototype={setValue:function(e){this.instanceMeta.setValue(e,!0)},getValue:function(){return this.instanceMeta.getValue()},setupObservers:function(e,t){this.dependentKeysByGuid[m(e)]=t,e.addArrayObserver(this,{willChange:"dependentArrayWillChange",didChange:"dependentArrayDidChange"}),this.cp._itemPropertyKeys[t]&&this.setupPropertyObservers(t,this.cp._itemPropertyKeys[t])},teardownObservers:function(e,t){var r=this.cp._itemPropertyKeys[t]||[];delete this.dependentKeysByGuid[m(e)],this.teardownPropertyObservers(t,r),e.removeArrayObserver(this,{willChange:"dependentArrayWillChange",didChange:"dependentArrayDidChange"})},suspendArrayObservers:function(e,t){var r=this.suspended;this.suspended=!0,e.call(t),this.suspended=r},setupPropertyObservers:function(t,r){var n=e(this.instanceMeta.context,t),i=e(n,"length"),o=new Array(i);this.resetTransformations(t,o),C(n,function(e,i){var a=this.createPropertyObserverContext(n,i,this.trackedArraysByGuid[t]);o[i]=a,C(r,function(t){b(e,t,this,a.beforeObserver),E(e,t,this,a.observer)},this)},this)},teardownPropertyObservers:function(e,t){var r,n,i,o=this,a=this.trackedArraysByGuid[e];a&&a.apply(function(e,a,s){s!==Ember.TrackedArray.DELETE&&C(e,function(e){e.destroyed=!0,r=e.beforeObserver,n=e.observer,i=e.item,C(t,function(e){v(i,e,o,r),g(i,e,o,n)})})})},createPropertyObserverContext:function(e,t,n){var i=new r(e,t,n);return this.createPropertyObserver(i),i},createPropertyObserver:function(e){var t=this;e.beforeObserver=function(r,n){return t.itemPropertyWillChange(r,n,e.dependentArray,e)},e.observer=function(r,n){return t.itemPropertyDidChange(r,n,e.dependentArray,e)}},resetTransformations:function(e,t){this.trackedArraysByGuid[e]=new Ember.TrackedArray(t)},trackAdd:function(e,t,r){var n=this.trackedArraysByGuid[e];n&&n.addItems(t,r)},trackRemove:function(e,t,r){var n=this.trackedArraysByGuid[e];return n?n.removeItems(t,r):[]},updateIndexes:function(t,r){var n=e(r,"length");t.apply(function(e,t,r){r!==Ember.TrackedArray.DELETE&&(r!==Ember.TrackedArray.RETAIN||e.length!==n||0!==t)&&C(e,function(e,r){e.index=r+t})})},dependentArrayWillChange:function(t,r,a){function s(e){f[h].destroyed=!0,v(c,e,this,f[h].beforeObserver),g(c,e,this,f[h].observer)}if(!this.suspended){var u,c,l,h,f,p=this.callbacks.removedItem,d=m(t),b=this.dependentKeysByGuid[d],E=this.cp._itemPropertyKeys[b]||[],y=e(t,"length"),w=n(r,y,0),_=i(w,y,a);for(f=this.trackRemove(b,w,_),h=_-1;h>=0&&(l=w+h,!(l>=y));--h)c=t.objectAt(l),C(E,s,this),u=o(t,c,l,this.instanceMeta.propertyName,this.cp),this.setValue(p.call(this.instanceMeta.context,this.getValue(),c,u,this.instanceMeta.sugarMeta))}},dependentArrayDidChange:function(t,r,i,a){if(!this.suspended){var s,u,c=this.callbacks.addedItem,l=m(t),h=this.dependentKeysByGuid[l],f=new Array(a),p=this.cp._itemPropertyKeys[h],d=e(t,"length"),v=n(r,d,a);C(t.slice(v,v+a),function(e,r){p&&(u=f[r]=this.createPropertyObserverContext(t,v+r,this.trackedArraysByGuid[h]),C(p,function(t){b(e,t,this,u.beforeObserver),E(e,t,this,u.observer)},this)),s=o(t,e,v+r,this.instanceMeta.propertyName,this.cp),this.setValue(c.call(this.instanceMeta.context,this.getValue(),e,s,this.instanceMeta.sugarMeta))},this),this.trackAdd(h,v,f)}},itemPropertyWillChange:function(t,r,n,i){var o=m(t);this.changedItems[o]||(this.changedItems[o]={array:n,observerContext:i,obj:t,previousValues:{}}),this.changedItems[o].previousValues[r]=e(t,r)},itemPropertyDidChange:function(){this.flushChanges()},flushChanges:function(){var e,t,r,n=this.changedItems;for(e in n)t=n[e],t.observerContext.destroyed||(this.updateIndexes(t.observerContext.trackedArray,t.observerContext.dependentArray),r=o(t.array,t.obj,t.observerContext.index,this.instanceMeta.propertyName,this.cp,t.previousValues),this.setValue(this.callbacks.removedItem.call(this.instanceMeta.context,this.getValue(),t.obj,r,this.instanceMeta.sugarMeta)),this.setValue(this.callbacks.addedItem.call(this.instanceMeta.context,this.getValue(),t.obj,r,this.instanceMeta.sugarMeta)));this.changedItems={}}},u.prototype={getValue:function(){return this.propertyName in this.cache?this.cache[this.propertyName]:this.initialValue},setValue:function(e,t){if(void 0!==e){var r=t&&e!==this.cache[this.propertyName];r&&p(this.context,this.propertyName),this.cache[this.propertyName]=e,r&&d(this.context,this.propertyName)}else delete this.cache[this.propertyName]}},Ember.ReduceComputedProperty=c,c.prototype=_(y.prototype),c.prototype._callbacks=function(){if(!this.callbacks){var e=this.options;this.callbacks={removedItem:e.removedItem||l,addedItem:e.addedItem||l}}return this.callbacks},c.prototype._hasInstanceMeta=function(e,t){var r=m(e),n=r+":"+t;return!!this._instanceMetas[n]},c.prototype._instanceMeta=function(e,r){var n=m(e),i=n+":"+r,o=this._instanceMetas[i];return o||(o=this._instanceMetas[i]=new u(e,r,this.initialValue()),o.dependentArraysObserver=new t(this._callbacks(),this,o,e,r,o.sugarMeta)),o},c.prototype.initialValue=function(){return"function"==typeof this.options.initialValue?this.options.initialValue():this.options.initialValue},c.prototype.resetValue=function(){return this.initialValue()},c.prototype.itemPropertyKey=function(e,t){this._itemPropertyKeys[e]=this._itemPropertyKeys[e]||[],this._itemPropertyKeys[e].push(t)},c.prototype.clearItemPropertyKeys=function(e){this._itemPropertyKeys[e]&&(this._previousItemPropertyKeys[e]=this._itemPropertyKeys[e],this._itemPropertyKeys[e]=[])},c.prototype.property=function(){var e,t,r,n=this,i=(w.call(arguments),new Ember.Set);return C(w.call(arguments),function(o){if(A.test(o))throw new Ember.Error("Nested @each properties not supported: "+o);(e=O.exec(o))?(t=e[1],r=e[2],n.itemPropertyKey(t,r),i.add(t)):i.add(o)}),y.prototype.property.apply(this,i.toArray())},Ember.reduceComputed=function(e){var t;if(arguments.length>1&&(t=w.call(arguments,0,-1),e=w.call(arguments,-1)[0]),"object"!=typeof e)throw new Ember.Error("Reduce Computed Property declared without an options hash");if(!("initialValue"in e))throw new Ember.Error("Reduce Computed Property declared without an initial value");var r=new c(e);return t&&r.property.apply(r,t),r}}(),function(){function e(){var e=this;return t.apply(this,arguments),this.func=function(t){return function(r){return e._hasInstanceMeta(this,r)||i(e._dependentKeys,function(t){Ember.addObserver(this,t,function(){e.recomputeOnce.call(this,r)})},this),t.apply(this,arguments)}}(this.func),this}var t=Ember.ReduceComputedProperty,r=[].slice,n=Ember.create,i=Ember.EnumerableUtils.forEach;Ember.ArrayComputedProperty=e,e.prototype=n(t.prototype),e.prototype.initialValue=function(){return Ember.A()},e.prototype.resetValue=function(e){return e.clear(),e},Ember.arrayComputed=function(t){var n;if(arguments.length>1&&(n=r.call(arguments,0,-1),t=r.call(arguments,-1)[0]),"object"!=typeof t)throw new Ember.Error("Array Computed Property declared without an options hash");var i=new e(t);return n&&i.property.apply(i,n),i}}(),function(){function e(e,i,o,a){function s(e){return t.detectInstance(e)?n(r(e,"content")):n(e)}var u,c,l,h,m;return arguments.length<4&&(a=r(e,"length")),arguments.length<3&&(o=0),o===a?o:(u=o+Math.floor((a-o)/2),c=e.objectAt(u),h=s(c),m=s(i),h===m?u:(l=this.order(c,i),0===l&&(l=m>h?-1:1),0>l?this.binarySearch(e,i,u+1,a):l>0?this.binarySearch(e,i,o,u):u))}var t,r=Ember.get,n=(Ember.set,Ember.guidFor),i=Ember.merge,o=[].slice,a=Ember.EnumerableUtils.forEach,s=Ember.EnumerableUtils.map;Ember.computed.max=function(e){return Ember.reduceComputed.call(null,e,{initialValue:-1/0,addedItem:function(e,t){return Math.max(e,t)},removedItem:function(e,t){return e>t?e:void 0}})},Ember.computed.min=function(e){return Ember.reduceComputed.call(null,e,{initialValue:1/0,addedItem:function(e,t){return Math.min(e,t)},removedItem:function(e,t){return t>e?e:void 0}})},Ember.computed.map=function(e,t){var r={addedItem:function(e,r,n){var i=t.call(this,r);return e.insertAt(n.index,i),e},removedItem:function(e,t,r){return e.removeAt(r.index,1),e}};return Ember.arrayComputed(e,r)},Ember.computed.mapBy=function(e,t){var n=function(e){return r(e,t)};return Ember.computed.map(e+".@each."+t,n)},Ember.computed.mapProperty=Ember.computed.mapBy,Ember.computed.filter=function(e,t){var r={initialize:function(e,t,r){r.filteredArrayIndexes=new Ember.SubArray},addedItem:function(e,r,n,i){var o=!!t.call(this,r),a=i.filteredArrayIndexes.addItem(n.index,o);return o&&e.insertAt(a,r),e},removedItem:function(e,t,r,n){var i=n.filteredArrayIndexes.removeItem(r.index);return i>-1&&e.removeAt(i),e}};return Ember.arrayComputed(e,r)},Ember.computed.filterBy=function(e,t,n){var i;return i=2===arguments.length?function(e){return r(e,t)}:function(e){return r(e,t)===n},Ember.computed.filter(e+".@each."+t,i)},Ember.computed.filterProperty=Ember.computed.filterBy,Ember.computed.uniq=function(){var e=o.call(arguments);return e.push({initialize:function(e,t,r){r.itemCounts={}},addedItem:function(e,t,r,i){var o=n(t);return i.itemCounts[o]?++i.itemCounts[o]:i.itemCounts[o]=1,e.addObject(t),e},removedItem:function(e,t,r,i){var o=n(t),a=i.itemCounts;return 0===--a[o]&&e.removeObject(t),e}}),Ember.arrayComputed.apply(null,e)},Ember.computed.union=Ember.computed.uniq,Ember.computed.intersect=function(){var e=function(e){return s(e.property._dependentKeys,function(e){return n(e)})},t=o.call(arguments);return t.push({initialize:function(e,t,r){r.itemCounts={}},addedItem:function(t,r,i,o){var a=n(r),s=(e(i),n(i.arrayChanged)),u=i.property._dependentKeys.length,c=o.itemCounts;return c[a]||(c[a]={}),void 0===c[a][s]&&(c[a][s]=0),1===++c[a][s]&&u===Ember.keys(c[a]).length&&t.addObject(r),t},removedItem:function(t,r,i,o){var a,s=n(r),u=(e(i),n(i.arrayChanged)),c=(i.property._dependentKeys.length,o.itemCounts);return void 0===c[s][u]&&(c[s][u]=0),0===--c[s][u]&&(delete c[s][u],a=Ember.keys(c[s]).length,0===a&&delete c[s],t.removeObject(r)),t}}),Ember.arrayComputed.apply(null,t)},Ember.computed.setDiff=function(e,t){if(2!==arguments.length)throw new Ember.Error("setDiff requires exactly two dependent arrays.");return Ember.arrayComputed.call(null,e,t,{addedItem:function(n,i,o){var a=r(this,e),s=r(this,t);return o.arrayChanged===a?s.contains(i)||n.addObject(i):n.removeObject(i),n},removedItem:function(n,i,o){var a=r(this,e),s=r(this,t);return o.arrayChanged===s?a.contains(i)&&n.addObject(i):n.removeObject(i),n}})},t=Ember.ObjectProxy.extend(),Ember.computed.sort=function(n,o){var s,u;return"function"==typeof o?s=function(t,r,n){n.order=o,n.binarySearch=e}:(u=o,s=function(t,i,o){function s(){var e,t,s,l=r(this,u),h=o.sortProperties=[],m=o.sortPropertyAscending={};i.property.clearItemPropertyKeys(n),a(l,function(r){-1!==(t=r.indexOf(":"))?(e=r.substring(0,t),s="desc"!==r.substring(t+1).toLowerCase()):(e=r,s=!0),h.push(e),m[e]=s,i.property.itemPropertyKey(n,e)}),l.addObserver("@each",this,c)}function c(){Ember.run.once(this,l,i.propertyName)}function l(e){s.call(this),i.property.recomputeOnce.call(this,e)}Ember.addObserver(this,u,c),s.call(this),o.order=function(e,t){for(var n,i,o,a=0;a<this.sortProperties.length;++a)if(n=this.sortProperties[a],i=Ember.compare(r(e,n),r(t,n)),0!==i)return o=this.sortPropertyAscending[n],o?i:-1*i;return 0},o.binarySearch=e}),Ember.arrayComputed.call(null,n,{initialize:s,addedItem:function(e,t,r,n){var i=n.binarySearch(e,t);return e.insertAt(i,t),e},removedItem:function(e,r,n,o){var a,s,u;return n.previousValues?(a=i({content:r},n.previousValues),u=t.create(a)):u=r,s=o.binarySearch(e,u),e.removeAt(s),e}})}}(),function(){Ember.RSVP=t("rsvp")}(),function(){var e=Array.prototype.slice;(Ember.EXTEND_PROTOTYPES===!0||Ember.EXTEND_PROTOTYPES.Function)&&(Function.prototype.property=function(){var e=Ember.computed(this);return e.property.apply(e,arguments)},Function.prototype.observes=function(){return this.__ember_observes__=e.call(arguments),this},Function.prototype.observesImmediately=function(){for(var e=0,t=arguments.length;t>e;e++)arguments[e];return this.observes.apply(this,arguments)},Function.prototype.observesBefore=function(){return this.__ember_observesBefore__=e.call(arguments),this},Function.prototype.on=function(){var t=e.call(arguments);return this.__ember_listens__=t,this})}(),function(){Ember.Comparable=Ember.Mixin.create({compare:Ember.required(Function)})}(),function(){var e=Ember.get;Ember.set,Ember.Copyable=Ember.Mixin.create({copy:Ember.required(Function),frozenCopy:function(){if(Ember.Freezable&&Ember.Freezable.detect(this))return e(this,"isFrozen")?this:this.copy().freeze();throw new Ember.Error(Ember.String.fmt("%@ does not support freezing",[this]))}})}(),function(){var e=Ember.get,t=Ember.set;Ember.Freezable=Ember.Mixin.create({isFrozen:!1,freeze:function(){return e(this,"isFrozen")?this:(t(this,"isFrozen",!0),this)}}),Ember.FROZEN_ERROR="Frozen object cannot be modified."}(),function(){var e=Ember.EnumerableUtils.forEach;Ember.MutableEnumerable=Ember.Mixin.create(Ember.Enumerable,{addObject:Ember.required(Function),addObjects:function(t){return Ember.beginPropertyChanges(this),e(t,function(e){this.addObject(e)},this),Ember.endPropertyChanges(this),this},removeObject:Ember.required(Function),removeObjects:function(t){return Ember.beginPropertyChanges(this),e(t,function(e){this.removeObject(e)},this),Ember.endPropertyChanges(this),this}})}(),function(){var e="Index out of range",t=[],r=Ember.get;Ember.set,Ember.MutableArray=Ember.Mixin.create(Ember.Array,Ember.MutableEnumerable,{replace:Ember.required(),clear:function(){var e=r(this,"length");return 0===e?this:(this.replace(0,e,t),this)},insertAt:function(t,n){if(t>r(this,"length"))throw new Ember.Error(e);return this.replace(t,0,[n]),this},removeAt:function(n,i){if("number"==typeof n){if(0>n||n>=r(this,"length"))throw new Ember.Error(e);void 0===i&&(i=1),this.replace(n,i,t)}return this},pushObject:function(e){return this.insertAt(r(this,"length"),e),e},pushObjects:function(e){if(!Ember.Enumerable.detect(e)&&!Ember.isArray(e))throw new TypeError("Must pass Ember.Enumerable to Ember.MutableArray#pushObjects");return this.replace(r(this,"length"),0,e),this},popObject:function(){var e=r(this,"length");if(0===e)return null;var t=this.objectAt(e-1);return this.removeAt(e-1,1),t},shiftObject:function(){if(0===r(this,"length"))return null;var e=this.objectAt(0);return this.removeAt(0),e},unshiftObject:function(e){return this.insertAt(0,e),e},unshiftObjects:function(e){return this.replace(0,0,e),this},reverseObjects:function(){var e=r(this,"length");if(0===e)return this;var t=this.toArray().reverse();return this.replace(0,e,t),this},setObjects:function(e){if(0===e.length)return this.clear();var t=r(this,"length");return this.replace(0,t,e),this},removeObject:function(e){for(var t=r(this,"length")||0;--t>=0;){var n=this.objectAt(t);n===e&&this.removeAt(t)}return this},addObject:function(e){return this.contains(e)||this.pushObject(e),this}})}(),function(){var e=Ember.get;Ember.set,Ember.TargetActionSupport=Ember.Mixin.create({target:null,action:null,actionContext:null,targetObject:Ember.computed(function(){var t=e(this,"target");if("string"===Ember.typeOf(t)){var r=e(this,t);return void 0===r&&(r=e(Ember.lookup,t)),r}return t}).property("target"),actionContextObject:Ember.computed(function(){var t=e(this,"actionContext");
if("string"===Ember.typeOf(t)){var r=e(this,t);return void 0===r&&(r=e(Ember.lookup,t)),r}return t}).property("actionContext"),triggerAction:function(t){function r(e,t){var r=[];return t&&r.push(t),r.concat(e)}t=t||{};var n=t.action||e(this,"action"),i=t.target||e(this,"targetObject"),o=t.actionContext;if("undefined"==typeof o&&(o=e(this,"actionContextObject")||this),i&&n){var a;return a=i.send?i.send.apply(i,r(o,n)):i[n].apply(i,r(o)),a!==!1&&(a=!0),a}return!1}})}(),function(){Ember.Evented=Ember.Mixin.create({on:function(e,t,r){return Ember.addListener(this,e,t,r),this},one:function(e,t,r){return r||(r=t,t=null),Ember.addListener(this,e,t,r,!0),this},trigger:function(e){var t,r,n=[];for(t=1,r=arguments.length;r>t;t++)n.push(arguments[t]);Ember.sendEvent(this,e,n)},off:function(e,t,r){return Ember.removeListener(this,e,t,r),this},has:function(e){return Ember.hasListeners(this,e)}})}(),function(){var e=t("rsvp");e.configure("async",function(e,t){Ember.run.schedule("actions",t,e,t)});var r=Ember.get;Ember.DeferredMixin=Ember.Mixin.create({then:function(e,t){function n(t){return t===o?e(a):e(t)}var i,o,a;return a=this,i=r(this,"_deferred"),o=i.promise,o.then(e&&n,t)},resolve:function(e){var t,n;t=r(this,"_deferred"),n=t.promise,e===this?t.resolve(n):t.resolve(e)},reject:function(e){r(this,"_deferred").reject(e)},_deferred:Ember.computed(function(){return e.defer()})})}(),function(){var e=Ember.get,t=Ember.typeOf;Ember.ActionHandler=Ember.Mixin.create({mergedProperties:["_actions"],willMergeMixin:function(e){var r;e._actions||("object"===t(e.actions)?r="actions":"object"===t(e.events)&&(r="events"),r&&(e._actions=Ember.merge(e._actions||{},e[r])),delete e[r])},send:function(t){var r,n=[].slice.call(arguments,1);if(this._actions&&this._actions[t]){if(this._actions[t].apply(this,n)!==!0)return}else if(this.deprecatedSend&&this.deprecatedSendHandles&&this.deprecatedSendHandles(t)&&this.deprecatedSend.apply(this,[].slice.call(arguments))!==!0)return;(r=e(this,"target"))&&r.send.apply(r,arguments)}})}(),function(){function e(e,r){r.then(function(r){t(e,"isFulfilled",!0),t(e,"content",r)},function(r){t(e,"isRejected",!0),t(e,"reason",r)})}var t=Ember.set,r=Ember.get,n=Ember.RSVP.resolve,i=(Ember.RSVP.rethrow,Ember.computed.not),o=Ember.computed.or;Ember.PromiseProxyMixin=Ember.Mixin.create({reason:null,isPending:i("isSettled").readOnly(),isSettled:o("isRejected","isFulfilled").readOnly(),isRejected:!1,isFulfilled:!1,promise:Ember.computed(function(t,r){if(2===arguments.length)return r=n(r),e(this,r),r.then();throw new Ember.Error("PromiseProxy's promise must be set")}),then:function(e,t){return r(this,"promise").then(e,t)}})}(),function(){function e(e,t,r){this.type=e,this.count=t,this.items=r}function t(e,t,r,n){this.operation=e,this.index=t,this.split=r,this.rangeStart=n}var r=Ember.get,n=Ember.EnumerableUtils.forEach,i="r",o="i",a="d";Ember.TrackedArray=function(t){arguments.length<1&&(t=[]);var n=r(t,"length");this._operations=n?[new e(i,n,t)]:[]},Ember.TrackedArray.RETAIN=i,Ember.TrackedArray.INSERT=o,Ember.TrackedArray.DELETE=a,Ember.TrackedArray.prototype={addItems:function(t,n){var i=r(n,"length");if(!(1>i)){var a,s,u=this._findArrayOperation(t),c=u.operation,l=u.index,h=u.rangeStart;s=new e(o,i,n),c?u.split?(this._split(l,t-h,s),a=l+1):(this._operations.splice(l,0,s),a=l):(this._operations.push(s),a=l),this._composeInsert(a)}},removeItems:function(t,r){if(!(1>r)){var n,i,o=this._findArrayOperation(t),s=(o.operation,o.index),u=o.rangeStart;return n=new e(a,r),o.split?(this._split(s,t-u,n),i=s+1):(this._operations.splice(s,0,n),i=s),this._composeDelete(i)}},apply:function(t){var r=[],o=0;n(this._operations,function(e){t(e.items,o,e.type),e.type!==a&&(o+=e.count,r=r.concat(e.items))}),this._operations=[new e(i,r.length,r)]},_findArrayOperation:function(e){var r,n,i,o,s,u=!1;for(r=o=0,n=this._operations.length;n>r;++r)if(i=this._operations[r],i.type!==a){if(s=o+i.count-1,e===o)break;if(e>o&&s>=e){u=!0;break}o=s+1}return new t(i,r,u,o)},_split:function(t,r,n){var i=this._operations[t],o=i.items.slice(r),a=new e(i.type,o.length,o);i.count=r,i.items=i.items.slice(0,r),this._operations.splice(t+1,0,n,a)},_composeInsert:function(e){var t=this._operations[e],r=this._operations[e-1],n=this._operations[e+1],i=r&&r.type,a=n&&n.type;i===o?(r.count+=t.count,r.items=r.items.concat(t.items),a===o?(r.count+=n.count,r.items=r.items.concat(n.items),this._operations.splice(e,2)):this._operations.splice(e,1)):a===o&&(t.count+=n.count,t.items=t.items.concat(n.items),this._operations.splice(e+1,1))},_composeDelete:function(e){var t,r,n,i=this._operations[e],s=i.count,u=this._operations[e-1],c=u&&u.type,l=!1,h=[];c===a&&(i=u,e-=1);for(var m=e+1;s>0;++m)t=this._operations[m],r=t.type,n=t.count,r!==a?(n>s?(h=h.concat(t.items.splice(0,s)),t.count-=s,m-=1,n=s,s=0):(n===s&&(l=!0),h=h.concat(t.items),s-=n),r===o&&(i.count-=n)):i.count+=n;return i.count>0?this._operations.splice(e+1,m-1-e):this._operations.splice(e,l?2:1),h},toString:function(){var e="";return n(this._operations,function(t){e+=" "+t.type+":"+t.count}),e.substring(1)}}}(),function(){function e(e,t){this.type=e,this.count=t}var t=(Ember.get,Ember.EnumerableUtils.forEach),r="r",n="f";Ember.SubArray=function(t){arguments.length<1&&(t=0),this._operations=t>0?[new e(r,t)]:[]},Ember.SubArray.prototype={addItem:function(t,i){var o=-1,a=i?r:n,s=this;return this._findOperation(t,function(n,u,c,l,h){var m,f;a===n.type?++n.count:t===c?s._operations.splice(u,0,new e(a,1)):(m=new e(a,1),f=new e(n.type,l-t+1),n.count=t-c,s._operations.splice(u+1,0,m,f)),i&&(o=n.type===r?h+(t-c):h),s._composeAt(u)},function(t){s._operations.push(new e(a,1)),i&&(o=t),s._composeAt(s._operations.length-1)}),o},removeItem:function(e){var t=-1,n=this;return this._findOperation(e,function(i,o,a,s,u){i.type===r&&(t=u+(e-a)),i.count>1?--i.count:(n._operations.splice(o,1),n._composeAt(o))},function(){throw new Ember.Error("Can't remove an item that has never been added.")}),t},_findOperation:function(e,t,n){var i,o,a,s,u,c=0;for(i=s=0,o=this._operations.length;o>i;s=u+1,++i){if(a=this._operations[i],u=s+a.count-1,e>=s&&u>=e)return t(a,i,s,u,c),void 0;a.type===r&&(c+=a.count)}n(c)},_composeAt:function(e){var t,r=this._operations[e];r&&(e>0&&(t=this._operations[e-1],t.type===r.type&&(r.count+=t.count,this._operations.splice(e-1,1),--e)),e<this._operations.length-1&&(t=this._operations[e+1],t.type===r.type&&(r.count+=t.count,this._operations.splice(e+1,1))))},toString:function(){var e="";return t(this._operations,function(t){e+=" "+t.type+":"+t.count}),e.substring(1)}}}(),function(){Ember.Container=t("container"),Ember.Container.set=Ember.set}(),function(){Ember.Application=Ember.Namespace.extend()}(),function(){var e="Index out of range",t=[],r=Ember.get;Ember.set,Ember.ArrayProxy=Ember.Object.extend(Ember.MutableArray,{content:null,arrangedContent:Ember.computed.alias("content"),objectAtContent:function(e){return r(this,"arrangedContent").objectAt(e)},replaceContent:function(e,t,n){r(this,"content").replace(e,t,n)},_contentWillChange:Ember.beforeObserver("content",function(){this._teardownContent()}),_teardownContent:function(){var e=r(this,"content");e&&e.removeArrayObserver(this,{willChange:"contentArrayWillChange",didChange:"contentArrayDidChange"})},contentArrayWillChange:Ember.K,contentArrayDidChange:Ember.K,_contentDidChange:Ember.observer("content",function(){r(this,"content"),this._setupContent()}),_setupContent:function(){var e=r(this,"content");e&&e.addArrayObserver(this,{willChange:"contentArrayWillChange",didChange:"contentArrayDidChange"})},_arrangedContentWillChange:Ember.beforeObserver("arrangedContent",function(){var e=r(this,"arrangedContent"),t=e?r(e,"length"):0;this.arrangedContentArrayWillChange(this,0,t,void 0),this.arrangedContentWillChange(this),this._teardownArrangedContent(e)}),_arrangedContentDidChange:Ember.observer("arrangedContent",function(){var e=r(this,"arrangedContent"),t=e?r(e,"length"):0;this._setupArrangedContent(),this.arrangedContentDidChange(this),this.arrangedContentArrayDidChange(this,0,void 0,t)}),_setupArrangedContent:function(){var e=r(this,"arrangedContent");e&&e.addArrayObserver(this,{willChange:"arrangedContentArrayWillChange",didChange:"arrangedContentArrayDidChange"})},_teardownArrangedContent:function(){var e=r(this,"arrangedContent");e&&e.removeArrayObserver(this,{willChange:"arrangedContentArrayWillChange",didChange:"arrangedContentArrayDidChange"})},arrangedContentWillChange:Ember.K,arrangedContentDidChange:Ember.K,objectAt:function(e){return r(this,"content")&&this.objectAtContent(e)},length:Ember.computed(function(){var e=r(this,"arrangedContent");return e?r(e,"length"):0}),_replace:function(e,t,n){var i=r(this,"content");return i&&this.replaceContent(e,t,n),this},replace:function(){if(r(this,"arrangedContent")!==r(this,"content"))throw new Ember.Error("Using replace on an arranged ArrayProxy is not allowed.");this._replace.apply(this,arguments)},_insertAt:function(t,n){if(t>r(this,"content.length"))throw new Ember.Error(e);return this._replace(t,0,[n]),this},insertAt:function(e,t){if(r(this,"arrangedContent")===r(this,"content"))return this._insertAt(e,t);throw new Ember.Error("Using insertAt on an arranged ArrayProxy is not allowed.")},removeAt:function(n,i){if("number"==typeof n){var o,a=r(this,"content"),s=r(this,"arrangedContent"),u=[];if(0>n||n>=r(this,"length"))throw new Ember.Error(e);for(void 0===i&&(i=1),o=n;n+i>o;o++)u.push(a.indexOf(s.objectAt(o)));for(u.sort(function(e,t){return t-e}),Ember.beginPropertyChanges(),o=0;o<u.length;o++)this._replace(u[o],1,t);Ember.endPropertyChanges()}return this},pushObject:function(e){return this._insertAt(r(this,"content.length"),e),e},pushObjects:function(e){if(!Ember.Enumerable.detect(e)&&!Ember.isArray(e))throw new TypeError("Must pass Ember.Enumerable to Ember.MutableArray#pushObjects");return this._replace(r(this,"length"),0,e),this},setObjects:function(e){if(0===e.length)return this.clear();var t=r(this,"length");return this._replace(0,t,e),this},unshiftObject:function(e){return this._insertAt(0,e),e},unshiftObjects:function(e){return this._replace(0,0,e),this},slice:function(){var e=this.toArray();return e.slice.apply(e,arguments)},arrangedContentArrayWillChange:function(e,t,r,n){this.arrayContentWillChange(t,r,n)},arrangedContentArrayDidChange:function(e,t,r,n){this.arrayContentDidChange(t,r,n)},init:function(){this._super(),this._setupContent(),this._setupArrangedContent()},willDestroy:function(){this._teardownArrangedContent(),this._teardownContent()}})}(),function(){function e(e,t,r,i,o){var a,s=r._objects;for(s||(s=r._objects={});--o>=i;){var u=e.objectAt(o);u&&(Ember.addBeforeObserver(u,t,r,"contentKeyWillChange"),Ember.addObserver(u,t,r,"contentKeyDidChange"),a=n(u),s[a]||(s[a]=[]),s[a].push(o))}}function t(e,t,r,i,a){var s=r._objects;s||(s=r._objects={});for(var u,c;--a>=i;){var l=e.objectAt(a);l&&(Ember.removeBeforeObserver(l,t,r,"contentKeyWillChange"),Ember.removeObserver(l,t,r,"contentKeyDidChange"),c=n(l),u=s[c],u[o.call(u,a)]=null)}}var r=(Ember.set,Ember.get),n=Ember.guidFor,i=Ember.EnumerableUtils.forEach,o=Ember.ArrayPolyfills.indexOf,a=Ember.Object.extend(Ember.Array,{init:function(e,t,r){this._super(),this._keyName=t,this._owner=r,this._content=e},objectAt:function(e){var t=this._content.objectAt(e);return t&&r(t,this._keyName)},length:Ember.computed(function(){var e=this._content;return e?r(e,"length"):0})}),s=/^.+:(before|change)$/;Ember.EachProxy=Ember.Object.extend({init:function(e){this._super(),this._content=e,e.addArrayObserver(this),i(Ember.watchedEvents(this),function(e){this.didAddListener(e)},this)},unknownProperty:function(e){var t;return t=new a(this._content,e,this),Ember.defineProperty(this,e,null,t),this.beginObservingContentKey(e),t},arrayWillChange:function(e,r,n){var i,o,a=this._keys;o=n>0?r+n:-1,Ember.beginPropertyChanges(this);for(i in a)a.hasOwnProperty(i)&&(o>0&&t(e,i,this,r,o),Ember.propertyWillChange(this,i));Ember.propertyWillChange(this._content,"@each"),Ember.endPropertyChanges(this)},arrayDidChange:function(t,r,n,i){var o,a=this._keys;o=i>0?r+i:-1,Ember.changeProperties(function(){for(var n in a)a.hasOwnProperty(n)&&(o>0&&e(t,n,this,r,o),Ember.propertyDidChange(this,n));Ember.propertyDidChange(this._content,"@each")},this)},didAddListener:function(e){s.test(e)&&this.beginObservingContentKey(e.slice(0,-7))},didRemoveListener:function(e){s.test(e)&&this.stopObservingContentKey(e.slice(0,-7))},beginObservingContentKey:function(t){var n=this._keys;if(n||(n=this._keys={}),n[t])n[t]++;else{n[t]=1;var i=this._content,o=r(i,"length");e(i,t,this,0,o)}},stopObservingContentKey:function(e){var n=this._keys;if(n&&n[e]>0&&--n[e]<=0){var i=this._content,o=r(i,"length");t(i,e,this,0,o)}},contentKeyWillChange:function(e,t){Ember.propertyWillChange(this,t)},contentKeyDidChange:function(e,t){Ember.propertyDidChange(this,t)}})}(),function(){var e=Ember.get,t=(Ember.set,Ember.EnumerableUtils._replace),r=Ember.Mixin.create(Ember.MutableArray,Ember.Observable,Ember.Copyable,{get:function(e){return"length"===e?this.length:"number"==typeof e?this[e]:this._super(e)},objectAt:function(e){return this[e]},replace:function(r,n,i){if(this.isFrozen)throw Ember.FROZEN_ERROR;var o=i?e(i,"length"):0;return this.arrayContentWillChange(r,n,o),0===o?this.splice(r,n):t(this,r,n,i),this.arrayContentDidChange(r,n,o),this},unknownProperty:function(e,t){var r;return void 0!==t&&void 0===r&&(r=this[e]=t),r},indexOf:function(e,t){var r,n=this.length;for(t=void 0===t?0:0>t?Math.ceil(t):Math.floor(t),0>t&&(t+=n),r=t;n>r;r++)if(this[r]===e)return r;return-1},lastIndexOf:function(e,t){var r,n=this.length;for(t=void 0===t?n-1:0>t?Math.ceil(t):Math.floor(t),0>t&&(t+=n),r=t;r>=0;r--)if(this[r]===e)return r;return-1},copy:function(e){return e?this.map(function(e){return Ember.copy(e,!0)}):this.slice()}}),n=["length"];Ember.EnumerableUtils.forEach(r.keys(),function(e){Array.prototype[e]&&n.push(e)}),n.length>0&&(r=r.without.apply(r,n)),Ember.NativeArray=r,Ember.A=function(e){return void 0===e&&(e=[]),Ember.Array.detect(e)?e:Ember.NativeArray.apply(e)},Ember.NativeArray.activate=function(){r.apply(Array.prototype),Ember.A=function(e){return e||[]}},(Ember.EXTEND_PROTOTYPES===!0||Ember.EXTEND_PROTOTYPES.Array)&&Ember.NativeArray.activate()}(),function(){var e=Ember.get,t=Ember.set,r=Ember.guidFor,n=Ember.isNone,i=Ember.String.fmt;Ember.Set=Ember.CoreObject.extend(Ember.MutableEnumerable,Ember.Copyable,Ember.Freezable,{length:0,clear:function(){if(this.isFrozen)throw new Ember.Error(Ember.FROZEN_ERROR);var n=e(this,"length");if(0===n)return this;var i;this.enumerableContentWillChange(n,0),Ember.propertyWillChange(this,"firstObject"),Ember.propertyWillChange(this,"lastObject");for(var o=0;n>o;o++)i=r(this[o]),delete this[i],delete this[o];return t(this,"length",0),Ember.propertyDidChange(this,"firstObject"),Ember.propertyDidChange(this,"lastObject"),this.enumerableContentDidChange(n,0),this},isEqual:function(t){if(!Ember.Enumerable.detect(t))return!1;var r=e(this,"length");if(e(t,"length")!==r)return!1;for(;--r>=0;)if(!t.contains(this[r]))return!1;return!0},add:Ember.aliasMethod("addObject"),remove:Ember.aliasMethod("removeObject"),pop:function(){if(e(this,"isFrozen"))throw new Ember.Error(Ember.FROZEN_ERROR);var t=this.length>0?this[this.length-1]:null;return this.remove(t),t},push:Ember.aliasMethod("addObject"),shift:Ember.aliasMethod("pop"),unshift:Ember.aliasMethod("push"),addEach:Ember.aliasMethod("addObjects"),removeEach:Ember.aliasMethod("removeObjects"),init:function(e){this._super(),e&&this.addObjects(e)},nextObject:function(e){return this[e]},firstObject:Ember.computed(function(){return this.length>0?this[0]:void 0}),lastObject:Ember.computed(function(){return this.length>0?this[this.length-1]:void 0}),addObject:function(i){if(e(this,"isFrozen"))throw new Ember.Error(Ember.FROZEN_ERROR);if(n(i))return this;var o,a=r(i),s=this[a],u=e(this,"length");return s>=0&&u>s&&this[s]===i?this:(o=[i],this.enumerableContentWillChange(null,o),Ember.propertyWillChange(this,"lastObject"),u=e(this,"length"),this[a]=u,this[u]=i,t(this,"length",u+1),Ember.propertyDidChange(this,"lastObject"),this.enumerableContentDidChange(null,o),this)},removeObject:function(i){if(e(this,"isFrozen"))throw new Ember.Error(Ember.FROZEN_ERROR);if(n(i))return this;var o,a,s=r(i),u=this[s],c=e(this,"length"),l=0===u,h=u===c-1;return u>=0&&c>u&&this[u]===i&&(a=[i],this.enumerableContentWillChange(a,null),l&&Ember.propertyWillChange(this,"firstObject"),h&&Ember.propertyWillChange(this,"lastObject"),c-1>u&&(o=this[c-1],this[u]=o,this[r(o)]=u),delete this[s],delete this[c-1],t(this,"length",c-1),l&&Ember.propertyDidChange(this,"firstObject"),h&&Ember.propertyDidChange(this,"lastObject"),this.enumerableContentDidChange(a,null)),this},contains:function(e){return this[r(e)]>=0},copy:function(){var n=this.constructor,i=new n,o=e(this,"length");for(t(i,"length",o);--o>=0;)i[o]=this[o],i[r(this[o])]=o;return i},toString:function(){var e,t=this.length,r=[];for(e=0;t>e;e++)r[e]=this[e];return i("Ember.Set<%@>",[r.join(",")])}})}(),function(){var e=Ember.DeferredMixin;Ember.get;var t=Ember.Object.extend(e);t.reopenClass({promise:function(e,r){var n=t.create();return e.call(r,n),n}}),Ember.Deferred=t}(),function(){var e=Ember.ArrayPolyfills.forEach,t=Ember.ENV.EMBER_LOAD_HOOKS||{},r={};Ember.onLoad=function(e,n){var i;t[e]=t[e]||Ember.A(),t[e].pushObject(n),(i=r[e])&&n(i)},Ember.runLoadHooks=function(n,i){r[n]=i,t[n]&&e.call(t[n],function(e){e(i)})}}(),function(){Ember.get,Ember.ControllerMixin=Ember.Mixin.create(Ember.ActionHandler,{isController:!0,target:null,container:null,parentController:null,store:null,model:Ember.computed.alias("content"),deprecatedSendHandles:function(e){return!!this[e]},deprecatedSend:function(e){var t=[].slice.call(arguments,1);this[e].apply(this,t)}}),Ember.Controller=Ember.Object.extend(Ember.ControllerMixin)}(),function(){var e=Ember.get,t=(Ember.set,Ember.EnumerableUtils.forEach);Ember.SortableMixin=Ember.Mixin.create(Ember.MutableEnumerable,{sortProperties:null,sortAscending:!0,sortFunction:Ember.compare,orderBy:function(r,n){var i=0,o=e(this,"sortProperties"),a=e(this,"sortAscending"),s=e(this,"sortFunction");return t(o,function(t){0===i&&(i=s(e(r,t),e(n,t)),0===i||a||(i=-1*i))}),i},destroy:function(){var r=e(this,"content"),n=e(this,"sortProperties");return r&&n&&t(r,function(e){t(n,function(t){Ember.removeObserver(e,t,this,"contentItemSortPropertyDidChange")},this)},this),this._super()},isSorted:Ember.computed.bool("sortProperties"),arrangedContent:Ember.computed("content","sortProperties.@each",function(){var r=e(this,"content"),n=e(this,"isSorted"),i=e(this,"sortProperties"),o=this;return r&&n?(r=r.slice(),r.sort(function(e,t){return o.orderBy(e,t)}),t(r,function(e){t(i,function(t){Ember.addObserver(e,t,this,"contentItemSortPropertyDidChange")},this)},this),Ember.A(r)):r}),_contentWillChange:Ember.beforeObserver("content",function(){var r=e(this,"content"),n=e(this,"sortProperties");r&&n&&t(r,function(e){t(n,function(t){Ember.removeObserver(e,t,this,"contentItemSortPropertyDidChange")},this)},this),this._super()}),sortAscendingWillChange:Ember.beforeObserver("sortAscending",function(){this._lastSortAscending=e(this,"sortAscending")}),sortAscendingDidChange:Ember.observer("sortAscending",function(){if(e(this,"sortAscending")!==this._lastSortAscending){var t=e(this,"arrangedContent");t.reverseObjects()}}),contentArrayWillChange:function(r,n,i,o){var a=e(this,"isSorted");if(a){var s=e(this,"arrangedContent"),u=r.slice(n,n+i),c=e(this,"sortProperties");t(u,function(e){s.removeObject(e),t(c,function(t){Ember.removeObserver(e,t,this,"contentItemSortPropertyDidChange")},this)},this)}return this._super(r,n,i,o)},contentArrayDidChange:function(r,n,i,o){var a=e(this,"isSorted"),s=e(this,"sortProperties");if(a){var u=r.slice(n,n+o);t(u,function(e){this.insertItemSorted(e),t(s,function(t){Ember.addObserver(e,t,this,"contentItemSortPropertyDidChange")},this)},this)}return this._super(r,n,i,o)},insertItemSorted:function(t){var r=e(this,"arrangedContent"),n=e(r,"length"),i=this._binarySearch(t,0,n);r.insertAt(i,t)},contentItemSortPropertyDidChange:function(t){var r=e(this,"arrangedContent"),n=r.indexOf(t),i=r.objectAt(n-1),o=r.objectAt(n+1),a=i&&this.orderBy(t,i),s=o&&this.orderBy(t,o);(0>a||s>0)&&(r.removeObject(t),this.insertItemSorted(t))},_binarySearch:function(t,r,n){var i,o,a,s;return r===n?r:(s=e(this,"arrangedContent"),i=r+Math.floor((n-r)/2),o=s.objectAt(i),a=this.orderBy(o,t),0>a?this._binarySearch(t,i+1,n):a>0?this._binarySearch(t,r,i):i)}})}(),function(){var e=Ember.get,t=(Ember.set,Ember.EnumerableUtils.forEach),r=Ember.EnumerableUtils.replace;Ember.ArrayController=Ember.ArrayProxy.extend(Ember.ControllerMixin,Ember.SortableMixin,{itemController:null,lookupItemController:function(){return e(this,"itemController")},objectAtContent:function(t){var r=e(this,"length"),n=e(this,"arrangedContent"),i=n&&n.objectAt(t);if(t>=0&&r>t){var o=this.lookupItemController(i);if(o)return this.controllerAt(t,i,o)}return i},arrangedContentDidChange:function(){this._super(),this._resetSubControllers()},arrayContentDidChange:function(n,i,o){var a=e(this,"_subControllers"),s=a.slice(n,n+i);t(s,function(e){e&&e.destroy()}),r(a,n,i,new Array(o)),this._super(n,i,o)},init:function(){this._super(),this.set("_subControllers",Ember.A())},content:Ember.computed(function(){return Ember.A()}),controllerAt:function(t,r,n){var i,o=e(this,"container"),a=e(this,"_subControllers"),s=a[t];if(s)return s;if(i="controller:"+n,!o.has(i))throw new Ember.Error('Could not resolve itemController: "'+n+'"');return s=o.lookupFactory(i).create({target:this,parentController:e(this,"parentController")||this,content:r}),a[t]=s,s},_subControllers:null,_resetSubControllers:function(){var r=e(this,"_subControllers");r&&t(r,function(e){e&&e.destroy()}),this.set("_subControllers",Ember.A())}})}(),function(){Ember.ObjectController=Ember.ObjectProxy.extend(Ember.ControllerMixin)}(),function(){var e=this.jQuery||Ember.imports&&Ember.imports.jQuery;e||"function"!=typeof require||(e=require("jquery")),Ember.$=e}(),function(){if(Ember.$){var e=Ember.String.w("dragstart drag dragenter dragleave dragover drop dragend");Ember.EnumerableUtils.forEach(e,function(e){Ember.$.event.fixHooks[e]={props:["dataTransfer"]}})}}(),function(){function e(e){var t=e.shiftKey||e.metaKey||e.altKey||e.ctrlKey,r=e.which>1;return!t&&!r}var t=this.document&&function(){var e=document.createElement("div");return e.innerHTML="<div></div>",e.firstChild.innerHTML="<script></script>",""===e.firstChild.innerHTML}(),r=this.document&&function(){var e=document.createElement("div");return e.innerHTML="Test: <script type='text/x-placeholder'></script>Value","Test:"===e.childNodes[0].nodeValue&&" Value"===e.childNodes[2].nodeValue}(),n=function(e,t){if(e.getAttribute("id")===t)return e;var r,i,o,a=e.childNodes.length;for(r=0;a>r;r++)if(i=e.childNodes[r],o=1===i.nodeType&&n(i,t))return o},i=function(e,i){t&&(i="&shy;"+i);var o=[];if(r&&(i=i.replace(/(\s+)(<script id='([^']+)')/g,function(e,t,r,n){return o.push([n,t]),r})),e.innerHTML=i,o.length>0){var a,s=o.length;for(a=0;s>a;a++){var u=n(e,o[a][0]),c=document.createTextNode(o[a][1]);u.parentNode.insertBefore(c,u)}}if(t){for(var l=e.firstChild;1===l.nodeType&&!l.nodeName;)l=l.firstChild;3===l.nodeType&&"­"===l.nodeValue.charAt(0)&&(l.nodeValue=l.nodeValue.slice(1))}},o={},a=function(e){if(void 0!==o[e])return o[e];var t=!0;if("select"===e.toLowerCase()){var r=document.createElement("select");i(r,'<option value="test">Test</option>'),t=1===r.options.length}return o[e]=t,t},s=function(e,t){var r=e.tagName;if(a(r))i(e,t);else{var n=e.outerHTML||(new XMLSerializer).serializeToString(e),o=n.match(new RegExp("<"+r+"([^>]*)>","i"))[0],s="</"+r+">",u=document.createElement("div");for(i(u,o+t+s),e=u.firstChild;e.tagName!==r;)e=e.nextSibling}return e};Ember.ViewUtils={setInnerHTML:s,isSimpleClick:e}}(),function(){function e(e){return e?n.test(e)?e.replace(i,""):e:e}function t(e){var t={"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},r=function(e){return t[e]||"&amp;"},n=e.toString();return a.test(n)?n.replace(o,r):n}Ember.get,Ember.set;var r=function(){this.seen={},this.list=[]};r.prototype={add:function(e){e in this.seen||(this.seen[e]=!0,this.list.push(e))},toDOM:function(){return this.list.join(" ")}};var n=/[^a-zA-Z0-9\-]/,i=/[^a-zA-Z0-9\-]/g,o=/&(?!\w+;)|[<>"'`]/g,a=/[&<>"'`]/,s=function(){var e=document.createElement("div"),t=document.createElement("input");return t.setAttribute("name","foo"),e.appendChild(t),!!e.innerHTML.match("foo")}();Ember.RenderBuffer=function(e){return new Ember._RenderBuffer(e)},Ember._RenderBuffer=function(e){this.tagNames=[e||null],this.buffer=""},Ember._RenderBuffer.prototype={_element:null,_hasElement:!0,elementClasses:null,classes:null,elementId:null,elementAttributes:null,elementProperties:null,elementTag:null,elementStyle:null,parentBuffer:null,push:function(e){return this.buffer+=e,this},addClass:function(e){return this.elementClasses=this.elementClasses||new r,this.elementClasses.add(e),this.classes=this.elementClasses.list,this},setClasses:function(e){this.classes=e},id:function(e){return this.elementId=e,this},attr:function(e,t){var r=this.elementAttributes=this.elementAttributes||{};return 1===arguments.length?r[e]:(r[e]=t,this)},removeAttr:function(e){var t=this.elementAttributes;return t&&delete t[e],this},prop:function(e,t){var r=this.elementProperties=this.elementProperties||{};return 1===arguments.length?r[e]:(r[e]=t,this)},removeProp:function(e){var t=this.elementProperties;return t&&delete t[e],this},style:function(e,t){return this.elementStyle=this.elementStyle||{},this.elementStyle[e]=t,this},begin:function(e){return this.tagNames.push(e||null),this},pushOpeningTag:function(){var r=this.currentTagName();if(r){if(this._hasElement&&!this._element&&0===this.buffer.length)return this._element=this.generateElement(),void 0;var n,i,o=this.buffer,a=this.elementId,s=this.classes,u=this.elementAttributes,c=this.elementProperties,l=this.elementStyle;if(o+="<"+e(r),a&&(o+=' id="'+t(a)+'"',this.elementId=null),s&&(o+=' class="'+t(s.join(" "))+'"',this.classes=null),l){o+=' style="';for(i in l)l.hasOwnProperty(i)&&(o+=i+":"+t(l[i])+";");o+='"',this.elementStyle=null}if(u){for(n in u)u.hasOwnProperty(n)&&(o+=" "+n+'="'+t(u[n])+'"');this.elementAttributes=null}if(c){for(i in c)if(c.hasOwnProperty(i)){var h=c[i];(h||"number"==typeof h)&&(o+=h===!0?" "+i+'="'+i+'"':" "+i+'="'+t(c[i])+'"')}this.elementProperties=null}o+=">",this.buffer=o}},pushClosingTag:function(){var t=this.tagNames.pop();t&&(this.buffer+="</"+e(t)+">")},currentTagName:function(){return this.tagNames[this.tagNames.length-1]},generateElement:function(){var r,n,i,o=this.tagNames.pop(),a=this.elementId,u=this.classes,c=this.elementAttributes,l=this.elementProperties,h=this.elementStyle,m="";i=c&&c.name&&!s?"<"+e(o)+' name="'+t(c.name)+'">':o;var f=document.createElement(i),p=Ember.$(f);if(a&&(p.attr("id",a),this.elementId=null),u&&(p.attr("class",u.join(" ")),this.classes=null),h){for(n in h)h.hasOwnProperty(n)&&(m+=n+":"+h[n]+";");p.attr("style",m),this.elementStyle=null}if(c){for(r in c)c.hasOwnProperty(r)&&p.attr(r,c[r]);this.elementAttributes=null}if(l){for(n in l)l.hasOwnProperty(n)&&p.prop(n,l[n]);this.elementProperties=null}return f},element:function(){var e=this.innerString();return e&&(this._element=Ember.ViewUtils.setInnerHTML(this._element,e)),this._element},string:function(){if(this._hasElement&&this._element){var e=this.element(),t=e.outerHTML;return"undefined"==typeof t?Ember.$("<div/>").append(e).html():t}return this.innerString()},innerString:function(){return this.buffer}}}(),function(){var e=Ember.get,t=Ember.set;Ember.String.fmt,Ember.EventDispatcher=Ember.Object.extend({events:{touchstart:"touchStart",touchmove:"touchMove",touchend:"touchEnd",touchcancel:"touchCancel",keydown:"keyDown",keyup:"keyUp",keypress:"keyPress",mousedown:"mouseDown",mouseup:"mouseUp",contextmenu:"contextMenu",click:"click",dblclick:"doubleClick",mousemove:"mouseMove",focusin:"focusIn",focusout:"focusOut",mouseenter:"mouseEnter",mouseleave:"mouseLeave",submit:"submit",input:"input",change:"change",dragstart:"dragStart",drag:"drag",dragenter:"dragEnter",dragleave:"dragLeave",dragover:"dragOver",drop:"drop",dragend:"dragEnd"},rootElement:"body",setup:function(r,n){var i,o=e(this,"events");Ember.$.extend(o,r||{}),Ember.isNone(n)||t(this,"rootElement",n),n=Ember.$(e(this,"rootElement")),n.addClass("ember-application");for(i in o)o.hasOwnProperty(i)&&this.setupHandler(n,i,o[i])},setupHandler:function(e,t,r){var n=this;e.on(t+".ember",".ember-view",function(e,t){return Ember.handleErrors(function(){var i=Ember.View.views[this.id],o=!0,a=null;return a=n._findNearestEventManager(i,r),a&&a!==t?o=n._dispatchEvent(a,e,r,i):i?o=n._bubbleEvent(i,e,r):e.stopPropagation(),o},this)}),e.on(t+".ember","[data-ember-action]",function(e){return Ember.handleErrors(function(){var t=Ember.$(e.currentTarget).attr("data-ember-action"),n=Ember.Handlebars.ActionHelper.registeredActions[t];return n&&n.eventName===r?n.handler(e):void 0},this)})},_findNearestEventManager:function(t,r){for(var n=null;t&&(n=e(t,"eventManager"),!n||!n[r]);)t=e(t,"parentView");return n},_dispatchEvent:function(e,t,r,n){var i=!0,o=e[r];return"function"===Ember.typeOf(o)?(i=Ember.run(function(){return o.call(e,t,n)}),t.stopPropagation()):i=this._bubbleEvent(n,t,r),i},_bubbleEvent:function(e,t,r){return Ember.run(function(){return e.handleEvent(r,t)})},destroy:function(){var t=e(this,"rootElement");return Ember.$(t).off(".ember","**").removeClass("ember-application"),this._super()}})}(),function(){var e=Ember.run.queues,t=Ember.ArrayPolyfills.indexOf;e.splice(t.call(e,"actions")+1,0,"render","afterRender")}(),function(){var e=Ember.get,t=Ember.set;Ember.ControllerMixin.reopen({target:null,namespace:null,view:null,container:null,_childContainers:null,init:function(){this._super(),t(this,"_childContainers",{})},_modelDidChange:Ember.observer("model",function(){var r=e(this,"_childContainers");for(var n in r)r.hasOwnProperty(n)&&r[n].destroy();t(this,"_childContainers",{})})})}(),function(){function e(){Ember.run.once(Ember.View,"notifyMutationListeners")}var t={},r=Ember.get,n=Ember.set,i=Ember.guidFor,o=Ember.EnumerableUtils.forEach,a=Ember.EnumerableUtils.addObject,s=Ember.meta,u=Ember.computed(function(){var e=this._childViews,t=Ember.A(),n=this;return o(e,function(e){var n;e.isVirtual?(n=r(e,"childViews"))&&t.pushObjects(n):t.push(e)}),t.replace=function(e,t,r){if(n instanceof Ember.ContainerView)return n.replace(e,t,r);throw new Ember.Error("childViews is immutable")},t});Ember.TEMPLATES={},Ember.CoreView=Ember.Object.extend(Ember.Evented,Ember.ActionHandler,{isView:!0,states:t,init:function(){this._super(),this.transitionTo("preRender")},parentView:Ember.computed(function(){var e=this._parentView;return e&&e.isVirtual?r(e,"parentView"):e}).property("_parentView"),state:null,_parentView:null,concreteView:Ember.computed(function(){return this.isVirtual?r(this,"parentView"):this}).property("parentView"),instrumentName:"core_view",instrumentDetails:function(e){e.object=this.toString()},renderToBuffer:function(e,t){var r="render."+this.instrumentName,n={};return this.instrumentDetails(n),Ember.instrument(r,n,function(){return this._renderToBuffer(e,t)},this)},_renderToBuffer:function(e){var t=this.tagName;(null===t||void 0===t)&&(t="div");var r=this.buffer=e&&e.begin(t)||Ember.RenderBuffer(t);return this.transitionTo("inBuffer",!1),this.beforeRender(r),this.render(r),this.afterRender(r),r},trigger:function(e){this._super.apply(this,arguments);var t=this[e];if(t){var r,n,i=[];for(r=1,n=arguments.length;n>r;r++)i.push(arguments[r]);return t.apply(this,i)}},deprecatedSendHandles:function(e){return!!this[e]},deprecatedSend:function(e){var t=[].slice.call(arguments,1);this[e].apply(this,t)},has:function(e){return"function"===Ember.typeOf(this[e])||this._super(e)},destroy:function(){var e=this._parentView;if(this._super())return this.removedFromDOM||this.destroyElement(),e&&e.removeChild(this),this.transitionTo("destroying",!1),this},clearRenderedChildren:Ember.K,triggerRecursively:Ember.K,invokeRecursively:Ember.K,transitionTo:Ember.K,destroyElement:Ember.K});var c=Ember._ViewCollection=function(e){var t=this.views=e||[];this.length=t.length};c.prototype={length:0,trigger:function(e){for(var t,r=this.views,n=0,i=r.length;i>n;n++)t=r[n],t.trigger&&t.trigger(e)},triggerRecursively:function(e){for(var t=this.views,r=0,n=t.length;n>r;r++)t[r].triggerRecursively(e)},invokeRecursively:function(e){for(var t,r=this.views,n=0,i=r.length;i>n;n++)t=r[n],e(t)},transitionTo:function(e,t){for(var r=this.views,n=0,i=r.length;i>n;n++)r[n].transitionTo(e,t)
},push:function(){this.length+=arguments.length;var e=this.views;return e.push.apply(e,arguments)},objectAt:function(e){return this.views[e]},forEach:function(e){var t=this.views;return o(t,e)},clear:function(){this.length=0,this.views.length=0}};var l=[];Ember.View=Ember.CoreView.extend({concatenatedProperties:["classNames","classNameBindings","attributeBindings"],isView:!0,templateName:null,layoutName:null,template:Ember.computed(function(e,t){if(void 0!==t)return t;var n=r(this,"templateName"),i=this.templateForName(n,"template");return i||r(this,"defaultTemplate")}).property("templateName"),controller:Ember.computed(function(){var e=r(this,"_parentView");return e?r(e,"controller"):null}).property("_parentView"),layout:Ember.computed(function(){var e=r(this,"layoutName"),t=this.templateForName(e,"layout");return t||r(this,"defaultLayout")}).property("layoutName"),_yield:function(e,t){var n=r(this,"template");n&&n(e,t)},templateForName:function(e){if(e){var t=this.container||Ember.Container&&Ember.Container.defaultContainer;return t&&t.lookup("template:"+e)}},context:Ember.computed(function(e,t){return 2===arguments.length?(n(this,"_context",t),t):r(this,"_context")}).volatile(),_context:Ember.computed(function(){var e,t;return(t=r(this,"controller"))?t:(e=this._parentView,e?r(e,"_context"):null)}),_contextDidChange:Ember.observer("context",function(){this.rerender()}),isVisible:!0,childViews:u,_childViews:l,_childViewsWillChange:Ember.beforeObserver("childViews",function(){if(this.isVirtual){var e=r(this,"parentView");e&&Ember.propertyWillChange(e,"childViews")}}),_childViewsDidChange:Ember.observer("childViews",function(){if(this.isVirtual){var e=r(this,"parentView");e&&Ember.propertyDidChange(e,"childViews")}}),nearestInstanceOf:function(e){for(var t=r(this,"parentView");t;){if(t instanceof e)return t;t=r(t,"parentView")}},nearestOfType:function(e){for(var t=r(this,"parentView"),n=e instanceof Ember.Mixin?function(t){return e.detect(t)}:function(t){return e.detect(t.constructor)};t;){if(n(t))return t;t=r(t,"parentView")}},nearestWithProperty:function(e){for(var t=r(this,"parentView");t;){if(e in t)return t;t=r(t,"parentView")}},nearestChildOf:function(e){for(var t=r(this,"parentView");t;){if(r(t,"parentView")instanceof e)return t;t=r(t,"parentView")}},_parentViewDidChange:Ember.observer("_parentView",function(){this.isDestroying||(this.trigger("parentViewDidChange"),r(this,"parentView.controller")&&!r(this,"controller")&&this.notifyPropertyChange("controller"))}),_controllerDidChange:Ember.observer("controller",function(){this.isDestroying||(this.rerender(),this.forEachChildView(function(e){e.propertyDidChange("controller")}))}),cloneKeywords:function(){var e=r(this,"templateData"),t=e?Ember.copy(e.keywords):{};return n(t,"view",r(this,"concreteView")),n(t,"_view",this),n(t,"controller",r(this,"controller")),t},render:function(e){var t=r(this,"layout")||r(this,"template");if(t){var n,i=r(this,"context"),o=this.cloneKeywords(),a={view:this,buffer:e,isRenderData:!0,keywords:o,insideGroup:r(this,"templateData.insideGroup")};n=t(i,{data:a}),void 0!==n&&e.push(n)}},rerender:function(){return this.currentState.rerender(this)},clearRenderedChildren:function(){for(var e=this.lengthBeforeRender,t=this.lengthAfterRender,r=this._childViews,n=t-1;n>=e;n--)r[n]&&r[n].destroy()},_applyClassNameBindings:function(e){var t,r,n,i=this.classNames;o(e,function(e){var o,s=Ember.View._parsePropertyPath(e),u=function(){r=this._classStringForProperty(e),t=this.$(),o&&(t.removeClass(o),i.removeObject(o)),r?(t.addClass(r),o=r):o=null};n=this._classStringForProperty(e),n&&(a(i,n),o=n),this.registerObserver(this,s.path,u),this.one("willClearRender",function(){o&&(i.removeObject(o),o=null)})},this)},_applyAttributeBindings:function(e,t){var n,i;o(t,function(t){var o=t.split(":"),a=o[0],s=o[1]||a,u=function(){i=this.$(),n=r(this,a),Ember.View.applyAttributeBindings(i,s,n)};this.registerObserver(this,a,u),n=r(this,a),Ember.View.applyAttributeBindings(e,s,n)},this)},_classStringForProperty:function(e){var t=Ember.View._parsePropertyPath(e),n=t.path,i=r(this,n);return void 0===i&&Ember.isGlobalPath(n)&&(i=r(Ember.lookup,n)),Ember.View._classStringForValue(n,i,t.className,t.falsyClassName)},element:Ember.computed(function(e,t){return void 0!==t?this.currentState.setElement(this,t):this.currentState.getElement(this)}).property("_parentView"),$:function(e){return this.currentState.$(this,e)},mutateChildViews:function(e){for(var t,r=this._childViews,n=r.length;--n>=0;)t=r[n],e(this,t,n);return this},forEachChildView:function(e){var t=this._childViews;if(!t)return this;var r,n,i=t.length;for(n=0;i>n;n++)r=t[n],e(r);return this},appendTo:function(e){return this._insertElementLater(function(){this.$().appendTo(e)}),this},replaceIn:function(e){return this._insertElementLater(function(){Ember.$(e).empty(),this.$().appendTo(e)}),this},_insertElementLater:function(e){this._scheduledInsert=Ember.run.scheduleOnce("render",this,"_insertElement",e)},_insertElement:function(e){this._scheduledInsert=null,this.currentState.insertElement(this,e)},append:function(){return this.appendTo(document.body)},remove:function(){this.removedFromDOM||this.destroyElement(),this.invokeRecursively(function(e){e.clearRenderedChildren&&e.clearRenderedChildren()})},elementId:null,findElementInParentElement:function(e){var t="#"+this.elementId;return Ember.$(t)[0]||Ember.$(t,e)[0]},createElement:function(){if(r(this,"element"))return this;var e=this.renderToBuffer();return n(this,"element",e.element()),this},willInsertElement:Ember.K,didInsertElement:Ember.K,willClearRender:Ember.K,invokeRecursively:function(e,t){for(var r,n,i,o=t===!1?this._childViews:[this];o.length;){r=o.slice(),o=[];for(var a=0,s=r.length;s>a;a++)n=r[a],i=n._childViews?n._childViews.slice(0):null,e(n),i&&o.push.apply(o,i)}},triggerRecursively:function(e){for(var t,r,n,i=[this];i.length;){t=i.slice(),i=[];for(var o=0,a=t.length;a>o;o++)r=t[o],n=r._childViews?r._childViews.slice(0):null,r.trigger&&r.trigger(e),n&&i.push.apply(i,n)}},viewHierarchyCollection:function(){for(var e,t=new c([this]),r=0;r<t.length;r++)e=t.objectAt(r),e._childViews&&t.push.apply(t,e._childViews);return t},destroyElement:function(){return this.currentState.destroyElement(this)},willDestroyElement:Ember.K,_notifyWillDestroyElement:function(){var e=this.viewHierarchyCollection();return e.trigger("willClearRender"),e.trigger("willDestroyElement"),e},_elementDidChange:Ember.observer("element",function(){this.forEachChildView(function(e){delete s(e).cache.element})}),parentViewDidChange:Ember.K,instrumentName:"view",instrumentDetails:function(e){e.template=r(this,"templateName"),this._super(e)},_renderToBuffer:function(e,t){this.lengthBeforeRender=this._childViews.length;var r=this._super(e,t);return this.lengthAfterRender=this._childViews.length,r},renderToBufferIfNeeded:function(e){return this.currentState.renderToBufferIfNeeded(this,e)},beforeRender:function(e){this.applyAttributesToBuffer(e),e.pushOpeningTag()},afterRender:function(e){e.pushClosingTag()},applyAttributesToBuffer:function(e){var t=r(this,"classNameBindings");t.length&&this._applyClassNameBindings(t);var n=r(this,"attributeBindings");n.length&&this._applyAttributeBindings(e,n),e.setClasses(this.classNames),e.id(this.elementId);var i=r(this,"ariaRole");i&&e.attr("role",i),r(this,"isVisible")===!1&&e.style("display","none")},tagName:null,ariaRole:null,classNames:["ember-view"],classNameBindings:l,attributeBindings:l,init:function(){this.elementId=this.elementId||i(this),this._super(),this._childViews=this._childViews.slice(),this.classNameBindings=Ember.A(this.classNameBindings.slice()),this.classNames=Ember.A(this.classNames.slice())},appendChild:function(e,t){return this.currentState.appendChild(this,e,t)},removeChild:function(e){if(!this.isDestroying){n(e,"_parentView",null);var t=this._childViews;return Ember.EnumerableUtils.removeObject(t,e),this.propertyDidChange("childViews"),this}},removeAllChildren:function(){return this.mutateChildViews(function(e,t){e.removeChild(t)})},destroyAllChildren:function(){return this.mutateChildViews(function(e,t){t.destroy()})},removeFromParent:function(){var e=this._parentView;return this.remove(),e&&e.removeChild(this),this},destroy:function(){var e,t,n=this._childViews,i=r(this,"parentView"),o=this.viewName;if(this._super()){for(e=n.length,t=e-1;t>=0;t--)n[t].removedFromDOM=!0;for(o&&i&&i.set(o,null),e=n.length,t=e-1;t>=0;t--)n[t].destroy();return this}},createChildView:function(e,t){if(!e)throw new TypeError("createChildViews first argument must exist");if(e.isView&&e._parentView===this&&e.container===this.container)return e;if(t=t||{},t._parentView=this,Ember.CoreView.detect(e))t.templateData=t.templateData||r(this,"templateData"),t.container=this.container,e=e.create(t),e.viewName&&n(r(this,"concreteView"),e.viewName,e);else if("string"==typeof e){var i="view:"+e,o=this.container.lookupFactory(i);t.templateData=r(this,"templateData"),e=o.create(t)}else t.container=this.container,r(e,"templateData")||(t.templateData=r(this,"templateData")),Ember.setProperties(e,t);return e},becameVisible:Ember.K,becameHidden:Ember.K,_isVisibleDidChange:Ember.observer("isVisible",function(){var e=this.$();if(e){var t=r(this,"isVisible");e.toggle(t),this._isAncestorHidden()||(t?this._notifyBecameVisible():this._notifyBecameHidden())}}),_notifyBecameVisible:function(){this.trigger("becameVisible"),this.forEachChildView(function(e){var t=r(e,"isVisible");(t||null===t)&&e._notifyBecameVisible()})},_notifyBecameHidden:function(){this.trigger("becameHidden"),this.forEachChildView(function(e){var t=r(e,"isVisible");(t||null===t)&&e._notifyBecameHidden()})},_isAncestorHidden:function(){for(var e=r(this,"parentView");e;){if(r(e,"isVisible")===!1)return!0;e=r(e,"parentView")}return!1},clearBuffer:function(){this.invokeRecursively(function(e){e.buffer=null})},transitionTo:function(e,t){var r=this.currentState,n=this.currentState=this.states[e];this.state=e,r&&r.exit&&r.exit(this),n.enter&&n.enter(this),"inDOM"===e&&delete Ember.meta(this).cache.element,t!==!1&&this.forEachChildView(function(t){t.transitionTo(e)})},handleEvent:function(e,t){return this.currentState.handleEvent(this,e,t)},registerObserver:function(e,t,r,n){if(n||"function"!=typeof r||(n=r,r=null),e&&"object"==typeof e){var i=this,o=function(){i.currentState.invokeObserver(this,n)},a=function(){Ember.run.scheduleOnce("render",this,o)};Ember.addObserver(e,t,r,a),this.one("willClearRender",function(){Ember.removeObserver(e,t,r,a)})}}});var h={prepend:function(t,r){t.$().prepend(r),e()},after:function(t,r){t.$().after(r),e()},html:function(t,r){t.$().html(r),e()},replace:function(t){var i=r(t,"element");n(t,"element",null),t._insertElementLater(function(){Ember.$(i).replaceWith(r(t,"element")),e()})},remove:function(t){t.$().remove(),e()},empty:function(t){t.$().empty(),e()}};Ember.View.reopen({domManager:h}),Ember.View.reopenClass({_parsePropertyPath:function(e){var t,r,n=e.split(":"),i=n[0],o="";return n.length>1&&(t=n[1],3===n.length&&(r=n[2]),o=":"+t,r&&(o+=":"+r)),{path:i,classNames:o,className:""===t?void 0:t,falsyClassName:r}},_classStringForValue:function(e,t,r,n){if(r||n)return r&&t?r:n&&!t?n:null;if(t===!0){var i=e.split(".");return Ember.String.dasherize(i[i.length-1])}return t!==!1&&null!=t?t:null}});var m=Ember.Object.extend(Ember.Evented).create();Ember.View.addMutationListener=function(e){m.on("change",e)},Ember.View.removeMutationListener=function(e){m.off("change",e)},Ember.View.notifyMutationListeners=function(){m.trigger("change")},Ember.View.views={},Ember.View.childViewsProperty=u,Ember.View.applyAttributeBindings=function(e,t,r){var n=Ember.typeOf(r);"value"===t||"string"!==n&&("number"!==n||isNaN(r))?"value"===t||"boolean"===n?(Ember.isNone(r)&&(r=""),r!==e.prop(t)&&e.prop(t,r)):r||e.removeAttr(t):r!==e.attr(t)&&e.attr(t,r)},Ember.View.states=t}(),function(){var e=(Ember.get,Ember.set);Ember.View.states._default={appendChild:function(){throw"You can't use appendChild outside of the rendering process"},$:function(){return void 0},getElement:function(){return null},handleEvent:function(){return!0},destroyElement:function(t){return e(t,"element",null),t._scheduledInsert&&(Ember.run.cancel(t._scheduledInsert),t._scheduledInsert=null),t},renderToBufferIfNeeded:function(){return!1},rerender:Ember.K,invokeObserver:Ember.K}}(),function(){var e=Ember.View.states.preRender=Ember.create(Ember.View.states._default);Ember.merge(e,{insertElement:function(e,t){e.createElement();var r=e.viewHierarchyCollection();r.trigger("willInsertElement"),t.call(e);for(var n=e.get("element");n=n.parentNode;)n===document&&(r.transitionTo("inDOM",!1),r.trigger("didInsertElement"))},renderToBufferIfNeeded:function(e,t){return e.renderToBuffer(t),!0},empty:Ember.K,setElement:function(e,t){return null!==t&&e.transitionTo("hasElement"),t}})}(),function(){Ember.get,Ember.set;var e=Ember.View.states.inBuffer=Ember.create(Ember.View.states._default);Ember.merge(e,{$:function(e){return e.rerender(),Ember.$()},rerender:function(){throw new Ember.Error("Something you did caused a view to re-render after it rendered but before it was inserted into the DOM.")},appendChild:function(e,t,r){var n=e.buffer,i=e._childViews;return t=e.createChildView(t,r),i.length||(i=e._childViews=i.slice()),i.push(t),t.renderToBuffer(n),e.propertyDidChange("childViews"),t},destroyElement:function(e){e.clearBuffer();var t=e._notifyWillDestroyElement();return t.transitionTo("preRender",!1),e},empty:function(){},renderToBufferIfNeeded:function(){return!1},insertElement:function(){throw"You can't insert an element that has already been rendered"},setElement:function(e,t){return null===t?e.transitionTo("preRender"):(e.clearBuffer(),e.transitionTo("hasElement")),t},invokeObserver:function(e,t){t.call(e)}})}(),function(){var e=Ember.get,t=Ember.set,r=Ember.View.states.hasElement=Ember.create(Ember.View.states._default);Ember.merge(r,{$:function(t,r){var n=e(t,"element");return r?Ember.$(r,n):Ember.$(n)},getElement:function(t){var r=e(t,"parentView");return r&&(r=e(r,"element")),r?t.findElementInParentElement(r):Ember.$("#"+e(t,"elementId"))[0]},setElement:function(e,t){if(null!==t)throw"You cannot set an element to a non-null value when the element is already in the DOM.";return e.transitionTo("preRender"),t},rerender:function(e){return e.triggerRecursively("willClearRender"),e.clearRenderedChildren(),e.domManager.replace(e),e},destroyElement:function(e){return e._notifyWillDestroyElement(),e.domManager.remove(e),t(e,"element",null),e._scheduledInsert&&(Ember.run.cancel(e._scheduledInsert),e._scheduledInsert=null),e},empty:function(e){var t,r,n=e._childViews;if(n)for(t=n.length,r=0;t>r;r++)n[r]._notifyWillDestroyElement();e.domManager.empty(e)},handleEvent:function(e,t,r){return e.has(t)?e.trigger(t,r):!0},invokeObserver:function(e,t){t.call(e)}});var n=Ember.View.states.inDOM=Ember.create(r);Ember.merge(n,{enter:function(e){e.isVirtual||(Ember.View.views[e.elementId]=e),e.addBeforeObserver("elementId",function(){throw new Ember.Error("Changing a view's elementId after creation is not allowed")})},exit:function(e){this.isVirtual||delete Ember.View.views[e.elementId]},insertElement:function(){throw"You can't insert an element into the DOM that has already been inserted"}})}(),function(){var e="You can't call %@ on a view being destroyed",t=Ember.String.fmt,r=Ember.View.states.destroying=Ember.create(Ember.View.states._default);Ember.merge(r,{appendChild:function(){throw t(e,["appendChild"])},rerender:function(){throw t(e,["rerender"])},destroyElement:function(){throw t(e,["destroyElement"])},empty:function(){throw t(e,["empty"])},setElement:function(){throw t(e,["set('element', ...)"])},renderToBufferIfNeeded:function(){return!1},insertElement:Ember.K})}(),function(){Ember.View.cloneStates=function(e){var t={};t._default={},t.preRender=Ember.create(t._default),t.destroying=Ember.create(t._default),t.inBuffer=Ember.create(t._default),t.hasElement=Ember.create(t._default),t.inDOM=Ember.create(t.hasElement);for(var r in e)e.hasOwnProperty(r)&&Ember.merge(t[r],e[r]);return t}}(),function(){function e(e,t,r,n){t.triggerRecursively("willInsertElement"),r?r.domManager.after(r,n.string()):e.domManager.prepend(e,n.string()),t.forEach(function(e){e.transitionTo("inDOM"),e.propertyDidChange("element"),e.triggerRecursively("didInsertElement")})}var t=Ember.View.cloneStates(Ember.View.states),r=Ember.get,n=Ember.set,i=Ember.EnumerableUtils.forEach,o=Ember._ViewCollection;Ember.ContainerView=Ember.View.extend(Ember.MutableArray,{states:t,init:function(){this._super();var e=r(this,"childViews");Ember.defineProperty(this,"childViews",Ember.View.childViewsProperty);var t=this._childViews;i(e,function(e,i){var o;"string"==typeof e?(o=r(this,e),o=this.createChildView(o),n(this,e,o)):o=this.createChildView(e),t[i]=o},this);var o=r(this,"currentView");o&&(t.length||(t=this._childViews=this._childViews.slice()),t.push(this.createChildView(o)))},replace:function(e,t,n){var i=n?r(n,"length"):0;if(this.arrayContentWillChange(e,t,i),this.childViewsWillChange(this._childViews,e,t),0===i)this._childViews.splice(e,t);else{var o=[e,t].concat(n);n.length&&!this._childViews.length&&(this._childViews=this._childViews.slice()),this._childViews.splice.apply(this._childViews,o)}return this.arrayContentDidChange(e,t,i),this.childViewsDidChange(this._childViews,e,t,i),this},objectAt:function(e){return this._childViews[e]},length:Ember.computed(function(){return this._childViews.length}).volatile(),render:function(e){this.forEachChildView(function(t){t.renderToBuffer(e)})},instrumentName:"container",childViewsWillChange:function(e,t,r){if(this.propertyWillChange("childViews"),r>0){var n=e.slice(t,t+r);this.currentState.childViewsWillChange(this,e,t,r),this.initializeViews(n,null,null)}},removeChild:function(e){return this.removeObject(e),this},childViewsDidChange:function(e,t,n,i){if(i>0){var o=e.slice(t,t+i);this.initializeViews(o,this,r(this,"templateData")),this.currentState.childViewsDidChange(this,e,t,i)}this.propertyDidChange("childViews")},initializeViews:function(e,t,o){i(e,function(e){n(e,"_parentView",t),!e.container&&t&&n(e,"container",t.container),r(e,"templateData")||n(e,"templateData",o)})},currentView:null,_currentViewWillChange:Ember.beforeObserver("currentView",function(){var e=r(this,"currentView");e&&e.destroy()}),_currentViewDidChange:Ember.observer("currentView",function(){var e=r(this,"currentView");e&&this.pushObject(e)}),_ensureChildrenAreInDOM:function(){this.currentState.ensureChildrenAreInDOM(this)}}),Ember.merge(t._default,{childViewsWillChange:Ember.K,childViewsDidChange:Ember.K,ensureChildrenAreInDOM:Ember.K}),Ember.merge(t.inBuffer,{childViewsDidChange:function(){throw new Ember.Error("You cannot modify child views while in the inBuffer state")}}),Ember.merge(t.hasElement,{childViewsWillChange:function(e,t,r,n){for(var i=r;r+n>i;i++)t[i].remove()},childViewsDidChange:function(e){Ember.run.scheduleOnce("render",e,"_ensureChildrenAreInDOM")},ensureChildrenAreInDOM:function(t){var r,n,i,a,s,u=t._childViews,c=new o;for(r=0,n=u.length;n>r;r++)i=u[r],s||(s=Ember.RenderBuffer(),s._hasElement=!1),i.renderToBufferIfNeeded(s)?c.push(i):c.length?(e(t,c,a,s),s=null,a=i,c.clear()):a=i;c.length&&e(t,c,a,s)}})}(),function(){var e=Ember.get,t=Ember.set;Ember.String.fmt,Ember.CollectionView=Ember.ContainerView.extend({content:null,emptyViewClass:Ember.View,emptyView:null,itemViewClass:Ember.View,init:function(){var e=this._super();return this._contentDidChange(),e},_contentWillChange:Ember.beforeObserver("content",function(){var t=this.get("content");t&&t.removeArrayObserver(this);var r=t?e(t,"length"):0;this.arrayWillChange(t,0,r)}),_contentDidChange:Ember.observer("content",function(){var t=e(this,"content");t&&(this._assertArrayLike(t),t.addArrayObserver(this));var r=t?e(t,"length"):0;this.arrayDidChange(t,0,null,r)}),_assertArrayLike:function(){},destroy:function(){if(this._super()){var t=e(this,"content");return t&&t.removeArrayObserver(this),this._createdEmptyView&&this._createdEmptyView.destroy(),this}},arrayWillChange:function(t,r,n){var i=e(this,"emptyView");i&&i instanceof Ember.View&&i.removeFromParent();var o,a,s,u=this._childViews;s=this._childViews.length;var c=n===s;for(c&&(this.currentState.empty(this),this.invokeRecursively(function(e){e.removedFromDOM=!0},!1)),a=r+n-1;a>=r;a--)o=u[a],o.destroy()},arrayDidChange:function(r,n,i,o){var a,s,u,c,l,h,m=[];if(c=r?e(r,"length"):0)for(l=e(this,"itemViewClass"),"string"==typeof l&&(l=e(l)||l),u=n;n+o>u;u++)s=r.objectAt(u),a=this.createChildView(l,{content:s,contentIndex:u}),m.push(a);else{if(h=e(this,"emptyView"),!h)return;"string"==typeof h&&(h=e(h)||h),h=this.createChildView(h),m.push(h),t(this,"emptyView",h),Ember.CoreView.detect(h)&&(this._createdEmptyView=h)}this.replace(n,0,m)},createChildView:function(r,n){r=this._super(r,n);var i=e(r,"tagName");return(null===i||void 0===i)&&(i=Ember.CollectionView.CONTAINER_MAP[e(this,"tagName")],t(r,"tagName",i)),r}}),Ember.CollectionView.CONTAINER_MAP={ul:"li",ol:"li",table:"tr",thead:"tr",tbody:"tr",tfoot:"tr",tr:"td",select:"option"}}(),function(){var e=Ember.get,t=Ember.set,r=(Ember.isNone,Array.prototype.slice);Ember.Component=Ember.View.extend(Ember.TargetActionSupport,{init:function(){this._super(),t(this,"context",this),t(this,"controller",this)},cloneKeywords:function(){return{view:this,controller:this}},_yield:function(t,r){var n=r.data.view,i=this._parentView,o=e(this,"template");o&&n.appendChild(Ember.View,{isVirtual:!0,tagName:"",_contextView:i,template:o,context:e(i,"context"),controller:e(i,"controller"),templateData:{keywords:i.cloneKeywords()}})},targetObject:Ember.computed(function(){var t=e(this,"_parentView");return t?e(t,"controller"):null}).property("_parentView"),sendAction:function(t){var n,i=r.call(arguments,1);n=void 0===t?e(this,"action"):e(this,t),void 0!==n&&this.triggerAction({action:n,actionContext:i})}})}(),function(){Ember.ViewTargetActionSupport=Ember.Mixin.create(Ember.TargetActionSupport,{target:Ember.computed.alias("controller"),actionContext:Ember.computed.alias("context")})}(),function(){e("metamorph",[],function(){"use strict";// Copyright: ©2011 My Company Inc. All rights reserved.
var e=function(){},t=0,r=this.document,n=("undefined"==typeof ENV?{}:ENV).DISABLE_RANGE_API,i=!n&&r&&"createRange"in r&&"undefined"!=typeof Range&&Range.prototype.createContextualFragment,o=r&&function(){var e=r.createElement("div");return e.innerHTML="<div></div>",e.firstChild.innerHTML="<script></script>",""===e.firstChild.innerHTML}(),a=r&&function(){var e=r.createElement("div");return e.innerHTML="Test: <script type='text/x-placeholder'></script>Value","Test:"===e.childNodes[0].nodeValue&&" Value"===e.childNodes[2].nodeValue}(),s=function(r){var n;n=this instanceof s?this:new e,n.innerHTML=r;var i="metamorph-"+t++;return n.start=i+"-start",n.end=i+"-end",n};e.prototype=s.prototype;var u,c,l,h,m,f,p,d,b;if(h=function(){return this.startTag()+this.innerHTML+this.endTag()},d=function(){return"<script id='"+this.start+"' type='text/x-placeholder'></script>"},b=function(){return"<script id='"+this.end+"' type='text/x-placeholder'></script>"},i)u=function(e,t){var n=r.createRange(),i=r.getElementById(e.start),o=r.getElementById(e.end);return t?(n.setStartBefore(i),n.setEndAfter(o)):(n.setStartAfter(i),n.setEndBefore(o)),n},c=function(e,t){var r=u(this,t);r.deleteContents();var n=r.createContextualFragment(e);r.insertNode(n)},l=function(){var e=u(this,!0);e.deleteContents()},m=function(e){var t=r.createRange();t.setStart(e),t.collapse(!1);var n=t.createContextualFragment(this.outerHTML());e.appendChild(n)},f=function(e){var t=r.createRange(),n=r.getElementById(this.end);t.setStartAfter(n),t.setEndAfter(n);var i=t.createContextualFragment(e);t.insertNode(i)},p=function(e){var t=r.createRange(),n=r.getElementById(this.start);t.setStartAfter(n),t.setEndAfter(n);var i=t.createContextualFragment(e);t.insertNode(i)};else{var v={select:[1,"<select multiple='multiple'>","</select>"],fieldset:[1,"<fieldset>","</fieldset>"],table:[1,"<table>","</table>"],tbody:[2,"<table><tbody>","</tbody></table>"],tr:[3,"<table><tbody><tr>","</tr></tbody></table>"],colgroup:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],map:[1,"<map>","</map>"],_default:[0,"",""]},E=function(e,t){if(e.getAttribute("id")===t)return e;var r,n,i,o=e.childNodes.length;for(r=0;o>r;r++)if(n=e.childNodes[r],i=1===n.nodeType&&E(n,t))return i},g=function(e,t){var n=[];if(a&&(t=t.replace(/(\s+)(<script id='([^']+)')/g,function(e,t,r,i){return n.push([i,t]),r})),e.innerHTML=t,n.length>0){var i,o=n.length;for(i=0;o>i;i++){var s=E(e,n[i][0]),u=r.createTextNode(n[i][1]);s.parentNode.insertBefore(u,s)}}},y=function(e,t){var n=v[e.tagName.toLowerCase()]||v._default,i=n[0],a=n[1],s=n[2];o&&(t="&shy;"+t);var u=r.createElement("div");g(u,a+t+s);for(var c=0;i>=c;c++)u=u.firstChild;if(o){for(var l=u;1===l.nodeType&&!l.nodeName;)l=l.firstChild;3===l.nodeType&&"­"===l.nodeValue.charAt(0)&&(l.nodeValue=l.nodeValue.slice(1))}return u},w=function(e){for(;""===e.parentNode.tagName;)e=e.parentNode;return e},_=function(e,t){e.parentNode!==t.parentNode&&t.parentNode.insertBefore(e,t.parentNode.firstChild)};c=function(e,t){var n,i,o,a=w(r.getElementById(this.start)),s=r.getElementById(this.end),u=s.parentNode;for(_(a,s),n=a.nextSibling;n;){if(i=n.nextSibling,o=n===s){if(!t)break;s=n.nextSibling}if(n.parentNode.removeChild(n),o)break;n=i}for(n=y(a.parentNode,e);n;)i=n.nextSibling,u.insertBefore(n,s),n=i},l=function(){var e=w(r.getElementById(this.start)),t=r.getElementById(this.end);this.html(""),e.parentNode.removeChild(e),t.parentNode.removeChild(t)},m=function(e){for(var t,r=y(e,this.outerHTML());r;)t=r.nextSibling,e.appendChild(r),r=t},f=function(e){var t,n,i=r.getElementById(this.end),o=i.nextSibling,a=i.parentNode;for(n=y(a,e);n;)t=n.nextSibling,a.insertBefore(n,o),n=t},p=function(e){var t,n,i=r.getElementById(this.start),o=i.parentNode;n=y(o,e);for(var a=i.nextSibling;n;)t=n.nextSibling,o.insertBefore(n,a),n=t}}return s.prototype.html=function(e){return this.checkRemoved(),void 0===e?this.innerHTML:(c.call(this,e),this.innerHTML=e,void 0)},s.prototype.replaceWith=function(e){this.checkRemoved(),c.call(this,e,!0)},s.prototype.remove=l,s.prototype.outerHTML=h,s.prototype.appendTo=m,s.prototype.after=f,s.prototype.prepend=p,s.prototype.startTag=d,s.prototype.endTag=b,s.prototype.isRemoved=function(){var e=r.getElementById(this.start),t=r.getElementById(this.end);return!e||!t},s.prototype.checkRemoved=function(){if(this.isRemoved())throw new Error("Cannot perform operations on a Metamorph that is not in the DOM.")},s})}(),function(){var e=Object.create||function(e){function t(){}return t.prototype=e,new t},t=this.Handlebars||Ember.imports&&Ember.imports.Handlebars;t||"function"!=typeof require||(t=require("handlebars")),Ember.Handlebars=e(t),Ember.Handlebars.helper=function(e,t){Ember.View.detect(t)?Ember.Handlebars.registerHelper(e,Ember.Handlebars.makeViewHelper(t)):Ember.Handlebars.registerBoundHelper.apply(null,arguments)},Ember.Handlebars.makeViewHelper=function(e){return function(t){return Ember.Handlebars.helpers.view.call(this,e,t)}},Ember.Handlebars.helpers=e(t.helpers),Ember.Handlebars.Compiler=function(){},t.Compiler&&(Ember.Handlebars.Compiler.prototype=e(t.Compiler.prototype)),Ember.Handlebars.Compiler.prototype.compiler=Ember.Handlebars.Compiler,Ember.Handlebars.JavaScriptCompiler=function(){},t.JavaScriptCompiler&&(Ember.Handlebars.JavaScriptCompiler.prototype=e(t.JavaScriptCompiler.prototype),Ember.Handlebars.JavaScriptCompiler.prototype.compiler=Ember.Handlebars.JavaScriptCompiler),Ember.Handlebars.JavaScriptCompiler.prototype.namespace="Ember.Handlebars",Ember.Handlebars.JavaScriptCompiler.prototype.initializeBuffer=function(){return"''"},Ember.Handlebars.JavaScriptCompiler.prototype.appendToBuffer=function(e){return"data.buffer.push("+e+");"};var r=/helpers\.(.*?)\)/,n=/helpers\['(.*?)'/,i=/(.*blockHelperMissing\.call\(.*)(stack[0-9]+)(,.*)/;Ember.Handlebars.JavaScriptCompiler.stringifyLastBlockHelperMissingInvocation=function(e){var t=e[e.length-1],o=(r.exec(t)||n.exec(t))[1],a=i.exec(t);e[e.length-1]=a[1]+"'"+o+"'"+a[3]};var o=Ember.Handlebars.JavaScriptCompiler.stringifyLastBlockHelperMissingInvocation,a=Ember.Handlebars.JavaScriptCompiler.prototype.blockValue;Ember.Handlebars.JavaScriptCompiler.prototype.blockValue=function(){a.apply(this,arguments),o(this.source)};var s=Ember.Handlebars.JavaScriptCompiler.prototype.ambiguousBlockValue;Ember.Handlebars.JavaScriptCompiler.prototype.ambiguousBlockValue=function(){s.apply(this,arguments),o(this.source)};var u="ember"+ +new Date,c=1;Ember.Handlebars.Compiler.prototype.mustache=function(e){if(e.isHelper&&"control"===e.id.string)e.hash=e.hash||new t.AST.HashNode([]),e.hash.pairs.push(["controlID",new t.AST.StringNode(u+c++)]);else if(e.params.length||e.hash);else{var r=new t.AST.IdNode([{part:"_triageMustache"}]);e.escaped||(e.hash=e.hash||new t.AST.HashNode([]),e.hash.pairs.push(["unescaped",new t.AST.StringNode("true")])),e=new t.AST.MustacheNode([r].concat([e.id]),e.hash,!e.escaped)}return t.Compiler.prototype.mustache.call(this,e)},Ember.Handlebars.precompile=function(e){var r=t.parse(e),n={knownHelpers:{action:!0,unbound:!0,bindAttr:!0,template:!0,view:!0,_triageMustache:!0},data:!0,stringParams:!0},i=(new Ember.Handlebars.Compiler).compile(r,n);return(new Ember.Handlebars.JavaScriptCompiler).compile(i,n,void 0,!0)},t.compile&&(Ember.Handlebars.compile=function(e){var r=t.parse(e),n={data:!0,stringParams:!0},i=(new Ember.Handlebars.Compiler).compile(r,n),o=(new Ember.Handlebars.JavaScriptCompiler).compile(i,n,void 0,!0),a=Ember.Handlebars.template(o);return a.isMethod=!1,a})}(),function(){function e(e,t,r,n){var i,o,a,s,u=[],c=n.hash,l=c.boundOptions;for(s in l)l.hasOwnProperty(s)&&(c[s]=Ember.Handlebars.get(e,l[s],n));for(i=0,o=r.length;o>i;++i)a=r[i],u.push(Ember.Handlebars.get(a.root,a.path,n));return u.push(n),t.apply(e,u)}var t=Array.prototype.slice,r=Ember.Handlebars.template,n=Ember.Handlebars.normalizePath=function(e,t,r){var n,i,o=r&&r.keywords||{};return n=t.split(".",1)[0],o.hasOwnProperty(n)&&(e=o[n],i=!0,t=t===n?"":t.substr(n.length+1)),{root:e,path:t,isKeyword:i}},i=Ember.Handlebars.get=function(e,t,r){var i,o=r&&r.data,a=n(e,t,o);return e=a.root,t=a.path,i=Ember.get(e,t),void 0===i&&e!==Ember.lookup&&Ember.isGlobalPath(t)&&(i=Ember.get(Ember.lookup,t)),i};Ember.Handlebars.resolveParams=function(e,t,r){for(var n,o,a=[],s=r.types,u=0,c=t.length;c>u;u++)n=t[u],o=s[u],"ID"===o?a.push(i(e,n,r)):a.push(n);return a},Ember.Handlebars.resolveHash=function(e,t,r){var n,o={},a=r.hashTypes;for(var s in t)t.hasOwnProperty(s)&&(n=a[s],o[s]="ID"===n?i(e,t[s],r):t[s]);return o},Ember.Handlebars.registerHelper("helperMissing",function(e){var r,n="",i=arguments[arguments.length-1],o=Ember.Handlebars.resolveHelper(i.data.view.container,e);if(o)return o.apply(this,t.call(arguments,1));throw r="%@ Handlebars error: Could not find property '%@' on object %@.",i.data&&(n=i.data.view),new Ember.Error(Ember.String.fmt(r,[n,e,this]))}),Ember.Handlebars.registerHelper("blockHelperMissing",function(e){var r=arguments[arguments.length-1],n=Ember.Handlebars.resolveHelper(r.data.view.container,e);return n?n.apply(this,t.call(arguments,1)):Handlebars.helpers.blockHelperMissing.apply(this,arguments)}),Ember.Handlebars.registerBoundHelper=function(e){var r=t.call(arguments,1),n=Ember.Handlebars.makeBoundHelper.apply(this,r);Ember.Handlebars.registerHelper(e,n)},Ember.Handlebars.makeBoundHelper=function(r){function i(){var i,a,s,u,c,l=t.call(arguments,0,-1),h=l.length,m=arguments[arguments.length-1],f=[],p=m.types,d=m.data,b=m.hash,v=d.view,E=m.contexts,g=E&&E.length?E[0]:this,y="",w=Ember._SimpleHandlebarsView.prototype.normalizedValue,_=b.boundOptions={};for(s in b)Ember.IS_BINDING.test(s)&&(_[s.slice(0,-7)]=b[s]);var C=[];for(d.properties=[],i=0;h>i;++i)if(d.properties.push(l[i]),"ID"===p[i]){var O=n(g,l[i],d);f.push(O),C.push(O)}else f.push(null);if(d.isUnbound)return e(this,r,f,m);var A=new Ember._SimpleHandlebarsView(null,null,!m.hash.unescaped,m.data);A.normalizedValue=function(){var e,t=[];for(e in _)_.hasOwnProperty(e)&&(c=n(g,_[e],d),A.path=c.path,A.pathRoot=c.root,b[e]=w.call(A));for(i=0;h>i;++i)c=f[i],c?(A.path=c.path,A.pathRoot=c.root,t.push(w.call(A))):t.push(l[i]);return t.push(m),r.apply(g,t)},v.appendChild(A);for(u in _)_.hasOwnProperty(u)&&C.push(n(g,_[u],d));for(i=0,a=C.length;a>i;++i)c=C[i],v.registerObserver(c.root,c.path,A,A.rerender);if("ID"===p[0]&&0!==f.length){var P=f[0],x=P.root,V=P.path;Ember.isEmpty(V)||(y=V+".");for(var T=0,S=o.length;S>T;T++)v.registerObserver(x,y+o[T],A,A.rerender)}}var o=t.call(arguments,1);return i._rawFunction=r,i},Ember.Handlebars.template=function(e){var t=r(e);return t.isTop=!0,t}}(),function(){Ember.String.htmlSafe=function(e){return new Handlebars.SafeString(e)};var e=Ember.String.htmlSafe;(Ember.EXTEND_PROTOTYPES===!0||Ember.EXTEND_PROTOTYPES.String)&&(String.prototype.htmlSafe=function(){return e(this)})}(),function(){Ember.Handlebars.resolvePaths=function(e){for(var t=[],r=e.contexts,n=e.roots,i=e.data,o=0,a=r.length;a>o;o++)t.push(Ember.Handlebars.get(n[o],r[o],{data:i}));return t}}(),function(){function e(){Ember.run.once(Ember.View,"notifyMutationListeners")}Ember.set,Ember.get;var r=t("metamorph"),n={remove:function(t){t.morph.remove(),e()},prepend:function(t,r){t.morph.prepend(r),e()},after:function(t,r){t.morph.after(r),e()},html:function(t,r){t.morph.html(r),e()},replace:function(t){var r=t.morph;t.transitionTo("preRender"),Ember.run.schedule("render",this,function(){if(!t.isDestroying){t.clearRenderedChildren();var n=t.renderToBuffer();t.invokeRecursively(function(e){e.propertyWillChange("element")}),t.triggerRecursively("willInsertElement"),r.replaceWith(n.string()),t.transitionTo("inDOM"),t.invokeRecursively(function(e){e.propertyDidChange("element")}),t.triggerRecursively("didInsertElement"),e()}})},empty:function(t){t.morph.html(""),e()}};Ember._Metamorph=Ember.Mixin.create({isVirtual:!0,tagName:"",instrumentName:"metamorph",init:function(){this._super(),this.morph=r()},beforeRender:function(e){e.push(this.morph.startTag()),e.pushOpeningTag()},afterRender:function(e){e.pushClosingTag(),e.push(this.morph.endTag())},createElement:function(){var e=this.renderToBuffer();this.outerHTML=e.string(),this.clearBuffer()},domManager:n}),Ember._MetamorphView=Ember.View.extend(Ember._Metamorph),Ember._SimpleMetamorphView=Ember.CoreView.extend(Ember._Metamorph)}(),function(){function e(e,t,r,n){this.path=e,this.pathRoot=t,this.isEscaped=r,this.templateData=n,this.morph=o(),this.state="preRender",this.updateId=null,this._parentView=null,this.buffer=null}var r=Ember.get,n=Ember.set,i=Ember.Handlebars.get,o=t("metamorph");Ember._SimpleHandlebarsView=e,e.prototype={isVirtual:!0,isView:!0,destroy:function(){this.updateId&&(Ember.run.cancel(this.updateId),this.updateId=null),this._parentView&&this._parentView.removeChild(this),this.morph=null,this.state="destroyed"},propertyWillChange:Ember.K,propertyDidChange:Ember.K,normalizedValue:function(){var e,t,r=this.path,n=this.pathRoot;return""===r?e=n:(t=this.templateData,e=i(n,r,{data:t})),e},renderToBuffer:function(e){var t="";t+=this.morph.startTag(),t+=this.render(),t+=this.morph.endTag(),e.push(t)},render:function(){var e=this.isEscaped,t=this.normalizedValue();return null===t||void 0===t?t="":t instanceof Handlebars.SafeString||(t=String(t)),e&&(t=Handlebars.Utils.escapeExpression(t)),t},rerender:function(){switch(this.state){case"preRender":case"destroyed":break;case"inBuffer":throw new Ember.Error("Something you did tried to replace an {{expression}} before it was inserted into the DOM.");case"hasElement":case"inDOM":this.updateId=Ember.run.scheduleOnce("render",this,"update")}return this},update:function(){this.updateId=null,this.morph.html(this.render())},transitionTo:function(e){this.state=e}};var a=Ember.View.cloneStates(Ember.View.states),s=Ember.merge;s(a._default,{rerenderIfNeeded:Ember.K}),s(a.inDOM,{rerenderIfNeeded:function(e){e.normalizedValue()!==e._lastNormalizedValue&&e.rerender()}}),Ember._HandlebarsBoundView=Ember._MetamorphView.extend({instrumentName:"boundHandlebars",states:a,shouldDisplayFunc:null,preserveContext:!1,previousContext:null,displayTemplate:null,inverseTemplate:null,path:null,pathRoot:null,normalizedValue:function(){var e,t,n=r(this,"path"),o=r(this,"pathRoot"),a=r(this,"valueNormalizerFunc");return""===n?e=o:(t=r(this,"templateData"),e=i(o,n,{data:t})),a?a(e):e},rerenderIfNeeded:function(){this.currentState.rerenderIfNeeded(this)},render:function(e){var t=r(this,"isEscaped"),i=r(this,"shouldDisplayFunc"),o=r(this,"preserveContext"),a=r(this,"previousContext"),s=r(this,"inverseTemplate"),u=r(this,"displayTemplate"),c=this.normalizedValue();if(this._lastNormalizedValue=c,i(c))if(n(this,"template",u),o)n(this,"_context",a);else{if(!u)return null===c||void 0===c?c="":c instanceof Handlebars.SafeString||(c=String(c)),t&&(c=Handlebars.Utils.escapeExpression(c)),e.push(c),void 0;n(this,"_context",c)}else s?(n(this,"template",s),o?n(this,"_context",a):n(this,"_context",c)):n(this,"template",function(){return""});return this._super(e)}})}(),function(){function e(e){return!Ember.isNone(e)}function t(e,t,r,n,a,s){var u,c,l,h=t.data,m=t.fn,f=t.inverse,p=h.view,d=this;if(u=o(d,e,h),"object"==typeof this){if(h.insideGroup){c=function(){Ember.run.once(p,"rerender")};var b,v,E=i(d,e,t);E=a?a(E):E,v=r?d:E,n(E)?b=m:f&&(b=f),b(v,{data:t.data})}else{var g=p.createChildView(Ember._HandlebarsBoundView,{preserveContext:r,shouldDisplayFunc:n,valueNormalizerFunc:a,displayTemplate:m,inverseTemplate:f,path:e,pathRoot:d,previousContext:d,isEscaped:!t.hash.unescaped,templateData:t.data});p.appendChild(g),c=function(){Ember.run.scheduleOnce("render",g,"rerenderIfNeeded")}}if(""!==u.path&&(p.registerObserver(u.root,u.path,c),s))for(l=0;l<s.length;l++)p.registerObserver(u.root,u.path+"."+s[l],c)}else h.buffer.push(i(d,e,t))}function r(e,t,r){var n,a,s,u,c=r.data,l=c.view;if(n=o(e,t,c),s=n.root,s&&"object"==typeof s){if(c.insideGroup){a=function(){Ember.run.once(l,"rerender")};var h=i(e,t,r);(null===h||void 0===h)&&(h=""),c.buffer.push(h)}else{var m=new Ember._SimpleHandlebarsView(t,e,!r.hash.unescaped,r.data);m._parentView=l,l.appendChild(m),a=function(){Ember.run.scheduleOnce("render",m,"rerender")}}""!==n.path&&l.registerObserver(n.root,n.path,a)}else u=i(e,t,r),c.buffer.push(null===u||"undefined"==typeof u?"":u)}var n=Ember.get;Ember.set,Ember.String.fmt;var i=Ember.Handlebars.get,o=Ember.Handlebars.normalizePath,a=Ember.ArrayPolyfills.forEach,s=Ember.Handlebars,u=s.helpers;s.bind=t,s.registerHelper("_triageMustache",function(e,t){if(u[e])return u[e].call(this,t);var r=Ember.Handlebars.resolveHelper(t.data.view.container,e);return r?r.call(this,t):u.bind.call(this,e,t)}),Ember.Handlebars.resolveHelper=function(e,t){if(e&&-1!==t.indexOf("-")){var r=e.lookup("helper:"+t);if(!r){var n=e.lookup("component-lookup:main"),i=n.lookupFactory(t,e);i&&(r=s.makeViewHelper(i),e.register("helper:"+t,r))}return r}},s.registerHelper("bind",function(n,i){var o=i.contexts&&i.contexts.length?i.contexts[0]:this;return i.fn?t.call(o,n,i,!1,e):r(o,n,i)}),s.registerHelper("boundIf",function(e,r){var i=r.contexts&&r.contexts.length?r.contexts[0]:this,o=function(e){var t=e&&n(e,"isTruthy");return"boolean"==typeof t?t:Ember.isArray(e)?0!==n(e,"length"):!!e};return t.call(i,e,r,!0,o,o,["isTruthy","length"])}),s.registerHelper("with",function(r,n){if(4===arguments.length){var i,a,s,c;if(n=arguments[3],i=arguments[2],a=arguments[0],Ember.isGlobalPath(a))Ember.bind(n.data.keywords,i,a);else{c=o(this,a,n.data),a=c.path,s=c.root;var l=Ember.$.expando+Ember.guidFor(s);n.data.keywords[l]=s;var h=a?l+"."+a:l;Ember.bind(n.data.keywords,i,h)}return t.call(this,a,n,!0,e)}return u.bind.call(n.contexts[0],r,n)}),s.registerHelper("if",function(e,t){return u.boundIf.call(t.contexts[0],e,t)}),s.registerHelper("unless",function(e,t){var r=t.fn,n=t.inverse;return t.fn=n,t.inverse=r,u.boundIf.call(t.contexts[0],e,t)}),s.registerHelper("bind-attr",function(e){var t=e.hash,r=e.data.view,n=[],u=this,c=++Ember.uuid,l=t["class"];if(null!=l){var h=s.bindClasses(this,l,r,c,e);n.push('class="'+Handlebars.Utils.escapeExpression(h.join(" "))+'"'),delete t["class"]}var m=Ember.keys(t);return a.call(m,function(a){var s,l=t[a];s=o(u,l,e.data);var h,m,f="this"===l?s.root:i(u,l,e),p=Ember.typeOf(f);h=function(){var t=i(u,l,e),n=r.$("[data-bindattr-"+c+"='"+c+"']");return n&&0!==n.length?(Ember.View.applyAttributeBindings(n,a,t),void 0):(Ember.removeObserver(s.root,s.path,m),void 0)},"this"===l||s.isKeyword&&""===s.path||r.registerObserver(s.root,s.path,h),"string"===p||"number"===p&&!isNaN(f)?n.push(a+'="'+Handlebars.Utils.escapeExpression(f)+'"'):f&&"boolean"===p&&n.push(a+'="'+a+'"')},this),n.push("data-bindattr-"+c+'="'+c+'"'),new s.SafeString(n.join(" "))}),s.registerHelper("bindAttr",s.helpers["bind-attr"]),s.bindClasses=function(e,t,r,n,s){var u,c,l,h=[],m=function(e,t,r){var n,o=t.path;return n="this"===o?e:""===o?!0:i(e,o,r),Ember.View._classStringForValue(o,n,t.className,t.falsyClassName)};return a.call(t.split(" "),function(t){var i,a,f,p,d=Ember.View._parsePropertyPath(t),b=d.path,v=e;""!==b&&"this"!==b&&(p=o(e,b,s.data),v=p.root,b=p.path),a=function(){u=m(e,d,s),l=n?r.$("[data-bindattr-"+n+"='"+n+"']"):r.$(),l&&0!==l.length?(i&&l.removeClass(i),u?(l.addClass(u),i=u):i=null):Ember.removeObserver(v,b,f)},""!==b&&"this"!==b&&r.registerObserver(v,b,a),c=m(e,d,s),c&&(h.push(c),i=c)}),h}}(),function(){function e(e,r){var n=r.hash,i=r.hashTypes;for(var o in n)if("ID"===i[o]){var a=n[o];Ember.IS_BINDING.test(o)||(n[o+"Binding"]=a,i[o+"Binding"]="STRING",delete n[o],delete i[o])}n.hasOwnProperty("idBinding")&&(n.id=t.get(e,n.idBinding,r),i.id="STRING",delete n.idBinding,delete i.idBinding)}Ember.get,Ember.set;var t=Ember.Handlebars,r=/^[a-z]/,n=/^view\./;t.ViewHelper=Ember.Object.create({propertiesFromHTMLOptions:function(e){var t=e.hash,r=e.data,n={},i=t["class"],o=!1;t.id&&(n.elementId=t.id,o=!0),t.tag&&(n.tagName=t.tag,o=!0),i&&(i=i.split(" "),n.classNames=i,o=!0),t.classBinding&&(n.classNameBindings=t.classBinding.split(" "),o=!0),t.classNameBindings&&(void 0===n.classNameBindings&&(n.classNameBindings=[]),n.classNameBindings=n.classNameBindings.concat(t.classNameBindings.split(" ")),o=!0),t.attributeBindings&&(n.attributeBindings=null,o=!0),o&&(t=Ember.$.extend({},t),delete t.id,delete t.tag,delete t["class"],delete t.classBinding);var a;for(var s in t)t.hasOwnProperty(s)&&Ember.IS_BINDING.test(s)&&"string"==typeof t[s]&&(a=this.contextualizeBindingPath(t[s],r),a&&(t[s]=a));if(n.classNameBindings)for(var u in n.classNameBindings){var c=n.classNameBindings[u];if("string"==typeof c){var l=Ember.View._parsePropertyPath(c);a=this.contextualizeBindingPath(l.path,r),a&&(n.classNameBindings[u]=a+l.classNames)}}return Ember.$.extend(t,n)},contextualizeBindingPath:function(e,t){var r=Ember.Handlebars.normalizePath(null,e,t);return r.isKeyword?"templateData.keywords."+e:Ember.isGlobalPath(e)?null:"this"===e?"_parentView.context":"_parentView.context."+e},helper:function(i,o,a){var s,u=a.data,c=a.fn;e(i,a),s="string"==typeof o?"STRING"===a.types[0]&&r.test(o)&&!n.test(o)?u.view.container.lookupFactory("view:"+o):t.get(i,o,a):o;var l=this.propertiesFromHTMLOptions(a,i),h=u.view;l.templateData=u;var m=s.proto?s.proto():s;c&&(l.template=c),m.controller||m.controllerBinding||l.controller||l.controllerBinding||(l._context=i),h.appendChild(s,l)}}),t.registerHelper("view",function(e,r){return e&&e.data&&e.data.isRenderData&&(r=e,e="Ember.View"),t.ViewHelper.helper(this,e,r)})}(),function(){var e=Ember.get,t=Ember.Handlebars.get;Ember.String.fmt,Ember.Handlebars.registerHelper("collection",function(r,n){r&&r.data&&r.data.isRenderData&&(n=r,r=void 0);var i=n.fn,o=n.data,a=n.inverse;n.data.view;var s;s=r?t(this,r,n):Ember.CollectionView;var u,c,l=n.hash,h={},m=s.proto();if(l.itemView){var f=o.keywords.controller,p=f.container;c=p.resolve("view:"+l.itemView)}else c=l.itemViewClass?t(m,l.itemViewClass,n):m.itemViewClass;delete l.itemViewClass,delete l.itemView;for(var d in l)l.hasOwnProperty(d)&&(u=d.match(/^item(.)(.*)$/),u&&"itemController"!==d&&(h[u[1].toLowerCase()+u[2]]=l[d],delete l[d]));i&&(h.template=i,delete n.fn);var b;a&&a!==Handlebars.VM.noop?(b=e(m,"emptyViewClass"),b=b.extend({template:a,tagName:h.tagName})):l.emptyViewClass&&(b=t(this,l.emptyViewClass,n)),b&&(l.emptyView=b),l.keyword||(h._context=Ember.computed.alias("content"));var v=Ember.Handlebars.ViewHelper.propertiesFromHTMLOptions({data:o,hash:h},this);return l.itemViewClass=c.extend(v),Ember.Handlebars.helpers.view.call(this,s,n)})}(),function(){var e=Ember.Handlebars.get;Ember.Handlebars.registerHelper("unbound",function(t,r){var n,i,o,a=arguments[arguments.length-1];return arguments.length>2?(a.data.isUnbound=!0,n=Ember.Handlebars.helpers[arguments[0]]||Ember.Handlebars.helperMissing,o=n.apply(this,Array.prototype.slice.call(arguments,1)),delete a.data.isUnbound,o):(i=r.contexts&&r.contexts.length?r.contexts[0]:this,e(i,t,r))})}(),function(){var e=Ember.Handlebars.get,t=Ember.Handlebars.normalizePath;Ember.Handlebars.registerHelper("log",function(r,n){var i=n.contexts&&n.contexts.length?n.contexts[0]:this,o=t(i,r,n.data),a=o.root,s=o.path,u="this"===s?a:e(a,s,n);Ember.Logger.log(u)}),Ember.Handlebars.registerHelper("debugger",function(){})}(),function(){var e=Ember.get,t=Ember.set;Ember.Handlebars.EachView=Ember.CollectionView.extend(Ember._Metamorph,{init:function(){var r,n=e(this,"itemController");if(n){var i=e(this,"controller.container").lookupFactory("controller:array").create({parentController:e(this,"controller"),itemController:n,target:e(this,"controller"),_eachView:this});this.disableContentObservers(function(){t(this,"content",i),r=new Ember.Binding("content","_eachView.dataSource").oneWay(),r.connect(i)}),t(this,"_arrayController",i)}else this.disableContentObservers(function(){r=new Ember.Binding("content","dataSource").oneWay(),r.connect(this)});return this._super()},_assertArrayLike:function(){},disableContentObservers:function(e){Ember.removeBeforeObserver(this,"content",null,"_contentWillChange"),Ember.removeObserver(this,"content",null,"_contentDidChange"),e.call(this),Ember.addBeforeObserver(this,"content",null,"_contentWillChange"),Ember.addObserver(this,"content",null,"_contentDidChange")},itemViewClass:Ember._MetamorphView,emptyViewClass:Ember._MetamorphView,createChildView:function(r,n){r=this._super(r,n);var i=e(this,"keyword"),o=e(r,"content");if(i){var a=e(r,"templateData");a=Ember.copy(a),a.keywords=r.cloneKeywords(),t(r,"templateData",a),a.keywords[i]=o}return o&&e(o,"isController")&&t(r,"controller",o),r},destroy:function(){if(this._super()){var t=e(this,"_arrayController");return t&&t.destroy(),this}}});var r=Ember.Handlebars.GroupedEach=function(e,t,r){var n=this,i=Ember.Handlebars.normalizePath(e,t,r.data);this.context=e,this.path=t,this.options=r,this.template=r.fn,this.containingView=r.data.view,this.normalizedRoot=i.root,this.normalizedPath=i.path,this.content=this.lookupContent(),this.addContentObservers(),this.addArrayObservers(),this.containingView.on("willClearRender",function(){n.destroy()})};r.prototype={contentWillChange:function(){this.removeArrayObservers()},contentDidChange:function(){this.content=this.lookupContent(),this.addArrayObservers(),this.rerenderContainingView()},contentArrayWillChange:Ember.K,contentArrayDidChange:function(){this.rerenderContainingView()},lookupContent:function(){return Ember.Handlebars.get(this.normalizedRoot,this.normalizedPath,this.options)},addArrayObservers:function(){this.content&&this.content.addArrayObserver(this,{willChange:"contentArrayWillChange",didChange:"contentArrayDidChange"})},removeArrayObservers:function(){this.content&&this.content.removeArrayObserver(this,{willChange:"contentArrayWillChange",didChange:"contentArrayDidChange"})},addContentObservers:function(){Ember.addBeforeObserver(this.normalizedRoot,this.normalizedPath,this,this.contentWillChange),Ember.addObserver(this.normalizedRoot,this.normalizedPath,this,this.contentDidChange)},removeContentObservers:function(){Ember.removeBeforeObserver(this.normalizedRoot,this.normalizedPath,this.contentWillChange),Ember.removeObserver(this.normalizedRoot,this.normalizedPath,this.contentDidChange)},render:function(){if(this.content){var t=this.content,r=e(t,"length"),n=this.options.data,i=this.template;n.insideEach=!0;for(var o=0;r>o;o++)i(t.objectAt(o),{data:n})}},rerenderContainingView:function(){var e=this;Ember.run.scheduleOnce("render",this,function(){e.destroyed||e.containingView.rerender()})},destroy:function(){this.removeContentObservers(),this.content&&this.removeArrayObservers(),this.destroyed=!0}},Ember.Handlebars.registerHelper("each",function(e,t){if(4===arguments.length){var r=arguments[0];t=arguments[3],e=arguments[2],""===e&&(e="this"),t.hash.keyword=r}return 1===arguments.length&&(t=e,e="this"),t.hash.dataSourceBinding=e,!t.data.insideGroup||t.hash.groupedRows||t.hash.itemViewClass?Ember.Handlebars.helpers.collection.call(this,"Ember.Handlebars.EachView",t):(new Ember.Handlebars.GroupedEach(this,e,t).render(),void 0)})}(),function(){Ember.Handlebars.registerHelper("template",function(){return Ember.Handlebars.helpers.partial.apply(this,arguments)})}(),function(){function e(e){return!Ember.isNone(e)}function t(e,t,r){var n=t.split("/"),i=n[n.length-1];n[n.length-1]="_"+i;var o=r.data.view,a=n.join("/"),s=o.templateForName(a),u=!s&&o.templateForName(t);s=s||u,s(e,{data:r.data})}Ember.Handlebars.registerHelper("partial",function(r,n){var i=n.contexts&&n.contexts.length?n.contexts[0]:this;return"ID"===n.types[0]?(n.fn=function(e,n){var i=Ember.Handlebars.get(e,r,n);t(e,i,n)},Ember.Handlebars.bind.call(i,r,n,!0,e)):(t(i,r,n),void 0)})}(),function(){var e=Ember.get;Ember.set,Ember.Handlebars.registerHelper("yield",function(t){for(var r=t.data.view;r&&!e(r,"layout");)r=r._contextView?r._contextView:e(r,"parentView");r._yield(this,t)})}(),function(){Ember.Handlebars.registerHelper("loc",function(e){return Ember.String.loc(e)})}(),function(){var e=Ember.set;Ember.get,Ember.Checkbox=Ember.View.extend({classNames:["ember-checkbox"],tagName:"input",attributeBindings:["type","checked","indeterminate","disabled","tabindex","name"],type:"checkbox",checked:!1,disabled:!1,indeterminate:!1,init:function(){this._super(),this.on("change",this,this._updateElementValue)},didInsertElement:function(){this._super(),this.get("element").indeterminate=!!this.get("indeterminate")},_updateElementValue:function(){e(this,"checked",this.$().prop("checked"))}})}(),function(){function e(e,r,n){var i=t(r,e),o=t(r,"onEvent"),a=t(r,"value");(o===e||"keyPress"===o&&"key-press"===e)&&r.sendAction("action",a),r.sendAction(e,a),(i||o===e)&&(t(r,"bubbles")||n.stopPropagation())}var t=Ember.get,r=Ember.set;Ember.TextSupport=Ember.Mixin.create({value:"",attributeBindings:["placeholder","disabled","maxlength","tabindex","readonly"],placeholder:null,disabled:!1,maxlength:null,init:function(){this._super(),this.on("focusOut",this,this._elementValueDidChange),this.on("change",this,this._elementValueDidChange),this.on("paste",this,this._elementValueDidChange),this.on("cut",this,this._elementValueDidChange),this.on("input",this,this._elementValueDidChange),this.on("keyUp",this,this.interpretKeyEvents)},action:null,onEvent:"enter",bubbles:!1,interpretKeyEvents:function(e){var t=Ember.TextSupport.KEY_EVENTS,r=t[e.keyCode];return this._elementValueDidChange(),r?this[r](e):void 0},_elementValueDidChange:function(){r(this,"value",this.$().val())},insertNewline:function(t){e("enter",this,t),e("insert-newline",this,t)},cancel:function(t){e("escape-press",this,t)},focusIn:function(t){e("focus-in",this,t)},focusOut:function(t){e("focus-out",this,t)},keyPress:function(t){e("key-press",this,t)}}),Ember.TextSupport.KEY_EVENTS={13:"insertNewline",27:"cancel"}}(),function(){Ember.get,Ember.set,Ember.TextField=Ember.Component.extend(Ember.TextSupport,{classNames:["ember-text-field"],tagName:"input",attributeBindings:["type","value","size","pattern","name"],value:"",type:"text",size:null,pattern:null})}(),function(){var e=Ember.get,t=Ember.set;Ember.Button=Ember.View.extend(Ember.TargetActionSupport,{classNames:["ember-button"],classNameBindings:["isActive"],tagName:"button",propagateEvents:!1,attributeBindings:["type","disabled","href","tabindex"],targetObject:Ember.computed(function(){var t=e(this,"target"),r=e(this,"context"),n=e(this,"templateData");return"string"!=typeof t?t:Ember.Handlebars.get(r,t,{data:n})}).property("target"),type:Ember.computed(function(){var e=this.tagName;return"input"===e||"button"===e?"button":void 0}),disabled:!1,href:Ember.computed(function(){return"a"===this.tagName?"#":null}),mouseDown:function(){return e(this,"disabled")||(t(this,"isActive",!0),this._mouseDown=!0,this._mouseEntered=!0),e(this,"propagateEvents")},mouseLeave:function(){this._mouseDown&&(t(this,"isActive",!1),this._mouseEntered=!1)},mouseEnter:function(){this._mouseDown&&(t(this,"isActive",!0),this._mouseEntered=!0)},mouseUp:function(){return e(this,"isActive")&&(this.triggerAction(),t(this,"isActive",!1)),this._mouseDown=!1,this._mouseEntered=!1,e(this,"propagateEvents")},keyDown:function(e){(13===e.keyCode||32===e.keyCode)&&this.mouseDown()},keyUp:function(e){(13===e.keyCode||32===e.keyCode)&&this.mouseUp()},touchStart:function(e){return this.mouseDown(e)},touchEnd:function(e){return this.mouseUp(e)},init:function(){this._super()}})}(),function(){var e=Ember.get;Ember.set,Ember.TextArea=Ember.Component.extend(Ember.TextSupport,{classNames:["ember-text-area"],tagName:"textarea",attributeBindings:["rows","cols","name"],rows:null,cols:null,_updateElementValue:Ember.observer("value",function(){var t=e(this,"value"),r=this.$();r&&t!==r.val()&&r.val(t)}),init:function(){this._super(),this.on("didInsertElement",this,this._updateElementValue)}})}(),function(){var e=Ember.set,t=Ember.get,r=Ember.EnumerableUtils.indexOf,n=Ember.EnumerableUtils.indexesOf,i=Ember.EnumerableUtils.forEach,o=Ember.EnumerableUtils.replace,a=Ember.isArray;Ember.Handlebars.compile,Ember.SelectOption=Ember.View.extend({tagName:"option",attributeBindings:["value","selected"],defaultTemplate:function(e,t){t={data:t.data,hash:{}},Ember.Handlebars.helpers.bind.call(e,"view.label",t)},init:function(){this.labelPathDidChange(),this.valuePathDidChange(),this._super()},selected:Ember.computed(function(){var e=t(this,"content"),n=t(this,"parentView.selection");return t(this,"parentView.multiple")?n&&r(n,e.valueOf())>-1:e==n}).property("content","parentView.selection"),labelPathDidChange:Ember.observer("parentView.optionLabelPath",function(){var e=t(this,"parentView.optionLabelPath");e&&Ember.defineProperty(this,"label",Ember.computed(function(){return t(this,e)}).property(e))}),valuePathDidChange:Ember.observer("parentView.optionValuePath",function(){var e=t(this,"parentView.optionValuePath");
e&&Ember.defineProperty(this,"value",Ember.computed(function(){return t(this,e)}).property(e))})}),Ember.SelectOptgroup=Ember.CollectionView.extend({tagName:"optgroup",attributeBindings:["label"],selectionBinding:"parentView.selection",multipleBinding:"parentView.multiple",optionLabelPathBinding:"parentView.optionLabelPath",optionValuePathBinding:"parentView.optionValuePath",itemViewClassBinding:"parentView.optionView"}),Ember.Select=Ember.View.extend({tagName:"select",classNames:["ember-select"],defaultTemplate:Ember.Handlebars.template(function(e,t,r,n,i){function o(e,t){var n,i,o="";return t.buffer.push('<option value="">'),n={},i={},t.buffer.push(p(r._triageMustache.call(e,"view.prompt",{hash:{},contexts:[e],types:["ID"],hashContexts:i,hashTypes:n,data:t}))),t.buffer.push("</option>"),o}function a(e,t){var n,i,o;i={},o={},n=r.each.call(e,"view.groupedContent",{hash:{},inverse:d.noop,fn:d.program(4,s,t),contexts:[e],types:["ID"],hashContexts:o,hashTypes:i,data:t}),n||0===n?t.buffer.push(n):t.buffer.push("")}function s(e,t){var n,i;n={content:e,label:e},i={content:"ID",label:"ID"},t.buffer.push(p(r.view.call(e,"view.groupView",{hash:{content:"content",label:"label"},contexts:[e],types:["ID"],hashContexts:n,hashTypes:i,data:t})))}function u(e,t){var n,i,o;i={},o={},n=r.each.call(e,"view.content",{hash:{},inverse:d.noop,fn:d.program(7,c,t),contexts:[e],types:["ID"],hashContexts:o,hashTypes:i,data:t}),n||0===n?t.buffer.push(n):t.buffer.push("")}function c(e,t){var n,i;n={content:e},i={content:"ID"},t.buffer.push(p(r.view.call(e,"view.optionView",{hash:{content:""},contexts:[e],types:["ID"],hashContexts:n,hashTypes:i,data:t})))}this.compilerInfo=[4,">= 1.0.0"],r=this.merge(r,Ember.Handlebars.helpers),i=i||{};var l,h,m,f="",p=this.escapeExpression,d=this;return h={},m={},l=r["if"].call(t,"view.prompt",{hash:{},inverse:d.noop,fn:d.program(1,o,i),contexts:[t],types:["ID"],hashContexts:m,hashTypes:h,data:i}),(l||0===l)&&i.buffer.push(l),h={},m={},l=r["if"].call(t,"view.optionGroupPath",{hash:{},inverse:d.program(6,u,i),fn:d.program(3,a,i),contexts:[t],types:["ID"],hashContexts:m,hashTypes:h,data:i}),(l||0===l)&&i.buffer.push(l),f}),attributeBindings:["multiple","disabled","tabindex","name"],multiple:!1,disabled:!1,content:null,selection:null,value:Ember.computed(function(e,r){if(2===arguments.length)return r;var n=t(this,"optionValuePath").replace(/^content\.?/,"");return n?t(this,"selection."+n):t(this,"selection")}).property("selection"),prompt:null,optionLabelPath:"content",optionValuePath:"content",optionGroupPath:null,groupView:Ember.SelectOptgroup,groupedContent:Ember.computed(function(){var e=t(this,"optionGroupPath"),r=Ember.A(),n=t(this,"content")||[];return i(n,function(n){var i=t(n,e);t(r,"lastObject.label")!==i&&r.pushObject({label:i,content:Ember.A()}),t(r,"lastObject.content").push(n)}),r}).property("optionGroupPath","content.@each"),optionView:Ember.SelectOption,_change:function(){t(this,"multiple")?this._changeMultiple():this._changeSingle()},selectionDidChange:Ember.observer("selection.@each",function(){var r=t(this,"selection");if(t(this,"multiple")){if(!a(r))return e(this,"selection",Ember.A([r])),void 0;this._selectionDidChangeMultiple()}else this._selectionDidChangeSingle()}),valueDidChange:Ember.observer("value",function(){var e,r=t(this,"content"),n=t(this,"value"),i=t(this,"optionValuePath").replace(/^content\.?/,""),o=i?t(this,"selection."+i):t(this,"selection");n!==o&&(e=r?r.find(function(e){return n===(i?t(e,i):e)}):null,this.set("selection",e))}),_triggerChange:function(){var e=t(this,"selection"),r=t(this,"value");Ember.isNone(e)||this.selectionDidChange(),Ember.isNone(r)||this.valueDidChange(),this._change()},_changeSingle:function(){var r=this.$()[0].selectedIndex,n=t(this,"content"),i=t(this,"prompt");if(n&&t(n,"length")){if(i&&0===r)return e(this,"selection",null),void 0;i&&(r-=1),e(this,"selection",n.objectAt(r))}},_changeMultiple:function(){var r=this.$("option:selected"),n=t(this,"prompt"),i=n?1:0,s=t(this,"content"),u=t(this,"selection");if(s&&r){var c=r.map(function(){return this.index-i}).toArray(),l=s.objectsAt(c);a(u)?o(u,0,t(u,"length"),l):e(this,"selection",l)}},_selectionDidChangeSingle:function(){var e=this.get("element");if(e){var n=t(this,"content"),i=t(this,"selection"),o=n?r(n,i):-1,a=t(this,"prompt");a&&(o+=1),e&&(e.selectedIndex=o)}},_selectionDidChangeMultiple:function(){var e,i=t(this,"content"),o=t(this,"selection"),a=i?n(i,o):[-1],s=t(this,"prompt"),u=s?1:0,c=this.$("option");c&&c.each(function(){e=this.index>-1?this.index-u:-1,this.selected=r(a,e)>-1})},init:function(){this._super(),this.on("didInsertElement",this,this._triggerChange),this.on("change",this,this._change)}})}(),function(){Ember.Handlebars.registerHelper("input",function(e){var t=e.hash,r=(e.hashTypes,t.type),n=t.on;return delete t.type,delete t.on,"checkbox"===r?Ember.Handlebars.helpers.view.call(this,Ember.Checkbox,e):(r&&(t.type=r),t.onEvent=n||"enter",Ember.Handlebars.helpers.view.call(this,Ember.TextField,e))}),Ember.Handlebars.registerHelper("textarea",function(e){return e.hash,e.hashTypes,Ember.Handlebars.helpers.view.call(this,Ember.TextArea,e)})}(),function(){Ember.ComponentLookup=Ember.Object.extend({lookupFactory:function(e,t){t=t||this.container;var r="component:"+e,n="template:components/"+e,i=t&&t.has(n);i&&t.injection(r,"layout",n);var o=t.lookupFactory(r);return i||o?(o||(t.register(r,Ember.Component),o=t.lookupFactory(r)),o):void 0}})}(),function(){function e(){Ember.Handlebars.bootstrap(Ember.$(document))}function t(e){e.register("component-lookup:main",Ember.ComponentLookup)}Ember.Handlebars.bootstrap=function(e){var t='script[type="text/x-handlebars"], script[type="text/x-raw-handlebars"]';Ember.$(t,e).each(function(){var e=Ember.$(this),t="text/x-raw-handlebars"===e.attr("type")?Ember.$.proxy(Handlebars.compile,Handlebars):Ember.$.proxy(Ember.Handlebars.compile,Ember.Handlebars),r=e.attr("data-template-name")||e.attr("id")||"application",n=t(e.html());if(void 0!==Ember.TEMPLATES[r])throw new Ember.Error('Template named "'+r+'" already exists.');Ember.TEMPLATES[r]=n,e.remove()})},Ember.onLoad("Ember.Application",function(r){r.initializer({name:"domTemplates",initialize:e}),r.initializer({name:"registerComponentLookup",after:"domTemplates",initialize:t})})}(),function(){Ember.runLoadHooks("Ember.Handlebars",Ember.Handlebars)}(),function(){e("route-recognizer",[],function(){"use strict";function e(e){this.string=e}function t(e){this.name=e}function r(e){this.name=e}function n(){}function i(i,o,a){"/"===i.charAt(0)&&(i=i.substr(1));for(var s=i.split("/"),u=[],c=0,l=s.length;l>c;c++){var h,m=s[c];(h=m.match(/^:([^\/]+)$/))?(u.push(new t(h[1])),o.push(h[1]),a.dynamics++):(h=m.match(/^\*([^\/]+)$/))?(u.push(new r(h[1])),o.push(h[1]),a.stars++):""===m?u.push(new n):(u.push(new e(m)),a.statics++)}return u}function o(e){this.charSpec=e,this.nextStates=[]}function a(e){return e.sort(function(e,t){return e.types.stars!==t.types.stars?e.types.stars-t.types.stars:e.types.dynamics!==t.types.dynamics?e.types.dynamics-t.types.dynamics:e.types.statics!==t.types.statics?t.types.statics-e.types.statics:0})}function s(e,t){for(var r=[],n=0,i=e.length;i>n;n++){var o=e[n];r=r.concat(o.match(t))}return r}function u(e,t,r){for(var n=e.handlers,i=e.regex,o=t.match(i),a=1,s=[],u=0,c=n.length;c>u;u++){var l,h,m=n[u],f=m.names,p={},d=m.queryParams||[],b={};for(l=0,h=f.length;h>l;l++)p[f[l]]=o[a++];for(l=0,h=d.length;h>l;l++){var v=d[l];r[v]&&(b[v]=r[v])}var E={handler:m.handler,params:p,isDynamic:!!f.length};d&&d.length>0&&(E.queryParams=b),s.push(E)}return s}function c(e,t){return t.eachChar(function(t){e=e.put(t)}),e}function l(e,t,r){this.path=e,this.matcher=t,this.delegate=r}function h(e){this.routes={},this.children={},this.queryParams={},this.target=e}function m(e,t,r){return function(n,i){var o=e+n;return i?(i(m(o,t,r)),void 0):new l(e+n,t,r)}}function f(e,t,r,n){for(var i=0,o=0,a=e.length;a>o;o++)i+=e[o].path.length;t=t.substr(i);var s={path:t,handler:r};n&&(s.queryParams=n),e.push(s)}function p(e,t,r,n){var i=t.routes,o=t.queryParams;for(var a in i)if(i.hasOwnProperty(a)){var s=e.slice();f(s,a,i[a],o[a]),t.children[a]?p(s,t.children[a],r,n):r.call(n,s)}}var d=["/",".","*","+","?","|","(",")","[","]","{","}","\\"],b=new RegExp("(\\"+d.join("|\\")+")","g");e.prototype={eachChar:function(e){for(var t,r=this.string,n=0,i=r.length;i>n;n++)t=r.charAt(n),e({validChars:t})},regex:function(){return this.string.replace(b,"\\$1")},generate:function(){return this.string}},t.prototype={eachChar:function(e){e({invalidChars:"/",repeat:!0})},regex:function(){return"([^/]+)"},generate:function(e){return e[this.name]}},r.prototype={eachChar:function(e){e({invalidChars:"",repeat:!0})},regex:function(){return"(.+)"},generate:function(e){return e[this.name]}},n.prototype={eachChar:function(){},regex:function(){return""},generate:function(){return""}},o.prototype={get:function(e){for(var t=this.nextStates,r=0,n=t.length;n>r;r++){var i=t[r],o=i.charSpec.validChars===e.validChars;if(o=o&&i.charSpec.invalidChars===e.invalidChars)return i}},put:function(e){var t;return(t=this.get(e))?t:(t=new o(e),this.nextStates.push(t),e.repeat&&t.nextStates.push(t),t)},match:function(e){for(var t,r,n,i=this.nextStates,o=[],a=0,s=i.length;s>a;a++)t=i[a],r=t.charSpec,"undefined"!=typeof(n=r.validChars)?-1!==n.indexOf(e)&&o.push(t):"undefined"!=typeof(n=r.invalidChars)&&-1===n.indexOf(e)&&o.push(t);return o}};var v=function(){this.rootState=new o,this.names={}};return v.prototype={add:function(e,t){for(var r,o=this.rootState,a="^",s={statics:0,dynamics:0,stars:0},u=[],l=[],h=!0,m=0,f=e.length;f>m;m++){var p=e[m],d=[],b=i(p.path,d,s);l=l.concat(b);for(var v=0,E=b.length;E>v;v++){var g=b[v];g instanceof n||(h=!1,o=o.put({validChars:"/"}),a+="/",o=c(o,g),a+=g.regex())}var y={handler:p.handler,names:d};p.queryParams&&(y.queryParams=p.queryParams),u.push(y)}h&&(o=o.put({validChars:"/"}),a+="/"),o.handlers=u,o.regex=new RegExp(a+"$"),o.types=s,(r=t&&t.as)&&(this.names[r]={segments:l,handlers:u})},handlersFor:function(e){var t=this.names[e],r=[];if(!t)throw new Error("There is no route named "+e);for(var n=0,i=t.handlers.length;i>n;n++)r.push(t.handlers[n]);return r},hasRoute:function(e){return!!this.names[e]},generate:function(e,t){var r=this.names[e],i="";if(!r)throw new Error("There is no route named "+e);for(var o=r.segments,a=0,s=o.length;s>a;a++){var u=o[a];u instanceof n||(i+="/",i+=u.generate(t))}return"/"!==i.charAt(0)&&(i="/"+i),t&&t.queryParams&&(i+=this.generateQueryString(t.queryParams,r.handlers)),i},generateQueryString:function(e,t){for(var r=[],n=[],i=0;i<t.length;i++){var o=t[i].queryParams;o&&n.push.apply(n,o)}for(var a in e)if(e.hasOwnProperty(a)){if(-1===n.indexOf(a))throw'Query param "'+a+'" is not specified as a valid param for this route';var s=e[a],u=encodeURIComponent(a);s!==!0&&(u+="="+encodeURIComponent(s)),r.push(u)}return 0===r.length?"":"?"+r.join("&")},parseQueryString:function(e){for(var t=e.split("&"),r={},n=0;n<t.length;n++){var i=t[n].split("="),o=decodeURIComponent(i[0]),a=i[1]?decodeURIComponent(i[1]):!0;r[o]=a}return r},recognize:function(e){var t,r,n,i,o=[this.rootState],c={};if(i=e.indexOf("?"),-1!==i){var l=e.substr(i+1,e.length);e=e.substr(0,i),c=this.parseQueryString(l)}for("/"!==e.charAt(0)&&(e="/"+e),t=e.length,t>1&&"/"===e.charAt(t-1)&&(e=e.substr(0,t-1)),r=0,n=e.length;n>r&&(o=s(o,e.charAt(r)),o.length);r++);var h=[];for(r=0,n=o.length;n>r;r++)o[r].handlers&&h.push(o[r]);o=a(h);var m=h[0];return m&&m.handlers?u(m,e,c):void 0}},l.prototype={to:function(e,t){var r=this.delegate;if(r&&r.willAddRoute&&(e=r.willAddRoute(this.matcher.target,e)),this.matcher.add(this.path,e),t){if(0===t.length)throw new Error("You must have an argument in the function passed to `to`");this.matcher.addChild(this.path,e,t,this.delegate)}return this},withQueryParams:function(){if(0===arguments.length)throw new Error("you must provide arguments to the withQueryParams method");for(var e=0;e<arguments.length;e++)if("string"!=typeof arguments[e])throw new Error('you should call withQueryParams with a list of strings, e.g. withQueryParams("foo", "bar")');var t=[].slice.call(arguments);this.matcher.addQueryParams(this.path,t)}},h.prototype={add:function(e,t){this.routes[e]=t},addQueryParams:function(e,t){this.queryParams[e]=t},addChild:function(e,t,r,n){var i=new h(t);this.children[e]=i;var o=m(e,i,n);n&&n.contextEntered&&n.contextEntered(t,o),r(o)}},v.prototype.map=function(e,t){var r=new h;e(m("",r,this.delegate)),p([],r,function(e){t?t(this,e):this.add(e)},this)},v})}(),function(){e("router",["route-recognizer","rsvp","exports"],function(e,t,r){"use strict";function n(e,t){this.router=e,this.promise=t,this.data={},this.resolvedModels={},this.providedModels={},this.providedModelsArray=[],this.sequence=++n.currentSequence,this.params={}}function i(){this.recognizer=new k}function o(e,t){return new n(e,H.reject(t))}function a(e,t,r,n){var i,o,a=t.length,u={},c=e.currentHandlerInfos||[],l={},m=e.currentParams||{},f=e.activeTransition,p={};for(r=L.call(r),h(l,n),i=t.length-1;i>=0;i--){var d=t[i],b=d.handler,v=c[i],E=!1;if(v&&v.name===d.handler||(E=!0),d.isDynamic)if(o=s(r,b,f,!0,l))E=!0,u[b]=o;else{p[b]={};for(var g in d.params)if(d.params.hasOwnProperty(g)){var w=d.params[g];m[g]!==w&&(E=!0),p[b][g]=l[g]=w}}else if(d.hasOwnProperty("names"))if(r.length&&(E=!0),o=s(r,b,f,d.names[0],l))u[b]=o;else{var _=d.names;p[b]={};for(var C=0,O=_.length;O>C;++C){var A=_[C];p[b][A]=l[A]=l[A]||m[A]}}v&&!y(v.queryParams,d.queryParams)&&(E=!0),E&&(a=i)}if(r.length>0)throw new Error("More context objects were passed than there are dynamic segments for the route: "+t[t.length-1].handler);var P=c[a-1],x=P&&P.handler;return{matchPoint:a,providedModels:u,params:l,handlerParams:p,pivotHandler:x}}function s(e,t,r,n,i){if(e.length&&n){var o=e.pop();if(!u(o))return o;i[n]=o.toString()}else if(r)return r.resolvedModels[t]||n&&r.providedModels[t]}function u(e){return"string"==typeof e||e instanceof String||"number"==typeof e||e instanceof Number}function c(e,t){for(var r=e.recognizer.handlersFor(t),n=[],i=0;i<r.length;i++)n.push.apply(n,r[i].queryParams||[]);return n}function l(e,t,r,n){var i,o,s,u,c,l=e.recognizer.handlersFor(t),p={},d=f(e,l,n),b=a(e,d,r).matchPoint;for(p.queryParams={},c=0;c<l.length;c++)o=l[c],s=e.getHandler(o.handler),u=o.names,u.length&&(i=c>=b?r.shift():s.context,h(p,j(s,i,u))),n!==!1&&(m(p.queryParams,e.currentQueryParams,o.queryParams),m(p.queryParams,n,o.queryParams));return y(p.queryParams,{})&&delete p.queryParams,p}function h(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])}function m(e,t,r){if(t&&r)for(var n=0;n<r.length;n++){var i,o=r[n];t.hasOwnProperty(o)&&(i=t[o],null===i||i===!1||"undefined"==typeof i?delete e[o]:e[o]=t[o])}}function f(e,t,r){for(var n=[],i=0;i<t.length;i++){var o=t[i],a={handler:o.handler,names:o.names,context:o.context,isDynamic:o.isDynamic},s={};r!==!1&&(m(s,e.currentQueryParams,o.queryParams),m(s,r,o.queryParams)),o.queryParams&&o.queryParams.length>0&&(a.queryParams=s),n.push(a)}return n}function p(e,t,r){var n=e.currentHandlerInfos,i=n[n.length-1],o=i.name;return I(e,"Attempting query param transition"),d(e,[o,t],r)}function d(e,t,r){var n=A(t),i=n[0],o=n[1],a=e.recognizer.handlersFor(i[0]),s=f(e,a,o);return I(e,"Attempting transition to "+i[0]),x(e,s,L.call(i,1),e.currentParams,o,null,r)}function b(e,t,r){var n,a,s=e.recognizer.recognize(t),u=(e.currentHandlerInfos,{});if(I(e,"Attempting URL transition to "+t),s)for(n=0,a=s.length;a>n;++n)if(e.getHandler(s[n].handler).inaccessibleByURL){s=null;break}if(!s)return o(e,new i.UnrecognizedURLError(t));for(n=0,a=s.length;a>n;n++)h(u,s[n].queryParams);return x(e,s,[],{},u,null,r)}function v(e,t){var r=e.router,n=w(r.currentHandlerInfos||[],t);r.targetHandlerInfos=t,g(n.exited,function(e){var t=e.handler;delete t.context,t.exit&&t.exit()});var i=n.unchanged.slice();r.currentHandlerInfos=i,g(n.updatedContext,function(t){E(e,i,t,!1)}),g(n.entered,function(t){E(e,i,t,!0)})}function E(e,t,r,n){var o=r.handler,a=r.context;try{n&&o.enter&&o.enter(),D(e),C(o,a),O(o,r.queryParams),o.setup&&o.setup(a,r.queryParams),D(e)}catch(s){throw s instanceof i.TransitionAborted||e.trigger(!0,"error",s,e,o),s}t.push(r)}function g(e,t){for(var r=0,n=e.length;n>r;r++)t(e[r])}function y(e,t){e=e||{},t=t||{};var r,n=[];for(r in e)if(e.hasOwnProperty(r)){if(t[r]!==e[r])return!1;n.push(r)}for(r in t)if(t.hasOwnProperty(r)&&!~n.indexOf(r))return!1;return!0}function w(e,t){var r,n,i,o,a,s={updatedContext:[],exited:[],entered:[],unchanged:[]};for(o=0,a=t.length;a>o;o++){var u=e[o],c=t[o];u&&u.handler===c.handler?y(u.queryParams,c.queryParams)||(i=!0):r=!0,r?(s.entered.push(c),u&&s.exited.unshift(u)):n||u.context!==c.context||i?(n=!0,s.updatedContext.push(c)):s.unchanged.push(u)}for(o=t.length,a=e.length;a>o;o++)s.exited.unshift(e[o]);return s}function _(e,t,r,n){if(e.triggerEvent)return e.triggerEvent(t,r,n),void 0;var i=n.shift();if(!t){if(r)return;throw new Error("Could not trigger event '"+i+"'. There are no active handlers")}for(var o=!1,a=t.length-1;a>=0;a--){var s=t[a],u=s.handler;if(u.events&&u.events[i]){if(u.events[i].apply(u,n)!==!0)return;o=!0}}if(!o&&!r)throw new Error("Nothing handled the event '"+i+"'.")}function C(e,t){e.context=t,e.contextDidChange&&e.contextDidChange()}function O(e,t){e.queryParams=t,e.queryParamsDidChange&&e.queryParamsDidChange()}function A(e){var t,r,n=e&&e.length;return n&&n>0&&e[n-1]&&e[n-1].hasOwnProperty("queryParams")?(r=e[n-1].queryParams,t=L.call(e,0,n-1),[t,r]):[e,null]}function P(e,t,r){for(var n=V(e,t),i=0;i<n.length;++i){var o=n[i];o.context=r.providedModels[o.name]}var a={router:e,isAborted:!1};v(a,n)}function x(e,t,r,i,o,s,u){function c(){D(b);try{S(b,v),_(e,e.currentHandlerInfos,!0,["didTransition"]),e.didTransition&&e.didTransition(v),I(e,b.sequence,"TRANSITION COMPLETE."),b.isActive=!1,d.resolve(v[v.length-1].handler)}catch(t){d.reject(t)}b.isAborted||(e.activeTransition=null)}function l(e){d.reject(e)}var h=a(e,t,r,i,o),m=t[t.length-1].handler,f=!1,p=e.currentHandlerInfos;if(u)return P(e,t,h);if(e.activeTransition){if(T(e.activeTransition,m,r,o))return e.activeTransition;e.activeTransition.abort(),f=!0}var d=H.defer(),b=new n(e,d.promise);b.targetName=m,b.providedModels=h.providedModels,b.providedModelsArray=r,b.params=h.params,b.data=s||{},b.queryParams=o,b.pivotHandler=h.pivotHandler,e.activeTransition=b;var v=V(e,t);return b.handlerInfos=v,f||_(e,p,!0,["willTransition",b]),I(e,b.sequence,"Beginning validation for transition to "+b.targetName),N(b,h.matchPoint,h.handlerParams).then(c,l),b}function V(e,t){for(var r=[],n=0,i=t.length;i>n;++n){var o=t[n],a=o.isDynamic||o.names&&o.names.length,s={isDynamic:!!a,name:o.handler,handler:e.getHandler(o.handler)};o.queryParams&&(s.queryParams=o.queryParams),r.push(s)}return r}function T(e,t,r,n){if(e.targetName!==t)return!1;var i=e.providedModelsArray;if(i.length!==r.length)return!1;for(var o=0,a=i.length;a>o;++o)if(i[o]!==r[o])return!1;return y(e.queryParams,n)?!0:!1}function S(e,t){I(e.router,e.sequence,"Validation succeeded, finalizing transition;");var r,n=e.router,i=(e.sequence,t[t.length-1].name),o=e.urlMethod,a=[],s=e.providedModelsArray.slice();for(r=t.length-1;r>=0;--r){var c=t[r];if(c.isDynamic){var m=s.pop();a.unshift(u(m)?m.toString():c.context)}c.handler.inaccessibleByURL&&(o=null)}var f={};for(r=t.length-1;r>=0;--r)h(f,t[r].queryParams);n.currentQueryParams=f;var p=l(n,i,a,e.queryParams);if(n.currentParams=p,o){var d=n.recognizer.generate(i,p);"replace"===o?n.replaceURL(d):n.updateURL(d)}v(e,t)}function N(e,t,r){function o(t){return e.isAborted?(I(e.router,e.sequence,"detected abort."),H.reject(new i.TransitionAborted)):t}function a(t){return t instanceof i.TransitionAborted||e.isAborted?H.reject(t):(e.abort(),I(f,v,b+": handling error: "+t),e.trigger(!0,"error",t,e,p.handler),H.reject(t))}function s(){I(f,v,b+": calling beforeModel hook");var t;t=p.queryParams?[p.queryParams,e]:[e];var r=d.beforeModel&&d.beforeModel.apply(d,t);return r instanceof n?null:r}function u(){I(f,v,b+": resolving model");var i=R(p,e,r[b],m>=t);return i instanceof n?null:i}function c(t){I(f,v,b+": calling afterModel hook"),e.resolvedModels[p.name]=t;var r;r=p.queryParams?[t,p.queryParams,e]:[t,e];var i=d.afterModel&&d.afterModel.apply(d,r);return i instanceof n?null:i}function l(){return I(f,v,b+": validation succeeded, proceeding"),p.context=e.resolvedModels[p.name],e.resolveIndex++,N(e,t,r)}var h=e.handlerInfos,m=e.resolveIndex;if(m===h.length)return H.resolve(e.resolvedModels);var f=e.router,p=h[m],d=p.handler,b=p.name,v=e.sequence;return t>m?(I(f,v,b+": using context from already-active handler"),e.resolvedModels[p.name]=e.providedModels[p.name]||p.handler.context,l()):(e.trigger(!0,"willResolveModel",e,d),H.resolve().then(o).then(s).then(o).then(u).then(o).then(c).then(o).then(null,a).then(l))}function D(e){if(e.isAborted)throw I(e.router,e.sequence,"detected abort."),new i.TransitionAborted}function R(e,t,r,n){var i,o=e.handler,a=e.name;if(!n&&o.hasOwnProperty("context"))return o.context;if(t.providedModels.hasOwnProperty(a)){var s=t.providedModels[a];return"function"==typeof s?s():s}return i=e.queryParams?[r||{},e.queryParams,t]:[r||{},t,e.queryParams],o.model&&o.model.apply(o,i)}function I(e,t,r){e.log&&(3===arguments.length?e.log("Transition #"+t+": "+r):(r=t,e.log(r)))}function M(e,t,r){var n=t[0]||"/";return 1===t.length&&t[0].hasOwnProperty("queryParams")?p(e,t[0],r):"/"===n.charAt(0)?b(e,n,r):d(e,L.call(t),r)}function j(e,t,r){var n={};if(u(t))return n[r[0]]=t,n;if(e.serialize)return e.serialize(t,r);if(1===r.length){var i=r[0];return n[i]=/_id$/.test(i)?t.id:t,n}}var k=e,H=t,L=Array.prototype.slice;n.currentSequence=0,n.prototype={targetName:null,urlMethod:"update",providedModels:null,resolvedModels:null,params:null,pivotHandler:null,resolveIndex:0,handlerInfos:null,isActive:!0,promise:null,data:null,then:function(e,t){return this.promise.then(e,t)},abort:function(){return this.isAborted?this:(I(this.router,this.sequence,this.targetName+": transition was aborted"),this.isAborted=!0,this.isActive=!1,this.router.activeTransition=null,this)},retry:function(){this.abort();var e=this.router.recognizer.handlersFor(this.targetName),t=f(this.router,e,this.queryParams),r=x(this.router,t,this.providedModelsArray,this.params,this.queryParams,this.data);return r},method:function(e){return this.urlMethod=e,this},trigger:function(e){var t=L.call(arguments);"boolean"==typeof e?t.shift():e=!1,_(this.router,this.handlerInfos.slice(0,this.resolveIndex+1),e,t)},toString:function(){return"Transition (sequence "+this.sequence+")"}},i.Transition=n,r["default"]=i,i.UnrecognizedURLError=function(e){this.message=e||"UnrecognizedURLError",this.name="UnrecognizedURLError"},i.TransitionAborted=function(e){this.message=e||"TransitionAborted",this.name="TransitionAborted"},i.prototype={map:function(e){this.recognizer.delegate=this.delegate,this.recognizer.map(e,function(e,t){var r=t[t.length-1].handler,n=[t,{as:r}];e.add.apply(e,n)})},hasRoute:function(e){return this.recognizer.hasRoute(e)},reset:function(){g(this.currentHandlerInfos||[],function(e){var t=e.handler;t.exit&&t.exit()}),this.currentHandlerInfos=null,this.targetHandlerInfos=null},activeTransition:null,handleURL:function(e){var t=L.call(arguments);return"/"!==e.charAt(0)&&(t[0]="/"+e),M(this,t).method(null)},updateURL:function(){throw new Error("updateURL is not implemented")},replaceURL:function(e){this.updateURL(e)},transitionTo:function(){return M(this,arguments)},intermediateTransitionTo:function(){M(this,arguments,!0)},replaceWith:function(){return M(this,arguments).method("replace")},paramsForHandler:function(e){var t=A(L.call(arguments,1));return l(this,e,t[0],t[1])},queryParamsForHandler:function(e){return c(this,e)},generate:function(e){var t=A(L.call(arguments,1)),r=t[0],n=t[1],i=l(this,e,r,n),o=c(this,e),a=[];for(var s in n)n.hasOwnProperty(s)&&!~o.indexOf(s)&&a.push(s);if(a.length>0){var u="You supplied the params ";throw u+=a.map(function(e){return'"'+e+"="+n[e]+'"'}).join(" and "),u+=' which are not valid for the "'+e+'" handler or its parents',new Error(u)}return this.recognizer.generate(e,i)},isActive:function(e){var t,r,n=A(L.call(arguments,1)),i=n[0],o=n[1],a={},s={},c=this.targetHandlerInfos,l=!1;if(!c)return!1;for(var f=this.recognizer.handlersFor(c[c.length-1].name),p=c.length-1;p>=0;p--)if(r=c[p],r.name===e&&(l=!0),l){var d=f[p];if(h(a,r.queryParams),o!==!1&&(h(s,r.queryParams),m(s,o,d.queryParams)),r.isDynamic&&i.length>0)if(t=i.pop(),u(t)){var b=d.names[0];if(""+t!==this.currentParams[b])return!1}else if(r.context!==t)return!1}return 0===i.length&&l&&y(a,s)},trigger:function(){var e=L.call(arguments);_(this,this.currentHandlerInfos,!1,e)},log:null}})}(),function(){function e(e){this.parent=e,this.matches=[]}function t(e,t,r){r=r||{},"string"!=typeof r.path&&(r.path="/"+t),e.parent&&"application"!==e.parent&&(t=e.parent+"."+t),e.push(r.path,t,null,r.queryParams)}e.prototype={resource:function(r,n,i){if(2===arguments.length&&"function"==typeof n&&(i=n,n={}),1===arguments.length&&(n={}),"string"!=typeof n.path&&(n.path="/"+r),i){var o=new e(r);t(o,"loading"),t(o,"error",{path:"/_unused_dummy_error_path_route_"+r+"/:error"}),i.call(o),this.push(n.path,r,o.generate(),n.queryParams)}else this.push(n.path,r,null,n.queryParams)},push:function(e,t,r,n){var i=t.split(".");(""===e||"/"===e||"index"===i[i.length-1])&&(this.explicitIndex=!0),this.matches.push([e,t,r,n])},route:function(e,r){t(this,e,r)},generate:function(){var e=this.matches;return this.explicitIndex||this.route("index",{path:"/"}),function(t){for(var r=0,n=e.length;n>r;r++){var i=e[r];t(i[0]).to(i[1],i[2])}}}},e.map=function(t){var r=new e;return t.call(r),r},Ember.RouterDSL=e}(),function(){var e=Ember.get;Ember.controllerFor=function(e,t,r){return e.lookup("controller:"+t,r)},Ember.generateController=function(t,r,n){var i,o,a,s,u;return u=n&&Ember.isArray(n)?"array":n?"object":"basic",s="controller:"+u,i=t.lookupFactory(s).extend({isGenerated:!0,toString:function(){return"(generated "+r+" controller)"}}),o="controller:"+r,t.register(o,i),a=t.lookup(o),e(a,"namespace.LOG_ACTIVE_GENERATION")&&Ember.Logger.info("generated -> "+o,{fullName:o}),a}}(),function(){function e(e,t,r){for(var n=t.handlerInfos,i=!1,o=n.length-1;o>=0;--o){var a=n[o],s=a.handler;if(i){if(r(s,n[o+1].handler)!==!0)return!1}else e===s&&(i=!0)}return!0}function r(e,t,r){var i,o=e.router,a=(t.routeName.split(".").pop(),"application"===e.routeName?"":e.routeName+".");return i=a+r,n(o,i)?i:void 0}function n(e,t){var r=e.container;return e.hasRoute(t)&&(r.has("template:"+t)||r.has("route:"+t))}function i(e,t,r){var n=r.shift();if(!e){if(t)return;throw new Ember.Error("Can't trigger action '"+n+"' because your app hasn't finished transitioning into its first route. To trigger an action on destination routes during a transition, you can call `.send()` on the `Transition` object passed to the `model/beforeModel/afterModel` hooks.")}for(var i=!1,o=e.length-1;o>=0;o--){var a=e[o],s=a.handler;if(s._actions&&s._actions[n]){if(s._actions[n].apply(s,r)!==!0)return;i=!0}}if(h[n])return h[n].apply(null,r),void 0;if(!i&&!t)throw new Ember.Error("Nothing handled the action '"+n+"'.")}function o(e){var t=e.container.lookup("controller:application");if(t){var r=e.router.currentHandlerInfos,n=Ember.Router._routePath(r);"currentPath"in t||c(t,"currentPath"),u(t,"currentPath",n),"currentRouteName"in t||c(t,"currentRouteName"),u(t,"currentRouteName",r[r.length-1].name)}}var a=t("router")["default"],s=Ember.get,u=Ember.set,c=Ember.defineProperty,l=Ember._MetamorphView;Ember.Router=Ember.Object.extend(Ember.Evented,{location:"hash",init:function(){this.router=this.constructor.router||this.constructor.map(Ember.K),this._activeViews={},this._setupLocation()},url:Ember.computed(function(){return s(this,"location").getURL()}),startRouting:function(){this.router=this.router||this.constructor.map(Ember.K);var e=this.router,t=s(this,"location"),r=this.container,n=this;this._setupRouter(e,t),r.register("view:default",l),r.register("view:toplevel",Ember.View.extend()),t.onUpdateURL(function(e){n.handleURL(e)}),this.handleURL(t.getURL())},didTransition:function(e){o(this),this._cancelLoadingEvent(),this.notifyPropertyChange("url"),Ember.run.once(this,this.trigger,"didTransition"),s(this,"namespace").LOG_TRANSITIONS&&Ember.Logger.log("Transitioned into '"+Ember.Router._routePath(e)+"'")},handleURL:function(e){return this._doTransition("handleURL",[e])},transitionTo:function(){return this._doTransition("transitionTo",arguments)},intermediateTransitionTo:function(){this.router.intermediateTransitionTo.apply(this.router,arguments),o(this);var e=this.router.currentHandlerInfos;s(this,"namespace").LOG_TRANSITIONS&&Ember.Logger.log("Intermediate-transitioned into '"+Ember.Router._routePath(e)+"'")},replaceWith:function(){return this._doTransition("replaceWith",arguments)},generate:function(){var e=this.router.generate.apply(this.router,arguments);return this.location.formatURL(e)},isActive:function(){var e=this.router;return e.isActive.apply(e,arguments)},send:function(){this.router.trigger.apply(this.router,arguments)},hasRoute:function(e){return this.router.hasRoute(e)},reset:function(){this.router.reset()},willDestroy:function(){var e=s(this,"location");e.destroy(),this._super.apply(this,arguments)},_lookupActiveView:function(e){var t=this._activeViews[e];return t&&t[0]},_connectActiveView:function(e,t){var r=this._activeViews[e];r&&r[0].off("willDestroyElement",this,r[1]);var n=function(){delete this._activeViews[e]};this._activeViews[e]=[t,n],t.one("willDestroyElement",this,n)},_setupLocation:function(){var e=s(this,"location"),t=s(this,"rootURL"),r={};"string"==typeof t&&(r.rootURL=t),"string"==typeof e&&(r.implementation=e,e=u(this,"location",Ember.Location.create(r)))},_getHandlerFunction:function(){var e={},t=this.container,r=t.lookupFactory("route:basic"),n=this;return function(i){var o="route:"+i,a=t.lookup(o);return e[i]?a:(e[i]=!0,a||(t.register(o,r.extend()),a=t.lookup(o),s(n,"namespace.LOG_ACTIVE_GENERATION")&&Ember.Logger.info("generated -> "+o,{fullName:o})),a.routeName=i,a)}},_setupRouter:function(e,t){var r,n=this;e.getHandler=this._getHandlerFunction();var i=function(){t.setURL(r)};if(e.updateURL=function(e){r=e,Ember.run.once(i)},t.replaceURL){var o=function(){t.replaceURL(r)};e.replaceURL=function(e){r=e,Ember.run.once(o)}}e.didTransition=function(e){n.didTransition(e)}},_doTransition:function(e,t){t=[].slice.call(t),t[0]=t[0]||"/";var r,n=t[0],i=!1;i||"/"!==n.charAt(0)?i||(r=this.router.hasRoute(n)?n:t[0]=n+".index"):r=n;var o=this.router[e].apply(this.router,t);return o.then(null,function(e){"UnrecognizedURLError"===e.name}),o},_scheduleLoadingEvent:function(e,t){this._cancelLoadingEvent(),this._loadingStateTimer=Ember.run.scheduleOnce("routerTransitions",this,"_fireLoadingEvent",e,t)},_fireLoadingEvent:function(e,t){this.router.activeTransition&&e.trigger(!0,"loading",e,t)},_cancelLoadingEvent:function(){this._loadingStateTimer&&Ember.run.cancel(this._loadingStateTimer),this._loadingStateTimer=null}});var h={willResolveModel:function(e,t){t.router._scheduleLoadingEvent(e,t)},error:function(t,i,o){var a=o.router,s=e(o,i,function(e,n){var i=r(e,n,"error");return i?(a.intermediateTransitionTo(i,t),void 0):!0});return s?n(o.router,"application_error")?(a.intermediateTransitionTo("application_error",t),void 0):(Ember.Logger.assert(!1,"Error while loading route: "+Ember.inspect(t)),void 0):void 0},loading:function(t,i){var o=i.router,a=e(i,t,function(e,n){var i=r(e,n,"loading");return i?(o.intermediateTransitionTo(i),void 0):t.pivotHandler!==e?!0:void 0});return a&&n(i.router,"application_loading")?(o.intermediateTransitionTo("application_loading"),void 0):void 0}};Ember.Router.reopenClass({router:null,map:function(e){var t=this.router;t||(t=new a,t.callbacks=[],t.triggerEvent=i,this.reopenClass({router:t})),s(this,"namespace.LOG_TRANSITIONS_INTERNAL")&&(t.log=Ember.Logger.debug);var r=Ember.RouterDSL.map(function(){this.resource("application",{path:"/"},function(){for(var r=0;r<t.callbacks.length;r++)t.callbacks[r].call(this);e.call(this)})});return t.callbacks.push(e),t.map(r.generate()),t},_routePath:function(e){for(var t=[],r=1,n=e.length;n>r;r++){var i=e[r].name,o=i.split(".");t.push(o[o.length-1])}return t.join(".")}}),a.Transition.prototype.send=a.Transition.prototype.trigger}(),function(){function e(e){var t=e.router.router.targetHandlerInfos;if(t)for(var r,n,i=0,o=t.length;o>i;i++){if(n=t[i].handler,n===e)return r;r=n}}function t(r){var n,i=e(r);if(i)return(n=i.lastRenderedTemplate)?n:t(i)}function r(e,r,n,i){i=i||{},i.into=i.into?i.into.replace(/\//g,"."):t(e),i.outlet=i.outlet||"main",i.name=r,i.template=n,i.LOG_VIEW_LOOKUPS=s(e.router,"namespace.LOG_VIEW_LOOKUPS");
var o,a=i.controller;return a=i.controller?i.controller:(o=e.container.lookup("controller:"+r))?o:e.controllerName||e.routeName,"string"==typeof a&&(a=e.container.lookup("controller:"+a)),i.controller=a,i}function n(e,t,r){if(e)r.LOG_VIEW_LOOKUPS&&Ember.Logger.info("Rendering "+r.name+" with "+e,{fullName:"view:"+r.name});else{var n=r.into?"view:default":"view:toplevel";e=t.lookup(n),r.LOG_VIEW_LOOKUPS&&Ember.Logger.info("Rendering "+r.name+" with default view "+e,{fullName:"view:"+r.name})}return s(e,"templateName")||(u(e,"template",r.template),u(e,"_debugTemplateName",r.name)),u(e,"renderedName",r.name),u(e,"controller",r.controller),e}function i(e,t,r){if(r.into){var n=e.router._lookupActiveView(r.into),i=a(n,r.outlet);e.teardownOutletViews||(e.teardownOutletViews=[]),h(e.teardownOutletViews,0,0,[i]),n.connectOutlet(r.outlet,t)}else{var u=s(e,"router.namespace.rootElement");e.teardownTopLevelView&&e.teardownTopLevelView(),e.router._connectActiveView(r.name,t),e.teardownTopLevelView=o(t),t.appendTo(u)}}function o(e){return function(){e.destroy()}}function a(e,t){return function(){e.disconnectOutlet(t)}}var s=Ember.get,u=Ember.set,c=Ember.getProperties,l=(Ember.String.classify,Ember.String.fmt,Ember.EnumerableUtils.forEach),h=Ember.EnumerableUtils.replace;Ember.Route=Ember.Object.extend(Ember.ActionHandler,{exit:function(){this.deactivate(),this.teardownViews()},enter:function(){this.activate()},actions:null,events:null,mergedProperties:["events"],deactivate:Ember.K,activate:Ember.K,transitionTo:function(){var e=this.router;return e.transitionTo.apply(e,arguments)},intermediateTransitionTo:function(){var e=this.router;e.intermediateTransitionTo.apply(e,arguments)},replaceWith:function(){var e=this.router;return e.replaceWith.apply(e,arguments)},send:function(){return this.router.send.apply(this.router,arguments)},setup:function(e){var t=this.controllerName||this.routeName,r=this.controllerFor(t,!0);r||(r=this.generateController(t,e)),this.controller=r;var n=[r,e];this.setupControllers?this.setupControllers(r,e):this.setupController.apply(this,n),this.renderTemplates?this.renderTemplates(e):this.renderTemplate.apply(this,n)},redirect:Ember.K,beforeModel:Ember.K,afterModel:function(e,t){this.redirect(e,t)},contextDidChange:function(){this.currentModel=this.context},model:function(e){var t,r,n,i;for(var o in e)(t=o.match(/^(.*)_id$/))&&(r=t[1],i=e[o]),n=!0;if(!r&&n)return e;if(r)return this.findModel(r,i)},findModel:function(){var e=s(this,"store");return e.find.apply(e,arguments)},store:Ember.computed(function(){var e=this.container;return this.routeName,s(this,"router.namespace"),{find:function(t,r){var n=e.lookupFactory("model:"+t);return n.find(r)}}}),serialize:function(e,t){if(!(t.length<1)){var r=t[0],n={};return/_id$/.test(r)&&1===t.length?n[r]=s(e,"id"):n=c(e,t),n}},setupController:function(e,t){e&&void 0!==t&&u(e,"model",t)},controllerFor:function(e){var t,r=this.container,n=r.lookup("route:"+e);return n&&n.controllerName&&(e=n.controllerName),t=r.lookup("controller:"+e)},generateController:function(e,t){var r=this.container;return t=t||this.modelFor(e),Ember.generateController(r,e,t)},modelFor:function(e){var t=this.container.lookup("route:"+e),r=this.router.router.activeTransition;if(r){var n=t&&t.routeName||e;if(r.resolvedModels.hasOwnProperty(n))return r.resolvedModels[n]}return t&&t.currentModel},renderTemplate:function(){this.render()},render:function(e,t){"object"!=typeof e||t||(t=e,e=this.routeName),t=t||{};var o;e?(e=e.replace(/\//g,"."),o=e):(e=this.routeName,o=this.templateName||e);var a=t.view||this.viewName||e,u=this.container,c=u.lookup("view:"+a),l=c?c.get("template"):null;return l||(l=u.lookup("template:"+o)),c||l?(t=r(this,e,l,t),c=n(c,u,t),"main"===t.outlet&&(this.lastRenderedTemplate=e),i(this,c,t),void 0):(s(this.router,"namespace.LOG_VIEW_LOOKUPS")&&Ember.Logger.info('Could not find "'+e+'" template or view. Nothing will be rendered',{fullName:"template:"+e}),void 0)},disconnectOutlet:function(e){e=e||{},e.parentView=e.parentView?e.parentView.replace(/\//g,"."):t(this),e.outlet=e.outlet||"main";var r=this.router._lookupActiveView(e.parentView);r.disconnectOutlet(e.outlet)},willDestroy:function(){this.teardownViews()},teardownViews:function(){this.teardownTopLevelView&&this.teardownTopLevelView();var e=this.teardownOutletViews||[];l(e,function(e){e()}),delete this.teardownTopLevelView,delete this.teardownOutletViews,delete this.lastRenderedTemplate}})}(),function(){Ember.onLoad("Ember.Handlebars",function(){function e(e,r,i){return n.call(t(e,r,i),function(t,n){return null===t?r[n]:o(e,t,i)})}function t(e,t,o){function a(e,t){return"controller"===t?t:Ember.ControllerMixin.detect(e)?a(i(e,"model"),t?t+".model":"model"):t}var s=r(e,t,o),u=o.types;return n.call(s,function(e,r){return"ID"===u[r]?a(e,t[r]):null})}var r=Ember.Handlebars.resolveParams,n=Ember.ArrayPolyfills.map,i=Ember.get,o=Ember.Handlebars.get;Ember.Router.resolveParams=e,Ember.Router.resolvePaths=t})}(),function(){var e=Ember.get;Ember.set,Ember.String.fmt,Ember.onLoad("Ember.Handlebars",function(){function t(e,t){return e.hasRoute(t)||(t+=".index"),t}function r(e){var t=e.options.types,r=e.options.data;return i(e.context,e.params,{types:t,data:r})}var n=Ember.Router.resolveParams,i=Ember.Router.resolvePaths,o=Ember.ViewUtils.isSimpleClick,a=Ember.LinkView=Ember.View.extend({tagName:"a",currentWhen:null,title:null,rel:null,activeClass:"active",loadingClass:"loading",disabledClass:"disabled",_isDisabled:!1,replace:!1,attributeBindings:["href","title","rel"],classNameBindings:["active","loading","disabled"],eventName:"click",init:function(){this._super.apply(this,arguments);var t=e(this,"eventName");this.on(t,this,this._invoke);var n,i,o,a=this.parameters,s=a.context,u=r(a),c=u.length,l=a.options.linkTextPath;for(l&&(o=Ember.Handlebars.normalizePath(s,l,a.options.data),this.registerObserver(o.root,o.path,this,this.rerender)),i=0;c>i;i++)n=u[i],null!==n&&(o=Ember.Handlebars.normalizePath(s,n,a.options.data),this.registerObserver(o.root,o.path,this,this._paramsChanged))},_paramsChanged:function(){this.notifyPropertyChange("resolvedParams")},_queryParamsChanged:function(){this.notifyPropertyChange("queryParams")},concreteView:Ember.computed(function(){return e(this,"parentView")}).property("parentView"),disabled:Ember.computed(function(t,r){return void 0!==r&&this.set("_isDisabled",r),r?e(this,"disabledClass"):!1}),active:Ember.computed(function(){if(e(this,"loading"))return!1;var t=e(this,"router"),r=e(this,"routeArgs"),n=r.slice(1),i=e(this,"resolvedParams"),o=this.currentWhen||i[0],a=o+".index",s=t.isActive.apply(t,[o].concat(n))||t.isActive.apply(t,[a].concat(n));return s?e(this,"activeClass"):void 0}).property("resolvedParams","routeArgs","router.url"),loading:Ember.computed(function(){return e(this,"routeArgs")?void 0:e(this,"loadingClass")}).property("routeArgs"),router:Ember.computed(function(){return e(this,"controller").container.lookup("router:main")}),_invoke:function(t){if(!o(t))return!0;if(t.preventDefault(),this.bubbles===!1&&t.stopPropagation(),e(this,"_isDisabled"))return!1;if(e(this,"loading"))return Ember.Logger.warn("This link-to is in an inactive loading state because at least one of its parameters presently has a null/undefined value, or the provided route name is invalid."),!1;var r=e(this,"router"),n=e(this,"routeArgs");e(this,"replace")?r.replaceWith.apply(r,n):r.transitionTo.apply(r,n)},resolvedParams:Ember.computed(function(){var e=this.parameters,t=e.options,r=t.types,i=t.data;return n(e.context,e.params,{types:r,data:i})}).property(),routeArgs:Ember.computed(function(){var r=e(this,"resolvedParams").slice(0),n=e(this,"router"),i=r[0];if(i){i=t(n,i),r[0]=i;for(var o=1,a=r.length;a>o;++o){var s=r[o];if(null===s||"undefined"==typeof s)return}return r}}).property("resolvedParams","queryParams","router.url"),_potentialQueryParams:Ember.computed(function(){var r=e(this,"resolvedParams")[0];if(!r)return null;var n=e(this,"router");return r=t(n,r),n.router.queryParamsForHandler(r)}).property("resolvedParams"),queryParams:Ember.computed(function(){var t=this,r=null,n=e(this,"_potentialQueryParams");return n?(n.forEach(function(n){var i=e(t,n);"undefined"!=typeof i&&(r=r||{},r[n]=i)}),r):null}).property("_potentialQueryParams.[]"),href:Ember.computed(function(){if("a"===e(this,"tagName")){var t=e(this,"router"),r=e(this,"routeArgs");return r?t.generate.apply(t,r):e(this,"loadingHref")}}).property("routeArgs"),loadingHref:"#"});a.toString=function(){return"LinkView"},Ember.Handlebars.registerHelper("link-to",function(){var e=[].slice.call(arguments,-1)[0],t=[].slice.call(arguments,0,-1),r=e.hash;if(r.disabledBinding=r.disabledWhen,!e.fn){var n=t.shift(),i=e.types.shift(),o=this;"ID"===i?(e.linkTextPath=n,e.fn=function(){return Ember.Handlebars.get(o,n,e)}):e.fn=function(){return n}}return r.parameters={context:this,options:e,params:t},Ember.Handlebars.helpers.view.call(this,a,e)}),Ember.Handlebars.registerHelper("linkTo",Ember.Handlebars.helpers["link-to"])})}(),function(){Ember.get,Ember.set,Ember.onLoad("Ember.Handlebars",function(e){e.OutletView=Ember.ContainerView.extend(Ember._Metamorph),e.registerHelper("outlet",function(t,r){var n,i;for(t&&t.data&&t.data.isRenderData&&(r=t,t="main"),n=r.data.view;!n.get("template.isTop");)n=n.get("_parentView");return i=r.hash.viewClass||e.OutletView,r.data.view.set("outletSource",n),r.hash.currentViewBinding="_view.outletSource._outlets."+t,e.helpers.view.call(this,i,r)})})}(),function(){Ember.get,Ember.set,Ember.onLoad("Ember.Handlebars",function(){Ember.Handlebars.registerHelper("render",function(e,t,r){var n,i,o,a,s,u,c=3===arguments.length;2===arguments.length&&(r=t,t=void 0),"string"==typeof t&&(s=Ember.Handlebars.get(r.contexts[1],t,r),u={singleton:!1}),e=e.replace(/\//g,"."),n=r.data.keywords.controller.container,i=n.lookup("router:main"),a=n.lookup("view:"+e)||n.lookup("view:default");var l=r.hash.controller;o=l?n.lookup("controller:"+l,u):n.lookup("controller:"+e,u)||Ember.generateController(n,e,s),o&&c&&o.set("model",s);var h=r.contexts[1];h&&a.registerObserver(h,t,function(){o.set("model",Ember.Handlebars.get(h,t,r))}),o.set("target",r.data.keywords.controller),r.hash.viewName=Ember.String.camelize(e),r.hash.template=n.lookup("template:"+e),r.hash.controller=o,i&&!s&&i._connectActiveView(e,a),Ember.Handlebars.helpers.view.call(this,a,r)})})}(),function(){Ember.onLoad("Ember.Handlebars",function(){function e(e,r){var n=[];r&&n.push(r);var i=e.options.types.slice(1),o=e.options.data;return n.concat(t(e.context,e.params,{types:i,data:o}))}var t=Ember.Router.resolveParams,r=Ember.ViewUtils.isSimpleClick,n=Ember.Handlebars,i=n.get,o=n.SafeString,a=Ember.ArrayPolyfills.forEach,s=(Ember.get,Array.prototype.slice),u=n.ActionHelper={registeredActions:{}},c=["alt","shift","meta","ctrl"],l=/^click|mouse|touch/,h=function(e,t){if("undefined"==typeof t){if(l.test(e.type))return r(e);t=[]}if(t.indexOf("any")>=0)return!0;var n=!0;return a.call(c,function(r){e[r+"Key"]&&-1===t.indexOf(r)&&(n=!1)}),n};u.registerAction=function(t,r,n){var o=(++Ember.uuid).toString();return u.registeredActions[o]={eventName:r.eventName,handler:function(o){if(!h(o,n))return!0;o.preventDefault(),r.bubbles===!1&&o.stopPropagation();var a=r.target;a=a.target?i(a.root,a.target,a.options):a.root,Ember.run(function(){a.send?a.send.apply(a,e(r.parameters,t)):a[t].apply(a,e(r.parameters))})}},r.view.on("willClearRender",function(){delete u.registeredActions[o]}),o},n.registerHelper("action",function(e){var t,r=arguments[arguments.length-1],n=s.call(arguments,1,-1),i=r.hash,a={eventName:i.on||"click"};a.parameters={context:this,options:r,params:n},a.view=r.data.view;var c,l;i.target?(c=this,l=i.target):(t=r.data.keywords.controller)&&(c=t),a.target={root:c,target:l,options:r},a.bubbles=i.bubbles;var h=u.registerAction(e,a,i.allowedKeys);return new o('data-ember-action="'+h+'"')})})}(),function(){if(Ember.ENV.EXPERIMENTAL_CONTROL_HELPER){var e=Ember.get,t=Ember.set;Ember.Handlebars.registerHelper("control",function(r,n,i){function o(){var e=Ember.Handlebars.get(this,n,i);t(p,"model",e),f.rerender()}2===arguments.length&&(i=n,n=void 0);var a;n&&(a=Ember.Handlebars.get(this,n,i));var s,u,c=i.data.keywords.controller,l=(i.data.keywords.view,e(c,"_childContainers")),h=i.hash.controlID;l.hasOwnProperty(h)?u=l[h]:(s=e(c,"container"),u=s.child(),l[h]=u);var m=r.replace(/\//g,"."),f=u.lookup("view:"+m)||u.lookup("view:default"),p=u.lookup("controller:"+m),d=u.lookup("template:"+r);t(p,"target",c),t(p,"model",a),i.hash.template=d,i.hash.controller=p,n&&(Ember.addObserver(this,n,o),f.one("willDestroyElement",this,function(){Ember.removeObserver(this,n,o)})),Ember.Handlebars.helpers.view.call(this,f,i)})}}(),function(){var e=Ember.get;Ember.set,Ember.ControllerMixin.reopen({transitionToRoute:function(){var t=e(this,"target"),r=t.transitionToRoute||t.transitionTo;return r.apply(t,arguments)},transitionTo:function(){return this.transitionToRoute.apply(this,arguments)},replaceRoute:function(){var t=e(this,"target"),r=t.replaceRoute||t.replaceWith;return r.apply(t,arguments)},replaceWith:function(){return this.replaceRoute.apply(this,arguments)}})}(),function(){var e=Ember.get,t=Ember.set;Ember.View.reopen({init:function(){t(this,"_outlets",{}),this._super()},connectOutlet:function(r,n){if(this._pendingDisconnections&&delete this._pendingDisconnections[r],this._hasEquivalentView(r,n))return n.destroy(),void 0;var i=e(this,"_outlets"),o=e(this,"container"),a=o&&o.lookup("router:main"),s=e(n,"renderedName");t(i,r,n),a&&s&&a._connectActiveView(s,n)},_hasEquivalentView:function(t,r){var n=e(this,"_outlets."+t);return n&&n.constructor===r.constructor&&n.get("template")===r.get("template")&&n.get("context")===r.get("context")},disconnectOutlet:function(e){this._pendingDisconnections||(this._pendingDisconnections={}),this._pendingDisconnections[e]=!0,Ember.run.once(this,"_finishDisconnections")},_finishDisconnections:function(){var r=e(this,"_outlets"),n=this._pendingDisconnections;this._pendingDisconnections=null;for(var i in n)t(r,i,null)}})}(),function(){var e=Ember.run.queues,t=Ember.ArrayPolyfills.indexOf;e.splice(t.call(e,"actions")+1,0,"routerTransitions")}(),function(){Ember.get,Ember.set,Ember.Location={create:function(e){var t=e&&e.implementation,r=this.implementations[t];return r.create.apply(r,arguments)},registerImplementation:function(e,t){this.implementations[e]=t},implementations:{}}}(),function(){var e=Ember.get,t=Ember.set;Ember.NoneLocation=Ember.Object.extend({path:"",getURL:function(){return e(this,"path")},setURL:function(e){t(this,"path",e)},onUpdateURL:function(e){this.updateCallback=e},handleURL:function(e){t(this,"path",e),this.updateCallback(e)},formatURL:function(e){return e}}),Ember.Location.registerImplementation("none",Ember.NoneLocation)}(),function(){var e=Ember.get,t=Ember.set;Ember.HashLocation=Ember.Object.extend({init:function(){t(this,"location",e(this,"location")||window.location)},getURL:function(){return e(this,"location").hash.substr(1)},setURL:function(r){e(this,"location").hash=r,t(this,"lastSetURL",r)},replaceURL:function(t){e(this,"location").replace("#"+t)},onUpdateURL:function(r){var n=this,i=Ember.guidFor(this);Ember.$(window).on("hashchange.ember-location-"+i,function(){Ember.run(function(){var i=location.hash.substr(1);e(n,"lastSetURL")!==i&&(t(n,"lastSetURL",null),r(i))})})},formatURL:function(e){return"#"+e},willDestroy:function(){var e=Ember.guidFor(this);Ember.$(window).off("hashchange.ember-location-"+e)}}),Ember.Location.registerImplementation("hash",Ember.HashLocation)}(),function(){var e=Ember.get,t=Ember.set,r=!1,n=window.history&&"state"in window.history;Ember.HistoryLocation=Ember.Object.extend({init:function(){t(this,"location",e(this,"location")||window.location),this.initState()},initState:function(){t(this,"history",e(this,"history")||window.history),this.replaceState(this.formatURL(this.getURL()))},rootURL:"/",getURL:function(){var t=e(this,"rootURL"),r=e(this,"location"),n=r.pathname;t=t.replace(/\/$/,"");var i=n.replace(t,"");return i},setURL:function(e){var t=this.getState();e=this.formatURL(e),t&&t.path!==e&&this.pushState(e)},replaceURL:function(e){var t=this.getState();e=this.formatURL(e),t&&t.path!==e&&this.replaceState(e)},getState:function(){return n?e(this,"history").state:this._historyState},pushState:function(t){var r={path:t};e(this,"history").pushState(r,null,t),n||(this._historyState=r),this._previousURL=this.getURL()},replaceState:function(t){var r={path:t};e(this,"history").replaceState(r,null,t),n||(this._historyState=r),this._previousURL=this.getURL()},onUpdateURL:function(e){var t=Ember.guidFor(this),n=this;Ember.$(window).on("popstate.ember-location-"+t,function(){(r||(r=!0,n.getURL()!==n._previousURL))&&e(n.getURL())})},formatURL:function(t){var r=e(this,"rootURL");return""!==t&&(r=r.replace(/\/$/,"")),r+t},willDestroy:function(){var e=Ember.guidFor(this);Ember.$(window).off("popstate.ember-location-"+e)}}),Ember.Location.registerImplementation("history",Ember.HistoryLocation)}(),function(){function e(t,r,n,i){var o,a=t.name,s=t.incoming,u=t.incomingNames,c=u.length;if(n||(n={}),i||(i=[]),!n.hasOwnProperty(a)){for(i.push(a),n[a]=!0,o=0;c>o;o++)e(s[u[o]],r,n,i);r(t,i),i.pop()}}function t(){this.names=[],this.vertices={}}t.prototype.add=function(e){if(e){if(this.vertices.hasOwnProperty(e))return this.vertices[e];var t={name:e,incoming:{},incomingNames:[],hasOutgoing:!1,value:null};return this.vertices[e]=t,this.names.push(e),t}},t.prototype.map=function(e,t){this.add(e).value=t},t.prototype.addEdge=function(t,r){function n(e,t){if(e.name===r)throw new Ember.Error("cycle detected: "+r+" <- "+t.join(" <- "))}if(t&&r&&t!==r){var i=this.add(t),o=this.add(r);o.incoming.hasOwnProperty(t)||(e(i,n),i.hasOutgoing=!0,o.incoming[t]=i,o.incomingNames.push(t))}},t.prototype.topsort=function(t){var r,n,i={},o=this.vertices,a=this.names,s=a.length;for(r=0;s>r;r++)n=o[a[r]],n.hasOutgoing||e(n,t,i)},t.prototype.addEdges=function(e,t,r,n){var i;if(this.map(e,t),r)if("string"==typeof r)this.addEdge(e,r);else for(i=0;i<r.length;i++)this.addEdge(e,r[i]);if(n)if("string"==typeof n)this.addEdge(n,e);else for(i=0;i<n.length;i++)this.addEdge(n[i],e)},Ember.DAG=t}(),function(){var e=Ember.get,t=Ember.String.classify,r=Ember.String.capitalize,n=Ember.String.decamelize;Ember.DefaultResolver=Ember.Object.extend({namespace:null,normalize:function(e){var t=e.split(":",2),r=t[0],n=t[1];if("template"!==r){var i=n;return i.indexOf(".")>-1&&(i=i.replace(/\.(.)/g,function(e){return e.charAt(1).toUpperCase()})),n.indexOf("_")>-1&&(i=i.replace(/_(.)/g,function(e){return e.charAt(1).toUpperCase()})),r+":"+i}return e},resolve:function(e){var t=this.parseName(e),r=this[t.resolveMethodName];if(!t.name||!t.type)throw new TypeError("Invalid fullName: `"+e+"`, must of of the form `type:name` ");if(r){var n=r.call(this,t);if(n)return n}return this.resolveOther(t)},parseName:function(n){var i=n.split(":"),o=i[0],a=i[1],s=a,u=e(this,"namespace"),c=u;if("template"!==o&&-1!==s.indexOf("/")){var l=s.split("/");s=l[l.length-1];var h=r(l.slice(0,-1).join("."));c=Ember.Namespace.byName(h)}return{fullName:n,type:o,fullNameWithoutType:a,name:s,root:c,resolveMethodName:"resolve"+t(o)}},resolveTemplate:function(e){var t=e.fullNameWithoutType.replace(/\./g,"/");return Ember.TEMPLATES[t]?Ember.TEMPLATES[t]:(t=n(t),Ember.TEMPLATES[t]?Ember.TEMPLATES[t]:void 0)},useRouterNaming:function(e){e.name=e.name.replace(/\./g,"_"),"basic"===e.name&&(e.name="")},resolveController:function(e){return this.useRouterNaming(e),this.resolveOther(e)},resolveRoute:function(e){return this.useRouterNaming(e),this.resolveOther(e)},resolveView:function(e){return this.useRouterNaming(e),this.resolveOther(e)},resolveHelper:function(e){return this.resolveOther(e)||Ember.Handlebars.helpers[e.fullNameWithoutType]},resolveModel:function(r){var n=t(r.name),i=e(r.root,n);return i?i:void 0},resolveOther:function(r){var n=t(r.name)+t(r.type),i=e(r.root,n);return i?i:void 0},lookupDescription:function(e){var r=this.parseName(e);if("template"===r.type)return"template at "+r.fullNameWithoutType.replace(/\./g,"/");var n=r.root+"."+t(r.name);return"model"!==r.type&&(n+=t(r.type)),n},makeToString:function(e){return e.toString()}})}(),function(){function e(e){this._container=e}function t(e){function t(e){return n.resolve(e)}e.get("resolver");var r=e.get("resolver")||e.get("Resolver")||Ember.DefaultResolver,n=r.create({namespace:e});return t.describe=function(e){return n.lookupDescription(e)},t.makeToString=function(e,t){return n.makeToString(e,t)},t.normalize=function(e){return n.normalize?n.normalize(e):e},t}var r=Ember.get,n=Ember.set;e.deprecate=function(e){return function(){var t=this._container;return t[e].apply(t,arguments)}},e.prototype={_container:null,lookup:e.deprecate("lookup"),resolve:e.deprecate("resolve"),register:e.deprecate("register")};var i=Ember.Application=Ember.Namespace.extend(Ember.DeferredMixin,{rootElement:"body",eventDispatcher:null,customEvents:null,_readinessDeferrals:1,init:function(){if(this.$||(this.$=Ember.$),this.__container__=this.buildContainer(),this.Router=this.defaultRouter(),this._super(),this.scheduleInitialize(),Ember.libraries.registerCoreLibrary("Handlebars",Ember.Handlebars.VERSION),Ember.libraries.registerCoreLibrary("jQuery",Ember.$().jquery),Ember.LOG_VERSION){Ember.LOG_VERSION=!1;var e=Math.max.apply(this,Ember.A(Ember.libraries).mapBy("name.length"));Ember.libraries.each(function(t){new Array(e-t.length+1).join(" ")})}},buildContainer:function(){var e=this.__container__=i.buildContainer(this);return e},defaultRouter:function(){if(this.Router!==!1){var e=this.__container__;return this.Router&&(e.unregister("router:main"),e.register("router:main",this.Router)),e.lookupFactory("router:main")}},scheduleInitialize:function(){var e=this;!this.$||this.$.isReady?Ember.run.schedule("actions",e,"_initialize"):this.$().ready(function(){Ember.run(e,"_initialize")})},deferReadiness:function(){this._readinessDeferrals++},advanceReadiness:function(){this._readinessDeferrals--,0===this._readinessDeferrals&&Ember.run.once(this,this.didBecomeReady)},register:function(){var e=this.__container__;e.register.apply(e,arguments)},inject:function(){var e=this.__container__;e.injection.apply(e,arguments)},initialize:function(){},_initialize:function(){if(!this.isDestroyed){if(this.Router){var e=this.__container__;e.unregister("router:main"),e.register("router:main",this.Router)}return this.runInitializers(),Ember.runLoadHooks("application",this),this.advanceReadiness(),this}},reset:function(){function e(){var e=this.__container__.lookup("router:main");e.reset(),Ember.run(this.__container__,"destroy"),this.buildContainer(),Ember.run.schedule("actions",this,function(){this._initialize()})}this._readinessDeferrals=1,Ember.run.join(this,e)},runInitializers:function(){var e,t,n=r(this.constructor,"initializers"),i=this.__container__,o=new Ember.DAG,a=this;for(e in n)t=n[e],o.addEdges(t.name,t.initialize,t.before,t.after);o.topsort(function(e){var t=e.value;t(i,a)})},didBecomeReady:function(){this.setupEventDispatcher(),this.ready(),this.startRouting(),Ember.testing||(Ember.Namespace.processAll(),Ember.BOOTED=!0),this.resolve(this)},setupEventDispatcher:function(){var e=r(this,"customEvents"),t=r(this,"rootElement"),i=this.__container__.lookup("event_dispatcher:main");n(this,"eventDispatcher",i),i.setup(e,t)},startRouting:function(){var e=this.__container__.lookup("router:main");e&&e.startRouting()},handleURL:function(e){var t=this.__container__.lookup("router:main");t.handleURL(e)},ready:Ember.K,resolver:null,Resolver:null,willDestroy:function(){Ember.BOOTED=!1,this.__container__.destroy()},initializer:function(e){this.constructor.initializer(e)}});Ember.Application.reopenClass({initializers:{},initializer:function(e){void 0!==this.superclass.initializers&&this.superclass.initializers===this.initializers&&this.reopenClass({initializers:Ember.create(this.initializers)}),this.initializers[e.name]=e},buildContainer:function(r){var n=new Ember.Container;return Ember.Container.defaultContainer=new e(n),n.set=Ember.set,n.resolver=t(r),n.normalize=n.resolver.normalize,n.describe=n.resolver.describe,n.makeToString=n.resolver.makeToString,n.optionsForType("component",{singleton:!1}),n.optionsForType("view",{singleton:!1}),n.optionsForType("template",{instantiate:!1}),n.optionsForType("helper",{instantiate:!1}),n.register("application:main",r,{instantiate:!1}),n.register("controller:basic",Ember.Controller,{instantiate:!1}),n.register("controller:object",Ember.ObjectController,{instantiate:!1}),n.register("controller:array",Ember.ArrayController,{instantiate:!1}),n.register("route:basic",Ember.Route,{instantiate:!1}),n.register("event_dispatcher:main",Ember.EventDispatcher),n.register("router:main",Ember.Router),n.injection("router:main","namespace","application:main"),n.injection("controller","target","router:main"),n.injection("controller","namespace","application:main"),n.injection("route","router","router:main"),n}}),Ember.runLoadHooks("Ember.Application",Ember.Application)}(),function(){function e(e,t,r){var n,i,o;for(i=0,o=r.length;o>i;i++)n=r[i],-1===n.indexOf(":")&&(n="controller:"+n),!t.has(n)}var t=Ember.get;Ember.set,Ember.ControllerMixin.reopen({concatenatedProperties:["needs"],needs:[],init:function(){var r=t(this,"needs"),n=t(r,"length");n>0&&(e(this,this.container,r),t(this,"controllers")),this._super.apply(this,arguments)},controllerFor:function(e){return Ember.controllerFor(t(this,"container"),e)},controllers:Ember.computed(function(){var e=this;return{needs:t(e,"needs"),container:t(e,"container"),unknownProperty:function(t){var r,n,i,o=this.needs;for(n=0,i=o.length;i>n;n++)if(r=o[n],r===t)return this.container.lookup("controller:"+t);var a=Ember.inspect(e)+"#needs does not include `"+t+"`. To access the "+t+" controller from "+Ember.inspect(e)+", "+Ember.inspect(e)+" should have a `needs` property that is an array of the controllers it has access to.";throw new ReferenceError(a)}}}).readOnly()})}(),function(){Ember.DataAdapter=Ember.Object.extend({init:function(){this._super(),this.releaseMethods=Ember.A()},container:null,attributeLimit:3,releaseMethods:Ember.A(),getFilters:function(){return Ember.A()},watchModelTypes:function(e,t){var r,n=this.getModelTypes(),i=this,o=Ember.A();r=n.map(function(e){var r=i.wrapModelType(e);return o.push(i.observeModelType(e,t)),r}),e(r);var a=function(){o.forEach(function(e){e()}),i.releaseMethods.removeObject(a)};return this.releaseMethods.pushObject(a),a},watchRecords:function(e,t,r,n){var i,o=this,a=Ember.A(),s=this.getRecords(e),u=function(e){r([e])},c=s.map(function(e){return a.push(o.observeRecord(e,u)),o.wrapRecord(e)}),l=function(e,r,i,s){for(var c=r;r+s>c;c++){var l=e.objectAt(c),h=o.wrapRecord(l);a.push(o.observeRecord(l,u)),t([h])}i&&n(r,i)},h={didChange:l,willChange:Ember.K};return s.addArrayObserver(o,h),i=function(){a.forEach(function(e){e()}),s.removeArrayObserver(o,h),o.releaseMethods.removeObject(i)},t(c),this.releaseMethods.pushObject(i),i},willDestroy:function(){this._super(),this.releaseMethods.forEach(function(e){e()})},detect:function(){return!1},columnsForType:function(){return Ember.A()},observeModelType:function(e,t){var r=this,n=this.getRecords(e),i=function(){t([r.wrapModelType(e)])},o={didChange:function(){Ember.run.scheduleOnce("actions",this,i)},willChange:Ember.K};n.addArrayObserver(this,o);var a=function(){n.removeArrayObserver(r,o)};return a},wrapModelType:function(e){var t,r=this.getRecords(e);return t={name:e.toString(),count:Ember.get(r,"length"),columns:this.columnsForType(e),object:e}},getModelTypes:function(){var e=Ember.A(Ember.Namespace.NAMESPACES),t=Ember.A(),r=this;return e.forEach(function(e){for(var n in e)if(e.hasOwnProperty(n)){var i=e[n];r.detect(i)&&t.push(i)}}),t},getRecords:function(){return Ember.A()},wrapRecord:function(e){var t={object:e};return t.columnValues=this.getRecordColumnValues(e),t.searchKeywords=this.getRecordKeywords(e),t.filterValues=this.getRecordFilterValues(e),t.color=this.getRecordColor(e),t},getRecordColumnValues:function(){return{}},getRecordKeywords:function(){return Ember.A()},getRecordFilterValues:function(){return{}},getRecordColor:function(){return null},observeRecord:function(){return function(){}}})}()}(),"undefined"==typeof location||"localhost"!==location.hostname&&"127.0.0.1"!==location.hostname||Ember.Logger.warn("You are running a production build of Ember on localhost and won't receive detailed error messages. If you want full error messages please use the non-minified build provided on the Ember website.");
var Scypho = Ember.Application.create({
	LOG_TRANSITIONS: true,
    LOG_VIEW_LOOKUPS: true
});

// Define parent view
Scypho.IndexView = Ember.View.extend({
  templateName: 'index',
  home: 1,
  title: 'Hem',
  firstName: "Albert",
  lastName: "Hofmann",
  didInsertElement: function() {
  	updateTitle(1, 'Hem');
  	drawStats();
  	dashboardActions();

  	$('.exit-off-canvas').click();
  }
});

// Define Schedule view
Scypho.ScheduleView = Ember.View.extend({
  templateName: 'schedule',
  title: 'Schema',
  didInsertElement: function() {
  	updateTitle(0, 'Veckoschema');
  	updateComfZone();

  	$('.exit-off-canvas').click();
  }
});

// Define Home alt view
Scypho.Index2View = Ember.View.extend({
  templateName: 'index2',
  home: 1,
  title: 'Hem',
  didInsertElement: function() {
  	updateTitle(1, 'Hem');
  	drawStats();
  	dashboardActions();

  	$('.exit-off-canvas').click();
  }
});
Scypho.Router.map(function () {
  	this.route('schedule');
  	this.route('index2');
});


















// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs
$(document).foundation();

$(function(){
	document.addEventListener("touchstart", function(){}, true);
		
});

function updateTitle(home, title) {
	$('html, body').scrollTop(0);

	if (home == 1) {
		$('.tab-bar-section h1').removeClass('hidden').addClass('hidden');
		$('.tab-bar-section .scy-icon-logo').removeClass('hidden');
		$('.left-small').removeClass('hidden').addClass('hidden');
	} else {
		$('.tab-bar-section h1').removeClass('hidden').addClass('hidden');
		$('.left-small').removeClass('hidden');
		$('.tab-bar-section .scy-icon-logo').next('h1').html(title).removeClass('hidden');
	}
}
function dashboardActions() {
	var idealTemp = $('#ideal-degree');
	$('.js-plus-temp').on('click', function(e){
		e.preventDefault();
		idealTemp.html(parseInt(idealTemp.html()) + 1);
		var params = { temp: 1 };
		$.post( "http://termo.meteor.com/termo-up", params)
		  .done(function( data ) {
		  
		  });
	});
	$('.js-minus-temp').on('click', function(e){
		e.preventDefault();
		idealTemp.html(parseInt(idealTemp.html()) - 1);
		var params = { temp: 1 };
		$.post( "http://termo.meteor.com/termo-down", params)
		  .done(function( data ) {
		  
		  });
	});

	$('.mode-switch > input[type="checkbox"]').on('click', function(e){
		var checked = $(this).prop('checked');
		console.log(checked);
		if (!checked) {
			console.log('checked');
			$(this).prop('checked', true);
		}
		var wrap = $(this).parents('.row').next('.slide-down');
		if (!wrap.hasClass('hidden')) {
			updateStatus('normal');
		}
		wrap.toggleClass('hidden');
	});
	// $('.slide-down input[type="checkbox"]').on('click', function(e){
	// 	$(this).parents('.small-12').next('.slide-down').toggleClass('hidden');
	// });
	$('.mode-cancel').on('click', function(e){
		e.preventDefault();
		updateStatus('normal');
		$(this).parents('.scy-module').find('input[type="checkbox"]').prop('checked', false);
		$(this).parents('.slide-down').toggleClass('hidden');
	});
	$('.mode-submit').on('click', function(e){
		e.preventDefault();
		$(this).parents('.scy-module').find('input[type="checkbox"]').click().prop('checked', true);
		$('#popup-status').removeClass('hidden').delay(1500).queue(function(next){
		    $(this).addClass("hidden");
		    next();
		});

		var mode = $(this).data('mode');
		var startDate = $(this).parents('.slide-down').find('#' + mode + '-start-date').val();
		var endDate = $(this).parents('.slide-down').find('#' + mode + '-end-date').val();
		updatePopupStatus(mode, startDate);
		updateStatus(mode, endDate);
	});
}

function updatePopupStatus(mode, date) {
	var text = '';
	var currentDate = new Date();
	var startDate = new Date(date);
	
	if (currentDate.toDateString() == startDate.toDateString()) {
		date = 'NU';
	}

	if (mode == 'home') {
		text = 'Hemmaläge är aktiverad och påbörjas ' + date;
	} else if (mode == 'away') {
		text = 'Semesterläge är aktiverad och påbörjas ' + date;
	}

	$('#popup-status p').html(text);
}

function updateStatus(mode, endDate) {
	var statusBar = $('#status-module');

	if (mode == 'home') {
		text = 'Hemmaläge är aktiverad tills ' + endDate;
		statusBar.removeClass('orange green blue').addClass('orange');
		statusBar.find('span[class^="icon-"], span[class^="scy-icon-"]').removeClass().addClass('scy-icon-home-mode');
	} else if (mode == 'away') {
		text = 'Bortaläge är aktiverad tills ' + endDate;
		statusBar.removeClass('orange green blue').addClass('green');
		statusBar.find('span[class^="icon-"], span[class^="scy-icon-"]').removeClass().addClass('icon-suitcase');
	} else if (mode == 'normal') {
		text = 'Idealtemp börjar om 3 timmmar';
		statusBar.removeClass('orange green blue').addClass('green');
		statusBar.find('span[class^="icon-"], span[class^="scy-icon-"]').removeClass().addClass('icon-leaf');
	}

	statusBar.find('p').html(text);
}

function drawStats() {
		// STATS
		// Default data
		var hour = 3600 * 1000;
	  	var startHour = new Date(2013, 12, 22).getTime();
		var endHour = new Date(2013, 12, 23).getTime();
		var d1 = [
			[startHour, 21],
		    [startHour + hour * 9.8, 21],
		    [startHour + hour * 9.9, 20.04],
		    [startHour + hour * 10.1, 19.24],
		    [startHour + hour * 10.3, 17.96],
		    [startHour + hour * 10.5, 17],
		    [startHour + hour * 10.7, 16.36],
		    [startHour + hour * 10.9, 16.04],
		    [startHour + hour * 12.1, 16.04],
		    [startHour + hour * 16.1, 16.04],
		    [startHour + hour * 16.3, 16.36],
		    [startHour + hour * 16.5, 17],
		    [startHour + hour * 16.7, 17.96],
			[startHour + hour * 17.1, 20.84],
		];
		
		d1.push(
			[startHour + hour * 17.2, 21],
			[endHour, 21]
		);

		var d2 = [[startHour, 21], [endHour, 21]];
		var opt = {
			yaxis: {
				min: 14,
				max: 24,
				position: 'left'
			},
			xaxis: {
				mode: "time",
				minTickSize: [5, "hour"],
				min: (new Date(2013, 12, 22)).getTime(),
				max: (new Date(2013, 12, 23)).getTime(),
			},
			grid: {
				backgroundColor: '#ffffff',
			}
		};

		if ($('#stats').length > 0) {
			var plot = $.plot("#stats", [{
				data: d1,
				id: 'saving',
				fillBetween: 'standart',
				color: '#93c272', // green
				label: 'Sparläge',
				lines: {show: true, fill: true}
			}, {
				data: d2,
				color: '#F05A1A',
				// label: 'Standart temp',
				id: 'standart',
				lines: {show: false}
			}], opt);
		}
}
;
