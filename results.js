var api_base = 'https://observatory.mami-project.eu/papi';

/**
 * findINJSON
 *  - query - query
 *  - what - what to look for
 *  - arr - where to place results
 *
 * searches through JSON
 */
function findInJSON(query, what, arr) {
  if(typeof(query) != 'object') return;
  var keys = Object.keys(query);
  for(var i = 0; i < keys.length; i++) {
    if(what == keys[i]) {
      arr.push(query[what]);
    }
    findInJSON(query[keys[i]], what, arr);
  }
}

/**
 * extractTimestamps
 *  - query - query
 *
 * Tries to extract timestamps from a query and convert
 * them to human readable strings
 */
function extractTimestamps(query) {
  var timestamps = [];
  findInJSON(query, 'time', timestamps);
  for(var i = 0; i < timestamps.length; i++) {
    if(Array.isArray(timestamps[i])) {
      timestamps[i] = timestamps[i][0];
      if(timestamps[i] != undefined)
        if(typeof(timestamps[i]) == 'number') {
          timestamps[i] = timestamps[i] + " : " + new Date(timestamps[i]*1000).toUTCString();
        }
    }
  }
  console.log('timestamps', timestamps);
  return timestamps;
}

/**
 * renderCounts
 *  - results - results
 *  - group_order - grouping of the query
 *  - distinct - distinct count or regular count?
 */
