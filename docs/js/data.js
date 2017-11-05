const data = {
  "nodes": [{
    "id": 0,
    "name": "Finnace USA ",
    "label": "Finnace USA",
    "type": "Customer",
    "Country": "New Zealand",
    "Branch": "Head Office",
    "CreationDate": "2017-10-10",
    "CusOrAccType": "CUSTOMER"
  }, {
    "id": 1,
    "name": "Jon Ven Den",
    "label": "8983996",
    "type": "Account",
    "Branch": "Head Office",
    "CreationDate": "2017-10-10",
    "CusOrAccType": "Savings"
  }, {
    "id": 2,
    "name": "Ian Lang",
    "label": "01828675",
    "type": "OtherBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 3,
    "name": "Ian Lang",
    "label": "11828675",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 4,
    "name": "John Leech",
    "label": "12460819",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 5,
    "name": "Omar bin Hanzala",
    "label": "12896067",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 6,
    "name": "Max Aitken",
    "label": "13150046",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 7,
    "name": "George Lansbury",
    "label": "13795215",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 8,
    "name": "Jack Lawson",
    "label": "1399386800",
    "type": "OtherBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 9,
    "name": "Hastings Lees-Smith",
    "label": "14352860",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 10,
    "name": "Chris Leslie",
    "label": "15154946",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 11,
    "name": "Edward Leigh",
    "label": "1560772",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 12,
    "name": "Mark Lazarowicz",
    "label": "17381660",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 13,
    "name": "Irving Albery",
    "label": "17521589",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 14,
    "name": "Mark Lancaster",
    "label": "18182343",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 15,
    "name": "Robert Laxton",
    "label": "18436572",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 16,
    "name": "Jennie Lee",
    "label": "19165510",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 17,
    "name": "devid  Watson",
    "label": "19294687",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 18,
    "name": "David Laws",
    "label": "2262305",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 19,
    "name": "Nick Ainger",
    "label": "254762",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 20,
    "name": "Peter Law",
    "label": "4162351",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 21,
    "name": "Jackie Lawrence",
    "label": "621062",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 22,
    "name": "Christopher Addison",
    "label": "6270288",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 23,
    "name": "Mohammad Shoeb Aktar",
    "label": "6338205",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 24,
    "name": "Nigel Lawson",
    "label": "6909150",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 25,
    "name": "Jonathan Aitken",
    "label": "8225439",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 26,
    "name": "Richard Acland",
    "label": "8335808",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 27,
    "name": "Andrew Lansley",
    "label": "930999",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }, {
    "id": 28,
    "name": "Norman Lamb",
    "label": "9440137",
    "type": "OwnBankAccount",
    "Bank": "ABC Bank",
    "Branch": "010"
  }],
  "edges": [{
    "source": 0,
    "target": 1,
    "name": "0-1",
    "type": "Account"
  }, {
    "source": 1,
    "target": 1,
    "name": "1-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000012",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-23",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 2,
    "target": 1,
    "name": "2-1",
    "type": "CR",
    "Amount": "88800.00",
    "Geolocation": "USA",
    "TransNo": "000000007",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-19",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 3,
    "target": 1,
    "name": "3-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000006",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-10",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 4,
    "target": 1,
    "name": "4-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000018",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-17",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 5,
    "target": 1,
    "name": "5-1",
    "type": "CR",
    "Amount": "1200.00",
    "Geolocation": "USA",
    "TransNo": "000000049",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-16",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 6,
    "target": 1,
    "name": "6-1",
    "type": "CR",
    "Amount": "600.00",
    "Geolocation": "USA",
    "TransNo": "000000034",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-08",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 7,
    "target": 1,
    "name": "7-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000007",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-28",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 8,
    "target": 1,
    "name": "8-1",
    "type": "CR",
    "Amount": "1500.00",
    "Geolocation": "USA",
    "TransNo": "000000015",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-15",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 9,
    "target": 1,
    "name": "9-1",
    "type": "CR",
    "Amount": "90900.00",
    "Geolocation": "USA",
    "TransNo": "000000020",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-11",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 9,
    "target": 1,
    "name": "9-1",
    "type": "CR",
    "Amount": "65100.00",
    "Geolocation": "USA",
    "TransNo": "000000019",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-10",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 10,
    "target": 1,
    "name": "10-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000021",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-15",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 11,
    "target": 1,
    "name": "11-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000020",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-12",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 12,
    "target": 1,
    "name": "12-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000016",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-19",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 13,
    "target": 1,
    "name": "13-1",
    "type": "CR",
    "Amount": "88100.00",
    "Geolocation": "USA",
    "TransNo": "000000034",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-05-22",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 14,
    "target": 1,
    "name": "14-1",
    "type": "CR",
    "Amount": "66200.00",
    "Geolocation": "USA",
    "TransNo": "000000004",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-11",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 14,
    "target": 1,
    "name": "14-1",
    "type": "CR",
    "Amount": "1700.00",
    "Geolocation": "USA",
    "TransNo": "000000003",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-23",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 15,
    "target": 1,
    "name": "15-1",
    "type": "CR",
    "Amount": "98900.00",
    "Geolocation": "USA",
    "TransNo": "000000015",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-28",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 15,
    "target": 1,
    "name": "15-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000017",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-02",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 16,
    "target": 1,
    "name": "16-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000017",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-11",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 17,
    "target": 1,
    "name": "17-1",
    "type": "CR",
    "Amount": "800.00",
    "Geolocation": "USA",
    "TransNo": "000000004",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-05-20",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 17,
    "target": 1,
    "name": "17-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000005",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-24",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 18,
    "target": 1,
    "name": "18-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000011",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-13",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 19,
    "target": 1,
    "name": "19-1",
    "type": "CR",
    "Amount": "800.00",
    "Geolocation": "USA",
    "TransNo": "000000027",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-16",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 20,
    "target": 1,
    "name": "20-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000009",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-09",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 21,
    "target": 1,
    "name": "21-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000010",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-21",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 22,
    "target": 1,
    "name": "22-1",
    "type": "CR",
    "Amount": "900.00",
    "Geolocation": "USA",
    "TransNo": "000000028",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-05-05",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 23,
    "target": 1,
    "name": "23-1",
    "type": "CR",
    "Amount": "2000.00",
    "Geolocation": "USA",
    "TransNo": "000000035",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-04",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 24,
    "target": 1,
    "name": "24-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000016",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-06-25",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 25,
    "target": 1,
    "name": "25-1",
    "type": "CR",
    "Amount": "300.00",
    "Geolocation": "USA",
    "TransNo": "000000031",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-31",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 26,
    "target": 1,
    "name": "26-1",
    "type": "CR",
    "Amount": "89200.00",
    "Geolocation": "USA",
    "TransNo": "000000023",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-21",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 26,
    "target": 1,
    "name": "26-1",
    "type": "CR",
    "Amount": "1100.00",
    "Geolocation": "USA",
    "TransNo": "000000025",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-04-21",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 27,
    "target": 1,
    "name": "27-1",
    "type": "CR",
    "Amount": "99800.00",
    "Geolocation": "USA",
    "TransNo": "000000008",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-19",
    "RuleViolated": "No",
    "RuleCode": ""
  }, {
    "source": 28,
    "target": 1,
    "name": "28-1",
    "type": "CR",
    "Amount": "99000.00",
    "Geolocation": "USA",
    "TransNo": "000000001",
    "Comment": "Business Purpose",
    "TransactionDate": "2017-03-20",
    "RuleViolated": "No",
    "RuleCode": ""
  }]
}

