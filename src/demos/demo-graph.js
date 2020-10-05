import Neo4jd3 from '../graph/neo4jd3';
import data from './data';

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
    const maxNodes = 5;

    switch (node.id) {
      case '25':
        // Google
        window.open(node.properties.url, '_blank');
        break;
      default:
        neo4jd3.updateWithD3Data(neo4jd3.randomD3Data(node, maxNodes));
        break;
    }
  },
  onRelationshipDoubleClick(relationship) {
    console.info(`double click on relationship: ${JSON.stringify(relationship)}`);
  },
  zoomFit: false,
});
