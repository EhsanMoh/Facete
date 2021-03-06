/**
 * Copyright (C) 2011, MOLE research group at AKSW,
 * University of Leipzig
 *
 * SpatialSemanticBrowsingWidgets is free software; you can redistribute
 * it and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * SpatialSemanticBrowsingWidgets is distributed in the hope that it will
 * be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
(function($) {

	var config = Namespace("org.aksw.ssb.config");
	
	
$.widget("ui.ssb_map", {

	// TODO: Add _init method for backward compatibility

	_create: function() {
		var self = this;
		
		var opts = this.options;
		//this.options.event += ".ssbinstances"; // namespace event
		
		this.idToBox = {};
		
		this.domElement = this.element.get(0);


		
		//this.nodeToPos = this.options.nodeToPos;
		this.nodeToFeature = this.options.nodeToFeature;
		this.nodeToLabel = this.options.nodeToLabel;
		this.wayToFeature = this.options.wayToFeature;
		
		this.nodeToTypes = this.options.nodeToTypes;
		this.schemaIcons = this.options.schemaIcons;
		
		
		//console.log(this.nodeToPos);
		//this.mapWidget = new MapWidget(this);
		//this.mapWidget._load();
		//this.tree.logDebug("Dynatree._init(): done.");

		
	    var options = { scales: [50000000, 30000000, 10000000, 5000000],
	    		projection: new OpenLayers.Projection("EPSG:900913"),
	    		displayProjection: new OpenLayers.Projection("EPSG:4326"),
	    		
	    		resolutions: [1.40625,0.703125,0.3515625,0.17578125,0.087890625,0.0439453125],
	            minScale: 50000000,
	            maxResolution: "auto",
	            maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),
	            maxScale: 10000000,
	            minResolution: "auto",
	            minExtent: new OpenLayers.Bounds(-1, -1, 1, 1),
	            
	    		numZoomLevels: 19,
	    		units: 'm',

	    		
	    		
	            
	        	controls: [
	    					new OpenLayers.Control.MouseDefaults(),
	    					new OpenLayers.Control.LayerSwitcher(),
	    					//new OpenLayers.Control.PanZoomBar(),
	    					new OpenLayers.Control.PanZoom(),
	    					new OpenLayers.Control.MousePosition(),
//	        					new OpenLayers.Control.OverviewMap(),
	    					new OpenLayers.Control.ScaleLine(),
	    		],
	    };


		this.map = new OpenLayers.Map(this.domElement, options); 

		//this.map.
		
		//this.boxLayer    = new OpenLayers.Layer.Boxes( "Boxes", { projection: new OpenLayers.Projection("EPSG:4326"), visibility: true, displayInLayerSwitcher: true } );
		this.featureLayer    = new OpenLayers.Layer.Vector("Features", { projection: new OpenLayers.Projection("EPSG:4326"), visibility: true, displayInLayerSwitcher: true });

		this.boxLayer    = new OpenLayers.Layer.Vector("Boxes", { projection: new OpenLayers.Projection("EPSG:4326"), visibility: true, displayInLayerSwitcher: true });

		
		
		//this.markerLayer = new OpenLayers.Layer.Markers("Address", { projection: new OpenLayers.Projection("EPSG:4326"), visibility: true, displayInLayerSwitcher: false });
	    //this.vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");

	    
	    // uncomment	    

		// TODO Make it easy to exchange the URL pattern
		var mapnikLayer = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
		//var mapnikLayer = new OpenLayers.Layer.OSM.Local("Mapnik");
		//this.map.addLayers([mapnikLayer, this.featureLayer, this.boxLayer]); //, this.vectorLayer]); //, this.markerLayer]);
		//this.map.addLayers([mapnikLayer, this.featureLayer]);
		//this.map.addLayers([mapnikLayer, this.featureLayer, this.boxLayer]);

		this.map.addLayers([mapnikLayer, this.featureLayer, this.boxLayer]);
		
		
		this.map.events.register("moveend", this, function(event) { self._trigger("onMapEvent", event, {"map": self.map}); });
		this.map.events.register("zoomend", this, function(event) { self._trigger("onMapEvent", event, {"map": self.map}); });
	    
		var self = this;
		

		var report = function() {
			//alert("test");
		};
		
		//OpenLayers.Feature.Vector.style['temporary']['fillColor'] = '#8080a0';
		var hoverStyle = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style["default"]);
		OpenLayers.Util.extend(hoverStyle, {
			fillColor: '#8080ff',
        	fillOpacity: 0.4,
        	strokeLinecap: "round",
        	strokeWidth: 1, 
        	strokeColor: "#5050a0",
        	pointRadius: 12,
        	label: "Click to zoom",
        	fontColor: "#8080ff", //"#ffffff",
        	fontWeight: "bold",

		});

		
		this.highlightController = new OpenLayers.Control.SelectFeature([this.boxLayer], {
            hover: true,
            highlightOnly: true,
            //renderIntent: "temporary",
            selectStyle: hoverStyle,


            /*
            eventListeners: {
                beforefeaturehighlighted: function(event) {

                	var feature = event.feature;
                	
                	var geometry = feature.geometry;
    				    				
    				if(geometry instanceof OpenLayers.Geometry.Point) {
    					
    					// Seems like we can abort the highlight by returning false here.
    					// However, a cleaner solution would be to keep MII-boxes and features in separate layers
                    	return false;
    				}
                	
                },
                /*
                featurehighlighted: report,
                featureunhighlighted: report
                */

            //}
        });
		
		
		
		this.selectBoxController = new OpenLayers.Control.SelectFeature([this.boxLayer], {
			onSelect: function(feature) {
				
				var vector = feature; // Note: We assume a vector feature - might have to check in the future				
				var geometry = feature.geometry;

				var bounds = geometry.bounds;
				
				var newBounds = bounds.scale(0.5);
				
				var currentZoom = self.map.getZoom();
				
				self.map.zoomToExtent(newBounds, false);

				
				// Zoom-in (increase the zoom level) if zoomToExtent did not do that already  
				var newZoom = self.map.getZoom();					
				if(newZoom >= currentZoom) {
					var nextZoom = newZoom + 1;
					
					var numZoomLevels = self.map.getNumZoomLevels();
					if(nextZoom < numZoomLevels) {
						self.map.zoomTo(nextZoom);
					}
				}
			}				
		});
		
		
		this.selectFeatureController = new OpenLayers.Control.SelectFeature([this.featureLayer], {

			onSelect: function(feature) {
		
				alert("woo");
				/*
				var vector = feature; // Note: We assume a vector feature - might have to check in the future				
				var geometry = feature.geometry;
				*/
				
//				if(geometry instanceof OpenLayers.Geometry.Point) {
					
						//OpenLayers.Event.stop(event);
						//console.log("aoeu", feature);
						var data = feature.data;
					
						var event = null;
						self._trigger("onMarkerClick", event, data);
						
					
//				} else {
				
			}
		});
		
		
		this.selectFeatureController.handlers.feature.stopDown = false;		
		this.selectBoxController.handlers.feature.stopDown = false;
		this.highlightController.handlers.feature.stopDown = false;

		this.selectFeatureController.handlers.feature.stopUp = false;		
		this.selectBoxController.handlers.feature.stopUp = false;
		this.highlightController.handlers.feature.stopUp = false;

		this.selectFeatureController.handlers.feature.stopClick = false;
		this.selectBoxController.handlers.feature.stopClick = false;
		this.highlightController.handlers.feature.stopClick = false;

		
		this.map.addControl(this.selectBoxController);
		this.map.addControl(this.highlightController);
		this.map.addControl(this.selectFeatureController);

		this.selectFeatureController.activate();
		this.highlightController.activate();
		this.selectBoxController.activate();

		
		

