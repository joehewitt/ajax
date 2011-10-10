/* See license.txt for terms of usage */

var _ = require('underscore');

exports.get = function(url, params, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var data = xhr.responseText;
            try {
                data = JSON.parse(data);
            } catch (exc) {
            }
            callback(data);
        }
    }
    xhr.send();
}

exports.getJSON = function(url, params, cb) {
   var pairs = ['callback=jsonp'];
    _.each(params, function(value, key) {
        pairs[pairs.length] = key+'='+value;
    });
    if (pairs.length) {
        url = url + (url.indexOf('?') == -1 ? '?' : '&') + pairs.join('&');
    }

    function jsonpReturn(o) {
        window.jsonp = undefined;
        if (o.error) {
            cb(o);        
        } else {
            cb(0, o);
        }        
    }

    if (has('appjs')) {
        window.jsonp = jsonpReturn;

        appjs.load(url, 'GET', {}, params, function(err, data) {
            if (err) {
                cb(err);            
            } else {
                sandboxEval(data);
            }
        });
    } else {
        window.jsonp = function(o) {
            // Return on a timeout to ensure that getJSON calls return asynchronously. There
            // is a case in IE where, after hitting the back button, this will return
            // synchronously and potentially confuse some clients.
            setTimeout(function() { jsonpReturn(o) }, 0);
        }

        function cleanup() {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }            
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        // script.async = true;
        script.src = url;
        script.onload = cleanup;
        script.onerror = function(event) {
            cleanup();
            cb("Error");
        };
        var head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
    }
}
