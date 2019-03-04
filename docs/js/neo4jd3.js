(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Neo4jd3 = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
'use strict';

var neo4jd3 = _dereq_('./scripts/neo4jd3');

module.exports = neo4jd3;

},{"./scripts/neo4jd3":2}],2:[function(_dereq_,module,exports){
/* global d3, document */
/* jshint latedef:nofunc */
'use strict';

function Neo4jD3(_selector, _options) {
  var container, graph, info, node, nodes, relationship, relationshipOutline, relationshipOverlay, relationshipText, relationships, selector, simulation, svg, svgNodes, svgRelationships, svgScale, svgTranslate,
    classes2colors = {},
    justLoaded = false,
    numClasses = 0,
    options = {
      arrowSize: 2,
      colors: colors(),
      highlight: undefined,
      iconMap: fontAwesomeIcons(),
      icons: undefined,
      imageMap: {},
      images: undefined,
      infoPanel: true,
      minCollision: undefined,
      neo4jData: undefined,
      neo4jDataUrl: undefined,
      nodeOutlineFillColor: undefined,
      nodeRadius: 75,
      relationshipColor: '#a5abb6',
      zoomFit: false,
      labelColorMapping: createLabelColorMapping(),
      labelProperty: 'name',
      imageSize: {
        height: '30px',
        width: '30px',
        x: '-15px',
        y: '-16px',
      }
    },
    VERSION = '0.0.1';

  function createLabelColorMapping(){
    var labelColorMapping = {
      "customer": "#68bdf6",
      "account": "#ffd86e",
      "ownbankaccount": "#6dce9e",
      "otherbankaccount": "#ff867f",
      "ruleviolation": "#ffa82d"
    };

    return labelColorMapping;
  }

  function appendGraph(container) {
    svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('class', 'neo4jd3-graph')
      .call(d3.zoom().on('zoom', function() {
        var scale = d3.event.transform.k,
          translate = [d3.event.transform.x, d3.event.transform.y];

        if (svgTranslate) {
          translate[0] += svgTranslate[0];
          translate[1] += svgTranslate[1];
        }

        if (svgScale) {
          scale *= svgScale;
        }

        svg.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
      }))
      .on('dblclick.zoom', null)
      .append('g')
      .attr('width', '100%')
      .attr('height', '100%');

    svgRelationships = svg.append('g')
      .attr('class', 'relationships');

    svgNodes = svg.append('g')
      .attr('class', 'nodes');
  }

  function appendImageToNode(node) {
    return node.append('image')
      .attr('height', function(d) {
        return icon(d) ? '24px': options.imageSize.height;
      })
      .attr('x', function(d) {
        return icon(d) ? '5px': options.imageSize.x;
      })
      .attr('xlink:href', function(d) {
        return image(d);
      })
      .attr('y', function(d) {
        return icon(d) ? '5px': options.imageSize.y;
      })
      .attr('width', function(d) {
        return icon(d) ? '24px': options.imageSize.width;
      });
  }

  function appendInfoPanel(container) {
    return container.append('div')
      .attr('class', 'neo4jd3-info');
  }

  function appendInfoElement(cls, isNode, property, value) {
    var elem = info.append('a');

    elem.attr('href', '#')
      .attr('class', cls)
      .html('<strong>' + property + '</strong>' + (value ? (': ' + value) : ''));
    if (!value) {
      elem.style('background-color', function(d) {
          var theProperty = property.toLowerCase();

          if (theProperty in options.labelColorMapping) {
            return options.labelColorMapping[theProperty];
          }

        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : (isNode ? class2color(property) : defaultColor());
      })
        .style('border-color', function(d) {
          var theProperty = property.toLowerCase();

          if (theProperty in options.labelColorMapping){
            return options.labelColorMapping[theProperty];
          }
          return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : (isNode ? class2darkenColor(property) : defaultDarkenColor());
        })
        .style('color', function(d) {
          return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : '#fff';
        });
    }
  }

  function appendInfoElementClass(cls, node) {
    appendInfoElement(cls, true, node);
  }

  function appendInfoElementProperty(cls, property, value) {
    appendInfoElement(cls, false, property, value);
  }

  function appendInfoElementRelationship(cls, relationship) {
    appendInfoElement(cls, false, relationship);
  }

  function appendNode() {
    return node.enter()
      .append('g')
      .attr('class', function(d) {
        var highlight, i,
          classes = 'node',
          label = d.labels[0];

        if (icon(d)) {
          classes += ' node-icon';
        }

        if (image(d)) {
          classes += ' node-image';
        }

        if (options.highlight) {
          for (i = 0; i < options.highlight.length; i++) {
            highlight = options.highlight[i];

            if (d.labels[0] === highlight.class && d.properties[highlight.property] === highlight.value) {
              classes += ' node-highlighted';
              break;
            }
          }
        }

        return classes;
      })
      .on('click', function(d) {
        d.fx = d.fy = null;

        if (typeof options.onNodeClick === 'function') {
          options.onNodeClick(d);
        }
      })
      .on('dblclick', function(d) {
        stickNode(d);

        if (typeof options.onNodeDoubleClick === 'function') {
          options.onNodeDoubleClick(d);
        }
      })
      .on('mouseenter', function(d) {
        if (info) {
          updateInfo(d);
        }

        if (typeof options.onNodeMouseEnter === 'function') {
          options.onNodeMouseEnter(d);
        }
      })
      .on('mouseleave', function(d) {
        if (info) {
          clearInfo(d);
        }

        if (typeof options.onNodeMouseLeave === 'function') {
          options.onNodeMouseLeave(d);
        }
      })

    .call(d3.drag()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded));
  }

  function truncateText(str, length) {
    str = str || '';

    var ending = '...';

    if (length == null) {
      length = 100;
    }

    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    } else {
      return str;
    }
  }

  function calculateXLocation(name) {
    return name.length;
  }

  function appendNodeNameText(node) {
    // going to need to link this to node width/ hieght at some point
    var g = node.append('g');

    g.append("rect")
      .attr("width", '80px')
      .attr("height", '20px')
      .style("fill", function(d){
        return "#bdc3c7";
      })
      .attr('y', 24)
      .attr('x', -40)
      .attr('rx', 10)
      .attr('ry', 10);

    g.append('text')
      .text(function(node) {
        var x = node.labels;
        return truncateText(node.properties[options.labelProperty], 13);
      })
      .attr('font-size', 10)
      .attr('x', function(node){
        return 0;
        //return calculateXLocation(node.properties.name);
      })
      .attr('y', 33)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .on('click', function(d) {
        if (typeof options.onNodeTextClick === 'function') {
          options.onNodeTextClick(d);
        }
      });
  }

  function appendNodeInfo(node) {
    if (!options.onNodeInfoClick || !options.displayInfoIcon) {
      return;
    }

    var g = node.append('g')
      .attr('class', 'info')
      .attr('transform', 'translate(9, -28)')
      .attr("visibility", function(d) {
        return options.displayInfoIcon(d) ? "" : "hidden";
      })
      .on('click', function(d) {
        if (typeof options.onNodeInfoClick === 'function') {
          options.onNodeInfoClick(d);
        }
      });

    g.append("rect")
      .attr("width", '20px')
      .attr("height", '20px')
      .style("fill", "#444")
      .style("stroke", "#54b3ff")
      .attr('rx', 10)
      .attr('ry', 10);
    
    g.append('text')
      .text('i')
      .attr('fill', 'white')
      .attr('font-size', 11)
      .attr('x', '9')
      .attr('y', '14');
  }

  function appendNodeToGraph() {
    var n = appendNode();

    appendRingToNode(n);
    appendOutlineToNode(n);

    if (options.icons) {
      appendTextToNode(n);
    }

    if (options.images) {
      appendImageToNode(n);
    }

    appendNodeNameText(n);
    appendNodeInfo(n);

    return n;
  }

  function appendOutlineToNode(node) {
    return node.append('circle')
      .attr('class', 'outline')
      .attr('r', options.nodeRadius)
      .style('fill', function(d) {
        var label = d.labels;

        if (label.length === 0){
          return 'gray';
        }

        var the_label = label[0].toLowerCase();
        if (the_label in options.labelColorMapping){
          return options.labelColorMapping[the_label];
        }

        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
      })
      .style('stroke', function(d) {
        var label = d.labels;

        if (label.length === 0){
          return 'gray';
        }

        var the_label = label[0].toLowerCase();
        if (the_label in options.labelColorMapping){
          return options.labelColorMapping[the_label];
        }
        return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : class2darkenColor(d.labels[0]);
      })
      .append('title').text(function(d) {
        return toString(d);
      });
  }

  function appendRingToNode(node) {
    return node.append('circle')
      .attr('class', 'ring')
      .attr('r', options.nodeRadius * 1.16)
      .append('title').text(function(d) {
        return toString(d);
      });
  }

  function appendTextToNode(node) {
    return node.append('text')
      .attr('class', function(d) {
        return 'text' + (icon(d) ? ' icon' : '');
      })
      .attr('fill', '#ffffff')
      .attr('font-size', function(d) {
        return icon(d) ? (options.nodeRadius + 'px') : '10px';
      })
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('y', function(d) {
        return icon(d) ? (parseInt(Math.round(options.nodeRadius * 0.32)) + 'px') : '4px';
      })
      .html(function(d) {
        var _icon = icon(d);
        return _icon ? '&#x' + _icon : d.id;
      });
  }

  function appendRelationship() {
    return relationship.enter()
      .append('g')
      .attr('class','relationship')
      .on('dblclick', function(d) {
        if (typeof options.onRelationshipDoubleClick === 'function') {
          options.onRelationshipDoubleClick(d);
        }
      })
      .on('mouseenter', function(d) {
        if (info) {
          updateInfo(d);
        }
      });
  }

  function appendOutlineToRelationship(r) {
    return r.append('path')
      .attr('class', 'outline')
      .attr('fill', '#a5abb6')
      .attr('stroke-width', function(d,i){
        return 1;
      })
      .attr('stroke', function(d)
        {
          return '#a5abb6';
        });
  }

  function appendOverlayToRelationship(r) {
    return r.append('path')
      .attr('class', 'overlay');
  }

  function appendTextToRelationship(r) {
    return r.append('text')
      .attr('class', 'text')
      .attr('fill', '#000000')
      .attr('font-size', '8px')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d.type;
      });
  }

  function appendRelationshipToGraph() {
    var relationship = appendRelationship();

    var text = appendTextToRelationship(relationship);

    var outline = appendOutlineToRelationship(relationship);
    var overlay = appendOverlayToRelationship(relationship);

    return {
      outline: outline,
      overlay: overlay,
      relationship: relationship,
      text: text
    };
  }

  function class2color(cls) {
    var color = classes2colors[cls];

    if (!color) {
      //            color = options.colors[Math.min(numClasses, options.colors.length - 1)];
      color = options.colors[numClasses % options.colors.length];
      classes2colors[cls] = color;
      numClasses++;
    }

    return color;
  }

  function class2darkenColor(cls) {
    return d3.rgb(class2color(cls)).darker(1);
  }

  function clearInfo() {
    info.html('');
  }

  function color() {
    return options.colors[options.colors.length * Math.random() << 0];
  }

  function colors() {
    // d3.schemeCategory10,
    // d3.schemeCategory20,
    return [
      '#68bdf6', // light blue
      '#6dce9e', // green #1
      '#faafc2', // light pink
      '#f2baf6', // purple
      '#ff928c', // light red
      '#fcea7e', // light yellow
      '#ffc766', // light orange
      '#405f9e', // navy blue
      '#a5abb6', // dark gray
      '#78cecb', // green #2,
      '#b88cbb', // dark purple
      '#ced2d9', // light gray
      '#e84646', // dark red
      '#fa5f86', // dark pink
      '#ffab1a', // dark orange
      '#fcda19', // dark yellow
      '#797b80', // black
      '#c9d96f', // pistacchio
      '#47991f', // green #3
      '#70edee', // turquoise
      '#ff75ea'  // pink
    ];
  }

  function contains(array, id) {
    var filter = array.filter(function(elem) {
      return elem.id === id;
    });

    return filter.length > 0;
  }

  function defaultColor() {
    return options.relationshipColor;
  }

  function defaultDarkenColor() {
    return d3.rgb(options.colors[options.colors.length - 1]).darker(1);
  }

  function dragEnded(d) {
    if (!d3.event.active) {
      simulation.alphaTarget(0);
    }

    if (typeof options.onNodeDragEnd === 'function') {
      options.onNodeDragEnd(d);
    }
  }

  function dragged(d) {
    stickNode(d);
  }

  function dragStarted(d) {
    if (!d3.event.active) {
      simulation.alphaTarget(0.3).restart();
    }

    d.fx = d.x;
    d.fy = d.y;

    if (typeof options.onNodeDragStart === 'function') {
      options.onNodeDragStart(d);
    }
  }

  function extend(obj1, obj2) {
    var obj = {};

    merge(obj, obj1);
    merge(obj, obj2);

    return obj;
  }

  function fontAwesomeIcons() {
    return {'glass':'f000','music':'f001','search':'f002','envelope-o':'f003','heart':'f004','star':'f005','star-o':'f006','user':'f007','film':'f008','th-large':'f009','th':'f00a','th-list':'f00b','check':'f00c','remove,close,times':'f00d','search-plus':'f00e','search-minus':'f010','power-off':'f011','signal':'f012','gear,cog':'f013','trash-o':'f014','home':'f015','file-o':'f016','clock-o':'f017','road':'f018','download':'f019','arrow-circle-o-down':'f01a','arrow-circle-o-up':'f01b','inbox':'f01c','play-circle-o':'f01d','rotate-right,repeat':'f01e','refresh':'f021','list-alt':'f022','lock':'f023','flag':'f024','headphones':'f025','volume-off':'f026','volume-down':'f027','volume-up':'f028','qrcode':'f029','barcode':'f02a','tag':'f02b','tags':'f02c','book':'f02d','bookmark':'f02e','print':'f02f','camera':'f030','font':'f031','bold':'f032','italic':'f033','text-height':'f034','text-width':'f035','align-left':'f036','align-center':'f037','align-right':'f038','align-justify':'f039','list':'f03a','dedent,outdent':'f03b','indent':'f03c','video-camera':'f03d','photo,image,picture-o':'f03e','pencil':'f040','map-marker':'f041','adjust':'f042','tint':'f043','edit,pencil-square-o':'f044','share-square-o':'f045','check-square-o':'f046','arrows':'f047','step-backward':'f048','fast-backward':'f049','backward':'f04a','play':'f04b','pause':'f04c','stop':'f04d','forward':'f04e','fast-forward':'f050','step-forward':'f051','eject':'f052','chevron-left':'f053','chevron-right':'f054','plus-circle':'f055','minus-circle':'f056','times-circle':'f057','check-circle':'f058','question-circle':'f059','info-circle':'f05a','crosshairs':'f05b','times-circle-o':'f05c','check-circle-o':'f05d','ban':'f05e','arrow-left':'f060','arrow-right':'f061','arrow-up':'f062','arrow-down':'f063','mail-forward,share':'f064','expand':'f065','compress':'f066','plus':'f067','minus':'f068','asterisk':'f069','exclamation-circle':'f06a','gift':'f06b','leaf':'f06c','fire':'f06d','eye':'f06e','eye-slash':'f070','warning,exclamation-triangle':'f071','plane':'f072','calendar':'f073','random':'f074','comment':'f075','magnet':'f076','chevron-up':'f077','chevron-down':'f078','retweet':'f079','shopping-cart':'f07a','folder':'f07b','folder-open':'f07c','arrows-v':'f07d','arrows-h':'f07e','bar-chart-o,bar-chart':'f080','twitter-square':'f081','facebook-square':'f082','camera-retro':'f083','key':'f084','gears,cogs':'f085','comments':'f086','thumbs-o-up':'f087','thumbs-o-down':'f088','star-half':'f089','heart-o':'f08a','sign-out':'f08b','linkedin-square':'f08c','thumb-tack':'f08d','external-link':'f08e','sign-in':'f090','trophy':'f091','github-square':'f092','upload':'f093','lemon-o':'f094','phone':'f095','square-o':'f096','bookmark-o':'f097','phone-square':'f098','twitter':'f099','facebook-f,facebook':'f09a','github':'f09b','unlock':'f09c','credit-card':'f09d','feed,rss':'f09e','hdd-o':'f0a0','bullhorn':'f0a1','bell':'f0f3','certificate':'f0a3','hand-o-right':'f0a4','hand-o-left':'f0a5','hand-o-up':'f0a6','hand-o-down':'f0a7','arrow-circle-left':'f0a8','arrow-circle-right':'f0a9','arrow-circle-up':'f0aa','arrow-circle-down':'f0ab','globe':'f0ac','wrench':'f0ad','tasks':'f0ae','filter':'f0b0','briefcase':'f0b1','arrows-alt':'f0b2','group,users':'f0c0','chain,link':'f0c1','cloud':'f0c2','flask':'f0c3','cut,scissors':'f0c4','copy,files-o':'f0c5','paperclip':'f0c6','save,floppy-o':'f0c7','square':'f0c8','navicon,reorder,bars':'f0c9','list-ul':'f0ca','list-ol':'f0cb','strikethrough':'f0cc','underline':'f0cd','table':'f0ce','magic':'f0d0','truck':'f0d1','pinterest':'f0d2','pinterest-square':'f0d3','google-plus-square':'f0d4','google-plus':'f0d5','money':'f0d6','caret-down':'f0d7','caret-up':'f0d8','caret-left':'f0d9','caret-right':'f0da','columns':'f0db','unsorted,sort':'f0dc','sort-down,sort-desc':'f0dd','sort-up,sort-asc':'f0de','envelope':'f0e0','linkedin':'f0e1','rotate-left,undo':'f0e2','legal,gavel':'f0e3','dashboard,tachometer':'f0e4','comment-o':'f0e5','comments-o':'f0e6','flash,bolt':'f0e7','sitemap':'f0e8','umbrella':'f0e9','paste,clipboard':'f0ea','lightbulb-o':'f0eb','exchange':'f0ec','cloud-download':'f0ed','cloud-upload':'f0ee','user-md':'f0f0','stethoscope':'f0f1','suitcase':'f0f2','bell-o':'f0a2','coffee':'f0f4','cutlery':'f0f5','file-text-o':'f0f6','building-o':'f0f7','hospital-o':'f0f8','ambulance':'f0f9','medkit':'f0fa','fighter-jet':'f0fb','beer':'f0fc','h-square':'f0fd','plus-square':'f0fe','angle-double-left':'f100','angle-double-right':'f101','angle-double-up':'f102','angle-double-down':'f103','angle-left':'f104','angle-right':'f105','angle-up':'f106','angle-down':'f107','desktop':'f108','laptop':'f109','tablet':'f10a','mobile-phone,mobile':'f10b','circle-o':'f10c','quote-left':'f10d','quote-right':'f10e','spinner':'f110','circle':'f111','mail-reply,reply':'f112','github-alt':'f113','folder-o':'f114','folder-open-o':'f115','smile-o':'f118','frown-o':'f119','meh-o':'f11a','gamepad':'f11b','keyboard-o':'f11c','flag-o':'f11d','flag-checkered':'f11e','terminal':'f120','code':'f121','mail-reply-all,reply-all':'f122','star-half-empty,star-half-full,star-half-o':'f123','location-arrow':'f124','crop':'f125','code-fork':'f126','unlink,chain-broken':'f127','question':'f128','info':'f129','exclamation':'f12a','superscript':'f12b','subscript':'f12c','eraser':'f12d','puzzle-piece':'f12e','microphone':'f130','microphone-slash':'f131','shield':'f132','calendar-o':'f133','fire-extinguisher':'f134','rocket':'f135','maxcdn':'f136','chevron-circle-left':'f137','chevron-circle-right':'f138','chevron-circle-up':'f139','chevron-circle-down':'f13a','html5':'f13b','css3':'f13c','anchor':'f13d','unlock-alt':'f13e','bullseye':'f140','ellipsis-h':'f141','ellipsis-v':'f142','rss-square':'f143','play-circle':'f144','ticket':'f145','minus-square':'f146','minus-square-o':'f147','level-up':'f148','level-down':'f149','check-square':'f14a','pencil-square':'f14b','external-link-square':'f14c','share-square':'f14d','compass':'f14e','toggle-down,caret-square-o-down':'f150','toggle-up,caret-square-o-up':'f151','toggle-right,caret-square-o-right':'f152','euro,eur':'f153','gbp':'f154','dollar,usd':'f155','rupee,inr':'f156','cny,rmb,yen,jpy':'f157','ruble,rouble,rub':'f158','won,krw':'f159','bitcoin,btc':'f15a','file':'f15b','file-text':'f15c','sort-alpha-asc':'f15d','sort-alpha-desc':'f15e','sort-amount-asc':'f160','sort-amount-desc':'f161','sort-numeric-asc':'f162','sort-numeric-desc':'f163','thumbs-up':'f164','thumbs-down':'f165','youtube-square':'f166','youtube':'f167','xing':'f168','xing-square':'f169','youtube-play':'f16a','dropbox':'f16b','stack-overflow':'f16c','instagram':'f16d','flickr':'f16e','adn':'f170','bitbucket':'f171','bitbucket-square':'f172','tumblr':'f173','tumblr-square':'f174','long-arrow-down':'f175','long-arrow-up':'f176','long-arrow-left':'f177','long-arrow-right':'f178','apple':'f179','windows':'f17a','android':'f17b','linux':'f17c','dribbble':'f17d','skype':'f17e','foursquare':'f180','trello':'f181','female':'f182','male':'f183','gittip,gratipay':'f184','sun-o':'f185','moon-o':'f186','archive':'f187','bug':'f188','vk':'f189','weibo':'f18a','renren':'f18b','pagelines':'f18c','stack-exchange':'f18d','arrow-circle-o-right':'f18e','arrow-circle-o-left':'f190','toggle-left,caret-square-o-left':'f191','dot-circle-o':'f192','wheelchair':'f193','vimeo-square':'f194','turkish-lira,try':'f195','plus-square-o':'f196','space-shuttle':'f197','slack':'f198','envelope-square':'f199','wordpress':'f19a','openid':'f19b','institution,bank,university':'f19c','mortar-board,graduation-cap':'f19d','yahoo':'f19e','google':'f1a0','reddit':'f1a1','reddit-square':'f1a2','stumbleupon-circle':'f1a3','stumbleupon':'f1a4','delicious':'f1a5','digg':'f1a6','pied-piper-pp':'f1a7','pied-piper-alt':'f1a8','drupal':'f1a9','joomla':'f1aa','language':'f1ab','fax':'f1ac','building':'f1ad','child':'f1ae','paw':'f1b0','spoon':'f1b1','cube':'f1b2','cubes':'f1b3','behance':'f1b4','behance-square':'f1b5','steam':'f1b6','steam-square':'f1b7','recycle':'f1b8','automobile,car':'f1b9','cab,taxi':'f1ba','tree':'f1bb','spotify':'f1bc','deviantart':'f1bd','soundcloud':'f1be','database':'f1c0','file-pdf-o':'f1c1','file-word-o':'f1c2','file-excel-o':'f1c3','file-powerpoint-o':'f1c4','file-photo-o,file-picture-o,file-image-o':'f1c5','file-zip-o,file-archive-o':'f1c6','file-sound-o,file-audio-o':'f1c7','file-movie-o,file-video-o':'f1c8','file-code-o':'f1c9','vine':'f1ca','codepen':'f1cb','jsfiddle':'f1cc','life-bouy,life-buoy,life-saver,support,life-ring':'f1cd','circle-o-notch':'f1ce','ra,resistance,rebel':'f1d0','ge,empire':'f1d1','git-square':'f1d2','git':'f1d3','y-combinator-square,yc-square,hacker-news':'f1d4','tencent-weibo':'f1d5','qq':'f1d6','wechat,weixin':'f1d7','send,paper-plane':'f1d8','send-o,paper-plane-o':'f1d9','history':'f1da','circle-thin':'f1db','header':'f1dc','paragraph':'f1dd','sliders':'f1de','share-alt':'f1e0','share-alt-square':'f1e1','bomb':'f1e2','soccer-ball-o,futbol-o':'f1e3','tty':'f1e4','binoculars':'f1e5','plug':'f1e6','slideshare':'f1e7','twitch':'f1e8','yelp':'f1e9','newspaper-o':'f1ea','wifi':'f1eb','calculator':'f1ec','paypal':'f1ed','google-wallet':'f1ee','cc-visa':'f1f0','cc-mastercard':'f1f1','cc-discover':'f1f2','cc-amex':'f1f3','cc-paypal':'f1f4','cc-stripe':'f1f5','bell-slash':'f1f6','bell-slash-o':'f1f7','trash':'f1f8','copyright':'f1f9','at':'f1fa','eyedropper':'f1fb','paint-brush':'f1fc','birthday-cake':'f1fd','area-chart':'f1fe','pie-chart':'f200','line-chart':'f201','lastfm':'f202','lastfm-square':'f203','toggle-off':'f204','toggle-on':'f205','bicycle':'f206','bus':'f207','ioxhost':'f208','angellist':'f209','cc':'f20a','shekel,sheqel,ils':'f20b','meanpath':'f20c','buysellads':'f20d','connectdevelop':'f20e','dashcube':'f210','forumbee':'f211','leanpub':'f212','sellsy':'f213','shirtsinbulk':'f214','simplybuilt':'f215','skyatlas':'f216','cart-plus':'f217','cart-arrow-down':'f218','diamond':'f219','ship':'f21a','user-secret':'f21b','motorcycle':'f21c','street-view':'f21d','heartbeat':'f21e','venus':'f221','mars':'f222','mercury':'f223','intersex,transgender':'f224','transgender-alt':'f225','venus-double':'f226','mars-double':'f227','venus-mars':'f228','mars-stroke':'f229','mars-stroke-v':'f22a','mars-stroke-h':'f22b','neuter':'f22c','genderless':'f22d','facebook-official':'f230','pinterest-p':'f231','whatsapp':'f232','server':'f233','user-plus':'f234','user-times':'f235','hotel,bed':'f236','viacoin':'f237','train':'f238','subway':'f239','medium':'f23a','yc,y-combinator':'f23b','optin-monster':'f23c','opencart':'f23d','expeditedssl':'f23e','battery-4,battery-full':'f240','battery-3,battery-three-quarters':'f241','battery-2,battery-half':'f242','battery-1,battery-quarter':'f243','battery-0,battery-empty':'f244','mouse-pointer':'f245','i-cursor':'f246','object-group':'f247','object-ungroup':'f248','sticky-note':'f249','sticky-note-o':'f24a','cc-jcb':'f24b','cc-diners-club':'f24c','clone':'f24d','balance-scale':'f24e','hourglass-o':'f250','hourglass-1,hourglass-start':'f251','hourglass-2,hourglass-half':'f252','hourglass-3,hourglass-end':'f253','hourglass':'f254','hand-grab-o,hand-rock-o':'f255','hand-stop-o,hand-paper-o':'f256','hand-scissors-o':'f257','hand-lizard-o':'f258','hand-spock-o':'f259','hand-pointer-o':'f25a','hand-peace-o':'f25b','trademark':'f25c','registered':'f25d','creative-commons':'f25e','gg':'f260','gg-circle':'f261','tripadvisor':'f262','odnoklassniki':'f263','odnoklassniki-square':'f264','get-pocket':'f265','wikipedia-w':'f266','safari':'f267','chrome':'f268','firefox':'f269','opera':'f26a','internet-explorer':'f26b','tv,television':'f26c','contao':'f26d','500px':'f26e','amazon':'f270','calendar-plus-o':'f271','calendar-minus-o':'f272','calendar-times-o':'f273','calendar-check-o':'f274','industry':'f275','map-pin':'f276','map-signs':'f277','map-o':'f278','map':'f279','commenting':'f27a','commenting-o':'f27b','houzz':'f27c','vimeo':'f27d','black-tie':'f27e','fonticons':'f280','reddit-alien':'f281','edge':'f282','credit-card-alt':'f283','codiepie':'f284','modx':'f285','fort-awesome':'f286','usb':'f287','product-hunt':'f288','mixcloud':'f289','scribd':'f28a','pause-circle':'f28b','pause-circle-o':'f28c','stop-circle':'f28d','stop-circle-o':'f28e','shopping-bag':'f290','shopping-basket':'f291','hashtag':'f292','bluetooth':'f293','bluetooth-b':'f294','percent':'f295','gitlab':'f296','wpbeginner':'f297','wpforms':'f298','envira':'f299','universal-access':'f29a','wheelchair-alt':'f29b','question-circle-o':'f29c','blind':'f29d','audio-description':'f29e','volume-control-phone':'f2a0','braille':'f2a1','assistive-listening-systems':'f2a2','asl-interpreting,american-sign-language-interpreting':'f2a3','deafness,hard-of-hearing,deaf':'f2a4','glide':'f2a5','glide-g':'f2a6','signing,sign-language':'f2a7','low-vision':'f2a8','viadeo':'f2a9','viadeo-square':'f2aa','snapchat':'f2ab','snapchat-ghost':'f2ac','snapchat-square':'f2ad','pied-piper':'f2ae','first-order':'f2b0','yoast':'f2b1','themeisle':'f2b2','google-plus-circle,google-plus-official':'f2b3','fa,font-awesome':'f2b4'};
    }

    function icon(d) {
      var code;

      if (options.iconMap && options.showIcons && options.icons) {
        if (options.icons[d.labels[0]] && options.iconMap[options.icons[d.labels[0]]]) {
          code = options.iconMap[options.icons[d.labels[0]]];
        } else if (options.iconMap[d.labels[0]]) {
          code = options.iconMap[d.labels[0]];
        } else if (options.icons[d.labels[0]]) {
          code = options.icons[d.labels[0]];
        }
      }

      return code;
    }

