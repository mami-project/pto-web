/**
 * build iql query and submit it to query queue
 */
function runQuery() {

  var conditions = $("#i_conditions").val();
  var group_by = $("#i_group_by").val();
  var then_by = $("#i_then_by").val();
  //var time_from = $("#i_time_from").val();
  //var time_to = $("#i_time_to").val();
  var count = $("#i_count").val();
  var per = $('#i_per').val();
  var source = $('#i_source').val();
  var target = $('#i_target').val();
  

  //var source_type = $("input[name='source']:checked"); 
  //if (source_type.length > 0) source = $('#i_source_'+source_type.val()).val();
  //var target_type = $("input[name='target']:checked");
  //if (target_type.length > 0) target = $('#i_target_'+target_type.val()).val();

  
  var time_from = $("#i_day_from").val() + " " + $("#i_month_from").val() + " " + $("#i_year_from").val() + " 00:00:00 GMT";
  var time_to = $("#i_day_to").val() + " " + $("#i_month_to").val() + " " + $("#i_year_to").val() + " 23:59:59 GMT";

  var sources = source.split(',');
  var targets = target.split(',');

  if(source == "") sources = [];
  if(target == "") targets = [];

  for(var i = 0; i < sources.length; i++)
    sources[i] = sources[i].trim();

  for(var i = 0; i < targets.length; i++)
    targets[i] = targets[i].trim();

  if(count == 'no_') {
    if(group_by != "no" || then_by != "no" || per != "no") {
      $('#query_msg').empty().append('You chose to not count anything. In this case you can not have any grouping/per set!');
      return;
    }
  }


//   if((time_from != "" && isNaN(toDate(time_from))) || (time_to != "" && isNaN(toDate(time_to)))) {
//     $("#query_msg").empty().append('time_to or time_from contain invalid input. Please correct them!');
//     $("#query_msg").append(time_from);
//     return;
//   }

  if(group_by == "no" && then_by != "no") {
    $("#query_msg").empty().append("Can't not group and then group. Please correct grouping!");
    return;
  }

  if(per == 'no' && (group_by != "no" || then_by != "no")) {
    $("#query_msg").empty().append("Group by/then by specified but nothing for per. The group order must be per -> group by -> then by");
    return;
  }

  console.log("conditions",conditions);
  console.log("group_by", group_by);
  console.log("time_from", time_from);
  console.log("time_to", time_to);
  console.log("count", count);

  var all_conditions = [
    {"path":["ecn","connectivity","works"],"id":2},
    {"path":["ecn","connectivity","broken"],"id":3},
    {"path":["ecn","connectivity","offline"],"id":5},
    {"path":["ecn","connectivity","transient"],"id":4},
    {"path":["ecn","connectivity","super","works"],"id":-1},
    {"path":["ecn","connectivity","super","broken"],"id":-1},
    {"path":["ecn","connectivity","super","offline"],"id":-1},
    {"path":["ecn","connectivity","super","transient"],"id":-1},
    {"path":["ecn","connectivity","super","weird"],"id":-1},
    {"path":["ecn","negotiation_attempt","succeeded"],"id":7},
    {"path":["ecn","negotiation_attempt","failed"],"id":8},
    {"path":["ecn","ipmark","ect_one","seen"],"id":-1},
    {"path":["ecn","ipmark","ect_zero","seen"],"id":-1},
    {"path":["ecn","ipmark","ce","seen"],"id":-1},
    {"path":["ecn","site_dependent","strict"],"id":-1},
    {"path":["ecn","site_dependent","strong"],"id":-1},
    {"path":["ecn","site_dependent","weak"],"id":-1},
    {"path":["ecn","path_dependent","strict"],"id":-1},
    {"path":["ecn","path_dependent","strong"],"id":-1},
    {"path":["ecn","path_dependent","weak"],"id":-1},
  ];

  var condition_ = conditions.split(".");
  console.log('condition_', condition_);

  var related_conditions = [];
  
  for(var i = 0; i < all_conditions.length; i++) {
    var other_condition = all_conditions[i];
    if( (other_condition['path'].length - condition_.length) != 1)
      continue; //skip because it's not related

    if(is_prefix(condition_, other_condition['path'])) {
      related_conditions.push(other_condition['path'].join('.'));
      console.log('related condition', other_condition);
    }
  }

  console.log('related_conditions',related_conditions);

  var iql_condition_parts = [];

  for(var i = 0; i < related_conditions.length; i++) {
    iql_condition_parts.push(related_conditions[i]);
  }

  console.log('iql_condition_parts', JSON.stringify(iql_condition_parts));

  iql_time_parts = [];

  if(time_from != "")
    iql_time_parts.push({"ge":["@time_from",{"time":[toDate(time_from)]}]});
  else
    iql_time_parts.push({"ge":["@time_from",{"time":[0]}]});

  if(time_to != "")
    iql_time_parts.push({"le":["@time_to",{"time":[toDate(time_to)]}]});
  else
    iql_time_parts.push({"le":["@time_to",{"time":[Math.floor(new Date("31 Dec 2037 23:59:59 GMT").getTime()/1000)]}]});

  var exp_ = {"in":["@name",iql_condition_parts]};

  if(iql_time_parts.length == 0) {
    exp_ = exp_;
  }
  else if(iql_time_parts.length == 1) {
    exp_ = {"and":[exp_,iql_time_parts[0]]};
  }
  else if(iql_time_parts.length == 2) {
    exp_ = {"and":[exp_,iql_time_parts[0],iql_time_parts[1]]};
  }

  if(targets.length > 0)
    exp_['and'].push({'in':['@target', targets]});

  if(sources.length > 0)
    exp_['and'].push({'in':['@source', sources]});

  var iql_count_parts = [];
  var query = {};

  if(group_by != 'no') {
    iql_count_parts.push('@'+group_by);
  }
  if(then_by != 'no') {
    iql_count_parts.push('@'+then_by);
  }
  if(per != 'no') {
    iql_count_parts.push('@'+per);
  }

  if(count != 'no_') { //agreggation?
    if(count == 'no') { // no distinct counting
      if(group_by == 'no' && then_by == 'no' && per == 'no') { //absolutely no grouping
        query = {"query":{"count":[{"simple":[exp_]}]}};
      }
      else {
        query = {"query":{"count":[iql_count_parts,{"simple":[exp_]},"asc"]}};
      }
    }
    else {
      iql_count_parts.push('@'+count);
      query = {"query":{"count-distinct":[iql_count_parts,{"simple":[exp_]},"asc"]}};
    }
  } else { // count == no_ means absolutely no aggregation
    query = {"query":{"all":[{"simple":[exp_]}]}};
  }
  
  var str_query = JSON.stringify(query);

  var url = api_base + '/query?q=' + encodeURIComponent(str_query);

  console.log('str_query',str_query);

  $("body").css("cursor", "progress");
  //$('#runquerybutton').attr('disabled', true);

  //clearPreviousResults();

  var request = $.ajax({'url': url});
  request.done(process_successful_response);
  request.fail(process_failed_response); 
}