function renderCounts(results, group_order, distinct, iql) {
  if(!Array.isArray(group_order)) {
    console.log("group_order not an array");
    return;
  }

  if(results.length <= 0) {
    console.log("empty result set");
    return;
  }

  console.log('group_order', group_order);

  var counted_attribute = group_order[group_order.length-1].substring(1);
  var distinct_attribute = counted_attribute;

  var date_str = "";
  var cond_str = "";

  try {
    var params = extractQuery(iql);

    if('conditions' in params)
      cond_str = '(' + escapeHtml(params['conditions']) + '.*)';

    if('year_from' in params &&
       'year_to' in params &&
       'month_from' in params &&
       'month_to' in params) {
      date_str = '(' + params['month_from'] + ' ' + params['year_from'] +
                 ' - ' + params['month_to'] + ' ' + params['year_to'] + ')';
    }

    cond_str = '<span class="txt-small">' + cond_str + '</span>';
    date_str = '<span class="txt-small">' + date_str + '</span>';
      
  }
  catch(err) { console.log(err); }

  console.log('cond_str', cond_str);

  group_order.pop();

  if(distinct === true) {
    if(group_order.length >= 1)
      counted_attribute = group_order.pop().substring(1);
    else {
      renderTable(results, group_order);
      return;
    }
  }

  for(var i = 0; i < group_order.length; i++) {
    group_order[i] = group_order[i].substring(1);
  }

  var cols = Object.keys(results[0]);
  cols.sort();

  console.log('group_order', group_order);
  console.log('results.length', results.length);
  console.log('cols', cols);
  console.log('counted_attribute', counted_attribute);

  renderTable(results, group_order);

  if(group_order.length == 2) {
    var top_group_by = group_order[0];
    var bot_group_by = group_order[1];
    console.log('top_group_by', top_group_by);
    console.log('bot_group_by', bot_group_by);

    var top_groups = {};

    for(var i = 0; i < results.length; i++) {
      var k = results[i][top_group_by];

      if(k in top_groups) {
        top_groups[k].push(results[i]);
      }
      else
        top_groups[k] = [results[i]];
    }

    var top_group_keys = Object.keys(top_groups);
    top_group_keys.sort()
    console.log('top_group_keys', top_group_keys);

    if(top_group_keys.length > 16) //abort... too much stuff to render
      return;

    for(var i = 0; i < top_group_keys.length; i++) { 
      var results = top_groups[top_group_keys[i]];
      console.log('part_results', results);

      var groups = {};

      for(var j = 0; j < results.length; j++) {
        var k = results[j][bot_group_by];

        if(k in groups) {
          groups[k].push(results[j]);
        }
        else
          groups[k] = [results[j]];
      }

      console.log('part_groups', groups);

      var caption = attrNameToDisplay(top_group_by) + ' ' + top_group_keys[i];
      var title = "Counts of observations per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) + "</i> " + cond_str + " grouped by <i>" + escapeHtml(attrNameToDisplay(bot_group_by)) + "</i> " + date_str;

      if(distinct === true) {
        title = "Counts of distinct <i>" + escapeHtml(attrNameToDisplay(distinct_attribute)) + "s</i> per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) +
            "</i> grouped by <i>" + escapeHtml(attrNameToDisplay(bot_group_by)) + "</i> " + date_str;
      }

      renderHBarStacked(groups, title, counted_attribute);
    }
  }

  if(group_order.length >= 0) {

    var group_by = group_order[0];
    var groups = {};

    for(var i = 0; i < results.length; i++) {
      var k = results[i][group_by];

      if(k in groups) {
        groups[k].push(results[i]);
      }
      else
        groups[k] = [results[i]];
    }

    var group_keys = Object.keys(groups);
    //group_keys.sort();

    //for(var i = 0; i < group_keys.length; i++) {
    //  chart(groups[group_keys[i]], attrNameToDisplay(group_by) + ": " + group_keys[i], counted_attribute);
    //}
    if (group_order.length==1) {
      var title = "Counts of observations per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) + "</i> " + cond_str + " grouped by <i>" + escapeHtml(attrNameToDisplay(group_by)) + "</i> " + date_str;
      
      if(distinct === true) {
        title = "Counts of distinct <i>" + escapeHtml(attrNameToDisplay(distinct_attribute)) + "s</i> per <i>" + escapeHtml(attrNameToDisplay(counted_attribute))
              + "</i> grouped by <i>" + escapeHtml(attrNameToDisplay(group_by)) + "</i> " + date_str;
      }
    }
    else if (group_order.length==0) {
      if(distinct === true) {
        var title = "Counts of <i>" + escapeHtml(attrNameToDisplay(distinct_attribute)) + "</i> per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) + "</i> " + date_str;
      }
      else {
        var title = "Counts of observations per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) + "</i> " + cond_str + " " + date_str;
      }
    }

    

    renderHBarStacked(groups, title, counted_attribute);

  }
  else if(group_order.length == 0) {
    if(distinct === true) {
      renderHBar(results, "Counts of <i>" + escapeHtml(attrNameToDisplay(distinct_attribute)) + "</i> per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) + "</i> " + date_str, counted_attribute);
    }
    else {
      renderHBar(results, "Counts of observations per <i>" + escapeHtml(attrNameToDisplay(counted_attribute)) + "</i> " + cond_str + " " + date_str, counted_attribute);
    }
  }
}


function clearPreviousResults() {
  $('#tables').empty();
  $('#figures').empty();
  $('#raw_query').empty();
  $('#raw_results').empty();
  $('#results_msg').empty();
  $('#results_msg_top').empty();

  $('#table_section').css('display','none');
  $('#raw_results_section').css('display','none');
  $('#raw_query_section').css('display','none');
  $('#chart_section').css('display','none');
  $('#results_msg').css('display', 'none');
  $('#results_msg_top').css('display', 'none');
}


/**
 * renderResults
 *  - results - result set
 *  - query_id - query ID
 *
 * Renders the results
 */
function renderResults(results, query_id) {
  //$("body").css("cursor", "default");

  /** clear previously rendered stuff **/
  //clearPreviousResults();

  $('#results').css('display','block');
  $('#results_msg').css('display','block');
  //$('#results_msg_top').css('display','block');
  //$('#query_msg').css('display','none');

  //$("#runbutton").html("Run new query");
  //$('#runbutton').removeAttr("disabled");

  if(results['state'] != 'completed' && results['state'] != 'done') {
    $('#results_msg').empty().append('<span class="txt-warn">Your query is not completed yet. Please come back later!</span>');
    $('#results_msg').append('<br><br><span>This is your query ID: ' + encodeURIComponent(query_id) + '</span>');
    return;
  }

  var rawResultsDiv = document.getElementById('raw_results');
  var result = results['result'];
  $('#raw_results').append('<a href="' + api_base + '/result?download=y&id=' + encodeURIComponent(results['id']) + '">Download raw results</a>');
  var iql = results['iql'];
  $('#raw_query').append(JSON.stringify(iql));

  console.log('iql', JSON.stringify(iql));

  $('#raw_query_section').css('display','block');

  results = result['results'];

  var iql_ = JSON.parse(JSON.stringify(iql));

  if(!('query' in iql)) {
    return; //abort. something's more than fishy
  }

  var timestamps = extractTimestamps(iql);

  for(var i = 0; i < timestamps.length; i++) {
    if(i == 0)
     $('#raw_query').append('<br><br>----<br>Timestamps in this query:<br>');
    else
     $('#raw_query').append('<br>');
    $('#raw_query').append(timestamps[i]);
  }


  var query = iql['query'];
  var querytext = toEnglish(JSON.parse(JSON.stringify(iql)), "No english translation for your query available.");

  /** If possible try to extract form params back from the iql query **/
  try {
    var params = extractQuery(iql);

    fillForms(params);
    $('#qui').css('display','block');
  }
  catch(err) {}

  if('count' in query) {
      console.log('regular count');
      renderCounts(results, query['count'][0], false, iql_);
  }
  else if('count-distinct' in query) {
      console.log('distinct count');
      console.log('qq', JSON.stringify(query['count-distinct']));
      console.log('[0]', query['count-distinct'][0]);
      renderCounts(results, query['count-distinct'][0], true, iql_);
  }

  else if(results.length > 0) {
    table(results);
  }

  $('#results_msg_top').empty().append('<span class="txt-info"><a href=#results>Your results are visible below.</a></span> ');
  $('#results_msg_top').append('<br><br><span class="txt-small">Query ID: <a href="./qui.html?' + encodeURIComponent(query_id) + '">' + encodeURIComponent(query_id) + '</a></span>');

  try {
    console.log('iql', JSON.stringify(iql));
    $('#results_msg').append('<br><br><span class="txt-small">' + querytext + '</span><br>');
  }
  catch(err) { }

  if(results.length >= 4096) {
    $('#results_msg').append('<br><span class="txt-warn">You are viewing an incomplete result set because too many results were available!<span> ');
    $('#results_msg').append('<span class="txt-warn">Aggregations done by the UI will be incomplete!</span> ');
  }

  $("#results")[0].scrollIntoView();

  //$('#runbutton').prop('value', 'Run new query');
}




/**
 * fillForms
 *  - params
 *
 * Fill form fields (the ones with i_)
 */
function fillForms(params) {
  console.log(params);
  var keys = Object.keys(params);

  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = params[key];

    if(key.indexOf('time_') >= 0)
      value = new Date(value*1000).toUTCString();

    if(value.indexOf('@') == 0 || value.indexOf('$') == 0)
      value = value.substring(1);

    if(key == 'count' && value == 'observations')
      value = 'no';
    
    $('#i_' + key).val(value);
    console.log('#i_'+key, value);
  }

  disableDays(false);

  var have_source = false;
  var have_target = false;

  if('source' in params)
    if(params['source'] != '')
      have_source = true;

  if('target' in params)
    if(params['target'] != '')
      have_target = true;

  if(!have_source && !have_target) {
    togglebutton(['hideshow2', 'target','source', 'path_text'], true);
  }

  var have_group_by = false;

  if('group_by' in params)
    if(params['group_by'] != '')
      have_group_by = true;

  if(!have_group_by) {
    togglebutton(['hideshow3', 'group_by','then_by', 'group_text'], true);
  }

  console.log(have_source, have_target);
}


