(function() {
	
	var sparql = Namespace("org.aksw.ssb.sparql.syntax");
	var facets = Namespace("org.aksw.ssb.facets");

	var rdf = Namespace("org.aksw.ssb.vocabs.rdf");
	var rdfs = Namespace("org.aksw.ssb.vocabs.rdfs");

	var ns = Namespace("org.aksw.ssb.app.controllers");

	
	ns.QueryFactoryGeo = function(baseQuery, bindings, geoConstraintFactory) {
		this.baseQuery = baseQuery;
		this.bindings = bindings;
		this.geoConstraintFactory = geoConstraintFactory;
	};
	
	ns.QueryFactoryGeo.prototype.create = function(bounds) {
		// Create a deep copy of the query (substitute with identity mappinp)
		var copy = this.baseQuery.copySubstitute(function(x) { return x; });
		
		var geoConstraint = this.geoConstraintFactory.create(bounds);
		
		//var geoConstraint = this.geoConstraintFactory.create(bounds);
		var filter = new sparql.ElementFilter(geoConstraint.getExpr());
		copy.elements.push(filter);
		
		return copy;
	};

	ns.QueryFactoryGeo.prototype.toString = function() {
		return this.baseQuery.toString();
	};
	
	
	/**
	 * The query generator creates a SPARQL query
	 * for resources based on selected 
	 * .) type 
	 * .) facets and
	 * .) boundary
	 * 
	 * 
	 */
	ns.QueryGenerator = function(options) {
		this.options = options;
		
	
		/* Query generation */
		
		// The driver is a query element which specifies which resources to fetch
		// (e.g. ?s a Subvention)
		// The driverVar is a variable of the driver element (e.g. ?s) 
		this.driver = options.driver;
		//this.driverVar = options.driverVar;
		
		// The path manager can create query elements for property paths
		// such as (knows label) -> ?x knows ?y . ?y label ?z.
		// Common paths will have the same variables in the corresponding query element
		this.pathManager = options.pathManager;
		
		// A factory for creating query elements that
		// correspond to boundary constraints (e.g. whenever the map view changes) 
		this.geoConstraintFactory = options.geoConstraintFactory;
		
		// A list of constraint objects that need to be included in the final query
		// Such as generated by the facet view
		this.constraints = options.constraints;
		
		
		// A list of paths for which to fetch data
		// TODO Not sure how components should declare that
	};
	
	/*
	ns.QueryGenerator.prototype.initFacets = function() {
		
	};
	*/
	
	/**
	 * Creates a SPARQL query for fetching resources, geo-coordinates, labels (and possibly more)
	 * based on all available constraints.
	 *
	 * Returns an object with the query object, and a set of semantic mappings of the queryies
	 * variable (e.g. {label: v_1}
	 * 
	 * @returns A QueryFactoryGeo object that contains the base query and supports adding bbox constraints
	 */
	ns.QueryGenerator.prototype.createQueryFactory = function() {
		
		var query = new sparql.Query();
		
		query.elements.push(this.driver.element);
		
		for(var i = 0; i < this.constraints.length; ++i) {
			// Create query element and filter expression
		}
		
		
		var triplesBlock = new sparql.ElementTriplesBlock();
		
		query.elements.push(triplesBlock);
		triplesBlock.addTriples(this.geoConstraintFactory.getTriples());
		
	
		//var geoConstraint = this.geoConstraintFactory.create(bounds);
		//query.elements.push(new sparql.ElementFilter(geoConstraint.getExpr()));
				
		

		//this.geoConstraintFactory

		var geomVar = this.geoConstraintFactory.breadcrumb.targetNode.variable;
		var xVar = this.geoConstraintFactory.breadcrumbX.targetNode.variable;
		var yVar = this.geoConstraintFactory.breadcrumbY.targetNode.variable;


		// Add facet constraints
		var element = this.constraints.getSparqlElement();
		if(element) {
			query.elements.push(element);
		}

		
		// TODO We need to find out the variables which should be fetched.
		var labelBc = new facets.Breadcrumb.fromString(this.pathManager, rdfs.label.value);
		var typeBc = new facets.Breadcrumb.fromString(this.pathManager, rdf.type.value);
		
		triplesBlock.addTriples(labelBc.getTriples());
		triplesBlock.addTriples(typeBc.getTriples());
		
		triplesBlock.uniq();
		
		query.projection[geomVar] = null;
		query.projection[xVar] = null;
		query.projection[yVar] = null;
		query.projection[labelBc.targetNode.variable] = null;
		
		// TODO: Maybe use Construct query instead
		var bindings = {geom: geomVar, x: xVar, y: yVar, subject: this.driver.variable.value};
		//var boundQuery = {query: query, bindings: bindings};
		
		//console.log("Created query and bindings:", result);
		//console.log("Query string:", query.toString());

		
		var result = new ns.QueryFactoryGeo(query, bindings, this.geoConstraintFactory);
		
		return result;
		
		//alert("Creating query");
		//BreadCrumb.getTargetVariable
		//BreadCrumb.getVariables()
	};
	
	ns.QueryGenerator.prototype.setDriver = function(driver) {
		this.driver = driver;
	};
	
	ns.QueryGenerator.prototype.setGeoConstraintFactory = function(geoConstraintFactory) {
		this.geoConstraintFactory = geoConstraintFactory;
	};
	
	ns.QueryGenerator.prototype.refresh = function(bounds) {
		var query = this.createQuery(bounds);
		
		console.log(query.toString());
		
		/*
		this.sparqlService.executeSelect(query.toString(), function(jsonRdf) {
			// TODO Process the result
		});
		*/
	};

})();