function image(d) {
  var i, imagesForLabel, img, imgLevel, label, labelPropertyValue, property, value;

  if (options.images) {
    imagesForLabel = options.imageMap[d.labels[0]];

    if (imagesForLabel) {
      imgLevel = 0;

      for (i = 0; i < imagesForLabel.length; i++) {
        labelPropertyValue = imagesForLabel[i].split('|');

        switch (labelPropertyValue.length) {
          case 3:
            value = labelPropertyValue[2];
            /* falls through */
          case 2:
            property = labelPropertyValue[1];
            /* falls through */
          case 1:
            label = labelPropertyValue[0];
        }

        if (d.labels[0] === label &&
          (!property || d.properties[property] !== undefined) &&
          (!value || d.properties[property] === value)) {
          if (labelPropertyValue.length > imgLevel) {
            img = options.images[imagesForLabel[i]];
            imgLevel = labelPropertyValue.length;
          }
        }
      }
    }
  }

  return img;
}

function init(_selector, _options) {
  initIconMap();

  merge(options, _options);

  if (options.icons) {
    options.showIcons = true;
  }

  if (!options.minCollision) {
    options.minCollision = options.nodeRadius * 2;
  }

  initImageMap();

  selector = _selector;

  container = d3.select(selector);

  container.attr('class', 'neo4jd3')
    .html('');

  if (options.infoPanel) {
    info = appendInfoPanel(container);
  }

  appendGraph(container);

  simulation = initSimulation();


  if (options.neo4jData) {
    loadNeo4jData(options.neo4jData);
  } else if (options.neo4jDataUrl) {
    loadNeo4jDataFromUrl(options.neo4jDataUrl);
  } else {
    console.error('Error: both neo4jData and neo4jDataUrl are empty!');
  }
}

function initIconMap() {
  Object.keys(options.iconMap).forEach(function(key, index) {
    var keys = key.split(','),
      value = options.iconMap[key];

    keys.forEach(function(key) {
      options.iconMap[key] = value;
    });
  });
}

function initImageMap() {
  var key, keys, selector;

  for (key in options.images) {
    if (options.images.hasOwnProperty(key)) {
      keys = key.split('|');

      if (!options.imageMap[keys[0]]) {
        options.imageMap[keys[0]] = [key];
      } else {
        options.imageMap[keys[0]].push(key);
      }
    }
  }
}

function initSimulation() {
  var spreadFactor = 1.25;
  var simulation = d3.forceSimulation()
  //.force('x', d3.forceCollide().strength(0.002))
  //.force('y', d3.forceCollide().strength(0.002))
  //.force('y', d3.force().strength(0.002))
    .force('collide', d3.forceCollide().radius(function(d) {
      return options.minCollision * spreadFactor;
    }).iterations(10))
    .force('charge', d3.forceManyBody())
    .force('link', d3.forceLink().id(function(d) {
      return d.id;
    }))
    .force('center', d3.forceCenter(svg.node().parentElement.parentElement.clientWidth / 2, svg.node().parentElement.parentElement.clientHeight / 2))
    .on('tick', function() {
      tick();
    })
    .on('end', function() {
      if (options.zoomFit && !justLoaded) {
        justLoaded = true;
        zoomFit(2);
      }
    });

  return simulation;
}

function loadNeo4jData() {
  nodes = [];
  relationships = [];

  updateWithNeo4jData(options.neo4jData);
}

function loadNeo4jDataFromUrl(neo4jDataUrl) {
  nodes = [];
  relationships = [];

  d3.json(neo4jDataUrl, function(error, data) {
    if (error) {
      throw error;
    }

    updateWithNeo4jData(data);
  });
}

function merge(target, source) {
  Object.keys(source).forEach(function(property) {
    target[property] = source[property];
  });
}

function neo4jDataToD3Data(data) {
  var graph = {
    nodes: [],
    relationships: []
  };

  data.results.forEach(function(result) {
    result.data.forEach(function(data) {
      data.graph.nodes.forEach(function(node) {
        if (!contains(graph.nodes, node.id)) {
          graph.nodes.push(node);
        }
      });

      data.graph.relationships.forEach(function(relationship) {
        relationship.source = relationship.startNode;
        relationship.target = relationship.endNode;
        graph.relationships.push(relationship);
      });

      data.graph.relationships.sort(function(a, b) {
        if (a.source > b.source) {
          return 1;
        } else if (a.source < b.source) {
          return -1;
        } else {
          if (a.target > b.target) {
            return 1;
          }

          if (a.target < b.target) {
            return -1;
          } else {
            return 0;
          }
        }
      });

      for (var i = 0; i < data.graph.relationships.length; i++) {
        if (i !== 0 && data.graph.relationships[i].source === data.graph.relationships[i-1].source && data.graph.relationships[i].target === data.graph.relationships[i-1].target) {
          data.graph.relationships[i].linknum = data.graph.relationships[i - 1].linknum + 1;
        } else {
          data.graph.relationships[i].linknum = 1;
        }
      }
    });
  });

  return graph;
}

function rotate(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle,
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
    ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

  return { x: nx, y: ny };
}

function rotatePoint(c, p, angle) {
  return rotate(c.x, c.y, p.x, p.y, angle);
}

function rotation(source, target) {
  return Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
}