/**
 * showError
 * 
 * AJAX callback. Called on error
 */
function showError(xhr, status) {
  console.log('estatus',xhr.status);
  if(xhr.status == 404) {
    $('#results_msg').empty().append('<span class="txt-warn">The supplied result id could not be found in our database. Most likely the results expired and are no longer available. Please run a new query.</span>');
  }
  else {
    $('#results_msg').empty().append('<span class="txt-err">Downloading results from server failed! Please try later again. If you keep seeing this message please contact us.</span>');
  }
}

/**
 * renderTable
 *  - data - data
 *  - group_order - grouping
 *
 * Render the table
 */
function renderTable(data, group_order) {
  console.log('render_table');
  console.log('group_order', group_order);

  var grouped = (groupAll(data, group_order));

  var table = d3.select("#tables"); //.append("table").attr("class","");

  var cols = Object.keys(data[0]);

  var true_cols = [];
  for(var i = 0; i < cols.length; i++) {
    if(group_order.indexOf(cols[i]) < 0)
      true_cols.push(cols[i]);
  }

  true_cols.sort();

  console.log('true_cols', true_cols);
  var rows = [];
  toRows(grouped, rows, undefined, true_cols);
  console.log('rows', rows);


  var tbl = table.append("table");

  var hrow = tbl.append("tr");

  for(var i = 0; i < group_order.length; i++) {
    hrow.append("th").text(attrNameToDisplay(group_order[i]));
  }

  for(var i = 0; i < true_cols.length; i++) {
    hrow.append("th").text(attrNameToDisplay(true_cols[i]));
  }

  for(var i = 0; i < rows.length; i++) {
    var tr = tbl.append("tr");
    for(var j = 0; j < rows[i].length; j++) {
      var td = tr.append("td").attr("rowspan",rows[i][j]['rowspan']).text(rows[i][j]['value']);
    }
  }

  $('#table_section').css('display','block');
}

