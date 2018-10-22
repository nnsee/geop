/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define(function () {

    'use strict';

    function CoordinateParser(search) {
        this._mapmodule = search._mapmodule;
        // coordinates formats parsers
        this._formats = [{
            /*
            * EPSG:32634
            * North East
            * 34N;6472665;660394
            * 34N 6472665,57 660394.45
            */
            regexp: /^(34N)[ ,;:]\s*([0-9]{7}|[0-9]{1,7}[,.]\d{0,9})[ ,;:]\s*([0-9]{6}|[0-9]{6}[,.]\d{0,9})\s*$/,
            srid: 'EPSG:32634',
            srname: 'UTM 34N',
            get: function (matches) {
                return [Number(matches[3].replace(',', '.')), Number(matches[2].replace(',', '.'))];
            }
        }, {
            /*
            * EPSG:32634
            * East North
            * 34N;660394;6472665
            * 34N 660394.45 6472665,57
            */
            regexp: /^(34N)[ ,;:]\s*?([0-9]{6}|[0-9]{6}[,.]\d{0,9})[ ,;:]\s*([0-9]{7}|[0-9]{1,7}[,.]\d{0,9})\s*$/,
            srid: 'EPSG:32634',
            srname: 'UTM 34N',
            get: function (matches) {
                return [Number(matches[2].replace(',', '.')), Number(matches[3].replace(',', '.'))];
            }
        }, {
            /*
            * EPSG:32635
            * North East
            * 35N;6472665;660394
            * 35N 6472665,57 660394.45
            */
            regexp: /^(35N)[ ,;:]\s*([0-9]{7}|[0-9]{1,7}[,.]\d{0,9})[ ,;:]\s*([0-9]{6}|[0-9]{6}[,.]\d{0,9})\s*$/,
            srid: 'EPSG:32635',
            srname: 'UTM 35N',
            get: function (matches) {
                return [Number(matches[3].replace(',', '.')), Number(matches[2].replace(',', '.'))];
            }
        }, {
            /*
            * EPSG:32635
            * East North
            * 35N;660394;6472665
            * 35N 660394.45 6472665,57
            */
            regexp: /^(35N)[ ,;:]\s*?([0-9]{6}|[0-9]{6}[,.]\d{0,9})[ ,;:]\s*([0-9]{7}|[0-9]{1,7}[,.]\d{0,9})\s*$/,
            srid: 'EPSG:32635',
            srname: 'UTM 35N',
            get: function (matches) {
                return [Number(matches[2].replace(',', '.')), Number(matches[3].replace(',', '.'))];
            }
        }, {
            /*
            * EPSG:3301
            * North East
            * 6472665;660394
            * 6472665,57 660394.45
            */
            regexp: /^(6[3-6][0-9]{5}|6[3-6][0-9]{5}[,.]\d{0,9})[ ,;:]\s*([3-7][0-9]{5}|[3-7][0-9]{5}[,.]\d{0,9})\s*$/,
            srid: 'EPSG:3301',
            srname: 'L-EST97',
            get: function (matches) {
                return [Number(matches[2].replace(',', '.')), Number(matches[1].replace(',', '.'))];
            }
        }, {
            /*
            * EPSG:3301
            * East North
            * 660394;6472665
            * 660394.45 6472665,57
            */
            regexp: /^([3-7][0-9]{5}|[3-7][0-9]{5}[,.]\d{0,9})[ ,;:]\s*(6[3-6][0-9]{5}|6[3-6][0-9]{5}[,.]\d{0,9})\s*$/,
            srid: 'EPSG:3301',
            srname: 'L-EST97',
            get: function (matches) {
                return [Number(matches[1].replace(',', '.')), Number(matches[2].replace(',', '.'))];
            }
        }, {
            /*
            * EPSG:4326 kkk mm ss.nn
            * Latitude;Longitude
            * S 58 23 39 W 26 55 55
            * 58° 23’ 39";26° 55’ 55"
            * N58'23'39, E26'55'55
            */
            regexp: /^([\-NS])?\s*([0-8]\d?|90)[ ’'°]+([0-9]{2})[ ’']+([0-9]{1,2}[,.]?\d{1,9})["]?[ ,;:]\s*([\-EW])?\s*([0-1]\d{0,2}|\d{2})[ ’'°]+([0-9]{2})[ ’']+([0-9]{1,2}[,.]?\d{1,9})["]?\s*$/,
            srid: 'EPSG:4326',
            srname: 'WGS84',
            get: function (matches) {
                var coords = [
                    Number(matches[6]) + Number(matches[7]) / 60 + Number(matches[8].replace(',', '.')) / 60 / 60,
                    Number(matches[2]) + Number(matches[3]) / 60 + Number(matches[4].replace(',', '.')) / 60 / 60
                ];
                coords[1] = (matches[1] === '-' || matches[1] === 'S') ? -coords[1] : coords[1];
                coords[0] = (matches[5] === '-' || matches[5] === 'W') ? -coords[0] : coords[0];
                return coords;
            }
        }, {
            /*
            * EPSG:4326 kkk mm.nnn
            * Latitude;Longitude
            * 58 23.39;26 55.55
            * N58°23.39’ E26°55.55’
            */
            regexp: /^([\-NS])?\s*([0-8]\d?|90)[ .’'°]+([0-9]{1,2}[,.]?\d{1,18})[’']?[ ,;:]\s*([\-EW])?\s*([0-1]\d{0,2}|\d{2})[ ’'°]+([0-9]{1,2}[,.]?\d{1,18})[’']?\s*$/,
            srid: 'EPSG:4326',
            srname: 'WGS84',
            get: function (matches) {
                var coords = [
                    Number(matches[5]) + Number(matches[6].replace(',', '.')) / 60,
                    Number(matches[2]) + Number(matches[3].replace(',', '.')) / 60
                ];
                coords[1] = (matches[1] === '-' || matches[1] === 'S') ? -coords[1] : coords[1];
                coords[0] = (matches[4] === '-' || matches[4] === 'W') ? -coords[0] : coords[0];
                return coords;
            }
        }, {
            /*
            * EPSG:4326 kk.nnn
            * Latitude Longitude
            * 58,345;26.9876
            * N 58,345:E 26.9876
            */
            regexp: /^([\-NS])?\s*([1-8]?\d(?:[,.]\d{1,18})?|90(?:\.0{1,18})?)[’'°]?[ ,;:]\s*([\-EW])?\s*((?:1[0-7]|[1-9])?\d(?:[,.]\d{1,18})?|180(?:\.0{1,18})?)[’'°]?\s*$/,
            srid: 'EPSG:4326',
            srname: 'WGS84',
            get: function (matches) {
                var coords = [Number(matches[4].replace(',', '.')), Number(matches[2].replace(',', '.'))];
                coords[1] = (matches[1] === '-' || matches[1] === 'S') ? -coords[1] : coords[1];
                coords[0] = (matches[3] === '-' || matches[3] === 'W') ? -coords[0] : coords[0];
                return coords;
            }
        }];
    }

    CoordinateParser.prototype = {

        get : function (key) {
            return this['_' + key];
        },

        init : function () {

        },

        clear : function () {
            this._results = null;
        },

        test : function (query) {
            var matches, i, len, coords;
            for (i = 0, len = this._formats.length; i < len; i++) {
                matches = query.match(this._formats[i].regexp);
                if (matches && matches.length > 0) {
                    coords = this._formats[i].get(matches);
                    return {
                        'x' : coords[0],
                        'y' : coords[1],
                        'srid' : this._formats[i].srid
                    };
                }
            }
            return false;
        },

        find : function (query, cb, context) {
            // test coordinates
            var coords = this.test(query),
                clone;
            this._results = null;
            if (coords && coords.srid) {
                clone = this._mapmodule.transform('point', [coords.x, coords.y], coords.srid, 'EPSG:3857');
                this._mapmodule.addMarker(clone, {coordinates: ol.coordinate.format([coords.x, coords.y], '{y}, {x}', 5)});
                this._mapmodule.setView('center', [clone, 15]);
            }
            if (typeof cb === 'function') {
                cb(null, [], context);
            }
        }
    };

    return CoordinateParser;
});