function size() {
  return {
    nodes: nodes.length,
    relationships: relationships.length
  };
}
/*
    function smoothTransform(elem, translate, scale) {
        var animationMilliseconds = 5000,
            timeoutMilliseconds = 50,
            steps = parseInt(animationMilliseconds / timeoutMilliseconds);

        setTimeout(function() {
            smoothTransformStep(elem, translate, scale, timeoutMilliseconds, 1, steps);
        }, timeoutMilliseconds);
    }

    function smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step, steps) {
        var progress = step / steps;

        elem.attr('transform', 'translate(' + (translate[0] * progress) + ', ' + (translate[1] * progress) + ') scale(' + (scale * progress) + ')');

        if (step < steps) {
            setTimeout(function() {
                smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step + 1, steps);
            }, timeoutMilliseconds);
        }
    }
    */
function stickNode(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function tick() {
  tickNodes();
  tickRelationships();
}

function tickNodes() {
  if (node) {
    node.attr('transform', function(d) {
      return 'translate(' + d.x + ', ' + d.y + ')';
    });
  }
}

function tickRelationships() {
  if (relationship) {
    relationship.attr('transform', function(d) {
      var angle = rotation(d.source, d.target);
      return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
    });

    tickRelationshipsTexts();
    tickRelationshipsOutlines();
    tickRelationshipsOverlays();
  }
}

function produceBoundingBox(textNode, relationship){
  return textNode.node().getBBox();
}

function tickRelationshipsOutlines() {
  relationship.each(function(relationship) {

    var rel = d3.select(this);
    var outline = rel.select('.outline');
    var text = rel.select('.text');
    var bbox = text.node().getBBox();
    var padding = 0;


    var textBoundingBox = produceBoundingBox(text, relationship);

    outline.attr('d', function(d) {
      var center = { x: 0, y: 0 },
        angle = rotation(d.source, d.target),
        textPadding = 0,
        u = unitaryVector(d.source, d.target),
        textMargin = { x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5, y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5 },
        n = unitaryNormalVector(d.source, d.target),
        rotatedPointA1 = rotatePoint(center, { x: 0 + (options.nodeRadius + 1) * u.x - n.x, y: 0 + (options.nodeRadius + 1) * u.y - n.y }, angle),
        rotatedPointB1 = rotatePoint(center, { x: textMargin.x - n.x, y: textMargin.y - n.y }, angle),
        rotatedPointC1 = rotatePoint(center, { x: textMargin.x, y: textMargin.y }, angle),
        rotatedPointD1 = rotatePoint(center, { x: 0 + (options.nodeRadius + 1) * u.x, y: 0 + (options.nodeRadius + 1) * u.y }, angle),
        rotatedPointA2 = rotatePoint(center, { x: d.target.x - d.source.x - textMargin.x - n.x, y: d.target.y - d.source.y - textMargin.y - n.y }, angle),
        rotatedPointB2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x - u.x * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y - u.y * options.arrowSize }, angle),
        rotatedPointC2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x + (n.x - u.x) * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y + (n.y - u.y) * options.arrowSize }, angle),
        rotatedPointD2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y }, angle),
        rotatedPointE2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x + (- n.x - u.x) * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y + (- n.y - u.y) * options.arrowSize }, angle),
        rotatedPointF2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize }, angle),
        rotatedPointG2 = rotatePoint(center, { x: d.target.x - d.source.x - textMargin.x, y: d.target.y - d.source.y - textMargin.y }, angle);

      return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
        ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
        ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
        ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
        ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
        ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
        ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +
        ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +
        ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +
        ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
        ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
        ' Z';
    });
  });
}

function tickRelationshipsOverlays() {
  relationshipOverlay.attr('d', function(d) {
    var center = { x: 0, y: 0 },
      angle = rotation(d.source, d.target),
      n1 = unitaryNormalVector(d.source, d.target),
      n = unitaryNormalVector(d.source, d.target, 50),
      rotatedPointA = rotatePoint(center, { x: 0 - n.x, y: 0 - n.y }, angle),
      rotatedPointB = rotatePoint(center, { x: d.target.x - d.source.x - n.x, y: d.target.y - d.source.y - n.y }, angle),
      rotatedPointC = rotatePoint(center, { x: d.target.x - d.source.x + n.x - n1.x, y: d.target.y - d.source.y + n.y - n1.y }, angle),
      rotatedPointD = rotatePoint(center, { x: 0 + n.x - n1.x, y: 0 + n.y - n1.y }, angle);

    return 'M ' + rotatedPointA.x + ' ' + rotatedPointA.y +
      ' L ' + rotatedPointB.x + ' ' + rotatedPointB.y +
      ' L ' + rotatedPointC.x + ' ' + rotatedPointC.y +
      ' L ' + rotatedPointD.x + ' ' + rotatedPointD.y +
      ' Z';
  });
}

function tickRelationshipsTexts() {
  relationshipText.attr('transform', function(d) {
    var angle = (rotation(d.source, d.target) + 360) % 360,
      mirror = angle > 90 && angle < 270,
      center = { x: 0, y: 0 },
      n = unitaryNormalVector(d.source, d.target),
      nWeight = mirror ? 2 : -3,
      point = { x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight, y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight },
      rotatedPoint = rotatePoint(center, point, angle);

    return 'translate(' + rotatedPoint.x + ', ' + rotatedPoint.y + ') rotate(' + (mirror ? 180 : 0) + ')';
  });
}

function toString(d) {
  var s = d.labels ? d.labels[0] : d.type;

  s += ' (<id>: ' + d.id;

  Object.keys(d.properties).forEach(function(property) {
    s += ', ' + property + ': ' + JSON.stringify(d.properties[property]);
  });

  s += ')';

  return s;
}

function unitaryNormalVector(source, target, newLength) {
  var center = { x: 0, y: 0 },
    vector = unitaryVector(source, target, newLength);

  return rotatePoint(center, vector, 90);
}

function unitaryVector(source, target, newLength) {
  var length = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)) / Math.sqrt(newLength || 1);

  return {
    x: (target.x - source.x) / length,
    y: (target.y - source.y) / length,
  };
}

function updateWithD3Data(d3Data) {
  // marker
  updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
}

function updateWithNeo4jData(neo4jData) {
  var d3Data = neo4jDataToD3Data(neo4jData);
  updateWithD3Data(d3Data);
}

function updateInfo(d) {
  clearInfo();

  if (d.labels) {
    appendInfoElementClass('class', d.labels[0]);
  } else {
    appendInfoElementRelationship('class', d.type);
  }

  appendInfoElementProperty('property', '&lt;id&gt;', d.id);

  Object.keys(d.properties).forEach(function(property) {
    appendInfoElementProperty('property', property, JSON.stringify(d.properties[property]));
  });
}

function updateNodes(n) {
  Array.prototype.push.apply(nodes, n);

  node = svgNodes.selectAll('.node')
    .data(nodes, function(d) { return d.id; });
  var nodeEnter = appendNodeToGraph();
  node = nodeEnter.merge(node);
}

function updateNodesAndRelationships(n, r) {
  updateRelationships(r);
  updateNodes(n);

  simulation.nodes(nodes);
  simulation.force('link').links(relationships);
}

function updateRelationships(r) {
  Array.prototype.push.apply(relationships, r);

  relationship = svgRelationships.selectAll('.relationship')
    .data(relationships, function(d) { return d.id; });

  var relationshipEnter = appendRelationshipToGraph();

  relationship = relationshipEnter.relationship.merge(relationship);
  relationshipOutline = svg.selectAll('.relationship .outline');
  relationshipOutline = relationshipEnter.outline.merge(relationshipOutline);

  relationshipOverlay = svg.selectAll('.relationship .overlay');
  relationshipOverlay = relationshipEnter.overlay.merge(relationshipOverlay);

  relationshipText = svg.selectAll('.relationship .text');
  relationshipText = relationshipEnter.text.merge(relationshipText);
}


function version() {
  return VERSION;
}

function zoomFit(transitionDuration) {
  var bounds = svg.node().getBBox();
  var parent = svg.node().parentElement.parentElement;

  if (!parent) {
    return;
  }

  var fullWidth = parent.clientWidth;
  var fullHeight = parent.clientHeight;
  var width = bounds.width;
  var height = bounds.height;
  var midX = bounds.x + width / 2;
  var midY = bounds.y + height / 2;

  if (width === 0 || height === 0) {
    return; // nothing to fit
  }

  svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
  svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

  svg.attr('transform', 'translate(' + svgTranslate[0] + ', ' + svgTranslate[1] + ') scale(' + svgScale + ')');
  //        smoothTransform(svgTranslate, svgScale);
}

init(_selector, _options);

return {
  neo4jDataToD3Data: neo4jDataToD3Data,
  size: size,
  updateWithD3Data: updateWithD3Data,
  updateWithNeo4jData: updateWithNeo4jData,
  version: version
};
}