/**
 * calcRowSpan
 *  - data
 *
 * Calculate row span
 */
function calcRowSpan(data) {
  if($.isArray(data)) {
    return data.length;
  }
  else {
    var sum = 0;
    var group_keys = Object.keys(data);
    for(var i = 0; i < group_keys.length; i++) {
      sum += calcRowSpan(data[group_keys[i]]);
    }
    return sum;
  }
}

/**
 * toRows
 *  - data
 *  - rows
 *  - parent_row
 *  - cols - "true" columns not affected by row spans
 *
 * Convert data structure to html table structure with row spans
 */
function toRows(data, rows, parent_row, cols) {
  if($.isArray(data)) {
    if(data.length > 0) { 

      for(var i = 0; i < data.length; i++) {
        var row = [];
        if(i == 0 && parent_row != undefined) row = parent_row;
        for(var c = 0; c < cols.length; c++) {
          row.push({'value':data[i][cols[c]], 'rowspan':1});
        }
        if(i != 0 || parent_row == undefined) rows.push(row);
      }
    }
  }
  else {
    var group_keys = Object.keys(data);
    group_keys.sort();    

    if(group_keys.length > 0) {

      for(var i = 0; i < group_keys.length; i++) {
        if(i == 0)  {
          if(parent_row != undefined)
            parent_row.push({'value':group_keys[i], 'rowspan':calcRowSpan(data[group_keys[i]])});
          else {
            parent_row = [{'value':group_keys[i], 'rowspan':calcRowSpan(data[group_keys[i]])}];
            rows.push(parent_row);
          }

          toRows(data[group_keys[i]], rows, parent_row, cols);
        }
        else {
          var row = [{'value':group_keys[i], 'rowspan':calcRowSpan(data[group_keys[i]])}];
          rows.push(row);
          toRows(data[group_keys[i]], rows, row, cols);
        }
      }
    }
  }
}

