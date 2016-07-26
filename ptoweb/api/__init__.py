from ptoweb import cache, app, get_uploads_collection, get_observations_collection, from_comma_separated, from_colon_separated, get_obversations_collection_pre_grouped
from flask import Response, g, request
from bson import json_util
import json
from ptoweb.api.auth import require_auth
import re


def condition_exists(name):

  if name in enumerate_conditions():
    return True
  else:
    return False


def enumerate_conditions():

  dic = get_from_cache('all_conditions')
  if(dic != None):
    return dic
  
  observations = get_observations_collection()
  conditions = observations.aggregate([{'$unwind' : '$conditions'} , {'$group' : { '_id' : "$conditions"}}])
  dic = {}
  for condition in conditions:
    dic[condition['_id']] = True
  
  put_to_cache('all_conditions', dic)

  return dic


def get_from_cache(key):
  return cache.get(key)


def put_to_cache(key, value):
  cache.set(key, value, timeout = (app.config['CACHE_TIMEOUT']))


def json200(obj):
  return Response(json.dumps(obj, default=json_util.default), status=200, mimetype='application/json')


@app.route('/api/')
def api_index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return json200({'status':'running'})


@app.route('/api/refresh')
@require_auth
def api_refresh():
  observations = get_observations_collection()

  pipeline = [
     {'$match' : {'action_ids.0.valid' : True}},
     {'$project' : {'_id' : 1, 'path' : 1, 'conditions' : 1,
                    'time' : 1, 'value' : 1, 'analyzer_id' : 1, 
                    'dip' : { '$arrayElemAt' : ['$path', -1]},
                    'sip' : { '$arrayElemAt' : ['$path',  0]}
       }},
     {'$group': {'_id' : '$path', 'sip' : {'$first' : '$sip'}, 'dip' : {'$first' : '$dip'}, 'observations': 
           {'$addToSet': {'analyzer' : '$analyzer_id', 'conditions': '$conditions', 'time': '$time', 'value': '$value', 'path': '$path'}}}},
     {'$project' : {'_id' : 0, 'path' : '$_id', 'observations' : 1, 'dip' : 1, 'sip' : 1}},
     {'$out' : 'observations_web'}
    ]

  print(pipeline)

  observations.aggregate(pipeline, allowDiskUse = True)

  return json200({'ok' : True})

def to_int(value):
  try:
    return int(value, 10)
  except:
    return 0


@app.route('/api/advanced')
def api_advanced():

  observations = get_obversations_collection_pre_grouped()

  on_path = from_comma_separated(request.args.get('on_path'))
  sip = from_comma_separated(request.args.get('sip'))
  dip = from_comma_separated(request.args.get('dip'))

  page_num = to_int(request.args.get('page_num'))

  cache_key = "/api/advanced/max"
  max_path_count = get_from_cache(cache_key)
  if(max_path_count == None):
    max_path_count = observations.count()
    put_to_cache(cache_key, max_path_count)

  if(len(on_path) == 0):
    on_path_match = {}
  else:
    on_path_match = {'path' : {'$in' : on_path}}

  if(len(sip) == 0):
    sip_match = {}
  else:
    sip_match = {'sip' : {'$in' : sip}}

  if(len(dip) == 0):
    dip_match = {}
  else:
    dip_match = {'dip' : {'$in' : dip}}

  condition_criteria = from_comma_separated(request.args.get('condition_criteria'))

  condition_matches_must = []
  or_filter = []

  for condition_criterion in condition_criteria:
    parts = from_colon_separated(condition_criterion)
    print(parts)

    if(parts[0] == 'must'):
      operator = parts[1]
      cond_name = parts[2]
      cond_value = parts[3]

      if(len(cond_name) < 2):
        continue;

      if(operator == '?'):
        condition_matches_must.append({'observations.conditions' : cond_name})
      or_filter.append({'conditions' : cond_name})


  matches = {}

  if(dip_match != {}):
    matches.update(dip_match)
  if(sip_match != {}):
    matches.update(sip_match)
  if(on_path_match != {}):
    matches.update(on_path_match)
  
  for condition_match_must in condition_matches_must:
    matches.update(condition_match_must)

  

  print(matches)

  results = []
  count = 0
  results = list(observations.find(matches).skip(page_num*10).limit(10))
  count = observations.count(matches)

  print(count)

  return json200({'count' : count, 'results' : results, 'max' : max_path_count})


@app.route('/api/conditions_total')
def api_conditions_total():

  observations = get_observations_collection()

  conditions = list(map(lambda a: a.strip(), request.args.get('name').split(',')))
  
  conditions_filtered = []

  non_existing = []

  for condition in conditions:
    if not condition_exists(condition):
      non_existing.append({'_id' : condition, 'count' : -1})
    else:
      conditions_filtered.append(condition)

  conditions_filtered = sorted(conditions_filtered)
    

  cache_key = '/api/conditions_total/' + ','.join(conditions_filtered)

  result = get_from_cache(cache_key)
  if result != None:
    return json200(result + non_existing)

  pipeline = [
    {'$match' : {'action_ids.0.valid' : True}},
    {'$unwind' :'$conditions'}, 
    {'$match' : {'conditions' : {'$in' : conditions_filtered}}},
    {'$group' : {'_id' : '$conditions', 'count': {'$sum' : 1}}},
    {'$sort' : {'count' : -1}}
   ]

  result = list(observations.aggregate(pipeline))
  put_to_cache(cache_key, result)

  return json200(result + non_existing)


@app.route('/api/conditions')
def api_conditions():
  """
  Path: /api/conditions

  Retrieve statistics about how many times a condition was observed on a path
  (currently: an endpoint).
  """

  dip = request.args.get('dip')
  sip = request.args.get('sip')

  cache_key = '/api/conditions/' + dip + '/' + sip

  result = get_from_cache(cache_key)
  if result != None:
    return json200(result)
  
  uploads = get_observations_collection()

  sip_match = {}

  if(sip != None and sip != ''):
    sip_match = {'sip' : sip}

  pipeline = [
      {'$match' : {'action_ids.0.valid' : True}},
      {'$match' : {'path' : dip}},
      {'$unwind' : '$conditions'}, 
      {'$project' : {'_id' : 1, 'conditions' : 1, 'sip' : { '$arrayElemAt': ['$path',0] },
                     'dip' : { '$arrayElemAt' : ['$path', -1]}}},
      {'$match' : sip_match},
      {'$match' : {'dip': dip}},
      {'$group' : {'_id' : { 'condition' : '$conditions', 'dip' : '$dip'}, 'count' : {'$sum' : 1}}},
      {'$group' : {'_id' : '$_id.dip', 'data' : {'$addToSet' : { 'condition' : '$_id.condition', 'count' : '$count'}}}}
    ]

  result = list(uploads.aggregate(pipeline, allowDiskUse = True))
  put_to_cache(cache_key, result)

  return json200(result)


@app.route('/api/uploadstats')
def api_upload_statistics():
  """
  Path: /api/uploadstats

  Retrieve basic statistics about uploads.
  """

  uploads = get_uploads_collection()

  total = uploads.count({})

  pipeline = [{ '$group' : { '_id' : '$meta.msmntCampaign', 'count' : { '$sum' : 1 }}},
              { '$match' : { 'count' : { '$gt' : 1000 }}},
              { '$sort' : { '_id' : 1 }}]

  msmnt_campaigns = list(uploads.aggregate(pipeline))


  js = {'total' : total, 'msmntCampaigns' : msmnt_campaigns}

  return json200(js)