module.exports = Neo4jD3;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi9pbmRleC5qcyIsInNyYy9tYWluL3NjcmlwdHMvbmVvNGpkMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5lbzRqZDMgPSByZXF1aXJlKCcuL3NjcmlwdHMvbmVvNGpkMycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5lbzRqZDM7XG4iLCIvKiBnbG9iYWwgZDMsIGRvY3VtZW50ICovXG4vKiBqc2hpbnQgbGF0ZWRlZjpub2Z1bmMgKi9cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gTmVvNGpEMyhfc2VsZWN0b3IsIF9vcHRpb25zKSB7XG4gIHZhciBjb250YWluZXIsIGdyYXBoLCBpbmZvLCBub2RlLCBub2RlcywgcmVsYXRpb25zaGlwLCByZWxhdGlvbnNoaXBPdXRsaW5lLCByZWxhdGlvbnNoaXBPdmVybGF5LCByZWxhdGlvbnNoaXBUZXh0LCByZWxhdGlvbnNoaXBzLCBzZWxlY3Rvciwgc2ltdWxhdGlvbiwgc3ZnLCBzdmdOb2Rlcywgc3ZnUmVsYXRpb25zaGlwcywgc3ZnU2NhbGUsIHN2Z1RyYW5zbGF0ZSxcbiAgICBjbGFzc2VzMmNvbG9ycyA9IHt9LFxuICAgIGp1c3RMb2FkZWQgPSBmYWxzZSxcbiAgICBudW1DbGFzc2VzID0gMCxcbiAgICBvcHRpb25zID0ge1xuICAgICAgYXJyb3dTaXplOiAyLFxuICAgICAgY29sb3JzOiBjb2xvcnMoKSxcbiAgICAgIGhpZ2hsaWdodDogdW5kZWZpbmVkLFxuICAgICAgaWNvbk1hcDogZm9udEF3ZXNvbWVJY29ucygpLFxuICAgICAgaWNvbnM6IHVuZGVmaW5lZCxcbiAgICAgIGltYWdlTWFwOiB7fSxcbiAgICAgIGltYWdlczogdW5kZWZpbmVkLFxuICAgICAgaW5mb1BhbmVsOiB0cnVlLFxuICAgICAgbWluQ29sbGlzaW9uOiB1bmRlZmluZWQsXG4gICAgICBuZW80akRhdGE6IHVuZGVmaW5lZCxcbiAgICAgIG5lbzRqRGF0YVVybDogdW5kZWZpbmVkLFxuICAgICAgbm9kZU91dGxpbmVGaWxsQ29sb3I6IHVuZGVmaW5lZCxcbiAgICAgIG5vZGVSYWRpdXM6IDc1LFxuICAgICAgcmVsYXRpb25zaGlwQ29sb3I6ICcjYTVhYmI2JyxcbiAgICAgIHpvb21GaXQ6IGZhbHNlLFxuICAgICAgbGFiZWxDb2xvck1hcHBpbmc6IGNyZWF0ZUxhYmVsQ29sb3JNYXBwaW5nKCksXG4gICAgICBsYWJlbFByb3BlcnR5OiAnbmFtZScsXG4gICAgICBpbWFnZVNpemU6IHtcbiAgICAgICAgaGVpZ2h0OiAnMzBweCcsXG4gICAgICAgIHdpZHRoOiAnMzBweCcsXG4gICAgICAgIHg6ICctMTVweCcsXG4gICAgICAgIHk6ICctMTZweCcsXG4gICAgICB9XG4gICAgfSxcbiAgICBWRVJTSU9OID0gJzAuMC4xJztcblxuICBmdW5jdGlvbiBjcmVhdGVMYWJlbENvbG9yTWFwcGluZygpe1xuICAgIHZhciBsYWJlbENvbG9yTWFwcGluZyA9IHtcbiAgICAgIFwiY3VzdG9tZXJcIjogXCIjNjhiZGY2XCIsXG4gICAgICBcImFjY291bnRcIjogXCIjZmZkODZlXCIsXG4gICAgICBcIm93bmJhbmthY2NvdW50XCI6IFwiIzZkY2U5ZVwiLFxuICAgICAgXCJvdGhlcmJhbmthY2NvdW50XCI6IFwiI2ZmODY3ZlwiLFxuICAgICAgXCJydWxldmlvbGF0aW9uXCI6IFwiI2ZmYTgyZFwiXG4gICAgfTtcblxuICAgIHJldHVybiBsYWJlbENvbG9yTWFwcGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEdyYXBoKGNvbnRhaW5lcikge1xuICAgIHN2ZyA9IGNvbnRhaW5lci5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCAnMTAwJScpXG4gICAgICAuYXR0cignaGVpZ2h0JywgJzEwMCUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ25lbzRqZDMtZ3JhcGgnKVxuICAgICAgLmNhbGwoZDMuem9vbSgpLm9uKCd6b29tJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnRyYW5zZm9ybS5rLFxuICAgICAgICAgIHRyYW5zbGF0ZSA9IFtkMy5ldmVudC50cmFuc2Zvcm0ueCwgZDMuZXZlbnQudHJhbnNmb3JtLnldO1xuXG4gICAgICAgIGlmIChzdmdUcmFuc2xhdGUpIHtcbiAgICAgICAgICB0cmFuc2xhdGVbMF0gKz0gc3ZnVHJhbnNsYXRlWzBdO1xuICAgICAgICAgIHRyYW5zbGF0ZVsxXSArPSBzdmdUcmFuc2xhdGVbMV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3ZnU2NhbGUpIHtcbiAgICAgICAgICBzY2FsZSAqPSBzdmdTY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN2Zy5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB0cmFuc2xhdGVbMF0gKyAnLCAnICsgdHJhbnNsYXRlWzFdICsgJykgc2NhbGUoJyArIHNjYWxlICsgJyknKTtcbiAgICAgIH0pKVxuICAgICAgLm9uKCdkYmxjbGljay56b29tJywgbnVsbClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgJzEwMCUnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsICcxMDAlJyk7XG5cbiAgICBzdmdSZWxhdGlvbnNoaXBzID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmVsYXRpb25zaGlwcycpO1xuXG4gICAgc3ZnTm9kZXMgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdub2RlcycpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW1hZ2VUb05vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLmFwcGVuZCgnaW1hZ2UnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGljb24oZCkgPyAnMjRweCc6IG9wdGlvbnMuaW1hZ2VTaXplLmhlaWdodDtcbiAgICAgIH0pXG4gICAgICAuYXR0cigneCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGljb24oZCkgPyAnNXB4Jzogb3B0aW9ucy5pbWFnZVNpemUueDtcbiAgICAgIH0pXG4gICAgICAuYXR0cigneGxpbms6aHJlZicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGltYWdlKGQpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd5JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICc1cHgnOiBvcHRpb25zLmltYWdlU2l6ZS55O1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGljb24oZCkgPyAnMjRweCc6IG9wdGlvbnMuaW1hZ2VTaXplLndpZHRoO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvUGFuZWwoY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lci5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbmVvNGpkMy1pbmZvJyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGlzTm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgdmFyIGVsZW0gPSBpbmZvLmFwcGVuZCgnYScpO1xuXG4gICAgZWxlbS5hdHRyKCdocmVmJywgJyMnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgY2xzKVxuICAgICAgLmh0bWwoJzxzdHJvbmc+JyArIHByb3BlcnR5ICsgJzwvc3Ryb25nPicgKyAodmFsdWUgPyAoJzogJyArIHZhbHVlKSA6ICcnKSk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgZWxlbS5zdHlsZSgnYmFja2dyb3VuZC1jb2xvcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgdGhlUHJvcGVydHkgPSBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHRoZVByb3BlcnR5IGluIG9wdGlvbnMubGFiZWxDb2xvck1hcHBpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmxhYmVsQ29sb3JNYXBwaW5nW3RoZVByb3BlcnR5XTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yIDogKGlzTm9kZSA/IGNsYXNzMmNvbG9yKHByb3BlcnR5KSA6IGRlZmF1bHRDb2xvcigpKTtcbiAgICAgIH0pXG4gICAgICAgIC5zdHlsZSgnYm9yZGVyLWNvbG9yJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHZhciB0aGVQcm9wZXJ0eSA9IHByb3BlcnR5LnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICBpZiAodGhlUHJvcGVydHkgaW4gb3B0aW9ucy5sYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5sYWJlbENvbG9yTWFwcGluZ1t0aGVQcm9wZXJ0eV07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gY2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcikgOiAoaXNOb2RlID8gY2xhc3MyZGFya2VuQ29sb3IocHJvcGVydHkpIDogZGVmYXVsdERhcmtlbkNvbG9yKCkpO1xuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoJ2NvbG9yJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gY2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcikgOiAnI2ZmZic7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoY2xzLCBub2RlKSB7XG4gICAgYXBwZW5kSW5mb0VsZW1lbnQoY2xzLCB0cnVlLCBub2RlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoY2xzLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGZhbHNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRSZWxhdGlvbnNoaXAoY2xzLCByZWxhdGlvbnNoaXApIHtcbiAgICBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGZhbHNlLCByZWxhdGlvbnNoaXApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kTm9kZSgpIHtcbiAgICByZXR1cm4gbm9kZS5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGhpZ2hsaWdodCwgaSxcbiAgICAgICAgICBjbGFzc2VzID0gJ25vZGUnLFxuICAgICAgICAgIGxhYmVsID0gZC5sYWJlbHNbMF07XG5cbiAgICAgICAgaWYgKGljb24oZCkpIHtcbiAgICAgICAgICBjbGFzc2VzICs9ICcgbm9kZS1pY29uJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbWFnZShkKSkge1xuICAgICAgICAgIGNsYXNzZXMgKz0gJyBub2RlLWltYWdlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLmhpZ2hsaWdodCkge1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaGlnaGxpZ2h0ID0gb3B0aW9ucy5oaWdobGlnaHRbaV07XG5cbiAgICAgICAgICAgIGlmIChkLmxhYmVsc1swXSA9PT0gaGlnaGxpZ2h0LmNsYXNzICYmIGQucHJvcGVydGllc1toaWdobGlnaHQucHJvcGVydHldID09PSBoaWdobGlnaHQudmFsdWUpIHtcbiAgICAgICAgICAgICAgY2xhc3NlcyArPSAnIG5vZGUtaGlnaGxpZ2h0ZWQnO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2xhc3NlcztcbiAgICAgIH0pXG4gICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBkLmZ4ID0gZC5meSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZUNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbk5vZGVDbGljayhkKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5vbignZGJsY2xpY2snLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHN0aWNrTm9kZShkKTtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRG91YmxlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvcHRpb25zLm9uTm9kZURvdWJsZUNsaWNrKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgIHVwZGF0ZUluZm8oZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VFbnRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIG9wdGlvbnMub25Ob2RlTW91c2VFbnRlcihkKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICBjbGVhckluZm8oZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VMZWF2ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIG9wdGlvbnMub25Ob2RlTW91c2VMZWF2ZShkKTtcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIC5jYWxsKGQzLmRyYWcoKVxuICAgIC5vbignc3RhcnQnLCBkcmFnU3RhcnRlZClcbiAgICAub24oJ2RyYWcnLCBkcmFnZ2VkKVxuICAgIC5vbignZW5kJywgZHJhZ0VuZGVkKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cnVuY2F0ZVRleHQoc3RyLCBsZW5ndGgpIHtcbiAgICBzdHIgPSBzdHIgfHwgJyc7XG5cbiAgICB2YXIgZW5kaW5nID0gJy4uLic7XG5cbiAgICBpZiAobGVuZ3RoID09IG51bGwpIHtcbiAgICAgIGxlbmd0aCA9IDEwMDtcbiAgICB9XG5cbiAgICBpZiAoc3RyLmxlbmd0aCA+IGxlbmd0aCkge1xuICAgICAgcmV0dXJuIHN0ci5zdWJzdHJpbmcoMCwgbGVuZ3RoIC0gZW5kaW5nLmxlbmd0aCkgKyBlbmRpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2FsY3VsYXRlWExvY2F0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZS5sZW5ndGg7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmROb2RlTmFtZVRleHQobm9kZSkge1xuICAgIC8vIGdvaW5nIHRvIG5lZWQgdG8gbGluayB0aGlzIHRvIG5vZGUgd2lkdGgvIGhpZWdodCBhdCBzb21lIHBvaW50XG4gICAgdmFyIGcgPSBub2RlLmFwcGVuZCgnZycpO1xuXG4gICAgZy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsICc4MHB4JylcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsICcyMHB4JylcbiAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCl7XG4gICAgICAgIHJldHVybiBcIiNiZGMzYzdcIjtcbiAgICAgIH0pXG4gICAgICAuYXR0cigneScsIDI0KVxuICAgICAgLmF0dHIoJ3gnLCAtNDApXG4gICAgICAuYXR0cigncngnLCAxMClcbiAgICAgIC5hdHRyKCdyeScsIDEwKTtcblxuICAgIGcuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHggPSBub2RlLmxhYmVscztcbiAgICAgICAgcmV0dXJuIHRydW5jYXRlVGV4dChub2RlLnByb3BlcnRpZXNbb3B0aW9ucy5sYWJlbFByb3BlcnR5XSwgMTMpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCAxMClcbiAgICAgIC5hdHRyKCd4JywgZnVuY3Rpb24obm9kZSl7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgICAvL3JldHVybiBjYWxjdWxhdGVYTG9jYXRpb24obm9kZS5wcm9wZXJ0aWVzLm5hbWUpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd5JywgMzMpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgIC5hdHRyKCdhbGlnbm1lbnQtYmFzZWxpbmUnLCAnY2VudHJhbCcpXG4gICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlVGV4dENsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbk5vZGVUZXh0Q2xpY2soZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kTm9kZUluZm8obm9kZSkge1xuICAgIGlmICghb3B0aW9ucy5vbk5vZGVJbmZvQ2xpY2sgfHwgIW9wdGlvbnMuZGlzcGxheUluZm9JY29uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGcgPSBub2RlLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnaW5mbycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSg5LCAtMjgpJylcbiAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmRpc3BsYXlJbmZvSWNvbihkKSA/IFwiXCIgOiBcImhpZGRlblwiO1xuICAgICAgfSlcbiAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVJbmZvQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvcHRpb25zLm9uTm9kZUluZm9DbGljayhkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgJzIwcHgnKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgJzIwcHgnKVxuICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiM0NDRcIilcbiAgICAgIC5zdHlsZShcInN0cm9rZVwiLCBcIiM1NGIzZmZcIilcbiAgICAgIC5hdHRyKCdyeCcsIDEwKVxuICAgICAgLmF0dHIoJ3J5JywgMTApO1xuICAgIFxuICAgIGcuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC50ZXh0KCdpJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCAxMSlcbiAgICAgIC5hdHRyKCd4JywgJzknKVxuICAgICAgLmF0dHIoJ3knLCAnMTQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZE5vZGVUb0dyYXBoKCkge1xuICAgIHZhciBuID0gYXBwZW5kTm9kZSgpO1xuXG4gICAgYXBwZW5kUmluZ1RvTm9kZShuKTtcbiAgICBhcHBlbmRPdXRsaW5lVG9Ob2RlKG4pO1xuXG4gICAgaWYgKG9wdGlvbnMuaWNvbnMpIHtcbiAgICAgIGFwcGVuZFRleHRUb05vZGUobik7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuaW1hZ2VzKSB7XG4gICAgICBhcHBlbmRJbWFnZVRvTm9kZShuKTtcbiAgICB9XG5cbiAgICBhcHBlbmROb2RlTmFtZVRleHQobik7XG4gICAgYXBwZW5kTm9kZUluZm8obik7XG5cbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZE91dGxpbmVUb05vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdvdXRsaW5lJylcbiAgICAgIC5hdHRyKCdyJywgb3B0aW9ucy5ub2RlUmFkaXVzKVxuICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgbGFiZWwgPSBkLmxhYmVscztcblxuICAgICAgICBpZiAobGFiZWwubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICByZXR1cm4gJ2dyYXknO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRoZV9sYWJlbCA9IGxhYmVsWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICh0aGVfbGFiZWwgaW4gb3B0aW9ucy5sYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMubGFiZWxDb2xvck1hcHBpbmdbdGhlX2xhYmVsXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA6IGNsYXNzMmNvbG9yKGQubGFiZWxzWzBdKTtcbiAgICAgIH0pXG4gICAgICAuc3R5bGUoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGxhYmVsID0gZC5sYWJlbHM7XG5cbiAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgcmV0dXJuICdncmF5JztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0aGVfbGFiZWwgPSBsYWJlbFswXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAodGhlX2xhYmVsIGluIG9wdGlvbnMubGFiZWxDb2xvck1hcHBpbmcpe1xuICAgICAgICAgIHJldHVybiBvcHRpb25zLmxhYmVsQ29sb3JNYXBwaW5nW3RoZV9sYWJlbF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKSA6IGNsYXNzMmRhcmtlbkNvbG9yKGQubGFiZWxzWzBdKTtcbiAgICAgIH0pXG4gICAgICAuYXBwZW5kKCd0aXRsZScpLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gdG9TdHJpbmcoZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZFJpbmdUb05vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdyaW5nJylcbiAgICAgIC5hdHRyKCdyJywgb3B0aW9ucy5ub2RlUmFkaXVzICogMS4xNilcbiAgICAgIC5hcHBlbmQoJ3RpdGxlJykudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiB0b1N0cmluZyhkKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kVGV4dFRvTm9kZShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICd0ZXh0JyArIChpY29uKGQpID8gJyBpY29uJyA6ICcnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignZmlsbCcsICcjZmZmZmZmJylcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBpY29uKGQpID8gKG9wdGlvbnMubm9kZVJhZGl1cyArICdweCcpIDogJzEwcHgnO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdub25lJylcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBpY29uKGQpID8gKHBhcnNlSW50KE1hdGgucm91bmQob3B0aW9ucy5ub2RlUmFkaXVzICogMC4zMikpICsgJ3B4JykgOiAnNHB4JztcbiAgICAgIH0pXG4gICAgICAuaHRtbChmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBfaWNvbiA9IGljb24oZCk7XG4gICAgICAgIHJldHVybiBfaWNvbiA/ICcmI3gnICsgX2ljb24gOiBkLmlkO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRSZWxhdGlvbnNoaXAoKSB7XG4gICAgcmV0dXJuIHJlbGF0aW9uc2hpcC5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsJ3JlbGF0aW9uc2hpcCcpXG4gICAgICAub24oJ2RibGNsaWNrJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25SZWxhdGlvbnNoaXBEb3VibGVDbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIG9wdGlvbnMub25SZWxhdGlvbnNoaXBEb3VibGVDbGljayhkKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICB1cGRhdGVJbmZvKGQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZE91dGxpbmVUb1JlbGF0aW9uc2hpcChyKSB7XG4gICAgcmV0dXJuIHIuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdvdXRsaW5lJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNhNWFiYjYnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIGZ1bmN0aW9uKGQsaSl7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBmdW5jdGlvbihkKVxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuICcjYTVhYmI2JztcbiAgICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRPdmVybGF5VG9SZWxhdGlvbnNoaXAocikge1xuICAgIHJldHVybiByLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnb3ZlcmxheScpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHIpIHtcbiAgICByZXR1cm4gci5hcHBlbmQoJ3RleHQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RleHQnKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnIzAwMDAwMCcpXG4gICAgICAuYXR0cignZm9udC1zaXplJywgJzhweCcpXG4gICAgICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnbm9uZScpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQudHlwZTtcbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaCgpIHtcbiAgICB2YXIgcmVsYXRpb25zaGlwID0gYXBwZW5kUmVsYXRpb25zaGlwKCk7XG5cbiAgICB2YXIgdGV4dCA9IGFwcGVuZFRleHRUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApO1xuXG4gICAgdmFyIG91dGxpbmUgPSBhcHBlbmRPdXRsaW5lVG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKTtcbiAgICB2YXIgb3ZlcmxheSA9IGFwcGVuZE92ZXJsYXlUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG91dGxpbmU6IG91dGxpbmUsXG4gICAgICBvdmVybGF5OiBvdmVybGF5LFxuICAgICAgcmVsYXRpb25zaGlwOiByZWxhdGlvbnNoaXAsXG4gICAgICB0ZXh0OiB0ZXh0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsYXNzMmNvbG9yKGNscykge1xuICAgIHZhciBjb2xvciA9IGNsYXNzZXMyY29sb3JzW2Nsc107XG5cbiAgICBpZiAoIWNvbG9yKSB7XG4gICAgICAvLyAgICAgICAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvcnNbTWF0aC5taW4obnVtQ2xhc3Nlcywgb3B0aW9ucy5jb2xvcnMubGVuZ3RoIC0gMSldO1xuICAgICAgY29sb3IgPSBvcHRpb25zLmNvbG9yc1tudW1DbGFzc2VzICUgb3B0aW9ucy5jb2xvcnMubGVuZ3RoXTtcbiAgICAgIGNsYXNzZXMyY29sb3JzW2Nsc10gPSBjb2xvcjtcbiAgICAgIG51bUNsYXNzZXMrKztcbiAgICB9XG5cbiAgICByZXR1cm4gY29sb3I7XG4gIH1cblxuICBmdW5jdGlvbiBjbGFzczJkYXJrZW5Db2xvcihjbHMpIHtcbiAgICByZXR1cm4gZDMucmdiKGNsYXNzMmNvbG9yKGNscykpLmRhcmtlcigxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFySW5mbygpIHtcbiAgICBpbmZvLmh0bWwoJycpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sb3IoKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuY29sb3JzW29wdGlvbnMuY29sb3JzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF07XG4gIH1cblxuICBmdW5jdGlvbiBjb2xvcnMoKSB7XG4gICAgLy8gZDMuc2NoZW1lQ2F0ZWdvcnkxMCxcbiAgICAvLyBkMy5zY2hlbWVDYXRlZ29yeTIwLFxuICAgIHJldHVybiBbXG4gICAgICAnIzY4YmRmNicsIC8vIGxpZ2h0IGJsdWVcbiAgICAgICcjNmRjZTllJywgLy8gZ3JlZW4gIzFcbiAgICAgICcjZmFhZmMyJywgLy8gbGlnaHQgcGlua1xuICAgICAgJyNmMmJhZjYnLCAvLyBwdXJwbGVcbiAgICAgICcjZmY5MjhjJywgLy8gbGlnaHQgcmVkXG4gICAgICAnI2ZjZWE3ZScsIC8vIGxpZ2h0IHllbGxvd1xuICAgICAgJyNmZmM3NjYnLCAvLyBsaWdodCBvcmFuZ2VcbiAgICAgICcjNDA1ZjllJywgLy8gbmF2eSBibHVlXG4gICAgICAnI2E1YWJiNicsIC8vIGRhcmsgZ3JheVxuICAgICAgJyM3OGNlY2InLCAvLyBncmVlbiAjMixcbiAgICAgICcjYjg4Y2JiJywgLy8gZGFyayBwdXJwbGVcbiAgICAgICcjY2VkMmQ5JywgLy8gbGlnaHQgZ3JheVxuICAgICAgJyNlODQ2NDYnLCAvLyBkYXJrIHJlZFxuICAgICAgJyNmYTVmODYnLCAvLyBkYXJrIHBpbmtcbiAgICAgICcjZmZhYjFhJywgLy8gZGFyayBvcmFuZ2VcbiAgICAgICcjZmNkYTE5JywgLy8gZGFyayB5ZWxsb3dcbiAgICAgICcjNzk3YjgwJywgLy8gYmxhY2tcbiAgICAgICcjYzlkOTZmJywgLy8gcGlzdGFjY2hpb1xuICAgICAgJyM0Nzk5MWYnLCAvLyBncmVlbiAjM1xuICAgICAgJyM3MGVkZWUnLCAvLyB0dXJxdW9pc2VcbiAgICAgICcjZmY3NWVhJyAgLy8gcGlua1xuICAgIF07XG4gIH1cblxuICBmdW5jdGlvbiBjb250YWlucyhhcnJheSwgaWQpIHtcbiAgICB2YXIgZmlsdGVyID0gYXJyYXkuZmlsdGVyKGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgIHJldHVybiBlbGVtLmlkID09PSBpZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWx0ZXIubGVuZ3RoID4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRDb2xvcigpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5yZWxhdGlvbnNoaXBDb2xvcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHREYXJrZW5Db2xvcigpIHtcbiAgICByZXR1cm4gZDMucmdiKG9wdGlvbnMuY29sb3JzW29wdGlvbnMuY29sb3JzLmxlbmd0aCAtIDFdKS5kYXJrZXIoMSk7XG4gIH1cblxuICBmdW5jdGlvbiBkcmFnRW5kZWQoZCkge1xuICAgIGlmICghZDMuZXZlbnQuYWN0aXZlKSB7XG4gICAgICBzaW11bGF0aW9uLmFscGhhVGFyZ2V0KDApO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEcmFnRW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLm9uTm9kZURyYWdFbmQoZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZHJhZ2dlZChkKSB7XG4gICAgc3RpY2tOb2RlKGQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZHJhZ1N0YXJ0ZWQoZCkge1xuICAgIGlmICghZDMuZXZlbnQuYWN0aXZlKSB7XG4gICAgICBzaW11bGF0aW9uLmFscGhhVGFyZ2V0KDAuMykucmVzdGFydCgpO1xuICAgIH1cblxuICAgIGQuZnggPSBkLng7XG4gICAgZC5meSA9IGQueTtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEcmFnU3RhcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMub25Ob2RlRHJhZ1N0YXJ0KGQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dGVuZChvYmoxLCBvYmoyKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuXG4gICAgbWVyZ2Uob2JqLCBvYmoxKTtcbiAgICBtZXJnZShvYmosIG9iajIpO1xuXG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvbnRBd2Vzb21lSWNvbnMoKSB7XG4gICAgcmV0dXJuIHsnZ2xhc3MnOidmMDAwJywnbXVzaWMnOidmMDAxJywnc2VhcmNoJzonZjAwMicsJ2VudmVsb3BlLW8nOidmMDAzJywnaGVhcnQnOidmMDA0Jywnc3Rhcic6J2YwMDUnLCdzdGFyLW8nOidmMDA2JywndXNlcic6J2YwMDcnLCdmaWxtJzonZjAwOCcsJ3RoLWxhcmdlJzonZjAwOScsJ3RoJzonZjAwYScsJ3RoLWxpc3QnOidmMDBiJywnY2hlY2snOidmMDBjJywncmVtb3ZlLGNsb3NlLHRpbWVzJzonZjAwZCcsJ3NlYXJjaC1wbHVzJzonZjAwZScsJ3NlYXJjaC1taW51cyc6J2YwMTAnLCdwb3dlci1vZmYnOidmMDExJywnc2lnbmFsJzonZjAxMicsJ2dlYXIsY29nJzonZjAxMycsJ3RyYXNoLW8nOidmMDE0JywnaG9tZSc6J2YwMTUnLCdmaWxlLW8nOidmMDE2JywnY2xvY2stbyc6J2YwMTcnLCdyb2FkJzonZjAxOCcsJ2Rvd25sb2FkJzonZjAxOScsJ2Fycm93LWNpcmNsZS1vLWRvd24nOidmMDFhJywnYXJyb3ctY2lyY2xlLW8tdXAnOidmMDFiJywnaW5ib3gnOidmMDFjJywncGxheS1jaXJjbGUtbyc6J2YwMWQnLCdyb3RhdGUtcmlnaHQscmVwZWF0JzonZjAxZScsJ3JlZnJlc2gnOidmMDIxJywnbGlzdC1hbHQnOidmMDIyJywnbG9jayc6J2YwMjMnLCdmbGFnJzonZjAyNCcsJ2hlYWRwaG9uZXMnOidmMDI1Jywndm9sdW1lLW9mZic6J2YwMjYnLCd2b2x1bWUtZG93bic6J2YwMjcnLCd2b2x1bWUtdXAnOidmMDI4JywncXJjb2RlJzonZjAyOScsJ2JhcmNvZGUnOidmMDJhJywndGFnJzonZjAyYicsJ3RhZ3MnOidmMDJjJywnYm9vayc6J2YwMmQnLCdib29rbWFyayc6J2YwMmUnLCdwcmludCc6J2YwMmYnLCdjYW1lcmEnOidmMDMwJywnZm9udCc6J2YwMzEnLCdib2xkJzonZjAzMicsJ2l0YWxpYyc6J2YwMzMnLCd0ZXh0LWhlaWdodCc6J2YwMzQnLCd0ZXh0LXdpZHRoJzonZjAzNScsJ2FsaWduLWxlZnQnOidmMDM2JywnYWxpZ24tY2VudGVyJzonZjAzNycsJ2FsaWduLXJpZ2h0JzonZjAzOCcsJ2FsaWduLWp1c3RpZnknOidmMDM5JywnbGlzdCc6J2YwM2EnLCdkZWRlbnQsb3V0ZGVudCc6J2YwM2InLCdpbmRlbnQnOidmMDNjJywndmlkZW8tY2FtZXJhJzonZjAzZCcsJ3Bob3RvLGltYWdlLHBpY3R1cmUtbyc6J2YwM2UnLCdwZW5jaWwnOidmMDQwJywnbWFwLW1hcmtlcic6J2YwNDEnLCdhZGp1c3QnOidmMDQyJywndGludCc6J2YwNDMnLCdlZGl0LHBlbmNpbC1zcXVhcmUtbyc6J2YwNDQnLCdzaGFyZS1zcXVhcmUtbyc6J2YwNDUnLCdjaGVjay1zcXVhcmUtbyc6J2YwNDYnLCdhcnJvd3MnOidmMDQ3Jywnc3RlcC1iYWNrd2FyZCc6J2YwNDgnLCdmYXN0LWJhY2t3YXJkJzonZjA0OScsJ2JhY2t3YXJkJzonZjA0YScsJ3BsYXknOidmMDRiJywncGF1c2UnOidmMDRjJywnc3RvcCc6J2YwNGQnLCdmb3J3YXJkJzonZjA0ZScsJ2Zhc3QtZm9yd2FyZCc6J2YwNTAnLCdzdGVwLWZvcndhcmQnOidmMDUxJywnZWplY3QnOidmMDUyJywnY2hldnJvbi1sZWZ0JzonZjA1MycsJ2NoZXZyb24tcmlnaHQnOidmMDU0JywncGx1cy1jaXJjbGUnOidmMDU1JywnbWludXMtY2lyY2xlJzonZjA1NicsJ3RpbWVzLWNpcmNsZSc6J2YwNTcnLCdjaGVjay1jaXJjbGUnOidmMDU4JywncXVlc3Rpb24tY2lyY2xlJzonZjA1OScsJ2luZm8tY2lyY2xlJzonZjA1YScsJ2Nyb3NzaGFpcnMnOidmMDViJywndGltZXMtY2lyY2xlLW8nOidmMDVjJywnY2hlY2stY2lyY2xlLW8nOidmMDVkJywnYmFuJzonZjA1ZScsJ2Fycm93LWxlZnQnOidmMDYwJywnYXJyb3ctcmlnaHQnOidmMDYxJywnYXJyb3ctdXAnOidmMDYyJywnYXJyb3ctZG93bic6J2YwNjMnLCdtYWlsLWZvcndhcmQsc2hhcmUnOidmMDY0JywnZXhwYW5kJzonZjA2NScsJ2NvbXByZXNzJzonZjA2NicsJ3BsdXMnOidmMDY3JywnbWludXMnOidmMDY4JywnYXN0ZXJpc2snOidmMDY5JywnZXhjbGFtYXRpb24tY2lyY2xlJzonZjA2YScsJ2dpZnQnOidmMDZiJywnbGVhZic6J2YwNmMnLCdmaXJlJzonZjA2ZCcsJ2V5ZSc6J2YwNmUnLCdleWUtc2xhc2gnOidmMDcwJywnd2FybmluZyxleGNsYW1hdGlvbi10cmlhbmdsZSc6J2YwNzEnLCdwbGFuZSc6J2YwNzInLCdjYWxlbmRhcic6J2YwNzMnLCdyYW5kb20nOidmMDc0JywnY29tbWVudCc6J2YwNzUnLCdtYWduZXQnOidmMDc2JywnY2hldnJvbi11cCc6J2YwNzcnLCdjaGV2cm9uLWRvd24nOidmMDc4JywncmV0d2VldCc6J2YwNzknLCdzaG9wcGluZy1jYXJ0JzonZjA3YScsJ2ZvbGRlcic6J2YwN2InLCdmb2xkZXItb3Blbic6J2YwN2MnLCdhcnJvd3Mtdic6J2YwN2QnLCdhcnJvd3MtaCc6J2YwN2UnLCdiYXItY2hhcnQtbyxiYXItY2hhcnQnOidmMDgwJywndHdpdHRlci1zcXVhcmUnOidmMDgxJywnZmFjZWJvb2stc3F1YXJlJzonZjA4MicsJ2NhbWVyYS1yZXRybyc6J2YwODMnLCdrZXknOidmMDg0JywnZ2VhcnMsY29ncyc6J2YwODUnLCdjb21tZW50cyc6J2YwODYnLCd0aHVtYnMtby11cCc6J2YwODcnLCd0aHVtYnMtby1kb3duJzonZjA4OCcsJ3N0YXItaGFsZic6J2YwODknLCdoZWFydC1vJzonZjA4YScsJ3NpZ24tb3V0JzonZjA4YicsJ2xpbmtlZGluLXNxdWFyZSc6J2YwOGMnLCd0aHVtYi10YWNrJzonZjA4ZCcsJ2V4dGVybmFsLWxpbmsnOidmMDhlJywnc2lnbi1pbic6J2YwOTAnLCd0cm9waHknOidmMDkxJywnZ2l0aHViLXNxdWFyZSc6J2YwOTInLCd1cGxvYWQnOidmMDkzJywnbGVtb24tbyc6J2YwOTQnLCdwaG9uZSc6J2YwOTUnLCdzcXVhcmUtbyc6J2YwOTYnLCdib29rbWFyay1vJzonZjA5NycsJ3Bob25lLXNxdWFyZSc6J2YwOTgnLCd0d2l0dGVyJzonZjA5OScsJ2ZhY2Vib29rLWYsZmFjZWJvb2snOidmMDlhJywnZ2l0aHViJzonZjA5YicsJ3VubG9jayc6J2YwOWMnLCdjcmVkaXQtY2FyZCc6J2YwOWQnLCdmZWVkLHJzcyc6J2YwOWUnLCdoZGQtbyc6J2YwYTAnLCdidWxsaG9ybic6J2YwYTEnLCdiZWxsJzonZjBmMycsJ2NlcnRpZmljYXRlJzonZjBhMycsJ2hhbmQtby1yaWdodCc6J2YwYTQnLCdoYW5kLW8tbGVmdCc6J2YwYTUnLCdoYW5kLW8tdXAnOidmMGE2JywnaGFuZC1vLWRvd24nOidmMGE3JywnYXJyb3ctY2lyY2xlLWxlZnQnOidmMGE4JywnYXJyb3ctY2lyY2xlLXJpZ2h0JzonZjBhOScsJ2Fycm93LWNpcmNsZS11cCc6J2YwYWEnLCdhcnJvdy1jaXJjbGUtZG93bic6J2YwYWInLCdnbG9iZSc6J2YwYWMnLCd3cmVuY2gnOidmMGFkJywndGFza3MnOidmMGFlJywnZmlsdGVyJzonZjBiMCcsJ2JyaWVmY2FzZSc6J2YwYjEnLCdhcnJvd3MtYWx0JzonZjBiMicsJ2dyb3VwLHVzZXJzJzonZjBjMCcsJ2NoYWluLGxpbmsnOidmMGMxJywnY2xvdWQnOidmMGMyJywnZmxhc2snOidmMGMzJywnY3V0LHNjaXNzb3JzJzonZjBjNCcsJ2NvcHksZmlsZXMtbyc6J2YwYzUnLCdwYXBlcmNsaXAnOidmMGM2Jywnc2F2ZSxmbG9wcHktbyc6J2YwYzcnLCdzcXVhcmUnOidmMGM4JywnbmF2aWNvbixyZW9yZGVyLGJhcnMnOidmMGM5JywnbGlzdC11bCc6J2YwY2EnLCdsaXN0LW9sJzonZjBjYicsJ3N0cmlrZXRocm91Z2gnOidmMGNjJywndW5kZXJsaW5lJzonZjBjZCcsJ3RhYmxlJzonZjBjZScsJ21hZ2ljJzonZjBkMCcsJ3RydWNrJzonZjBkMScsJ3BpbnRlcmVzdCc6J2YwZDInLCdwaW50ZXJlc3Qtc3F1YXJlJzonZjBkMycsJ2dvb2dsZS1wbHVzLXNxdWFyZSc6J2YwZDQnLCdnb29nbGUtcGx1cyc6J2YwZDUnLCdtb25leSc6J2YwZDYnLCdjYXJldC1kb3duJzonZjBkNycsJ2NhcmV0LXVwJzonZjBkOCcsJ2NhcmV0LWxlZnQnOidmMGQ5JywnY2FyZXQtcmlnaHQnOidmMGRhJywnY29sdW1ucyc6J2YwZGInLCd1bnNvcnRlZCxzb3J0JzonZjBkYycsJ3NvcnQtZG93bixzb3J0LWRlc2MnOidmMGRkJywnc29ydC11cCxzb3J0LWFzYyc6J2YwZGUnLCdlbnZlbG9wZSc6J2YwZTAnLCdsaW5rZWRpbic6J2YwZTEnLCdyb3RhdGUtbGVmdCx1bmRvJzonZjBlMicsJ2xlZ2FsLGdhdmVsJzonZjBlMycsJ2Rhc2hib2FyZCx0YWNob21ldGVyJzonZjBlNCcsJ2NvbW1lbnQtbyc6J2YwZTUnLCdjb21tZW50cy1vJzonZjBlNicsJ2ZsYXNoLGJvbHQnOidmMGU3Jywnc2l0ZW1hcCc6J2YwZTgnLCd1bWJyZWxsYSc6J2YwZTknLCdwYXN0ZSxjbGlwYm9hcmQnOidmMGVhJywnbGlnaHRidWxiLW8nOidmMGViJywnZXhjaGFuZ2UnOidmMGVjJywnY2xvdWQtZG93bmxvYWQnOidmMGVkJywnY2xvdWQtdXBsb2FkJzonZjBlZScsJ3VzZXItbWQnOidmMGYwJywnc3RldGhvc2NvcGUnOidmMGYxJywnc3VpdGNhc2UnOidmMGYyJywnYmVsbC1vJzonZjBhMicsJ2NvZmZlZSc6J2YwZjQnLCdjdXRsZXJ5JzonZjBmNScsJ2ZpbGUtdGV4dC1vJzonZjBmNicsJ2J1aWxkaW5nLW8nOidmMGY3JywnaG9zcGl0YWwtbyc6J2YwZjgnLCdhbWJ1bGFuY2UnOidmMGY5JywnbWVka2l0JzonZjBmYScsJ2ZpZ2h0ZXItamV0JzonZjBmYicsJ2JlZXInOidmMGZjJywnaC1zcXVhcmUnOidmMGZkJywncGx1cy1zcXVhcmUnOidmMGZlJywnYW5nbGUtZG91YmxlLWxlZnQnOidmMTAwJywnYW5nbGUtZG91YmxlLXJpZ2h0JzonZjEwMScsJ2FuZ2xlLWRvdWJsZS11cCc6J2YxMDInLCdhbmdsZS1kb3VibGUtZG93bic6J2YxMDMnLCdhbmdsZS1sZWZ0JzonZjEwNCcsJ2FuZ2xlLXJpZ2h0JzonZjEwNScsJ2FuZ2xlLXVwJzonZjEwNicsJ2FuZ2xlLWRvd24nOidmMTA3JywnZGVza3RvcCc6J2YxMDgnLCdsYXB0b3AnOidmMTA5JywndGFibGV0JzonZjEwYScsJ21vYmlsZS1waG9uZSxtb2JpbGUnOidmMTBiJywnY2lyY2xlLW8nOidmMTBjJywncXVvdGUtbGVmdCc6J2YxMGQnLCdxdW90ZS1yaWdodCc6J2YxMGUnLCdzcGlubmVyJzonZjExMCcsJ2NpcmNsZSc6J2YxMTEnLCdtYWlsLXJlcGx5LHJlcGx5JzonZjExMicsJ2dpdGh1Yi1hbHQnOidmMTEzJywnZm9sZGVyLW8nOidmMTE0JywnZm9sZGVyLW9wZW4tbyc6J2YxMTUnLCdzbWlsZS1vJzonZjExOCcsJ2Zyb3duLW8nOidmMTE5JywnbWVoLW8nOidmMTFhJywnZ2FtZXBhZCc6J2YxMWInLCdrZXlib2FyZC1vJzonZjExYycsJ2ZsYWctbyc6J2YxMWQnLCdmbGFnLWNoZWNrZXJlZCc6J2YxMWUnLCd0ZXJtaW5hbCc6J2YxMjAnLCdjb2RlJzonZjEyMScsJ21haWwtcmVwbHktYWxsLHJlcGx5LWFsbCc6J2YxMjInLCdzdGFyLWhhbGYtZW1wdHksc3Rhci1oYWxmLWZ1bGwsc3Rhci1oYWxmLW8nOidmMTIzJywnbG9jYXRpb24tYXJyb3cnOidmMTI0JywnY3JvcCc6J2YxMjUnLCdjb2RlLWZvcmsnOidmMTI2JywndW5saW5rLGNoYWluLWJyb2tlbic6J2YxMjcnLCdxdWVzdGlvbic6J2YxMjgnLCdpbmZvJzonZjEyOScsJ2V4Y2xhbWF0aW9uJzonZjEyYScsJ3N1cGVyc2NyaXB0JzonZjEyYicsJ3N1YnNjcmlwdCc6J2YxMmMnLCdlcmFzZXInOidmMTJkJywncHV6emxlLXBpZWNlJzonZjEyZScsJ21pY3JvcGhvbmUnOidmMTMwJywnbWljcm9waG9uZS1zbGFzaCc6J2YxMzEnLCdzaGllbGQnOidmMTMyJywnY2FsZW5kYXItbyc6J2YxMzMnLCdmaXJlLWV4dGluZ3Vpc2hlcic6J2YxMzQnLCdyb2NrZXQnOidmMTM1JywnbWF4Y2RuJzonZjEzNicsJ2NoZXZyb24tY2lyY2xlLWxlZnQnOidmMTM3JywnY2hldnJvbi1jaXJjbGUtcmlnaHQnOidmMTM4JywnY2hldnJvbi1jaXJjbGUtdXAnOidmMTM5JywnY2hldnJvbi1jaXJjbGUtZG93bic6J2YxM2EnLCdodG1sNSc6J2YxM2InLCdjc3MzJzonZjEzYycsJ2FuY2hvcic6J2YxM2QnLCd1bmxvY2stYWx0JzonZjEzZScsJ2J1bGxzZXllJzonZjE0MCcsJ2VsbGlwc2lzLWgnOidmMTQxJywnZWxsaXBzaXMtdic6J2YxNDInLCdyc3Mtc3F1YXJlJzonZjE0MycsJ3BsYXktY2lyY2xlJzonZjE0NCcsJ3RpY2tldCc6J2YxNDUnLCdtaW51cy1zcXVhcmUnOidmMTQ2JywnbWludXMtc3F1YXJlLW8nOidmMTQ3JywnbGV2ZWwtdXAnOidmMTQ4JywnbGV2ZWwtZG93bic6J2YxNDknLCdjaGVjay1zcXVhcmUnOidmMTRhJywncGVuY2lsLXNxdWFyZSc6J2YxNGInLCdleHRlcm5hbC1saW5rLXNxdWFyZSc6J2YxNGMnLCdzaGFyZS1zcXVhcmUnOidmMTRkJywnY29tcGFzcyc6J2YxNGUnLCd0b2dnbGUtZG93bixjYXJldC1zcXVhcmUtby1kb3duJzonZjE1MCcsJ3RvZ2dsZS11cCxjYXJldC1zcXVhcmUtby11cCc6J2YxNTEnLCd0b2dnbGUtcmlnaHQsY2FyZXQtc3F1YXJlLW8tcmlnaHQnOidmMTUyJywnZXVybyxldXInOidmMTUzJywnZ2JwJzonZjE1NCcsJ2RvbGxhcix1c2QnOidmMTU1JywncnVwZWUsaW5yJzonZjE1NicsJ2NueSxybWIseWVuLGpweSc6J2YxNTcnLCdydWJsZSxyb3VibGUscnViJzonZjE1OCcsJ3dvbixrcncnOidmMTU5JywnYml0Y29pbixidGMnOidmMTVhJywnZmlsZSc6J2YxNWInLCdmaWxlLXRleHQnOidmMTVjJywnc29ydC1hbHBoYS1hc2MnOidmMTVkJywnc29ydC1hbHBoYS1kZXNjJzonZjE1ZScsJ3NvcnQtYW1vdW50LWFzYyc6J2YxNjAnLCdzb3J0LWFtb3VudC1kZXNjJzonZjE2MScsJ3NvcnQtbnVtZXJpYy1hc2MnOidmMTYyJywnc29ydC1udW1lcmljLWRlc2MnOidmMTYzJywndGh1bWJzLXVwJzonZjE2NCcsJ3RodW1icy1kb3duJzonZjE2NScsJ3lvdXR1YmUtc3F1YXJlJzonZjE2NicsJ3lvdXR1YmUnOidmMTY3JywneGluZyc6J2YxNjgnLCd4aW5nLXNxdWFyZSc6J2YxNjknLCd5b3V0dWJlLXBsYXknOidmMTZhJywnZHJvcGJveCc6J2YxNmInLCdzdGFjay1vdmVyZmxvdyc6J2YxNmMnLCdpbnN0YWdyYW0nOidmMTZkJywnZmxpY2tyJzonZjE2ZScsJ2Fkbic6J2YxNzAnLCdiaXRidWNrZXQnOidmMTcxJywnYml0YnVja2V0LXNxdWFyZSc6J2YxNzInLCd0dW1ibHInOidmMTczJywndHVtYmxyLXNxdWFyZSc6J2YxNzQnLCdsb25nLWFycm93LWRvd24nOidmMTc1JywnbG9uZy1hcnJvdy11cCc6J2YxNzYnLCdsb25nLWFycm93LWxlZnQnOidmMTc3JywnbG9uZy1hcnJvdy1yaWdodCc6J2YxNzgnLCdhcHBsZSc6J2YxNzknLCd3aW5kb3dzJzonZjE3YScsJ2FuZHJvaWQnOidmMTdiJywnbGludXgnOidmMTdjJywnZHJpYmJibGUnOidmMTdkJywnc2t5cGUnOidmMTdlJywnZm91cnNxdWFyZSc6J2YxODAnLCd0cmVsbG8nOidmMTgxJywnZmVtYWxlJzonZjE4MicsJ21hbGUnOidmMTgzJywnZ2l0dGlwLGdyYXRpcGF5JzonZjE4NCcsJ3N1bi1vJzonZjE4NScsJ21vb24tbyc6J2YxODYnLCdhcmNoaXZlJzonZjE4NycsJ2J1Zyc6J2YxODgnLCd2ayc6J2YxODknLCd3ZWlibyc6J2YxOGEnLCdyZW5yZW4nOidmMThiJywncGFnZWxpbmVzJzonZjE4YycsJ3N0YWNrLWV4Y2hhbmdlJzonZjE4ZCcsJ2Fycm93LWNpcmNsZS1vLXJpZ2h0JzonZjE4ZScsJ2Fycm93LWNpcmNsZS1vLWxlZnQnOidmMTkwJywndG9nZ2xlLWxlZnQsY2FyZXQtc3F1YXJlLW8tbGVmdCc6J2YxOTEnLCdkb3QtY2lyY2xlLW8nOidmMTkyJywnd2hlZWxjaGFpcic6J2YxOTMnLCd2aW1lby1zcXVhcmUnOidmMTk0JywndHVya2lzaC1saXJhLHRyeSc6J2YxOTUnLCdwbHVzLXNxdWFyZS1vJzonZjE5NicsJ3NwYWNlLXNodXR0bGUnOidmMTk3Jywnc2xhY2snOidmMTk4JywnZW52ZWxvcGUtc3F1YXJlJzonZjE5OScsJ3dvcmRwcmVzcyc6J2YxOWEnLCdvcGVuaWQnOidmMTliJywnaW5zdGl0dXRpb24sYmFuayx1bml2ZXJzaXR5JzonZjE5YycsJ21vcnRhci1ib2FyZCxncmFkdWF0aW9uLWNhcCc6J2YxOWQnLCd5YWhvbyc6J2YxOWUnLCdnb29nbGUnOidmMWEwJywncmVkZGl0JzonZjFhMScsJ3JlZGRpdC1zcXVhcmUnOidmMWEyJywnc3R1bWJsZXVwb24tY2lyY2xlJzonZjFhMycsJ3N0dW1ibGV1cG9uJzonZjFhNCcsJ2RlbGljaW91cyc6J2YxYTUnLCdkaWdnJzonZjFhNicsJ3BpZWQtcGlwZXItcHAnOidmMWE3JywncGllZC1waXBlci1hbHQnOidmMWE4JywnZHJ1cGFsJzonZjFhOScsJ2pvb21sYSc6J2YxYWEnLCdsYW5ndWFnZSc6J2YxYWInLCdmYXgnOidmMWFjJywnYnVpbGRpbmcnOidmMWFkJywnY2hpbGQnOidmMWFlJywncGF3JzonZjFiMCcsJ3Nwb29uJzonZjFiMScsJ2N1YmUnOidmMWIyJywnY3ViZXMnOidmMWIzJywnYmVoYW5jZSc6J2YxYjQnLCdiZWhhbmNlLXNxdWFyZSc6J2YxYjUnLCdzdGVhbSc6J2YxYjYnLCdzdGVhbS1zcXVhcmUnOidmMWI3JywncmVjeWNsZSc6J2YxYjgnLCdhdXRvbW9iaWxlLGNhcic6J2YxYjknLCdjYWIsdGF4aSc6J2YxYmEnLCd0cmVlJzonZjFiYicsJ3Nwb3RpZnknOidmMWJjJywnZGV2aWFudGFydCc6J2YxYmQnLCdzb3VuZGNsb3VkJzonZjFiZScsJ2RhdGFiYXNlJzonZjFjMCcsJ2ZpbGUtcGRmLW8nOidmMWMxJywnZmlsZS13b3JkLW8nOidmMWMyJywnZmlsZS1leGNlbC1vJzonZjFjMycsJ2ZpbGUtcG93ZXJwb2ludC1vJzonZjFjNCcsJ2ZpbGUtcGhvdG8tbyxmaWxlLXBpY3R1cmUtbyxmaWxlLWltYWdlLW8nOidmMWM1JywnZmlsZS16aXAtbyxmaWxlLWFyY2hpdmUtbyc6J2YxYzYnLCdmaWxlLXNvdW5kLW8sZmlsZS1hdWRpby1vJzonZjFjNycsJ2ZpbGUtbW92aWUtbyxmaWxlLXZpZGVvLW8nOidmMWM4JywnZmlsZS1jb2RlLW8nOidmMWM5JywndmluZSc6J2YxY2EnLCdjb2RlcGVuJzonZjFjYicsJ2pzZmlkZGxlJzonZjFjYycsJ2xpZmUtYm91eSxsaWZlLWJ1b3ksbGlmZS1zYXZlcixzdXBwb3J0LGxpZmUtcmluZyc6J2YxY2QnLCdjaXJjbGUtby1ub3RjaCc6J2YxY2UnLCdyYSxyZXNpc3RhbmNlLHJlYmVsJzonZjFkMCcsJ2dlLGVtcGlyZSc6J2YxZDEnLCdnaXQtc3F1YXJlJzonZjFkMicsJ2dpdCc6J2YxZDMnLCd5LWNvbWJpbmF0b3Itc3F1YXJlLHljLXNxdWFyZSxoYWNrZXItbmV3cyc6J2YxZDQnLCd0ZW5jZW50LXdlaWJvJzonZjFkNScsJ3FxJzonZjFkNicsJ3dlY2hhdCx3ZWl4aW4nOidmMWQ3Jywnc2VuZCxwYXBlci1wbGFuZSc6J2YxZDgnLCdzZW5kLW8scGFwZXItcGxhbmUtbyc6J2YxZDknLCdoaXN0b3J5JzonZjFkYScsJ2NpcmNsZS10aGluJzonZjFkYicsJ2hlYWRlcic6J2YxZGMnLCdwYXJhZ3JhcGgnOidmMWRkJywnc2xpZGVycyc6J2YxZGUnLCdzaGFyZS1hbHQnOidmMWUwJywnc2hhcmUtYWx0LXNxdWFyZSc6J2YxZTEnLCdib21iJzonZjFlMicsJ3NvY2Nlci1iYWxsLW8sZnV0Ym9sLW8nOidmMWUzJywndHR5JzonZjFlNCcsJ2Jpbm9jdWxhcnMnOidmMWU1JywncGx1Zyc6J2YxZTYnLCdzbGlkZXNoYXJlJzonZjFlNycsJ3R3aXRjaCc6J2YxZTgnLCd5ZWxwJzonZjFlOScsJ25ld3NwYXBlci1vJzonZjFlYScsJ3dpZmknOidmMWViJywnY2FsY3VsYXRvcic6J2YxZWMnLCdwYXlwYWwnOidmMWVkJywnZ29vZ2xlLXdhbGxldCc6J2YxZWUnLCdjYy12aXNhJzonZjFmMCcsJ2NjLW1hc3RlcmNhcmQnOidmMWYxJywnY2MtZGlzY292ZXInOidmMWYyJywnY2MtYW1leCc6J2YxZjMnLCdjYy1wYXlwYWwnOidmMWY0JywnY2Mtc3RyaXBlJzonZjFmNScsJ2JlbGwtc2xhc2gnOidmMWY2JywnYmVsbC1zbGFzaC1vJzonZjFmNycsJ3RyYXNoJzonZjFmOCcsJ2NvcHlyaWdodCc6J2YxZjknLCdhdCc6J2YxZmEnLCdleWVkcm9wcGVyJzonZjFmYicsJ3BhaW50LWJydXNoJzonZjFmYycsJ2JpcnRoZGF5LWNha2UnOidmMWZkJywnYXJlYS1jaGFydCc6J2YxZmUnLCdwaWUtY2hhcnQnOidmMjAwJywnbGluZS1jaGFydCc6J2YyMDEnLCdsYXN0Zm0nOidmMjAyJywnbGFzdGZtLXNxdWFyZSc6J2YyMDMnLCd0b2dnbGUtb2ZmJzonZjIwNCcsJ3RvZ2dsZS1vbic6J2YyMDUnLCdiaWN5Y2xlJzonZjIwNicsJ2J1cyc6J2YyMDcnLCdpb3hob3N0JzonZjIwOCcsJ2FuZ2VsbGlzdCc6J2YyMDknLCdjYyc6J2YyMGEnLCdzaGVrZWwsc2hlcWVsLGlscyc6J2YyMGInLCdtZWFucGF0aCc6J2YyMGMnLCdidXlzZWxsYWRzJzonZjIwZCcsJ2Nvbm5lY3RkZXZlbG9wJzonZjIwZScsJ2Rhc2hjdWJlJzonZjIxMCcsJ2ZvcnVtYmVlJzonZjIxMScsJ2xlYW5wdWInOidmMjEyJywnc2VsbHN5JzonZjIxMycsJ3NoaXJ0c2luYnVsayc6J2YyMTQnLCdzaW1wbHlidWlsdCc6J2YyMTUnLCdza3lhdGxhcyc6J2YyMTYnLCdjYXJ0LXBsdXMnOidmMjE3JywnY2FydC1hcnJvdy1kb3duJzonZjIxOCcsJ2RpYW1vbmQnOidmMjE5Jywnc2hpcCc6J2YyMWEnLCd1c2VyLXNlY3JldCc6J2YyMWInLCdtb3RvcmN5Y2xlJzonZjIxYycsJ3N0cmVldC12aWV3JzonZjIxZCcsJ2hlYXJ0YmVhdCc6J2YyMWUnLCd2ZW51cyc6J2YyMjEnLCdtYXJzJzonZjIyMicsJ21lcmN1cnknOidmMjIzJywnaW50ZXJzZXgsdHJhbnNnZW5kZXInOidmMjI0JywndHJhbnNnZW5kZXItYWx0JzonZjIyNScsJ3ZlbnVzLWRvdWJsZSc6J2YyMjYnLCdtYXJzLWRvdWJsZSc6J2YyMjcnLCd2ZW51cy1tYXJzJzonZjIyOCcsJ21hcnMtc3Ryb2tlJzonZjIyOScsJ21hcnMtc3Ryb2tlLXYnOidmMjJhJywnbWFycy1zdHJva2UtaCc6J2YyMmInLCduZXV0ZXInOidmMjJjJywnZ2VuZGVybGVzcyc6J2YyMmQnLCdmYWNlYm9vay1vZmZpY2lhbCc6J2YyMzAnLCdwaW50ZXJlc3QtcCc6J2YyMzEnLCd3aGF0c2FwcCc6J2YyMzInLCdzZXJ2ZXInOidmMjMzJywndXNlci1wbHVzJzonZjIzNCcsJ3VzZXItdGltZXMnOidmMjM1JywnaG90ZWwsYmVkJzonZjIzNicsJ3ZpYWNvaW4nOidmMjM3JywndHJhaW4nOidmMjM4Jywnc3Vid2F5JzonZjIzOScsJ21lZGl1bSc6J2YyM2EnLCd5Yyx5LWNvbWJpbmF0b3InOidmMjNiJywnb3B0aW4tbW9uc3Rlcic6J2YyM2MnLCdvcGVuY2FydCc6J2YyM2QnLCdleHBlZGl0ZWRzc2wnOidmMjNlJywnYmF0dGVyeS00LGJhdHRlcnktZnVsbCc6J2YyNDAnLCdiYXR0ZXJ5LTMsYmF0dGVyeS10aHJlZS1xdWFydGVycyc6J2YyNDEnLCdiYXR0ZXJ5LTIsYmF0dGVyeS1oYWxmJzonZjI0MicsJ2JhdHRlcnktMSxiYXR0ZXJ5LXF1YXJ0ZXInOidmMjQzJywnYmF0dGVyeS0wLGJhdHRlcnktZW1wdHknOidmMjQ0JywnbW91c2UtcG9pbnRlcic6J2YyNDUnLCdpLWN1cnNvcic6J2YyNDYnLCdvYmplY3QtZ3JvdXAnOidmMjQ3Jywnb2JqZWN0LXVuZ3JvdXAnOidmMjQ4Jywnc3RpY2t5LW5vdGUnOidmMjQ5Jywnc3RpY2t5LW5vdGUtbyc6J2YyNGEnLCdjYy1qY2InOidmMjRiJywnY2MtZGluZXJzLWNsdWInOidmMjRjJywnY2xvbmUnOidmMjRkJywnYmFsYW5jZS1zY2FsZSc6J2YyNGUnLCdob3VyZ2xhc3Mtbyc6J2YyNTAnLCdob3VyZ2xhc3MtMSxob3VyZ2xhc3Mtc3RhcnQnOidmMjUxJywnaG91cmdsYXNzLTIsaG91cmdsYXNzLWhhbGYnOidmMjUyJywnaG91cmdsYXNzLTMsaG91cmdsYXNzLWVuZCc6J2YyNTMnLCdob3VyZ2xhc3MnOidmMjU0JywnaGFuZC1ncmFiLW8saGFuZC1yb2NrLW8nOidmMjU1JywnaGFuZC1zdG9wLW8saGFuZC1wYXBlci1vJzonZjI1NicsJ2hhbmQtc2Npc3NvcnMtbyc6J2YyNTcnLCdoYW5kLWxpemFyZC1vJzonZjI1OCcsJ2hhbmQtc3BvY2stbyc6J2YyNTknLCdoYW5kLXBvaW50ZXItbyc6J2YyNWEnLCdoYW5kLXBlYWNlLW8nOidmMjViJywndHJhZGVtYXJrJzonZjI1YycsJ3JlZ2lzdGVyZWQnOidmMjVkJywnY3JlYXRpdmUtY29tbW9ucyc6J2YyNWUnLCdnZyc6J2YyNjAnLCdnZy1jaXJjbGUnOidmMjYxJywndHJpcGFkdmlzb3InOidmMjYyJywnb2Rub2tsYXNzbmlraSc6J2YyNjMnLCdvZG5va2xhc3NuaWtpLXNxdWFyZSc6J2YyNjQnLCdnZXQtcG9ja2V0JzonZjI2NScsJ3dpa2lwZWRpYS13JzonZjI2NicsJ3NhZmFyaSc6J2YyNjcnLCdjaHJvbWUnOidmMjY4JywnZmlyZWZveCc6J2YyNjknLCdvcGVyYSc6J2YyNmEnLCdpbnRlcm5ldC1leHBsb3Jlcic6J2YyNmInLCd0dix0ZWxldmlzaW9uJzonZjI2YycsJ2NvbnRhbyc6J2YyNmQnLCc1MDBweCc6J2YyNmUnLCdhbWF6b24nOidmMjcwJywnY2FsZW5kYXItcGx1cy1vJzonZjI3MScsJ2NhbGVuZGFyLW1pbnVzLW8nOidmMjcyJywnY2FsZW5kYXItdGltZXMtbyc6J2YyNzMnLCdjYWxlbmRhci1jaGVjay1vJzonZjI3NCcsJ2luZHVzdHJ5JzonZjI3NScsJ21hcC1waW4nOidmMjc2JywnbWFwLXNpZ25zJzonZjI3NycsJ21hcC1vJzonZjI3OCcsJ21hcCc6J2YyNzknLCdjb21tZW50aW5nJzonZjI3YScsJ2NvbW1lbnRpbmctbyc6J2YyN2InLCdob3V6eic6J2YyN2MnLCd2aW1lbyc6J2YyN2QnLCdibGFjay10aWUnOidmMjdlJywnZm9udGljb25zJzonZjI4MCcsJ3JlZGRpdC1hbGllbic6J2YyODEnLCdlZGdlJzonZjI4MicsJ2NyZWRpdC1jYXJkLWFsdCc6J2YyODMnLCdjb2RpZXBpZSc6J2YyODQnLCdtb2R4JzonZjI4NScsJ2ZvcnQtYXdlc29tZSc6J2YyODYnLCd1c2InOidmMjg3JywncHJvZHVjdC1odW50JzonZjI4OCcsJ21peGNsb3VkJzonZjI4OScsJ3NjcmliZCc6J2YyOGEnLCdwYXVzZS1jaXJjbGUnOidmMjhiJywncGF1c2UtY2lyY2xlLW8nOidmMjhjJywnc3RvcC1jaXJjbGUnOidmMjhkJywnc3RvcC1jaXJjbGUtbyc6J2YyOGUnLCdzaG9wcGluZy1iYWcnOidmMjkwJywnc2hvcHBpbmctYmFza2V0JzonZjI5MScsJ2hhc2h0YWcnOidmMjkyJywnYmx1ZXRvb3RoJzonZjI5MycsJ2JsdWV0b290aC1iJzonZjI5NCcsJ3BlcmNlbnQnOidmMjk1JywnZ2l0bGFiJzonZjI5NicsJ3dwYmVnaW5uZXInOidmMjk3Jywnd3Bmb3Jtcyc6J2YyOTgnLCdlbnZpcmEnOidmMjk5JywndW5pdmVyc2FsLWFjY2Vzcyc6J2YyOWEnLCd3aGVlbGNoYWlyLWFsdCc6J2YyOWInLCdxdWVzdGlvbi1jaXJjbGUtbyc6J2YyOWMnLCdibGluZCc6J2YyOWQnLCdhdWRpby1kZXNjcmlwdGlvbic6J2YyOWUnLCd2b2x1bWUtY29udHJvbC1waG9uZSc6J2YyYTAnLCdicmFpbGxlJzonZjJhMScsJ2Fzc2lzdGl2ZS1saXN0ZW5pbmctc3lzdGVtcyc6J2YyYTInLCdhc2wtaW50ZXJwcmV0aW5nLGFtZXJpY2FuLXNpZ24tbGFuZ3VhZ2UtaW50ZXJwcmV0aW5nJzonZjJhMycsJ2RlYWZuZXNzLGhhcmQtb2YtaGVhcmluZyxkZWFmJzonZjJhNCcsJ2dsaWRlJzonZjJhNScsJ2dsaWRlLWcnOidmMmE2Jywnc2lnbmluZyxzaWduLWxhbmd1YWdlJzonZjJhNycsJ2xvdy12aXNpb24nOidmMmE4JywndmlhZGVvJzonZjJhOScsJ3ZpYWRlby1zcXVhcmUnOidmMmFhJywnc25hcGNoYXQnOidmMmFiJywnc25hcGNoYXQtZ2hvc3QnOidmMmFjJywnc25hcGNoYXQtc3F1YXJlJzonZjJhZCcsJ3BpZWQtcGlwZXInOidmMmFlJywnZmlyc3Qtb3JkZXInOidmMmIwJywneW9hc3QnOidmMmIxJywndGhlbWVpc2xlJzonZjJiMicsJ2dvb2dsZS1wbHVzLWNpcmNsZSxnb29nbGUtcGx1cy1vZmZpY2lhbCc6J2YyYjMnLCdmYSxmb250LWF3ZXNvbWUnOidmMmI0J307XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaWNvbihkKSB7XG4gICAgICB2YXIgY29kZTtcblxuICAgICAgaWYgKG9wdGlvbnMuaWNvbk1hcCAmJiBvcHRpb25zLnNob3dJY29ucyAmJiBvcHRpb25zLmljb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXSAmJiBvcHRpb25zLmljb25NYXBbb3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV1dKSB7XG4gICAgICAgICAgY29kZSA9IG9wdGlvbnMuaWNvbk1hcFtvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXV07XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pY29uTWFwW2QubGFiZWxzWzBdXSkge1xuICAgICAgICAgIGNvZGUgPSBvcHRpb25zLmljb25NYXBbZC5sYWJlbHNbMF1dO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dKSB7XG4gICAgICAgICAgY29kZSA9IG9wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb2RlO1xuICAgIH1cblxuZnVuY3Rpb24gaW1hZ2UoZCkge1xuICB2YXIgaSwgaW1hZ2VzRm9yTGFiZWwsIGltZywgaW1nTGV2ZWwsIGxhYmVsLCBsYWJlbFByb3BlcnR5VmFsdWUsIHByb3BlcnR5LCB2YWx1ZTtcblxuICBpZiAob3B0aW9ucy5pbWFnZXMpIHtcbiAgICBpbWFnZXNGb3JMYWJlbCA9IG9wdGlvbnMuaW1hZ2VNYXBbZC5sYWJlbHNbMF1dO1xuXG4gICAgaWYgKGltYWdlc0ZvckxhYmVsKSB7XG4gICAgICBpbWdMZXZlbCA9IDA7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpbWFnZXNGb3JMYWJlbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsYWJlbFByb3BlcnR5VmFsdWUgPSBpbWFnZXNGb3JMYWJlbFtpXS5zcGxpdCgnfCcpO1xuXG4gICAgICAgIHN3aXRjaCAobGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHZhbHVlID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzJdO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHByb3BlcnR5ID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzFdO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIGxhYmVsID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGQubGFiZWxzWzBdID09PSBsYWJlbCAmJlxuICAgICAgICAgICghcHJvcGVydHkgfHwgZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSAmJlxuICAgICAgICAgICghdmFsdWUgfHwgZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSA9PT0gdmFsdWUpKSB7XG4gICAgICAgICAgaWYgKGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGggPiBpbWdMZXZlbCkge1xuICAgICAgICAgICAgaW1nID0gb3B0aW9ucy5pbWFnZXNbaW1hZ2VzRm9yTGFiZWxbaV1dO1xuICAgICAgICAgICAgaW1nTGV2ZWwgPSBsYWJlbFByb3BlcnR5VmFsdWUubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbWc7XG59XG5cbmZ1bmN0aW9uIGluaXQoX3NlbGVjdG9yLCBfb3B0aW9ucykge1xuICBpbml0SWNvbk1hcCgpO1xuXG4gIG1lcmdlKG9wdGlvbnMsIF9vcHRpb25zKTtcblxuICBpZiAob3B0aW9ucy5pY29ucykge1xuICAgIG9wdGlvbnMuc2hvd0ljb25zID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICghb3B0aW9ucy5taW5Db2xsaXNpb24pIHtcbiAgICBvcHRpb25zLm1pbkNvbGxpc2lvbiA9IG9wdGlvbnMubm9kZVJhZGl1cyAqIDI7XG4gIH1cblxuICBpbml0SW1hZ2VNYXAoKTtcblxuICBzZWxlY3RvciA9IF9zZWxlY3RvcjtcblxuICBjb250YWluZXIgPSBkMy5zZWxlY3Qoc2VsZWN0b3IpO1xuXG4gIGNvbnRhaW5lci5hdHRyKCdjbGFzcycsICduZW80amQzJylcbiAgICAuaHRtbCgnJyk7XG5cbiAgaWYgKG9wdGlvbnMuaW5mb1BhbmVsKSB7XG4gICAgaW5mbyA9IGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpO1xuICB9XG5cbiAgYXBwZW5kR3JhcGgoY29udGFpbmVyKTtcblxuICBzaW11bGF0aW9uID0gaW5pdFNpbXVsYXRpb24oKTtcblxuXG4gIGlmIChvcHRpb25zLm5lbzRqRGF0YSkge1xuICAgIGxvYWROZW80akRhdGEob3B0aW9ucy5uZW80akRhdGEpO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMubmVvNGpEYXRhVXJsKSB7XG4gICAgbG9hZE5lbzRqRGF0YUZyb21Vcmwob3B0aW9ucy5uZW80akRhdGFVcmwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBib3RoIG5lbzRqRGF0YSBhbmQgbmVvNGpEYXRhVXJsIGFyZSBlbXB0eSEnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0SWNvbk1hcCgpIHtcbiAgT2JqZWN0LmtleXMob3B0aW9ucy5pY29uTWFwKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcbiAgICB2YXIga2V5cyA9IGtleS5zcGxpdCgnLCcpLFxuICAgICAgdmFsdWUgPSBvcHRpb25zLmljb25NYXBba2V5XTtcblxuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIG9wdGlvbnMuaWNvbk1hcFtrZXldID0gdmFsdWU7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0SW1hZ2VNYXAoKSB7XG4gIHZhciBrZXksIGtleXMsIHNlbGVjdG9yO1xuXG4gIGZvciAoa2V5IGluIG9wdGlvbnMuaW1hZ2VzKSB7XG4gICAgaWYgKG9wdGlvbnMuaW1hZ2VzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGtleXMgPSBrZXkuc3BsaXQoJ3wnKTtcblxuICAgICAgaWYgKCFvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dKSB7XG4gICAgICAgIG9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0gPSBba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0ucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0U2ltdWxhdGlvbigpIHtcbiAgdmFyIHNwcmVhZEZhY3RvciA9IDEuMjU7XG4gIHZhciBzaW11bGF0aW9uID0gZDMuZm9yY2VTaW11bGF0aW9uKClcbiAgLy8uZm9yY2UoJ3gnLCBkMy5mb3JjZUNvbGxpZGUoKS5zdHJlbmd0aCgwLjAwMikpXG4gIC8vLmZvcmNlKCd5JywgZDMuZm9yY2VDb2xsaWRlKCkuc3RyZW5ndGgoMC4wMDIpKVxuICAvLy5mb3JjZSgneScsIGQzLmZvcmNlKCkuc3RyZW5ndGgoMC4wMDIpKVxuICAgIC5mb3JjZSgnY29sbGlkZScsIGQzLmZvcmNlQ29sbGlkZSgpLnJhZGl1cyhmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5taW5Db2xsaXNpb24gKiBzcHJlYWRGYWN0b3I7XG4gICAgfSkuaXRlcmF0aW9ucygxMCkpXG4gICAgLmZvcmNlKCdjaGFyZ2UnLCBkMy5mb3JjZU1hbnlCb2R5KCkpXG4gICAgLmZvcmNlKCdsaW5rJywgZDMuZm9yY2VMaW5rKCkuaWQoZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQuaWQ7XG4gICAgfSkpXG4gICAgLmZvcmNlKCdjZW50ZXInLCBkMy5mb3JjZUNlbnRlcihzdmcubm9kZSgpLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5jbGllbnRXaWR0aCAvIDIsIHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDIpKVxuICAgIC5vbigndGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgdGljaygpO1xuICAgIH0pXG4gICAgLm9uKCdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChvcHRpb25zLnpvb21GaXQgJiYgIWp1c3RMb2FkZWQpIHtcbiAgICAgICAganVzdExvYWRlZCA9IHRydWU7XG4gICAgICAgIHpvb21GaXQoMik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgcmV0dXJuIHNpbXVsYXRpb247XG59XG5cbmZ1bmN0aW9uIGxvYWROZW80akRhdGEoKSB7XG4gIG5vZGVzID0gW107XG4gIHJlbGF0aW9uc2hpcHMgPSBbXTtcblxuICB1cGRhdGVXaXRoTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcbn1cblxuZnVuY3Rpb24gbG9hZE5lbzRqRGF0YUZyb21VcmwobmVvNGpEYXRhVXJsKSB7XG4gIG5vZGVzID0gW107XG4gIHJlbGF0aW9uc2hpcHMgPSBbXTtcblxuICBkMy5qc29uKG5lbzRqRGF0YVVybCwgZnVuY3Rpb24oZXJyb3IsIGRhdGEpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIHVwZGF0ZVdpdGhOZW80akRhdGEoZGF0YSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtZXJnZSh0YXJnZXQsIHNvdXJjZSkge1xuICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICB0YXJnZXRbcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG5lbzRqRGF0YVRvRDNEYXRhKGRhdGEpIHtcbiAgdmFyIGdyYXBoID0ge1xuICAgIG5vZGVzOiBbXSxcbiAgICByZWxhdGlvbnNoaXBzOiBbXVxuICB9O1xuXG4gIGRhdGEucmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJlc3VsdC5kYXRhLmZvckVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgZGF0YS5ncmFwaC5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKCFjb250YWlucyhncmFwaC5ub2Rlcywgbm9kZS5pZCkpIHtcbiAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmZvckVhY2goZnVuY3Rpb24ocmVsYXRpb25zaGlwKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcC5zb3VyY2UgPSByZWxhdGlvbnNoaXAuc3RhcnROb2RlO1xuICAgICAgICByZWxhdGlvbnNoaXAudGFyZ2V0ID0gcmVsYXRpb25zaGlwLmVuZE5vZGU7XG4gICAgICAgIGdyYXBoLnJlbGF0aW9uc2hpcHMucHVzaChyZWxhdGlvbnNoaXApO1xuICAgICAgfSk7XG5cbiAgICAgIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgaWYgKGEuc291cmNlID4gYi5zb3VyY2UpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIGlmIChhLnNvdXJjZSA8IGIuc291cmNlKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhLnRhcmdldCA+IGIudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS50YXJnZXQgPCBiLnRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaSAhPT0gMCAmJiBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0uc291cmNlID09PSBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaS0xXS5zb3VyY2UgJiYgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLnRhcmdldCA9PT0gZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ktMV0udGFyZ2V0KSB7XG4gICAgICAgICAgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLmxpbmtudW0gPSBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaSAtIDFdLmxpbmtudW0gKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS5saW5rbnVtID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gZ3JhcGg7XG59XG5cbmZ1bmN0aW9uIHJvdGF0ZShjeCwgY3ksIHgsIHksIGFuZ2xlKSB7XG4gIHZhciByYWRpYW5zID0gKE1hdGguUEkgLyAxODApICogYW5nbGUsXG4gICAgY29zID0gTWF0aC5jb3MocmFkaWFucyksXG4gICAgc2luID0gTWF0aC5zaW4ocmFkaWFucyksXG4gICAgbnggPSAoY29zICogKHggLSBjeCkpICsgKHNpbiAqICh5IC0gY3kpKSArIGN4LFxuICAgIG55ID0gKGNvcyAqICh5IC0gY3kpKSAtIChzaW4gKiAoeCAtIGN4KSkgKyBjeTtcblxuICByZXR1cm4geyB4OiBueCwgeTogbnkgfTtcbn1cblxuZnVuY3Rpb24gcm90YXRlUG9pbnQoYywgcCwgYW5nbGUpIHtcbiAgcmV0dXJuIHJvdGF0ZShjLngsIGMueSwgcC54LCBwLnksIGFuZ2xlKTtcbn1cblxuZnVuY3Rpb24gcm90YXRpb24oc291cmNlLCB0YXJnZXQpIHtcbiAgcmV0dXJuIE1hdGguYXRhbjIodGFyZ2V0LnkgLSBzb3VyY2UueSwgdGFyZ2V0LnggLSBzb3VyY2UueCkgKiAxODAgLyBNYXRoLlBJO1xufVxuXG5mdW5jdGlvbiBzaXplKCkge1xuICByZXR1cm4ge1xuICAgIG5vZGVzOiBub2Rlcy5sZW5ndGgsXG4gICAgcmVsYXRpb25zaGlwczogcmVsYXRpb25zaGlwcy5sZW5ndGhcbiAgfTtcbn1cbi8qXG4gICAgZnVuY3Rpb24gc21vb3RoVHJhbnNmb3JtKGVsZW0sIHRyYW5zbGF0ZSwgc2NhbGUpIHtcbiAgICAgICAgdmFyIGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9IDUwMDAsXG4gICAgICAgICAgICB0aW1lb3V0TWlsbGlzZWNvbmRzID0gNTAsXG4gICAgICAgICAgICBzdGVwcyA9IHBhcnNlSW50KGFuaW1hdGlvbk1pbGxpc2Vjb25kcyAvIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzbW9vdGhUcmFuc2Zvcm1TdGVwKGVsZW0sIHRyYW5zbGF0ZSwgc2NhbGUsIHRpbWVvdXRNaWxsaXNlY29uZHMsIDEsIHN0ZXBzKTtcbiAgICAgICAgfSwgdGltZW91dE1pbGxpc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCBzdGVwLCBzdGVwcykge1xuICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBzdGVwIC8gc3RlcHM7XG5cbiAgICAgICAgZWxlbS5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyAodHJhbnNsYXRlWzBdICogcHJvZ3Jlc3MpICsgJywgJyArICh0cmFuc2xhdGVbMV0gKiBwcm9ncmVzcykgKyAnKSBzY2FsZSgnICsgKHNjYWxlICogcHJvZ3Jlc3MpICsgJyknKTtcblxuICAgICAgICBpZiAoc3RlcCA8IHN0ZXBzKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNtb290aFRyYW5zZm9ybVN0ZXAoZWxlbSwgdHJhbnNsYXRlLCBzY2FsZSwgdGltZW91dE1pbGxpc2Vjb25kcywgc3RlcCArIDEsIHN0ZXBzKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgICovXG5mdW5jdGlvbiBzdGlja05vZGUoZCkge1xuICBkLmZ4ID0gZDMuZXZlbnQueDtcbiAgZC5meSA9IGQzLmV2ZW50Lnk7XG59XG5cbmZ1bmN0aW9uIHRpY2soKSB7XG4gIHRpY2tOb2RlcygpO1xuICB0aWNrUmVsYXRpb25zaGlwcygpO1xufVxuXG5mdW5jdGlvbiB0aWNrTm9kZXMoKSB7XG4gIGlmIChub2RlKSB7XG4gICAgbm9kZS5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgZC54ICsgJywgJyArIGQueSArICcpJztcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwcygpIHtcbiAgaWYgKHJlbGF0aW9uc2hpcCkge1xuICAgIHJlbGF0aW9uc2hpcC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICB2YXIgYW5nbGUgPSByb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpO1xuICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIGQuc291cmNlLnggKyAnLCAnICsgZC5zb3VyY2UueSArICcpIHJvdGF0ZSgnICsgYW5nbGUgKyAnKSc7XG4gICAgfSk7XG5cbiAgICB0aWNrUmVsYXRpb25zaGlwc1RleHRzKCk7XG4gICAgdGlja1JlbGF0aW9uc2hpcHNPdXRsaW5lcygpO1xuICAgIHRpY2tSZWxhdGlvbnNoaXBzT3ZlcmxheXMoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm9kdWNlQm91bmRpbmdCb3godGV4dE5vZGUsIHJlbGF0aW9uc2hpcCl7XG4gIHJldHVybiB0ZXh0Tm9kZS5ub2RlKCkuZ2V0QkJveCgpO1xufVxuXG5mdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc091dGxpbmVzKCkge1xuICByZWxhdGlvbnNoaXAuZWFjaChmdW5jdGlvbihyZWxhdGlvbnNoaXApIHtcblxuICAgIHZhciByZWwgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgdmFyIG91dGxpbmUgPSByZWwuc2VsZWN0KCcub3V0bGluZScpO1xuICAgIHZhciB0ZXh0ID0gcmVsLnNlbGVjdCgnLnRleHQnKTtcbiAgICB2YXIgYmJveCA9IHRleHQubm9kZSgpLmdldEJCb3goKTtcbiAgICB2YXIgcGFkZGluZyA9IDA7XG5cblxuICAgIHZhciB0ZXh0Qm91bmRpbmdCb3ggPSBwcm9kdWNlQm91bmRpbmdCb3godGV4dCwgcmVsYXRpb25zaGlwKTtcblxuICAgIG91dGxpbmUuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgYW5nbGUgPSByb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgICB0ZXh0UGFkZGluZyA9IDAsXG4gICAgICAgIHUgPSB1bml0YXJ5VmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG4gICAgICAgIHRleHRNYXJnaW4gPSB7IHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtICh0ZXh0Qm91bmRpbmdCb3gud2lkdGggKyB0ZXh0UGFkZGluZykgKiB1LngpICogMC41LCB5OiAoZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAodGV4dEJvdW5kaW5nQm94LndpZHRoICsgdGV4dFBhZGRpbmcpICogdS55KSAqIDAuNSB9LFxuICAgICAgICBuID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgICByb3RhdGVkUG9pbnRBMSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54IC0gbi54LCB5OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IC0gbi55IH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50QjEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogdGV4dE1hcmdpbi54IC0gbi54LCB5OiB0ZXh0TWFyZ2luLnkgLSBuLnkgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRDMSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiB0ZXh0TWFyZ2luLngsIHk6IHRleHRNYXJnaW4ueSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEQxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgKyAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LngsIHk6IDAgKyAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRBMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIHRleHRNYXJnaW4ueCAtIG4ueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSB0ZXh0TWFyZ2luLnkgLSBuLnkgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRCMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCAtIHUueCAqIG9wdGlvbnMuYXJyb3dTaXplLCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueSAtIHUueSAqIG9wdGlvbnMuYXJyb3dTaXplIH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50QzIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSBuLnggKyAobi54IC0gdS54KSAqIG9wdGlvbnMuYXJyb3dTaXplLCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueSArIChuLnkgLSB1LnkpICogb3B0aW9ucy5hcnJvd1NpemUgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnREMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRFMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCArICgtIG4ueCAtIHUueCkgKiBvcHRpb25zLmFycm93U2l6ZSwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgKyAoLSBuLnkgLSB1LnkpICogb3B0aW9ucy5hcnJvd1NpemUgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRGMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIHUueCAqIG9wdGlvbnMuYXJyb3dTaXplLCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIHUueSAqIG9wdGlvbnMuYXJyb3dTaXplIH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50RzIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSB0ZXh0TWFyZ2luLngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gdGV4dE1hcmdpbi55IH0sIGFuZ2xlKTtcblxuICAgICAgcmV0dXJuICdNICcgKyByb3RhdGVkUG9pbnRBMS54ICsgJyAnICsgcm90YXRlZFBvaW50QTEueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50QjEueCArICcgJyArIHJvdGF0ZWRQb2ludEIxLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEMxLnggKyAnICcgKyByb3RhdGVkUG9pbnRDMS55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnREMS54ICsgJyAnICsgcm90YXRlZFBvaW50RDEueSArXG4gICAgICAgICcgWiBNICcgKyByb3RhdGVkUG9pbnRBMi54ICsgJyAnICsgcm90YXRlZFBvaW50QTIueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50QjIueCArICcgJyArIHJvdGF0ZWRQb2ludEIyLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEMyLnggKyAnICcgKyByb3RhdGVkUG9pbnRDMi55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnREMi54ICsgJyAnICsgcm90YXRlZFBvaW50RDIueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RTIueCArICcgJyArIHJvdGF0ZWRQb2ludEUyLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEYyLnggKyAnICcgKyByb3RhdGVkUG9pbnRGMi55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRHMi54ICsgJyAnICsgcm90YXRlZFBvaW50RzIueSArXG4gICAgICAgICcgWic7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc092ZXJsYXlzKCkge1xuICByZWxhdGlvbnNoaXBPdmVybGF5LmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7XG4gICAgdmFyIGNlbnRlciA9IHsgeDogMCwgeTogMCB9LFxuICAgICAgYW5nbGUgPSByb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgbjEgPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG4gICAgICBuID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQsIDUwKSxcbiAgICAgIHJvdGF0ZWRQb2ludEEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCAtIG4ueCwgeTogMCAtIG4ueSB9LCBhbmdsZSksXG4gICAgICByb3RhdGVkUG9pbnRCID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gbi54LCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIG4ueSB9LCBhbmdsZSksXG4gICAgICByb3RhdGVkUG9pbnRDID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54ICsgbi54IC0gbjEueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgKyBuLnkgLSBuMS55IH0sIGFuZ2xlKSxcbiAgICAgIHJvdGF0ZWRQb2ludEQgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCArIG4ueCAtIG4xLngsIHk6IDAgKyBuLnkgLSBuMS55IH0sIGFuZ2xlKTtcblxuICAgIHJldHVybiAnTSAnICsgcm90YXRlZFBvaW50QS54ICsgJyAnICsgcm90YXRlZFBvaW50QS55ICtcbiAgICAgICcgTCAnICsgcm90YXRlZFBvaW50Qi54ICsgJyAnICsgcm90YXRlZFBvaW50Qi55ICtcbiAgICAgICcgTCAnICsgcm90YXRlZFBvaW50Qy54ICsgJyAnICsgcm90YXRlZFBvaW50Qy55ICtcbiAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RC54ICsgJyAnICsgcm90YXRlZFBvaW50RC55ICtcbiAgICAgICcgWic7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc1RleHRzKCkge1xuICByZWxhdGlvbnNoaXBUZXh0LmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICB2YXIgYW5nbGUgPSAocm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSArIDM2MCkgJSAzNjAsXG4gICAgICBtaXJyb3IgPSBhbmdsZSA+IDkwICYmIGFuZ2xlIDwgMjcwLFxuICAgICAgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXG4gICAgICBuID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgbldlaWdodCA9IG1pcnJvciA/IDIgOiAtMyxcbiAgICAgIHBvaW50ID0geyB4OiAoZC50YXJnZXQueCAtIGQuc291cmNlLngpICogMC41ICsgbi54ICogbldlaWdodCwgeTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55KSAqIDAuNSArIG4ueSAqIG5XZWlnaHQgfSxcbiAgICAgIHJvdGF0ZWRQb2ludCA9IHJvdGF0ZVBvaW50KGNlbnRlciwgcG9pbnQsIGFuZ2xlKTtcblxuICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyByb3RhdGVkUG9pbnQueCArICcsICcgKyByb3RhdGVkUG9pbnQueSArICcpIHJvdGF0ZSgnICsgKG1pcnJvciA/IDE4MCA6IDApICsgJyknO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9TdHJpbmcoZCkge1xuICB2YXIgcyA9IGQubGFiZWxzID8gZC5sYWJlbHNbMF0gOiBkLnR5cGU7XG5cbiAgcyArPSAnICg8aWQ+OiAnICsgZC5pZDtcblxuICBPYmplY3Qua2V5cyhkLnByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICBzICs9ICcsICcgKyBwcm9wZXJ0eSArICc6ICcgKyBKU09OLnN0cmluZ2lmeShkLnByb3BlcnRpZXNbcHJvcGVydHldKTtcbiAgfSk7XG5cbiAgcyArPSAnKSc7XG5cbiAgcmV0dXJuIHM7XG59XG5cbmZ1bmN0aW9uIHVuaXRhcnlOb3JtYWxWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXG4gICAgdmVjdG9yID0gdW5pdGFyeVZlY3Rvcihzb3VyY2UsIHRhcmdldCwgbmV3TGVuZ3RoKTtcblxuICByZXR1cm4gcm90YXRlUG9pbnQoY2VudGVyLCB2ZWN0b3IsIDkwKTtcbn1cblxuZnVuY3Rpb24gdW5pdGFyeVZlY3Rvcihzb3VyY2UsIHRhcmdldCwgbmV3TGVuZ3RoKSB7XG4gIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoTWF0aC5wb3codGFyZ2V0LnggLSBzb3VyY2UueCwgMikgKyBNYXRoLnBvdyh0YXJnZXQueSAtIHNvdXJjZS55LCAyKSkgLyBNYXRoLnNxcnQobmV3TGVuZ3RoIHx8IDEpO1xuXG4gIHJldHVybiB7XG4gICAgeDogKHRhcmdldC54IC0gc291cmNlLngpIC8gbGVuZ3RoLFxuICAgIHk6ICh0YXJnZXQueSAtIHNvdXJjZS55KSAvIGxlbmd0aCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpIHtcbiAgLy8gbWFya2VyXG4gIHVwZGF0ZU5vZGVzQW5kUmVsYXRpb25zaGlwcyhkM0RhdGEubm9kZXMsIGQzRGF0YS5yZWxhdGlvbnNoaXBzKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlV2l0aE5lbzRqRGF0YShuZW80akRhdGEpIHtcbiAgdmFyIGQzRGF0YSA9IG5lbzRqRGF0YVRvRDNEYXRhKG5lbzRqRGF0YSk7XG4gIHVwZGF0ZVdpdGhEM0RhdGEoZDNEYXRhKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSW5mbyhkKSB7XG4gIGNsZWFySW5mbygpO1xuXG4gIGlmIChkLmxhYmVscykge1xuICAgIGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoJ2NsYXNzJywgZC5sYWJlbHNbMF0pO1xuICB9IGVsc2Uge1xuICAgIGFwcGVuZEluZm9FbGVtZW50UmVsYXRpb25zaGlwKCdjbGFzcycsIGQudHlwZSk7XG4gIH1cblxuICBhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KCdwcm9wZXJ0eScsICcmbHQ7aWQmZ3Q7JywgZC5pZCk7XG5cbiAgT2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgYXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eSgncHJvcGVydHknLCBwcm9wZXJ0eSwgSlNPTi5zdHJpbmdpZnkoZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSkpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlTm9kZXMobikge1xuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShub2Rlcywgbik7XG5cbiAgbm9kZSA9IHN2Z05vZGVzLnNlbGVjdEFsbCgnLm5vZGUnKVxuICAgIC5kYXRhKG5vZGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmlkOyB9KTtcbiAgdmFyIG5vZGVFbnRlciA9IGFwcGVuZE5vZGVUb0dyYXBoKCk7XG4gIG5vZGUgPSBub2RlRW50ZXIubWVyZ2Uobm9kZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU5vZGVzQW5kUmVsYXRpb25zaGlwcyhuLCByKSB7XG4gIHVwZGF0ZVJlbGF0aW9uc2hpcHMocik7XG4gIHVwZGF0ZU5vZGVzKG4pO1xuXG4gIHNpbXVsYXRpb24ubm9kZXMobm9kZXMpO1xuICBzaW11bGF0aW9uLmZvcmNlKCdsaW5rJykubGlua3MocmVsYXRpb25zaGlwcyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlbGF0aW9uc2hpcHMocikge1xuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShyZWxhdGlvbnNoaXBzLCByKTtcblxuICByZWxhdGlvbnNoaXAgPSBzdmdSZWxhdGlvbnNoaXBzLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCcpXG4gICAgLmRhdGEocmVsYXRpb25zaGlwcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZDsgfSk7XG5cbiAgdmFyIHJlbGF0aW9uc2hpcEVudGVyID0gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaCgpO1xuXG4gIHJlbGF0aW9uc2hpcCA9IHJlbGF0aW9uc2hpcEVudGVyLnJlbGF0aW9uc2hpcC5tZXJnZShyZWxhdGlvbnNoaXApO1xuICByZWxhdGlvbnNoaXBPdXRsaW5lID0gc3ZnLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCAub3V0bGluZScpO1xuICByZWxhdGlvbnNoaXBPdXRsaW5lID0gcmVsYXRpb25zaGlwRW50ZXIub3V0bGluZS5tZXJnZShyZWxhdGlvbnNoaXBPdXRsaW5lKTtcblxuICByZWxhdGlvbnNoaXBPdmVybGF5ID0gc3ZnLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCAub3ZlcmxheScpO1xuICByZWxhdGlvbnNoaXBPdmVybGF5ID0gcmVsYXRpb25zaGlwRW50ZXIub3ZlcmxheS5tZXJnZShyZWxhdGlvbnNoaXBPdmVybGF5KTtcblxuICByZWxhdGlvbnNoaXBUZXh0ID0gc3ZnLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCAudGV4dCcpO1xuICByZWxhdGlvbnNoaXBUZXh0ID0gcmVsYXRpb25zaGlwRW50ZXIudGV4dC5tZXJnZShyZWxhdGlvbnNoaXBUZXh0KTtcbn1cblxuXG5mdW5jdGlvbiB2ZXJzaW9uKCkge1xuICByZXR1cm4gVkVSU0lPTjtcbn1cblxuZnVuY3Rpb24gem9vbUZpdCh0cmFuc2l0aW9uRHVyYXRpb24pIHtcbiAgdmFyIGJvdW5kcyA9IHN2Zy5ub2RlKCkuZ2V0QkJveCgpO1xuICB2YXIgcGFyZW50ID0gc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cbiAgaWYgKCFwYXJlbnQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZnVsbFdpZHRoID0gcGFyZW50LmNsaWVudFdpZHRoO1xuICB2YXIgZnVsbEhlaWdodCA9IHBhcmVudC5jbGllbnRIZWlnaHQ7XG4gIHZhciB3aWR0aCA9IGJvdW5kcy53aWR0aDtcbiAgdmFyIGhlaWdodCA9IGJvdW5kcy5oZWlnaHQ7XG4gIHZhciBtaWRYID0gYm91bmRzLnggKyB3aWR0aCAvIDI7XG4gIHZhciBtaWRZID0gYm91bmRzLnkgKyBoZWlnaHQgLyAyO1xuXG4gIGlmICh3aWR0aCA9PT0gMCB8fCBoZWlnaHQgPT09IDApIHtcbiAgICByZXR1cm47IC8vIG5vdGhpbmcgdG8gZml0XG4gIH1cblxuICBzdmdTY2FsZSA9IDAuODUgLyBNYXRoLm1heCh3aWR0aCAvIGZ1bGxXaWR0aCwgaGVpZ2h0IC8gZnVsbEhlaWdodCk7XG4gIHN2Z1RyYW5zbGF0ZSA9IFtmdWxsV2lkdGggLyAyIC0gc3ZnU2NhbGUgKiBtaWRYLCBmdWxsSGVpZ2h0IC8gMiAtIHN2Z1NjYWxlICogbWlkWV07XG5cbiAgc3ZnLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHN2Z1RyYW5zbGF0ZVswXSArICcsICcgKyBzdmdUcmFuc2xhdGVbMV0gKyAnKSBzY2FsZSgnICsgc3ZnU2NhbGUgKyAnKScpO1xuICAvLyAgICAgICAgc21vb3RoVHJhbnNmb3JtKHN2Z1RyYW5zbGF0ZSwgc3ZnU2NhbGUpO1xufVxuXG5pbml0KF9zZWxlY3RvciwgX29wdGlvbnMpO1xuXG5yZXR1cm4ge1xuICBuZW80akRhdGFUb0QzRGF0YTogbmVvNGpEYXRhVG9EM0RhdGEsXG4gIHNpemU6IHNpemUsXG4gIHVwZGF0ZVdpdGhEM0RhdGE6IHVwZGF0ZVdpdGhEM0RhdGEsXG4gIHVwZGF0ZVdpdGhOZW80akRhdGE6IHVwZGF0ZVdpdGhOZW80akRhdGEsXG4gIHZlcnNpb246IHZlcnNpb25cbn07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTmVvNGpEMztcbiJdfQ==
