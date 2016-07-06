from ptoweb import cache, app, get_uploads_collection, get_observations_collection
from flask import Response, g, request
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
  return Response(json.dumps(obj), status=200, mimetype='application/json')


@app.route('/api/')
def api_index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return json200({'status':'running'})


def from_comma_separated(data):
  if(data == None or data == ''):
    return []
  return list(map(lambda a: a.strip(), data.split(',')))

def from_colon_separated(data):
  if(data == None or data == ''):
    return []
  return list(map(lambda a: a.strip(), data.split(':')))


@app.route('/api/advanced')
def api_advanced():

  observations = get_observations_collection()

  on_path = from_comma_separated(request.args.get('on_path'))

  if(len(on_path) == 0):
    on_path_match = {}
  else:
    on_path_match = {'path' : {'$in' : on_path}}

  condition_criterias = from_comma_separated(request.args.get('condition_criterias'))

  condition_matches_must = []

  for condition_criterion in condition_criterias:
    parts = from_colon_separated(condition_criterion)
    print(parts)

    if(parts[0] == 'must'):
      operator = parts[1]
      cond_name = parts[2]
      cond_value = parts[3]
      if(operator == '?'):
        condition_matches_must.append({'$match' : {'conditions' : cond_name}})



  pipeline = [
     {'$match' : on_path_match}]

  pipeline += condition_matches_must

  pipeline += [
     {'$project' : {'_id' : 0, 'path' : 1, 'conditions' : 1,
                    
       }},
   ]

  results = []
  count = 0
  for e in observations.aggregate(pipeline):
    count += 1
    if(count <= 10):
      results.append(e)

  print(count)

  return json200({'count' : count, 'results' : results})


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
