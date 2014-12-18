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



switch (browser) {
case 'ie':
(function(){
    if (document.createEvent === undefined) {
	    var Event = function() {};
	    
	    Event.prototype.initEvent = function(eventType, canBubble, cancelable) {
	        this.type = eventType;
	        this.bubbles = canBubble;
	        this.cancelable = cancelable;
	    };
	
	    document.createEvent = function(eventName) {
	        if (eventName != "Events") {
	           throw new Error("Unsupported event name: " + eventName);
	        }
	        return new Event();
	    };
	}
    
	document._w_3_c_d_o_m_e_v_e_n_t_s_createElement = document.createElement;
	document.createElement = function(name) {
	
	    var element = this._w_3_c_d_o_m_e_v_e_n_t_s_createElement(name);
	
	    if (element.addEventListener === undefined) {
		    var allListeners = {};
		    element.addEventListener = function(name, listener, capture) { element.attachEvent("on" + name, listener); return addEventListener(allListeners, name, listener, capture); };
		    element.removeEventListener = function(name, listener, capture) { return removeEventListener(allListeners, name, listener, capture); };
		    element.dispatchEvent = function(event) { return dispatchEvent(allListeners, event); };
		}
	    
	    return element;
	};
	
    if (window.addEventListener === undefined) {
    	// Note: fireEvent does not support custom events
    	//       use an orphan router element instead
    	var router = document.createElement("div");
    	var routeMessage = (typeof(postMessage) === "undefined");
    	
        window.addEventListener = function(name, listener, capture) {
        	if (routeMessage && name == "message") {
        		router.addEventListener(name, listener, capture);
        	}
        	else {
	        	window.attachEvent("on" + name, listener);
	       	} 
       	};
        window.removeEventListener = function(name, listener, capture) { 
        	if (routeMessage && name == "message") {
        		router.removeEventListener(name, listener, capture);
        	}
        	else {
	        	window.detachEvent("on" + name, listener);
	       	} 
        };
        window.dispatchEvent = function(event) {
        	if (routeMessage && event.type == "message") {
        		router.dispatchEvent(event);
        	}
        	else {
        		window.fireEvent("on" + event.type, event);
        	} 
        };
    }
        
	function addEventListener(allListeners, name, listener, capture) {
	  if (capture) {
	    throw new Error("Not implemented");
	  }
	  var listeners = allListeners[name] || {};
	  allListeners[name] = listeners;
	  listeners[listener] = listener;
	}
	
	function removeEventListener(allListeners, name, listener, capture) {
	  if (capture) {
	    throw new Error("Not implemented");
	  }
	  var listeners = allListeners[name] || {};
	  delete listeners[listener];
	}
	
	function dispatchEvent(allListeners, event) {
	  var name = event.type;
	  var listeners = allListeners[name] || {};
	  for (var key in listeners) {
	      if (listeners.hasOwnProperty(key) && typeof(listeners[key]) == "function") {
                try {
                    listeners[key](event);
                }
                catch (e) {
                    // avoid letting listener exceptions
                    // prevent other listeners from firing
                }
	      }
	  }
	}
})();
break;
case 'chrome':
case 'android':
case 'safari':
	if (typeof(window.postMessage) === "undefined" && typeof(window.dispatchEvent) === "undefined" && typeof(document.dispatchEvent) === "function") {
	    window.dispatchEvent = function(event) {
	   		document.dispatchEvent(event);
	    };
		var addEventListener0 = window.addEventListener;
		window.addEventListener = function(type, listener, capture) {
			if (type === "message") {
			  document.addEventListener(type, listener, capture);
			}
			else {
			  addEventListener0.call(window, type, listener, capture);
			}
		}
		var removeEventListener0 = window.removeEventListener;
		window.removeEventListener = function(type, listener, capture) {
			if (type === "message") {
			  document.removeEventListener(type, listener, capture);
			}
			else {
			  removeEventListener0.call(window, type, listener, capture);
			}
		}
	}
	break;
case 'opera':
	var addEventListener0 = window.addEventListener;
	window.addEventListener = function(type, listener, capture) {
		var listener0 = listener;
		if (type === "message") {
			listener0 = function(event) {
				if (event.origin === undefined && event.uri !== undefined) {
					var uri = new URI(event.uri);
					delete uri.path;
					delete uri.query;
					delete uri.fragment;
					event.origin = uri.toString();
				}
				return listener(event);
			};
			listener._$ = listener0;
		}
		addEventListener0.call(window, type, listener0, capture);
	}

	var removeEventListener0 = window.removeEventListener;
	window.removeEventListener = function(type, listener, capture) {
		var listener0 = listener;
		if (type === "message") {
		  	listener0 = listener._$;
		}
		removeEventListener0.call(window, type, listener0, capture);
	}
	break;
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



// See HTML5 Specification, Section 6.4 Cross-document Messaging
/*
 * Provides an emulation of HTML5 window.postMessage, 
 * leveraging the native implementation if available.
 *
 * @function
 *
 * @param {Window} target  the target window to receive messages
 * @param {String} message the message to send to the target window
 * @param {String} origin  the origin of the message
 */
var postMessage0 =
(function() {
    // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
    var locationURI = new URI((browser == "ie") ? document.URL : location.href);
    var defaultPorts = { "http":80, "https":443 };
    if (locationURI.port == null) {
        locationURI.port = defaultPorts[locationURI.scheme];
        locationURI.authority = locationURI.host + ":" + locationURI.port;
    }

    var windowOrigin = locationURI.scheme + "://" + locationURI.authority;
    var prefix = "/.kr";

    // Note: typeof(postMessage) returns "object" on IE8, others return "function"
    if (typeof(postMessage) !== "undefined") {
        return function(target, message, origin) {
            if (typeof(message) != "string") {
                throw new Error("Unsupported type. Messages must be strings");
            }

            // widen target for null origins (such as file:///)
            if (origin === "null") {
                origin = "*";
            }

            // delegate to native postMessage
            switch (browser) {
            case "ie":
            case "opera":
            case "firefox":
                // IE 8, Opera 9.64 and Firefox 3.0 implement postMessage with synchronous behavior (!)
                setTimeout(function() {
                    target.postMessage(message, origin);
                }, 0);
                break;
            default:
                target.postMessage(message, origin);
                break;
            }
        }
    }
    else {
        // The emulation of postMessage uses fragment-identifier-messaging.
        //
        // Each message is of the form token(8) syn#(8) ack#(8) type[!payload], for example:
        //
        //    -->  01234567 00000001 00000000 f 06 "Hello,"
        //    <--  89abcdef 00000001 00000001 a
        //    -->  01234567 00000002 00000001 F 06 " world"
        //    <--  89abcdef 00000002 00000002 a
        //
        // Writes are immediately enabled after ack, because acks have no ack
        // so acks could be overwritten as follows:
        //
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000001 a
        //    <--  01234567 00000002 00000001 F 07 "welcome"
        //
        // The timing is sensitive to when ack#0 and message#1 are written versus
        // when the receiving fragment is read and processed.
        //
        // To overcome this, the ack is repeated by the sender, and the receiver
        // ignores old acks as follows:
        //
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000000 a
        //    <--  01234567 00000001 00000001 a 00000002 00000001 F 07 "welcome"
        //
        // No matter the relative timing, the receiver processes one and only one
        // ack#0 and message#1.
        //
        // Another problem is caused due to bidirectional messaging, when both sides
        // send a message before receiving the in-flight message, as follows:
        //  
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000000 F 07 "welcome"
        //
        // Now both sides are waiting for an ack before sending the ack, so deadlock occurs.
        //
        // To overcome this, when an ack is needed and a message is in flight, then the
        // message is repeated, but with an updated ack index as follows:
        //
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000000 F 07 "welcome"
        //    -->  01234567 00000001 00000001 F 05 "Hello"
        //
        // This repeated send causes the receiver to send the next message, acknowledging the
        // repeated send.  However, the duplicated message is not re-processed.
        // If the repeated send is received before the receiver observes the original, then
        // it behaves the same as if no deadlock occurred.
        //
        // Note: an alternative, to use a total of 4 iframes, with 2 pairs of (write, ack) iframes
        //       is considered unnecessary overhead
        
        function MessagePipe(iframe) {
            this.sourceToken = toPaddedHex(Math.floor(Math.random() * (Math.pow(2, 32) - 1)), 8);
            this.iframe = iframe;
            this.bridged = false;
            this.lastWrite = 0;
            this.lastRead = 0;
            this.lastReadIndex = 2; // ack# position in payload structure (zero-based)
            this.lastSyn = 0;
            this.lastAck = 0;
            this.queue = [];
            this.escapedFragments = [];
        }
        
        var $prototype = MessagePipe.prototype;

        $prototype.attach = function(target, targetOrigin, targetToken, reader, writer, writerURL) {
            this.target = target;
            this.targetOrigin = targetOrigin;
            this.targetToken = targetToken;
            this.reader = reader;
            this.writer = writer;
            this.writerURL = writerURL;
            
            // initialize the polling state to detect hash changes
            try {
                this._lastHash = reader.location.hash;
                // poll location.hash for updates
                this.poll = pollLocationHash;
            }
            catch (permissionDenied) {
                this._lastDocumentURL = reader.document.URL;
                // poll document.URL for updates
                this.poll = pollDocumentURL;
            }
            
            if (target == parent) {
                // target can write immediately
                // send ack to parent
                dequeue(this, true);
            }
        }
        
        $prototype.detach = function() {
            // no more updates, stop polling reader
            this.poll = function() {};
            delete this.target;
            delete this.targetOrigin;
            delete this.reader;
            delete this.lastFragment;
            delete this.writer;
            delete this.writerURL;
        }
        
        $prototype.poll = function() {};
        
        function pollLocationHash() {
            // handle normal case, where location.hash is readable
            var currentHash = this.reader.location.hash;
            if (this._lastHash != currentHash) {
                process(this, currentHash.substring(1));
                this._lastHash = currentHash;
            }
        }
        
        function pollDocumentURL() {
            // handle IE6 case, where same document.domain permits access
            // to objects in collaborating windows, but not the location.hash
            var documentURL = this.reader.document.URL;
            if (this._lastDocumentURL != documentURL) {
                var hashAt = documentURL.indexOf("#");
                if (hashAt != -1) {
                    process(this, documentURL.substring(hashAt + 1));
                    this._lastDocumentURL = documentURL;
                }
            }
        }
        
        $prototype.post = function(target, message, targetOrigin) {
            // create bridge iframe, or enable target to create bridge iframe
            bridgeIfNecessary(this, target);
            
            // fragmentation: f = fragment, F = final fragment
            var maxFragmentSize = 1000;
            var escapedMessage = escape(message);
            var escapedFragments = [];
            while (escapedMessage.length > maxFragmentSize) {
                var escapedFragment = escapedMessage.substring(0, maxFragmentSize);
                escapedMessage = escapedMessage.substring(maxFragmentSize);
                escapedFragments.push(escapedFragment);
            }
            escapedFragments.push(escapedMessage);
            
            this.queue.push([targetOrigin, escapedFragments]);
            
            if (this.writer != null && this.lastAck >= this.lastSyn) {
                dequeue(this, false);
            }
        }
        
        function bridgeIfNecessary($this, target) {
            if ($this.lastWrite < 1 && !$this.bridged) {
                if (target.parent == window) {
                    // first write to target writes parent origin to target hash
                    var src = $this.iframe.src;
                    var parts = src.split("#");

                    var sourceBridgeAuthority = null;
                    // TODO: and move this out to a sensible place
                    var tags = document.getElementsByTagName("meta");
                    for (var i=0; i<tags.length; i++) {
                        if (tags[i].name == "kaazing:resources") {
                            alert('kaazing:resources is no longer supported. Please refer to the Administrator\'s Guide section entitled "Configuring a Web Server to Integrate with Kaazing Gateway"');
                        }
                    }

                    // default sourceBridgeURL using this location, the configured prefix, and the usual qs
                    var sourceOrigin = windowOrigin;
                    var sourceBridgeURL = sourceOrigin.toString() + prefix + "?.kr=xsp&.kv=10.05";

                    // narrow the bridge location if subdomain was specified
                    if (sourceBridgeAuthority) {
                        var sourceOriginURL = new URI(sourceOrigin.toString())

                        // sourceBridgeAuthority may have an explicit port
                        var parts = sourceBridgeAuthority.split(":");
                        sourceOriginURL.host = parts.shift();
                        if (parts.length) {
                            sourceOriginURL.port = parts.shift()
                        }

                        sourceBridgeURL = sourceOriginURL.toString() + prefix + "?.kr=xsp&.kv=10.05";
                    }

                    // if there is a bridge location configured, it should take precedence
                    for (var i=0; i<tags.length; i++) {
                        if (tags[i].name == "kaazing:postMessageBridgeURL") {
                            var bridgeUrlString = tags[i].content
                            var postMessageBridgeURL = new URI(bridgeUrlString);

                            // verify URL and populate missing fields if it is a relative URL
                            var baseURL = new URI(location.toString());

                            // if the location is relative, use the page location as the base url 
                            if (!postMessageBridgeURL.authority) {
                                postMessageBridgeURL.host = baseURL.host;
                                postMessageBridgeURL.port = baseURL.port;
                                postMessageBridgeURL.scheme = baseURL.scheme;
                                // if the path is relative, replace the filename in the
                                // base url with the configured string
                                if (bridgeUrlString.indexOf("/") != 0) {
                                    var pathParts = baseURL.path.split("/");
                                    pathParts.pop();
                                    pathParts.push(bridgeUrlString);
                                    postMessageBridgeURL.path = pathParts.join("/");
                                }

                            }
                            postMessage0.BridgeURL = postMessageBridgeURL.toString();
                            
                        }
                    }
                    // overwrite the derived bridge url with an explicit version if present
                    if (postMessage0.BridgeURL) {
                        sourceBridgeURL = postMessage0.BridgeURL;
                    }

                    // Sending the initialization message to a listening frame containing postMessage0 (such as
                    // the XHRBridge) will trigger the creation of bridge iframes that have initialization arguments
                    // pushed down into them by hash replacement.
                    //
                    // source -> target 
                    // target -> (creates and sets hash) sourceBridge
                    // sourceBridge -> (creates and sets hash) targetBridge
                    var payload = ["I", sourceOrigin, $this.sourceToken, escape(sourceBridgeURL)];
                    if (parts.length > 1) {
                        var oldHash = parts[1];
                        payload.push(escape(oldHash));
                    }
                    parts[1] = payload.join("!")

                    // schedule location update to avoid stalling onload in FF15
                    setTimeout(function() {
                        target.location.replace(parts.join("#"));
                    }, 200);
                    
                    $this.bridged = true;
                }
            }
        }
        
        function flush($this, payload) {
            var newLocation = $this.writerURL + "#" + payload;
            $this.writer.location.replace(newLocation);
            //console.log("[" + $this.targetOrigin + "] flush:   " + payload);
        }

        function fromHex(formatted) {
            return parseInt(formatted, 16);
        }
        
        function toPaddedHex(value, width) {
            var hex = value.toString(16);
            var parts = [];
            width -= hex.length;
            while (width-- > 0) {
                parts.push("0");
            }
            parts.push(hex);
            return parts.join("");
        }
        
        function dequeue($this, ackIfEmpty) {
            var queue = $this.queue;
            var lastRead = $this.lastRead;
            
            if ((queue.length > 0 || ackIfEmpty) && $this.lastSyn > $this.lastAck) {
                // resend last payload with updated ack index to avoid deadlock
                var lastFrames = $this.lastFrames;
                var lastReadIndex = $this.lastReadIndex;
                
                if (fromHex(lastFrames[lastReadIndex]) != lastRead) {
                    lastFrames[lastReadIndex] = toPaddedHex(lastRead, 8);
                    flush($this, lastFrames.join(""));
                }
            }
            else if (queue.length > 0) {
                var entry = queue.shift();
                var targetOrigin = entry[0];

                // check target origin
                if (targetOrigin == "*" || targetOrigin == $this.targetOrigin) {
                    // reserve fragment frame index
                    $this.lastWrite++;

                    // build the fragment frame
                    var escapedFragments = entry[1];
                    var escapedFragment = escapedFragments.shift();
                    var typeIndex = 3; // location of "F" in array below
                    var lastFrames = [$this.targetToken, toPaddedHex($this.lastWrite, 8), toPaddedHex(lastRead, 8), 
                                      "F", toPaddedHex(escapedFragment.length, 4), escapedFragment];
                    var lastReadIndex = 2;

                    // convert to partial fragment frame if necessary
                    if (escapedFragments.length > 0) {
                        lastFrames[typeIndex] = "f";
                        $this.queue.unshift(entry);
                    }

                    // resend ack with subsequent frame
                    // avoids potential gap in frame index sequence
                    if ($this.resendAck) {
                        // resend the previous ack frame before fragment frame
                        var ackFrame = [$this.targetToken, toPaddedHex($this.lastWrite-1, 8), toPaddedHex(lastRead, 8), "a"];
                        lastFrames = ackFrame.concat(lastFrames);
                        // increment the last read index (see ackIfEmpty case above)
                        lastReadIndex += ackFrame.length;
                    }

                    // send frame(s)
                    flush($this, lastFrames.join(""));

                    // remember last frames to manage deadlock
                    $this.lastFrames = lastFrames;
                    $this.lastReadIndex = lastReadIndex;

                    // expect ack for fragment frame
                    $this.lastSyn = $this.lastWrite;
                    
                    $this.resendAck = false;
                }
            }
            else if (ackIfEmpty) {
                // reserve ack frame index
                $this.lastWrite++;
                
                // build the ack frame
                var lastFrames = [$this.targetToken, toPaddedHex($this.lastWrite, 8), toPaddedHex(lastRead, 8), "a"];
                var lastReadIndex = 2;

                // resend ack with subsequent frame
                // avoids potential gap in frame index sequence
                if ($this.resendAck) {
                    // resend the previous ack frame before fragment frame
                    var ackFrame = [$this.targetToken, toPaddedHex($this.lastWrite-1, 8), toPaddedHex(lastRead, 8), "a"];
                    lastFrames = ackFrame.concat(lastFrames);
                    // increment the last read index (see ackIfEmpty case above)
                    lastReadIndex += ackFrame.length;
                }

                // send frame(s)
                flush($this, lastFrames.join(""));
                    
                // remember last frames to manage deadlock
                $this.lastFrames = lastFrames;
                $this.lastReadIndex = lastReadIndex;

                // support ack resend with subsequent frame
                // avoids potential gap in message index sequence
                $this.resendAck = true;
            }
        }
        
        function process($this, payload) {
            //console.log("[" + windowOrigin + "] process: " + payload);
            
            var sourceToken = payload.substring(0, 8);
            var synIndex = fromHex(payload.substring(8, 16));
            var ackIndex = fromHex(payload.substring(16, 24));
            var type = payload.charAt(24);

            if (sourceToken != $this.sourceToken) {
                throw new Error("postMessage emulation tampering detected");
            }

            // calculate the last read index and expected read index            
            var lastRead = $this.lastRead;
            var expectedRead = lastRead + 1;

            // update the last read index if the expected read index is observed
            if (synIndex == expectedRead) {
                $this.lastRead = expectedRead;
            }

            // support updating lastAck for expected or last read frame
            // the last read frame scenario is triggered by race condition
            // of both sides sending messages before the other side has
            // polled an incoming message
            if (synIndex == expectedRead || synIndex == lastRead) {
                $this.lastAck = ackIndex;
            }
            
            // process message payload, or skip over old ack to process remaining parts
            // when sending an ack, writes are enabled immediately, so a subsequent write
            // could overwrite the ack before it has been processed - to address this,
            // the new fragment contains both the original ack and the new message, so
            // we need the ability to skip over repeated acks, and process the remaining parts
            if (synIndex == expectedRead || (synIndex == lastRead && type == "a")) {
                switch (type) {
                    case "f":
                        var escapedFragment = payload.substr(29, fromHex(payload.substring(25,29)));
                        $this.escapedFragments.push(escapedFragment);

                        // send next message or ack
                        dequeue($this, true);
                        break;
                    case "F":
                        var escapedMessage = payload.substr(29, fromHex(payload.substring(25,29)));
                        if ($this.escapedFragments !== undefined) {
                            $this.escapedFragments.push(escapedMessage);
                            escapedMessage = $this.escapedFragments.join("");
                            $this.escapedFragments = [];
                        }
                        
                        var message = unescape(escapedMessage);

                        // dispatch message
                        dispatch(message, $this.target, $this.targetOrigin);

                        // send next message or ack
                        dequeue($this, true);
                        break;
                    case "a":
                        if (payload.length > 25) {
                            // process remaining frame fragments
                            process($this, payload.substring(25));
                        }
                        else {
                            // send next message
                            dequeue($this, false);
                        }
                        break;
                    default:
                        throw new Error("unknown postMessage emulation payload type: " + type)
                }
            }
        }
        
        function dispatch(message, source, origin) {
            //console.log("[" + origin + " -> " + windowOrigin + "]\n" + message);
            var messageEvent = document.createEvent("Events");
            messageEvent.initEvent("message", false, true);
            messageEvent.data = message;
            messageEvent.origin = origin;
            messageEvent.source = source;
            dispatchEvent(messageEvent);
        }
        
        // Note: ShrinkSafe requires var definitions before references
        var messagePipes = {};
        var pollMessagePipes = [];
        
        function pollReaders() {
            for (var i=0,len=pollMessagePipes.length; i < len; i++) {
                var messagePipe = pollMessagePipes[i];
                messagePipe.poll();
            }
            setTimeout(pollReaders, 20);
        }
        
        function findMessagePipe(target) {
            if (target == parent) {
                return messagePipes["parent"];
            }
            else if (target.parent == window) {
                var iframes = document.getElementsByTagName("iframe");
                for (var i=0; i < iframes.length; i++) {
                    var iframe = iframes[i];
                    if (target == iframe.contentWindow) {
                        return supplyIFrameMessagePipe(iframe);
                    }
                }
            }
            else {
                throw new Error("Generic peer postMessage not yet implemented");
            }
        }
        
        function supplyIFrameMessagePipe(iframe) {
            var name = iframe._name;
            if (name === undefined) {
                name = "iframe$" + String(Math.random()).substring(2);
                iframe._name = name;
            }
            var messagePipe = messagePipes[name];
            if (messagePipe === undefined) {
                messagePipe = new MessagePipe(iframe);
                messagePipes[name] = messagePipe;
            }
            return messagePipe;
        }
        
        function postMessage0(target, message, targetOrigin) {
            if (typeof(message) != "string") {
                throw new Error("Unsupported type. Messages must be strings");
            }

            //console.log("[" + windowOrigin + " -> " + targetOrigin + "]\n" + message);
            if (target == window) {
                // dispatch message locally
                if (targetOrigin == "*" || targetOrigin == windowOrigin) {
                    dispatch(message, window, windowOrigin);
                }
            }
            else {
                var messagePipe = findMessagePipe(target);
                messagePipe.post(target, message, targetOrigin);
            }
        }
        
        postMessage0.attach = function(target, targetOrigin, targetToken, reader, writer, writerURL) {
            var messagePipe = findMessagePipe(target);
            messagePipe.attach(target, targetOrigin, targetToken, reader, writer, writerURL);
            pollMessagePipes.push(messagePipe);
        }

    var initSourceOriginBridge = function(htmlfileDomain) {
        // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
        var locationURI = new URI((browser == "ie") ? document.URL : location.href);
        var htmlfile;

        var defaultPorts = { "http":80, "https":443 };
        if (locationURI.port == null) {
            locationURI.port = defaultPorts[locationURI.scheme];
            locationURI.authority = locationURI.host + ":" + locationURI.port;
        }

        var locationHash = unescape(locationURI.fragment || "");
        
        if (locationHash.length > 0) {
            var locationHashParts = locationHash.split(",");

            // create the postMessage target iframe
            var targetOrigin = locationHashParts.shift();
            var sourceToken = locationHashParts.shift();
            var targetToken = locationHashParts.shift();

            var sourceOrigin = locationURI.scheme + "://" + document.domain + ":" + locationURI.port;
            var sourceBridgeOrigin = locationURI.scheme + "://" + locationURI.authority;
            var targetBridgeURL = targetOrigin + "/.kr?.kr=xsc&.kv=10.05";

            // derive the source bridge location (without hash) from the current page:
            var sourceBridgeURL = document.location.toString().split("#")[0];
            var targetBridgeInitURL = targetBridgeURL + "#" + escape([sourceOrigin, sourceToken, escape(sourceBridgeURL)].join(","));

            // avoid IE clicking
            if (typeof(ActiveXObject) != "undefined") {
                htmlfile = new ActiveXObject("htmlfile");
                htmlfile.open();
                // some IE versions (such as MultipleIEs) give "Access denied" error when setting 
                // parentWindow.opener unless the document domain is specified on the htmlfile
                // other IE versions (such as vanilla IE6 and IE7) fail to synchronize the domains
                // if document domain is specified explicitly for the htmlfile
                try {
                    // let the sourceBridge window be reachable from postMessage target bridge iframe
                    htmlfile.parentWindow.opener = window;

                }
                catch (domainError) {

                    if(htmlfileDomain){
                        htmlfile.domain = htmlfileDomain;
                    } 
                    // let the sourceBridge window be reachable from postMessage target bridge iframe
                    htmlfile.parentWindow.opener = window;
                }
                htmlfile.write("<html>");
                htmlfile.write("<body>");

                // set document.domain for htmlfile if necessary
                if (htmlfileDomain) {
                    htmlfile.write("<script>CollectGarbage();document.domain='" + htmlfileDomain + "';</" + "script>");
                };
                
                // IE cannot tolerate # in the initial iframe URL inside ActiveXObject("htmlfile")
                htmlfile.write("<iframe src=\"" + targetBridgeURL + "\"></iframe>");
                htmlfile.write("</body>");
                htmlfile.write("</html>");
                htmlfile.close();

                var iframe = htmlfile.body.lastChild;
                var sourceBridge = htmlfile.parentWindow;
                var target = parent;
                var postMessage0 = target.parent.postMessage0;

                if (typeof(postMessage0) != "undefined") {
                    // we must wait until the iframe has completed loading before
                    // replacing the targetBridge location, otherwise many cascading
                    // new IE windows or tabs will be opened (a.k.a "postMessage bomb")
                    iframe.onload = function() {
                        // delay accessing the iframe contentWindow until after iframe has loaded
                        var targetBridge = iframe.contentWindow;
                        
                        // replace the location to include the # that initializes the target bridge
                        targetBridge.location.replace(targetBridgeInitURL);

                        // attach the targetBridge writer to the sourceWindow postMessage emulation
                        postMessage0.attach(target, targetOrigin, targetToken, sourceBridge, targetBridge, targetBridgeURL);
                    }
                }
            }
            else {
                // Note: Safari requires initial URL to have a # in order to support
                //       fragment identifier changes with location.replace
                //       otherwise the first fragment change causes page reload
                var iframe = document.createElement("iframe");
                iframe.src = targetBridgeInitURL;
                document.body.appendChild(iframe);

                var sourceBridge = window;
                var targetBridge = iframe.contentWindow;
                var target = parent;
                var postMessage0 = target.parent.postMessage0;


                if (typeof(postMessage0) != "undefined") {
                    // attach the targetBridge writer to the source postMessage emulation
                    postMessage0.attach(target, targetOrigin, targetToken, sourceBridge, targetBridge, targetBridgeURL);
                }
            }
        }

        window.onunload = function() {
            // detach sourceBridge window reference (htmlfile for IE)
            try {
                var postMessage0 = window.parent.parent.postMessage0;
                if (typeof(postMessage0) != "undefined") {
                    postMessage0.detach(target);
                }
            }
            catch (permissionDenied) {
                // Note: this occurs for IE6 when domain mismatch causes this document to be reloaded
                // deliberately ignore
            }
            
            // clean up htmlfile
            if (typeof(htmlfile) !== "undefined") {
                // explicitly remove window reference
                htmlfile.parentWindow.opener = null;

                // explicitly clear out contents
                htmlfile.open();
                htmlfile.close();
                
                // remove the reference to the ActiveXObject
                htmlfile = null;
                // garbage collect ActiveXObject
                CollectGarbage();
            }
        };
    };

        postMessage0.__init__ = function(sourceOriginBridgeWindow, explicitDocumentDomain) {
            var funcString = initSourceOriginBridge.toString()

            // Inject URI and browser (dependencies for initSourceOriginBridge)
            sourceOriginBridgeWindow.URI = URI;
            sourceOriginBridgeWindow.browser = browser;

            // send falsy value for explicitDocumentDomain if it is falsy
            if (!explicitDocumentDomain) {
                explicitDocumentDomain = "";
            }

            // For IE6, the htmlfile object cannot be created in a callstack
            // that touches the source window. Executing initSourceOriginBridge
            // in the source window creates an ActiveX htmlfile object with the
            // source location rather than the bridge location. The same
            // incorrect location is set when a closure is scheduled from the
            // source window.
            //
            // For this reason, a string is scheduled to be evaled in the source
            // window.
            sourceOriginBridgeWindow.setTimeout("(" + funcString + ")('" + explicitDocumentDomain + "')", 0);

        }

        postMessage0.bridgeURL = false;

        postMessage0.detach = function(target) {
            var messagePipe = findMessagePipe(target);
            for (var i=0; i < pollMessagePipes.length; i++) {
                if (pollMessagePipes[i] == messagePipe) {
                    pollMessagePipes.splice(i, 1);
                }
            }
            messagePipe.detach();
        }

        // target frames poll to get parent origin        
        if (window != top) {
            // no parent pipe needed for top window
            messagePipes["parent"] = new MessagePipe();
        
            function initializeAsTargetIfNecessary() {
                // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
                var locationURI = new URI((browser == "ie") ? document.URL : location.href);
                var locationHash = locationURI.fragment || "";
                if (document.body != null && locationHash.length > 0 && locationHash.charAt(0) == "I") {
                    var payload = unescape(locationHash);
                    var parts = payload.split("!");
                    // init command
                    if (parts.shift() == "I") {
                        var sourceOrigin = parts.shift();
                        var sourceToken = parts.shift();
                        var sourceBridgeURL = unescape(parts.shift());
                        var targetOrigin = windowOrigin;
                        
                        // handle IE6 same-origin, mixed implicit / explicit document.domain case
                        if (sourceOrigin == targetOrigin) {
                            try {
                                // Note: IE restricts access to location object when parent is in 
                                //       the same domain with explicit document.domain
                                //       testing parent.location.hash rather than just location.hash
                                //       is necessary for Win2K3
                                parent.location.hash;
                            }
                            catch (permissionDenied) {
                                // explicitly assign domain, making parent.postMessage0 accessible
                                document.domain = document.domain;
                            }
                        }



                        // we have finished observing the postMessage initialization hash sent by parent
                        // so now restore the original hash
                        var oldHash = parts.shift() || "";
                        switch (browser) {
                        case "firefox":
                            // Firefox 3.0 and higher has a native implementation of postMessage
                            // assigning location.hash in Firefox 2.0 causes history entry
                            location.replace([location.href.split("#")[0], oldHash].join("#"));
                            break;
                        default:
                            // location.hash is always writable, even in IE6 after document.domain assigned
                            location.hash = oldHash;
                            break;
                        }
                        
                        var sourceMessagePipe = findMessagePipe(parent);
                        sourceMessagePipe.targetToken = sourceToken;
                        var targetToken = sourceMessagePipe.sourceToken;


                        var sourceBridgeURLwithHash = sourceBridgeURL + "#" + escape([targetOrigin, sourceToken, targetToken].join(","));
                        var sourceBridge;


                        sourceBridge = document.createElement("iframe");
                        sourceBridge.src = sourceBridgeURLwithHash;

                        
                        sourceBridge.style.position = "absolute";
                        sourceBridge.style.left = "-10px";
                        sourceBridge.style.top = "10px";
                        sourceBridge.style.visibility = "hidden";
                        sourceBridge.style.width = "0px";
                        sourceBridge.style.height = "0px";
                        document.body.appendChild(sourceBridge);
                        return;
                    }
                }
                setTimeout(initializeAsTargetIfNecessary, 20);
            }
            
            initializeAsTargetIfNecessary();
        }

        // proactively set the parent origin information on appropriately tagged iframes
        var tags = document.getElementsByTagName("meta");
        for(var i=0; i < tags.length; i++) {
            if (tags[i].name === "kaazing:postMessage") {
                if ("immediate" == tags[i].content) {
                    var checkAllIframes = function() {
                        var iframes = document.getElementsByTagName("iframe");
                        for (var i=0; i < iframes.length; i++) {
                            var iframe = iframes[i];
                            if (iframe.style["KaaPostMessage"] == "immediate") {
                                iframe.style["KaaPostMessage"] = "none";
                                var messagePipe = supplyIFrameMessagePipe(iframe);
                                bridgeIfNecessary(messagePipe, iframe.contentWindow);
                            }
                        }
                        setTimeout(checkAllIframes, 20);
                    };
                    setTimeout(checkAllIframes, 20);
                }
                break;
            }
        }
        for(var i = 0; i < tags.length; i++) {
            if (tags[i].name === "kaazing:postMessagePrefix") {
                var newPrefix = tags[i].content;
                if (newPrefix != null && newPrefix.length > 0) {
                    if (newPrefix.charAt(0) != "/") {
                        newPrefix = "/" + newPrefix;
                    }
                    prefix = newPrefix;
                }
            }
        }
        
        setTimeout(pollReaders, 20);

        // return postMessage0 for non-native postMessage
        return postMessage0;
    }
})();



(function() {
	// IE6 cannot access window.location after document.domain is assigned, use document.URL instead
    var locationURI = new URI((browser == "ie") ? document.URL : location.href);
    var defaultPorts = { "http":80, "https":443 };
    if (locationURI.port == null) {
    	locationURI.port = defaultPorts[locationURI.scheme];
    	locationURI.authority = locationURI.host + ":" + locationURI.port;
    }
    
    var registry = {};
    
    var htmlfile;
    
    // Cross-site Access Control
    var xsRequestMethods = { "GET":1, "POST":1 };
    var xsRequestHeaders = { "Accept": 1, "Accept-Language": 1, "Content-Type": 1, "Authorization": 1, "X-WebSocket-Protocol": 1, "X-WebSocket-Extensions": 1, "X-WebSocket-Version": 1, "X-Accept-Commands": 1};
    var xsPostContentTypes = { "application/x-www-form-url-encoded":1, "multipart/form-data":1, "text/plain":1 };
    var xsResponseHeaders = { "Location":1, "Cache-Control":1, "Content-Language":1, "Content-Type":1, "Expires":1, "Last-Modified":1, "Pragma":1, "WWW-Authenticate":1, "X-WebSocket-Protocol": 1, "X-WebSocket-Extensions": 1, "X-WebSocket-Version": 1, "X-Accept-Commands": 1, "X-Idle-Timeout": 1};
    

    /**
     * @ignore
     */
    window.onload = function() {
        if (browser == "ie") {
            // use the ActiveXObject "htmlfile" to avoid loading bar and clicking sound
            // set iframe source URL, and start polling to detect when 
            // iframe content window becomes available for scripting    
            htmlfile = new ActiveXObject("htmlfile");
            htmlfile.open();
            htmlfile.write("<html>");
            htmlfile.write("<body>");
            htmlfile.write("</body>");
            htmlfile.write("<html>");
            htmlfile.close();

        	// Note: It is important _not_ to set htmlfile.domain when document.domain
        	//       is explicit in the XMLHttpBridge iframe because streaming
        	//       iframes inside htmlfile will not have explicit document.domain
        	//       so the htmlfile must also have implicit document.domain.
        	//       Fortunately, iframes created via htmlfile.createElement have
        	//       contentWindow accessible to the XMLHttpBridge iframe, 
        	//       even if document.domain is explict in the XMLHttpBridge iframe.
        }

        // initialize communication
        postMessage0(parent, "I", "*");
    };

    /**
     * Ensures that the iframe timers terminate by causing
     * any pending streams to abort.
     * @ignore
     */
    window.onbeforeonload = function() {
        while (document.body.firstChild) {
            var iframe = document.body.firstChild;
            iframe.src = "about:blank";
        }
    }

    /**
     * Cleans up the htmlfile ActiveXObject on unload.
     * @ignore
     */
    window.onunload = function() {
        if (browser == "ie") {
            // explicitly clear out contents
            htmlfile.open();
            htmlfile.close();
            
            // remove the reference to the ActiveXObject
            htmlfile = null;
            // garbage collect ActiveXObject
            CollectGarbage();
        }
    };

    /**
     *  Polls until the iframe has become available for scripting.
     *  Note: we cannot use iframe.onreadystatechange due to IE bug
     *        see http://support.microsoft.com/kb/239638
     * @ignore
     */
    function loading(source, origin, id, iframe, timerID) {
        var contentWindow;

        try {
            // IE throws exception accessing iframe.contentWindow
            // when the request fails, so deliver onerror callback
            // and do not schedule any additional processing
            // of the iframe contents
            contentWindow = iframe.contentWindow;
        }
        catch (e) {
            if (timerID != null) { 
                clearTimeout(timerID);
            }
            doError(id);
            return;
        }
        
        var contentDocument = contentWindow.document;
        if (!contentDocument) {
            // suggested workaround from knowledge base, use timer
            setTimeout(function() {
                loading(source, origin, id, iframe, timerID);
            }, 20);
            return;
        }

        // check if iframe content window document is ready
        // Note: contentDocument.onreadystatechange does not seem reliable
        //       so we are polling here instead
        // Note: contentDocument.readyState will be stuck in "loading" if
        //       the content type is not served as text/plain
        switch (contentDocument.readyState) {
        case "interactive":
        case "complete":
            // no longer loading, cancel error timer        
            if (timerID != null) {
                clearTimeout(timerID);
            }

            setTimeout(function() {
                interactive(source, origin, id, iframe);
            }, 0);
            break;

        default:
            setTimeout(function() {
                loading(source, origin, id, iframe, timerID);
            }, 20);
            break;
        }
    }

    /**
     * Represents the behavior for streaming response.
     * @ignore
     */    
    function interactive(source, origin, id, iframe) {
        var contentWindow = iframe.contentWindow;
        var preNode = contentWindow.document.body.childNodes[0];
        contentWindow._progressAt = 0;
        contentWindow._readyState = 2;

        // poll the contents of the stream  
        function poll() {
            try {
                var contentDocument = contentWindow.document;;
                var readyState = (contentDocument.readyState == "complete") ? 4 : 3;
                var currentNodeIndex = contentWindow.currentNodeIndex || 0;            
            
                // process emulated headers in payload
                switch (contentWindow._readyState) {
                case 2:
                    var combinedTextNodes = [];
                    for (var node=preNode.firstChild; node; node=node.nextSibling) {
                        combinedTextNodes.push(node.data);
                    }

                    var xmlHttp0 = parseEmulatedResponse(combinedTextNodes.join(""));

                    if (xmlHttp0 !== null) {
                        contentWindow._readyState = readyState;
                    
                        // TODO: verify Access-Control headers
                    
                        // access restricted for non-whitelist response headers
                        var responseHeaders = [];
                        for (var responseHeaderName in xsResponseHeaders) {
                            if (typeof(responseHeaderName) == "string") {
                                var responseHeaderValue = xmlHttp0.getResponseHeader(responseHeaderName);
                                if (responseHeaderValue != null) {
                                    responseHeaders.push([responseHeaderName, responseHeaderValue]);
                                }
                            }
                        }
                    
                        // notify meta data changes
                        postReadyMessage(source, origin, id, responseHeaders, xmlHttp0.status, xmlHttp0.statusText);
                    
                        var endOfHeadersAt = xmlHttp0.endOfHeadersAt;

                        while (endOfHeadersAt > preNode.childNodes[currentNodeIndex].length) {
                            endOfHeadersAt -= preNode.childNodes[currentNodeIndex].length;
                            currentNodeIndex++;
                        }
                        contentWindow.oldNodeCount = currentNodeIndex;
                        contentWindow.oldNodeDataLength = endOfHeadersAt;
                    }
                    break;
                case 3:
                case 4:
                    contentWindow._readyState = readyState;
                    break;
                }
            
                if (contentWindow._readyState >= 3) {
                    // detect progress
                    var currentNode = preNode.childNodes[currentNodeIndex];
                    var currentNodeData = typeof(currentNode) !== "undefined" ? currentNode.data : "";
                    var newNodeCount = preNode.childNodes.length;
                    var oldNodeCount = contentWindow.oldNodeCount || 1; 
                    var oldNodeDataLength = contentWindow.oldNodeDataLength || 0;
                    var newNodeDataLength = currentNodeData.length;
                    var responseChunk = "";

                    if (newNodeDataLength > oldNodeDataLength || readyState == 4) {
                        responseChunk += currentNodeData.slice(oldNodeDataLength);
                        contentWindow.oldNodeDataLength = newNodeDataLength;  
                    }

                    // IE8 will append new textNodes to the PRE in text documents
                    if (newNodeCount > oldNodeCount) {
                        do {
                            currentNodeIndex++;
                            responseChunk += preNode.childNodes[currentNodeIndex].data;
                        } while (currentNodeIndex < newNodeCount - 1);

                        contentWindow.currentNodeIndex = currentNodeIndex;
                        contentWindow.oldNodeDataLength = preNode.childNodes[currentNodeIndex].data.length;
                        contentWindow.oldNodeCount = newNodeCount;
                    }

                    //    - progress -
                    //    <-- "p" 00000001 3 0000000c "Hello, world"
                
                    // deliver the progress callback
                    if (responseChunk.length > 0 || readyState === 4) {
                        postMessage0(source, ["p", id, readyState, toPaddedHex(responseChunk.length, 8), responseChunk].join(""), origin);
                    }
                }

                // detect close
                if (contentWindow._readyState != 4) {
                    // poll for changes in the response
                    contentWindow.setTimeout(poll, 50);
                }
                else {
                    doError(id);
                }
            }
            catch (e1) {
                doError(id);
            }
        }
    
        // preNode is undefined if stream not yet open due to content-type sniffing
        if (preNode) {
            // start polling the contents of the text stream to notice
            // events as they become available, and when the stream closes
            // Note: scheduling on the contentWindow implicitly cancels
            //       timer when content is changed to about:blank when aborting
            contentWindow.setTimeout(poll, 0);
        }
    }

    function onmessage(event) {
        if (event.source == parent) {
            // parse message
            var message = event.data;
            if (message.length >= 9) {
                var position = 0;
                var type = message.substring(position, position += 1);
                var id = message.substring(position, position += 8);
                
                switch (type) {
                case "s":
                    //    - send -
                    //    --> "s" 00000001 4 "POST" 0029 "http://gateway.example.com:8000/stomp" 
                    //            0001 000b "Content-Type" 000a "text/plain" 0000000c "Hello, world" 0005 t|f]

                    var methodSize = fromHex(message.substring(position, position += 1));
                    var method = message.substring(position, position += methodSize);
                    var locationSize = fromHex(message.substring(position, position += 4));
                    var location = message.substring(position, position += locationSize);

                    var requestHeaders = {};
                    var requestHeaderCount = fromHex(message.substring(position, position += 4));
                    for (var i=0; i < requestHeaderCount; i++) {
                        var labelSize = fromHex(message.substring(position, position += 4));
                        var label = message.substring(position, position += labelSize);
                        var valueSize = fromHex(message.substring(position, position += 4));
                        var value = message.substring(position, position += valueSize);
                        requestHeaders[label] = value;
                    }
                    
                    var payloadSize = fromHex(message.substring(position, position += 8));
                    var payload = message.substring(position, position += payloadSize);
                    var timeout = fromHex(message.substring(position, position += 4));
                    var streaming = (message.substring(position, position += 1) == "t");
                    var origin = event.origin;
                    
                    // default port if necessary
                    // preserve "null" origins (from file:///)
                    var originURI = new URI(origin);
                    if (originURI.port === undefined && origin !== "null") {
                    	var defaultPorts0 = { "http":80, "https":443 };
                    	originURI.port = defaultPorts0[originURI.scheme];
                    	originURI.authority = originURI.host + ":" + originURI.port;

                    	// Note: new URI(origin).toString() adds slash for path
                    	origin = originURI.scheme + "://" + originURI.authority;
                    }
                    // represent file origins as null, too
                    if (originURI.scheme === "file") {
                        origin = "null";
                    }
                
                    doSend(event.source, origin, id, method, location, requestHeaders, payload, timeout, streaming);
                    break;
                case "a":
                    doAbort(id);
                    break;
                case "d":
                    doDelete(id);
                    break;
                }
            }
        }
    }
    
    function createXHR() {
        try { return new XMLHttpRequest(); } catch(e2) {}
        try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e1) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e0) {}
        throw new Error("Unable to create XHR");
    }

    function doSend(source, origin, id, method, location, requestHeaders, payload, timeout, streaming) {
        // preflight required if method is not GET or POST
        var xsPreflight = !xsRequestMethods[method];
        
        if (!xsPreflight) {
            // preflight required for non-whitelist request header
            for (var headerName in requestHeaders) {
                if (!xsPreflight && typeof(headerName) == "string") {
                   xsPreflight = !xsRequestHeaders[headerName];
                }
            }
            
            // preflight required for non-whitelist POST content type
            if (!xsPreflight && method == "POST") {
               var xsContentType = requestHeaders["Content-Type"];
               if (xsContentType !== undefined) {
                   var extAt = xsContentType.indexOf(";");
                   if (extAt != -1) {
                       xsContentType = xsContentType.substring(0, extAt);
                   }
                   xsPreflight = !xsPostContentTypes[xsContentType];
               }
            }
        }
        
        if (xsPreflight) {
            var xmlHttp = createXHR();
            var xsLocation = location;
            var xsQuery = [];
            xsQuery.push(location.indexOf("?") == -1 ? "?" : "&");
            xsQuery.push(".km=O");  // indicate "OPTIONS" method
            xmlHttp.open("POST", location + xsQuery.join(""), true); // emulating the method requires "POST"
            xmlHttp.setRequestHeader("X-Origin", origin);  // emulated Origin header
            xmlHttp.setRequestHeader("Access-Control-Request-Method", method);
           
            var acRequestHeaders = [];
            for (var headerName in requestHeaders) {
                if (typeof(headerName) == "string" && !xsRequestHeaders[headerName]) {
                   acRequestHeaders.push(headerName);
                }
            }
           xmlHttp.setRequestHeader("Access-Control-Request-Headers", acRequestHeaders.join(","));
           xmlHttp.onreadystatechange = function() { onpreflightreadystatechange(source, origin, id, method, location, requestHeaders, payload, timeout, streaming, xmlHttp); };
           xmlHttp.send("");
        }
        else {
           doSendWithoutPreflight(source, origin, id, method, location, requestHeaders, payload, timeout, streaming);
        }
    }
        
    function doSendWithoutPreflight(source, origin, id, method, location, requestHeaders, payload, timeout, streaming) {
        if (browser == "ie" && payload === "" && streaming) {
                if((navigator.userAgent.indexOf("MSIE 9") >= 0 || navigator.userAgent.indexOf("MSIE 8") >= 0)&& typeof(XDomainRequest) !== "undefined") {
                    //IE 9 use XDomainRequest instead of iframe because some systems iframe freeze after 10 minutes
                    doSendXDR(source, origin, id, method, location, requestHeaders, payload, timeout);
                }
                else {
                    doSendIFrame(source, origin, id, method, location, timeout);
                }
            }
        else {
            doSendXHR(source, origin, id, method, location, requestHeaders, payload, timeout, streaming);
        }
    }
    
    function doError(id) {
        var registered = registry[id];
        if (registered !== undefined) {
            registered.onError();
        }
        doDelete(id);
    }

    function doAbort(id) {
        var registered = registry[id];
        if (registered !== undefined) {
            switch (registered.type) {
            case "iframe":
                registered.transport.src = "about:blank";
                break;
            case "xhr":
                registered.transport.abort();
                break;
            }
        }
    }
    
    function doDelete(id) {
        var registered = registry[id];
        if (registered !== undefined) {
            switch (registered.type) {
            case "iframe":
                var iframe = registered.transport;
                iframe.parentNode.removeChild(iframe);
                break;
            }
        }
        delete registry[id];
    }
    
    function doSendIFrame(source, origin, id, method, location, timeout) {
    	
    	// TODO: support non-GET streaming 
    	//       but still using GET on the wire to avoid polluting browsing history
    	if (method !== "GET") {
            throw new Error("Method not supported for streaming response: " + method);
    	}
    	
        var locationURI = new URI(location);
        var params = ".ko=" + escape(origin);
        if (locationURI.query !== undefined) {
            locationURI.query += "&" + params;
        }
        else {
            locationURI.query = params;
        }
        
        // clean up old iframe if XMLHttpRequest0 is reused
        // TODO: support cleanly switching between "iframe" and "xhr" modes for XMLHttpRequest0 instance
        var registration = registry[id] || {};
        var iframe = (registration.type == "iframe") ? registration.transport : null;
        if (iframe !== null) {
        	iframe.parentNode.removeChild(iframe);
        }
        
        iframe = htmlfile.createElement("iframe");
        // IE9 mode incorrectly calls Object.prototype.toString by default
            iframe.setAttribute("src", locationURI.toString());
        htmlfile.body.appendChild(iframe);
        
        // schedule the error event callback, canceling when iframe stream connects successfully
        // Note: this value needs to be longer than recovering SSE stream detecting buffering proxy traversal
        var timerID = setTimeout(function() { 
            doError(id);
        }, 5000);
        
        // start monitoring the iframe contents
        setTimeout(function() {
            loading(source, origin, id, iframe, timerID);
        }, 20);

        // update the registry with the iframe transport to support XMLHttpRequest0.abort()
        registry[id] = {
            type: "iframe",
            transport: iframe, 
            onError: function() {
                postMessage0(source, ["e", id].join(""), origin);
            }
        };
    }
    
    function doSendXHR(source, origin, id, method, location, requestHeaders, payload, timeout, streaming) {
        // register new XMLHttpRequest delegate
        var xmlHttp = createXHR();
        registry[id] = { type: "xhr", transport: xmlHttp };
        
        // track progress of response
        var readyState = 2;
        var progressAt = 0;
        var monitorID = null;
        var responseState = (browser === "ie") ? 4 : 3;
        var doMonitor = (streaming && browser == "opera");
        
        function monitorResponse() {
            // notify responseText
            var responseChunk = "";
            var responseText = null;

            if (xmlHttp.readyState >= 3) {
                if (xmlHttp.status == 200) {
                    // Note: IE throws exception when accessing responseText for early readyState
                    responseText = xmlHttp.responseText;

                    // process emulated headers in payload
                    switch (readyState) {
                    case 2:
                    	var xmlHttp0 = parseEmulatedResponse(responseText);
                    	if (xmlHttp0 !== null) {
                    		readyState = xmlHttp.readyState;
                    		
                    		// TODO: verify Access-Control headers
                    		
                    		// access restricted for non-whitelist response headers
                    		var responseHeaders = [];
                    		for (var responseHeaderName in xsResponseHeaders) {
                    			if (typeof(responseHeaderName) == "string") {
                    				var responseHeaderValue = xmlHttp0.getResponseHeader(responseHeaderName);
                    				if (responseHeaderValue != null) {
                    					responseHeaders.push([responseHeaderName, responseHeaderValue]);
                    				}
                    			}
                    		}
                    		
                    		// notify meta data changes
                    		postReadyMessage(source, origin, id, responseHeaders, xmlHttp0.status, xmlHttp0.statusText);
                    		
                    		// skip over emulated response status and headers
                    		progressAt = responseText.length - xmlHttp0.responseText.length;
                    	}
                    	break;
                    case 3:
                    case 4:
                		readyState = xmlHttp.readyState;
                    	break;
                    }
                }
                else {
                    //receive other http status code
                    // notify meta data changes
                    var responseHeaders = [];
                    postReadyMessage(source, origin, id, responseHeaders, xmlHttp.status, xmlHttp.statusText);
                   
                }
            }
            
            if (readyState > 2) {
                if (responseText !== null) {
                    var responseSize = responseText.length;
                    if (responseSize > progressAt) {
                        responseChunk = responseText.slice(progressAt);
                        progressAt = responseSize;
                    }
                }
                
                //    - progress -
                //    <-- "p" 00000001 3 0000000c "Hello, world"
                
                // deliver the progress callback
                postMessage0(source, ["p", id, readyState, toPaddedHex(responseChunk.length, 8), responseChunk].join(""), origin);
            }
               
            if (doMonitor && readyState < 4) {
                monitorID = setTimeout(monitorResponse, 20);
            }
        }
        var textContentType = false;
        xmlHttp.open(method, location, true);
        for (var headerName in requestHeaders) {
            if (typeof(headerName) == "string") {
                xmlHttp.setRequestHeader(headerName, requestHeaders[headerName]);
                if (headerName == "Content-Type" && requestHeaders[headerName].indexOf("text/plain") == 0) {
                    textContentType = true;
                }
            }
        }

        // W3C Cross-site Access Control emulation
        xmlHttp.setRequestHeader("X-Origin", origin);

        xmlHttp.onreadystatechange = function() {
            // notify readyState
            var readyState = xmlHttp.readyState;
            if (readyState >= responseState) {
                monitorResponse();
            }
            
            // cleanup on request completion
            if (readyState == 4) {
                if (monitorID !== null) {
                    clearTimeout(monitorID);
                }
            }
        }

		// IE throws exception when trying to assign xmlHttp.onerror (!)
		if (browser != "ie") {
	        xmlHttp.onerror = function() {
		        // notify meta data changes
		        postMessage0(source, ["e", id].join(""), origin);
	        }
	    }
        
        if (xmlHttp.sendAsBinary && !textContentType) {
            xmlHttp.setRequestHeader("Content-Type", "application/octet-stream");
            xmlHttp.sendAsBinary(payload);
        } else {
            xmlHttp.send(payload);
        }
    }

    function doSendXDR(source, origin, id, method, location, requestHeaders, payload, timeout) {
        // register new XMLHttpRequest delegate
        
        //for 3.5 clients - add .kf=200&.kp=2048 to tell server to doFlush()
        if (location.indexOf(".kf=200") == -1) {
            location += "&.kf=200&.kp=2048"
        }
        // add .kac=ex to tell server send allow-origin header and .kac to tell server read headers from post body
        location += "&.kac=ex&.kct=application/x-message-http";
        var xmlHttp = new XDomainRequest();
        registry[id] = { type: "xhr", transport: xmlHttp };
        
        // track progress of response
        var readyState = 2;
        var progressAt = 0;
        
        xmlHttp.onprogress = function () {
            try {
                // process emulated headers in payload
               if(readyState == 2) {
                    var responseText = xmlHttp.responseText;
                    progressAt = responseText.length;
                    var xmlHttp0 = parseEmulatedResponse(responseText);

                    if (xmlHttp0 !== null) {
                        readyState = 3;
                        // access restricted for non-whitelist response headers
                        var responseHeaders = [];
                        for (var responseHeaderName in xsResponseHeaders) {
                            if (typeof(responseHeaderName) == "string") {
                                var responseHeaderValue = xmlHttp0.getResponseHeader(responseHeaderName);
                                if (responseHeaderValue != null) {
                                    responseHeaders.push([responseHeaderName, responseHeaderValue]);
                                }
                            }
                        }
                    
                        // notify meta data changes
                        postReadyMessage(source, origin, id, responseHeaders, xmlHttp0.status, xmlHttp0.statusText);
                        // skip over emulated response status and headers
                    	progressAt = responseText.length - xmlHttp0.responseText.length;
                    }
                }
 
                // detect new data
                var newDataLength = xmlHttp.responseText.length;
                
                if (newDataLength > progressAt) {
                    var responseChunk = xmlHttp.responseText.slice(progressAt);
                    progressAt = newDataLength;
                    //    - progress -
                    //    <-- "p" 00000001 3 0000000c "Hello, world"
            
                    // deliver the progress callback
                    postMessage0(source, ["p", id, readyState, toPaddedHex(responseChunk.length, 8), responseChunk].join(""), origin);
                }

            }
            catch (e1) {
                doError(id);
            }
        }
        xmlHttp.onerror = function() {
	    // notify meta data changes
	    postMessage0(source, ["e", id].join(""), origin);
        }
        xmlHttp.ontimeout = function() {
	    // notify meta data changes
	    postMessage0(source, ["e", id].join(""), origin);
        }
        xmlHttp.onload = function() {
            readyState = 4;
            var responseChunk = "";
            //detect progress
            var newDataLength = xmlHttp.responseText.length;
                 
            if (newDataLength > progressAt) {
                responseChunk = xmlHttp.responseText.slice(progressAt);
                progressAt = newDataLength;
                //    - progress -
                //    <-- "p" 00000001 3 0000000c "Hello, world"
            }
            // deliver the progress callback
            postMessage0(source, ["p", id, readyState, toPaddedHex(responseChunk.length, 8), responseChunk].join(""), origin);
            
        }
        // wrapper http request, remove &.kct=application/x-message-http to match outer request path
        var wpayload = method + " " + location.substring(location.indexOf("/", 9), location.indexOf("&.kct")) + " HTTP/1.1\r\nContent-Type: text/plain; charset=windows-1252\r\n\r\n";
         
        xmlHttp.open("POST", location);
        xmlHttp.send(wpayload);
    }
    
    function parseEmulatedResponse(responseText) {
        // end of line can be \r, \n or \r\n
        var linesPattern = /(\r\n|\r|\n)/;
        var matchParts = responseText.match(linesPattern);
        if (!matchParts || matchParts.length <= 1) {
            // stop parsing if fewer than two newlines were found
            return null;
        }
        var endOfLineMark = matchParts[1];


    	// verify emulated response status and headers available
    	var endOfHeadersMark = endOfLineMark + endOfLineMark;
    	var endOfHeadersAt = responseText.indexOf(endOfHeadersMark) + endOfHeadersMark.length;
    	if (endOfHeadersAt < endOfHeadersMark.length) {
    		return null;
    	}

    	// parse emulated response status and headers
        var endOfStartAt = responseText.indexOf(endOfLineMark) + endOfLineMark.length;
        var startText = responseText.substring(0, endOfStartAt);
        var startMatch = startText.match(/HTTP\/1\.\d\s(\d+)\s([^\r\n]+)/);  // match all line endings
        var responseHeadersText = responseText.substring(endOfStartAt, endOfHeadersAt);
        var responseHeaderNameValues = responseHeadersText.split(endOfLineMark);
        var responseHeaders = {};
        for (var i=0; i < responseHeaderNameValues.length; i++) {
        	var responseHeaderMatch = responseHeaderNameValues[i].match(/([^\:]+)\:\s?(.*)/);
        	if (responseHeaderMatch) {
        		responseHeaders[responseHeaderMatch[1]] = responseHeaderMatch[2];
        	}
        }
        
        // return emulated response
        var xmlHttp = {};
        xmlHttp.status = parseInt(startMatch[1]);
        xmlHttp.statusText = startMatch[2];
        xmlHttp.endOfHeadersAt = endOfHeadersAt;
        xmlHttp.responseText = responseText.substring(endOfHeadersAt);
        xmlHttp.getResponseHeader = function(headerName) { return responseHeaders[headerName]; };

        return xmlHttp;
    }
    
    function onpreflightreadystatechange(source, origin, id, method, location, requestHeaders, payload, timeout, streaming, xmlHttp) {
        switch (xmlHttp.readyState) {
        case 4:
        	var xmlHttp0 = parseEmulatedResponse(xmlHttp.responseText);
            if (xmlHttp0.status == 200 && accessControlCheck(xmlHttp0, origin) == "pass") {
                var acAllowMethods = (xmlHttp0.getResponseHeader("Access-Control-Allow-Methods") || "").split(",");
                var methodAllowed = false;
                for (var i=0; i < acAllowMethods.length; i++) {
                    if (acAllowMethods[i] == method) {
                        methodAllowed = true;
                        break;
                    }
                }
                if (methodAllowed) {
                    var acAllowHeaders = (xmlHttp0.getResponseHeader("Access-Control-Allow-Headers") || "").split(",");
                    var allHeadersAllowed = true;
                    for (var headerName in requestHeaders) {
                        if (typeof(headerName) == "string") {
                            // always allow whitelist cross-site request headers
                            var headerAllowed = xsRequestHeaders[headerName];
                            
                            // require explicit allow for non-whitelist cross-site request headers
                            if (!headerAllowed) {
                                for (var i=0; i < acAllowHeaders.length; i++) {
                                    if (acAllowHeaders[i] == headerName) {
                                        headerAllowed = true;
                                        break;
                                    }
                                }
                            }
                            allHeadersAllowed = headerAllowed;
                            
                            // if any header not allowed, skip remaining
                            if (!allHeadersAllowed) {
                              break;
                            }
                        }
                    }

                    // method allowed and all headers allowed                    
                    if (allHeadersAllowed) {
                       doSendWithoutPreflight(source, origin, id, method, location, requestHeaders, payload, timeout, streaming);
                       return;
                    }
                }
            }
            
            // this is reachable only if preflight was unsuccessful
	        postMessage0(source, ["e", id].join(""), origin);
            
            break;
        }
    }
    
    function accessControlCheck(xmlHttp, origin) {
        var acAllowOrigin = xmlHttp.getResponseHeader("Access-Control-Allow-Origin");
        if (acAllowOrigin != origin) {
            return "fail";
        }

        // Note: credentials flag is implicitly true for emulation
        var acAllowCredentials = xmlHttp.getResponseHeader("Access-Control-Allow-Credentials");
        if (acAllowCredentials != "true") {
            return "fail";
        }
        
        return "pass";
    }
    
    function postReadyMessage(source, origin, id, responseHeaders, status, statusText) {
        //    - readystate -
        //    <-- "r" 00000001 01 000b "Content-Type" 000a "text/plain" 00c2 02 "OK"

        var message = ["r", id];
        message.push(toPaddedHex(responseHeaders.length, 2));
        for (var i=0; i < responseHeaders.length; i++) {
            var responseHeader = responseHeaders[i];
            message.push(toPaddedHex(responseHeader[0].length, 4));
            message.push(responseHeader[0]);
            message.push(toPaddedHex(responseHeader[1].length, 4));
            message.push(responseHeader[1]);
        }
        message.push(toPaddedHex(status, 4));
        message.push(toPaddedHex(statusText.length, 2));
        message.push(statusText);
        
        postMessage0(source, message.join(""), origin);
    }
    
    function fromHex(formatted) {
        return parseInt(formatted, 16);
    }
    
    function toPaddedHex(value, width) {
        var hex = value.toString(16);
        var parts = [];
        width -= hex.length;
        while (width-- > 0) {
            parts.push("0");
        }
        parts.push(hex);
        return parts.join("");
    }

    window.addEventListener("message", onmessage, false);
})();
