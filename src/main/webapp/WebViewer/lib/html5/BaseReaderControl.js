/*global Modernizr */
(function(exports) {
    "use strict";
    var ToolMode = exports.PDFTron.WebViewer.ToolMode;

    /**
     * The base ReaderControl class
     * @name BaseReaderControl
     * @class
     * @extends WebViewerInterface
     * @param {object} options Options for the reader control
     **/
    exports.BaseReaderControl = function(options) {
        var me = this;
        this.enableAnnotations = options.enableAnnot;
        this.enableOffline = options.enableOffline;
        this.docId = options.docId;
        this.hasBeenClosed = false;

        this.serverUrl = options.serverUrl;
        var noServerURL = _.isUndefined(this.serverUrl) || _.isNull(this.serverUrl);
        if (noServerURL && !_.isUndefined(ReaderControl.config) && !_.isUndefined(ReaderControl.config.serverURL)) {
            this.serverUrl = ReaderControl.config.serverURL;
        }

        this.userPreferences = exports.ControlUtils.userPreferences.getViewerPreferences();

        this.currUser = '';

        if (!_.isUndefined(ReaderControl.config) && !_.isUndefined(ReaderControl.config.defaultUser)) {
            this.currUser = ReaderControl.config.defaultUser;

            // load custom CSS file
            if (!_.isUndefined(ReaderControl.config.customStyle)) {
                if($.isArray(ReaderControl.config.customStyle)){
                    for(var i = 0; i < ReaderControl.config.customStyle.length; i++){
                        $("<link/>").appendTo("head").attr({
                            rel: "stylesheet",
                            type: "text/css",
                            href: ReaderControl.config.customStyle[i]
                        });
                    }
                }else{
                    $("<link>").appendTo("head").attr({
                        rel: "stylesheet",
                        type: "text/css",
                        href: ReaderControl.config.customStyle
                    });
                }
            }

            // load custom javaScript file
            if (!_.isUndefined(ReaderControl.config.customScript)) {
                $.getScript(ReaderControl.config.customScript, function(data, textStatus, jqxhr) {
                    /*jshint unused:false */
                    // custom script was loaded
                });
            }
        }

        this.currUser = options.user || this.currUser;

        this.isAdmin = options.isAdmin;
        this.readOnly = options.readOnly;

        this.docViewer = new exports.CoreControls.DocumentViewer();
        this.docViewer.setOptions({
            enableAnnotations: this.enableAnnotations
        });

        this.pageOrientations = {
            Auto: 0,
            Portrait: 1,
            Landscape: 2
        };

        var Tools = exports.Tools;
        this.toolModeMap = {};
        this.toolModeMap[ToolMode.Pan] = new Tools.PanTool(this.docViewer);
        this.toolModeMap[ToolMode.PanAndAnnotationEdit] = new Tools.PanTool(this.docViewer);
        this.toolModeMap[ToolMode.TextSelect] = new Tools.TextSelectTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationEdit] = new Tools.AnnotationEditTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateEllipse] = new Tools.EllipseCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateFreeHand] = new Tools.FreeHandCreateTool(this.docViewer);
        this.toolModeMap['AnnotationCreateSignature'] = new Tools.SignatureCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateLine] = new Tools.LineCreateTool(this.docViewer);
        this.toolModeMap['AnnotationCreateArrow'] = new Tools.ArrowCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateRectangle] = new Tools.RectangleCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateSticky] = new Tools.StickyCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateTextHighlight] = new Tools.TextHighlightCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateTextStrikeout] = new Tools.TextStrikeoutCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateTextUnderline] = new Tools.TextUnderlineCreateTool(this.docViewer);
        this.toolModeMap['AnnotationCreateTextSquiggly'] = new Tools.TextSquigglyCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreatePolyline] = new Tools.PolylineCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreatePolygon] = new Tools.PolygonCreateTool(this.docViewer);
        this.toolModeMap['AnnotationCreatePolygonCloud'] = new Tools.PolygonCloudCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateCallout] = new Tools.CalloutCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateFreeText] = new Tools.FreeTextCreateTool(this.docViewer);
        this.toolModeMap[ToolMode.AnnotationCreateCustom] = new Tools.AnnotationEditTool(this.docViewer); //no tools for this

        var userPrefs = exports.ControlUtils.userPreferences;
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateEllipse], 'ellipse', Annotations.EllipseAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateFreeHand], 'freehand', Annotations.FreeHandAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateLine], 'line', Annotations.LineAnnotation, function(annotation) {
            return annotation.getEndStyle() === 'None' && annotation.getStartStyle() === 'None';
        });
        userPrefs.registerTool(this.toolModeMap['AnnotationCreateArrow'], 'arrow', Annotations.LineAnnotation, function(annotation) {
            return annotation.getEndStyle() === 'OpenArrow' || annotation.getStartStyle() === 'OpenArrow';
        });
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateRectangle], 'rectangle', Annotations.RectangleAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateSticky], 'sticky', Annotations.StickyAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreatePolyline], 'polyline', Annotations.PolylineAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreatePolygon], 'polygon', Annotations.PolygonAnnotation, function (annotation) {
            return annotation.Style !== 'cloudy' || annotation.Intent !== 'PolygonCloud';
        });
        userPrefs.registerTool(this.toolModeMap["AnnotationCreatePolygonCloud"], 'polygoncloud', Annotations.PolygonAnnotation, function(annotation) {
            return annotation.Style === 'cloudy' && annotation.Intent === 'PolygonCloud';
        });
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateCallout], 'callout', Annotations.FreeTextAnnotation, function (annotation) {
            return annotation.getIntent() === Annotations.FreeTextAnnotation.Intent.FreeTextCallout;
        });
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateFreeText], 'freetext', Annotations.FreeTextAnnotation, function(annotation) {
            return annotation.getIntent() !== Annotations.FreeTextAnnotation.Intent.FreeTextCallout;
        });
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateTextHighlight], 'highlight', Annotations.TextHighlightAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateTextStrikeout], 'strikeout', Annotations.TextStrikeoutAnnotation);
        userPrefs.registerTool(this.toolModeMap[ToolMode.AnnotationCreateTextUnderline], 'underline', Annotations.TextUnderlineAnnotation);
        userPrefs.registerTool(this.toolModeMap['AnnotationCreateTextSquiggly'], 'squiggly', Annotations.TextSquigglyAnnotation);

        this.defaultToolMode = this.toolModeMap[ToolMode.Pan];

        var signatureTool = this.toolModeMap['AnnotationCreateSignature'];
        signatureTool.on('annotationAdded', function() {
            me.setToolMode(ToolMode.Pan);
        });

        this.docViewer.on('documentLoaded', _(this.onDocumentLoaded).bind(this));
        this.docViewer.on('notify', exports.ControlUtils.getNotifyFunction);

        if (this.enableAnnotations) {
            if (me.serverUrl !== null) {
                this.docViewer.setInternalAnnotationsTransform(function(originalData, callback) {
                    var docIdQuery = {};
                    if (me.docId !== null && me.docId.length > 0) {
                        docIdQuery = {
                            did: me.docId
                        };
                    }

                    $.ajax({
                        url: me.serverUrl,
                        cache: false,
                        data: docIdQuery,
                        success: function(data) {
                            if (!_.isNull(data) && !_.isUndefined(data)) {
                                callback(data);
                            } else {
                                callback(originalData);
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            /*jshint unused:false */
                            console.warn("Annotations could not be loaded from the server.");
                            callback(originalData);
                        },
                        dataType: 'xml'
                    });
                });
            }
        }
    };

    var unimplementedFunction = function() {
        console.warn('Function not implemented by this viewer');
    };

    exports.BaseReaderControl.prototype = $.extend(new exports.WebViewerInterface(), {
        onDocumentLoaded: function() {
                if(this.hasBeenClosed) {
                    this.closeDocument();
                    return;
                }
            var am = this.docViewer.getAnnotationManager();
            am.setCurrentUser(this.currUser);
            am.setIsAdminUser(this.isAdmin);
            am.setReadOnly(this.readOnly);

            if (this.enableOffline && (Modernizr.indexeddb || Modernizr.websqldatabase)) {
                if (this.startOffline) {
                    this.offlineReady();
                } else {
                    var me = this;
                    this.docViewer.getDocument().initOfflineDB(function() {
                        me.offlineReady();
                    });
                }
            }
        },

        /**
         * Loads a XOD document into the ReaderControl
         * @param {string} doc a URL path to a XOD file
         * @param options an object that contains options for loading a document. Possible properties are [streaming, decrypt, decryptOptions]
         * @param options.streaming a boolean that turns on chunked transfer encoding as a fallback if true.
         * @param options.decrypt a function for handling XOD decryption
         * @param options.decryptOptions an object containing options for XOD decryption
         */
        loadDocument: function(doc, options) {
            var streaming, decrypt, decryptOptions;

            if (options) {
                streaming = options.streaming;
                decrypt = options.decrypt;
                decryptOptions = options.decryptOptions;
            }

            // Example of how to decrypt a document thats been XORed with 0x4B
            // It is passed as a parameter to the part retriever constructor.
            // e.g. partRetriever = new window.CoreControls.PartRetrievers.HttpPartRetriever(doc, true, decrypt);
            /*var decrypt = function(data) {

                var arr = new Array(1024);
                var j = 0;
                var responseString = "";

                while (j < data.length) {

                    for (var k = 0; k < 1024 && j < data.length; ++k) {
                        arr[k] = data.charCodeAt(j) ^ 0x4B;
                        ++j;
                    }
                    responseString += String.fromCharCode.apply(null, arr.slice(0,k));
                }
                return responseString;
            };*/

            var queryParams = exports.ControlUtils.getQueryStringMap(!window.utils.ieWebViewLocal);
            var path = queryParams.getString('p');

            this.startOffline = queryParams.getBoolean('startOffline', false);
            var azureWorkaround = queryParams.getBoolean('azureWorkaround', false);
            var partRetriever;
            try {
                var cacheHinting = exports.CoreControls.PartRetrievers.CacheHinting;
                if (this.startOffline) {
                    partRetriever = new CoreControls.PartRetrievers.WebDBPartRetriever();
                } else if (exports.utils.ieWebViewLocal) {
                    partRetriever = new exports.CoreControls.PartRetrievers.WinRTPartRetriever(doc, cacheHinting.CACHE, decrypt, decryptOptions);
                } else if (doc && doc.indexOf("iosrange://") === 0) {
                    partRetriever = new exports.CoreControls.PartRetrievers.IOSPartRetriever(doc, cacheHinting.CACHE, decrypt, decryptOptions);
                } else if (doc && doc.indexOf("content://") === 0) {
                    partRetriever = new exports.CoreControls.PartRetrievers.AndroidContentPartRetriever(doc, cacheHinting.CACHE, decrypt, decryptOptions);
                } else if (path !== null) {
                    partRetriever = new exports.CoreControls.PartRetrievers.ExternalHttpPartRetriever(doc, path);
                } else if (streaming === true) {
                    partRetriever = new exports.CoreControls.PartRetrievers.StreamingPartRetriever(doc, cacheHinting.CACHE, decrypt, decryptOptions);
                } else if (azureWorkaround) {
                    partRetriever = new exports.CoreControls.PartRetrievers.AzurePartRetriever(doc, cacheHinting.CACHE, decrypt, decryptOptions);
                } else {
                    partRetriever = new exports.CoreControls.PartRetrievers.HttpPartRetriever(doc, cacheHinting.CACHE, decrypt, decryptOptions);
                }
            } catch (err) {
                console.error(err);
            }

            var me = this;
            if(options && options.customHeaders){
                partRetriever.setCustomHeaders(options.customHeaders);
            }
            partRetriever.setErrorCallback(function(err) {
                me.fireEvent('error', ['xodLoad', err, i18n.t('error.load')]);
            });
            this.hasBeenClosed = false;
            this.docViewer.loadAsync(partRetriever, this.docId);
        },

        offlineReady: function() {
            unimplementedFunction();
        },

        fireEvent: function(type, data) {
            $(document).trigger(type, data);
        },

        exportAnnotations: function(options) {
            if (this.serverUrl === null) {
                console.warn("Server URL not defined; not configured for server-side annotation saving.");
                return;
            }

            options.start();

            var query = '?did=' + this.docId;
            if (this.docId === null) {
                //Document id is not available. did will not be set for server-side annotation handling.
                query = '';
            }

            var xfdfString = this.docViewer.getAnnotationManager().exportAnnotations();
            $.ajax({
                type: 'POST',
                url: this.serverUrl + query,
                data: {
                    'data': xfdfString
                },
                success: options.success,
                error: function(jqXHR, textStatus, errorThrown) {
                    /*jshint unused:false */
                    console.warn("Failed to send annotations to server.");
                    options.error();
                },
                complete: options.complete
            });
        },

        copyButtonHandler: function() {
            if (window.clipboardData) {
                window.clipboardData.setData('Text', this.docViewer.getSelectedText());
            } else {
                // if there is a selected input field then execCommand will work to put the selected text into the system clipboard
                // we could insert extra things into the clipboard in the copy event if we wanted, but since we just want the text
                // in the clipboard element we don't have to do any extra work
                $('#clipboard').select();
                try {
                    document.execCommand('copy');
                } catch(e) {
                    console.warn('copy is not supported by browser');
                    alert("error");
                }
            }
        },

        getPagesToPrint: function(pageString) {
            var totalPages = this.getPageCount();
            // remove whitespace
            var pgs = (pageString + '').replace(/\s+/g, '');
            var pageList = [];
            // no input, assume every page
            if (pgs.length === 0) {
                for (var k = 1; k <= totalPages; k++) {
                    pageList.push(k);
                }
                return pageList;
            }

            var pageGroups = pgs.split(',');
            var rangeSplit, start, end;

            for (var i = 0; i < pageGroups.length; i++) {
                rangeSplit = pageGroups[i].split('-');
                if (rangeSplit.length === 1) {
                    // single number
                    pageList.push(parseInt(rangeSplit[0], 10));

                } else if (rangeSplit.length === 2) {
                    // range of numbers e.g. 2-5
                    start = parseInt(rangeSplit[0], 10);
                    if (rangeSplit[1] === '') {
                        // range like 4- means page 4 to the end of the document
                        end = totalPages;
                    } else {
                        end = parseInt(rangeSplit[1], 10);
                    }
                    if (end < start) {
                        continue;
                    }
                    for (var j = start; j <= end; j++) {
                        pageList.push(j);
                    }
                }
            }

            // remove duplicates and NaNs, sort numerically ascending
            return pageList.filter(function(elem, pos, self) {
                return self.indexOf(elem) === pos && elem > 0 && elem <= totalPages;
            }).sort(function(a, b) {
                return a - b;
            });
        },

        prepareDocument: function(pages, orientation, isInline, completeCallback) {
            var me = this;
            var printDisplay = isInline ? $('<div style="height: 100%; display: block"></div>') : $('#print-display');
            CoreControls.SetCanvasMode(CoreControls.CanvasMode.PageCanvas);
            printDisplay.empty();

            // draw all pages at 100% regardless of devicePixelRatio or other modifiers
            window.utils.setCanvasMultiplier(1);

            var index = 0;
            var dataurl, img;

            me.fireEvent('printProgressChanged', [0, pages.length]);
            loadPageLoop();
            function loadPageLoop() {
                var pageNumber = pages[index];
                var doc = me.docViewer.getDocument();

                var originalDocumentRotation = (me.docViewer.getCompleteRotation(pageNumber) - me.docViewer.getRotation(pageNumber));
                var pageInfo = doc.getPageInfo(pageNumber - 1);
                var annotationRotationOffset = 0;
                var rotation = 0;
                if (orientation === me.pageOrientations.Portrait) {
                    annotationRotationOffset = originalDocumentRotation;
                    pageInfo = {
                        width: pageInfo.height,
                        height: pageInfo.width
                    };
                } else if (orientation === me.pageOrientations.Landscape) {
                    rotation = 1;
                    annotationRotationOffset = (originalDocumentRotation + 1) % 4;
                    if (originalDocumentRotation !== 0) {
                        pageInfo = {
                            width: pageInfo.height,
                            height: pageInfo.width
                        };
                    }
                } else if (orientation === me.pageOrientations.Auto) {
                    if (pageInfo.width > pageInfo.height) {
                        if (originalDocumentRotation === 0) {
                            rotation = 1;
                            annotationRotationOffset = 1;
                        } else {
                            rotation = 4 - originalDocumentRotation;
                        }
                    }
                }
                var zoom = me.printFactor;

                doc.loadCanvasAsync(pageNumber - 1, zoom, rotation, function(canvas) {
                    var ctx = canvas.getContext('2d');

                    // transform the canvas context so that annotations are drawn in the correct location
                    var t = window.GetPageMatrix(zoom, annotationRotationOffset, pageInfo);
                    ctx.setTransform(t.m_a, t.m_b, t.m_c, t.m_d, t.m_h, t.m_v);

                    me.docViewer.getAnnotationManager().drawAnnotations(pageNumber, canvas);

                    dataurl = canvas.toDataURL();

                    img = $('<img>')
                        .attr('src', dataurl)
                        .css({
                            'max-height': '100%',
                            'max-width': '100%'
                        })
                        .load(function() {
                            if (!me.preparingForPrint) {
                                return;
                            }
                            printDisplay.append(img);
                            me.fireEvent('printProgressChanged', [index + 1, pages.length]);
                            index++;
                            if (index < pages.length) {
                                loadPageLoop();
                            } else {
                                completeCallback(printDisplay);
                                window.utils.unsetCanvasMultiplier();
                                me.preparingForPrint = false;
                            }
                        });

                    if (isInline) {
                        img.css('display', 'block');

                        if (index > 0) {
                            img.css('page-break-after', 'always');
                        }
                    }

                }, function() {}, 1);
            }
        },

        startPrintJob: function(pageInput, orientation, isInline, completeCallback) {
            if (!this.preparingForPrint) {
                var pagesToPrint = this.getPagesToPrint(pageInput);
                if (pagesToPrint.length === 0) {
                    alert(i18n.t('print.invalidPageSelectionMsg'));
                    return;
                }

                this.preparingForPrint = true;
                this.prepareDocument(pagesToPrint, orientation, isInline, completeCallback);
            }
        },

        endPrintJob: function() {
            this.preparingForPrint = false;
            $('#print-display').empty();
        },

        getDocumentViewer: function() {
            return this.docViewer;
        },

        getCurrentPageNumber: function() {
            return this.docViewer.getCurrentPage();
        },

        setCurrentPageNumber: function(pageNumber) {
            this.docViewer.setCurrentPage(pageNumber);
        },

        getPageCount: function() {
            return this.docViewer.getPageCount();
        },

        goToFirstPage: function() {
            this.docViewer.displayFirstPage();
        },

        goToLastPage: function() {
            this.docViewer.displayLastPage();
        },

        goToNextPage: function() {
            var currentPage = this.docViewer.getCurrentPage();
            if (currentPage <= 0) {
                return;
            }
            currentPage = currentPage + 1;
            this.docViewer.setCurrentPage(currentPage);
        },

        goToPrevPage: function() {
            var currentPage = this.docViewer.getCurrentPage();
            if (currentPage <= 1) {
                return;
            }
            currentPage = currentPage - 1;
            this.docViewer.setCurrentPage(currentPage);
        },

        getZoomLevel: function() {
            return this.docViewer.getZoom();
        },

        setZoomLevel: function(zoomLevel) {
            this.docViewer.zoomTo(zoomLevel);
        },

        getToolMode: function() {
            var tool = this.docViewer.getToolMode();
            for (var key in this.toolModeMap) {
                if (tool === this.toolModeMap[key]) {
                    return key;
                }
            }
            return null;
        },

        setToolMode: function(toolMode) {
            var tool = this.toolModeMap[toolMode];
            if (tool) {
                this.docViewer.setToolMode(tool);
            }
        },

        setAnnotationUser: function(username) {
            var am = this.docViewer.getAnnotationManager();
            this.currUser = username;
            am.setCurrentUser(this.currUser);
        },

        getAnnotationUser: function() {
            var am = this.docViewer.getAnnotationManager();
            return am.getCurrentUser();
        },

        setAdminUser: function(isAdmin) {
            var am = this.docViewer.getAnnotationManager();
            this.isAdmin = isAdmin;
            am.setIsAdminUser(this.isAdmin);
        },

        isAdminUser: function() {
            var am = this.docViewer.getAnnotationManager();
            return am.getIsAdminUser();
        },

        setReadOnly: function(isReadOnly) {
            var am = this.docViewer.getAnnotationManager();
            this.readOnly = isReadOnly;
            am.setReadOnly(this.readOnly);
        },

        isReadOnly: function() {
            var am = this.docViewer.getAnnotationManager();
            return am.getReadOnly();
        },

        closeDocument: function() {
            this.hasBeenClosed = true;
            this.docViewer.closeDocument();
        }
    });

})(window);