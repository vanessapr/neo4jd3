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

    //appendRuleViolationToNode(n);

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

      if ('RuleViolated' in d.properties){
        var status = d.properties.RuleViolated.toLowerCase();

        if (status != 'no'){
          return true;
        }
      }
      return false
    })

    var foo = node.append('text')
      .attr('class', 'text icon')
      .attr('fill', '#ffa500')
      .attr('font-size', function(d) {
        return (.9 * options.nodeRadius) + 'px';})
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .html(function(d) {
        var _icon = options.iconMap['times'];
        return _icon ? '&#x' + _icon : d.id;
      })

    foo.transition()
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
    return foo;



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
          return '#a5abb6'
        });
  }

  function appendOverlayToRelationship(r) {
    return r.append('path')
      .attr('class', 'overlay');
  }

  function appendTextToRelationship(r) {
      var text = r.append('text')
      .attr('class', 'text icon')
      .attr('fill', '#ffa500')
      .attr('font-size', '15px')
      .attr('x', '-5px')
      .attr('y', '2px')
      .html(function(d) {

        if ('RuleViolated' in d.properties){
          var status = d.properties.RuleViolated.toLowerCase();

          if (status != 'no'){
            var _icon = options.iconMap['times'];
            return _icon ? '&#x' + _icon : d.id;
          }
        }
        return '';
      });

    var transitionDuration = 2000;
  var bar = text.transition()
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


    return text;
  }

  function appendRelationshipToGraph(outlineScale) {
    var relationship = appendRelationship();

    var text = appendTextToRelationship(relationship);
    appendRuleViolationToNode(relationship);

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


    var textBoundingBox = text.node().getBBox()

    if ('RuleViolated' in relationship.properties){
      var status = relationship.properties.RuleViolated.toLowerCase();

      if (status != 'no'){
        textBoundingBox = {x: 0, y: 0, width: 17, height: 0}
      }
    }


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi9pbmRleC5qcyIsInNyYy9tYWluL3NjcmlwdHMvbmVvNGpkMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBuZW80amQzID0gcmVxdWlyZSgnLi9zY3JpcHRzL25lbzRqZDMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZW80amQzO1xuIiwiLyogZ2xvYmFsIGQzLCBkb2N1bWVudCAqL1xuLyoganNoaW50IGxhdGVkZWY6bm9mdW5jICovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIE5lbzRqRDMoX3NlbGVjdG9yLCBfb3B0aW9ucykge1xuICB2YXIgY29udGFpbmVyLCBncmFwaCwgaW5mbywgbm9kZSwgbm9kZXMsIHJlbGF0aW9uc2hpcCwgcmVsYXRpb25zaGlwT3V0bGluZSwgcmVsYXRpb25zaGlwT3ZlcmxheSwgcmVsYXRpb25zaGlwVGV4dCwgcmVsYXRpb25zaGlwcywgc2VsZWN0b3IsIHNpbXVsYXRpb24sIHN2Zywgc3ZnTm9kZXMsIHN2Z1JlbGF0aW9uc2hpcHMsIHN2Z1NjYWxlLCBzdmdUcmFuc2xhdGUsXG4gICAgY2xhc3NlczJjb2xvcnMgPSB7fSxcbiAgICBqdXN0TG9hZGVkID0gZmFsc2UsXG4gICAgbnVtQ2xhc3NlcyA9IDAsXG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIGFycm93U2l6ZTogMixcbiAgICAgIGNvbG9yczogY29sb3JzKCksXG4gICAgICBoaWdobGlnaHQ6IHVuZGVmaW5lZCxcbiAgICAgIGljb25NYXA6IGZvbnRBd2Vzb21lSWNvbnMoKSxcbiAgICAgIGljb25zOiB1bmRlZmluZWQsXG4gICAgICBpbWFnZU1hcDoge30sXG4gICAgICBpbWFnZXM6IHVuZGVmaW5lZCxcbiAgICAgIGluZm9QYW5lbDogdHJ1ZSxcbiAgICAgIG1pbkNvbGxpc2lvbjogdW5kZWZpbmVkLFxuICAgICAgbmVvNGpEYXRhOiB1bmRlZmluZWQsXG4gICAgICBuZW80akRhdGFVcmw6IHVuZGVmaW5lZCxcbiAgICAgIG5vZGVPdXRsaW5lRmlsbENvbG9yOiB1bmRlZmluZWQsXG4gICAgICBub2RlUmFkaXVzOiA3NSxcbiAgICAgIHJlbGF0aW9uc2hpcENvbG9yOiAnI2E1YWJiNicsXG4gICAgICB6b29tRml0OiBmYWxzZVxuICAgIH0sXG4gICAgVkVSU0lPTiA9ICcwLjAuMSc7XG5cbiAgZnVuY3Rpb24gcnVsZVZpb2xhdGlvbkRpY3QoZWRnZXMpe1xuICAgIHZhciBkID0ge31cbiAgICBmb3IodmFyIGkgPSAwOyBpPCBlZGdlcy5sZW5ndGg7IGkrKyl7XG5cbiAgICAgIHZhciBlZGdlID0gZWRnZXNbaV07XG4gICAgICB2YXIgaWQgPSBlZGdlLnN0YXJ0Tm9kZTtcblxuICAgICAgaWYgKCEoaWQgaW4gZCkpe1xuICAgICAgICBkW2lkXSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoJ3Byb3BlcnRpZXMnIGluIGVkZ2Upe1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IGVkZ2UucHJvcGVydGllcztcbiAgICAgICAgaWYgKCdSdWxlVmlvbGF0ZWQnIGluIHByb3BlcnRpZXMpe1xuXG4gICAgICAgICAgaWYgKHByb3BlcnRpZXMuUnVsZVZpb2xhdGVkICE9ICdObycpe1xuICAgICAgICAgICAgZFtpZF0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEdyYXBoKGNvbnRhaW5lcikge1xuICAgIHN2ZyA9IGNvbnRhaW5lci5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCAnMTAwJScpXG4gICAgICAuYXR0cignaGVpZ2h0JywgJzEwMCUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ25lbzRqZDMtZ3JhcGgnKVxuICAgICAgLmNhbGwoZDMuem9vbSgpLm9uKCd6b29tJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnRyYW5zZm9ybS5rLFxuICAgICAgICAgIHRyYW5zbGF0ZSA9IFtkMy5ldmVudC50cmFuc2Zvcm0ueCwgZDMuZXZlbnQudHJhbnNmb3JtLnldO1xuXG4gICAgICAgIGlmIChzdmdUcmFuc2xhdGUpIHtcbiAgICAgICAgICB0cmFuc2xhdGVbMF0gKz0gc3ZnVHJhbnNsYXRlWzBdO1xuICAgICAgICAgIHRyYW5zbGF0ZVsxXSArPSBzdmdUcmFuc2xhdGVbMV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3ZnU2NhbGUpIHtcbiAgICAgICAgICBzY2FsZSAqPSBzdmdTY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN2Zy5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB0cmFuc2xhdGVbMF0gKyAnLCAnICsgdHJhbnNsYXRlWzFdICsgJykgc2NhbGUoJyArIHNjYWxlICsgJyknKTtcbiAgICAgIH0pKVxuICAgICAgLm9uKCdkYmxjbGljay56b29tJywgbnVsbClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgJzEwMCUnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsICcxMDAlJyk7XG5cbiAgICBzdmdSZWxhdGlvbnNoaXBzID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmVsYXRpb25zaGlwcycpO1xuXG4gICAgc3ZnTm9kZXMgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdub2RlcycpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW1hZ2VUb05vZGUobm9kZSkge1xuXG4gICAgcmV0dXJuIG5vZGUuYXBwZW5kKCdpbWFnZScpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICcyNHB4JzogJzMwcHgnO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd4JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICc1cHgnOiAnLTE1cHgnO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd4bGluazpocmVmJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaW1hZ2UoZCk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBpY29uKGQpID8gJzVweCc6ICctMTZweCc7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gaWNvbihkKSA/ICcyNHB4JzogJzMwcHgnO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvUGFuZWwoY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lci5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbmVvNGpkMy1pbmZvJyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGlzTm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgdmFyIGVsZW0gPSBpbmZvLmFwcGVuZCgnYScpO1xuICAgIHZhciBsYWJlbENvbG9yTWFwcGluZyA9IHtcbiAgICAgIFwiY3VzdG9tZXJcIjogXCIjNjhiZGY2XCIsXG4gICAgICBcImFjY291bnRcIjogXCIjZmZkODZlXCIsXG4gICAgICBcIm93bmJhbmthY2NvdW50XCI6IFwiIzZkY2U5ZVwiLFxuICAgICAgXCJvdGhlcmJhbmthY2NvdW50XCI6IFwiI2ZmODY3ZlwiLFxuICAgICAgXCJydWxldmlvbGF0aW9uXCI6IFwiI2ZmYTgyZFwiXG4gICAgfVxuXG4gICAgZWxlbS5hdHRyKCdocmVmJywgJyMnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgY2xzKVxuICAgICAgLmh0bWwoJzxzdHJvbmc+JyArIHByb3BlcnR5ICsgJzwvc3Ryb25nPicgKyAodmFsdWUgPyAoJzogJyArIHZhbHVlKSA6ICcnKSk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgZWxlbS5zdHlsZSgnYmFja2dyb3VuZC1jb2xvcicsIGZ1bmN0aW9uKGQpIHtcblxuICAgICAgICAgIHZhciB0aGVfcHJvcGVydHkgPSBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHRoZV9wcm9wZXJ0eSBpbiBsYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxDb2xvck1hcHBpbmdbdGhlX3Byb3BlcnR5XTtcbiAgICAgICAgICB9XG5cblxuICAgICAgICByZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/IG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgOiAoaXNOb2RlID8gY2xhc3MyY29sb3IocHJvcGVydHkpIDogZGVmYXVsdENvbG9yKCkpO1xuXG5cbiAgICAgIH0pXG4gICAgICAgIC5zdHlsZSgnYm9yZGVyLWNvbG9yJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHZhciB0aGVfcHJvcGVydHkgPSBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHRoZV9wcm9wZXJ0eSBpbiBsYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxDb2xvck1hcHBpbmdbdGhlX3Byb3BlcnR5XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKSA6IChpc05vZGUgPyBjbGFzczJkYXJrZW5Db2xvcihwcm9wZXJ0eSkgOiBkZWZhdWx0RGFya2VuQ29sb3IoKSk7XG5cblxuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoJ2NvbG9yJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gY2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcikgOiAnI2ZmZic7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRDbGFzcyhjbHMsIG5vZGUpIHtcbiAgICBhcHBlbmRJbmZvRWxlbWVudChjbHMsIHRydWUsIG5vZGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eShjbHMsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGFwcGVuZEluZm9FbGVtZW50KGNscywgZmFsc2UsIHByb3BlcnR5LCB2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudFJlbGF0aW9uc2hpcChjbHMsIHJlbGF0aW9uc2hpcCkge1xuICAgIGFwcGVuZEluZm9FbGVtZW50KGNscywgZmFsc2UsIHJlbGF0aW9uc2hpcCk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmROb2RlKCkge1xuICAgIHJldHVybiBub2RlLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgaGlnaGxpZ2h0LCBpLFxuICAgICAgICAgIGNsYXNzZXMgPSAnbm9kZScsXG4gICAgICAgICAgbGFiZWwgPSBkLmxhYmVsc1swXTtcblxuICAgICAgICBpZiAoaWNvbihkKSkge1xuICAgICAgICAgIGNsYXNzZXMgKz0gJyBub2RlLWljb24nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGltYWdlKGQpKSB7XG4gICAgICAgICAgY2xhc3NlcyArPSAnIG5vZGUtaW1hZ2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGlnaGxpZ2h0KSB7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBoaWdobGlnaHQgPSBvcHRpb25zLmhpZ2hsaWdodFtpXTtcblxuICAgICAgICAgICAgaWYgKGQubGFiZWxzWzBdID09PSBoaWdobGlnaHQuY2xhc3MgJiYgZC5wcm9wZXJ0aWVzW2hpZ2hsaWdodC5wcm9wZXJ0eV0gPT09IGhpZ2hsaWdodC52YWx1ZSkge1xuICAgICAgICAgICAgICBjbGFzc2VzICs9ICcgbm9kZS1oaWdobGlnaHRlZCc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjbGFzc2VzO1xuICAgICAgfSlcbiAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGQuZnggPSBkLmZ5ID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvcHRpb25zLm9uTm9kZUNsaWNrKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdkYmxjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgc3RpY2tOb2RlKGQpO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEb3VibGVDbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIG9wdGlvbnMub25Ob2RlRG91YmxlQ2xpY2soZCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgdXBkYXRlSW5mbyhkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVNb3VzZUVudGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbk5vZGVNb3VzZUVudGVyKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgIGNsZWFySW5mbyhkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVNb3VzZUxlYXZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbk5vZGVNb3VzZUxlYXZlKGQpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgLmNhbGwoZDMuZHJhZygpXG4gICAgLm9uKCdzdGFydCcsIGRyYWdTdGFydGVkKVxuICAgIC5vbignZHJhZycsIGRyYWdnZWQpXG4gICAgLm9uKCdlbmQnLCBkcmFnRW5kZWQpKTtcbiAgfVxuICBmdW5jdGlvbiB0cnVuY2F0ZVRleHQoc3RyLCBsZW5ndGgpIHtcblxuICAgIHZhciBlbmRpbmcgPSAnLi4uJztcblxuICAgIGlmIChsZW5ndGggPT0gbnVsbCkge1xuICAgICAgbGVuZ3RoID0gMTAwO1xuICAgIH1cblxuICAgIGlmIChzdHIubGVuZ3RoID4gbGVuZ3RoKSB7XG4gICAgICByZXR1cm4gc3RyLnN1YnN0cmluZygwLCBsZW5ndGggLSBlbmRpbmcubGVuZ3RoKSArIGVuZGluZztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gY2FsY3VsYXRlWExvY2F0aW9uKG5hbWUpe1xuICAgIHJldHVybiBuYW1lLmxlbmd0aDtcblxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kTm9kZU5hbWVUZXh0KG5vZGUpe1xuICAgIC8vIGdvaW5nIHRvIG5lZWQgdG8gbGluayB0aGlzIHRvIG5vZGUgd2lkdGgvIGhpZWdodCBhdCBzb21lIHBvaW50XG4gICAgdmFyIGcgPSBub2RlLmFwcGVuZCgnZycpXG5cbiAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgJzgwcHgnKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgJzIwcHgnKVxuICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKXtcblxuICAgICAgICByZXR1cm4gXCIjYmRjM2M3XCI7XG5cbiAgICAgIH0pXG4gICAgICAuYXR0cigneScsIDI0KVxuICAgICAgLmF0dHIoJ3gnLCAtNDApXG4gICAgICAuYXR0cigncngnLCAxMClcbiAgICAgIC5hdHRyKCdyeScsIDEwKVxuXG4gICAgZy5hcHBlbmQoJ3RleHQnKVxuICAgICAgLnRleHQoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgeCA9IG5vZGUubGFiZWxzO1xuICAgICAgICByZXR1cm4gdHJ1bmNhdGVUZXh0KG5vZGUucHJvcGVydGllcy5uYW1lLCAxMyk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2ZvbnQtc2l6ZScsIDEwKVxuICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihub2RlKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiBjYWxjdWxhdGVYTG9jYXRpb24obm9kZS5wcm9wZXJ0aWVzLm5hbWUpO1xuXG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3knLCAzMylcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgLmF0dHIoJ2FsaWdubWVudC1iYXNlbGluZScsICdjZW50cmFsJyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGFwcGVuZE5vZGVUb0dyYXBoKCkge1xuICAgIHZhciBuID0gYXBwZW5kTm9kZSgpO1xuXG4gICAgYXBwZW5kUmluZ1RvTm9kZShuKTtcbiAgICBhcHBlbmRPdXRsaW5lVG9Ob2RlKG4pO1xuXG4gICAgaWYgKG9wdGlvbnMuaWNvbnMpIHtcbiAgICAgIGFwcGVuZFRleHRUb05vZGUobik7XG4gICAgfVxuXG4gICAgLy9hcHBlbmRSdWxlVmlvbGF0aW9uVG9Ob2RlKG4pO1xuXG4gICAgaWYgKG9wdGlvbnMuaW1hZ2VzKSB7XG5cbiAgICAgIGFwcGVuZEltYWdlVG9Ob2RlKG4pO1xuICAgIH1cblxuICAgIHZhciB0ZXh0ID0gYXBwZW5kTm9kZU5hbWVUZXh0KG4pO1xuXG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRPdXRsaW5lVG9Ob2RlKG5vZGUpIHtcblxuICAgIHZhciBsYWJlbENvbG9yTWFwcGluZyA9IHtcbiAgICAgIFwiY3VzdG9tZXJcIjogXCIjNjhiZGY2XCIsXG4gICAgICBcImFjY291bnRcIjogXCIjZmZkODZlXCIsXG4gICAgICBcIm93bmJhbmthY2NvdW50XCI6IFwiIzZkY2U5ZVwiLFxuICAgICAgXCJvdGhlcmJhbmthY2NvdW50XCI6IFwiI2ZmODY3ZlwiLFxuICAgICAgXCJydWxldmlvbGF0aW9uXCI6IFwiI2ZmYTgyZFwiXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGUuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ291dGxpbmUnKVxuICAgICAgLmF0dHIoJ3InLCBvcHRpb25zLm5vZGVSYWRpdXMpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBsYWJlbCA9IGQubGFiZWxzO1xuXG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggPT09IDApe1xuICAgICAgICAgIHJldHVybiAnZ3JheSc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGhlX2xhYmVsID0gbGFiZWxbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHRoZV9sYWJlbCBpbiBsYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgcmV0dXJuIGxhYmVsQ29sb3JNYXBwaW5nW3RoZV9sYWJlbF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/IG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgOiBjbGFzczJjb2xvcihkLmxhYmVsc1swXSk7XG4gICAgICB9KVxuICAgICAgLnN0eWxlKCdzdHJva2UnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBsYWJlbCA9IGQubGFiZWxzO1xuXG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggPT09IDApe1xuICAgICAgICAgIHJldHVybiAnZ3JheSc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGhlX2xhYmVsID0gbGFiZWxbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHRoZV9sYWJlbCBpbiBsYWJlbENvbG9yTWFwcGluZyl7XG4gICAgICAgICAgcmV0dXJuIGxhYmVsQ29sb3JNYXBwaW5nW3RoZV9sYWJlbF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKSA6IGNsYXNzMmRhcmtlbkNvbG9yKGQubGFiZWxzWzBdKTtcbiAgICAgIH0pXG4gICAgICAuYXBwZW5kKCd0aXRsZScpLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gdG9TdHJpbmcoZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZFJpbmdUb05vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdyaW5nJylcbiAgICAgIC5hdHRyKCdyJywgb3B0aW9ucy5ub2RlUmFkaXVzICogMS4xNilcbiAgICAgIC5hcHBlbmQoJ3RpdGxlJykudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiB0b1N0cmluZyhkKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kVGV4dFRvTm9kZShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICd0ZXh0JyArIChpY29uKGQpID8gJyBpY29uJyA6ICcnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignZmlsbCcsICcjZmZmZmZmJylcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBpY29uKGQpID8gKG9wdGlvbnMubm9kZVJhZGl1cyArICdweCcpIDogJzEwcHgnO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdub25lJylcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBpY29uKGQpID8gKHBhcnNlSW50KE1hdGgucm91bmQob3B0aW9ucy5ub2RlUmFkaXVzICogMC4zMikpICsgJ3B4JykgOiAnNHB4JztcbiAgICAgIH0pXG4gICAgICAuaHRtbChmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBfaWNvbiA9IGljb24oZCk7XG4gICAgICAgIHJldHVybiBfaWNvbiA/ICcmI3gnICsgX2ljb24gOiBkLmlkO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRSdWxlVmlvbGF0aW9uVG9Ob2RlKG5vZGUpIHtcblxuICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSAzMDAwO1xuXG4gICAgdmFyIG5vZGUgPSBub2RlLmZpbHRlcihmdW5jdGlvbihkKXtcblxuICAgICAgaWYgKCdSdWxlVmlvbGF0ZWQnIGluIGQucHJvcGVydGllcyl7XG4gICAgICAgIHZhciBzdGF0dXMgPSBkLnByb3BlcnRpZXMuUnVsZVZpb2xhdGVkLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgaWYgKHN0YXR1cyAhPSAnbm8nKXtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSlcblxuICAgIHZhciBmb28gPSBub2RlLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGV4dCBpY29uJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNmZmE1MDAnKVxuICAgICAgLmF0dHIoJ2ZvbnQtc2l6ZScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICguOSAqIG9wdGlvbnMubm9kZVJhZGl1cykgKyAncHgnO30pXG4gICAgICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnbm9uZScpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgIC5odG1sKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIF9pY29uID0gb3B0aW9ucy5pY29uTWFwWyd0aW1lcyddO1xuICAgICAgICByZXR1cm4gX2ljb24gPyAnJiN4JyArIF9pY29uIDogZC5pZDtcbiAgICAgIH0pXG5cbiAgICBmb28udHJhbnNpdGlvbigpXG4gICAgICAuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxuICAgICAgLm9uKFwic3RhcnRcIiwgZnVuY3Rpb24gcmVwZWF0KCkge1xuICAgICAgICBkMy5hY3RpdmUodGhpcylcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAuNSlcbiAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAxKVxuICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAub24oXCJzdGFydFwiLCByZXBlYXQpO1xuICAgICAgfSlcbiAgICByZXR1cm4gZm9vO1xuXG5cblxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kUmVsYXRpb25zaGlwKCkge1xuICAgIHJldHVybiByZWxhdGlvbnNoaXAuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCdyZWxhdGlvbnNoaXAnKVxuICAgICAgLm9uKCdkYmxjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2soZCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgdXBkYXRlSW5mbyhkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbW91bnRzIChyZWxhdGlvbnNoaXBzKXtcbiAgICB2YXIgYW1vdW50cyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGlvbnNoaXBzLmxlbmd0aDsgaSsrKXtcbiAgICAgIHZhciBvYmplY3RQcm9wZXJ0aWVzID0gcmVsYXRpb25zaGlwc1tpXS5wcm9wZXJ0aWVzO1xuICAgICAgaWYgKG9iamVjdFByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoJ0Ftb3VudCcpKXtcbiAgICAgICAgdmFyIGFtb3VudCA9IG9iamVjdFByb3BlcnRpZXMuQW1vdW50O1xuICAgICAgICBhbW91bnRzLnB1c2goK2Ftb3VudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFtb3VudHM7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVPdXRsaW5lU2NhbGUocmVsYXRpb25zaGlwcyl7XG4gICAgdmFyIGFtb3VudHMgPSBnZXRBbW91bnRzKHJlbGF0aW9uc2hpcHMpO1xuICAgIHZhciBleHRlbnRzID0gZDMuZXh0ZW50KGFtb3VudHMpO1xuXG4gICAgdmFyIG1pbiA9IGV4dGVudHNbMF07XG4gICAgdmFyIG1heCA9IGV4dGVudHNbMV07XG5cbiAgICB2YXIgbmV3U2NhbGUgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgICAuZG9tYWluKFttaW4sbWF4XSlcbiAgICAgIC5yYW5nZShbLjEsIDNdKTtcbiAgICByZXR1cm4gbmV3U2NhbGU7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRPdXRsaW5lVG9SZWxhdGlvbnNoaXAociwgb3V0bGluZVNjYWxlKSB7XG4gICAgcmV0dXJuIHIuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdvdXRsaW5lJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNhNWFiYjYnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIGZ1bmN0aW9uKGQsaSl7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgICAvL3JldHVybiBvdXRsaW5lU2NhbGUoK2QucHJvcGVydGllcy5BbW91bnQpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBmdW5jdGlvbihkKVxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuICcjYTVhYmI2J1xuICAgICAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZE92ZXJsYXlUb1JlbGF0aW9uc2hpcChyKSB7XG4gICAgcmV0dXJuIHIuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdvdmVybGF5Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRUZXh0VG9SZWxhdGlvbnNoaXAocikge1xuICAgICAgdmFyIHRleHQgPSByLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGV4dCBpY29uJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNmZmE1MDAnKVxuICAgICAgLmF0dHIoJ2ZvbnQtc2l6ZScsICcxNXB4JylcbiAgICAgIC5hdHRyKCd4JywgJy01cHgnKVxuICAgICAgLmF0dHIoJ3knLCAnMnB4JylcbiAgICAgIC5odG1sKGZ1bmN0aW9uKGQpIHtcblxuICAgICAgICBpZiAoJ1J1bGVWaW9sYXRlZCcgaW4gZC5wcm9wZXJ0aWVzKXtcbiAgICAgICAgICB2YXIgc3RhdHVzID0gZC5wcm9wZXJ0aWVzLlJ1bGVWaW9sYXRlZC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHN0YXR1cyAhPSAnbm8nKXtcbiAgICAgICAgICAgIHZhciBfaWNvbiA9IG9wdGlvbnMuaWNvbk1hcFsndGltZXMnXTtcbiAgICAgICAgICAgIHJldHVybiBfaWNvbiA/ICcmI3gnICsgX2ljb24gOiBkLmlkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9KTtcblxuICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSAyMDAwO1xuICB2YXIgYmFyID0gdGV4dC50cmFuc2l0aW9uKClcbiAgICAgIC5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXG4gICAgICAub24oXCJzdGFydFwiLCBmdW5jdGlvbiByZXBlYXQoKSB7XG4gICAgICAgIGQzLmFjdGl2ZSh0aGlzKVxuICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIC41KVxuICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxuICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDEpXG4gICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgIC5vbihcInN0YXJ0XCIsIHJlcGVhdCk7XG4gICAgICB9KVxuXG5cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZFJlbGF0aW9uc2hpcFRvR3JhcGgob3V0bGluZVNjYWxlKSB7XG4gICAgdmFyIHJlbGF0aW9uc2hpcCA9IGFwcGVuZFJlbGF0aW9uc2hpcCgpO1xuXG4gICAgdmFyIHRleHQgPSBhcHBlbmRUZXh0VG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKTtcbiAgICBhcHBlbmRSdWxlVmlvbGF0aW9uVG9Ob2RlKHJlbGF0aW9uc2hpcCk7XG5cbiAgICB2YXIgb3V0bGluZSA9IGFwcGVuZE91dGxpbmVUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXAsIG91dGxpbmVTY2FsZSk7XG4gICAgdmFyIG92ZXJsYXkgPSBhcHBlbmRPdmVybGF5VG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKTtcblxuICAgIHJldHVybiB7XG4gICAgICBvdXRsaW5lOiBvdXRsaW5lLFxuICAgICAgb3ZlcmxheTogb3ZlcmxheSxcbiAgICAgIHJlbGF0aW9uc2hpcDogcmVsYXRpb25zaGlwLFxuICAgICAgdGV4dDogdGV4dFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjbGFzczJjb2xvcihjbHMpIHtcbiAgICB2YXIgY29sb3IgPSBjbGFzc2VzMmNvbG9yc1tjbHNdO1xuXG4gICAgaWYgKCFjb2xvcikge1xuICAgICAgLy8gICAgICAgICAgICBjb2xvciA9IG9wdGlvbnMuY29sb3JzW01hdGgubWluKG51bUNsYXNzZXMsIG9wdGlvbnMuY29sb3JzLmxlbmd0aCAtIDEpXTtcbiAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvcnNbbnVtQ2xhc3NlcyAlIG9wdGlvbnMuY29sb3JzLmxlbmd0aF07XG4gICAgICBjbGFzc2VzMmNvbG9yc1tjbHNdID0gY29sb3I7XG4gICAgICBudW1DbGFzc2VzKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbG9yO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xhc3MyZGFya2VuQ29sb3IoY2xzKSB7XG4gICAgcmV0dXJuIGQzLnJnYihjbGFzczJjb2xvcihjbHMpKS5kYXJrZXIoMSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckluZm8oKSB7XG4gICAgaW5mby5odG1sKCcnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbG9yKCkge1xuICAgIHJldHVybiBvcHRpb25zLmNvbG9yc1tvcHRpb25zLmNvbG9ycy5sZW5ndGggKiBNYXRoLnJhbmRvbSgpIDw8IDBdO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sb3JzKCkge1xuICAgIC8vIGQzLnNjaGVtZUNhdGVnb3J5MTAsXG4gICAgLy8gZDMuc2NoZW1lQ2F0ZWdvcnkyMCxcbiAgICByZXR1cm4gW1xuICAgICAgJyM2OGJkZjYnLCAvLyBsaWdodCBibHVlXG4gICAgICAnIzZkY2U5ZScsIC8vIGdyZWVuICMxXG4gICAgICAnI2ZhYWZjMicsIC8vIGxpZ2h0IHBpbmtcbiAgICAgICcjZjJiYWY2JywgLy8gcHVycGxlXG4gICAgICAnI2ZmOTI4YycsIC8vIGxpZ2h0IHJlZFxuICAgICAgJyNmY2VhN2UnLCAvLyBsaWdodCB5ZWxsb3dcbiAgICAgICcjZmZjNzY2JywgLy8gbGlnaHQgb3JhbmdlXG4gICAgICAnIzQwNWY5ZScsIC8vIG5hdnkgYmx1ZVxuICAgICAgJyNhNWFiYjYnLCAvLyBkYXJrIGdyYXlcbiAgICAgICcjNzhjZWNiJywgLy8gZ3JlZW4gIzIsXG4gICAgICAnI2I4OGNiYicsIC8vIGRhcmsgcHVycGxlXG4gICAgICAnI2NlZDJkOScsIC8vIGxpZ2h0IGdyYXlcbiAgICAgICcjZTg0NjQ2JywgLy8gZGFyayByZWRcbiAgICAgICcjZmE1Zjg2JywgLy8gZGFyayBwaW5rXG4gICAgICAnI2ZmYWIxYScsIC8vIGRhcmsgb3JhbmdlXG4gICAgICAnI2ZjZGExOScsIC8vIGRhcmsgeWVsbG93XG4gICAgICAnIzc5N2I4MCcsIC8vIGJsYWNrXG4gICAgICAnI2M5ZDk2ZicsIC8vIHBpc3RhY2NoaW9cbiAgICAgICcjNDc5OTFmJywgLy8gZ3JlZW4gIzNcbiAgICAgICcjNzBlZGVlJywgLy8gdHVycXVvaXNlXG4gICAgICAnI2ZmNzVlYScgIC8vIHBpbmtcbiAgICBdO1xuICB9XG5cbiAgZnVuY3Rpb24gY29udGFpbnMoYXJyYXksIGlkKSB7XG4gICAgdmFyIGZpbHRlciA9IGFycmF5LmZpbHRlcihmdW5jdGlvbihlbGVtKSB7XG4gICAgICByZXR1cm4gZWxlbS5pZCA9PT0gaWQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmlsdGVyLmxlbmd0aCA+IDA7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0Q29sb3IoKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMucmVsYXRpb25zaGlwQ29sb3I7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0RGFya2VuQ29sb3IoKSB7XG4gICAgcmV0dXJuIGQzLnJnYihvcHRpb25zLmNvbG9yc1tvcHRpb25zLmNvbG9ycy5sZW5ndGggLSAxXSkuZGFya2VyKDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZHJhZ0VuZGVkKGQpIHtcbiAgICBpZiAoIWQzLmV2ZW50LmFjdGl2ZSkge1xuICAgICAgc2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRHJhZ0VuZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3B0aW9ucy5vbk5vZGVEcmFnRW5kKGQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYWdnZWQoZCkge1xuICAgIHN0aWNrTm9kZShkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYWdTdGFydGVkKGQpIHtcbiAgICBpZiAoIWQzLmV2ZW50LmFjdGl2ZSkge1xuICAgICAgc2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwLjMpLnJlc3RhcnQoKTtcbiAgICB9XG5cbiAgICBkLmZ4ID0gZC54O1xuICAgIGQuZnkgPSBkLnk7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRHJhZ1N0YXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLm9uTm9kZURyYWdTdGFydChkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBleHRlbmQob2JqMSwgb2JqMikge1xuICAgIHZhciBvYmogPSB7fTtcblxuICAgIG1lcmdlKG9iaiwgb2JqMSk7XG4gICAgbWVyZ2Uob2JqLCBvYmoyKTtcblxuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBmdW5jdGlvbiBmb250QXdlc29tZUljb25zKCkge1xuICAgIHJldHVybiB7J2dsYXNzJzonZjAwMCcsJ211c2ljJzonZjAwMScsJ3NlYXJjaCc6J2YwMDInLCdlbnZlbG9wZS1vJzonZjAwMycsJ2hlYXJ0JzonZjAwNCcsJ3N0YXInOidmMDA1Jywnc3Rhci1vJzonZjAwNicsJ3VzZXInOidmMDA3JywnZmlsbSc6J2YwMDgnLCd0aC1sYXJnZSc6J2YwMDknLCd0aCc6J2YwMGEnLCd0aC1saXN0JzonZjAwYicsJ2NoZWNrJzonZjAwYycsJ3JlbW92ZSxjbG9zZSx0aW1lcyc6J2YwMGQnLCdzZWFyY2gtcGx1cyc6J2YwMGUnLCdzZWFyY2gtbWludXMnOidmMDEwJywncG93ZXItb2ZmJzonZjAxMScsJ3NpZ25hbCc6J2YwMTInLCdnZWFyLGNvZyc6J2YwMTMnLCd0cmFzaC1vJzonZjAxNCcsJ2hvbWUnOidmMDE1JywnZmlsZS1vJzonZjAxNicsJ2Nsb2NrLW8nOidmMDE3Jywncm9hZCc6J2YwMTgnLCdkb3dubG9hZCc6J2YwMTknLCdhcnJvdy1jaXJjbGUtby1kb3duJzonZjAxYScsJ2Fycm93LWNpcmNsZS1vLXVwJzonZjAxYicsJ2luYm94JzonZjAxYycsJ3BsYXktY2lyY2xlLW8nOidmMDFkJywncm90YXRlLXJpZ2h0LHJlcGVhdCc6J2YwMWUnLCdyZWZyZXNoJzonZjAyMScsJ2xpc3QtYWx0JzonZjAyMicsJ2xvY2snOidmMDIzJywnZmxhZyc6J2YwMjQnLCdoZWFkcGhvbmVzJzonZjAyNScsJ3ZvbHVtZS1vZmYnOidmMDI2Jywndm9sdW1lLWRvd24nOidmMDI3Jywndm9sdW1lLXVwJzonZjAyOCcsJ3FyY29kZSc6J2YwMjknLCdiYXJjb2RlJzonZjAyYScsJ3RhZyc6J2YwMmInLCd0YWdzJzonZjAyYycsJ2Jvb2snOidmMDJkJywnYm9va21hcmsnOidmMDJlJywncHJpbnQnOidmMDJmJywnY2FtZXJhJzonZjAzMCcsJ2ZvbnQnOidmMDMxJywnYm9sZCc6J2YwMzInLCdpdGFsaWMnOidmMDMzJywndGV4dC1oZWlnaHQnOidmMDM0JywndGV4dC13aWR0aCc6J2YwMzUnLCdhbGlnbi1sZWZ0JzonZjAzNicsJ2FsaWduLWNlbnRlcic6J2YwMzcnLCdhbGlnbi1yaWdodCc6J2YwMzgnLCdhbGlnbi1qdXN0aWZ5JzonZjAzOScsJ2xpc3QnOidmMDNhJywnZGVkZW50LG91dGRlbnQnOidmMDNiJywnaW5kZW50JzonZjAzYycsJ3ZpZGVvLWNhbWVyYSc6J2YwM2QnLCdwaG90byxpbWFnZSxwaWN0dXJlLW8nOidmMDNlJywncGVuY2lsJzonZjA0MCcsJ21hcC1tYXJrZXInOidmMDQxJywnYWRqdXN0JzonZjA0MicsJ3RpbnQnOidmMDQzJywnZWRpdCxwZW5jaWwtc3F1YXJlLW8nOidmMDQ0Jywnc2hhcmUtc3F1YXJlLW8nOidmMDQ1JywnY2hlY2stc3F1YXJlLW8nOidmMDQ2JywnYXJyb3dzJzonZjA0NycsJ3N0ZXAtYmFja3dhcmQnOidmMDQ4JywnZmFzdC1iYWNrd2FyZCc6J2YwNDknLCdiYWNrd2FyZCc6J2YwNGEnLCdwbGF5JzonZjA0YicsJ3BhdXNlJzonZjA0YycsJ3N0b3AnOidmMDRkJywnZm9yd2FyZCc6J2YwNGUnLCdmYXN0LWZvcndhcmQnOidmMDUwJywnc3RlcC1mb3J3YXJkJzonZjA1MScsJ2VqZWN0JzonZjA1MicsJ2NoZXZyb24tbGVmdCc6J2YwNTMnLCdjaGV2cm9uLXJpZ2h0JzonZjA1NCcsJ3BsdXMtY2lyY2xlJzonZjA1NScsJ21pbnVzLWNpcmNsZSc6J2YwNTYnLCd0aW1lcy1jaXJjbGUnOidmMDU3JywnY2hlY2stY2lyY2xlJzonZjA1OCcsJ3F1ZXN0aW9uLWNpcmNsZSc6J2YwNTknLCdpbmZvLWNpcmNsZSc6J2YwNWEnLCdjcm9zc2hhaXJzJzonZjA1YicsJ3RpbWVzLWNpcmNsZS1vJzonZjA1YycsJ2NoZWNrLWNpcmNsZS1vJzonZjA1ZCcsJ2Jhbic6J2YwNWUnLCdhcnJvdy1sZWZ0JzonZjA2MCcsJ2Fycm93LXJpZ2h0JzonZjA2MScsJ2Fycm93LXVwJzonZjA2MicsJ2Fycm93LWRvd24nOidmMDYzJywnbWFpbC1mb3J3YXJkLHNoYXJlJzonZjA2NCcsJ2V4cGFuZCc6J2YwNjUnLCdjb21wcmVzcyc6J2YwNjYnLCdwbHVzJzonZjA2NycsJ21pbnVzJzonZjA2OCcsJ2FzdGVyaXNrJzonZjA2OScsJ2V4Y2xhbWF0aW9uLWNpcmNsZSc6J2YwNmEnLCdnaWZ0JzonZjA2YicsJ2xlYWYnOidmMDZjJywnZmlyZSc6J2YwNmQnLCdleWUnOidmMDZlJywnZXllLXNsYXNoJzonZjA3MCcsJ3dhcm5pbmcsZXhjbGFtYXRpb24tdHJpYW5nbGUnOidmMDcxJywncGxhbmUnOidmMDcyJywnY2FsZW5kYXInOidmMDczJywncmFuZG9tJzonZjA3NCcsJ2NvbW1lbnQnOidmMDc1JywnbWFnbmV0JzonZjA3NicsJ2NoZXZyb24tdXAnOidmMDc3JywnY2hldnJvbi1kb3duJzonZjA3OCcsJ3JldHdlZXQnOidmMDc5Jywnc2hvcHBpbmctY2FydCc6J2YwN2EnLCdmb2xkZXInOidmMDdiJywnZm9sZGVyLW9wZW4nOidmMDdjJywnYXJyb3dzLXYnOidmMDdkJywnYXJyb3dzLWgnOidmMDdlJywnYmFyLWNoYXJ0LW8sYmFyLWNoYXJ0JzonZjA4MCcsJ3R3aXR0ZXItc3F1YXJlJzonZjA4MScsJ2ZhY2Vib29rLXNxdWFyZSc6J2YwODInLCdjYW1lcmEtcmV0cm8nOidmMDgzJywna2V5JzonZjA4NCcsJ2dlYXJzLGNvZ3MnOidmMDg1JywnY29tbWVudHMnOidmMDg2JywndGh1bWJzLW8tdXAnOidmMDg3JywndGh1bWJzLW8tZG93bic6J2YwODgnLCdzdGFyLWhhbGYnOidmMDg5JywnaGVhcnQtbyc6J2YwOGEnLCdzaWduLW91dCc6J2YwOGInLCdsaW5rZWRpbi1zcXVhcmUnOidmMDhjJywndGh1bWItdGFjayc6J2YwOGQnLCdleHRlcm5hbC1saW5rJzonZjA4ZScsJ3NpZ24taW4nOidmMDkwJywndHJvcGh5JzonZjA5MScsJ2dpdGh1Yi1zcXVhcmUnOidmMDkyJywndXBsb2FkJzonZjA5MycsJ2xlbW9uLW8nOidmMDk0JywncGhvbmUnOidmMDk1Jywnc3F1YXJlLW8nOidmMDk2JywnYm9va21hcmstbyc6J2YwOTcnLCdwaG9uZS1zcXVhcmUnOidmMDk4JywndHdpdHRlcic6J2YwOTknLCdmYWNlYm9vay1mLGZhY2Vib29rJzonZjA5YScsJ2dpdGh1Yic6J2YwOWInLCd1bmxvY2snOidmMDljJywnY3JlZGl0LWNhcmQnOidmMDlkJywnZmVlZCxyc3MnOidmMDllJywnaGRkLW8nOidmMGEwJywnYnVsbGhvcm4nOidmMGExJywnYmVsbCc6J2YwZjMnLCdjZXJ0aWZpY2F0ZSc6J2YwYTMnLCdoYW5kLW8tcmlnaHQnOidmMGE0JywnaGFuZC1vLWxlZnQnOidmMGE1JywnaGFuZC1vLXVwJzonZjBhNicsJ2hhbmQtby1kb3duJzonZjBhNycsJ2Fycm93LWNpcmNsZS1sZWZ0JzonZjBhOCcsJ2Fycm93LWNpcmNsZS1yaWdodCc6J2YwYTknLCdhcnJvdy1jaXJjbGUtdXAnOidmMGFhJywnYXJyb3ctY2lyY2xlLWRvd24nOidmMGFiJywnZ2xvYmUnOidmMGFjJywnd3JlbmNoJzonZjBhZCcsJ3Rhc2tzJzonZjBhZScsJ2ZpbHRlcic6J2YwYjAnLCdicmllZmNhc2UnOidmMGIxJywnYXJyb3dzLWFsdCc6J2YwYjInLCdncm91cCx1c2Vycyc6J2YwYzAnLCdjaGFpbixsaW5rJzonZjBjMScsJ2Nsb3VkJzonZjBjMicsJ2ZsYXNrJzonZjBjMycsJ2N1dCxzY2lzc29ycyc6J2YwYzQnLCdjb3B5LGZpbGVzLW8nOidmMGM1JywncGFwZXJjbGlwJzonZjBjNicsJ3NhdmUsZmxvcHB5LW8nOidmMGM3Jywnc3F1YXJlJzonZjBjOCcsJ25hdmljb24scmVvcmRlcixiYXJzJzonZjBjOScsJ2xpc3QtdWwnOidmMGNhJywnbGlzdC1vbCc6J2YwY2InLCdzdHJpa2V0aHJvdWdoJzonZjBjYycsJ3VuZGVybGluZSc6J2YwY2QnLCd0YWJsZSc6J2YwY2UnLCdtYWdpYyc6J2YwZDAnLCd0cnVjayc6J2YwZDEnLCdwaW50ZXJlc3QnOidmMGQyJywncGludGVyZXN0LXNxdWFyZSc6J2YwZDMnLCdnb29nbGUtcGx1cy1zcXVhcmUnOidmMGQ0JywnZ29vZ2xlLXBsdXMnOidmMGQ1JywnbW9uZXknOidmMGQ2JywnY2FyZXQtZG93bic6J2YwZDcnLCdjYXJldC11cCc6J2YwZDgnLCdjYXJldC1sZWZ0JzonZjBkOScsJ2NhcmV0LXJpZ2h0JzonZjBkYScsJ2NvbHVtbnMnOidmMGRiJywndW5zb3J0ZWQsc29ydCc6J2YwZGMnLCdzb3J0LWRvd24sc29ydC1kZXNjJzonZjBkZCcsJ3NvcnQtdXAsc29ydC1hc2MnOidmMGRlJywnZW52ZWxvcGUnOidmMGUwJywnbGlua2VkaW4nOidmMGUxJywncm90YXRlLWxlZnQsdW5kbyc6J2YwZTInLCdsZWdhbCxnYXZlbCc6J2YwZTMnLCdkYXNoYm9hcmQsdGFjaG9tZXRlcic6J2YwZTQnLCdjb21tZW50LW8nOidmMGU1JywnY29tbWVudHMtbyc6J2YwZTYnLCdmbGFzaCxib2x0JzonZjBlNycsJ3NpdGVtYXAnOidmMGU4JywndW1icmVsbGEnOidmMGU5JywncGFzdGUsY2xpcGJvYXJkJzonZjBlYScsJ2xpZ2h0YnVsYi1vJzonZjBlYicsJ2V4Y2hhbmdlJzonZjBlYycsJ2Nsb3VkLWRvd25sb2FkJzonZjBlZCcsJ2Nsb3VkLXVwbG9hZCc6J2YwZWUnLCd1c2VyLW1kJzonZjBmMCcsJ3N0ZXRob3Njb3BlJzonZjBmMScsJ3N1aXRjYXNlJzonZjBmMicsJ2JlbGwtbyc6J2YwYTInLCdjb2ZmZWUnOidmMGY0JywnY3V0bGVyeSc6J2YwZjUnLCdmaWxlLXRleHQtbyc6J2YwZjYnLCdidWlsZGluZy1vJzonZjBmNycsJ2hvc3BpdGFsLW8nOidmMGY4JywnYW1idWxhbmNlJzonZjBmOScsJ21lZGtpdCc6J2YwZmEnLCdmaWdodGVyLWpldCc6J2YwZmInLCdiZWVyJzonZjBmYycsJ2gtc3F1YXJlJzonZjBmZCcsJ3BsdXMtc3F1YXJlJzonZjBmZScsJ2FuZ2xlLWRvdWJsZS1sZWZ0JzonZjEwMCcsJ2FuZ2xlLWRvdWJsZS1yaWdodCc6J2YxMDEnLCdhbmdsZS1kb3VibGUtdXAnOidmMTAyJywnYW5nbGUtZG91YmxlLWRvd24nOidmMTAzJywnYW5nbGUtbGVmdCc6J2YxMDQnLCdhbmdsZS1yaWdodCc6J2YxMDUnLCdhbmdsZS11cCc6J2YxMDYnLCdhbmdsZS1kb3duJzonZjEwNycsJ2Rlc2t0b3AnOidmMTA4JywnbGFwdG9wJzonZjEwOScsJ3RhYmxldCc6J2YxMGEnLCdtb2JpbGUtcGhvbmUsbW9iaWxlJzonZjEwYicsJ2NpcmNsZS1vJzonZjEwYycsJ3F1b3RlLWxlZnQnOidmMTBkJywncXVvdGUtcmlnaHQnOidmMTBlJywnc3Bpbm5lcic6J2YxMTAnLCdjaXJjbGUnOidmMTExJywnbWFpbC1yZXBseSxyZXBseSc6J2YxMTInLCdnaXRodWItYWx0JzonZjExMycsJ2ZvbGRlci1vJzonZjExNCcsJ2ZvbGRlci1vcGVuLW8nOidmMTE1Jywnc21pbGUtbyc6J2YxMTgnLCdmcm93bi1vJzonZjExOScsJ21laC1vJzonZjExYScsJ2dhbWVwYWQnOidmMTFiJywna2V5Ym9hcmQtbyc6J2YxMWMnLCdmbGFnLW8nOidmMTFkJywnZmxhZy1jaGVja2VyZWQnOidmMTFlJywndGVybWluYWwnOidmMTIwJywnY29kZSc6J2YxMjEnLCdtYWlsLXJlcGx5LWFsbCxyZXBseS1hbGwnOidmMTIyJywnc3Rhci1oYWxmLWVtcHR5LHN0YXItaGFsZi1mdWxsLHN0YXItaGFsZi1vJzonZjEyMycsJ2xvY2F0aW9uLWFycm93JzonZjEyNCcsJ2Nyb3AnOidmMTI1JywnY29kZS1mb3JrJzonZjEyNicsJ3VubGluayxjaGFpbi1icm9rZW4nOidmMTI3JywncXVlc3Rpb24nOidmMTI4JywnaW5mbyc6J2YxMjknLCdleGNsYW1hdGlvbic6J2YxMmEnLCdzdXBlcnNjcmlwdCc6J2YxMmInLCdzdWJzY3JpcHQnOidmMTJjJywnZXJhc2VyJzonZjEyZCcsJ3B1enpsZS1waWVjZSc6J2YxMmUnLCdtaWNyb3Bob25lJzonZjEzMCcsJ21pY3JvcGhvbmUtc2xhc2gnOidmMTMxJywnc2hpZWxkJzonZjEzMicsJ2NhbGVuZGFyLW8nOidmMTMzJywnZmlyZS1leHRpbmd1aXNoZXInOidmMTM0Jywncm9ja2V0JzonZjEzNScsJ21heGNkbic6J2YxMzYnLCdjaGV2cm9uLWNpcmNsZS1sZWZ0JzonZjEzNycsJ2NoZXZyb24tY2lyY2xlLXJpZ2h0JzonZjEzOCcsJ2NoZXZyb24tY2lyY2xlLXVwJzonZjEzOScsJ2NoZXZyb24tY2lyY2xlLWRvd24nOidmMTNhJywnaHRtbDUnOidmMTNiJywnY3NzMyc6J2YxM2MnLCdhbmNob3InOidmMTNkJywndW5sb2NrLWFsdCc6J2YxM2UnLCdidWxsc2V5ZSc6J2YxNDAnLCdlbGxpcHNpcy1oJzonZjE0MScsJ2VsbGlwc2lzLXYnOidmMTQyJywncnNzLXNxdWFyZSc6J2YxNDMnLCdwbGF5LWNpcmNsZSc6J2YxNDQnLCd0aWNrZXQnOidmMTQ1JywnbWludXMtc3F1YXJlJzonZjE0NicsJ21pbnVzLXNxdWFyZS1vJzonZjE0NycsJ2xldmVsLXVwJzonZjE0OCcsJ2xldmVsLWRvd24nOidmMTQ5JywnY2hlY2stc3F1YXJlJzonZjE0YScsJ3BlbmNpbC1zcXVhcmUnOidmMTRiJywnZXh0ZXJuYWwtbGluay1zcXVhcmUnOidmMTRjJywnc2hhcmUtc3F1YXJlJzonZjE0ZCcsJ2NvbXBhc3MnOidmMTRlJywndG9nZ2xlLWRvd24sY2FyZXQtc3F1YXJlLW8tZG93bic6J2YxNTAnLCd0b2dnbGUtdXAsY2FyZXQtc3F1YXJlLW8tdXAnOidmMTUxJywndG9nZ2xlLXJpZ2h0LGNhcmV0LXNxdWFyZS1vLXJpZ2h0JzonZjE1MicsJ2V1cm8sZXVyJzonZjE1MycsJ2dicCc6J2YxNTQnLCdkb2xsYXIsdXNkJzonZjE1NScsJ3J1cGVlLGlucic6J2YxNTYnLCdjbnkscm1iLHllbixqcHknOidmMTU3JywncnVibGUscm91YmxlLHJ1Yic6J2YxNTgnLCd3b24sa3J3JzonZjE1OScsJ2JpdGNvaW4sYnRjJzonZjE1YScsJ2ZpbGUnOidmMTViJywnZmlsZS10ZXh0JzonZjE1YycsJ3NvcnQtYWxwaGEtYXNjJzonZjE1ZCcsJ3NvcnQtYWxwaGEtZGVzYyc6J2YxNWUnLCdzb3J0LWFtb3VudC1hc2MnOidmMTYwJywnc29ydC1hbW91bnQtZGVzYyc6J2YxNjEnLCdzb3J0LW51bWVyaWMtYXNjJzonZjE2MicsJ3NvcnQtbnVtZXJpYy1kZXNjJzonZjE2MycsJ3RodW1icy11cCc6J2YxNjQnLCd0aHVtYnMtZG93bic6J2YxNjUnLCd5b3V0dWJlLXNxdWFyZSc6J2YxNjYnLCd5b3V0dWJlJzonZjE2NycsJ3hpbmcnOidmMTY4JywneGluZy1zcXVhcmUnOidmMTY5JywneW91dHViZS1wbGF5JzonZjE2YScsJ2Ryb3Bib3gnOidmMTZiJywnc3RhY2stb3ZlcmZsb3cnOidmMTZjJywnaW5zdGFncmFtJzonZjE2ZCcsJ2ZsaWNrcic6J2YxNmUnLCdhZG4nOidmMTcwJywnYml0YnVja2V0JzonZjE3MScsJ2JpdGJ1Y2tldC1zcXVhcmUnOidmMTcyJywndHVtYmxyJzonZjE3MycsJ3R1bWJsci1zcXVhcmUnOidmMTc0JywnbG9uZy1hcnJvdy1kb3duJzonZjE3NScsJ2xvbmctYXJyb3ctdXAnOidmMTc2JywnbG9uZy1hcnJvdy1sZWZ0JzonZjE3NycsJ2xvbmctYXJyb3ctcmlnaHQnOidmMTc4JywnYXBwbGUnOidmMTc5Jywnd2luZG93cyc6J2YxN2EnLCdhbmRyb2lkJzonZjE3YicsJ2xpbnV4JzonZjE3YycsJ2RyaWJiYmxlJzonZjE3ZCcsJ3NreXBlJzonZjE3ZScsJ2ZvdXJzcXVhcmUnOidmMTgwJywndHJlbGxvJzonZjE4MScsJ2ZlbWFsZSc6J2YxODInLCdtYWxlJzonZjE4MycsJ2dpdHRpcCxncmF0aXBheSc6J2YxODQnLCdzdW4tbyc6J2YxODUnLCdtb29uLW8nOidmMTg2JywnYXJjaGl2ZSc6J2YxODcnLCdidWcnOidmMTg4JywndmsnOidmMTg5Jywnd2VpYm8nOidmMThhJywncmVucmVuJzonZjE4YicsJ3BhZ2VsaW5lcyc6J2YxOGMnLCdzdGFjay1leGNoYW5nZSc6J2YxOGQnLCdhcnJvdy1jaXJjbGUtby1yaWdodCc6J2YxOGUnLCdhcnJvdy1jaXJjbGUtby1sZWZ0JzonZjE5MCcsJ3RvZ2dsZS1sZWZ0LGNhcmV0LXNxdWFyZS1vLWxlZnQnOidmMTkxJywnZG90LWNpcmNsZS1vJzonZjE5MicsJ3doZWVsY2hhaXInOidmMTkzJywndmltZW8tc3F1YXJlJzonZjE5NCcsJ3R1cmtpc2gtbGlyYSx0cnknOidmMTk1JywncGx1cy1zcXVhcmUtbyc6J2YxOTYnLCdzcGFjZS1zaHV0dGxlJzonZjE5NycsJ3NsYWNrJzonZjE5OCcsJ2VudmVsb3BlLXNxdWFyZSc6J2YxOTknLCd3b3JkcHJlc3MnOidmMTlhJywnb3BlbmlkJzonZjE5YicsJ2luc3RpdHV0aW9uLGJhbmssdW5pdmVyc2l0eSc6J2YxOWMnLCdtb3J0YXItYm9hcmQsZ3JhZHVhdGlvbi1jYXAnOidmMTlkJywneWFob28nOidmMTllJywnZ29vZ2xlJzonZjFhMCcsJ3JlZGRpdCc6J2YxYTEnLCdyZWRkaXQtc3F1YXJlJzonZjFhMicsJ3N0dW1ibGV1cG9uLWNpcmNsZSc6J2YxYTMnLCdzdHVtYmxldXBvbic6J2YxYTQnLCdkZWxpY2lvdXMnOidmMWE1JywnZGlnZyc6J2YxYTYnLCdwaWVkLXBpcGVyLXBwJzonZjFhNycsJ3BpZWQtcGlwZXItYWx0JzonZjFhOCcsJ2RydXBhbCc6J2YxYTknLCdqb29tbGEnOidmMWFhJywnbGFuZ3VhZ2UnOidmMWFiJywnZmF4JzonZjFhYycsJ2J1aWxkaW5nJzonZjFhZCcsJ2NoaWxkJzonZjFhZScsJ3Bhdyc6J2YxYjAnLCdzcG9vbic6J2YxYjEnLCdjdWJlJzonZjFiMicsJ2N1YmVzJzonZjFiMycsJ2JlaGFuY2UnOidmMWI0JywnYmVoYW5jZS1zcXVhcmUnOidmMWI1Jywnc3RlYW0nOidmMWI2Jywnc3RlYW0tc3F1YXJlJzonZjFiNycsJ3JlY3ljbGUnOidmMWI4JywnYXV0b21vYmlsZSxjYXInOidmMWI5JywnY2FiLHRheGknOidmMWJhJywndHJlZSc6J2YxYmInLCdzcG90aWZ5JzonZjFiYycsJ2RldmlhbnRhcnQnOidmMWJkJywnc291bmRjbG91ZCc6J2YxYmUnLCdkYXRhYmFzZSc6J2YxYzAnLCdmaWxlLXBkZi1vJzonZjFjMScsJ2ZpbGUtd29yZC1vJzonZjFjMicsJ2ZpbGUtZXhjZWwtbyc6J2YxYzMnLCdmaWxlLXBvd2VycG9pbnQtbyc6J2YxYzQnLCdmaWxlLXBob3RvLW8sZmlsZS1waWN0dXJlLW8sZmlsZS1pbWFnZS1vJzonZjFjNScsJ2ZpbGUtemlwLW8sZmlsZS1hcmNoaXZlLW8nOidmMWM2JywnZmlsZS1zb3VuZC1vLGZpbGUtYXVkaW8tbyc6J2YxYzcnLCdmaWxlLW1vdmllLW8sZmlsZS12aWRlby1vJzonZjFjOCcsJ2ZpbGUtY29kZS1vJzonZjFjOScsJ3ZpbmUnOidmMWNhJywnY29kZXBlbic6J2YxY2InLCdqc2ZpZGRsZSc6J2YxY2MnLCdsaWZlLWJvdXksbGlmZS1idW95LGxpZmUtc2F2ZXIsc3VwcG9ydCxsaWZlLXJpbmcnOidmMWNkJywnY2lyY2xlLW8tbm90Y2gnOidmMWNlJywncmEscmVzaXN0YW5jZSxyZWJlbCc6J2YxZDAnLCdnZSxlbXBpcmUnOidmMWQxJywnZ2l0LXNxdWFyZSc6J2YxZDInLCdnaXQnOidmMWQzJywneS1jb21iaW5hdG9yLXNxdWFyZSx5Yy1zcXVhcmUsaGFja2VyLW5ld3MnOidmMWQ0JywndGVuY2VudC13ZWlibyc6J2YxZDUnLCdxcSc6J2YxZDYnLCd3ZWNoYXQsd2VpeGluJzonZjFkNycsJ3NlbmQscGFwZXItcGxhbmUnOidmMWQ4Jywnc2VuZC1vLHBhcGVyLXBsYW5lLW8nOidmMWQ5JywnaGlzdG9yeSc6J2YxZGEnLCdjaXJjbGUtdGhpbic6J2YxZGInLCdoZWFkZXInOidmMWRjJywncGFyYWdyYXBoJzonZjFkZCcsJ3NsaWRlcnMnOidmMWRlJywnc2hhcmUtYWx0JzonZjFlMCcsJ3NoYXJlLWFsdC1zcXVhcmUnOidmMWUxJywnYm9tYic6J2YxZTInLCdzb2NjZXItYmFsbC1vLGZ1dGJvbC1vJzonZjFlMycsJ3R0eSc6J2YxZTQnLCdiaW5vY3VsYXJzJzonZjFlNScsJ3BsdWcnOidmMWU2Jywnc2xpZGVzaGFyZSc6J2YxZTcnLCd0d2l0Y2gnOidmMWU4JywneWVscCc6J2YxZTknLCduZXdzcGFwZXItbyc6J2YxZWEnLCd3aWZpJzonZjFlYicsJ2NhbGN1bGF0b3InOidmMWVjJywncGF5cGFsJzonZjFlZCcsJ2dvb2dsZS13YWxsZXQnOidmMWVlJywnY2MtdmlzYSc6J2YxZjAnLCdjYy1tYXN0ZXJjYXJkJzonZjFmMScsJ2NjLWRpc2NvdmVyJzonZjFmMicsJ2NjLWFtZXgnOidmMWYzJywnY2MtcGF5cGFsJzonZjFmNCcsJ2NjLXN0cmlwZSc6J2YxZjUnLCdiZWxsLXNsYXNoJzonZjFmNicsJ2JlbGwtc2xhc2gtbyc6J2YxZjcnLCd0cmFzaCc6J2YxZjgnLCdjb3B5cmlnaHQnOidmMWY5JywnYXQnOidmMWZhJywnZXllZHJvcHBlcic6J2YxZmInLCdwYWludC1icnVzaCc6J2YxZmMnLCdiaXJ0aGRheS1jYWtlJzonZjFmZCcsJ2FyZWEtY2hhcnQnOidmMWZlJywncGllLWNoYXJ0JzonZjIwMCcsJ2xpbmUtY2hhcnQnOidmMjAxJywnbGFzdGZtJzonZjIwMicsJ2xhc3RmbS1zcXVhcmUnOidmMjAzJywndG9nZ2xlLW9mZic6J2YyMDQnLCd0b2dnbGUtb24nOidmMjA1JywnYmljeWNsZSc6J2YyMDYnLCdidXMnOidmMjA3JywnaW94aG9zdCc6J2YyMDgnLCdhbmdlbGxpc3QnOidmMjA5JywnY2MnOidmMjBhJywnc2hla2VsLHNoZXFlbCxpbHMnOidmMjBiJywnbWVhbnBhdGgnOidmMjBjJywnYnV5c2VsbGFkcyc6J2YyMGQnLCdjb25uZWN0ZGV2ZWxvcCc6J2YyMGUnLCdkYXNoY3ViZSc6J2YyMTAnLCdmb3J1bWJlZSc6J2YyMTEnLCdsZWFucHViJzonZjIxMicsJ3NlbGxzeSc6J2YyMTMnLCdzaGlydHNpbmJ1bGsnOidmMjE0Jywnc2ltcGx5YnVpbHQnOidmMjE1Jywnc2t5YXRsYXMnOidmMjE2JywnY2FydC1wbHVzJzonZjIxNycsJ2NhcnQtYXJyb3ctZG93bic6J2YyMTgnLCdkaWFtb25kJzonZjIxOScsJ3NoaXAnOidmMjFhJywndXNlci1zZWNyZXQnOidmMjFiJywnbW90b3JjeWNsZSc6J2YyMWMnLCdzdHJlZXQtdmlldyc6J2YyMWQnLCdoZWFydGJlYXQnOidmMjFlJywndmVudXMnOidmMjIxJywnbWFycyc6J2YyMjInLCdtZXJjdXJ5JzonZjIyMycsJ2ludGVyc2V4LHRyYW5zZ2VuZGVyJzonZjIyNCcsJ3RyYW5zZ2VuZGVyLWFsdCc6J2YyMjUnLCd2ZW51cy1kb3VibGUnOidmMjI2JywnbWFycy1kb3VibGUnOidmMjI3JywndmVudXMtbWFycyc6J2YyMjgnLCdtYXJzLXN0cm9rZSc6J2YyMjknLCdtYXJzLXN0cm9rZS12JzonZjIyYScsJ21hcnMtc3Ryb2tlLWgnOidmMjJiJywnbmV1dGVyJzonZjIyYycsJ2dlbmRlcmxlc3MnOidmMjJkJywnZmFjZWJvb2stb2ZmaWNpYWwnOidmMjMwJywncGludGVyZXN0LXAnOidmMjMxJywnd2hhdHNhcHAnOidmMjMyJywnc2VydmVyJzonZjIzMycsJ3VzZXItcGx1cyc6J2YyMzQnLCd1c2VyLXRpbWVzJzonZjIzNScsJ2hvdGVsLGJlZCc6J2YyMzYnLCd2aWFjb2luJzonZjIzNycsJ3RyYWluJzonZjIzOCcsJ3N1YndheSc6J2YyMzknLCdtZWRpdW0nOidmMjNhJywneWMseS1jb21iaW5hdG9yJzonZjIzYicsJ29wdGluLW1vbnN0ZXInOidmMjNjJywnb3BlbmNhcnQnOidmMjNkJywnZXhwZWRpdGVkc3NsJzonZjIzZScsJ2JhdHRlcnktNCxiYXR0ZXJ5LWZ1bGwnOidmMjQwJywnYmF0dGVyeS0zLGJhdHRlcnktdGhyZWUtcXVhcnRlcnMnOidmMjQxJywnYmF0dGVyeS0yLGJhdHRlcnktaGFsZic6J2YyNDInLCdiYXR0ZXJ5LTEsYmF0dGVyeS1xdWFydGVyJzonZjI0MycsJ2JhdHRlcnktMCxiYXR0ZXJ5LWVtcHR5JzonZjI0NCcsJ21vdXNlLXBvaW50ZXInOidmMjQ1JywnaS1jdXJzb3InOidmMjQ2Jywnb2JqZWN0LWdyb3VwJzonZjI0NycsJ29iamVjdC11bmdyb3VwJzonZjI0OCcsJ3N0aWNreS1ub3RlJzonZjI0OScsJ3N0aWNreS1ub3RlLW8nOidmMjRhJywnY2MtamNiJzonZjI0YicsJ2NjLWRpbmVycy1jbHViJzonZjI0YycsJ2Nsb25lJzonZjI0ZCcsJ2JhbGFuY2Utc2NhbGUnOidmMjRlJywnaG91cmdsYXNzLW8nOidmMjUwJywnaG91cmdsYXNzLTEsaG91cmdsYXNzLXN0YXJ0JzonZjI1MScsJ2hvdXJnbGFzcy0yLGhvdXJnbGFzcy1oYWxmJzonZjI1MicsJ2hvdXJnbGFzcy0zLGhvdXJnbGFzcy1lbmQnOidmMjUzJywnaG91cmdsYXNzJzonZjI1NCcsJ2hhbmQtZ3JhYi1vLGhhbmQtcm9jay1vJzonZjI1NScsJ2hhbmQtc3RvcC1vLGhhbmQtcGFwZXItbyc6J2YyNTYnLCdoYW5kLXNjaXNzb3JzLW8nOidmMjU3JywnaGFuZC1saXphcmQtbyc6J2YyNTgnLCdoYW5kLXNwb2NrLW8nOidmMjU5JywnaGFuZC1wb2ludGVyLW8nOidmMjVhJywnaGFuZC1wZWFjZS1vJzonZjI1YicsJ3RyYWRlbWFyayc6J2YyNWMnLCdyZWdpc3RlcmVkJzonZjI1ZCcsJ2NyZWF0aXZlLWNvbW1vbnMnOidmMjVlJywnZ2cnOidmMjYwJywnZ2ctY2lyY2xlJzonZjI2MScsJ3RyaXBhZHZpc29yJzonZjI2MicsJ29kbm9rbGFzc25pa2knOidmMjYzJywnb2Rub2tsYXNzbmlraS1zcXVhcmUnOidmMjY0JywnZ2V0LXBvY2tldCc6J2YyNjUnLCd3aWtpcGVkaWEtdyc6J2YyNjYnLCdzYWZhcmknOidmMjY3JywnY2hyb21lJzonZjI2OCcsJ2ZpcmVmb3gnOidmMjY5Jywnb3BlcmEnOidmMjZhJywnaW50ZXJuZXQtZXhwbG9yZXInOidmMjZiJywndHYsdGVsZXZpc2lvbic6J2YyNmMnLCdjb250YW8nOidmMjZkJywnNTAwcHgnOidmMjZlJywnYW1hem9uJzonZjI3MCcsJ2NhbGVuZGFyLXBsdXMtbyc6J2YyNzEnLCdjYWxlbmRhci1taW51cy1vJzonZjI3MicsJ2NhbGVuZGFyLXRpbWVzLW8nOidmMjczJywnY2FsZW5kYXItY2hlY2stbyc6J2YyNzQnLCdpbmR1c3RyeSc6J2YyNzUnLCdtYXAtcGluJzonZjI3NicsJ21hcC1zaWducyc6J2YyNzcnLCdtYXAtbyc6J2YyNzgnLCdtYXAnOidmMjc5JywnY29tbWVudGluZyc6J2YyN2EnLCdjb21tZW50aW5nLW8nOidmMjdiJywnaG91enonOidmMjdjJywndmltZW8nOidmMjdkJywnYmxhY2stdGllJzonZjI3ZScsJ2ZvbnRpY29ucyc6J2YyODAnLCdyZWRkaXQtYWxpZW4nOidmMjgxJywnZWRnZSc6J2YyODInLCdjcmVkaXQtY2FyZC1hbHQnOidmMjgzJywnY29kaWVwaWUnOidmMjg0JywnbW9keCc6J2YyODUnLCdmb3J0LWF3ZXNvbWUnOidmMjg2JywndXNiJzonZjI4NycsJ3Byb2R1Y3QtaHVudCc6J2YyODgnLCdtaXhjbG91ZCc6J2YyODknLCdzY3JpYmQnOidmMjhhJywncGF1c2UtY2lyY2xlJzonZjI4YicsJ3BhdXNlLWNpcmNsZS1vJzonZjI4YycsJ3N0b3AtY2lyY2xlJzonZjI4ZCcsJ3N0b3AtY2lyY2xlLW8nOidmMjhlJywnc2hvcHBpbmctYmFnJzonZjI5MCcsJ3Nob3BwaW5nLWJhc2tldCc6J2YyOTEnLCdoYXNodGFnJzonZjI5MicsJ2JsdWV0b290aCc6J2YyOTMnLCdibHVldG9vdGgtYic6J2YyOTQnLCdwZXJjZW50JzonZjI5NScsJ2dpdGxhYic6J2YyOTYnLCd3cGJlZ2lubmVyJzonZjI5NycsJ3dwZm9ybXMnOidmMjk4JywnZW52aXJhJzonZjI5OScsJ3VuaXZlcnNhbC1hY2Nlc3MnOidmMjlhJywnd2hlZWxjaGFpci1hbHQnOidmMjliJywncXVlc3Rpb24tY2lyY2xlLW8nOidmMjljJywnYmxpbmQnOidmMjlkJywnYXVkaW8tZGVzY3JpcHRpb24nOidmMjllJywndm9sdW1lLWNvbnRyb2wtcGhvbmUnOidmMmEwJywnYnJhaWxsZSc6J2YyYTEnLCdhc3Npc3RpdmUtbGlzdGVuaW5nLXN5c3RlbXMnOidmMmEyJywnYXNsLWludGVycHJldGluZyxhbWVyaWNhbi1zaWduLWxhbmd1YWdlLWludGVycHJldGluZyc6J2YyYTMnLCdkZWFmbmVzcyxoYXJkLW9mLWhlYXJpbmcsZGVhZic6J2YyYTQnLCdnbGlkZSc6J2YyYTUnLCdnbGlkZS1nJzonZjJhNicsJ3NpZ25pbmcsc2lnbi1sYW5ndWFnZSc6J2YyYTcnLCdsb3ctdmlzaW9uJzonZjJhOCcsJ3ZpYWRlbyc6J2YyYTknLCd2aWFkZW8tc3F1YXJlJzonZjJhYScsJ3NuYXBjaGF0JzonZjJhYicsJ3NuYXBjaGF0LWdob3N0JzonZjJhYycsJ3NuYXBjaGF0LXNxdWFyZSc6J2YyYWQnLCdwaWVkLXBpcGVyJzonZjJhZScsJ2ZpcnN0LW9yZGVyJzonZjJiMCcsJ3lvYXN0JzonZjJiMScsJ3RoZW1laXNsZSc6J2YyYjInLCdnb29nbGUtcGx1cy1jaXJjbGUsZ29vZ2xlLXBsdXMtb2ZmaWNpYWwnOidmMmIzJywnZmEsZm9udC1hd2Vzb21lJzonZjJiNCd9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGljb24oZCkge1xuICAgICAgdmFyIGNvZGU7XG5cbiAgICAgIGlmIChvcHRpb25zLmljb25NYXAgJiYgb3B0aW9ucy5zaG93SWNvbnMgJiYgb3B0aW9ucy5pY29ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV0gJiYgb3B0aW9ucy5pY29uTWFwW29wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dXSkge1xuICAgICAgICAgIGNvZGUgPSBvcHRpb25zLmljb25NYXBbb3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV1dO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaWNvbk1hcFtkLmxhYmVsc1swXV0pIHtcbiAgICAgICAgICBjb2RlID0gb3B0aW9ucy5pY29uTWFwW2QubGFiZWxzWzBdXTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXSkge1xuICAgICAgICAgIGNvZGUgPSBvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29kZTtcbiAgICB9XG5cbmZ1bmN0aW9uIGltYWdlKGQpIHtcbiAgdmFyIGksIGltYWdlc0ZvckxhYmVsLCBpbWcsIGltZ0xldmVsLCBsYWJlbCwgbGFiZWxQcm9wZXJ0eVZhbHVlLCBwcm9wZXJ0eSwgdmFsdWU7XG5cbiAgaWYgKG9wdGlvbnMuaW1hZ2VzKSB7XG4gICAgaW1hZ2VzRm9yTGFiZWwgPSBvcHRpb25zLmltYWdlTWFwW2QubGFiZWxzWzBdXTtcblxuICAgIGlmIChpbWFnZXNGb3JMYWJlbCkge1xuICAgICAgaW1nTGV2ZWwgPSAwO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaW1hZ2VzRm9yTGFiZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGFiZWxQcm9wZXJ0eVZhbHVlID0gaW1hZ2VzRm9yTGFiZWxbaV0uc3BsaXQoJ3wnKTtcblxuICAgICAgICBzd2l0Y2ggKGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICB2YWx1ZSA9IGxhYmVsUHJvcGVydHlWYWx1ZVsyXTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBwcm9wZXJ0eSA9IGxhYmVsUHJvcGVydHlWYWx1ZVsxXTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBsYWJlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkLmxhYmVsc1swXSA9PT0gbGFiZWwgJiZcbiAgICAgICAgICAoIXByb3BlcnR5IHx8IGQucHJvcGVydGllc1twcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkgJiZcbiAgICAgICAgICAoIXZhbHVlIHx8IGQucHJvcGVydGllc1twcm9wZXJ0eV0gPT09IHZhbHVlKSkge1xuICAgICAgICAgIGlmIChsYWJlbFByb3BlcnR5VmFsdWUubGVuZ3RoID4gaW1nTGV2ZWwpIHtcbiAgICAgICAgICAgIGltZyA9IG9wdGlvbnMuaW1hZ2VzW2ltYWdlc0ZvckxhYmVsW2ldXTtcbiAgICAgICAgICAgIGltZ0xldmVsID0gbGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW1nO1xufVxuXG5mdW5jdGlvbiBpbml0KF9zZWxlY3RvciwgX29wdGlvbnMpIHtcbiAgaW5pdEljb25NYXAoKTtcblxuICBtZXJnZShvcHRpb25zLCBfb3B0aW9ucyk7XG5cbiAgaWYgKG9wdGlvbnMuaWNvbnMpIHtcbiAgICBvcHRpb25zLnNob3dJY29ucyA9IHRydWU7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMubWluQ29sbGlzaW9uKSB7XG4gICAgb3B0aW9ucy5taW5Db2xsaXNpb24gPSBvcHRpb25zLm5vZGVSYWRpdXMgKiAyO1xuICB9XG5cbiAgaW5pdEltYWdlTWFwKCk7XG5cbiAgc2VsZWN0b3IgPSBfc2VsZWN0b3I7XG5cbiAgY29udGFpbmVyID0gZDMuc2VsZWN0KHNlbGVjdG9yKTtcblxuICBjb250YWluZXIuYXR0cignY2xhc3MnLCAnbmVvNGpkMycpXG4gICAgLmh0bWwoJycpO1xuXG4gIGlmIChvcHRpb25zLmluZm9QYW5lbCkge1xuICAgIGluZm8gPSBhcHBlbmRJbmZvUGFuZWwoY29udGFpbmVyKTtcbiAgfVxuXG4gIGFwcGVuZEdyYXBoKGNvbnRhaW5lcik7XG5cbiAgc2ltdWxhdGlvbiA9IGluaXRTaW11bGF0aW9uKCk7XG5cblxuICBpZiAob3B0aW9ucy5uZW80akRhdGEpIHtcbiAgICBsb2FkTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLm5lbzRqRGF0YVVybCkge1xuICAgIGxvYWROZW80akRhdGFGcm9tVXJsKG9wdGlvbnMubmVvNGpEYXRhVXJsKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogYm90aCBuZW80akRhdGEgYW5kIG5lbzRqRGF0YVVybCBhcmUgZW1wdHkhJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdEljb25NYXAoKSB7XG4gIE9iamVjdC5rZXlzKG9wdGlvbnMuaWNvbk1hcCkuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgdmFyIGtleXMgPSBrZXkuc3BsaXQoJywnKSxcbiAgICAgIHZhbHVlID0gb3B0aW9ucy5pY29uTWFwW2tleV07XG5cbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBvcHRpb25zLmljb25NYXBba2V5XSA9IHZhbHVlO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdEltYWdlTWFwKCkge1xuICB2YXIga2V5LCBrZXlzLCBzZWxlY3RvcjtcblxuICBmb3IgKGtleSBpbiBvcHRpb25zLmltYWdlcykge1xuICAgIGlmIChvcHRpb25zLmltYWdlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBrZXlzID0ga2V5LnNwbGl0KCd8Jyk7XG5cbiAgICAgIGlmICghb3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXSkge1xuICAgICAgICBvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dID0gW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFNpbXVsYXRpb24oKSB7XG4gIHZhciBzcHJlYWRGYWN0b3IgPSAxLjI1O1xuICB2YXIgc2ltdWxhdGlvbiA9IGQzLmZvcmNlU2ltdWxhdGlvbigpXG4gIC8vLmZvcmNlKCd4JywgZDMuZm9yY2VDb2xsaWRlKCkuc3RyZW5ndGgoMC4wMDIpKVxuICAvLy5mb3JjZSgneScsIGQzLmZvcmNlQ29sbGlkZSgpLnN0cmVuZ3RoKDAuMDAyKSlcbiAgLy8uZm9yY2UoJ3knLCBkMy5mb3JjZSgpLnN0cmVuZ3RoKDAuMDAyKSlcbiAgICAuZm9yY2UoJ2NvbGxpZGUnLCBkMy5mb3JjZUNvbGxpZGUoKS5yYWRpdXMoZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMubWluQ29sbGlzaW9uICogc3ByZWFkRmFjdG9yO1xuICAgIH0pLml0ZXJhdGlvbnMoMTApKVxuICAgIC5mb3JjZSgnY2hhcmdlJywgZDMuZm9yY2VNYW55Qm9keSgpKVxuICAgIC5mb3JjZSgnbGluaycsIGQzLmZvcmNlTGluaygpLmlkKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkLmlkO1xuICAgIH0pKVxuICAgIC5mb3JjZSgnY2VudGVyJywgZDMuZm9yY2VDZW50ZXIoc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLCBzdmcubm9kZSgpLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLyAyKSlcbiAgICAub24oJ3RpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHRpY2soKTtcbiAgICB9KVxuICAgIC5vbignZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAob3B0aW9ucy56b29tRml0ICYmICFqdXN0TG9hZGVkKSB7XG4gICAgICAgIGp1c3RMb2FkZWQgPSB0cnVlO1xuICAgICAgICB6b29tRml0KDIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIHJldHVybiBzaW11bGF0aW9uO1xufVxuXG5mdW5jdGlvbiBsb2FkTmVvNGpEYXRhKCkge1xuICBub2RlcyA9IFtdO1xuICByZWxhdGlvbnNoaXBzID0gW107XG5cbiAgdXBkYXRlV2l0aE5lbzRqRGF0YShvcHRpb25zLm5lbzRqRGF0YSk7XG59XG5cbmZ1bmN0aW9uIGxvYWROZW80akRhdGFGcm9tVXJsKG5lbzRqRGF0YVVybCkge1xuICBub2RlcyA9IFtdO1xuICByZWxhdGlvbnNoaXBzID0gW107XG5cbiAgZDMuanNvbihuZW80akRhdGFVcmwsIGZ1bmN0aW9uKGVycm9yLCBkYXRhKSB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICB1cGRhdGVXaXRoTmVvNGpEYXRhKGRhdGEpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gbWVyZ2UodGFyZ2V0LCBzb3VyY2UpIHtcbiAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgdGFyZ2V0W3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBuZW80akRhdGFUb0QzRGF0YShkYXRhKSB7XG4gIHZhciBncmFwaCA9IHtcbiAgICBub2RlczogW10sXG4gICAgcmVsYXRpb25zaGlwczogW11cbiAgfTtcblxuICBkYXRhLnJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXN1bHQuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGRhdGEuZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmICghY29udGFpbnMoZ3JhcGgubm9kZXMsIG5vZGUuaWQpKSB7XG4gICAgICAgICAgZ3JhcGgubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwcy5mb3JFYWNoKGZ1bmN0aW9uKHJlbGF0aW9uc2hpcCkge1xuICAgICAgICByZWxhdGlvbnNoaXAuc291cmNlID0gcmVsYXRpb25zaGlwLnN0YXJ0Tm9kZTtcbiAgICAgICAgcmVsYXRpb25zaGlwLnRhcmdldCA9IHJlbGF0aW9uc2hpcC5lbmROb2RlO1xuICAgICAgICBncmFwaC5yZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKTtcbiAgICAgIH0pO1xuXG4gICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhLnNvdXJjZSA+IGIuc291cmNlKSB7XG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH0gZWxzZSBpZiAoYS5zb3VyY2UgPCBiLnNvdXJjZSkge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoYS50YXJnZXQgPiBiLnRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEudGFyZ2V0IDwgYi50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGkgIT09IDAgJiYgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLnNvdXJjZSA9PT0gZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ktMV0uc291cmNlICYmIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS50YXJnZXQgPT09IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpLTFdLnRhcmdldCkge1xuICAgICAgICAgIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS5saW5rbnVtID0gZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2kgLSAxXS5saW5rbnVtICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0ubGlua251bSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG5mdW5jdGlvbiByb3RhdGUoY3gsIGN5LCB4LCB5LCBhbmdsZSkge1xuICB2YXIgcmFkaWFucyA9IChNYXRoLlBJIC8gMTgwKSAqIGFuZ2xlLFxuICAgIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxuICAgIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpLFxuICAgIG54ID0gKGNvcyAqICh4IC0gY3gpKSArIChzaW4gKiAoeSAtIGN5KSkgKyBjeCxcbiAgICBueSA9IChjb3MgKiAoeSAtIGN5KSkgLSAoc2luICogKHggLSBjeCkpICsgY3k7XG5cbiAgcmV0dXJuIHsgeDogbngsIHk6IG55IH07XG59XG5cbmZ1bmN0aW9uIHJvdGF0ZVBvaW50KGMsIHAsIGFuZ2xlKSB7XG4gIHJldHVybiByb3RhdGUoYy54LCBjLnksIHAueCwgcC55LCBhbmdsZSk7XG59XG5cbmZ1bmN0aW9uIHJvdGF0aW9uKHNvdXJjZSwgdGFyZ2V0KSB7XG4gIHJldHVybiBNYXRoLmF0YW4yKHRhcmdldC55IC0gc291cmNlLnksIHRhcmdldC54IC0gc291cmNlLngpICogMTgwIC8gTWF0aC5QSTtcbn1cblxuZnVuY3Rpb24gc2l6ZSgpIHtcbiAgcmV0dXJuIHtcbiAgICBub2Rlczogbm9kZXMubGVuZ3RoLFxuICAgIHJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMubGVuZ3RoXG4gIH07XG59XG4vKlxuICAgIGZ1bmN0aW9uIHNtb290aFRyYW5zZm9ybShlbGVtLCB0cmFuc2xhdGUsIHNjYWxlKSB7XG4gICAgICAgIHZhciBhbmltYXRpb25NaWxsaXNlY29uZHMgPSA1MDAwLFxuICAgICAgICAgICAgdGltZW91dE1pbGxpc2Vjb25kcyA9IDUwLFxuICAgICAgICAgICAgc3RlcHMgPSBwYXJzZUludChhbmltYXRpb25NaWxsaXNlY29uZHMgLyB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCAxLCBzdGVwcyk7XG4gICAgICAgIH0sIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNtb290aFRyYW5zZm9ybVN0ZXAoZWxlbSwgdHJhbnNsYXRlLCBzY2FsZSwgdGltZW91dE1pbGxpc2Vjb25kcywgc3RlcCwgc3RlcHMpIHtcbiAgICAgICAgdmFyIHByb2dyZXNzID0gc3RlcCAvIHN0ZXBzO1xuXG4gICAgICAgIGVsZW0uYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgKHRyYW5zbGF0ZVswXSAqIHByb2dyZXNzKSArICcsICcgKyAodHJhbnNsYXRlWzFdICogcHJvZ3Jlc3MpICsgJykgc2NhbGUoJyArIChzY2FsZSAqIHByb2dyZXNzKSArICcpJyk7XG5cbiAgICAgICAgaWYgKHN0ZXAgPCBzdGVwcykge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzbW9vdGhUcmFuc2Zvcm1TdGVwKGVsZW0sIHRyYW5zbGF0ZSwgc2NhbGUsIHRpbWVvdXRNaWxsaXNlY29uZHMsIHN0ZXAgKyAxLCBzdGVwcyk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAqL1xuZnVuY3Rpb24gc3RpY2tOb2RlKGQpIHtcbiAgZC5meCA9IGQzLmV2ZW50Lng7XG4gIGQuZnkgPSBkMy5ldmVudC55O1xufVxuXG5mdW5jdGlvbiB0aWNrKCkge1xuICB0aWNrTm9kZXMoKTtcbiAgdGlja1JlbGF0aW9uc2hpcHMoKTtcbn1cblxuZnVuY3Rpb24gdGlja05vZGVzKCkge1xuICBpZiAobm9kZSkge1xuICAgIG5vZGUuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIGQueCArICcsICcgKyBkLnkgKyAnKSc7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHMoKSB7XG4gIGlmIChyZWxhdGlvbnNoaXApIHtcbiAgICByZWxhdGlvbnNoaXAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KTtcbiAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBkLnNvdXJjZS54ICsgJywgJyArIGQuc291cmNlLnkgKyAnKSByb3RhdGUoJyArIGFuZ2xlICsgJyknO1xuICAgIH0pO1xuXG4gICAgdGlja1JlbGF0aW9uc2hpcHNUZXh0cygpO1xuICAgIHRpY2tSZWxhdGlvbnNoaXBzT3V0bGluZXMoKTtcbiAgICB0aWNrUmVsYXRpb25zaGlwc092ZXJsYXlzKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNPdXRsaW5lcygpIHtcbiAgcmVsYXRpb25zaGlwLmVhY2goZnVuY3Rpb24ocmVsYXRpb25zaGlwKSB7XG5cbiAgICB2YXIgcmVsID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgIHZhciBvdXRsaW5lID0gcmVsLnNlbGVjdCgnLm91dGxpbmUnKTtcbiAgICB2YXIgdGV4dCA9IHJlbC5zZWxlY3QoJy50ZXh0Jyk7XG4gICAgdmFyIGJib3ggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCk7XG4gICAgdmFyIHBhZGRpbmcgPSAwO1xuXG5cbiAgICB2YXIgdGV4dEJvdW5kaW5nQm94ID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpXG5cbiAgICBpZiAoJ1J1bGVWaW9sYXRlZCcgaW4gcmVsYXRpb25zaGlwLnByb3BlcnRpZXMpe1xuICAgICAgdmFyIHN0YXR1cyA9IHJlbGF0aW9uc2hpcC5wcm9wZXJ0aWVzLlJ1bGVWaW9sYXRlZC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICBpZiAoc3RhdHVzICE9ICdubycpe1xuICAgICAgICB0ZXh0Qm91bmRpbmdCb3ggPSB7eDogMCwgeTogMCwgd2lkdGg6IDE3LCBoZWlnaHQ6IDB9XG4gICAgICB9XG4gICAgfVxuXG5cbiAgICBvdXRsaW5lLmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7XG4gICAgICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSxcbiAgICAgICAgdGV4dFBhZGRpbmcgPSAwLFxuICAgICAgICB1ID0gdW5pdGFyeVZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgICB0ZXh0TWFyZ2luID0geyB4OiAoZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAodGV4dEJvdW5kaW5nQm94LndpZHRoICsgdGV4dFBhZGRpbmcpICogdS54KSAqIDAuNSwgeTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKHRleHRCb3VuZGluZ0JveC53aWR0aCArIHRleHRQYWRkaW5nKSAqIHUueSkgKiAwLjUgfSxcbiAgICAgICAgbiA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0KSxcbiAgICAgICAgcm90YXRlZFBvaW50QTEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCwgeTogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEIxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IHRleHRNYXJnaW4ueCAtIG4ueCwgeTogdGV4dE1hcmdpbi55IC0gbi55IH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50QzEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogdGV4dE1hcmdpbi54LCB5OiB0ZXh0TWFyZ2luLnkgfSwgYW5nbGUpLFxuICAgICAgICByb3RhdGVkUG9pbnREMSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54LCB5OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50QTIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSB0ZXh0TWFyZ2luLnggLSBuLngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gdGV4dE1hcmdpbi55IC0gbi55IH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50QjIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSBuLnggLSB1LnggKiBvcHRpb25zLmFycm93U2l6ZSwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSBuLnkgLSB1LnkgKiBvcHRpb25zLmFycm93U2l6ZSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEMyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54IC0gbi54ICsgKG4ueCAtIHUueCkgKiBvcHRpb25zLmFycm93U2l6ZSwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSBuLnkgKyAobi55IC0gdS55KSAqIG9wdGlvbnMuYXJyb3dTaXplIH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50RDIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50RTIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggKyAoLSBuLnggLSB1LngpICogb3B0aW9ucy5hcnJvd1NpemUsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55ICsgKC0gbi55IC0gdS55KSAqIG9wdGlvbnMuYXJyb3dTaXplIH0sIGFuZ2xlKSxcbiAgICAgICAgcm90YXRlZFBvaW50RjIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSB1LnggKiBvcHRpb25zLmFycm93U2l6ZSwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSB1LnkgKiBvcHRpb25zLmFycm93U2l6ZSB9LCBhbmdsZSksXG4gICAgICAgIHJvdGF0ZWRQb2ludEcyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gdGV4dE1hcmdpbi54LCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIHRleHRNYXJnaW4ueSB9LCBhbmdsZSk7XG5cbiAgICAgIHJldHVybiAnTSAnICsgcm90YXRlZFBvaW50QTEueCArICcgJyArIHJvdGF0ZWRQb2ludEExLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEIxLnggKyAnICcgKyByb3RhdGVkUG9pbnRCMS55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRDMS54ICsgJyAnICsgcm90YXRlZFBvaW50QzEueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RDEueCArICcgJyArIHJvdGF0ZWRQb2ludEQxLnkgK1xuICAgICAgICAnIFogTSAnICsgcm90YXRlZFBvaW50QTIueCArICcgJyArIHJvdGF0ZWRQb2ludEEyLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEIyLnggKyAnICcgKyByb3RhdGVkUG9pbnRCMi55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRDMi54ICsgJyAnICsgcm90YXRlZFBvaW50QzIueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RDIueCArICcgJyArIHJvdGF0ZWRQb2ludEQyLnkgK1xuICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEUyLnggKyAnICcgKyByb3RhdGVkUG9pbnRFMi55ICtcbiAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRGMi54ICsgJyAnICsgcm90YXRlZFBvaW50RjIueSArXG4gICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RzIueCArICcgJyArIHJvdGF0ZWRQb2ludEcyLnkgK1xuICAgICAgICAnIFonO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpIHtcbiAgcmVsYXRpb25zaGlwT3ZlcmxheS5hdHRyKCdkJywgZnVuY3Rpb24oZCkge1xuICAgIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcbiAgICAgIGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSxcbiAgICAgIG4xID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpLFxuICAgICAgbiA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0LCA1MCksXG4gICAgICByb3RhdGVkUG9pbnRBID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgLSBuLngsIHk6IDAgLSBuLnkgfSwgYW5nbGUpLFxuICAgICAgcm90YXRlZFBvaW50QiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIG4ueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSBuLnkgfSwgYW5nbGUpLFxuICAgICAgcm90YXRlZFBvaW50QyA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCArIG4ueCAtIG4xLngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55ICsgbi55IC0gbjEueSB9LCBhbmdsZSksXG4gICAgICByb3RhdGVkUG9pbnREID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgKyBuLnggLSBuMS54LCB5OiAwICsgbi55IC0gbjEueSB9LCBhbmdsZSk7XG5cbiAgICByZXR1cm4gJ00gJyArIHJvdGF0ZWRQb2ludEEueCArICcgJyArIHJvdGF0ZWRQb2ludEEueSArXG4gICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEIueCArICcgJyArIHJvdGF0ZWRQb2ludEIueSArXG4gICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEMueCArICcgJyArIHJvdGF0ZWRQb2ludEMueSArXG4gICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEQueCArICcgJyArIHJvdGF0ZWRQb2ludEQueSArXG4gICAgICAnIFonO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNUZXh0cygpIHtcbiAgcmVsYXRpb25zaGlwVGV4dC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgdmFyIGFuZ2xlID0gKHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCkgKyAzNjApICUgMzYwLFxuICAgICAgbWlycm9yID0gYW5nbGUgPiA5MCAmJiBhbmdsZSA8IDI3MCxcbiAgICAgIGNlbnRlciA9IHsgeDogMCwgeTogMCB9LFxuICAgICAgbiA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0KSxcbiAgICAgIG5XZWlnaHQgPSBtaXJyb3IgPyAyIDogLTMsXG4gICAgICBwb2ludCA9IHsgeDogKGQudGFyZ2V0LnggLSBkLnNvdXJjZS54KSAqIDAuNSArIG4ueCAqIG5XZWlnaHQsIHk6IChkLnRhcmdldC55IC0gZC5zb3VyY2UueSkgKiAwLjUgKyBuLnkgKiBuV2VpZ2h0IH0sXG4gICAgICByb3RhdGVkUG9pbnQgPSByb3RhdGVQb2ludChjZW50ZXIsIHBvaW50LCBhbmdsZSk7XG5cbiAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcm90YXRlZFBvaW50LnggKyAnLCAnICsgcm90YXRlZFBvaW50LnkgKyAnKSByb3RhdGUoJyArIChtaXJyb3IgPyAxODAgOiAwKSArICcpJztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvU3RyaW5nKGQpIHtcbiAgdmFyIHMgPSBkLmxhYmVscyA/IGQubGFiZWxzWzBdIDogZC50eXBlO1xuXG4gIHMgKz0gJyAoPGlkPjogJyArIGQuaWQ7XG5cbiAgT2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgcyArPSAnLCAnICsgcHJvcGVydHkgKyAnOiAnICsgSlNPTi5zdHJpbmdpZnkoZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSk7XG4gIH0pO1xuXG4gIHMgKz0gJyknO1xuXG4gIHJldHVybiBzO1xufVxuXG5mdW5jdGlvbiB1bml0YXJ5Tm9ybWFsVmVjdG9yKHNvdXJjZSwgdGFyZ2V0LCBuZXdMZW5ndGgpIHtcbiAgdmFyIGNlbnRlciA9IHsgeDogMCwgeTogMCB9LFxuICAgIHZlY3RvciA9IHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCk7XG5cbiAgcmV0dXJuIHJvdGF0ZVBvaW50KGNlbnRlciwgdmVjdG9yLCA5MCk7XG59XG5cbmZ1bmN0aW9uIHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KE1hdGgucG93KHRhcmdldC54IC0gc291cmNlLngsIDIpICsgTWF0aC5wb3codGFyZ2V0LnkgLSBzb3VyY2UueSwgMikpIC8gTWF0aC5zcXJ0KG5ld0xlbmd0aCB8fCAxKTtcblxuICByZXR1cm4ge1xuICAgIHg6ICh0YXJnZXQueCAtIHNvdXJjZS54KSAvIGxlbmd0aCxcbiAgICB5OiAodGFyZ2V0LnkgLSBzb3VyY2UueSkgLyBsZW5ndGgsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVdpdGhEM0RhdGEoZDNEYXRhKSB7XG4gIC8vIG1hcmtlclxuICBvcHRpb25zLmdsb2JhbERpY3QgPSBydWxlVmlvbGF0aW9uRGljdChkM0RhdGEucmVsYXRpb25zaGlwcyk7XG4gIHVwZGF0ZU5vZGVzQW5kUmVsYXRpb25zaGlwcyhkM0RhdGEubm9kZXMsIGQzRGF0YS5yZWxhdGlvbnNoaXBzKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlV2l0aE5lbzRqRGF0YShuZW80akRhdGEpIHtcbiAgdmFyIGQzRGF0YSA9IG5lbzRqRGF0YVRvRDNEYXRhKG5lbzRqRGF0YSk7XG4gIHVwZGF0ZVdpdGhEM0RhdGEoZDNEYXRhKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSW5mbyhkKSB7XG4gIGNsZWFySW5mbygpO1xuXG4gIGlmIChkLmxhYmVscykge1xuICAgIGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoJ2NsYXNzJywgZC5sYWJlbHNbMF0pO1xuICB9IGVsc2Uge1xuICAgIGFwcGVuZEluZm9FbGVtZW50UmVsYXRpb25zaGlwKCdjbGFzcycsIGQudHlwZSk7XG4gIH1cblxuICBhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KCdwcm9wZXJ0eScsICcmbHQ7aWQmZ3Q7JywgZC5pZCk7XG5cbiAgT2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgYXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eSgncHJvcGVydHknLCBwcm9wZXJ0eSwgSlNPTi5zdHJpbmdpZnkoZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSkpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlTm9kZXMobikge1xuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShub2Rlcywgbik7XG5cbiAgbm9kZSA9IHN2Z05vZGVzLnNlbGVjdEFsbCgnLm5vZGUnKVxuICAgIC5kYXRhKG5vZGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmlkOyB9KTtcbiAgdmFyIG5vZGVFbnRlciA9IGFwcGVuZE5vZGVUb0dyYXBoKCk7XG4gIG5vZGUgPSBub2RlRW50ZXIubWVyZ2Uobm9kZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU5vZGVzQW5kUmVsYXRpb25zaGlwcyhuLCByKSB7XG4gIHVwZGF0ZVJlbGF0aW9uc2hpcHMocik7XG4gIHVwZGF0ZU5vZGVzKG4pO1xuXG4gIHNpbXVsYXRpb24ubm9kZXMobm9kZXMpO1xuICBzaW11bGF0aW9uLmZvcmNlKCdsaW5rJykubGlua3MocmVsYXRpb25zaGlwcyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlbGF0aW9uc2hpcHMocikge1xuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShyZWxhdGlvbnNoaXBzLCByKTtcblxuICByZWxhdGlvbnNoaXAgPSBzdmdSZWxhdGlvbnNoaXBzLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCcpXG4gICAgLmRhdGEocmVsYXRpb25zaGlwcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZDsgfSk7XG5cbiAgdmFyIG91dGxpbmVTY2FsZSA9IGNyZWF0ZU91dGxpbmVTY2FsZShyZWxhdGlvbnNoaXBzKTtcbiAgdmFyIHJlbGF0aW9uc2hpcEVudGVyID0gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaChvdXRsaW5lU2NhbGUpO1xuXG4gIHJlbGF0aW9uc2hpcCA9IHJlbGF0aW9uc2hpcEVudGVyLnJlbGF0aW9uc2hpcC5tZXJnZShyZWxhdGlvbnNoaXApO1xuICByZWxhdGlvbnNoaXBPdXRsaW5lID0gc3ZnLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCAub3V0bGluZScpO1xuICByZWxhdGlvbnNoaXBPdXRsaW5lID0gcmVsYXRpb25zaGlwRW50ZXIub3V0bGluZS5tZXJnZShyZWxhdGlvbnNoaXBPdXRsaW5lKTtcblxuICByZWxhdGlvbnNoaXBPdmVybGF5ID0gc3ZnLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCAub3ZlcmxheScpO1xuICByZWxhdGlvbnNoaXBPdmVybGF5ID0gcmVsYXRpb25zaGlwRW50ZXIub3ZlcmxheS5tZXJnZShyZWxhdGlvbnNoaXBPdmVybGF5KTtcblxuICByZWxhdGlvbnNoaXBUZXh0ID0gc3ZnLnNlbGVjdEFsbCgnLnJlbGF0aW9uc2hpcCAudGV4dCcpO1xuICByZWxhdGlvbnNoaXBUZXh0ID0gcmVsYXRpb25zaGlwRW50ZXIudGV4dC5tZXJnZShyZWxhdGlvbnNoaXBUZXh0KTtcbn1cblxuXG5mdW5jdGlvbiB2ZXJzaW9uKCkge1xuICByZXR1cm4gVkVSU0lPTjtcbn1cblxuZnVuY3Rpb24gem9vbUZpdCh0cmFuc2l0aW9uRHVyYXRpb24pIHtcbiAgdmFyIGJvdW5kcyA9IHN2Zy5ub2RlKCkuZ2V0QkJveCgpLFxuICAgIHBhcmVudCA9IHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LFxuICAgIGZ1bGxXaWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aCxcbiAgICBmdWxsSGVpZ2h0ID0gcGFyZW50LmNsaWVudEhlaWdodCxcbiAgICB3aWR0aCA9IGJvdW5kcy53aWR0aCxcbiAgICBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0LFxuICAgIG1pZFggPSBib3VuZHMueCArIHdpZHRoIC8gMixcbiAgICBtaWRZID0gYm91bmRzLnkgKyBoZWlnaHQgLyAyO1xuXG4gIGlmICh3aWR0aCA9PT0gMCB8fCBoZWlnaHQgPT09IDApIHtcbiAgICByZXR1cm47IC8vIG5vdGhpbmcgdG8gZml0XG4gIH1cblxuICBzdmdTY2FsZSA9IDAuODUgLyBNYXRoLm1heCh3aWR0aCAvIGZ1bGxXaWR0aCwgaGVpZ2h0IC8gZnVsbEhlaWdodCk7XG4gIHN2Z1RyYW5zbGF0ZSA9IFtmdWxsV2lkdGggLyAyIC0gc3ZnU2NhbGUgKiBtaWRYLCBmdWxsSGVpZ2h0IC8gMiAtIHN2Z1NjYWxlICogbWlkWV07XG5cbiAgc3ZnLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHN2Z1RyYW5zbGF0ZVswXSArICcsICcgKyBzdmdUcmFuc2xhdGVbMV0gKyAnKSBzY2FsZSgnICsgc3ZnU2NhbGUgKyAnKScpO1xuICAvLyAgICAgICAgc21vb3RoVHJhbnNmb3JtKHN2Z1RyYW5zbGF0ZSwgc3ZnU2NhbGUpO1xufVxuXG5pbml0KF9zZWxlY3RvciwgX29wdGlvbnMpO1xuXG5yZXR1cm4ge1xuICBuZW80akRhdGFUb0QzRGF0YTogbmVvNGpEYXRhVG9EM0RhdGEsXG4gIHNpemU6IHNpemUsXG4gIHVwZGF0ZVdpdGhEM0RhdGE6IHVwZGF0ZVdpdGhEM0RhdGEsXG4gIHVwZGF0ZVdpdGhOZW80akRhdGE6IHVwZGF0ZVdpdGhOZW80akRhdGEsXG4gIHZlcnNpb246IHZlcnNpb25cbn07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTmVvNGpEMztcbiJdfQ==
