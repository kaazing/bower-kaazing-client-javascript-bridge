/**
 * Copyright (c) 2007-2014 Kaazing Corporation. All rights reserved.
 * 
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


/**
 * @ignore
 */
var browser = null;
if (typeof(ActiveXObject) != "undefined") {
    //KG-5860: treat IE 10 same as Chrome
    if(navigator.userAgent.indexOf("MSIE 10")!=-1){
        browser="chrome";
    }else{
        browser="ie";
    }
}
else if (navigator.userAgent.indexOf("Trident/7") != -1 && navigator.userAgent.indexOf("rv:11") != -1) {
    // treat IE 11 same as chrome
    // IE 11 UA string - http://blogs.msdn.com/b/ieinternals/archive/2013/09/21/internet-explorer-11-user-agent-string-ua-string-sniffing-compatibility-with-gecko-webkit.aspx
    // window.ActiveXObject property is hidden from the DOM
    browser = "chrome";
}
else if(Object.prototype.toString.call(window.opera) == "[object Opera]") {
    browser = 'opera';
}
else if (navigator.vendor.indexOf('Apple') != -1) {
    // This has to happen before the Gecko check, as that expression also
    // evaluates to true.
    browser = 'safari';
    // add ios attribute for known iOS substrings
    if (navigator.userAgent.indexOf("iPad")!=-1 || navigator.userAgent.indexOf("iPhone")!=-1) {
    	browser.ios = true;
    }
}
else if (navigator.vendor.indexOf('Google') != -1) {
    if ((navigator.userAgent.indexOf("Android") != -1) &&
        (navigator.userAgent.indexOf("Chrome") == -1)) {
        browser = "android";
    }
    else {
        browser="chrome";
    }
}
else if (navigator.product == 'Gecko' && window.find && !navigator.savePreferences) {
    browser = 'firefox'; // safari as well
}
else {
    throw new Error("couldn't detect browser");
}



/**
 * Creates a new URI instance with the specified location.
 *
 * @param {String} str  the location string
 * 
 * @private
 * @class  Represents a Uniform Resource Identifier (URI) reference. 
 */
function URI(str) {
	// TODO: use regular expression instead of manual string parsing
    str = str || "";
    var position = 0;
    
    var schemeEndAt = str.indexOf("://");
    if (schemeEndAt != -1) {
	    /**
	     * The scheme property indicates the URI scheme.
	     *
	     * @public
	     * @field
	     * @name scheme
	     * @type String
	     * @memberOf URI
	     */
        this.scheme = str.slice(0, schemeEndAt);
        position = schemeEndAt + 3;

        var pathAt = str.indexOf('/', position);
        if (pathAt == -1) {
           pathAt = str.length;
           // Add trailing slash to root URI if it is missing
           str += "/";
        }

        var authority = str.slice(position, pathAt);
        /**
         * The authority property indiciates the URI authority.
         *
         * @public
         * @field
         * @name authority
         * @type String
         * @memberOf URI
         */
        this.authority = authority;
        position = pathAt;
        
        /**
         * The host property indiciates the URI host.
         *
         * @public
         * @field
         * @name host
         * @type String
         * @memberOf URI
         */
        this.host = authority;
        var colonAt = authority.indexOf(":");
        if (colonAt != -1) {
            this.host = authority.slice(0, colonAt);

	        /**
	         * The port property indiciates the URI port.
	         *
	         * @public
	         * @field
	         * @name port
	         * @type Number
	         * @memberOf URI
	         */
            this.port = parseInt(authority.slice(colonAt + 1), 10);
            if (isNaN(this.port)) {
                throw new Error("Invalid URI syntax");
            }
        } 
    }

    var queryAt = str.indexOf("?", position);
    if (queryAt != -1) {
        /**
         * The path property indiciates the URI path.
         *
         * @public
         * @field
         * @name path
         * @type String
         * @memberOf URI
         */
        this.path = str.slice(position, queryAt);
        position = queryAt + 1;
    }

    var fragmentAt = str.indexOf("#", position);
    if (fragmentAt != -1) {
        if (queryAt != -1) {
            this.query = str.slice(position, fragmentAt);
        }
        else {
            this.path = str.slice(position, fragmentAt);
        }
        position = fragmentAt + 1;
        /**
         * The fragment property indiciates the URI fragment.
         *
         * @public
         * @field
         * @name fragment
         * @type String
         * @memberOf URI
         */
        this.fragment = str.slice(position);
    }
    else {
        if (queryAt != -1) {
            this.query = str.slice(position);
        }
        else {
            this.path = str.slice(position);
        }
    }
}

(function() {
    var $prototype = URI.prototype;
    
    /**
     * Returns a String representation of this URI.
     *
     * @return {String}  a String representation
     *
     * @public
     * @function
     * @name toString
     * @memberOf URI
     */
    $prototype.toString = function() {
        var sb = [];
        
        var scheme = this.scheme;
        if (scheme !== undefined) {
            sb.push(scheme);
            sb.push("://");
            sb.push(this.host);
            
            var port = this.port;
            if (port !== undefined) {
                sb.push(":");
                sb.push(port.toString());
            }
        }
        
        if (this.path !== undefined) {
          sb.push(this.path);
        }
        
        if (this.query !== undefined) {
          sb.push("?");
          sb.push(this.query);
        }
        
        if (this.fragment !== undefined) {
          sb.push("#");
          sb.push(this.fragment);
        }
        
        return sb.join("");
    };

    var DEFAULT_PORTS = { "http":80, "ws":80, "https":443, "wss":443 };
    
    URI.replaceProtocol = function(location, protocol) {
        var indx = location.indexOf("://");
        if (indx > 0) {
            return protocol + location.substr(indx);
        } else {
            return "";
        }
    }
})();



(function() {
   var explicitDocumentDomain = false;

    window.onload = function() {
        // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
        var locationURI = new URI((browser == "ie") ? document.URL : location.href);
        var defaultPorts = { "http":80, "https":443 };
        if (locationURI.port == null) {
            locationURI.port = defaultPorts[locationURI.scheme];
            locationURI.authority = locationURI.host + ":" + locationURI.port;
        }

        // If the frame cannot read the location of a frame known to be in
        // the same domain, then the document.domain must be set explicitly.
        try {
            var ownerLocation = parent.parent.location.href;
            // Safari returns undefined rather than throwing an exception
            // when document.domain does not match correctly
            if (typeof(ownerLocation) === "undefined") {
                throw new Error("Access discouraged");
            }
        } catch (domainError) {
            var parts = document.domain.split(".");
            do  {
                try {
                    if (typeof(CollectGarbage) !== "undefined") {
                        CollectGarbage();
                    }
                    document.domain = parts.join(".");
                    explicitDocumentDomain = document.domain;
                    var ownerLocation = parent.parent.location.href;
                    // Safari returns undefined rather than throwing an exception
                    // when document.domain does not match correctly
                    if (typeof(ownerLocation) === "undefined") {
                        throw new Error("Access discouraged");
                    }
                    break;
                } catch (accessDenied) {
                }
            } while (parts.shift());
            
            // If the parent domain (grandparent frame) completely mismatches the
            // parent resources domain, try again.
            if (parts.length === 0) {
                // IE6 spuriously causes document domains to mismatch when they should not
                throw new Error("PostMessage0 document domain mismatch");
            }
        }

        window.parent.parent.postMessage0.__init__(window, explicitDocumentDomain)
    }



})();
