function CSSAnimator (framesPerSecond) {
    var animator = new Animator (framesPerSecond),

        // Keeps track of the animations playing 
        animatedElements = {};

    this. = function (eleme)

    /**
     * Takes as input 2 RGBA arrays [0-255, 0-255, 0-255, 0-1] and returns the interpolated
     * RGBA string at q percent through the CIE*Lab color space.
     *
     * Arguments:
     *     sRGBA - Starting RGBA array of the interpolation
     *     eRGBA - Ending RGBA array of the interpolation
     *     q     - Percentage (domain: [0, 1]) of the progress of the interpolation through CIE*Lab color space
     *
     * Returns:
     *     CSS-valid RGBA string with the interpolated value ready to go.
     */
    function rgbaInterpolate (sRGBA, eRGBA, q) {

        var I = 0,
            RED    = I++,
            L_STAR = RED,

            GREEN  = I++,
            A_STAR = GREEN,

            BLUE   = I++,
            B_STAR = BLUE,

            ALPHA = I++;

        q = q < 0? 0 : q > 1? 1 : q;
        var p = 1 - q,
            r = Math.round,

            sL = x2L (r2X (sRGBA)),
            eL = x2L (r2X (eRGBA)),

            iL = p * sL[L_STAR] + q * eL[L_STAR],
            ia = p * sL[A_STAR] + q * eL[A_STAR],
            ib = p * sL[B_STAR] + q * eL[B_STAR],
            alphaValue = p * sRGBA[ALPHA] + q * eRGBA[ALPHA],

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




        var r = 'rgba(' + r(iRGBA[RED]) + ',' + r(iRGBA[GREEN]) + ',' + r(iRGBA[BLUE]) + ',' + alphaValue + ')';

        return r;
    }
}