/** DEPRECATED **/
function renderTableStructure(data, tbl, cols, lvl) {
  if($.isArray(data)) {
    console.log("got array");
    var table = tbl.append("table").attr("class","table").attr("style","margin: 1rem; margin-left: 2rem");

    var hrow = table.append("tr");

    for(var i = 0; i < cols.length; i++) {
      hrow.append("th").text(attrNameToDisplay(cols[i]));
    }

    for(var i = 0; i < data.length; i++) {
      var tr = table.append("tr");
      for(var j = 0; j < cols.length; j++) {
        tr.append("td").text(data[i][cols[j]]);
      }
    }
  }
  else {
    console.log("got not array");
    var group_keys = Object.keys(data);
    for(var i = 0; i < group_keys.length; i++) {
      var row_span = calcRowSpan(data[group_keys[i]]);
      var tr = tbl.append("div").attr("style","margin: 1rem; margin-left: 2rem;");
      tr.append("h"+lvl).text(group_keys[i]);
      var td = tr.append("div");
      renderTableStructure(data[group_keys[i]], td, cols, lvl+1);
    }
  }
}

/**
 * groupAll
 *  - data
 *  - bys
 *
 * Group data into a dict
 */
function groupAll(data, bys) {
  if(bys.length == 0)
    return data;

  var groups = group(data, bys[0]);
  var bys = bys.slice(1);

  var group_keys = Object.keys(groups);
  for(var i = 0; i < group_keys.length; i++) {
    groups[group_keys[i]] = groupAll(groups[group_keys[i]], bys);
  }

  return groups;
}

/** helper function for groupAll **/
function group(data, by) {
  var groups = {};
  for(var i = 0; i < data.length; i++) {
    var key = data[i][by];
    delete data[i][key];
    if(key in groups) {
      groups[key].push(data[i]);
    }
    else {
      groups[key] = [data[i]];
    }
  }

  return groups;
}

/** Simple table for ungrouped data **/
function table(data) {
  var table = d3.select("#tables").append("table").attr("class","table");

  var cols = Object.keys(data[0]);
  cols.sort();


  var hrow = table.append("tr");

  for(var i = 0; i < cols.length; i++) {
    hrow.append("th").text(function() { return attrNameToDisplay(cols[i]); });
  }

  var row = table.selectAll(".row").data(data).enter().append("tr");

  for(var i = 0; i < cols.length; i++) {
    row.append("td").text(function(d) { return d[cols[i]] });
  }

  $('#table_section').css('display','block');
}

/**
 * trimLongStr
 *  - str
 *  - max_len_
 * 
 * Trim long strings to max_len_ length
 * using ...
 */
function trimLongStr(str, max_len_) {
  if(str == null || str == undefined) return "";


  if(max_len_ == undefined)
    max_len_ = 30;

  str = str.toString();
  var max_len = max_len_;

  if(str.length > max_len) {
    if(str.indexOf("ecn.") >= 0) {
      parts = str.split(".");
      for(var i = 0; i < parts.length; i++) {
        parts[i] = trimLongStr(parts[i], Math.floor(max_len / parts.length));
      }
      return trimLongStr(parts.join("."), max_len - 1)
    }
  }


  if(str.length > max_len)
    return str.substring(0,max_len-2) + "...";
  return str;
}


/**
 * to_e
 *  - num
 *
 * Convert a number to e-notation
 */
function to_e(num) {
  if(num < 10000)
    return num;
  var lg = Math.floor(Math.log10(num));
  var b = num / (Math.pow(10,lg));
      b = Math.round(10*b)/10;
  return "" + b + "e" + lg;
}

/**
 * renderHBarStacked
 *  - groups - groups (data)
 *  - title - title of the graph
 *  - counted_attribute - the attribute that was counted
 *
 * render a stacked hbar chart
 */