function addEdgeIds(dataInit){
    const dataCopy = $.extend({}, dataInit)
    const edges = dataCopy['edges']
    const nodes = dataCopy['nodes']

    edges.forEach(function(obj, index){
        obj['id'] = `e${index}`
        obj['source'] = `n${obj['source']}`
        obj['target'] = `n${obj['target']}`
        obj['size'] = 1
        obj['color'] = '#ccc'
    })

    nodes.forEach(function(obj, index){
        obj.x = Math.random(),
        obj.y = Math.random(),
        obj['label'] = 'Hello'
        obj['size'] = 1
        obj['color'] = '#ccc'
        obj['id'] = `n${index}`
    })

    return dataCopy;
}

function convertToNeo4j(obj){

    const attributes = ['type', 'Country', 'Branch', 'CreationDate', 'CusOrAccType']
    const nodes = obj.nodes.map(function(x, idx){
        const properties = {};
        attributes.forEach(function(attribute){
            if (typeof(x[attribute]) !== 'undefined'){
                properties[attribute] = x[attribute];
            }
        })
        return {
            id: x.id,
            labels: [x.label],
            properties: properties
        }
    })

    const relationships = obj.edges.map(function(x, idx){
        return {
            id: idx,
            type: x.type,
            startNode: x.source,
            endNode: x.target,
        }
    });

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

var dprime = convertToNeo4j(data);
