(function() {

	/*
	var backend = Namespace("org.aksw.ssb.backend");
	var backboneUtils = Namespace("org.aksw.utils.backbone");
	var xsd = Namespace("org.aksw.ssb.vocabs.xsd");
	var labelUtils = Namespace("org.aksw.ssb.utils");
	 */

	/*
	 * On the relation of Sub facet state, child cache ...
	 * 
	 * The thing is, that there is a distinction between the
	 * complete facet tree, the fragment of it fetched and stored in the models, and the
	 * fragment being shown in the UI.  
	 * 
	 * For each facet node, whenever we expand an item, we need to save the state of it.
	 * This should be the purpose of the child cache, and is thus local to the facet tree!
	 * The children attribute carries the actual shown facets, which depend on the subFacetSpec 
	 * 
	 * 
	 * 
	 */
	
	
	var widgetNs = Namespace("org.aksw.ssb.widgets");

	
	var facets = Namespace("org.aksw.ssb.facets");
	var ns = facets;

	
	
	ns.ModelSubFacetState = Backbone.Model.extend({
		defaults: {
			strategy: 'exact' // How to compute the facets. Supported values: "exact", "partitioned"
			
			// Following attributes only apply to strategy partitioned
			//tableModel: null //new widget.TabelModel()// Paginator on the partitions
			
		}
	});
	
	ns.ModelFacetNode = Backbone.Model.extend({
		defaults : {
			//step: null, // The step leading to this node (null for root nodes)
			// baseQueryFactory: null, // Query factory for the instances (can
			// be seen as facet values)
			// facetsQueryFactory: null, // Query factory for the facets (of the
			// instances)
			// constraints: [], // constraints applying to this node
			isExpanded : false, // when changing to true, the controller will
								// start loading the children
			isLoading : false,
			
			childState: null, //new ns.ModelSubFacetState();
			childCache: null, // A mapping from id to child object which holds the state of ALL encountered children - i.e. even those not visible right now
			children: null, // The currently visible children
			
			hasSubFacets : true, // null means: not checked yet
			/*
			 * children: new Backbone.Collection({ //model: ns.ModelFacetNode
			 * }), // subFacets - NOT facet values!
			 */
		    /////facetFacadeNode : null, // Reference to a (non-model)
			facetNode: null
			// FacetFacadeNode
		},

		initialize : function() {
			// console.log("Initializing ModelFacetNode", this);

			this.set({
				children : new ns.CollectionFacetNode()
			});

			this.childState = widgetNs.createQueryBrowser();//sparqlService, labelFetcher);
		},
		
		forPath: function(path) {
			var steps = path.getSteps();

			var result = this;
			
			for(var i = 0; i < steps.length; ++i) {
				var step = steps[i];

				var children = result.get('children');

				var subNode = children.find(function(child) {
					///// var facetFacadeNode = child.get('facetFacadeNode');
					///// var childStep = facetFacadeNode.getFacetNode().getStep();
					var facetNode = child.get('facetNode');
					var childStep = facetNode.getStep();

					var result = childStep.equals(step);
					return result;
				});

				result = subNode;

				if(!result) {
					console.log("Path not found: " + path);
					break;
				}
			}
			
			return result;
		}
		
	});
	

	ns.CollectionFacetNode = Backbone.Collection.extend({
		model : ns.ModelFacetNode
	});
	
	
	/**
	 * ModelConstraints should be treated immutable!
	 * 
	 * TODO: I think we should use the complex model here too:
	 * a constraint has a type and then some extra fields depending on it
	 * e.g. {type: 'equals', path: somePath, value: node}
	 */
	ns.ModelConstraint = Backbone.Model.extend({
		defaults : {
			//type: null,
			//path : null, // The path the contraint applies to
			
			// TODO: Not sure if the constraint should be a sub-object
			constraint : null
		}
	});
	
	ns.ModelConstraint.fromJSON = function(json) {

		var serializer = Namespace('org.aksw.serializer').Serializer.singleton; 
		var data = serializer.deserialize(json);
		
		var result = new ns.ModelConstraint(data);
		return result;
	};

	
	ns.ModelColumn = Backbone.Model.extend({
		defaults: {
			path: null
		}
	});
	
	ns.CollectionColumns = Backbone.Collection.extend({
		model: ns.ModelColumn,
		
		/*
		toTree: function() {
			var rootNode = facets.FacetNode.createRoot(varName, generator);
			
			this.each(function(model) {
				var p = model.get('path');
				
				rootNode.forPath(p);
			});
			
			return rootNode;
		},
		
		createElementFromNodeRec: function(elements, facetNode) {
			var result = [];
			
			var steps = facetNode.getSteps();
			var elements = facetNode.getDirectTriples();
			
			if(elements.length > 0) {
				var tmp = new sparql.ElementGroup(elements);
				result.push(new sparql.ElementOptional(tmp));
			}			
			
			for(var i = 0; i < steps.length; ++i) {
				var step = steps[i];
				
			}
		},
		
		createElementRec: function(facetNode) {
			
		},
		*/
		
		createProjection: function(facetNode) {
			var result = new sparql.VarExprList();
			
			this.each(function(model) {
				var p = model.get('path');

				var subFacetNode = facetNode.forPath(p);
				var v = subFacetNode.getVariable();

				result.add(v);
			});
			
			return result;			
		},
		
		/**
		 * 
		 * @returns Array of sparql.Element objects
		 */
		createElements: function(facetNode) {
			var result = [];
			
			this.each(function(model) {
				var p = model.get('path');

				var subFacetNode = facetNode.forPath(p);
				var triples = subFacetNode.getTriples();
				
				if(triples.length === 0) {
					return;
				}
				
				var block = new sparql.ElementTriplesBlock(triples);
				var optional = new sparql.ElementOptional(block);
				
				result.push(optional);
			});
			
			return result;
		},
		
		findByPath: function(path) {
			var result = this.find(function(model) {
				var p = model.get('path');
				return p.equals(path);
			});			
			
			return result;
		},
		
		containsPath: function(path) {
			var model = this.findByPath(path);
			var result = model ? true : false;
			
			return result;
		},
		
		/**
		 * Avoids duplicates
		 * 
		 */
		addPath: function(path) {
			var contained = this.containsPath(path);
			if(contained) {
				return false;
			}
			
			this.add({
				path: path
			});
			
			return true;
		},
		
		removePath: function(path) {
			var model = this.findByPath(path);
			
			this.remove(model);
		}
	});
	
		
	/**
	 * A collection for contraints.
	 * 
	 * For simplicity this is a flat collection. TODO Explain how to update a
	 * query factory from it
	 * 
	 */
	ns.ConstraintCollection2 = Backbone.Collection.extend({
		model: ns.ModelConstraint,
	

		/*
		fromJson: function(json) {
			
			var items = [];
			for(var i = 0; i < json.length; ++i) {
				var item = this.model.fromJson(json);
				items.push(item);
			};
	
			this.reset(items);
		},*/
		
		clone: function() {
			var result = new ns.ConstraintCollection2();
			
			this.each(function(model) {
				var data = model.attributes;
				result.add(data);
			});
			
			return result;
		},
		
		/**
		 * 
		 * @param path
		 * @param node
		 * @return the model holding this constraint or null
		 */
		findModelEquals: function(path, node) {
			var result = this.find(function(model) {
				
				//console.log("Comparing path and node to model:", path, node, model);
				
				var constraint = model.get('constraint');
				//var constraint = model;

				/*
				console.log("Comparing path and node to model:", path, node, model);
				console.log(constraint.type === 'equals');
				console.log(path.equals(constraint.path));
				console.log(node.equals(constraint.node));
				*/
				
				var test
					= constraint.type === 'equals'
					&& path.equals(constraint.path)
					&& node.equals(constraint.node);
			
				
				return test;
			});
			
			return result;
		},
		
		setEqualsConstraint: function(path, node, isEnabled) {
			var modelData = {
					constraint: {
						type : "equals",
						path : path,
						node : node
					}
			};
				
			//console.log("Setting constraint: ", modelData);

			var priorModel = this.findModelEquals(path, node);
			
			if(isEnabled && !priorModel) {
				this.add(modelData);
			}
			else if(!isEnabled && priorModel) {
				this.remove(priorModel);
			}
		},
		
		toggleEqualsConstraint: function(path, node) {
			
			var priorModel = this.findModelEquals(path, node);

			var isEnabled = priorModel ? false : true;

			this.setEqualsConstraint(path, node, isEnabled);
		},

		/**
		 * Tests whether an equals constraint exists
		 * 
		 * @param path
		 * @param node
		 * @returns
		 */
		existsEquals: function(path, node) {
			var model = this.findModelEquals(path, node);
			var result = model ? true : false;
			
			return result;
		},
		
		existsEqualsDeprecated: function(path, node) {
			var result = this.some(function(model) {
				
				//console.log("Comparing path and node to model:", path, node, model);
				
				var constraint = model.get('constraint');
				//var constraint = model;

				/*
				console.log("Comparing path and node to model:", path, node, model);
				console.log(constraint.type === 'equals');
				console.log(path.equals(constraint.path));
				console.log(node.equals(constraint.node));
				*/
				
				var test
					= constraint.type === 'equals'
					&& path.equals(constraint.path)
					&& node.equals(constraint.node);
			
				
				return test;
			});
			
			return result;
		},
		
		createConstraintManager: function(rootFacetNode) {
			
			var constraintManager = new facets.ConstraintManager();
			var facetFacadeNode = new facets.SimpleFacetFacade(constraintManager, rootFacetNode);

			this.each(function(model) {
				var constraint = model.get('constraint');

				var path = constraint.path;
				var node = constraint.node;
				
				checkNotNull(constraint);
				
				if(constraint.type !== 'equals') {
					logger.log("Only equals supported right now");
					return
				}
				
				facetFacadeNode.forPath(path).addConstraint({
					type: 'equals',
					path: path,
					node: node
				});
			});

			return constraintManager;
//			var nodeValue = sparql.NodeValue.makeNode(sparql.Node
//					.uri("http://dbpedia.org/resource/year/2008"));
//			var constraint = facets.ConstraintUtils.createEquals(yearPath,
//					nodeValue);			
		}
	});

	
	ns.ConstraintCollection2.classLabel = 'ConstraintCollection';

	
	ns.createFacetNodes = function(constraintCollection, rootFacetNode) {

		constraintCollection.each(function(model) {
			var path = model.get("path");
			var constraint = model.get("constraint");

			var node = rootFaceNode.forPath(path);
			node.addConstraint(constraint);
		});

	};

	/**
	 * These models are created 
	 * 
	 */
	ns.ModelItemCheckConstraint = Backbone.Model.extend({
		defaults: {
			isChecked: false
			//path: null,
			//node: null
		}
	});

	/**
	 * This collection is
	 * 
	 */
	ns.CollectionItemCheckConstraint = Backbone.Collection.extend({
		model: ns.ModelItemCheckConstraint
	});
	

	
	ns.MapItemModel = Backbone.Model.extend({
		defaults: {
			isHidden: false, // Whether the item is hidden
			coords: null,
			label: null
		}
	});
	
	ns.MapItemCollection = Backbone.Collection.extend({
		model: ns.MapItemModel
	});
	
	ns.MapBoxModel = Backbone.Model.extend({
		defaults: {
			bounds: null
			// other attributes...
		}
	});
	
	ns.MapBoxCollection = Backbone.Collection.extend({
		model: ns.MapBoxModel
	});
	
	ns.MapModel = Backbone.Model.extend({
		defaults: {
			center: {lat: 0, lon: 0},
			zoom: 10,
			
			/**
			 * The collection of resources that should be displayed. 
			 */
			//uris: [],
			//resources: new ResourceCollection(),
			
			/**
			 * Rdf data about these resources in Talis Json format
			 */
			//json: {},
			
			items: new ns.MapItemCollection(),
			boxes: new ns.MapBoxCollection()
		}
	});

})();