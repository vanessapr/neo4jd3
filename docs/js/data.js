function getRandomCompany(){
    var companies = ['AAPL', 'GOOG', 'FB', 'MSFT', 'LINK', 'UBER', 'LYFT']
    return companies[Math.floor(Math.random() * companies.length)];
}

function createRandomCompanyObject(){
    return {
        'name': getRandomCompany(),
        'location': 'USA',
        'type': 'Company'
    }
}

function addCompanyToObject(data){
    var nodes = data.nodes;

    for (var i = 0; i < nodes.length; i++){
        var item = nodes[i];
        item['Company'] = createRandomCompanyObject();
    }

    return data;
}

function createCompanyNodes(data){
    var companies = {};
    var index = 0;
    var nodes = data.results[0].data[0].graph.nodes;
    var maxId = -Infinity;

    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        maxId = Math.max(maxId, node.id)
        var item = node.properties;

        if ('Company' in item){
            var companyObject = item['Company'];
            var companyName = companyObject['name'];
            if (!(companyName in companies)) {
                var indexDict = {'id': index };

                companies[companyName] = Object.assign(indexDict, companyObject);
                index++;
            }
        }
    }

    for (var key in companies){
        companies[key].id = companies[key].id + maxId + 1;
    }

    return companies;
}


function createCompanyEdges(companyNodes, data){

    var nodes = data.results[0].data[0].graph.nodes;
    var edges = data.results[0].data[0].graph.relationships;
    var maxID = -Infinity;
    var maxIDEdge = -Infinity;

    var newEdges = [];

    for(var i= 0; i < edges.length; i++){
        var edge = edges[i];
        maxIDEdge = Math.max(maxIDEdge, edge.id);
    }


    for (var i = 0; i < nodes.length; i++){

        var node = nodes[i];
        var company = node.properties.Company.name;
        var companyObject =  companyNodes[company];
        var username = node.properties.name;
        maxID = Math.max(maxID, node.id);

        newObj = {
            startNode: node.id,
            endNode: companyObject.id,
            company: company,
            person: username
        }
        newEdges.push(newObj);
    }
    newEdges.forEach(function(x,i){
        x.id = i + 1 + maxIDEdge;
    })

    return newEdges;
}

function mergeData(data, companyNodes, companyEdges){

    var nodes = data.results[0].data[0].graph.nodes;

    var companyNodesAlone = Object.values(companyNodes);
    var companyNodesPrime = companyNodesAlone.map(
        function(x){
            return {
                id: x.id,
                labels: ["Company"],
                properties: {location: x.location, name: x.name},
            }
        });

    var edges = data.results[0].data[0].graph.relationships;

    var companyEdgesPrime = companyEdges.map(function(x){

        return {
            id: x.id,
            properties: {company: x.company, person: x.person},
            type: "Company",
            startNode: x.endNode,//x.startNode,
            endNode: x.startNode//x.endNode
        }

    });

    var nodesPrime = companyNodesPrime.concat(nodes)//.concat(companyNodesPrime);
    var edgesPrime = companyEdgesPrime.concat(edges)//.concat(companyEdgesPrime);

    data.results[0].data[0].graph.nodes = nodesPrime;
    data.results[0].data[0].graph.relationships = edgesPrime;

    return data;
}



function createProperties(x, attributes){
    const properties = {};
    properties['Company'] = createRandomCompanyObject();
    attributes.forEach(function(attribute){
        const value = x[attribute];

        if (typeof(value) !== 'undefined' && value !== ''){
            properties[attribute] = x[attribute];

            if (attribute == 'Amount'){
                properties[attribute] = +x[attribute];

            }
        }
    })

    return properties;
}

function createNodes(obj){
    const attributes = ['name', 'label', 'Country', 'Branch', 'CreationDate', 'CusOrAccType', 'Company']
    return obj.nodes.map(function(x, idx){
        return {
            id: x.id,
            labels: [x.type],
            properties: createProperties(x, attributes)
        }
    })
}

function createRelationships(obj){
    const attributes = ["Amount", "Geolocation", "TransNo", "Comment", "TransactionDate", "RuleViolated", "RuleCode"]
    return obj.edges.map(function(x, idx){
        return {
            id: idx,
            type: x.type,
            properties: createProperties(x, attributes),
            startNode: x.source,
            endNode: x.target,
        }
    });
}

function convertToNeo4j(obj){

    const nodes = createNodes(obj);
    const relationships = createRelationships(obj);
    const data = [{
        columns: ["user", "entity"],
        data: [{
            graph: {
                nodes: nodes.slice(1),
                relationships: relationships.slice(2)
            }}]
    }]

    return {results: data, errors: []}

}

var dummyData = {
    "results": [
        {
            "columns": ["user", "entity"],
            "data": [
                {
                    "graph": {
                        "nodes": [
                            {
                                "id": "1",
                                "labels": ["User"],
                                "properties": {
                                    "userId": "eisman"
                                }
                            },
                            {
                                "id": "8",
                                "labels": ["Project"],
                                "properties": {
                                    "name": "neo4jd3",
                                    "title": "neo4jd3.js",
                                    "description": "Neo4j graph visualization using D3.js.",
                                    "url": "https://eisman.github.io/neo4jd3"
                                }
                            }
                        ],
                        "relationships": [
                            {
                                "id": "7",
                                "type": "DEVELOPES",
                                "startNode": "1",
                                "endNode": "8",
                                "properties": {
                                    "from": 1470002400000
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ],
    "errors": []
}




const _data_prime = addCompanyToObject(_data);
var data = convertToNeo4j(_data_prime);
const companyNodes = createCompanyNodes(data)
const companyEdges = createCompanyEdges(companyNodes, data);
data = mergeData(data, companyNodes, companyEdges);
debugger;




const config = {
    highlight: [{
        class: 'Account',
        property: 'id',
        value: 'neo4jd3'
    }],
    icons: {
        'Account': 'user',
        'OwnBankAccount': 'bank',
        'OtherBankAccount': 'bank',
    },
    minCollision: 45,
    neo4jData: data,
    nodeRadius: 20,
};