function renderHBarStacked(groups, title, counted_attribute) {
  console.log('renderHBarStacked', groups, title, counted_attribute);

  var group_keys = Object.keys(groups);

  //if(group_keys.length > 16) //abort... too much to render
  //  return;

  //group_keys.sort()
  console.log('group_keys', group_keys);

  var max_overall = 0;
  var cols = [];
  var counted_total = {};

  for(var i = 0; i < group_keys.length; i++) {
    var data = groups[group_keys[i]];
    var temp = 0;
    for(var j = 0; j < data.length; j++) {
      temp += data[j]['count'];

      if(cols.indexOf(data[j][counted_attribute]) < 0)
        cols.push(data[j][counted_attribute]);

      if(data[j][counted_attribute] in counted_total) {
        counted_total[data[j][counted_attribute]] += data[j]['count'];
      }
      else {
        counted_total[data[j][counted_attribute]] = data[j]['count'];
      }
    }

    max_overall = d3.max([max_overall, temp]);
  }

  //if(cols.length > 16) //abort... too much to render
  //  return;

  //cols.sort();
  console.log('cols', cols);
  console.log('max_overall', max_overall);
  console.log('counted_total', counted_total);


  var n = cols.length, // The number of groups.
  m = group_keys.length; // The number of values per group.
  
  // The xz array has m elements, representing the x-values shared by all series.
  // The yz array has n elements, representing the y-values of each of the n series.
  // Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
  // The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.
  var xz = d3.range(m),
      yz = d3.range(n).map(function(i) { return values(i); }),
      y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
      yMax = d3.max(yz, function(y) { return d3.max(y); }),
      y1Max = d3.max(y01z, function(y) { return d3.max(y, function(d) { return d[1]; }); });
  
  var svg = d3.select("#chart-svg").attr("width", m*(m<=4?240:100)).attr("height", 300),
      margin = {top: ((m<=4?n:n/2)*20)+40, right: 10, bottom: 20, left: 10},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      console.log("margin", margin.top)
  
  var x = d3.scaleBand()
      .domain(xz)
      .rangeRound([0, width])
      .padding(0.08);

  var x_axis = d3.scaleBand()
      .domain(group_keys)
      .rangeRound([0, width])
      .padding(0.08);
  
  var y = d3.scaleLinear()
      .domain([0, y1Max])
      .range([height, 0]);
  
  var color = d3.scaleOrdinal()
      .domain(d3.range(n))
      .range(d3.schemeCategory20c);

  // add title
  d3.select("#title").html("<center>"+title+"</center>");
  // svg.append("text")
  // .attr("x", (width / 2))             
  // .attr("y", 15)
  // .attr("text-anchor", "middle")  
  // .style("font-size", "12px")  
  // .text(title);
  
  // add legend
  var lineheight = 15;
  var legend = svg.append("g");
  var offset_x = 0;
  var offset_y = 0;
  legend.attr("transform", "translate(0, 30)");
      
  for(var i = 0; i < cols.length; i++) {
    legend.append("rect").attr("y", offset_y).attr("x",offset_x + 0).attr("width", lineheight).attr("height", lineheight).attr("fill", color(i));
    legend.append("text").attr("x",offset_x + lineheight+5).attr("y", offset_y + lineheight /2).attr("dy", ".35em").text(cols[i] + " (" + counted_total[cols[i]] +")")
    .attr("style","font-size: 10px")
    .attr("fill", color(i));
    if (m <= 4) {
      offset_y += lineheight+5
    }
    else {
    offset_x += Math.floor(width / 2);
    if(i % 2 == 1) {
      offset_y += lineheight+5;
      offset_x = 0;
    }
    }
  }
  
  var series = g.selectAll(".series")
    .data(y01z)
    .enter().append("g")
      .attr("fill", function(d, i) { return color(i); });
  
  var rect = series.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("x", function(d, i) { return x(i); })
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0);
  
  rect.transition()
      .delay(function(d, i) { return i * 10; })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); });
      
  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x_axis)
          .tickSize(0)
          .tickPadding(6)
          .tickValues(group_keys));
  
  d3.select("#stacked")
      .on("change", changed);
  d3.select("#grouped")
      .on("change", changed);
  
  var timeout = d3.timeout(function() {
    d3.select("#grouped")
        .property("checked", true)
        .dispatch("change");
  }, 2000);
  
  function changed() {
    timeout.stop();
    if (this.value === "grouped") transitionGrouped();
    else transitionStacked();
  }
  
  function transitionGrouped() {
    y.domain([0, yMax]);
  
    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("x", function(d, i) { return x(i) + x.bandwidth() / n * this.parentNode.__data__.key; })
        .attr("width", x.bandwidth() / n)
      .transition()
        .attr("y", function(d) { return y(d[1] - d[0]); })
        .attr("height", function(d) { return y(0) - y(d[1] - d[0]); });
  }
  
  function transitionStacked() {
    y.domain([0, y1Max]);
  
    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .transition()
        .attr("x", function(d, i) { return x(i); })
        .attr("width", x.bandwidth());
  }
  
  // Returns all values for condition i
  function values(i) {
    var values = [];

    for(var j = 0; j < m; j++) {
      var data = groups[group_keys[j]];
      values[j] = data[i].count;
    }
  
    console.log('values',values);
  
    return values;
  }

  if (m<=4) $('#label_stacked').css('display','none');
  $('#chart_sec').css('display','block');









  /*var width = 720,
      barHeight = 20;

  var colors = ['salmon','steelblue','peru','mediumorchid','red','darkgray','green','orangered','magenta','maroon','blue','darkgreen','burlywood','indigo'];


  var x1 = d3.scaleLinear([0,max_overall]) //scale.linear()
 //     .domain([0, max_overall])
      .range([0, width-200]);

  var figure = d3.select("#figures").append("div").attr("class","figure");
  figure.append("div").attr("class","title").html("<center>"+title+"</center>").attr;

  // Height of legend in pixels, plus some spacing pixels
    var lheight = (5 + barHeight) * Math.ceil(cols.length/2) + 20
  var cheight = (5+barHeight) * (group_keys.length + 2 + Math.ceil((cols.length)/2));

  var chart = figure.append("svg")
      .attr("width", "80%")
      .attr("height", "auto")
      .attr("viewBox","0 0 " + width + " " + cheight);



  for(var i = 0; i < group_keys.length; i++) {
    var data = groups[group_keys[i]];

      var region = chart.append("g").attr("transform","translate(0," + (lheight + i*(5+barHeight)) + ")");
    
    // data.sort(function (a,b) { 
    //  if(a[counted_attribute] > b[counted_attribute]) return 1;
    //  if(a[counted_attribute] < b[counted_attribute]) return -1;
    //  return 0;
    // });

    console.log('data',data);

    var offset_x = 200;

    region.append("text")
      .attr("y", barHeight /2).attr("dy", ".35em").text(trimLongStr(group_keys[i], 25))
      .attr("style","font-size: 10px");

    for(var j = 0; j < data.length; j++) {
      region.append("rect")
      .attr("width", x1(data[j].count))
      .attr("height", barHeight)
      .attr("fill", colors[cols.indexOf(data[j][counted_attribute])])
      .attr("x", offset_x);
      offset_x += x1(data[j].count);
    }

    // offset_x = 200;

    // for(var j = 0; j < data.length; j++) {
    //   region.append("rect")
    //   .attr("width", 2)
    //   .attr("height", barHeight)
    //   .attr("fill","black")
    //   .attr("x", offset_x);
    //   offset_x += x(data[j].count);
    // }

    
    // if(offset_x > 200)
    //   region.append("rect")
    //     .attr("width", 2)
    //     .attr("height", barHeight)
    //     .attr("fill","black")
    //     .attr("x", offset_x-2);
  }

  var lines = chart.append("g")

  var footer = chart.append("g")
      .attr("transform", function() { return "translate(0," + (group_keys.length * (5+barHeight)) + ")"; });

    lines.append("rect").attr("width", 2).attr("height", (5+barHeight)*group_keys.length -5).attr("x",width-2).attr("y", lheight).attr("fill","black");
    footer.append("text").attr("x",200).attr("y", lheight + barHeight/2 - 1).attr("dy", "0em").text(function() { return "0"; }).attr("fill","black").attr("style","font-size: 10px; text-anchor: start;");

    lines.append("rect").attr("width", 2).attr("height", (5+barHeight)*group_keys.length -5).attr("x", 200).attr("y", lheight).attr("fill","black");
    footer.append("text").attr("x",width).attr("y", lheight + barHeight/2 - 1).attr("dy", "0em").text(function() { return max_overall + ""; }).attr("fill","black").attr("style","font-size: 10px; text-anchor: end;");

  var legend = chart.append("g");
    // Legend is moved to top.
    legend.attr("transform", "translate(0," + (0*(group_keys.length+1) * (5+barHeight)) + ")");

  offset_x = 0;
  offset_y = 0;

  for(var i = 0; i < cols.length; i++) {
    legend.append("rect").attr("y", offset_y).attr("x",offset_x + 0).attr("width", barHeight).attr("height", barHeight).attr("fill", colors[i]);
    legend.append("text").attr("x",offset_x + barHeight+5).attr("y", offset_y + barHeight /2).attr("dy", ".35em").text(trimLongStr(cols[i]) + " (" + to_e(counted_total[cols[i]]) +")")
     .attr("style","font-size: 10px")
     .attr("fill", colors[i]);
    offset_x += Math.floor(width / 2);
    if(i % 2 == 1) {
      offset_y += barHeight+5;
      offset_x = 0;
    }
  }

  
  $('#chart_section').css('display','block');*/
  
}

