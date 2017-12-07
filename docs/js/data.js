function createProperties(x, attributes){
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

function createNodes(obj){
    const attributes = ['name', 'label', 'Country', 'Branch', 'CreationDate', 'CusOrAccType']
    return obj.nodes.map(function(x, idx){
        const properties = {};
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

const data = convertToNeo4j(_data);
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

