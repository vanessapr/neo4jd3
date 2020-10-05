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
  // neo4jDataUrl: 'json/neo4jData.json',
  nodeRadius: 25,
  onNodeDoubleClick(node) {
    switch (node.id) {
      case '25':
        // Google
        window.open(node.properties.url, '_blank');
        break;
      default:
        console.info('clic on node: [%s]', node.id);
        break;
    }
  },
  onRelationshipDoubleClick(relationship) {
    console.info(`double click on relationship: ${JSON.stringify(relationship)}`);
  },
  zoomFit: false,
});