/**
 * renderHBar
 *  - data
 *  - title - title of the chart
 *  - counted_attribute - the attribute that was counted
 *
 * render an hbar chart
 */
function renderHBar(data, title, counted_attribute) {

  console.log('renderHBar',data);

  if(data.length > 16) //abort... too much stuff to render
    return;

  var counts = [];

  for(var i = 0; i < data.length; i++) 
    counts.push(data[i].count);

  var width = 720,
      barHeight = 30;

  var max_count = d3.max(counts);
  var sum_count = d3.sum(counts);

  var x = d3.scaleLinear([0,max_count])
       .range([0, width]);

  var figure = d3.select("#figures").append("div").attr("class","figure");
      figure.append("div").attr("class","title").html(title);

  var cheight = (5+barHeight) * (data.length + 1);

  var chart = figure.append("svg")
       .attr("width", "80%")
       .attr("height", 500)
       .attr("viewBox","0 0 " + width + " " + cheight);

  var bar = chart.selectAll(".bars")
       .data(data)
       .enter().append("g")
       .attr("transform", function(d, i) { return "translate(0," + i* (5+barHeight) + ")"; });

  bar.append("rect")
    .attr("width", function(d) { return x(d.count); })
    .attr("height", barHeight)
    .attr("fill",function(d) { return "salmon"; });

  bar.append("text")
    .attr("x", function(d) {
         if(x(d.count) > width/2)
           return x(d.count)-5;
         else
           return x(d.count)+5;
      })
    .attr("y", barHeight / 2)
    .attr("dy", ".35em")
    .attr("fill", function(d) {
        if(x(d.count) > width/2)
          return "white";
        else return "black";
      })
    .attr("style", function(d) {
        if(x(d.count) > width/2)
          return "font-family: monospace, monospace; font-size: 13px; text-anchor: end";
        else
          return "font-family: monospace, monospace; font-size: 13px; text-anchor: start";
      })
    .text(function(d) { return trimLongStr(d[counted_attribute]) + " [" + Math.round((100*d.count/sum_count)*10)/10 + "%]"; });



  var lines = chart.append("g");
  var footer = chart.append("g")
       .attr("transform", function() { return "translate(0," + (data.length * (5+barHeight)) + ")"; });

  lines.append("rect").attr("width", 2).attr("height", (5+barHeight)*data.length -5).attr("fill","black").attr("x",width-2);
  footer.append("text").attr("x",0).attr("y", barHeight /2).attr("dy", ".35em").text(function() { return "0"; }).attr("fill","black");

  lines.append("rect").attr("width", 2).attr("height", (5+barHeight)*data.length -5).attr("x", 0).attr("fill","black");
  footer.append("text").attr("x",width).attr("y", barHeight /2).attr("dy", ".35em").text(function() { return max_count + ""; }).attr("fill","black").attr("style","text-anchor: end;");

  $('#chart_section').css('display','block');
}
