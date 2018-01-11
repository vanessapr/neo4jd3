(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Neo4jd3 = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
      zoomFit: false
    },
    VERSION = '0.0.1';

  function ruleViolationDict(edges){
    var d = {}
    for(var i = 0; i< edges.length; i++){

      var edge = edges[i];
      var id = edge.startNode;

      if (!(id in d)){
        d[id] = false;
      }

      if ('properties' in edge){
        var properties = edge.properties;
        if ('RuleViolated' in properties){

          if (properties.RuleViolated != 'No'){
            d[id] = true;
          }
        }
      }
    }
    return d;
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
        return icon(d) ? '24px': '30px';
      })
      .attr('x', function(d) {
        return icon(d) ? '5px': '-15px';
      })
      .attr('xlink:href', function(d) {
        return image(d);
      })
      .attr('y', function(d) {
        return icon(d) ? '5px': '-16px';
      })
      .attr('width', function(d) {
        return icon(d) ? '24px': '30px';
      });
  }

  function appendInfoPanel(container) {
    return container.append('div')
      .attr('class', 'neo4jd3-info');
  }

  function appendInfoElement(cls, isNode, property, value) {
    var elem = info.append('a');
    var labelColorMapping = {
      "customer": "#68bdf6",
      "account": "#ffd86e",
      "ownbankaccount": "#6dce9e",
      "otherbankaccount": "#ff867f",
      "ruleviolation": "#ffa82d"
    }

    elem.attr('href', '#')
      .attr('class', cls)
      .html('<strong>' + property + '</strong>' + (value ? (': ' + value) : ''));
    if (!value) {
      elem.style('background-color', function(d) {

          var the_property = property.toLowerCase();

          if (the_property in labelColorMapping){
            return labelColorMapping[the_property];
          }


        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : (isNode ? class2color(property) : defaultColor());


      })
        .style('border-color', function(d) {
          var the_property = property.toLowerCase();

          if (the_property in labelColorMapping){
            return labelColorMapping[the_property];
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

    var ending = '...';

    if (length == null) {
      length = 100;
    }

    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    } else {
      return str;
    }
  };

  function calculateXLocation(name){
    return name.length;

  }

  function appendNodeNameText(node){
    // going to need to link this to node width/ hieght at some point
    var g = node.append('g')

    g.append("rect")
      .attr("width", '80px')
      .attr("height", '20px')
      .style("fill", function(d){

        return "#bdc3c7";

      })
      .attr('y', 24)
      .attr('x', -40)
      .attr('rx', 10)
      .attr('ry', 10)

    g.append('text')
      .text(function(node) {
        var x = node.labels;
        return truncateText(node.properties.name, 13);
      })
      .attr('font-size', 10)
      .attr('x', function(node){
        return 0;
        return calculateXLocation(node.properties.name);

      })
      .attr('y', 33)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central');
  }


  function appendNodeToGraph() {
    var n = appendNode();

    appendRingToNode(n);
    appendOutlineToNode(n);

    if (options.icons) {
      appendTextToNode(n);
    }

    appendRuleViolationToNode(n);

    if (options.images) {

      appendImageToNode(n);
    }

    var text = appendNodeNameText(n);

    return n;
  }

  function appendOutlineToNode(node) {

    var labelColorMapping = {
      "customer": "#68bdf6",
      "account": "#ffd86e",
      "ownbankaccount": "#6dce9e",
      "otherbankaccount": "#ff867f",
      "ruleviolation": "#ffa82d"
    }

    return node.append('circle')
      .attr('class', 'outline')
      .attr('r', options.nodeRadius)
      .style('fill', function(d) {
        var label = d.labels;

        if (label.length === 0){
          return 'gray';
        }

        var the_label = label[0].toLowerCase();
        if (the_label in labelColorMapping){
          return labelColorMapping[the_label];
        }

        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
      })
      .style('stroke', function(d) {
        var label = d.labels;

        if (label.length === 0){
          return 'gray';
        }

        var the_label = label[0].toLowerCase();
        if (the_label in labelColorMapping){
          return labelColorMapping[the_label];
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

  function appendRuleViolationToNode(node) {

    var transitionDuration = 3000;

    var node = node.filter(function(d){
      return options.globalDict[d.id];
    })

    return node.append('text')
      .attr('class', 'text icon')
      .attr('fill', '#ffa500')
      .attr('font-size', function(d) {
        return (.9 * options.nodeRadius) + 'px';})
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('y', function(d) {
        return '-12px';
      })
      .attr('x', function(d) {
        return '-12px';
      })
      .html(function(d) {
        var _icon = options.iconMap['times'];
        return _icon ? '&#x' + _icon : d.id;
      })
      .transition()
      .duration(transitionDuration)
      .on("start", function repeat() {
        d3.active(this)
          .style('opacity', .5)
          .transition()
          .duration(transitionDuration)
          .style('opacity', 1)
          .transition()
          .on("start", repeat);
      })



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

  function getAmounts (relationships){
    var amounts = [];

    for (var i = 0; i < relationships.length; i++){
      var objectProperties = relationships[i].properties;
      if (objectProperties.hasOwnProperty('Amount')){
        var amount = objectProperties.Amount;
        amounts.push(+amount);
      }
    }

    return amounts;
  }

  function createOutlineScale(relationships){
    var amounts = getAmounts(relationships);
    var extents = d3.extent(amounts);

    var min = extents[0];
    var max = extents[1];

    var newScale = d3.scaleLinear()
      .domain([min,max])
      .range([.1, 3]);
    return newScale;
  }

  function appendOutlineToRelationship(r, outlineScale) {
    return r.append('path')
      .attr('class', 'outline')
      .attr('fill', '#a5abb6')
      .attr('stroke-width', function(d,i){
        return 1;
        //return outlineScale(+d.properties.Amount);
      })
      .attr('stroke', function(d)
        {
          if (d.properties && 'RuleViolated' in d.properties){

            if (d.properties.RuleViolated.toLowerCase() != 'no'){
              return '#ffa500'
            }
          }
          return '#a5abb6'
        });
  }

  function appendOverlayToRelationship(r) {
    return r.append('path')
      .attr('class', 'overlay');
  }

  function appendTextToRelationship(r) {
        return r.append('text')
      .attr('class', 'text')
      .text(function(d) {
        return '';
      });
  }

  function appendRelationshipToGraph(outlineScale) {
    var relationship = appendRelationship();

    var text = appendTextToRelationship(relationship);
    var outline = appendOutlineToRelationship(relationship, outlineScale);
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

function tickRelationshipsOutlines() {
  relationship.each(function(relationship) {

    var rel = d3.select(this);
    var outline = rel.select('.outline');
    var text = rel.select('.text');
    var bbox = text.node().getBBox();
    var padding = 0;

    outline.attr('d', function(d) {
      var center = { x: 0, y: 0 },
        angle = rotation(d.source, d.target),
        textBoundingBox = text.node().getBBox(),
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
  options.globalDict = ruleViolationDict(d3Data.relationships);
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

  var outlineScale = createOutlineScale(relationships);
  var relationshipEnter = appendRelationshipToGraph(outlineScale);

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
  var bounds = svg.node().getBBox(),
    parent = svg.node().parentElement.parentElement,
    fullWidth = parent.clientWidth,
    fullHeight = parent.clientHeight,
    width = bounds.width,
    height = bounds.height,
    midX = bounds.x + width / 2,
    midY = bounds.y + height / 2;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi9pbmRleC5qcyIsInNyYy9tYWluL3NjcmlwdHMvbmVvNGpkMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBuZW80amQzID0gcmVxdWlyZSgnLi9zY3JpcHRzL25lbzRqZDMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZW80amQzO1xuIiwiLyogZ2xvYmFsIGQzLCBkb2N1bWVudCAqL1xuLyoganNoaW50IGxhdGVkZWY6bm9mdW5jICovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIE5lbzRqRDMoX3NlbGVjdG9yLCBfb3B0aW9ucykge1xuICB2YXIgY29udGFpbmVyLCBncmFwaCwgaW5mbywgbm9kZSwgbm9kZXMsIHJlbGF0aW9uc2hpcCwgcmVsYXRpb25zaGlwT3V0bGluZSwgcmVsYXRpb25zaGlwT3ZlcmxheSwgcmVsYXRpb25zaGlwVGV4dCwgcmVsYXRpb25zaGlwcywgc2VsZWN0b3IsIHNpbXVsYXRpb24sIHN2Zywgc3ZnTm9kZXMsIHN2Z1JlbGF0aW9uc2hpcHMsIHN2Z1NjYWxlLCBzdmdUcmFuc2xhdGUsXG4gICAgY2xhc3NlczJjb2xvcnMgPSB7fSxcbiAgICBqdXN0TG9hZGVkID0gZmFsc2UsXG4gICAgbnVtQ2xhc3NlcyA9IDAsXG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIGFycm93U2l6ZTogMixcbiAgICAgIGNvbG9yczogY29sb3JzKCksXG4gICAgICBoaWdobGlnaHQ6IHVuZGVmaW5lZCxcbiAgICAgIGljb25NYXA6IGZvbnRBd2Vzb21lSWNvbnMoKSxcbiAgICAgIGljb25zOiB1bmRlZmluZWQsXG4gICAgICBpbWFnZU1hcDoge30sXG4gICAgICBpbWFnZXM6IHVuZGVmaW5lZCxcbiAgICAgIGluZm9QYW5lbDogdHJ1ZSxcbiAgICAgIG1pbkNvbGxpc2lvbjogdW5kZWZpbmVkLFxuICAgICAgbmVvNGpEYXRhOiB1bmRlZmluZWQsXG4gICAgICBuZW80akRhdGFVcmw6IHVuZGVmaW5lZCxcbiAgICAgIG5vZGVPdXRsaW5lRmlsbENvbG9yOiB1bmRlZmluZWQsXG4gICAgICBub2RlUmFkaXVzOiA3NSxcbiAgICAgIHJlbGF0aW9uc2hpcENvbG9yOiAnI2E1YWJiNicsXG4gICAgICB6b29tRml0OiBmYWxzZVxuICAgIH0sXG4gICAgVkVSU0lPTiA9ICcwLjAuMSc7XG5cbiAgZnVuY3Rpb24gcnVsZVZpb2xhdGlvbkRpY3QoZWRnZXMpe1xuICAgIHZhciBkID0ge31cbiAgICBmb3IodmFyIGkgPSAwOyBpPCBlZGdlcy5sZW5ndGg7IGkrKyl7XG5cbiAgICAgIHZhciBlZGdlID0gZWRnZXNbaV07XG4gICAgICB2YXIgaWQgPSBlZGdlLnN0YXJ0Tm9kZTtcblxuICAgICAgaWYgKCEoaWQgaW4gZCkpe1xuICAgICAgICBkW2lkXSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoJ3Byb3BlcnRpZXMnIGluIGVkZ2Upe1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IGVkZ2UucHJvcGVydGllcztcbiAgICAgICAgaWYgKCdSdWxlVmlvbGF0ZWQnIGluIHByb3BlcnRpZXMpe1xuXG4gICAgICAgICAgaWYgKHByb3BlcnRpZXMuUnVsZVZpb2xhdGVkICE9ICdObycpe1xuICAgICAgICAgICAgZFtpZF0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEdyYXBoKGNvbnRhaW5lcikge1xuICAgIHN2ZyA9IGNvbnRhaW5lci5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCAnMTAwJScpXG4gICAgICAuYXR0cignaGVpZ2h0JywgJzEwMCUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ25lbzRqZDMtZ3JhcGgnKVxuICAgICAgLmNhbGwoZDMuem9vbSgpLm9uKCd6b29tJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnRyYW5zZm9ybS5rLFxuICAgICAgICAgIHRyYW5zbGF0ZSA9IFtkMy5ldmVudC50cmFuc2Zvcm0ueCwgZDMuZXZlbnQudHJhbnNmb3JtLnldO1xuXG4gICAgICAgIGlmIChzdmdUcmFuc2xhdGUpIHtcbiAgICAgICAgICB0cmFuc2xhdGVbMF0gKz0gc3ZnVHJhbnNsYXRlWzBdO1xuICAgICAgICAgIHRyYW5zbGF0ZVsxXSArPSBzdmdUcmFuc2xhdGVbMV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3ZnU2NhbGUpIHtcbiAgICAgICAgICBzY2FsZSAqPSBzdmdTY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN2Zy5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB0cmFuc2xhdGVbMF0gKyAnLCAnICsgdHJhbnNsYXRlWzFdICsgJykgc2NhbGUoJyArIHNjYWxlICsgJyknKTtcbiAgICAgIH0pKVxuICAgICAgLm9uKCdkYmxjbGljay56b29tJywgbnVsbClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgJzEwMCUnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsICcxMDAlJyk7XG5cbiAgICBzdmdSZWxhdGlvbnNoaXBzID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmVsYXRpb25zaGlwcycpO1xuXG4gICAgc3ZnTm9kZXMgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdub2RlcycpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW1hZ2VUb05vZGUobm9kZSkge1xuXG4gICAgcmV0dXJuIG5vZGUuYXBwZW5kKCdpbWFnZScpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICcyNHB4JzogJzMwcHgnO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd4JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICc1cHgnOiAnLTE1cHgnO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd4bGluazpocmVmJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaW1hZ2UoZCk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBpY29uKGQpID8gJzVweCc6ICctMTZweCc7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICcyNHB4JzogJzMwcHgnO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvUGFuZWwoY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lci5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbmVvNGpkMy1pbmZvJyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGlzTm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgdmFyIGVsZW0gPSBpbmZvLmFwcGVuZCgnYScpO1xuICAgIHZhciBsYWJlbENvbG9yTWFwcGluZyA9IHtcbiAgICAgIFwiY3VzdG9tZXJcIjogXCIjNjhiZGY2XCIsXG4gICAgICBcImFjY291bnRcIjogXCIjZmZkODZlXCIsXG4gICAgICBcIm93bmJhbmthY2NvdW50XCI6IFwiIzZkY2U5ZVwiLFxuICAgICAgXCJvdGhlcmJhbmthY2NvdW50XCI6IFwiI2ZmODY3ZlwiLFxuICAgICAgXCJydWxldmlvbGF0aW9uXCI6IFwiI2ZmYTgyZFwiXG4gICAgfVxuXG4gICAgZWxlbS5hdHRyKCdocmVmJywgJyMnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgY2xzKVxuICAgICAgLmh0bWwoJzxzdHJvbmc+JyArIHByb3BlcnR5ICsgJzwvc3Ryb25nPicgKyAodmFsdWUgPyAoJzogJyArIHZhbHVlKSA6ICcnKSk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgZWxlbS5zdHlsZSgnYmFja2dyb3VuZC1jb2xvcicsIGZ1bmN0aW9uKGQpIHtcblxuICAgICAgICAgIHZhciB0aGVfcHJvcGVydHkgPSBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHRoZV9wcm9wZXJ0eSBpbiBsYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxDb2xvck1hcHBpbmdbdGhlX3Byb3BlcnR5XTtcbiAgICAgICAgICB9XG5cblxuICAgICAgICByZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/IG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgOiAoaXNOb2RlID8gY2xhc3MyY29sb3IocHJvcGVydHkpIDogZGVmYXVsdENvbG9yKCkpO1xuXG5cbiAgICAgIH0pXG4gICAgICAgIC5zdHlsZSgnYm9yZGVyLWNvbG9yJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHZhciB0aGVfcHJvcGVydHkgPSBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHRoZV9wcm9wZXJ0eSBpbiBsYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxDb2xvck1hcHBpbmdbdGhlX3Byb3BlcnR5XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKSA6IChpc05vZGUgPyBjbGFzczJkYXJrZW5Db2xvcihwcm9wZXJ0eSkgOiBkZWZhdWx0RGFya2VuQ29sb3IoKSk7XG5cblxuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoJ2NvbG9yJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gY2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcikgOiAnI2ZmZic7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRDbGFzcyhjbHMsIG5vZGUpIHtcbiAgICBhcHBlbmRJbmZvRWxlbWVudChjbHMsIHRydWUsIG5vZGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eShjbHMsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGFwcGVuZEluZm9FbGVtZW50KGNscywgZmFsc2UsIHByb3BlcnR5LCB2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudFJlbGF0aW9uc2hpcChjbHMsIHJlbGF0aW9uc2hpcCkge1xuICAgIGFwcGVuZEluZm9FbGVtZW50KGNscywgZmFsc2UsIHJlbGF0aW9uc2hpcCk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmROb2RlKCkge1xuICAgIHJldHVybiBub2RlLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgaGlnaGxpZ2h0LCBpLFxuICAgICAgICAgIGNsYXNzZXMgPSAnbm9kZScsXG4gICAgICAgICAgbGFiZWwgPSBkLmxhYmVsc1swXTtcblxuICAgICAgICBpZiAoaWNvbihkKSkge1xuICAgICAgICAgIGNsYXNzZXMgKz0gJyBub2RlLWljb24nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGltYWdlKGQpKSB7XG4gICAgICAgICAgY2xhc3NlcyArPSAnIG5vZGUtaW1hZ2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGlnaGxpZ2h0KSB7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBoaWdobGlnaHQgPSBvcHRpb25zLmhpZ2hsaWdodFtpXTtcblxuICAgICAgICAgICAgaWYgKGQubGFiZWxzWzBdID09PSBoaWdobGlnaHQuY2xhc3MgJiYgZC5wcm9wZXJ0aWVzW2hpZ2hsaWdodC5wcm9wZXJ0eV0gPT09IGhpZ2hsaWdodC52YWx1ZSkge1xuICAgICAgICAgICAgICBjbGFzc2VzICs9ICcgbm9kZS1oaWdobGlnaHRlZCc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjbGFzc2VzO1xuICAgICAgfSlcbiAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGQuZnggPSBkLmZ5ID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvcHRpb25zLm9uTm9kZUNsaWNrKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdkYmxjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgc3RpY2tOb2RlKGQpO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEb3VibGVDbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIG9wdGlvbnMub25Ob2RlRG91YmxlQ2xpY2soZCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgdXBkYXRlSW5mbyhkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVNb3VzZUVudGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbk5vZGVNb3VzZUVudGVyKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgIGNsZWFySW5mbyhkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVNb3VzZUxlYXZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbk5vZGVNb3VzZUxlYXZlKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgLmNhbGwoZDMuZHJhZygpXG4gICAgLm9uKCdzdGFydCcsIGRyYWdTdGFydGVkKVxuICAgIC5vbignZHJhZycsIGRyYWdnZWQpXG4gICAgLm9uKCdlbmQnLCBkcmFnRW5kZWQpKTtcbiAgfVxuICBmdW5jdGlvbiB0cnVuY2F0ZVRleHQoc3RyLCBsZW5ndGgpIHtcblxuICAgIHZhciBlbmRpbmcgPSAnLi4uJztcblxuICAgIGlmIChsZW5ndGggPT0gbnVsbCkge1xuICAgICAgbGVuZ3RoID0gMTAwO1xuICAgIH1cblxuICAgIGlmIChzdHIubGVuZ3RoID4gbGVuZ3RoKSB7XG4gICAgICByZXR1cm4gc3RyLnN1YnN0cmluZygwLCBsZW5ndGggLSBlbmRpbmcubGVuZ3RoKSArIGVuZGluZztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gY2FsY3VsYXRlWExvY2F0aW9uKG5hbWUpe1xuICAgIHJldHVybiBuYW1lLmxlbmd0aDtcblxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kTm9kZU5hbWVUZXh0KG5vZGUpe1xuICAgIC8vIGdvaW5nIHRvIG5lZWQgdG8gbGluayB0aGlzIHRvIG5vZGUgd2lkdGgvIGhpZWdodCBhdCBzb21lIHBvaW50XG4gICAgdmFyIGcgPSBub2RlLmFwcGVuZCgnZycpXG5cbiAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgJzgwcHgnKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgJzIwcHgnKVxuICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKXtcblxuICAgICAgICByZXR1cm4gXCIjYmRjM2M3XCI7XG5cbiAgICAgIH0pXG4gICAgICAuYXR0cigneScsIDI0KVxuICAgICAgLmF0dHIoJ3gnLCAtNDApXG4gICAgICAuYXR0cigncngnLCAxMClcbiAgICAgIC5hdHRyKCdyeScsIDEwKVxuXG4gICAgZy5hcHBlbmQoJ3RleHQnKVxuICAgICAgLnRleHQoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgeCA9IG5vZGUubGFiZWxzO1xuICAgICAgICByZXR1cm4gdHJ1bmNhdGVUZXh0KG5vZGUucHJvcGVydGllcy5uYW1lLCAxMyk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2ZvbnQtc2l6ZScsIDEwKVxuICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihub2RlKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiBjYWxjdWxhdGVYTG9jYXRpb24obm9kZS5wcm9wZXJ0aWVzLm5hbWUpO1xuXG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3knLCAzMylcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgLmF0dHIoJ2FsaWdubWVudC1iYXNlbGluZScsICdjZW50cmFsJyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGFwcGVuZE5vZGVUb0dyYXBoKCkge1xuICAgIHZhciBuID0gYXBwZW5kTm9kZSgpO1xuXG4gICAgYXBwZW5kUmluZ1RvTm9kZShuKTtcbiAgICBhcHBlbmRPdXRsaW5lVG9Ob2RlKG4pO1xuXG4gICAgaWYgKG9wdGlvbnMuaWNvbnMpIHtcbiAgICAgIGFwcGVuZFRleHRUb05vZGUobik7XG4gICAgfVxuXG4gICAgYXBwZW5kUnVsZVZpb2xhdGlvblRvTm9kZShuKTtcblxuICAgIGlmIChvcHRpb25zLmltYWdlcykge1xuXG4gICAgICBhcHBlbmRJbWFnZVRvTm9kZShuKTtcbiAgICB9XG5cbiAgICB2YXIgdGV4dCA9IGFwcGVuZE5vZGVOYW1lVGV4dChuKTtcblxuICAgIHJldHVybiBuO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kT3V0bGluZVRvTm9kZShub2RlKSB7XG5cbiAgICB2YXIgbGFiZWxDb2xvck1hcHBpbmcgPSB7XG4gICAgICBcImN1c3RvbWVyXCI6IFwiIzY4YmRmNlwiLFxuICAgICAgXCJhY2NvdW50XCI6IFwiI2ZmZDg2ZVwiLFxuICAgICAgXCJvd25iYW5rYWNjb3VudFwiOiBcIiM2ZGNlOWVcIixcbiAgICAgIFwib3RoZXJiYW5rYWNjb3VudFwiOiBcIiNmZjg2N2ZcIixcbiAgICAgIFwicnVsZXZpb2xhdGlvblwiOiBcIiNmZmE4MmRcIlxuICAgIH1cblxuICAgIHJldHVybiBub2RlLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdvdXRsaW5lJylcbiAgICAgIC5hdHRyKCdyJywgb3B0aW9ucy5ub2RlUmFkaXVzKVxuICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgbGFiZWwgPSBkLmxhYmVscztcblxuICAgICAgICBpZiAobGFiZWwubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICByZXR1cm4gJ2dyYXknO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRoZV9sYWJlbCA9IGxhYmVsWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICh0aGVfbGFiZWwgaW4gbGFiZWxDb2xvck1hcHBpbmcpe1xuICAgICAgICAgIHJldHVybiBsYWJlbENvbG9yTWFwcGluZ1t0aGVfbGFiZWxdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yIDogY2xhc3MyY29sb3IoZC5sYWJlbHNbMF0pO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgbGFiZWwgPSBkLmxhYmVscztcblxuICAgICAgICBpZiAobGFiZWwubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICByZXR1cm4gJ2dyYXknO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRoZV9sYWJlbCA9IGxhYmVsWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICh0aGVfbGFiZWwgaW4gbGFiZWxDb2xvck1hcHBpbmcpe1xuICAgICAgICAgIHJldHVybiBsYWJlbENvbG9yTWFwcGluZ1t0aGVfbGFiZWxdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gY2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcikgOiBjbGFzczJkYXJrZW5Db2xvcihkLmxhYmVsc1swXSk7XG4gICAgICB9KVxuICAgICAgLmFwcGVuZCgndGl0bGUnKS50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIHRvU3RyaW5nKGQpO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRSaW5nVG9Ob2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmluZycpXG4gICAgICAuYXR0cigncicsIG9wdGlvbnMubm9kZVJhZGl1cyAqIDEuMTYpXG4gICAgICAuYXBwZW5kKCd0aXRsZScpLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gdG9TdHJpbmcoZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZFRleHRUb05vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiAndGV4dCcgKyAoaWNvbihkKSA/ICcgaWNvbicgOiAnJyk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnI2ZmZmZmZicpXG4gICAgICAuYXR0cignZm9udC1zaXplJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/IChvcHRpb25zLm5vZGVSYWRpdXMgKyAncHgnKSA6ICcxMHB4JztcbiAgICAgIH0pXG4gICAgICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnbm9uZScpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgIC5hdHRyKCd5JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/IChwYXJzZUludChNYXRoLnJvdW5kKG9wdGlvbnMubm9kZVJhZGl1cyAqIDAuMzIpKSArICdweCcpIDogJzRweCc7XG4gICAgICB9KVxuICAgICAgLmh0bWwoZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgX2ljb24gPSBpY29uKGQpO1xuICAgICAgICByZXR1cm4gX2ljb24gPyAnJiN4JyArIF9pY29uIDogZC5pZDtcbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kUnVsZVZpb2xhdGlvblRvTm9kZShub2RlKSB7XG5cbiAgICB2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gMzAwMDtcblxuICAgIHZhciBub2RlID0gbm9kZS5maWx0ZXIoZnVuY3Rpb24oZCl7XG4gICAgICByZXR1cm4gb3B0aW9ucy5nbG9iYWxEaWN0W2QuaWRdO1xuICAgIH0pXG5cbiAgICByZXR1cm4gbm9kZS5hcHBlbmQoJ3RleHQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RleHQgaWNvbicpXG4gICAgICAuYXR0cignZmlsbCcsICcjZmZhNTAwJylcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiAoLjkgKiBvcHRpb25zLm5vZGVSYWRpdXMpICsgJ3B4Jzt9KVxuICAgICAgLmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKVxuICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXG4gICAgICAuYXR0cigneScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICctMTJweCc7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiAnLTEycHgnO1xuICAgICAgfSlcbiAgICAgIC5odG1sKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIF9pY29uID0gb3B0aW9ucy5pY29uTWFwWyd0aW1lcyddO1xuICAgICAgICByZXR1cm4gX2ljb24gPyAnJiN4JyArIF9pY29uIDogZC5pZDtcbiAgICAgIH0pXG4gICAgICAudHJhbnNpdGlvbigpXG4gICAgICAuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxuICAgICAgLm9uKFwic3RhcnRcIiwgZnVuY3Rpb24gcmVwZWF0KCkge1xuICAgICAgICBkMy5hY3RpdmUodGhpcylcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAuNSlcbiAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAxKVxuICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAub24oXCJzdGFydFwiLCByZXBlYXQpO1xuICAgICAgfSlcblxuXG5cbiAgfVxuXG5cbiAgZnVuY3Rpb24gYXBwZW5kUmVsYXRpb25zaGlwKCkge1xuICAgIHJldHVybiByZWxhdGlvbnNoaXAuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCdyZWxhdGlvbnNoaXAnKVxuICAgICAgLm9uKCdkYmxjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2soZCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgdXBkYXRlSW5mbyhkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbW91bnRzIChyZWxhdGlvbnNoaXBzKXtcbiAgICB2YXIgYW1vdW50cyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGlvbnNoaXBzLmxlbmd0aDsgaSsrKXtcbiAgICAgIHZhciBvYmplY3RQcm9wZXJ0aWVzID0gcmVsYXRpb25zaGlwc1tpXS5wcm9wZXJ0aWVzO1xuICAgICAgaWYgKG9iamVjdFByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoJ0Ftb3VudCcpKXtcbiAgICAgICAgdmFyIGFtb3VudCA9IG9iamVjdFByb3BlcnRpZXMuQW1vdW50O1xuICAgICAgICBhbW91bnRzLnB1c2goK2Ftb3VudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFtb3VudHM7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVPdXRsaW5lU2NhbGUocmVsYXRpb25zaGlwcyl7XG4gICAgdmFyIGFtb3VudHMgPSBnZXRBbW91bnRzKHJlbGF0aW9uc2hpcHMpO1xuICAgIHZhciBleHRlbnRzID0gZDMuZXh0ZW50KGFtb3VudHMpO1xuXG4gICAgdmFyIG1pbiA9IGV4dGVudHNbMF07XG4gICAgdmFyIG1heCA9IGV4dGVudHNbMV07XG5cbiAgICB2YXIgbmV3U2NhbGUgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgICAuZG9tYWluKFttaW4sbWF4XSlcbiAgICAgIC5yYW5nZShbLjEsIDNdKTtcbiAgICByZXR1cm4gbmV3U2NhbGU7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRPdXRsaW5lVG9SZWxhdGlvbnNoaXAociwgb3V0bGluZVNjYWxlKSB7XG4gICAgcmV0dXJuIHIuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdvdXRsaW5lJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNhNWFiYjYnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIGZ1bmN0aW9uKGQsaSl7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgICAvL3JldHVybiBvdXRsaW5lU2NhbGUoK2QucHJvcGVydGllcy5BbW91bnQpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBmdW5jdGlvbihkKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKGQucHJvcGVydGllcyAmJiAnUnVsZVZpb2xhdGVkJyBpbiBkLnByb3BlcnRpZXMpe1xuXG4gICAgICAgICAgICBpZiAoZC5wcm9wZXJ0aWVzLlJ1bGVWaW9sYXRlZC50b0xvd2VyQ2FzZSgpICE9ICdubycpe1xuICAgICAgICAgICAgICByZXR1cm4gJyNmZmE1MDAnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnI2E1YWJiNidcbiAgICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRPdmVybGF5VG9SZWxhdGlvbnNoaXAocikge1xuICAgIHJldHVybiByLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnb3ZlcmxheScpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHIpIHtcbiAgICAgICAgcmV0dXJuIHIuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0ZXh0JylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRSZWxhdGlvbnNoaXBUb0dyYXBoKG91dGxpbmVTY2FsZSkge1xuICAgIHZhciByZWxhdGlvbnNoaXAgPSBhcHBlbmRSZWxhdGlvbnNoaXAoKTtcblxuICAgIHZhciB0ZXh0ID0gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHJlbGF0aW9uc2hpcCk7XG4gICAgdmFyIG91dGxpbmUgPSBhcHBlbmRPdXRsaW5lVG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwLCBvdXRsaW5lU2NhbGUpO1xuICAgIHZhciBvdmVybGF5ID0gYXBwZW5kT3ZlcmxheVRvUmVsYXRpb25zaGlwKHJlbGF0aW9uc2hpcCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb3V0bGluZTogb3V0bGluZSxcbiAgICAgIG92ZXJsYXk6IG92ZXJsYXksXG4gICAgICByZWxhdGlvbnNoaXA6IHJlbGF0aW9uc2hpcCxcbiAgICAgIHRleHQ6IHRleHRcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xhc3MyY29sb3IoY2xzKSB7XG4gICAgdmFyIGNvbG9yID0gY2xhc3NlczJjb2xvcnNbY2xzXTtcblxuICAgIGlmICghY29sb3IpIHtcbiAgICAgIC8vICAgICAgICAgICAgY29sb3IgPSBvcHRpb25zLmNvbG9yc1tNYXRoLm1pbihudW1DbGFzc2VzLCBvcHRpb25zLmNvbG9ycy5sZW5ndGggLSAxKV07XG4gICAgICBjb2xvciA9IG9wdGlvbnMuY29sb3JzW251bUNsYXNzZXMgJSBvcHRpb25zLmNvbG9ycy5sZW5ndGhdO1xuICAgICAgY2xhc3NlczJjb2xvcnNbY2xzXSA9IGNvbG9yO1xuICAgICAgbnVtQ2xhc3NlcysrO1xuICAgIH1cblxuICAgIHJldHVybiBjb2xvcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsYXNzMmRhcmtlbkNvbG9yKGNscykge1xuICAgIHJldHVybiBkMy5yZ2IoY2xhc3MyY29sb3IoY2xzKSkuZGFya2VyKDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJJbmZvKCkge1xuICAgIGluZm8uaHRtbCgnJyk7XG4gIH1cblxuICBmdW5jdGlvbiBjb2xvcigpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5jb2xvcnNbb3B0aW9ucy5jb2xvcnMubGVuZ3RoICogTWF0aC5yYW5kb20oKSA8PCAwXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbG9ycygpIHtcbiAgICAvLyBkMy5zY2hlbWVDYXRlZ29yeTEwLFxuICAgIC8vIGQzLnNjaGVtZUNhdGVnb3J5MjAsXG4gICAgcmV0dXJuIFtcbiAgICAgICcjNjhiZGY2JywgLy8gbGlnaHQgYmx1ZVxuICAgICAgJyM2ZGNlOWUnLCAvLyBncmVlbiAjMVxuICAgICAgJyNmYWFmYzInLCAvLyBsaWdodCBwaW5rXG4gICAgICAnI2YyYmFmNicsIC8vIHB1cnBsZVxuICAgICAgJyNmZjkyOGMnLCAvLyBsaWdodCByZWRcbiAgICAgICcjZmNlYTdlJywgLy8gbGlnaHQgeWVsbG93XG4gICAgICAnI2ZmYzc2NicsIC8vIGxpZ2h0IG9yYW5nZVxuICAgICAgJyM0MDVmOWUnLCAvLyBuYXZ5IGJsdWVcbiAgICAgICcjYTVhYmI2JywgLy8gZGFyayBncmF5XG4gICAgICAnIzc4Y2VjYicsIC8vIGdyZWVuICMyLFxuICAgICAgJyNiODhjYmInLCAvLyBkYXJrIHB1cnBsZVxuICAgICAgJyNjZWQyZDknLCAvLyBsaWdodCBncmF5XG4gICAgICAnI2U4NDY0NicsIC8vIGRhcmsgcmVkXG4gICAgICAnI2ZhNWY4NicsIC8vIGRhcmsgcGlua1xuICAgICAgJyNmZmFiMWEnLCAvLyBkYXJrIG9yYW5nZVxuICAgICAgJyNmY2RhMTknLCAvLyBkYXJrIHllbGxvd1xuICAgICAgJyM3OTdiODAnLCAvLyBibGFja1xuICAgICAgJyNjOWQ5NmYnLCAvLyBwaXN0YWNjaGlvXG4gICAgICAnIzQ3OTkxZicsIC8vIGdyZWVuICMzXG4gICAgICAnIzcwZWRlZScsIC8vIHR1cnF1b2lzZVxuICAgICAgJyNmZjc1ZWEnICAvLyBwaW5rXG4gICAgXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnRhaW5zKGFycmF5LCBpZCkge1xuICAgIHZhciBmaWx0ZXIgPSBhcnJheS5maWx0ZXIoZnVuY3Rpb24oZWxlbSkge1xuICAgICAgcmV0dXJuIGVsZW0uaWQgPT09IGlkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpbHRlci5sZW5ndGggPiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdENvbG9yKCkge1xuICAgIHJldHVybiBvcHRpb25zLnJlbGF0aW9uc2hpcENvbG9yO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdERhcmtlbkNvbG9yKCkge1xuICAgIHJldHVybiBkMy5yZ2Iob3B0aW9ucy5jb2xvcnNbb3B0aW9ucy5jb2xvcnMubGVuZ3RoIC0gMV0pLmRhcmtlcigxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYWdFbmRlZChkKSB7XG4gICAgaWYgKCFkMy5ldmVudC5hY3RpdmUpIHtcbiAgICAgIHNpbXVsYXRpb24uYWxwaGFUYXJnZXQoMCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZURyYWdFbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMub25Ob2RlRHJhZ0VuZChkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkcmFnZ2VkKGQpIHtcbiAgICBzdGlja05vZGUoZCk7XG4gIH1cblxuICBmdW5jdGlvbiBkcmFnU3RhcnRlZChkKSB7XG4gICAgaWYgKCFkMy5ldmVudC5hY3RpdmUpIHtcbiAgICAgIHNpbXVsYXRpb24uYWxwaGFUYXJnZXQoMC4zKS5yZXN0YXJ0KCk7XG4gICAgfVxuXG4gICAgZC5meCA9IGQueDtcbiAgICBkLmZ5ID0gZC55O1xuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZURyYWdTdGFydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3B0aW9ucy5vbk5vZGVEcmFnU3RhcnQoZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZXh0ZW5kKG9iajEsIG9iajIpIHtcbiAgICB2YXIgb2JqID0ge307XG5cbiAgICBtZXJnZShvYmosIG9iajEpO1xuICAgIG1lcmdlKG9iaiwgb2JqMik7XG5cbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9udEF3ZXNvbWVJY29ucygpIHtcbiAgICByZXR1cm4geydnbGFzcyc6J2YwMDAnLCdtdXNpYyc6J2YwMDEnLCdzZWFyY2gnOidmMDAyJywnZW52ZWxvcGUtbyc6J2YwMDMnLCdoZWFydCc6J2YwMDQnLCdzdGFyJzonZjAwNScsJ3N0YXItbyc6J2YwMDYnLCd1c2VyJzonZjAwNycsJ2ZpbG0nOidmMDA4JywndGgtbGFyZ2UnOidmMDA5JywndGgnOidmMDBhJywndGgtbGlzdCc6J2YwMGInLCdjaGVjayc6J2YwMGMnLCdyZW1vdmUsY2xvc2UsdGltZXMnOidmMDBkJywnc2VhcmNoLXBsdXMnOidmMDBlJywnc2VhcmNoLW1pbnVzJzonZjAxMCcsJ3Bvd2VyLW9mZic6J2YwMTEnLCdzaWduYWwnOidmMDEyJywnZ2Vhcixjb2cnOidmMDEzJywndHJhc2gtbyc6J2YwMTQnLCdob21lJzonZjAxNScsJ2ZpbGUtbyc6J2YwMTYnLCdjbG9jay1vJzonZjAxNycsJ3JvYWQnOidmMDE4JywnZG93bmxvYWQnOidmMDE5JywnYXJyb3ctY2lyY2xlLW8tZG93bic6J2YwMWEnLCdhcnJvdy1jaXJjbGUtby11cCc6J2YwMWInLCdpbmJveCc6J2YwMWMnLCdwbGF5LWNpcmNsZS1vJzonZjAxZCcsJ3JvdGF0ZS1yaWdodCxyZXBlYXQnOidmMDFlJywncmVmcmVzaCc6J2YwMjEnLCdsaXN0LWFsdCc6J2YwMjInLCdsb2NrJzonZjAyMycsJ2ZsYWcnOidmMDI0JywnaGVhZHBob25lcyc6J2YwMjUnLCd2b2x1bWUtb2ZmJzonZjAyNicsJ3ZvbHVtZS1kb3duJzonZjAyNycsJ3ZvbHVtZS11cCc6J2YwMjgnLCdxcmNvZGUnOidmMDI5JywnYmFyY29kZSc6J2YwMmEnLCd0YWcnOidmMDJiJywndGFncyc6J2YwMmMnLCdib29rJzonZjAyZCcsJ2Jvb2ttYXJrJzonZjAyZScsJ3ByaW50JzonZjAyZicsJ2NhbWVyYSc6J2YwMzAnLCdmb250JzonZjAzMScsJ2JvbGQnOidmMDMyJywnaXRhbGljJzonZjAzMycsJ3RleHQtaGVpZ2h0JzonZjAzNCcsJ3RleHQtd2lkdGgnOidmMDM1JywnYWxpZ24tbGVmdCc6J2YwMzYnLCdhbGlnbi1jZW50ZXInOidmMDM3JywnYWxpZ24tcmlnaHQnOidmMDM4JywnYWxpZ24tanVzdGlmeSc6J2YwMzknLCdsaXN0JzonZjAzYScsJ2RlZGVudCxvdXRkZW50JzonZjAzYicsJ2luZGVudCc6J2YwM2MnLCd2aWRlby1jYW1lcmEnOidmMDNkJywncGhvdG8saW1hZ2UscGljdHVyZS1vJzonZjAzZScsJ3BlbmNpbCc6J2YwNDAnLCdtYXAtbWFya2VyJzonZjA0MScsJ2FkanVzdCc6J2YwNDInLCd0aW50JzonZjA0MycsJ2VkaXQscGVuY2lsLXNxdWFyZS1vJzonZjA0NCcsJ3NoYXJlLXNxdWFyZS1vJzonZjA0NScsJ2NoZWNrLXNxdWFyZS1vJzonZjA0NicsJ2Fycm93cyc6J2YwNDcnLCdzdGVwLWJhY2t3YXJkJzonZjA0OCcsJ2Zhc3QtYmFja3dhcmQnOidmMDQ5JywnYmFja3dhcmQnOidmMDRhJywncGxheSc6J2YwNGInLCdwYXVzZSc6J2YwNGMnLCdzdG9wJzonZjA0ZCcsJ2ZvcndhcmQnOidmMDRlJywnZmFzdC1mb3J3YXJkJzonZjA1MCcsJ3N0ZXAtZm9yd2FyZCc6J2YwNTEnLCdlamVjdCc6J2YwNTInLCdjaGV2cm9uLWxlZnQnOidmMDUzJywnY2hldnJvbi1yaWdodCc6J2YwNTQnLCdwbHVzLWNpcmNsZSc6J2YwNTUnLCdtaW51cy1jaXJjbGUnOidmMDU2JywndGltZXMtY2lyY2xlJzonZjA1NycsJ2NoZWNrLWNpcmNsZSc6J2YwNTgnLCdxdWVzdGlvbi1jaXJjbGUnOidmMDU5JywnaW5mby1jaXJjbGUnOidmMDVhJywnY3Jvc3NoYWlycyc6J2YwNWInLCd0aW1lcy1jaXJjbGUtbyc6J2YwNWMnLCdjaGVjay1jaXJjbGUtbyc6J2YwNWQnLCdiYW4nOidmMDVlJywnYXJyb3ctbGVmdCc6J2YwNjAnLCdhcnJvdy1yaWdodCc6J2YwNjEnLCdhcnJvdy11cCc6J2YwNjInLCdhcnJvdy1kb3duJzonZjA2MycsJ21haWwtZm9yd2FyZCxzaGFyZSc6J2YwNjQnLCdleHBhbmQnOidmMDY1JywnY29tcHJlc3MnOidmMDY2JywncGx1cyc6J2YwNjcnLCdtaW51cyc6J2YwNjgnLCdhc3Rlcmlzayc6J2YwNjknLCdleGNsYW1hdGlvbi1jaXJjbGUnOidmMDZhJywnZ2lmdCc6J2YwNmInLCdsZWFmJzonZjA2YycsJ2ZpcmUnOidmMDZkJywnZXllJzonZjA2ZScsJ2V5ZS1zbGFzaCc6J2YwNzAnLCd3YXJuaW5nLGV4Y2xhbWF0aW9uLXRyaWFuZ2xlJzonZjA3MScsJ3BsYW5lJzonZjA3MicsJ2NhbGVuZGFyJzonZjA3MycsJ3JhbmRvbSc6J2YwNzQnLCdjb21tZW50JzonZjA3NScsJ21hZ25ldCc6J2YwNzYnLCdjaGV2cm9uLXVwJzonZjA3NycsJ2NoZXZyb24tZG93bic6J2YwNzgnLCdyZXR3ZWV0JzonZjA3OScsJ3Nob3BwaW5nLWNhcnQnOidmMDdhJywnZm9sZGVyJzonZjA3YicsJ2ZvbGRlci1vcGVuJzonZjA3YycsJ2Fycm93cy12JzonZjA3ZCcsJ2Fycm93cy1oJzonZjA3ZScsJ2Jhci1jaGFydC1vLGJhci1jaGFydCc6J2YwODAnLCd0d2l0dGVyLXNxdWFyZSc6J2YwODEnLCdmYWNlYm9vay1zcXVhcmUnOidmMDgyJywnY2FtZXJhLXJldHJvJzonZjA4MycsJ2tleSc6J2YwODQnLCdnZWFycyxjb2dzJzonZjA4NScsJ2NvbW1lbnRzJzonZjA4NicsJ3RodW1icy1vLXVwJzonZjA4NycsJ3RodW1icy1vLWRvd24nOidmMDg4Jywnc3Rhci1oYWxmJzonZjA4OScsJ2hlYXJ0LW8nOidmMDhhJywnc2lnbi1vdXQnOidmMDhiJywnbGlua2VkaW4tc3F1YXJlJzonZjA4YycsJ3RodW1iLXRhY2snOidmMDhkJywnZXh0ZXJuYWwtbGluayc6J2YwOGUnLCdzaWduLWluJzonZjA5MCcsJ3Ryb3BoeSc6J2YwOTEnLCdnaXRodWItc3F1YXJlJzonZjA5MicsJ3VwbG9hZCc6J2YwOTMnLCdsZW1vbi1vJzonZjA5NCcsJ3Bob25lJzonZjA5NScsJ3NxdWFyZS1vJzonZjA5NicsJ2Jvb2ttYXJrLW8nOidmMDk3JywncGhvbmUtc3F1YXJlJzonZjA5OCcsJ3R3aXR0ZXInOidmMDk5JywnZmFjZWJvb2stZixmYWNlYm9vayc6J2YwOWEnLCdnaXRodWInOidmMDliJywndW5sb2NrJzonZjA5YycsJ2NyZWRpdC1jYXJkJzonZjA5ZCcsJ2ZlZWQscnNzJzonZjA5ZScsJ2hkZC1vJzonZjBhMCcsJ2J1bGxob3JuJzonZjBhMScsJ2JlbGwnOidmMGYzJywnY2VydGlmaWNhdGUnOidmMGEzJywnaGFuZC1vLXJpZ2h0JzonZjBhNCcsJ2hhbmQtby1sZWZ0JzonZjBhNScsJ2hhbmQtby11cCc6J2YwYTYnLCdoYW5kLW8tZG93bic6J2YwYTcnLCdhcnJvdy1jaXJjbGUtbGVmdCc6J2YwYTgnLCdhcnJvdy1jaXJjbGUtcmlnaHQnOidmMGE5JywnYXJyb3ctY2lyY2xlLXVwJzonZjBhYScsJ2Fycm93LWNpcmNsZS1kb3duJzonZjBhYicsJ2dsb2JlJzonZjBhYycsJ3dyZW5jaCc6J2YwYWQnLCd0YXNrcyc6J2YwYWUnLCdmaWx0ZXInOidmMGIwJywnYnJpZWZjYXNlJzonZjBiMScsJ2Fycm93cy1hbHQnOidmMGIyJywnZ3JvdXAsdXNlcnMnOidmMGMwJywnY2hhaW4sbGluayc6J2YwYzEnLCdjbG91ZCc6J2YwYzInLCdmbGFzayc6J2YwYzMnLCdjdXQsc2Npc3NvcnMnOidmMGM0JywnY29weSxmaWxlcy1vJzonZjBjNScsJ3BhcGVyY2xpcCc6J2YwYzYnLCdzYXZlLGZsb3BweS1vJzonZjBjNycsJ3NxdWFyZSc6J2YwYzgnLCduYXZpY29uLHJlb3JkZXIsYmFycyc6J2YwYzknLCdsaXN0LXVsJzonZjBjYScsJ2xpc3Qtb2wnOidmMGNiJywnc3RyaWtldGhyb3VnaCc6J2YwY2MnLCd1bmRlcmxpbmUnOidmMGNkJywndGFibGUnOidmMGNlJywnbWFnaWMnOidmMGQwJywndHJ1Y2snOidmMGQxJywncGludGVyZXN0JzonZjBkMicsJ3BpbnRlcmVzdC1zcXVhcmUnOidmMGQzJywnZ29vZ2xlLXBsdXMtc3F1YXJlJzonZjBkNCcsJ2dvb2dsZS1wbHVzJzonZjBkNScsJ21vbmV5JzonZjBkNicsJ2NhcmV0LWRvd24nOidmMGQ3JywnY2FyZXQtdXAnOidmMGQ4JywnY2FyZXQtbGVmdCc6J2YwZDknLCdjYXJldC1yaWdodCc6J2YwZGEnLCdjb2x1bW5zJzonZjBkYicsJ3Vuc29ydGVkLHNvcnQnOidmMGRjJywnc29ydC1kb3duLHNvcnQtZGVzYyc6J2YwZGQnLCdzb3J0LXVwLHNvcnQtYXNjJzonZjBkZScsJ2VudmVsb3BlJzonZjBlMCcsJ2xpbmtlZGluJzonZjBlMScsJ3JvdGF0ZS1sZWZ0LHVuZG8nOidmMGUyJywnbGVnYWwsZ2F2ZWwnOidmMGUzJywnZGFzaGJvYXJkLHRhY2hvbWV0ZXInOidmMGU0JywnY29tbWVudC1vJzonZjBlNScsJ2NvbW1lbnRzLW8nOidmMGU2JywnZmxhc2gsYm9sdCc6J2YwZTcnLCdzaXRlbWFwJzonZjBlOCcsJ3VtYnJlbGxhJzonZjBlOScsJ3Bhc3RlLGNsaXBib2FyZCc6J2YwZWEnLCdsaWdodGJ1bGItbyc6J2YwZWInLCdleGNoYW5nZSc6J2YwZWMnLCdjbG91ZC1kb3dubG9hZCc6J2YwZWQnLCdjbG91ZC11cGxvYWQnOidmMGVlJywndXNlci1tZCc6J2YwZjAnLCdzdGV0aG9zY29wZSc6J2YwZjEnLCdzdWl0Y2FzZSc6J2YwZjInLCdiZWxsLW8nOidmMGEyJywnY29mZmVlJzonZjBmNCcsJ2N1dGxlcnknOidmMGY1JywnZmlsZS10ZXh0LW8nOidmMGY2JywnYnVpbGRpbmctbyc6J2YwZjcnLCdob3NwaXRhbC1vJzonZjBmOCcsJ2FtYnVsYW5jZSc6J2YwZjknLCdtZWRraXQnOidmMGZhJywnZmlnaHRlci1qZXQnOidmMGZiJywnYmVlcic6J2YwZmMnLCdoLXNxdWFyZSc6J2YwZmQnLCdwbHVzLXNxdWFyZSc6J2YwZmUnLCdhbmdsZS1kb3VibGUtbGVmdCc6J2YxMDAnLCdhbmdsZS1kb3VibGUtcmlnaHQnOidmMTAxJywnYW5nbGUtZG91YmxlLXVwJzonZjEwMicsJ2FuZ2xlLWRvdWJsZS1kb3duJzonZjEwMycsJ2FuZ2xlLWxlZnQnOidmMTA0JywnYW5nbGUtcmlnaHQnOidmMTA1JywnYW5nbGUtdXAnOidmMTA2JywnYW5nbGUtZG93bic6J2YxMDcnLCdkZXNrdG9wJzonZjEwOCcsJ2xhcHRvcCc6J2YxMDknLCd0YWJsZXQnOidmMTBhJywnbW9iaWxlLXBob25lLG1vYmlsZSc6J2YxMGInLCdjaXJjbGUtbyc6J2YxMGMnLCdxdW90ZS1sZWZ0JzonZjEwZCcsJ3F1b3RlLXJpZ2h0JzonZjEwZScsJ3NwaW5uZXInOidmMTEwJywnY2lyY2xlJzonZjExMScsJ21haWwtcmVwbHkscmVwbHknOidmMTEyJywnZ2l0aHViLWFsdCc6J2YxMTMnLCdmb2xkZXItbyc6J2YxMTQnLCdmb2xkZXItb3Blbi1vJzonZjExNScsJ3NtaWxlLW8nOidmMTE4JywnZnJvd24tbyc6J2YxMTknLCdtZWgtbyc6J2YxMWEnLCdnYW1lcGFkJzonZjExYicsJ2tleWJvYXJkLW8nOidmMTFjJywnZmxhZy1vJzonZjExZCcsJ2ZsYWctY2hlY2tlcmVkJzonZjExZScsJ3Rlcm1pbmFsJzonZjEyMCcsJ2NvZGUnOidmMTIxJywnbWFpbC1yZXBseS1hbGwscmVwbHktYWxsJzonZjEyMicsJ3N0YXItaGFsZi1lbXB0eSxzdGFyLWhhbGYtZnVsbCxzdGFyLWhhbGYtbyc6J2YxMjMnLCdsb2NhdGlvbi1hcnJvdyc6J2YxMjQnLCdjcm9wJzonZjEyNScsJ2NvZGUtZm9yayc6J2YxMjYnLCd1bmxpbmssY2hhaW4tYnJva2VuJzonZjEyNycsJ3F1ZXN0aW9uJzonZjEyOCcsJ2luZm8nOidmMTI5JywnZXhjbGFtYXRpb24nOidmMTJhJywnc3VwZXJzY3JpcHQnOidmMTJiJywnc3Vic2NyaXB0JzonZjEyYycsJ2VyYXNlcic6J2YxMmQnLCdwdXp6bGUtcGllY2UnOidmMTJlJywnbWljcm9waG9uZSc6J2YxMzAnLCdtaWNyb3Bob25lLXNsYXNoJzonZjEzMScsJ3NoaWVsZCc6J2YxMzInLCdjYWxlbmRhci1vJzonZjEzMycsJ2ZpcmUtZXh0aW5ndWlzaGVyJzonZjEzNCcsJ3JvY2tldCc6J2YxMzUnLCdtYXhjZG4nOidmMTM2JywnY2hldnJvbi1jaXJjbGUtbGVmdCc6J2YxMzcnLCdjaGV2cm9uLWNpcmNsZS1yaWdodCc6J2YxMzgnLCdjaGV2cm9uLWNpcmNsZS11cCc6J2YxMzknLCdjaGV2cm9uLWNpcmNsZS1kb3duJzonZjEzYScsJ2h0bWw1JzonZjEzYicsJ2NzczMnOidmMTNjJywnYW5jaG9yJzonZjEzZCcsJ3VubG9jay1hbHQnOidmMTNlJywnYnVsbHNleWUnOidmMTQwJywnZWxsaXBzaXMtaCc6J2YxNDEnLCdlbGxpcHNpcy12JzonZjE0MicsJ3Jzcy1zcXVhcmUnOidmMTQzJywncGxheS1jaXJjbGUnOidmMTQ0JywndGlja2V0JzonZjE0NScsJ21pbnVzLXNxdWFyZSc6J2YxNDYnLCdtaW51cy1zcXVhcmUtbyc6J2YxNDcnLCdsZXZlbC11cCc6J2YxNDgnLCdsZXZlbC1kb3duJzonZjE0OScsJ2NoZWNrLXNxdWFyZSc6J2YxNGEnLCdwZW5jaWwtc3F1YXJlJzonZjE0YicsJ2V4dGVybmFsLWxpbmstc3F1YXJlJzonZjE0YycsJ3NoYXJlLXNxdWFyZSc6J2YxNGQnLCdjb21wYXNzJzonZjE0ZScsJ3RvZ2dsZS1kb3duLGNhcmV0LXNxdWFyZS1vLWRvd24nOidmMTUwJywndG9nZ2xlLXVwLGNhcmV0LXNxdWFyZS1vLXVwJzonZjE1MScsJ3RvZ2dsZS1yaWdodCxjYXJldC1zcXVhcmUtby1yaWdodCc6J2YxNTInLCdldXJvLGV1cic6J2YxNTMnLCdnYnAnOidmMTU0JywnZG9sbGFyLHVzZCc6J2YxNTUnLCdydXBlZSxpbnInOidmMTU2JywnY255LHJtYix5ZW4sanB5JzonZjE1NycsJ3J1YmxlLHJvdWJsZSxydWInOidmMTU4Jywnd29uLGtydyc6J2YxNTknLCdiaXRjb2luLGJ0Yyc6J2YxNWEnLCdmaWxlJzonZjE1YicsJ2ZpbGUtdGV4dCc6J2YxNWMnLCdzb3J0LWFscGhhLWFzYyc6J2YxNWQnLCdzb3J0LWFscGhhLWRlc2MnOidmMTVlJywnc29ydC1hbW91bnQtYXNjJzonZjE2MCcsJ3NvcnQtYW1vdW50LWRlc2MnOidmMTYxJywnc29ydC1udW1lcmljLWFzYyc6J2YxNjInLCdzb3J0LW51bWVyaWMtZGVzYyc6J2YxNjMnLCd0aHVtYnMtdXAnOidmMTY0JywndGh1bWJzLWRvd24nOidmMTY1JywneW91dHViZS1zcXVhcmUnOidmMTY2JywneW91dHViZSc6J2YxNjcnLCd4aW5nJzonZjE2OCcsJ3hpbmctc3F1YXJlJzonZjE2OScsJ3lvdXR1YmUtcGxheSc6J2YxNmEnLCdkcm9wYm94JzonZjE2YicsJ3N0YWNrLW92ZXJmbG93JzonZjE2YycsJ2luc3RhZ3JhbSc6J2YxNmQnLCdmbGlja3InOidmMTZlJywnYWRuJzonZjE3MCcsJ2JpdGJ1Y2tldCc6J2YxNzEnLCdiaXRidWNrZXQtc3F1YXJlJzonZjE3MicsJ3R1bWJscic6J2YxNzMnLCd0dW1ibHItc3F1YXJlJzonZjE3NCcsJ2xvbmctYXJyb3ctZG93bic6J2YxNzUnLCdsb25nLWFycm93LXVwJzonZjE3NicsJ2xvbmctYXJyb3ctbGVmdCc6J2YxNzcnLCdsb25nLWFycm93LXJpZ2h0JzonZjE3OCcsJ2FwcGxlJzonZjE3OScsJ3dpbmRvd3MnOidmMTdhJywnYW5kcm9pZCc6J2YxN2InLCdsaW51eCc6J2YxN2MnLCdkcmliYmJsZSc6J2YxN2QnLCdza3lwZSc6J2YxN2UnLCdmb3Vyc3F1YXJlJzonZjE4MCcsJ3RyZWxsbyc6J2YxODEnLCdmZW1hbGUnOidmMTgyJywnbWFsZSc6J2YxODMnLCdnaXR0aXAsZ3JhdGlwYXknOidmMTg0Jywnc3VuLW8nOidmMTg1JywnbW9vbi1vJzonZjE4NicsJ2FyY2hpdmUnOidmMTg3JywnYnVnJzonZjE4OCcsJ3ZrJzonZjE4OScsJ3dlaWJvJzonZjE4YScsJ3JlbnJlbic6J2YxOGInLCdwYWdlbGluZXMnOidmMThjJywnc3RhY2stZXhjaGFuZ2UnOidmMThkJywnYXJyb3ctY2lyY2xlLW8tcmlnaHQnOidmMThlJywnYXJyb3ctY2lyY2xlLW8tbGVmdCc6J2YxOTAnLCd0b2dnbGUtbGVmdCxjYXJldC1zcXVhcmUtby1sZWZ0JzonZjE5MScsJ2RvdC1jaXJjbGUtbyc6J2YxOTInLCd3aGVlbGNoYWlyJzonZjE5MycsJ3ZpbWVvLXNxdWFyZSc6J2YxOTQnLCd0dXJraXNoLWxpcmEsdHJ5JzonZjE5NScsJ3BsdXMtc3F1YXJlLW8nOidmMTk2Jywnc3BhY2Utc2h1dHRsZSc6J2YxOTcnLCdzbGFjayc6J2YxOTgnLCdlbnZlbG9wZS1zcXVhcmUnOidmMTk5Jywnd29yZHByZXNzJzonZjE5YScsJ29wZW5pZCc6J2YxOWInLCdpbnN0aXR1dGlvbixiYW5rLHVuaXZlcnNpdHknOidmMTljJywnbW9ydGFyLWJvYXJkLGdyYWR1YXRpb24tY2FwJzonZjE5ZCcsJ3lhaG9vJzonZjE5ZScsJ2dvb2dsZSc6J2YxYTAnLCdyZWRkaXQnOidmMWExJywncmVkZGl0LXNxdWFyZSc6J2YxYTInLCdzdHVtYmxldXBvbi1jaXJjbGUnOidmMWEzJywnc3R1bWJsZXVwb24nOidmMWE0JywnZGVsaWNpb3VzJzonZjFhNScsJ2RpZ2cnOidmMWE2JywncGllZC1waXBlci1wcCc6J2YxYTcnLCdwaWVkLXBpcGVyLWFsdCc6J2YxYTgnLCdkcnVwYWwnOidmMWE5Jywnam9vbWxhJzonZjFhYScsJ2xhbmd1YWdlJzonZjFhYicsJ2ZheCc6J2YxYWMnLCdidWlsZGluZyc6J2YxYWQnLCdjaGlsZCc6J2YxYWUnLCdwYXcnOidmMWIwJywnc3Bvb24nOidmMWIxJywnY3ViZSc6J2YxYjInLCdjdWJlcyc6J2YxYjMnLCdiZWhhbmNlJzonZjFiNCcsJ2JlaGFuY2Utc3F1YXJlJzonZjFiNScsJ3N0ZWFtJzonZjFiNicsJ3N0ZWFtLXNxdWFyZSc6J2YxYjcnLCdyZWN5Y2xlJzonZjFiOCcsJ2F1dG9tb2JpbGUsY2FyJzonZjFiOScsJ2NhYix0YXhpJzonZjFiYScsJ3RyZWUnOidmMWJiJywnc3BvdGlmeSc6J2YxYmMnLCdkZXZpYW50YXJ0JzonZjFiZCcsJ3NvdW5kY2xvdWQnOidmMWJlJywnZGF0YWJhc2UnOidmMWMwJywnZmlsZS1wZGYtbyc6J2YxYzEnLCdmaWxlLXdvcmQtbyc6J2YxYzInLCdmaWxlLWV4Y2VsLW8nOidmMWMzJywnZmlsZS1wb3dlcnBvaW50LW8nOidmMWM0JywnZmlsZS1waG90by1vLGZpbGUtcGljdHVyZS1vLGZpbGUtaW1hZ2Utbyc6J2YxYzUnLCdmaWxlLXppcC1vLGZpbGUtYXJjaGl2ZS1vJzonZjFjNicsJ2ZpbGUtc291bmQtbyxmaWxlLWF1ZGlvLW8nOidmMWM3JywnZmlsZS1tb3ZpZS1vLGZpbGUtdmlkZW8tbyc6J2YxYzgnLCdmaWxlLWNvZGUtbyc6J2YxYzknLCd2aW5lJzonZjFjYScsJ2NvZGVwZW4nOidmMWNiJywnanNmaWRkbGUnOidmMWNjJywnbGlmZS1ib3V5LGxpZmUtYnVveSxsaWZlLXNhdmVyLHN1cHBvcnQsbGlmZS1yaW5nJzonZjFjZCcsJ2NpcmNsZS1vLW5vdGNoJzonZjFjZScsJ3JhLHJlc2lzdGFuY2UscmViZWwnOidmMWQwJywnZ2UsZW1waXJlJzonZjFkMScsJ2dpdC1zcXVhcmUnOidmMWQyJywnZ2l0JzonZjFkMycsJ3ktY29tYmluYXRvci1zcXVhcmUseWMtc3F1YXJlLGhhY2tlci1uZXdzJzonZjFkNCcsJ3RlbmNlbnQtd2VpYm8nOidmMWQ1JywncXEnOidmMWQ2Jywnd2VjaGF0LHdlaXhpbic6J2YxZDcnLCdzZW5kLHBhcGVyLXBsYW5lJzonZjFkOCcsJ3NlbmQtbyxwYXBlci1wbGFuZS1vJzonZjFkOScsJ2hpc3RvcnknOidmMWRhJywnY2lyY2xlLXRoaW4nOidmMWRiJywnaGVhZGVyJzonZjFkYycsJ3BhcmFncmFwaCc6J2YxZGQnLCdzbGlkZXJzJzonZjFkZScsJ3NoYXJlLWFsdCc6J2YxZTAnLCdzaGFyZS1hbHQtc3F1YXJlJzonZjFlMScsJ2JvbWInOidmMWUyJywnc29jY2VyLWJhbGwtbyxmdXRib2wtbyc6J2YxZTMnLCd0dHknOidmMWU0JywnYmlub2N1bGFycyc6J2YxZTUnLCdwbHVnJzonZjFlNicsJ3NsaWRlc2hhcmUnOidmMWU3JywndHdpdGNoJzonZjFlOCcsJ3llbHAnOidmMWU5JywnbmV3c3BhcGVyLW8nOidmMWVhJywnd2lmaSc6J2YxZWInLCdjYWxjdWxhdG9yJzonZjFlYycsJ3BheXBhbCc6J2YxZWQnLCdnb29nbGUtd2FsbGV0JzonZjFlZScsJ2NjLXZpc2EnOidmMWYwJywnY2MtbWFzdGVyY2FyZCc6J2YxZjEnLCdjYy1kaXNjb3Zlcic6J2YxZjInLCdjYy1hbWV4JzonZjFmMycsJ2NjLXBheXBhbCc6J2YxZjQnLCdjYy1zdHJpcGUnOidmMWY1JywnYmVsbC1zbGFzaCc6J2YxZjYnLCdiZWxsLXNsYXNoLW8nOidmMWY3JywndHJhc2gnOidmMWY4JywnY29weXJpZ2h0JzonZjFmOScsJ2F0JzonZjFmYScsJ2V5ZWRyb3BwZXInOidmMWZiJywncGFpbnQtYnJ1c2gnOidmMWZjJywnYmlydGhkYXktY2FrZSc6J2YxZmQnLCdhcmVhLWNoYXJ0JzonZjFmZScsJ3BpZS1jaGFydCc6J2YyMDAnLCdsaW5lLWNoYXJ0JzonZjIwMScsJ2xhc3RmbSc6J2YyMDInLCdsYXN0Zm0tc3F1YXJlJzonZjIwMycsJ3RvZ2dsZS1vZmYnOidmMjA0JywndG9nZ2xlLW9uJzonZjIwNScsJ2JpY3ljbGUnOidmMjA2JywnYnVzJzonZjIwNycsJ2lveGhvc3QnOidmMjA4JywnYW5nZWxsaXN0JzonZjIwOScsJ2NjJzonZjIwYScsJ3NoZWtlbCxzaGVxZWwsaWxzJzonZjIwYicsJ21lYW5wYXRoJzonZjIwYycsJ2J1eXNlbGxhZHMnOidmMjBkJywnY29ubmVjdGRldmVsb3AnOidmMjBlJywnZGFzaGN1YmUnOidmMjEwJywnZm9ydW1iZWUnOidmMjExJywnbGVhbnB1Yic6J2YyMTInLCdzZWxsc3knOidmMjEzJywnc2hpcnRzaW5idWxrJzonZjIxNCcsJ3NpbXBseWJ1aWx0JzonZjIxNScsJ3NreWF0bGFzJzonZjIxNicsJ2NhcnQtcGx1cyc6J2YyMTcnLCdjYXJ0LWFycm93LWRvd24nOidmMjE4JywnZGlhbW9uZCc6J2YyMTknLCdzaGlwJzonZjIxYScsJ3VzZXItc2VjcmV0JzonZjIxYicsJ21vdG9yY3ljbGUnOidmMjFjJywnc3RyZWV0LXZpZXcnOidmMjFkJywnaGVhcnRiZWF0JzonZjIxZScsJ3ZlbnVzJzonZjIyMScsJ21hcnMnOidmMjIyJywnbWVyY3VyeSc6J2YyMjMnLCdpbnRlcnNleCx0cmFuc2dlbmRlcic6J2YyMjQnLCd0cmFuc2dlbmRlci1hbHQnOidmMjI1JywndmVudXMtZG91YmxlJzonZjIyNicsJ21hcnMtZG91YmxlJzonZjIyNycsJ3ZlbnVzLW1hcnMnOidmMjI4JywnbWFycy1zdHJva2UnOidmMjI5JywnbWFycy1zdHJva2Utdic6J2YyMmEnLCdtYXJzLXN0cm9rZS1oJzonZjIyYicsJ25ldXRlcic6J2YyMmMnLCdnZW5kZXJsZXNzJzonZjIyZCcsJ2ZhY2Vib29rLW9mZmljaWFsJzonZjIzMCcsJ3BpbnRlcmVzdC1wJzonZjIzMScsJ3doYXRzYXBwJzonZjIzMicsJ3NlcnZlcic6J2YyMzMnLCd1c2VyLXBsdXMnOidmMjM0JywndXNlci10aW1lcyc6J2YyMzUnLCdob3RlbCxiZWQnOidmMjM2JywndmlhY29pbic6J2YyMzcnLCd0cmFpbic6J2YyMzgnLCdzdWJ3YXknOidmMjM5JywnbWVkaXVtJzonZjIzYScsJ3ljLHktY29tYmluYXRvcic6J2YyM2InLCdvcHRpbi1tb25zdGVyJzonZjIzYycsJ29wZW5jYXJ0JzonZjIzZCcsJ2V4cGVkaXRlZHNzbCc6J2YyM2UnLCdiYXR0ZXJ5LTQsYmF0dGVyeS1mdWxsJzonZjI0MCcsJ2JhdHRlcnktMyxiYXR0ZXJ5LXRocmVlLXF1YXJ0ZXJzJzonZjI0MScsJ2JhdHRlcnktMixiYXR0ZXJ5LWhhbGYnOidmMjQyJywnYmF0dGVyeS0xLGJhdHRlcnktcXVhcnRlcic6J2YyNDMnLCdiYXR0ZXJ5LTAsYmF0dGVyeS1lbXB0eSc6J2YyNDQnLCdtb3VzZS1wb2ludGVyJzonZjI0NScsJ2ktY3Vyc29yJzonZjI0NicsJ29iamVjdC1ncm91cCc6J2YyNDcnLCdvYmplY3QtdW5ncm91cCc6J2YyNDgnLCdzdGlja3ktbm90ZSc6J2YyNDknLCdzdGlja3ktbm90ZS1vJzonZjI0YScsJ2NjLWpjYic6J2YyNGInLCdjYy1kaW5lcnMtY2x1Yic6J2YyNGMnLCdjbG9uZSc6J2YyNGQnLCdiYWxhbmNlLXNjYWxlJzonZjI0ZScsJ2hvdXJnbGFzcy1vJzonZjI1MCcsJ2hvdXJnbGFzcy0xLGhvdXJnbGFzcy1zdGFydCc6J2YyNTEnLCdob3VyZ2xhc3MtMixob3VyZ2xhc3MtaGFsZic6J2YyNTInLCdob3VyZ2xhc3MtMyxob3VyZ2xhc3MtZW5kJzonZjI1MycsJ2hvdXJnbGFzcyc6J2YyNTQnLCdoYW5kLWdyYWItbyxoYW5kLXJvY2stbyc6J2YyNTUnLCdoYW5kLXN0b3AtbyxoYW5kLXBhcGVyLW8nOidmMjU2JywnaGFuZC1zY2lzc29ycy1vJzonZjI1NycsJ2hhbmQtbGl6YXJkLW8nOidmMjU4JywnaGFuZC1zcG9jay1vJzonZjI1OScsJ2hhbmQtcG9pbnRlci1vJzonZjI1YScsJ2hhbmQtcGVhY2Utbyc6J2YyNWInLCd0cmFkZW1hcmsnOidmMjVjJywncmVnaXN0ZXJlZCc6J2YyNWQnLCdjcmVhdGl2ZS1jb21tb25zJzonZjI1ZScsJ2dnJzonZjI2MCcsJ2dnLWNpcmNsZSc6J2YyNjEnLCd0cmlwYWR2aXNvcic6J2YyNjInLCdvZG5va2xhc3NuaWtpJzonZjI2MycsJ29kbm9rbGFzc25pa2ktc3F1YXJlJzonZjI2NCcsJ2dldC1wb2NrZXQnOidmMjY1Jywnd2lraXBlZGlhLXcnOidmMjY2Jywnc2FmYXJpJzonZjI2NycsJ2Nocm9tZSc6J2YyNjgnLCdmaXJlZm94JzonZjI2OScsJ29wZXJhJzonZjI2YScsJ2ludGVybmV0LWV4cGxvcmVyJzonZjI2YicsJ3R2LHRlbGV2aXNpb24nOidmMjZjJywnY29udGFvJzonZjI2ZCcsJzUwMHB4JzonZjI2ZScsJ2FtYXpvbic6J2YyNzAnLCdjYWxlbmRhci1wbHVzLW8nOidmMjcxJywnY2FsZW5kYXItbWludXMtbyc6J2YyNzInLCdjYWxlbmRhci10aW1lcy1vJzonZjI3MycsJ2NhbGVuZGFyLWNoZWNrLW8nOidmMjc0JywnaW5kdXN0cnknOidmMjc1JywnbWFwLXBpbic6J2YyNzYnLCdtYXAtc2lnbnMnOidmMjc3JywnbWFwLW8nOidmMjc4JywnbWFwJzonZjI3OScsJ2NvbW1lbnRpbmcnOidmMjdhJywnY29tbWVudGluZy1vJzonZjI3YicsJ2hvdXp6JzonZjI3YycsJ3ZpbWVvJzonZjI3ZCcsJ2JsYWNrLXRpZSc6J2YyN2UnLCdmb250aWNvbnMnOidmMjgwJywncmVkZGl0LWFsaWVuJzonZjI4MScsJ2VkZ2UnOidmMjgyJywnY3JlZGl0LWNhcmQtYWx0JzonZjI4MycsJ2NvZGllcGllJzonZjI4NCcsJ21vZHgnOidmMjg1JywnZm9ydC1hd2Vzb21lJzonZjI4NicsJ3VzYic6J2YyODcnLCdwcm9kdWN0LWh1bnQnOidmMjg4JywnbWl4Y2xvdWQnOidmMjg5Jywnc2NyaWJkJzonZjI4YScsJ3BhdXNlLWNpcmNsZSc6J2YyOGInLCdwYXVzZS1jaXJjbGUtbyc6J2YyOGMnLCdzdG9wLWNpcmNsZSc6J2YyOGQnLCdzdG9wLWNpcmNsZS1vJzonZjI4ZScsJ3Nob3BwaW5nLWJhZyc6J2YyOTAnLCdzaG9wcGluZy1iYXNrZXQnOidmMjkxJywnaGFzaHRhZyc6J2YyOTInLCdibHVldG9vdGgnOidmMjkzJywnYmx1ZXRvb3RoLWInOidmMjk0JywncGVyY2VudCc6J2YyOTUnLCdnaXRsYWInOidmMjk2Jywnd3BiZWdpbm5lcic6J2YyOTcnLCd3cGZvcm1zJzonZjI5OCcsJ2VudmlyYSc6J2YyOTknLCd1bml2ZXJzYWwtYWNjZXNzJzonZjI5YScsJ3doZWVsY2hhaXItYWx0JzonZjI5YicsJ3F1ZXN0aW9uLWNpcmNsZS1vJzonZjI5YycsJ2JsaW5kJzonZjI5ZCcsJ2F1ZGlvLWRlc2NyaXB0aW9uJzonZjI5ZScsJ3ZvbHVtZS1jb250cm9sLXBob25lJzonZjJhMCcsJ2JyYWlsbGUnOidmMmExJywnYXNzaXN0aXZlLWxpc3RlbmluZy1zeXN0ZW1zJzonZjJhMicsJ2FzbC1pbnRlcnByZXRpbmcsYW1lcmljYW4tc2lnbi1sYW5ndWFnZS1pbnRlcnByZXRpbmcnOidmMmEzJywnZGVhZm5lc3MsaGFyZC1vZi1oZWFyaW5nLGRlYWYnOidmMmE0JywnZ2xpZGUnOidmMmE1JywnZ2xpZGUtZyc6J2YyYTYnLCdzaWduaW5nLHNpZ24tbGFuZ3VhZ2UnOidmMmE3JywnbG93LXZpc2lvbic6J2YyYTgnLCd2aWFkZW8nOidmMmE5JywndmlhZGVvLXNxdWFyZSc6J2YyYWEnLCdzbmFwY2hhdCc6J2YyYWInLCdzbmFwY2hhdC1naG9zdCc6J2YyYWMnLCdzbmFwY2hhdC1zcXVhcmUnOidmMmFkJywncGllZC1waXBlcic6J2YyYWUnLCdmaXJzdC1vcmRlcic6J2YyYjAnLCd5b2FzdCc6J2YyYjEnLCd0aGVtZWlzbGUnOidmMmIyJywnZ29vZ2xlLXBsdXMtY2lyY2xlLGdvb2dsZS1wbHVzLW9mZmljaWFsJzonZjJiMycsJ2ZhLGZvbnQtYXdlc29tZSc6J2YyYjQnfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpY29uKGQpIHtcbiAgICAgIHZhciBjb2RlO1xuXG4gICAgICBpZiAob3B0aW9ucy5pY29uTWFwICYmIG9wdGlvbnMuc2hvd0ljb25zICYmIG9wdGlvbnMuaWNvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dICYmIG9wdGlvbnMuaWNvbk1hcFtvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXV0pIHtcbiAgICAgICAgICBjb2RlID0gb3B0aW9ucy5pY29uTWFwW29wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dXTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmljb25NYXBbZC5sYWJlbHNbMF1dKSB7XG4gICAgICAgICAgY29kZSA9IG9wdGlvbnMuaWNvbk1hcFtkLmxhYmVsc1swXV07XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV0pIHtcbiAgICAgICAgICBjb2RlID0gb3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuXG5mdW5jdGlvbiBpbWFnZShkKSB7XG4gIHZhciBpLCBpbWFnZXNGb3JMYWJlbCwgaW1nLCBpbWdMZXZlbCwgbGFiZWwsIGxhYmVsUHJvcGVydHlWYWx1ZSwgcHJvcGVydHksIHZhbHVlO1xuXG4gIGlmIChvcHRpb25zLmltYWdlcykge1xuICAgIGltYWdlc0ZvckxhYmVsID0gb3B0aW9ucy5pbWFnZU1hcFtkLmxhYmVsc1swXV07XG5cbiAgICBpZiAoaW1hZ2VzRm9yTGFiZWwpIHtcbiAgICAgIGltZ0xldmVsID0gMDtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGltYWdlc0ZvckxhYmVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxhYmVsUHJvcGVydHlWYWx1ZSA9IGltYWdlc0ZvckxhYmVsW2ldLnNwbGl0KCd8Jyk7XG5cbiAgICAgICAgc3dpdGNoIChsYWJlbFByb3BlcnR5VmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgdmFsdWUgPSBsYWJlbFByb3BlcnR5VmFsdWVbMl07XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcHJvcGVydHkgPSBsYWJlbFByb3BlcnR5VmFsdWVbMV07XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgbGFiZWwgPSBsYWJlbFByb3BlcnR5VmFsdWVbMF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZC5sYWJlbHNbMF0gPT09IGxhYmVsICYmXG4gICAgICAgICAgKCFwcm9wZXJ0eSB8fCBkLnByb3BlcnRpZXNbcHJvcGVydHldICE9PSB1bmRlZmluZWQpICYmXG4gICAgICAgICAgKCF2YWx1ZSB8fCBkLnByb3BlcnRpZXNbcHJvcGVydHldID09PSB2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAobGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aCA+IGltZ0xldmVsKSB7XG4gICAgICAgICAgICBpbWcgPSBvcHRpb25zLmltYWdlc1tpbWFnZXNGb3JMYWJlbFtpXV07XG4gICAgICAgICAgICBpbWdMZXZlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltZztcbn1cblxuZnVuY3Rpb24gaW5pdChfc2VsZWN0b3IsIF9vcHRpb25zKSB7XG4gIGluaXRJY29uTWFwKCk7XG5cbiAgbWVyZ2Uob3B0aW9ucywgX29wdGlvbnMpO1xuXG4gIGlmIChvcHRpb25zLmljb25zKSB7XG4gICAgb3B0aW9ucy5zaG93SWNvbnMgPSB0cnVlO1xuICB9XG5cbiAgaWYgKCFvcHRpb25zLm1pbkNvbGxpc2lvbikge1xuICAgIG9wdGlvbnMubWluQ29sbGlzaW9uID0gb3B0aW9ucy5ub2RlUmFkaXVzICogMjtcbiAgfVxuXG4gIGluaXRJbWFnZU1hcCgpO1xuXG4gIHNlbGVjdG9yID0gX3NlbGVjdG9yO1xuXG4gIGNvbnRhaW5lciA9IGQzLnNlbGVjdChzZWxlY3Rvcik7XG5cbiAgY29udGFpbmVyLmF0dHIoJ2NsYXNzJywgJ25lbzRqZDMnKVxuICAgIC5odG1sKCcnKTtcblxuICBpZiAob3B0aW9ucy5pbmZvUGFuZWwpIHtcbiAgICBpbmZvID0gYXBwZW5kSW5mb1BhbmVsKGNvbnRhaW5lcik7XG4gIH1cblxuICBhcHBlbmRHcmFwaChjb250YWluZXIpO1xuXG4gIHNpbXVsYXRpb24gPSBpbml0U2ltdWxhdGlvbigpO1xuXG5cbiAgaWYgKG9wdGlvbnMubmVvNGpEYXRhKSB7XG4gICAgbG9hZE5lbzRqRGF0YShvcHRpb25zLm5lbzRqRGF0YSk7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy5uZW80akRhdGFVcmwpIHtcbiAgICBsb2FkTmVvNGpEYXRhRnJvbVVybChvcHRpb25zLm5lbzRqRGF0YVVybCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3I6IGJvdGggbmVvNGpEYXRhIGFuZCBuZW80akRhdGFVcmwgYXJlIGVtcHR5IScpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRJY29uTWFwKCkge1xuICBPYmplY3Qua2V5cyhvcHRpb25zLmljb25NYXApLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KCcsJyksXG4gICAgICB2YWx1ZSA9IG9wdGlvbnMuaWNvbk1hcFtrZXldO1xuXG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgb3B0aW9ucy5pY29uTWFwW2tleV0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRJbWFnZU1hcCgpIHtcbiAgdmFyIGtleSwga2V5cywgc2VsZWN0b3I7XG5cbiAgZm9yIChrZXkgaW4gb3B0aW9ucy5pbWFnZXMpIHtcbiAgICBpZiAob3B0aW9ucy5pbWFnZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAga2V5cyA9IGtleS5zcGxpdCgnfCcpO1xuXG4gICAgICBpZiAoIW9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0pIHtcbiAgICAgICAgb3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXSA9IFtrZXldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXS5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRTaW11bGF0aW9uKCkge1xuICB2YXIgc3ByZWFkRmFjdG9yID0gMS4yNTtcbiAgdmFyIHNpbXVsYXRpb24gPSBkMy5mb3JjZVNpbXVsYXRpb24oKVxuICAvLy5mb3JjZSgneCcsIGQzLmZvcmNlQ29sbGlkZSgpLnN0cmVuZ3RoKDAuMDAyKSlcbiAgLy8uZm9yY2UoJ3knLCBkMy5mb3JjZUNvbGxpZGUoKS5zdHJlbmd0aCgwLjAwMikpXG4gIC8vLmZvcmNlKCd5JywgZDMuZm9yY2UoKS5zdHJlbmd0aCgwLjAwMikpXG4gICAgLmZvcmNlKCdjb2xsaWRlJywgZDMuZm9yY2VDb2xsaWRlKCkucmFkaXVzKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLm1pbkNvbGxpc2lvbiAqIHNwcmVhZEZhY3RvcjtcbiAgICB9KS5pdGVyYXRpb25zKDEwKSlcbiAgICAuZm9yY2UoJ2NoYXJnZScsIGQzLmZvcmNlTWFueUJvZHkoKSlcbiAgICAuZm9yY2UoJ2xpbmsnLCBkMy5mb3JjZUxpbmsoKS5pZChmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZC5pZDtcbiAgICB9KSlcbiAgICAuZm9yY2UoJ2NlbnRlcicsIGQzLmZvcmNlQ2VudGVyKHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMiwgc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gMikpXG4gICAgLm9uKCd0aWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICB0aWNrKCk7XG4gICAgfSlcbiAgICAub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKG9wdGlvbnMuem9vbUZpdCAmJiAhanVzdExvYWRlZCkge1xuICAgICAgICBqdXN0TG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgem9vbUZpdCgyKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICByZXR1cm4gc2ltdWxhdGlvbjtcbn1cblxuZnVuY3Rpb24gbG9hZE5lbzRqRGF0YSgpIHtcbiAgbm9kZXMgPSBbXTtcbiAgcmVsYXRpb25zaGlwcyA9IFtdO1xuXG4gIHVwZGF0ZVdpdGhOZW80akRhdGEob3B0aW9ucy5uZW80akRhdGEpO1xufVxuXG5mdW5jdGlvbiBsb2FkTmVvNGpEYXRhRnJvbVVybChuZW80akRhdGFVcmwpIHtcbiAgbm9kZXMgPSBbXTtcbiAgcmVsYXRpb25zaGlwcyA9IFtdO1xuXG4gIGQzLmpzb24obmVvNGpEYXRhVXJsLCBmdW5jdGlvbihlcnJvciwgZGF0YSkge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgdXBkYXRlV2l0aE5lbzRqRGF0YShkYXRhKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc291cmNlKSB7XG4gIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgIHRhcmdldFtwcm9wZXJ0eV0gPSBzb3VyY2VbcHJvcGVydHldO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gbmVvNGpEYXRhVG9EM0RhdGEoZGF0YSkge1xuICB2YXIgZ3JhcGggPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIHJlbGF0aW9uc2hpcHM6IFtdXG4gIH07XG5cbiAgZGF0YS5yZXN1bHRzLmZvckVhY2goZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgcmVzdWx0LmRhdGEuZm9yRWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICBkYXRhLmdyYXBoLm5vZGVzLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBpZiAoIWNvbnRhaW5zKGdyYXBoLm5vZGVzLCBub2RlLmlkKSkge1xuICAgICAgICAgIGdyYXBoLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHMuZm9yRWFjaChmdW5jdGlvbihyZWxhdGlvbnNoaXApIHtcbiAgICAgICAgcmVsYXRpb25zaGlwLnNvdXJjZSA9IHJlbGF0aW9uc2hpcC5zdGFydE5vZGU7XG4gICAgICAgIHJlbGF0aW9uc2hpcC50YXJnZXQgPSByZWxhdGlvbnNoaXAuZW5kTm9kZTtcbiAgICAgICAgZ3JhcGgucmVsYXRpb25zaGlwcy5wdXNoKHJlbGF0aW9uc2hpcCk7XG4gICAgICB9KTtcblxuICAgICAgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICBpZiAoYS5zb3VyY2UgPiBiLnNvdXJjZSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2UgaWYgKGEuc291cmNlIDwgYi5zb3VyY2UpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGEudGFyZ2V0ID4gYi50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLnRhcmdldCA8IGIudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpICE9PSAwICYmIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS5zb3VyY2UgPT09IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpLTFdLnNvdXJjZSAmJiBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0udGFyZ2V0ID09PSBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaS0xXS50YXJnZXQpIHtcbiAgICAgICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0ubGlua251bSA9IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0ubGlua251bSArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLmxpbmtudW0gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBncmFwaDtcbn1cblxuZnVuY3Rpb24gcm90YXRlKGN4LCBjeSwgeCwgeSwgYW5nbGUpIHtcbiAgdmFyIHJhZGlhbnMgPSAoTWF0aC5QSSAvIDE4MCkgKiBhbmdsZSxcbiAgICBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKSxcbiAgICBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKSxcbiAgICBueCA9IChjb3MgKiAoeCAtIGN4KSkgKyAoc2luICogKHkgLSBjeSkpICsgY3gsXG4gICAgbnkgPSAoY29zICogKHkgLSBjeSkpIC0gKHNpbiAqICh4IC0gY3gpKSArIGN5O1xuXG4gIHJldHVybiB7IHg6IG54LCB5OiBueSB9O1xufVxuXG5mdW5jdGlvbiByb3RhdGVQb2ludChjLCBwLCBhbmdsZSkge1xuICByZXR1cm4gcm90YXRlKGMueCwgYy55LCBwLngsIHAueSwgYW5nbGUpO1xufVxuXG5mdW5jdGlvbiByb3RhdGlvbihzb3VyY2UsIHRhcmdldCkge1xuICByZXR1cm4gTWF0aC5hdGFuMih0YXJnZXQueSAtIHNvdXJjZS55LCB0YXJnZXQueCAtIHNvdXJjZS54KSAqIDE4MCAvIE1hdGguUEk7XG59XG5cbmZ1bmN0aW9uIHNpemUoKSB7XG4gIHJldHVybiB7XG4gICAgbm9kZXM6IG5vZGVzLmxlbmd0aCxcbiAgICByZWxhdGlvbnNoaXBzOiByZWxhdGlvbnNoaXBzLmxlbmd0aFxuICB9O1xufVxuLypcbiAgICBmdW5jdGlvbiBzbW9vdGhUcmFuc2Zvcm0oZWxlbSwgdHJhbnNsYXRlLCBzY2FsZSkge1xuICAgICAgICB2YXIgYW5pbWF0aW9uTWlsbGlzZWNvbmRzID0gNTAwMCxcbiAgICAgICAgICAgIHRpbWVvdXRNaWxsaXNlY29uZHMgPSA1MCxcbiAgICAgICAgICAgIHN0ZXBzID0gcGFyc2VJbnQoYW5pbWF0aW9uTWlsbGlzZWNvbmRzIC8gdGltZW91dE1pbGxpc2Vjb25kcyk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNtb290aFRyYW5zZm9ybVN0ZXAoZWxlbSwgdHJhbnNsYXRlLCBzY2FsZSwgdGltZW91dE1pbGxpc2Vjb25kcywgMSwgc3RlcHMpO1xuICAgICAgICB9LCB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzbW9vdGhUcmFuc2Zvcm1TdGVwKGVsZW0sIHRyYW5zbGF0ZSwgc2NhbGUsIHRpbWVvdXRNaWxsaXNlY29uZHMsIHN0ZXAsIHN0ZXBzKSB7XG4gICAgICAgIHZhciBwcm9ncmVzcyA9IHN0ZXAgLyBzdGVwcztcblxuICAgICAgICBlbGVtLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArICh0cmFuc2xhdGVbMF0gKiBwcm9ncmVzcykgKyAnLCAnICsgKHRyYW5zbGF0ZVsxXSAqIHByb2dyZXNzKSArICcpIHNjYWxlKCcgKyAoc2NhbGUgKiBwcm9ncmVzcykgKyAnKScpO1xuXG4gICAgICAgIGlmIChzdGVwIDwgc3RlcHMpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCBzdGVwICsgMSwgc3RlcHMpO1xuICAgICAgICAgICAgfSwgdGltZW91dE1pbGxpc2Vjb25kcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgKi9cbmZ1bmN0aW9uIHN0aWNrTm9kZShkKSB7XG4gIGQuZnggPSBkMy5ldmVudC54O1xuICBkLmZ5ID0gZDMuZXZlbnQueTtcbn1cblxuZnVuY3Rpb24gdGljaygpIHtcbiAgdGlja05vZGVzKCk7XG4gIHRpY2tSZWxhdGlvbnNoaXBzKCk7XG59XG5cbmZ1bmN0aW9uIHRpY2tOb2RlcygpIHtcbiAgaWYgKG5vZGUpIHtcbiAgICBub2RlLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBkLnggKyAnLCAnICsgZC55ICsgJyknO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzKCkge1xuICBpZiAocmVsYXRpb25zaGlwKSB7XG4gICAgcmVsYXRpb25zaGlwLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBhbmdsZSA9IHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCk7XG4gICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgZC5zb3VyY2UueCArICcsICcgKyBkLnNvdXJjZS55ICsgJykgcm90YXRlKCcgKyBhbmdsZSArICcpJztcbiAgICB9KTtcblxuICAgIHRpY2tSZWxhdGlvbnNoaXBzVGV4dHMoKTtcbiAgICB0aWNrUmVsYXRpb25zaGlwc091dGxpbmVzKCk7XG4gICAgdGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzT3V0bGluZXMoKSB7XG4gIHJlbGF0aW9uc2hpcC5lYWNoKGZ1bmN0aW9uKHJlbGF0aW9uc2hpcCkge1xuXG4gICAgdmFyIHJlbCA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICB2YXIgb3V0bGluZSA9IHJlbC5zZWxlY3QoJy5vdXRsaW5lJyk7XG4gICAgdmFyIHRleHQgPSByZWwuc2VsZWN0KCcudGV4dCcpO1xuICAgIHZhciBiYm94ID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpO1xuICAgIHZhciBwYWRkaW5nID0gMDtcblxuICAgIG91dGxpbmUuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgYW5nbGUgPSByb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgICB0ZXh0Qm91bmRpbmdCb3ggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCksXG4gICAgICAgIHRleHRQYWRkaW5nID0gMCxcbiAgICAgICAgdSA9IHVuaXRhcnlWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0KSxcbiAgICAgICAgdGV4dE1hcmdpbiA9IHsgeDogKGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKHRleHRCb3VuZGluZ0JveC53aWR0aCArIHRleHRQYWRkaW5nKSAqIHUueCkgKiAwLjUsIHk6IChkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtICh0ZXh0Qm91bmRpbmdCb3gud2lkdGggKyB0ZXh0UGFkZGluZykgKiB1LnkpICogMC41IH0sXG4gICAgICAgIG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG4gICAgICAgIHJvdGF0ZWRQb2ludEExID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgKyAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSBuLngsIHk6IDAgKyAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSBuLnkgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRCMSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiB0ZXh0TWFyZ2luLnggLSBuLngsIHk6IHRleHRNYXJnaW4ueSAtIG4ueSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEMxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IHRleHRNYXJnaW4ueCwgeTogdGV4dE1hcmdpbi55IH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50RDEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCwgeTogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEEyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gdGV4dE1hcmdpbi54IC0gbi54LCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIHRleHRNYXJnaW4ueSAtIG4ueSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEIyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54IC0gbi54IC0gdS54ICogb3B0aW9ucy5hcnJvd1NpemUsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IC0gbi55IC0gdS55ICogb3B0aW9ucy5hcnJvd1NpemUgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRDMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCArIChuLnggLSB1LngpICogb3B0aW9ucy5hcnJvd1NpemUsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IC0gbi55ICsgKG4ueSAtIHUueSkgKiBvcHRpb25zLmFycm93U2l6ZSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEQyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54LCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEUyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54ICsgKC0gbi54IC0gdS54KSAqIG9wdGlvbnMuYXJyb3dTaXplLCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSArICgtIG4ueSAtIHUueSkgKiBvcHRpb25zLmFycm93U2l6ZSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEYyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54IC0gdS54ICogb3B0aW9ucy5hcnJvd1NpemUsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IC0gdS55ICogb3B0aW9ucy5hcnJvd1NpemUgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnRHMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIHRleHRNYXJnaW4ueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSB0ZXh0TWFyZ2luLnkgfSwgYW5nbGUpO1xuXG4gICAgICByZXR1cm4gJ00gJyArIHJvdGF0ZWRQb2ludEExLnggKyAnICcgKyByb3RhdGVkUG9pbnRBMS55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRCMS54ICsgJyAnICsgcm90YXRlZFBvaW50QjEueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50QzEueCArICcgJyArIHJvdGF0ZWRQb2ludEMxLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEQxLnggKyAnICcgKyByb3RhdGVkUG9pbnREMS55ICtcbiAgICAgICAgJyBaIE0gJyArIHJvdGF0ZWRQb2ludEEyLnggKyAnICcgKyByb3RhdGVkUG9pbnRBMi55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRCMi54ICsgJyAnICsgcm90YXRlZFBvaW50QjIueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50QzIueCArICcgJyArIHJvdGF0ZWRQb2ludEMyLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEQyLnggKyAnICcgKyByb3RhdGVkUG9pbnREMi55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRFMi54ICsgJyAnICsgcm90YXRlZFBvaW50RTIueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RjIueCArICcgJyArIHJvdGF0ZWRQb2ludEYyLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEcyLnggKyAnICcgKyByb3RhdGVkUG9pbnRHMi55ICtcbiAgICAgICAgJyBaJztcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzT3ZlcmxheXMoKSB7XG4gIHJlbGF0aW9uc2hpcE92ZXJsYXkuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHtcbiAgICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXG4gICAgICBhbmdsZSA9IHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCksXG4gICAgICBuMSA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0KSxcbiAgICAgIG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCwgNTApLFxuICAgICAgcm90YXRlZFBvaW50QSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwIC0gbi54LCB5OiAwIC0gbi55IH0sIGFuZ2xlKSxcbiAgICAgIHJvdGF0ZWRQb2ludEIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSBuLngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gbi55IH0sIGFuZ2xlKSxcbiAgICAgIHJvdGF0ZWRQb2ludEMgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggKyBuLnggLSBuMS54LCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSArIG4ueSAtIG4xLnkgfSwgYW5nbGUpLFxuICAgICAgcm90YXRlZFBvaW50RCA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwICsgbi54IC0gbjEueCwgeTogMCArIG4ueSAtIG4xLnkgfSwgYW5nbGUpO1xuXG4gICAgcmV0dXJuICdNICcgKyByb3RhdGVkUG9pbnRBLnggKyAnICcgKyByb3RhdGVkUG9pbnRBLnkgK1xuICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRCLnggKyAnICcgKyByb3RhdGVkUG9pbnRCLnkgK1xuICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRDLnggKyAnICcgKyByb3RhdGVkUG9pbnRDLnkgK1xuICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRELnggKyAnICcgKyByb3RhdGVkUG9pbnRELnkgK1xuICAgICAgJyBaJztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzVGV4dHMoKSB7XG4gIHJlbGF0aW9uc2hpcFRleHQuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgIHZhciBhbmdsZSA9IChyb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpICsgMzYwKSAlIDM2MCxcbiAgICAgIG1pcnJvciA9IGFuZ2xlID4gOTAgJiYgYW5nbGUgPCAyNzAsXG4gICAgICBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcbiAgICAgIG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG4gICAgICBuV2VpZ2h0ID0gbWlycm9yID8gMiA6IC0zLFxuICAgICAgcG9pbnQgPSB7IHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCkgKiAwLjUgKyBuLnggKiBuV2VpZ2h0LCB5OiAoZC50YXJnZXQueSAtIGQuc291cmNlLnkpICogMC41ICsgbi55ICogbldlaWdodCB9LFxuICAgICAgcm90YXRlZFBvaW50ID0gcm90YXRlUG9pbnQoY2VudGVyLCBwb2ludCwgYW5nbGUpO1xuXG4gICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHJvdGF0ZWRQb2ludC54ICsgJywgJyArIHJvdGF0ZWRQb2ludC55ICsgJykgcm90YXRlKCcgKyAobWlycm9yID8gMTgwIDogMCkgKyAnKSc7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0b1N0cmluZyhkKSB7XG4gIHZhciBzID0gZC5sYWJlbHMgPyBkLmxhYmVsc1swXSA6IGQudHlwZTtcblxuICBzICs9ICcgKDxpZD46ICcgKyBkLmlkO1xuXG4gIE9iamVjdC5rZXlzKGQucHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgIHMgKz0gJywgJyArIHByb3BlcnR5ICsgJzogJyArIEpTT04uc3RyaW5naWZ5KGQucHJvcGVydGllc1twcm9wZXJ0eV0pO1xuICB9KTtcblxuICBzICs9ICcpJztcblxuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gdW5pdGFyeU5vcm1hbFZlY3Rvcihzb3VyY2UsIHRhcmdldCwgbmV3TGVuZ3RoKSB7XG4gIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcbiAgICB2ZWN0b3IgPSB1bml0YXJ5VmVjdG9yKHNvdXJjZSwgdGFyZ2V0LCBuZXdMZW5ndGgpO1xuXG4gIHJldHVybiByb3RhdGVQb2ludChjZW50ZXIsIHZlY3RvciwgOTApO1xufVxuXG5mdW5jdGlvbiB1bml0YXJ5VmVjdG9yKHNvdXJjZSwgdGFyZ2V0LCBuZXdMZW5ndGgpIHtcbiAgdmFyIGxlbmd0aCA9IE1hdGguc3FydChNYXRoLnBvdyh0YXJnZXQueCAtIHNvdXJjZS54LCAyKSArIE1hdGgucG93KHRhcmdldC55IC0gc291cmNlLnksIDIpKSAvIE1hdGguc3FydChuZXdMZW5ndGggfHwgMSk7XG5cbiAgcmV0dXJuIHtcbiAgICB4OiAodGFyZ2V0LnggLSBzb3VyY2UueCkgLyBsZW5ndGgsXG4gICAgeTogKHRhcmdldC55IC0gc291cmNlLnkpIC8gbGVuZ3RoLFxuICB9O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVXaXRoRDNEYXRhKGQzRGF0YSkge1xuICAvLyBtYXJrZXJcbiAgb3B0aW9ucy5nbG9iYWxEaWN0ID0gcnVsZVZpb2xhdGlvbkRpY3QoZDNEYXRhLnJlbGF0aW9uc2hpcHMpO1xuICB1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMoZDNEYXRhLm5vZGVzLCBkM0RhdGEucmVsYXRpb25zaGlwcyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVdpdGhOZW80akRhdGEobmVvNGpEYXRhKSB7XG4gIHZhciBkM0RhdGEgPSBuZW80akRhdGFUb0QzRGF0YShuZW80akRhdGEpO1xuICB1cGRhdGVXaXRoRDNEYXRhKGQzRGF0YSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUluZm8oZCkge1xuICBjbGVhckluZm8oKTtcblxuICBpZiAoZC5sYWJlbHMpIHtcbiAgICBhcHBlbmRJbmZvRWxlbWVudENsYXNzKCdjbGFzcycsIGQubGFiZWxzWzBdKTtcbiAgfSBlbHNlIHtcbiAgICBhcHBlbmRJbmZvRWxlbWVudFJlbGF0aW9uc2hpcCgnY2xhc3MnLCBkLnR5cGUpO1xuICB9XG5cbiAgYXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eSgncHJvcGVydHknLCAnJmx0O2lkJmd0OycsIGQuaWQpO1xuXG4gIE9iamVjdC5rZXlzKGQucHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgIGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoJ3Byb3BlcnR5JywgcHJvcGVydHksIEpTT04uc3RyaW5naWZ5KGQucHJvcGVydGllc1twcm9wZXJ0eV0pKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU5vZGVzKG4pIHtcbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkobm9kZXMsIG4pO1xuXG4gIG5vZGUgPSBzdmdOb2Rlcy5zZWxlY3RBbGwoJy5ub2RlJylcbiAgICAuZGF0YShub2RlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZDsgfSk7XG4gIHZhciBub2RlRW50ZXIgPSBhcHBlbmROb2RlVG9HcmFwaCgpO1xuICBub2RlID0gbm9kZUVudGVyLm1lcmdlKG5vZGUpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMobiwgcikge1xuICB1cGRhdGVSZWxhdGlvbnNoaXBzKHIpO1xuICB1cGRhdGVOb2RlcyhuKTtcblxuICBzaW11bGF0aW9uLm5vZGVzKG5vZGVzKTtcbiAgc2ltdWxhdGlvbi5mb3JjZSgnbGluaycpLmxpbmtzKHJlbGF0aW9uc2hpcHMpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSZWxhdGlvbnNoaXBzKHIpIHtcbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkocmVsYXRpb25zaGlwcywgcik7XG5cbiAgcmVsYXRpb25zaGlwID0gc3ZnUmVsYXRpb25zaGlwcy5zZWxlY3RBbGwoJy5yZWxhdGlvbnNoaXAnKVxuICAgIC5kYXRhKHJlbGF0aW9uc2hpcHMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQ7IH0pO1xuXG4gIHZhciBvdXRsaW5lU2NhbGUgPSBjcmVhdGVPdXRsaW5lU2NhbGUocmVsYXRpb25zaGlwcyk7XG4gIHZhciByZWxhdGlvbnNoaXBFbnRlciA9IGFwcGVuZFJlbGF0aW9uc2hpcFRvR3JhcGgob3V0bGluZVNjYWxlKTtcblxuICByZWxhdGlvbnNoaXAgPSByZWxhdGlvbnNoaXBFbnRlci5yZWxhdGlvbnNoaXAubWVyZ2UocmVsYXRpb25zaGlwKTtcbiAgcmVsYXRpb25zaGlwT3V0bGluZSA9IHN2Zy5zZWxlY3RBbGwoJy5yZWxhdGlvbnNoaXAgLm91dGxpbmUnKTtcbiAgcmVsYXRpb25zaGlwT3V0bGluZSA9IHJlbGF0aW9uc2hpcEVudGVyLm91dGxpbmUubWVyZ2UocmVsYXRpb25zaGlwT3V0bGluZSk7XG5cbiAgcmVsYXRpb25zaGlwT3ZlcmxheSA9IHN2Zy5zZWxlY3RBbGwoJy5yZWxhdGlvbnNoaXAgLm92ZXJsYXknKTtcbiAgcmVsYXRpb25zaGlwT3ZlcmxheSA9IHJlbGF0aW9uc2hpcEVudGVyLm92ZXJsYXkubWVyZ2UocmVsYXRpb25zaGlwT3ZlcmxheSk7XG5cbiAgcmVsYXRpb25zaGlwVGV4dCA9IHN2Zy5zZWxlY3RBbGwoJy5yZWxhdGlvbnNoaXAgLnRleHQnKTtcbiAgcmVsYXRpb25zaGlwVGV4dCA9IHJlbGF0aW9uc2hpcEVudGVyLnRleHQubWVyZ2UocmVsYXRpb25zaGlwVGV4dCk7XG59XG5cblxuZnVuY3Rpb24gdmVyc2lvbigpIHtcbiAgcmV0dXJuIFZFUlNJT047XG59XG5cbmZ1bmN0aW9uIHpvb21GaXQodHJhbnNpdGlvbkR1cmF0aW9uKSB7XG4gIHZhciBib3VuZHMgPSBzdmcubm9kZSgpLmdldEJCb3goKSxcbiAgICBwYXJlbnQgPSBzdmcubm9kZSgpLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCxcbiAgICBmdWxsV2lkdGggPSBwYXJlbnQuY2xpZW50V2lkdGgsXG4gICAgZnVsbEhlaWdodCA9IHBhcmVudC5jbGllbnRIZWlnaHQsXG4gICAgd2lkdGggPSBib3VuZHMud2lkdGgsXG4gICAgaGVpZ2h0ID0gYm91bmRzLmhlaWdodCxcbiAgICBtaWRYID0gYm91bmRzLnggKyB3aWR0aCAvIDIsXG4gICAgbWlkWSA9IGJvdW5kcy55ICsgaGVpZ2h0IC8gMjtcblxuICBpZiAod2lkdGggPT09IDAgfHwgaGVpZ2h0ID09PSAwKSB7XG4gICAgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGZpdFxuICB9XG5cbiAgc3ZnU2NhbGUgPSAwLjg1IC8gTWF0aC5tYXgod2lkdGggLyBmdWxsV2lkdGgsIGhlaWdodCAvIGZ1bGxIZWlnaHQpO1xuICBzdmdUcmFuc2xhdGUgPSBbZnVsbFdpZHRoIC8gMiAtIHN2Z1NjYWxlICogbWlkWCwgZnVsbEhlaWdodCAvIDIgLSBzdmdTY2FsZSAqIG1pZFldO1xuXG4gIHN2Zy5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBzdmdUcmFuc2xhdGVbMF0gKyAnLCAnICsgc3ZnVHJhbnNsYXRlWzFdICsgJykgc2NhbGUoJyArIHN2Z1NjYWxlICsgJyknKTtcbiAgLy8gICAgICAgIHNtb290aFRyYW5zZm9ybShzdmdUcmFuc2xhdGUsIHN2Z1NjYWxlKTtcbn1cblxuaW5pdChfc2VsZWN0b3IsIF9vcHRpb25zKTtcblxucmV0dXJuIHtcbiAgbmVvNGpEYXRhVG9EM0RhdGE6IG5lbzRqRGF0YVRvRDNEYXRhLFxuICBzaXplOiBzaXplLFxuICB1cGRhdGVXaXRoRDNEYXRhOiB1cGRhdGVXaXRoRDNEYXRhLFxuICB1cGRhdGVXaXRoTmVvNGpEYXRhOiB1cGRhdGVXaXRoTmVvNGpEYXRhLFxuICB2ZXJzaW9uOiB2ZXJzaW9uXG59O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5lbzRqRDM7XG4iXX0=
