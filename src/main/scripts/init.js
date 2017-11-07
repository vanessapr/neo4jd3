function init() {
    var neo4jd3 = new Neo4jd3('#neo4jd3', {
        highlight: [
            {
                class: 'Project',
                property: 'name',
                value: 'neo4jd3'
            }, {
                class: 'User',
                property: 'userId',
                value: 'eisman'
            }
        ],
        icons: {
            //                        'Address': 'home',
            'Api': 'gear',
            //                        'BirthDate': 'birthday-cake',
            'Cookie': 'paw',
            //                        'CreditCard': 'credit-card',
            //                        'Device': 'laptop',
            'Email': 'at',
            'Git': 'git',
            'Github': 'github',
            'OwnBankAccount': 'google',
            //                        'icons': 'font-awesome',
            'zoomFit': 'arrows-alt',
            'zoomIn': 'search-plus',
            'zoomOut': 'search-minus'
        },
        images: {
            'OwnBankAccount': '007-money-1.svg',
            'Bank1': '004-money-3.svg',
            'Cookie': 'img/twemoji/1f36a.svg',
            'CreditCard': 'img/twemoji/1f4b3.svg',
            'Device': 'img/twemoji/1f4bb.svg',
            'Email': 'img/twemoji/2709.svg',
            'Git': 'img/twemoji/1f5c3.svg',
            'Github': 'img/twemoji/1f5c4.svg',
            'icons': 'img/twemoji/1f38f.svg',
            'Ip': 'img/twemoji/1f4cd.svg',
            'Issues': 'img/twemoji/1f4a9.svg',
            'Language': 'img/twemoji/1f1f1-1f1f7.svg',
            'Options': 'img/twemoji/2699.svg',
            'Password': 'img/twemoji/1f511.svg',
            //                        'Phone': 'img/twemoji/1f4de.svg',
            'Project': 'img/twemoji/2198.svg',
            'Project|name|neo4jd3': 'img/twemoji/2196.svg',
            //                        'SecurityChallengeAnswer': 'img/twemoji/1f4ac.svg',
            'User': 'img/twemoji/1f600.svg'
            //                        'zoomFit': 'img/twemoji/2194.svg',
            //                        'zoomIn': 'img/twemoji/1f50d.svg',
            //                        'zoomOut': 'img/twemoji/1f50e.svg'
        },
        minCollision: 45,
        neo4jData: dprime,
        nodeRadius: 20,
        onNodeDoubleClick: function(node) {
            return;
            switch(node.id) {
                case '25':
                    // Google
                    window.open(node.properties.url, '_blank');
                    break;
                default:
                    var maxNodes = 5,
                        data = neo4jd3.randomD3Data(node, maxNodes);
                    neo4jd3.updateWithD3Data(data);
                    break;
            }
        },
        onRelationshipDoubleClick: function(relationship) {
            console.log('double click on relationship: ' + JSON.stringify(relationship));
        },
    });
}

window.onload = init;
