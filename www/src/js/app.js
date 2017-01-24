/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global requirejs*/

requirejs.config({
    "urlArgs": "bust=" + (new Date()).getTime(),
    "waitSeconds": 60,
    "baseUrl" : "js",
    "paths" : {
        "text" : "lib/text",
        "templator" : "lib/handlebars-v4.0.5",
        "jquery" : "lib/jquery-2.2.0.min",
        "jquery.bootstrap" : "lib/bootstrap.min",
        "jquery.sortable" : "lib/jquery.fn.sortable",
        "proj4" : "lib/proj4",
        "ol" : "lib/ol-custom",
        "polyline" : "lib/polyline",
        "jsonpack" : "lib/jsonpack",
        "config" : "../config",
        "app": "app",
        "tmpl": "../tmpl"
    },
    "shim": {
        "jquery.bootstrap": {
            deps: ['jquery']
        },
        "jquery.sortable": {
            deps: ['jquery']
        },
        "ol": {
            exports: 'ol'
        },
        "polyline": {
            exports: 'polyline'
        }
    }
});

// Load the main app module to start the app
requirejs(['app/main']);