/**
 * getResults
 *  - id - query id
 *
 * Make an AJAX request to the API to download the results
 */
function getResults(id) {
  var request = 
    $.ajax(
      {'url' : api_base + '/result?id=' + encodeURIComponent(id)})
     .done(function(data) { renderResults(data, id) })
     .fail(showError);
}

/**
 * process_successful_response
 *
 * AJAX callback
 * called on success
 */
function process_successful_response(data) {

  var id = encodeURIComponent(data['query_id']);

  $("body").css("cursor", "default");
  //clearPreviousResults();
  console.log(JSON.stringify(data));
  $('#querysucess').show();
  //document.getElementById("queryfailed").style.display = "block";
  if("already" in data) {
    //renderResults(data['already'], data['query_id']);
    $('#showresults').show();
    $('#showresults').attr("href","queryreply.html?" + id);
    console.log("queryreply.html?" + id);
  }
  else {
    $('#gotoqueryqueue').show();
    $('#queryidlink').html(api_base + "queryreply.html?" + id)
    //window.setTimeout( function() { getResults(data['query_id']); }, 8000);
  }
}

/**
 * process_failed_response
 *
 * AJAX callback
 * called on failure
 */
function process_failed_response(data) {
  $("body").css("cursor", "default");
  $('#queryfailed').show();

  //clearPreviousResults();
  //alert('Your query could not be submitted. This is either a network error or the server is too busy right now.');
  console.log(JSON.stringify(data));
  //$('#runbutton').removeAttr("disabled");
}

/**
 * process_successful_response_redirect
 *
 * AJAX callback
 * called on success. from the simple page
 */
function process_successful_response_redirect(data) {
  clearPreviousResults();
  console.log(JSON.stringify(data));
  window.location.href = './queryreply.html?' + encodeURIComponent(data['query_id']);
}

/**
 * is_prefix
 *  - xs
 *  - ys
 *
 * Returns true if xs is a prefix of ys
 */
function is_prefix(xs, ys) {
  if (xs.length > ys.length) {
    return false;
  }

  for(var i = 0; i < xs.length; i++) {
    if(xs[i] != ys[i])
      return false;
  }

  return true;
}

/**
 * toDate
 *  date_s - date as string
 *
 * convert to unix timestamp
 */
function toDate(date_s) {

  date_s = date_s.replace("start","00:00:00 GMT+0000");
  date_s = date_s.replace("end","23:59:59 GMT+0000");

  var t_ms = Date.parse(date_s);
  if(isNaN(t_ms)) {
    return t_ms;
  }

  return Math.floor(t_ms / 1000);
}

