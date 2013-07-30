(function() {

	/*
	var backend = Namespace("org.aksw.ssb.backend");
	var backboneUtils = Namespace("org.aksw.utils.backbone");
	var xsd = Namespace("org.aksw.ssb.vocabs.xsd");
	var labelUtils = Namespace("org.aksw.ssb.utils");
	var facets = Namespace("org.aksw.ssb.facets");
	 */
	
	var widgets = Namespace("org.aksw.ssb.widgets");
	var ns = widgets;

	
	
	/**
	 * In the target model, sets the state of whether the model was added
	 * to the table
	 * 
	 * @param path
	 * @param targetModel
	 * @param collectionColumns
	 * @returns {ns.ControllerColumnSync}
	 */
	ns.ControllerColumnSync = function(path, targetModel, collectionColumns) {
		_.bindAll(this);

		this.path = path;
		this.targetModel = targetModel;
		this.collectionColumns = collectionColumns;
		
		this.bind();
		this.updateModel();
	};
	
	
	ns.ControllerColumnSync.prototype = {
		bind: function() {
			this.collectionColumns.on('add remove reset', this.updateModel);
		},

		updateModel: function() {			
			//var path = this.targetModelmodel.get('path');
			var path = this.path;
			var containsPath = this.collectionColumns.containsPath(path);

			//console.log("ContainsPath " + containsPath, this + " " + this.path + " ", this.collectionColumns);
			
			this.targetModel.set({isAddedToTable: containsPath});
		}
	};

	
	
	/**
	 * Syncs the boolean targetPropery value of the targetModel based on the state
	 * of the stateCollection on whether it contains a specific path.
	 * 
	 * @param path
	 * @param targetModel
	 * @param stateCollection The collection from which to infer the state of the model
	 * @returns {ns.ControllerModelSync}
	 */
	ns.ControllerModelSync = function(path, targetModel, targetProperty, stateCollection, fnContainsPath) {
		_.bindAll(this);

		this.path = path;
		this.targetModel = targetModel;
		this.targetProperty = targetProperty;
		this.stateCollection = stateCollection;
		this.fnContainsPath = fnContainsPath;
		
		this.bind();
		this.updateModel();
	};
	
	
	ns.ControllerModelSync.prototype = {
		bind: function() {
			this.stateCollection.on('add remove reset', this.updateModel);
		},

		updateModel: function() {
			var containsPath = this.fnContainsPath.call(this.stateCollection, this.path);

			//console.log("ContainsPath " + containsPath, this + " " + this.path + " ", this.collectionColumns);
			
			var data = {};
			data[this.targetProperty] = containsPath;
			
			this.targetModel.set(data);
		}
	};
	
	
	
	
	

	ns.ViewItemFacet = Backbone.View.extend({
				tagName : 'li',
				
				// Extension points: These selectors point to DOM elements which other plugins may use
				permaAreaSelector: '> div > div.permaOptions',
				hoverAreaSelector: '> div > div.hoverOptions',
				collapseAreaSelector: 'not implemented yet',
				
				
				// attributes: {style: 'float: left'},
				initialize : function() {
					_.bindAll(this); 

					var options = this.options;

					var parent = options.parent;
					var parentOptions = parent.options;
					//this.modelFacetUpdater = parentOptions.modelFacetUpdater;
					this.fnUpdateFacets = parentOptions.fnUpdateFacets;

					var model = this.model;
					var children = model.get("children");

					/////this.collectionColumns = parentOptions.collectionColumns;
					
					this.subFacetWidget = new widgets.ViewFacetTree({
						collection: children,
						//modelFacetUpdater: this.modelFacetUpdater,
						fnUpdateFacets: this.fnUpdateFacets
						/////collectionColumns: this.collectionColumns
					});
					
					
					var self = this;

					this.subFacetWidget.on('all', function() {
						// Note: According to backbone doc, listing for all gives the event name as first argument
						var p = self.options.parent;
						p.trigger.apply(p, arguments);
					});

					
					
					this.on('all', function() {
						var p = self.options.parent;
						p.trigger.apply(p, arguments);						
					});
					
					// console.log("ModelFacetUpdater ",
					// this.modelFacetUpdater);

					// model.bind('change', this.render, this);
					model.bind('remove', this.unrender, this);
					model.on('change:selectionCount', this.onChangeFacetStats); //onChangeSelectionCount);
					model.on('change:facetCount', this.onChangeFacetStats);

					model.on('change:isExpanded', this.changeIsExpanded, this);
					model.on('change:isLoading', this.updateIsLoading, this);

					model.on('change:hasSubFacets', this.changeHasSubFacets, this);
					
					//model.on('change:isAddedToTable', this.onChangeIsAddedToTable);
					// model.bind('change:isExpanded', function())

					// var children = model.get("children");

					var self = this;
					



//					var ViewItemAddToTable = ns.ViewItemLink.extend({
//						/*
//						initialize: function() {
//							ns.ViewItemLink.prototype.initialize.apply(this);
//							
//							_.bindAll(this);
//						},
//						*/
//						events: {
//							'click': function() {
//								self.collectionColumns.addPath(self.path);
//								ev.preventDefault();
//							}
//						}
//					});
//					
//					this.viewItemAddToTable = new ViewItemAddToTable({
//						model: this.model,
//						subView: new ns.ViewItemIcon({
//							model: this.model,
//							attributes: {
//								'class': 'icon-circle-arrow-right'
//							},
//							fnState: function(model) {
//								return '' + model.get('isAddedToTable');
//							},
//							stateToAttrs: {
//								'false': { style: 'display: block'},
//								'true': { style: 'display: none'}
//							}
//						})
//					});
//
//					
//					var ViewItemRemoveFromTable = ns.ViewItemLink.extend({
//						events: {
//							'click': function() {
//								self.collectionColumns.removePath(self.path);
//								ev.preventDefault();
//							}
//						}					
//					});
//
//					this.viewItemRemoveFromTable = new ViewItemRemoveFromTable({
//						model: this.model,
//						subView: new ns.ViewItemIcon({
//							model: this.model,
//							attributes: {
//								'class': 'icon-remove-circle'
//							},
//							fnState: function(model) {
//								return '' + model.get('isAddedToTable');
//							},
//							stateToAttrs: {
//								'false': { style: 'display: none'},
//								'true': { style: 'display: block'}
//							}
//						})
//					});
//					
//					
//					/////var facetFacadeNode = model.get('facetFacadeNode');
//					/////this.path = facetFacadeNode.getPath();
//					var facetNode = model.get('facetNode');
//					this.path = facetNode.getPath();
//					
//					// children.bind('add', this.add)
//					var controllerColumnSync = new ns.ControllerColumnSync(
//							this.path,
//							this.model,
//							this.collectionColumns
//					);

					
					if (this.el) {
						this.render();
					}

					this.facetValuesView = null;
				},

				/*
				onChangeIsAddedToTable: function() {
					var isAddedToTable = this.model.get('isAddedToTable');
					console.log("isAddedToTable", isAddedToTable);
					
					
					var $elPermaDiv = this.$el.find("> div > div.permaOptions");
					//console.log("PermaDiv", $elPermaDiv);
					
					if(isAddedToTable) {
						var $elTmp = $('<span>X</span>');
						$elPermaDiv.append($elTmp);
						
						var self = this;
						$elTmp.click(function() {
							self.collectionColumns.removePath(self.path);
							$elPermaDiv.remove();
						});
						
					} else {
					}
				},*/

				onChangePartitionStatus: function() {
					
					
				},
				
				onChangeFacetStats: function() {
					var selectionCount = this.model.get('selectionCount');					
					var facetCount = this.model.get('facetCount');

					//console.log('selection / facet' + selectionCount, facetCount);
					
					var html = '';
					if(selectionCount) {
						html
							= '<span class="selectionCount">' + selectionCount + '</span>'
							+ '<span>/</span>'
							;
					}
					
					if(!facetCount && facetCount !== 0) {
						facetCount = '';
					}
					
					html += '<span class="facetCount">' + facetCount + '</span>';

					
					this.$el.find('> div > div.facetStats').html(html);
				},
				
				updateIsLoading: function() {
					var $elI = this.$el.find("> div > div > a.expandable > i");
					var $elImg = $elI.find("> img"); //$elI.find("> div > a.expandable > i > img");

//					console.log("$elI", $elI);
//					console.log("$elImg", $elImg);
					
					$elImg.remove();

					var isLoading = this.model.get("isLoading");
					if(isLoading) {
						//console.log("SHOWING ICON");
						$elI.append('<img src="resources/icons/loading.gif" />');
					}
				},
				
				changeHasSubFacets: function() {
					var $elI = this.$el.find("> div > div > a.expandable > i");

					var model = this.model;
					var hasSubFacets = model.get('hasSubFacets');
					
					// If there are no subfacets, hide the button
					// otherwise, show the button according to their expanded state
					if(!hasSubFacets) {
						$elI.removeClass("icon-caret-right");
						$elI.removeClass("icon-caret-down");
					} else {
						this.changeExpandend();
					}				
				},
				
				changeIsExpanded : function() {
					var model = this.model;

					var hasSubFacets = model.get('hasSubFacets');
					if(!hasSubFacets) {
						return;
					}
					
					
					var isExpanded = model.get('isExpanded');

					var $elI = this.$el.find("> div > div > a.expandable > i");

					if(isExpanded) {
						$elI.removeClass("icon-caret-right");
						$elI.addClass("icon-caret-down");
					}
					else {
						$elI.removeClass("icon-caret-down");
						$elI.addClass("icon-caret-right");					
					}
					
					// var subFacetWidget = this.subFacetWidget;
					// if(!subFacetWidget) {
					// return;
					// }

					var subEl = this.subFacetWidget.$el;
					if (isExpanded) {
						subEl.show();
					} else {
						subEl.hide();
					}
				},

				/**
				 * The view for the list of child-nodes
				 */
				getChildView: function() {
					return this.subFacetWidget;
				},
				
				getPermaArea: function() {
					return this.$el.find(this.permaAreaSelector);
				},
				
				getHoverArea: function() {
					return this.$el.find(this.hoverAreaSelector);
				},
				
				getCollapseArea: function() {
					return this.$el.find(this.collapseAreaSelector);
				},
				
				updateFacets: function() {
					var model = this.model;

					var simulateLoad = false;// true;
					if(simulateLoad) {
						model.set({isLoading: true});
						var scheduler = new Scheduler(5000, true);
						
						var self = this;
						scheduler.schedule(function() {
							//console.log("bar");
							//self.modelFacetUpdater.updateFacets(model, facetFacadeNode);
							var promise = self.fnUpdateFacets(model);
							// Trigger a postRender event
							self.trigger('facetUpdate', promise);
						});
					} else {							
						//this.modelFacetUpdater.updateFacets(model, facetFacadeNode);
						var promise = this.fnUpdateFacets(model);
						this.trigger('facetUpdate', promise);							
					}					
				},
				
				events : {
					'click .toggle-parent': function(ev) {
						// TODO Consistently use some class for indicating toggles
						var expectedTargetSet = this.$el.find(".partitionArea:first > > .toggle-parent:parent");
						
						var isTargetValid = expectedTargetSet.filter(function() { return this === ev.target; }).length != 0;
						if (!isTargetValid) {
							return;
						}
						ev.preventDefault();

						
						var $elTarget = $(ev.target);
						var $elParent = $elTarget.parent();
						var $elContainer = $elParent.parent();
						
						$elContainer.children().toggleClass('hide');
						
						//console.log("Ev", $(ev.target).parent());
						//$elI = this.$el.find('i:first');

					},
					
					'click .expandable' : function(ev) {
						
						// Workaround for backbone not supporting relative paths for event target selector
						var expectedTarget = this.$el.find("> div > div > a.expandable")[0];
						if (ev.currentTarget != expectedTarget) {
							return;
						}
						ev.preventDefault();

						var model = this.model;
						var isExpanded = model.get('isExpanded');
						if (isExpanded) {
							model.set({
								'isExpanded' : false
							});
						} else {
							//var facetFacadeNode = model.get("facetFacadeNode");

							model.set({
								'isExpanded' : true
							});

							this.updateFacets();
/*							
							promise.done(function() {
								console.log("DONE LOADING");
							});
							*/
						}
					},
					'click .activate' : function(ev) {
						
						// Workaround for backbone not supporting relative paths for event target selector
						var expectedTarget = this.$el.find("> div > div > a.activate")[0];
						if (ev.currentTarget != expectedTarget) {
							return;
						}
						ev.preventDefault();

						var model = this.model;

						var facetNode = model.get('facetNode'); 
						
						//var concept = facetFacadeNode.createConcept();
						var data = {
							facetNode: facetNode	
						};
						
						this.trigger('facetSelected', data);
					},

					'mouseenter div': function(ev) {
						//var expectedTarget = this.el;
						var expectedTarget = this.$el.find("> div")[0];
						if (ev.currentTarget != expectedTarget) {
							return;
						}

						
						this.getHoverArea().show();
						//this.$el.find("> div > div.hoverOptions").show();
					},
					
					'mouseleave div': function(ev) {
						//var expectedTarget = this.el;
						var expectedTarget = this.$el.find("> div")[0];
						if (ev.currentTarget != expectedTarget) {
							return;
						}

						this.getHoverArea().hide();
						//this.$el.find("> div > div.hoverOptions").hide();
					}
					
					
					/*
					'click .addToTable' : function(ev) {
						ev.preventDefault();
						//alert('addToTable');
						var expectedTarget = this.$el.find("> div > div > a.addToTable")[0];
						if (ev.currentTarget != expectedTarget) {
							return;
						}
						
						this.options.parent.trigger('addToTable', ev, this);//ev, this.model);

						//this.trigger(''; this.model);
						//this.getParent().trigger("pivot", this);
					},
					*/
				},

				render : function() {
					
					var text = this.model.get("facetUri");
					//console.log('Got facetUri:', text);
					
					if(!text) {
						text = 'http://ns.aksw.org/facete/builtin/Items';
					}
					
					var isInverse = this.model.get("isInverse");					
					var str;
					if(isInverse) {
						str = '    is <span data-uri="' + text + '"></span> of' ;
					} else {
						str = '    <span data-uri="' + text + '"></span>';
					}

					
					var html
						= '<div class="inline">'
                        + '  <div class="inline">'
						+ '    <a class="expandable" href="#">'
						+ '      <i class="icon-caret-right" />'
						+ '    </a>'
						+ '  <a class="activate" href="#">'
						+ str
						+ '  </a>'
						/*
						+ '<span class="selectionCount">' + selectionCountStr + '</span>'
						+ '<span class="valueSeparator">/</span>'
						+ '<span class="facetCount">' + facetCountStr + '</span>'
						+ ' '
						*/
						+ '</div>'
						+ ' '
						+ '<div class="facetStats inline" style="margin-left: 5px">'
						+ '</div>'
						+ '<div class="permaOptions inline">'
						+ '</div>'
						+ '<div class="hoverOptions inline" style="display:none">'
						+ '</div>'
						+ '</div>'						
						+ '<br class="clearBoth" />'

						// The partition is only shown on expanded facets whose children could
						// not be fetched in time
						// TODO Factor out a "plugin" component
						+ '<div class="partitionArea hide" style="margin-left: 20px">'
						+ '    <div class="partitionCover">'
						+ '<a href="#" class="btn btn-info btn-mini toggle-parent">Configure partitions...</a>'
						+ '<a href="#"><i class="icon-question-sign" style="color:#0080FF; font-size: 150%;" /></a>'
						+ '    </div>'
						+ '    <div class="hide partitionConfig">'
						+ 'Partition size: '
						+ '        <select class="partitionSize btn btn-mini" />'
						+ '        <div class="partitionPaginator" style="float:left;" />'
//						+ '        <a href="#" class="toggle-parent">(hide)</a>'
						+ '        <a href="#" class="btn btn-info btn-mini toggle-parent">(hide)</a>'
						+ '    </div>'
						+ '</div>'
						;

					this.$el.html(html);

					this.$elPermaDiv = this.$el.find("> div > div.permaOptions");
					this.$elHoverDiv = this.$el.find("> div > div.hoverOptions");


					
					/*
					 * var model = this.model; var isExpanded =
					 * model.get("isExpanded"); if(!isExpanded) { return this; }
					 */

					var $elSubFacetWidget = this.subFacetWidget.render().$el;
					this.$el.append($elSubFacetWidget);


					
//					var $elRemoveFromTable = this.viewItemRemoveFromTable.render().$el;
//					this.$elPermaDiv.append($elRemoveFromTable);
//					
//					var self = this;
//					// TODO Hack - actually the click handler should be part of the view, but it won't work for some reason
//					$elRemoveFromTable.click(function(ev) {
//						self.collectionColumns.removePath(self.path);
//						ev.preventDefault();
//					});
//					//$elRemoveFromTable.delegateEvents();
					
					
					
//					var $elAddToTable = this.viewItemAddToTable.render().$el;
//					this.$elHoverDiv.append($elAddToTable);
//
//					// TODO Hack - actually the click handler should be part of the view, but it won't work for some reason
//					$elAddToTable.click(function(ev) {
//						self.collectionColumns.addPath(self.path);
//						ev.preventDefault();
//					});
//
					
					// TODO: This is not the best place to do the update,
					// as it fires one query per element
					//foobarI18N.update(this.$el);
					
					

					//this.onChangeIsAddedToTable();
					
					this.onChangeFacetStats();
					
					return this;
				},
				reset: function() {
					//this.unrender();
					/*
					this.subFacetWidget.unrender();
					this.$el.html('');//clear();
					this.render();
					*/
				},
				unrender: function() {
					this.subFacetWidget.unrender();
					this.$el.remove();
									
				}
				/*
				,
				remove: function() {
					this.model.destroy();
				}
				*/
			});

	ns.facetItemRenderer = new widgets.RendererItemView({}, null,
			widgets.ViewItemFacet, {
				label : "simpleLabel"
			});

	ns.ViewFacetTree = widgets.ListView.extend({
		attributes: {
			'class': 'facet'
		},
		itemRenderer : widgets.facetItemRenderer
	});

	

	ns.ViewItemCheck = Backbone.View.extend({
		subView : null,

		tagName : 'input',
		attributes: {type: 'checkbox'}, //;style: 'float: left'},
		initialize : function() {
			_.bindAll(this); //, 'render', 'unrender', 'remove', 'setCheckState'); // every
			
			//console.log("Initialized super class");
			
			//this.model.on('change:isChecked', 'setCheckState');
			this.model.on('change:isChecked', this.updateCheckState);
	    	this.model.on('remove', this.unrender);
	    	
	    	this.updateCheckState();
		},
		updateCheckState: function() {
			var isChecked = this.model.get("isChecked");
			this.$el.attr('checked', isChecked);
			//console.log("setCheckState", isChecked, this.$el);
		},
		
		render : function() {

			var subView = this.subView;
			//var inputEl = $('<input type="checkbox"></input>');

			if(subView) {
				var subViewEl = subView.render().$el;
				this.$el.append(subViewEl);
			}
			

			//this.$el.append(inputEl);

			return this;
		},

		unrender : function() {
			this.$el.remove();
		}
	});

	
	ns.ViewItemCheckConstraint = ns.ViewItemCheck.extend({
		//tagName: 'li',
		tagName: 'input',
		attributes: {
			type: 'checkbox',
			'class': 'checkConstraint'
		},
		initialize: function() {
			//this.constructor.__super__.initialize.apply(this);
			ns.ViewItemCheck.prototype.initialize.apply(this);

			this.constraintCollection = checkNotNull(this.options.constraintCollection);
		},
		events: {
			//'click .checkConstraint':
			'click': function(ev) {
				
				//console.log("check model is", this.model);
				
				// Prevent the checkbox from getting checked
				// The check occurs as a reaction to adding the constraint to the constraint collection
				//ev.stopPropagation();
				//ev.preventDefault();
				
				var model = this.model;
				
				var constraint = model.get("constraint");
				if(!constraint) {
					console.log("Constraint not set - should not happen");
					return;
				}
				
				var path = constraint.path;
				var node = constraint.node;
				//var path = model.get("path");
				//var node = model.get("node");
				
				if(!path) {
					console.log("Path is null - should not happen");
					return;
				}
				//var nodeValue = sparql.NodeValue.makeNode(node);
								
				//var id = JSON.stringify(modelData.constraint);
				//modelData.id = id;

				var constraintCollection = this.constraintCollection;

				constraintCollection.toggleEqualsConstraint(path, node);
				
				/*****
				var priorModel = constraintCollection.findModelEquals(path, node);
				if(priorModel) {
					constraintCollection.remove(priorModel);
					//priorModel.destroy();
				} else {
					constraintCollection.add(modelData);
				}
				*/
				
				
				//console.log("Added a constraint", constraintCollection);
			}
		}
	});
	
	
	
	ns.ViewItemIcon = Backbone.View.extend({
		tagName: 'i',
		
		fnState: null,
		stateToAttrs: null,
		
		initialize: function() {
			_.bindAll(this);
			
			this.model.on('change', this.onChange);
	    	this.model.on('remove', this.unrender);
	    	
	    	this.fnState = this.options.fnState;
	    	this.stateToAttrs = this.options.stateToAttrs;
		},
		
		onChange: function() {
			//myElement.attr('class')
			var $el = this.$el;
			if(!$el) {
				return;
			}
			
			var state = this.fnState(this.model);
			var attrs = this.stateToAttrs[state];
			
			_.each(attrs, function(value, key) {
				$el.attr(key, value);
			});
		},
		
		render: function() {

			this.onChange();
			
			return this;
		},

		unrender: function() {
			this.$el.remove();
		}
	});
	
	
	ns.ViewItemLink = Backbone.View.extend({
		tagName : 'a',
		subView : null,

		attributes: {href: '#'},
		initialize : function() {
			_.bindAll(this);
			
	    	if(this.options.subView) {
	    		this.subView = this.options.subView;
	    	}			
		},
		
		render : function() {
			
//			if(true) {
//				this.$el.html("test");
//				return this;
//			}
			
			var subView = this.subView;
			if(subView) {
				$elSubView = subView.render().$el;
				this.$el.append($elSubView);
			}
			
			return this;
		},

		unrender : function() {
			this.$el.remove();
		}
	});


})();