//		beforefeaturehighlighted	Triggered before a feature is highlighted
//		featurehighlighted	Triggered when a feature is highlighted
//		featureunhighlighted	Triggered when a feature is unhighlighted
//		boxselectionstart	Triggered before box selection starts
//		boxselectionend	Triggered after box selection ends
		
		//this.map.events.register("boxselectionstart", null, function(event) {alert("yay"); });
	    
	    //this.map.addLayers([this.markerLayer]);

		
		/*
		var size = new OpenLayers.Size(21,25);
		var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
		var icon = new OpenLayers.Icon('http://www.openstreetmap.org/openlayers/img/marker.png',size,offset);
		*/

		//var center = new OpenLayers.LonLat(12.3747, 51.3405);
		var center = new OpenLayers.LonLat(-3.56, 56.07);
		
		var tCenter = center.clone().transform(
    			this.map.displayProjection,
    			this.map.projection);
		
		//console.log(center);
		this.map.setCenter(tCenter, 3);
		

		
//new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
//new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
		
		

		//map.events.register("click"  , map, function(event) { Dispatcher.fireEvent("mapEvent", self.getBound());});
		//this.map.events.register("moveend", this.map, function(event) { Dispatcher.fireEvent("mapEvent", self.getBound());});
		//this.map.events.register("zoomend", this.map, function(event) { Dispatcher.fireEvent("mapEvent", self.getBound());});

		//this.map.events.register("moveend", this, function(event) { this.onMapEvent(event); });
		//this.map.events.register("zoomend", this, function(event) { this.onMapEvent(event); });

		//console.log(self);
		
		this._doBind();
	},


	/**
	 * Creates a feature for the given id.
	 * By default they are not added to the map (i.e. invisible).
	 * 
	 * 
	 * @param id
	 * @param lonlat
	 */
	addItem: function(id, lonlat, visible) {
		
		
		
		
		var feature = this.createMarker(lonlat, id);
		this.nodeToFeature.put(id, feature);
		//console.log("Adding feature/marker");
		//console.log(feature);
		
		if(visible) {
			/////this.markerLayer.addMarker(feature.marker);
			this.featureLayer.addFeatures([feature]);
		}
	},
	
	setVisible: function(id, value) {
		var feature = this.nodeToFeature.get(id);
		if(!feature) {
			return;
		}
		
		if(value) {
			/////this.markerLayer.addMarker(feature.marker);
			this.featureLayer.addFeatures([feature]);
		} else {
			/////this.markerLayer.removeMarker(feature.marker);
			this.featureLayer.removeFeatures([feature]);
		}
	},
	
	addItems : function(idToPos) {
		for(var id in idToLonlat) {
			var lonlat = idToLonlat[id];
			this.addItem(id, lonlat);
		}
		/*
		$.each(idToPos, function(id, point) {
			//var point = idToPos[id];

			//point = point.transform(self.map.displayProjection, self.map.projection);
			//console.log(point);
			
		});
		*/		
	},
	
	removeItems : function(ids) {
		var self = this;
		
		//console.log("Items removal");
		
		$.each(ids, function(i, id) {
			var feature = self.nodeToFeature.entries[id];
			if(feature) {
				//self.markerLayer.removeMarker(feature.marker);
				self.featureLayer.removeFeatures([feature]);
				delete self.nodeToFeature[id];
			}			
		});
	},
	
	_intersectBounds : function() {
		
	},
	
	addBox : function(id, bounds) {
		
		var existingBox = this.idToBox[id];
		if(existingBox) {
			this.removeBox(id);
		}
		
		//console.log("Adding box: " + bounds);

		var limit = new OpenLayers.Bounds(-179.999, -85.0, 179.999, 85.0);

		
		var newBounds = new OpenLayers.Bounds(
				Math.max(bounds.left, limit.left),
				Math.max(bounds.bottom, limit.bottom),
				Math.min(bounds.right, limit.right),
				Math.min(bounds.top, limit.top));	
		
		
		// Example: Convert the input WGS84 to EPSG:900913
		newBounds.transform(this.map.displayProjection, this.map.projection);
		
		
		// a = original lonlat, b = screen space, c = modified lonlal
		var orig_ll_min = new OpenLayers.LonLat(newBounds.left, newBounds.bottom);
		var orig_ll_max = new OpenLayers.LonLat(newBounds.right, newBounds.top); 
		console.log("mmi orig_ll", orig_ll_min, orig_ll_max);
				
		
		//aMin.transform(this.map.displayProjection, this.map.projection);
		var orig_px_min = this.map.getPixelFromLonLat(orig_ll_min);		
		var orig_px_max = this.map.getPixelFromLonLat(orig_ll_max);
		console.log("mmi orig_px", orig_px_min, orig_px_max);
		
		var border_px = 10;
		
		var border_px_min = new OpenLayers.Pixel(orig_px_min.x + border_px, orig_px_min.y - border_px);
		var border_px_max = new OpenLayers.Pixel(orig_px_max.x - border_px, orig_px_max.y + border_px);
		console.log("mmi border_px", border_px_min, border_px_max);
		
//		border_px_min = orig_px_min;
//		border_px_max = orig_px_max;
		
		
		var border_ll_min = this.map.getLonLatFromPixel(border_px_min);
		var border_ll_max = this.map.getLonLatFromPixel(border_px_max);
		console.log("mmi border_ll", border_ll_min, border_ll_max);
		
		var b = new OpenLayers.Bounds(
				border_ll_min.lon,
				border_ll_min.lat,
				Math.max(border_ll_min.lon, border_ll_max.lon),
				Math.max(border_ll_min.lat, border_ll_max.lat));

		//console.log("aoeu compare before", newBounds, "after", b);
		
		//b.transform(this.map.displayProjection, this.map.projection);
		
		/*
		var x = b.clone();
		x = x.transform(this.map.displayProjection, this.map.projection);
		console.log("aoeu x", x);
		*/
		
		
		/*
		var a = new OpenLayers.LonLat(bounds.left, bounds.bottom);
		var b = new OpenLayers.LonLat(bounds.right, bounds.top);
		
		var ta = this._pointToScreen(a);
		var tb = this._pointToScreen(b);
		
		var b = new OpenLayers.Bounds();
		b.extend(ta);
		b.extend(tb);

		
		var limit = new OpenLayers.Bounds(-179.999, -89.999, 179.999, 89.999);
		*/
		
		//box = new OpenLayers.Marker.Box(bounds);

		/* For box layer
		box = new OpenLayers.Marker.Box(b);
		this.boxLayer.addMarker(box);
		*/
		
		
//		var styleMap = new OpenLayers.StyleMap({
//    		fillColor: "#080080ff"
//    	});
		
		// Vector layer
        var box = new OpenLayers.Feature.Vector(b.toGeometry(), {}, {
        	fillColor: "#8080ff",
        	fillOpacity: 0.2,
        	strokeLinecap: "round",
        	strokeWidth: 1, 
        	strokeColor: "#7070ff",
        	pointRadius: 12,
        	//fill: false,
        	//externalGraphic: "src/main/resources/images/org/openclipart/people/mathec/magnifying_glass.svg",
        	//graphicOpacity: 0.4,
        	//graphicWidth: 100,
        	//graphicHeight: 100
        	label: "Click to zoom",
        	fontColor: "#8080ff", //"#ffffff",
        	fontWeight: "bold",
        	//backgroundGraphic: "src/main/resources/images/org/openclipart/people/mathec/magnifying_glass.svg",
        	//backgroundHeight: 100,
        	//backgroundWidth: 100
        });
        
        //box = new OpenLayers.Feature.Vector(b.toGeometry());
        
        this.boxLayer.addFeatures([box]);

		this.idToBox[id] = box;
	},
	
	removeBox : function(id) {
		var box = this.idToBox[id];
		if(box) {
			//this.boxLayer.removeMarker(box);
			this.boxLayer.removeFeatures([box]);
		}
	},

	/*
	setNodeToPos: function(nodeToPos) {
		console.log(nodeToPos);
		var self = this;
		
		//self.nodeToFeature.removeAll(getKeys(change.removed));

		for(id in self.nodeToFeature.entries) {
			var feature = self.nodeToFeature.entries[id];
			self.markerLayer.removeMarker(feature.marker);
		}
		
		this.nodeToFeature.clear();
		
		for(id in nodeToPos) {
			var point = nodeToPos[id];

			//point = point.transform(self.map.displayProjection, self.map.projection);
			//console.log(point);
			
			var feature = self.createMarker(point, id);
			self.nodeToFeature.put(id, feature);
			//console.log("Adding feature/marker");
			//console.log(feature);
			self.markerLayer.addMarker(feature.marker);
		}
		
		

	},
	*/
	
	_doBind: function() {

		var self = this;
		
		/**
		 * For each entry in the nodeToPos map we create a feature
		 */
		/*
		$(this.nodeToPos).bind("changed", function(event, change) {
			
			self.nodeToFeature.removeAll(getKeys(change.removed));

			//console.log("pos");
			console.log(change);
			for(id in change.added) {
				var point = change.added[id].clone();

				//point = point.transform(self.map.displayProjection, self.map.projection);
				//console.log(point);
				
				var marker = self.createMarker(point, id);
				self.nodeToFeature.put(id, marker);
			}		
		});
		*/

		
		/**
		 * We add all nodeFeatures to the map 
		 */ 
		/*
		$(this.nodeToFeature).bind("changed", function(event, change) {
			for(key in change.removed) {
				//console.log("Features removed");
				var marker = change.removed[key].marker;
				self.markerLayer.removeMarker(marker);
				//self.vectorLayer.removeMarker(value);
			}


			for(key in change.added) {
				var marker = change.added[key].marker;
				self.markerLayer.addMarker(marker);
				//self.vectorLayer.addMarker(value);
			}		
		});
		*/
			
		/*
		$(this.wayToFeature).bind("changed", function(event, change) {
			
			for(key in change.removed) {
				//console.log("Features removed");
				value = change.removed[key];
				self.vectorLayer.removeFeatures([value]);
			}


			for(key in change.added) {
				value = change.added[key];
				self.vectorLayer.addFeatures([value]);
				//console.log(value);
			}		

			//self.wayToFeature.put(key, polygonFeature);
		    //self.vectorLayer.addFeatures([polygonFeature]);
			
			
		});
		*/
	},
	
	_pointToScreen: function(point) {
		return point.clone().transform(this.map.displayProjection, this.map.projection);
	},
	
	createMarker: function(point, nodeId) {
		var layer_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        
		var style_image = OpenLayers.Util.extend({
			externalGraphic: config.markerUrlDefault,
        	graphicOpacity: 1.0, //0.8,
        	graphicWidth: 25,
        	graphicHeight: 25,
        	graphicYOffset: -25
			
		}, layer_style);
		
		
		/*
		var style_blue = OpenLayers.Util.extend({}, layer_style);
        style_blue.strokeColor = "blue";
        style_blue.fillColor = "blue";
        style_blue.graphicName = "star";
        style_blue.pointRadius = 10;
        style_blue.strokeWidth = 3;
        style_blue.rotation = 45;
        style_blue.strokeLinecap = "butt";
        */
        
        var tPoint = point.clone().transform(this.map.displayProjection, this.map.projection);
        
        var pt = new OpenLayers.Geometry.Point(tPoint.lon, tPoint.lat);
        var result = new OpenLayers.Feature.Vector(pt, {point: point, nodeId: nodeId}, style_image);
        
        return result;
	},
	
	
	createMarkerOld: function(point, nodeId) {
		//console.log("Creating marker: " + point);
		
		var types = this.nodeToTypes.get(nodeId);
		var type = null;
		if(types) {
			type = types[0];
		}
		
		var iconUrl = type ? this.schemaIcons.get(type) : null;
		
		if(!iconUrl || iconUrl == "(missing icon)") {
			iconUrl = config.markerUrlDefault; //"src/main/resources/icons/markers/marker.png";//"http://www.openlayers.org/dev/img/marker.png";
		}
		
		//point = new OpenLayers.LonLat(-1, 52);
		
		var tPoint = point.clone().transform(this.map.displayProjection, this.map.projection);
		//var tPoint = point;
		
		//console.log(tPoint);
		
		var size = new OpenLayers.Size(21, 25);
		var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
		var icon = new OpenLayers.Icon(iconUrl, size, offset);

		/*
		markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,0),icon));
		*/

		
		var feature = new OpenLayers.Feature(this.markerLayer, tPoint, {icon: icon});
		feature.closeBox = true;
		feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud,{'panMapIfOutOfView':false, 'autoSize': true});
		//feature.data.popupContentHTML = "No content loaded yet";
		feature.data.overflow = "auto";

		var marker = feature.createMarker();

		var self = this;
		var markerClick = function(event) {
			
			OpenLayers.Event.stop(event);
			
			self._trigger("onMarkerClick", event, {"nodeId": nodeId, "feature": feature});
			
			/*
			for (var i = self.map.popups.length - 1; i >= 0; --i) {
				self.map.popups[i].hide();
			}
			if (this.popup == null) {
				this.popup = this.createPopup(this.closeBox);
				self.map.addPopup(this.popup);
				this.popup.show();
			} else {
				this.popup.toggle();
			}
			
			this.popup.setContentHTML(self.nodeToLabels.get(nodeId));
			
			//loadData(currentPopup, nodeId, xlon, xlat, tags);
			*/
		};
		
		//marker.events.register("mouseover", feature, markerClick);
		//marker.events.register("mouseout", feature, markerClick);
		marker.events.register("click", feature, markerClick);
		 //*/
		
		//markerLayer.addMarker(marker);
		
		return feature;
	},


	getBounds: function() {
		return this.map.getExtent().transform(this.map.projection, this.map.displayProjection);
	},

	
	saveState: function() {
		var result = {
				center: this.map.getCenter(),
				zoom: this.map.getZoom()
		};
		
		return result;
	},

	loadState: function(state) {
		if(!state) {
			return
		}

		var center = state.center ? new OpenLayers.LonLat(state.center.lon, state.center.lat) : this.map.getCenter();
		var zoom = state.zoom ? state.zoom : this.map.getZoom();
		
		this.map.setCenter(center, zoom, false, false);		
	},
	
	/*
	onMapEvent: function(event) {
		$(this.domElement).trigger("onMapEvent", event, this.map);
	}*/
});

})(jQuery);
