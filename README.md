# neo4jd3.js

This is a fork of the following package: [https://github.com/eisman/neo4jd3](https://github.com/eisman/neo4jd3).

[Neo4j](https://github.com/neo4j) graph visualization using [D3.js](https://github.com/d3/d3).

![neo3jd3.js](https://eisman.github.io/neo4jd3/img/neo4jd3.jpg?v=0.0.5)

## Features

- Compaptible with the [Neo4j data format](#neo4j-data-format) and the [D3.js data format](#d3js-data-format).
- Force simulation.
- Info panel that shows nodes and relationships information on hover.
- Double click callbacks.
- Custom node colors by node type.
- Sticky nodes (drag to stick, single click to unstick).
- Dynamic graph update (e.g. double click a node to expand it).
- Highlight nodes on init.
- Relationship auto-orientation.
- Zoom, pan, auto fit.
- Compatible with D3.js v4.

## Running

First of all, make sure you have ruby and sass gem installed. Then, clone the repository, install all dependencies, build and serve the project.

```bash
npm add @vanessapr85/neo4jd3
```

## Documentation

```javascript
var neo4jd3 = new Neo4jd3(".selector", options);
```

### Options

| Parameter                     | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **highlight**                 | _array_    | Highlight several nodes of the graph.<br>Example:<br>`[`<br>&nbsp;&nbsp;&nbsp;&nbsp;`{`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`class: 'Project',`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`property: 'name',`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`value: 'neo4jd3'`<br>&nbsp;&nbsp;&nbsp;&nbsp;`}`<br>`]`                                                                                                                                                                                            |
| **infoPanel**                 | _boolean_  | Show the information panel: `true`, `false`. Default: `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **minCollision**              | _int_      | Minimum distance between nodes. Default: 2 \* _nodeRadius_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **neo4jData**                 | _object_   | Graph data in [Neo4j data format](#neo4j-data-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **neo4jDataUrl**              | _string_   | URL of the endpoint that serves the graph data in [Neo4j data format](#neo4j-data-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **nodeRadius**                | _int_      | Radius of nodes. Default: 25.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **onNodeClick**               | _function_ | Callback function to be executed when the user clicks a node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **onNodeDoubleClick**         | _function_ | Callback function to be executed when the user double clicks a node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **onNodeDragEnd**             | _function_ | Callback function to be executed when the user finishes dragging a node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **onNodeDragStart**           | _function_ | Callback function to be executed when the user starts dragging a node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **onNodeMouseEnter**          | _function_ | Callback function to be executed when the mouse enters a node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **onNodeMouseLeave**          | _function_ | Callback function to be executed when the mouse leaves a node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **onRelationshipDoubleClick** | _function_ | Callback function to be executed when the user double clicks a relationship.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **zoomFit**                   | _boolean_  | Adjust the graph to the container once it has been loaded: `true`, `false`. Default: `false`.                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### JavaScript API

| Function                                              | Description                                                                                                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **appendRandomDataToNode**(_d_, _maxNodesToGenerate_) | Generates between 1 and _maxNodesToGenerate_ random nodes connected to node _d_ and updates the graph data.                                                     |
| **neo4jDataToD3Data**(_data_)                         | Converts data from [Neo4j data format](#neo4j-data-format) to [D3.js data format](#d3js-data-format).                                                           |
| **randomD3Data**(_d_, _maxNodesToGenerate_)           | Generates between 1 and _maxNodesToGenerate_ random nodes connected to node _d_.                                                                                |
| **size**()                                            | Returns the number of nodes and relationships.<br>Example:<br>`{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`nodes: 25,`<br>&nbsp;&nbsp;&nbsp;&nbsp;`relationships: 50`<br>`}` |
| **updateWithD3Data**(_d3Data_)                        | Updates the graph data using the [D3.js data format](#d3js-data-format).                                                                                        |
| **updateWithNeo4jData**(_neo4jData_)                  | Updates the graph data using the [Neo4j data format](#neo4j-data-format).                                                                                       |
| **version**()                                         | Returns the version of neo4jd3.js.<br>Example: `'0.0.1'`                                                                                                        |

### Documentation

#### D3.js data format

```
{
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
            },
            "source": "1",
            "target": "8",
            "linknum": 1
        }
    ]
}
```

#### Neo4j data format

```
{
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
```

### Example

Live example @ [https://eisman.github.io/neo4jd3/](https://eisman.github.io/neo4jd3/)

```javascript
var neo4jd3 = new Neo4jd3("#neo4jd3", {
  highlight: [
    {
      class: "Project",
      property: "name",
      value: "neo4jd3"
    },
    {
      class: "User",
      property: "userId",
      value: "eisman"
    }
  ],
  minCollision: 60,
  neo4jDataUrl: "json/neo4jData.json",
  nodeRadius: 25,
  onNodeDoubleClick: function(node) {
    switch (node.id) {
      case "25":
        // Google
        window.open(node.properties.url, "_blank");
        break;
      default:
        console.info('click...');
        break;
    }
  },
  zoomFit: true
});
```

## What's coming?

- Toolbar.
- More than one relationship between two nodes.
- Markers.
- Performance optimization.
- Testing.

## Copyright and license

Code and documentation copyright 2016 the author. Code released under the [MIT license](LICENSE). Docs released under [Creative Commons](docs/LICENSE).
