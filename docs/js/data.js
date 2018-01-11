class Utility {
    static copy(obj){
        return JSON.parse(JSON.stringify(obj));
    }
}

class FakeData {

    static getRandomCompany(){
        var companies = ['AAPL', 'GOOG', 'FB', 'MSFT', 'LINK', 'UBER', 'LYFT']
        return companies[Math.floor(Math.random() * companies.length)];
    }

    static createRandomCompanyObject(){
        return {
            'name': this.getRandomCompany(),
            'location': 'USA',
            'type': 'Company'
        }
    }

    static addCompanyToObject(data){
        var nodes = data.nodes;

        for (var i = 0; i < nodes.length; i++){
            var item = nodes[i];
            item['Company'] = this.createRandomCompanyObject();
        }

        return data;
    }

    static createProperties(x, attributes){
        const properties = {};
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
}

function createCompanyNodesDict(data){
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


function getMaxID(nodes){
    var maxID = 0;
    for (var i = 0; i < nodes.length; i++){
        maxID = Math.max(maxID, nodes[i].id);
    }
    return maxID;
}

function createCompanyToStructureDict(nodes, f){
    var dict = {};
    for (var key in nodes){
        if (!nodes.hasOwnProperty(key)){
            continue;
        }

        dict[key] = f();
    }
    return dict;
}

function createCompanyToDictDict(nodes){
    return createCompanyToStructureDict(nodes, function() {return {}});
}

function createCompanyToArrayDict(nodes){
    return createCompanyToStructureDict(nodes, function() {return []});
}

function hasCompany(node){
    return node.properties.Company == null;
}

function appendCompanyInformationToData(data){
    var companyNodes = createCompanyNodesDict(data)
    var redirectEdges = redirectCompanyEdges(companyNodes, data);
    var mergedRedirectData = mergeRedirectData(data, companyNodes, redirectEdges);

    return mergedRedirectData;
}


function redirectCompanyEdges(companyNodes, data){

    // assuming company nodes id is greater than anything in data
    // perhaps an invalid assumption

    var maxID = getMaxID(companyNodes) + 1;

    var nodes = data.results[0].data[0].graph.nodes;
    var edges = data.results[0].data[0].graph.relationships;

    var companyToCreateEdges = createCompanyToArrayDict(companyNodes);
    var companyToNodeIdDict = createCompanyToDictDict(companyNodes);

    var returnEdges = [];

    for (var i = 0; i < edges.length; i++){
        var edge = edges[i];
        var companyObject = edge.properties.Company;

        if (companyObject == null){
            returnEdges.push(edge);
            continue;
        }

        var companyName = companyObject.name;
        var companyNodeObject = companyNodes[companyName];
        var edgeCopy = Utility.copy(edge);

        edgeCopy.endNode = companyNodeObject.id;

        delete edgeCopy.id

        returnEdges.push(edgeCopy);

        if (!(edge.endNode in companyToNodeIdDict[companyName])){

            companyToNodeIdDict[companyName][edge.endNode] = true;
            var edgeCopyTwo = Utility.copy(edge);
            edgeCopyTwo.startNode = companyNodeObject.id;
            delete edgeCopyTwo.id
            returnEdges.push(edgeCopyTwo);

        }
    }

    for(var i = 0; i < returnEdges.length; i++){
        var edge = returnEdges[i];
        if (!('id' in edge)){
            edge.id = maxID++;

        }
    }

    return returnEdges;
}

function mergeRedirectData(data, companyNodes, companyEdges){

    var dataCopy = Utility.copy(data);
    var nodes = dataCopy.results[0].data[0].graph.nodes;
    var edges = dataCopy.results[0].data[0].graph.relationships;
    var actualCompanyNodes = companyDictToNodes(companyNodes);

    dataCopy

    dataCopy.results[0].data[0].graph.nodes = nodes.concat(actualCompanyNodes);
    dataCopy.results[0].data[0].graph.relationships = companyEdges;

    return dataCopy;
}

function companyDictToNodes(companyNodes){
    var companyNodesAlone = Object.values(companyNodes);
    var companyNodesPrime = companyNodesAlone.map(
        function(x){
            return {
                id: x.id,
                labels: ["Company"],
                properties: {location: x.location, name: x.name},
            }
        });

    return companyNodesPrime;
}

function createNodes(obj){
    const attributes = ['name', 'label', 'Country', 'Branch', 'CreationDate', 'CusOrAccType', 'Company']
    return obj.nodes.map(function(x, idx){
        return {
            id: x.id,
            labels: [x.type],
            properties: FakeData.createProperties(x, attributes)
        }
    })
}

function createRelationships(obj){
    //const attributes = ["Amount", "Geolocation", "TransNo", "Comment", "TransactionDate", "RuleViolated", "RuleCode"]
    const attributes = ["Amount", "Geolocation", "TransactionDate", "RuleCode", "RuleViolated"]
    return obj.edges.map(function(x, idx){
        return {
            id: idx,
            type: x.type,
            properties: FakeData.createProperties(x, attributes),
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
                nodes: nodes,
                relationships: relationships
            }}]
    }]

    return {results: data, errors: []}

}

//var _data_prime = FakeData.addCompanyToObject(_data);

var data = convertToNeo4j(other_data);
//debugger;
//_data_prime = null;

//var data = appendCompanyInformationToData(data);

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
        'Company': 'building',
        'Customer': 'user'
    },
    minCollision: 35,
    neo4jData: data,
    nodeRadius: 20,
};
