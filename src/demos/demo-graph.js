import * as d3 from 'd3';
import Neo4jd3 from '../graph/neo4jd3';
import data from './data';

// eslint-disable-next-line no-unused-vars
const neo4jd3 = new Neo4jd3('#neo4jd3', {
  highlight: [
    {
      class: 'Project',
      property: 'name',
      value: 'neo4jd3',
    }, {
      class: 'User',
      property: 'userId',
      value: 'eisman',
    },
  ],
  minCollision: 60,
  neo4jData: data,
  infoPanel: true,
  // neo4jDataUrl: 'json/neo4jData.json',
  // nodeRadius: 25,
  onLabelNode: (node) => node.properties?.name || (node.labels ? node.labels[0] : ''),
  onNodeClick: (nodeSvg, node, event) => {
    console.info('node', nodeSvg, 'data', node, 'event', event);

    if (d3.select(nodeSvg).attr('class').indexOf('selected') > 0) {
      d3.select(nodeSvg)
        .attr('class', 'node');
    } else {
      d3.select(nodeSvg)
        .attr('class', 'node selected');
    }
  },
  onNodeDoubleClick(nodeSvg, node) {
    console.info('clic on node: [%s]', node.id);
  },
  onRelationshipDoubleClick(relationship) {
    console.info(`double click on relationship: ${JSON.stringify(relationship)}`);
  },
  zoomFit: false,
});
