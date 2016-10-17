from ptoweb import cache, app, get_uploads_collection, get_observations_collection, from_comma_separated, from_colon_separated, get_obversations_collection_pre_grouped
from flask import Response, g, request
from bson import json_util
import json
from ptoweb.api.auth import require_auth
import re
from datetime import datetime
import pymongo.errors
from collections import OrderedDict
from bson.objectid import ObjectId


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


def cors(resp):
  resp.headers['Access-Control-Allow-Origin'] = '*'
  return resp

def json200(obj):
  return cors(Response(json.dumps(obj, default=json_util.default), status=200, mimetype='application/json'))

def json400(obj):
  return cors(Response(json.dumps(obj, default=json_util.default), status=400, mimetype='application/json'))

def json404(obj):
  return cors(Response(json.dumps(obj, default=json_util.default), status=404, mimetype='application/json'))


@app.route('/api/')
def api_index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return json200({'status':'running'})


def to_int(value):
  try:
    return int(value, 10)
  except:
    return 0

@app.route('/api/all_conditions')
def api_all_conditions():
  """
  Path: /api/all_conditions
  
  Returns a dictionary of all conditions. 
  Slow, uses cache.
  """

  return json200({'conditions': enumerate_conditions()})


@app.route('/api/uploadstats')
def api_upload_statistics():
  """
  Path: /api/uploadstats

  Retrieve basic statistics about uploads.
  """

  cache_key = '/api/uploadstats'

  js = get_from_cache(cache_key)

  if(js != None):
    return json200(js)

  uploads = get_uploads_collection()

  total = uploads.count({})

  pipeline = [{ '$group' : { '_id' : '$meta.msmntCampaign', 'count' : { '$sum' : 1 }}},
              { '$match' : { 'count' : { '$gt' : 1000 }}},
              { '$sort' : { '_id' : 1 }}]

  msmnt_campaigns = list(uploads.aggregate(pipeline))


  js = {'total' : total, 'msmntCampaigns' : msmnt_campaigns}
  put_to_cache(cache_key, js)

  return json200(js)


@app.route('/api/raw/single')
def api_raw_single():
  """
  Path: /api/raw/single

  Arguments: /api/raw/single?oid=<oid>

    oid: ID of the observation.

  Returns a single raw observation. 
  """

  try:
    oid = request.args.get('oid')
    oid = ObjectId(oid)
  except:
    return json400({'count' : 0, 'results' : [], 'err' : 'Invalid id.'})


  query = {'$match' : {'_id' : oid}}

  observations = get_observations_collection()
  uploads = get_uploads_collection()
  
  try:
    results = list(observations.aggregate([query], maxTimeMS = 5000))

    if(len(results) != 1):
      return json404({'err': 'Not found.'})

    result = results[0] 

    all_upload_entries = []

    print(result)

    for source in result['sources']:
      if 'upl' in source:
        act_id = to_int(source['upl'])
        upload_entries = list(uploads.find({'action_id.ptodev1' : act_id}))
        if(len(upload_entries) < 1): continue
        all_upload_entries.append(upload_entries[0]['meta'])

    result['uploads'] = all_upload_entries
    result['analyzer'] = result['analyzer_id']
    del result['analyzer_id']

    print(all_upload_entries)

    return json200({'result' : result})

  except pymongo.errors.ExecutionTimeout:
    return json400({'result' : None, 'err' : 'Timeout.'})


@app.route('/api/paths')
def api_paths():
  """
  Path: /api/paths

  Arguments: /api/conditions/?from=<time.from>&to=<time.to>&n=<n>

    time.from:  Time window `from`.
    time.to:    Time window `to`.
    n:          Limit query to n observations only.

  Returns all paths and the number of occurences in the specified time window.
  """

  n = to_int(request.args.get('n'))
  time_from = to_int(request.args.get('from'))
  time_to = to_int(request.args.get('to'))

  if(time_from == 0 and time_to == 0):
    time_to = 1567204529149

  time_from = datetime.utcfromtimestamp(time_from / 1000.0)
  time_to = datetime.utcfromtimestamp(time_to / 1000.0)

  if(n <= 0):
    n = 4096
  elif(n >= 8192):
    n = 8192

  
  pipeline = []
  

  pre_matches = {
     '$match' : {'action_ids.0.valid' : True,
                 'time.from' : {'$gte' : time_from}, 
                 'time.to' : {'$lte' : time_to}, 
                }
    }

  pipeline += [
    pre_matches,
    {'$limit' : n},
    {'$group' : {'_id' : '$path', 'count' : {'$sum' : 1}}},
    {'$project' : {'_id' : 0, 'path' : '$_id', 'count' : 1}}
  ]

  observations = get_observations_collection()

  try:
    results = list(observations.aggregate(pipeline, allowDiskUse=True, maxTimeMS = 5000))
    return json200({'results' : results, 'count' : len(results)})

  except pymongo.errors.ExecutionTimeout:
    return json400({'count' : 0, 'results' : [], 'err' : 'Timeout.'})
  

@app.route('/api/conditions')
def api_conditions():
  """
  Path: /api/conditions

  Arguments: See api_raw_observations()

  Returns how many times a condition is present.
  """

  pipeline = get_pipeline(add_skip_limit = False, force_n = 65536)

  pipeline += [
    {'$unwind' : '$conditions'},
    {'$group' : {'_id' : '$conditions', 'count' : {'$sum' : 1}}},
    {'$project' : {'_id' : 0, 'count' : 1, 'condition' : '$_id'}}
  ]

  observations = get_observations_collection()

  try:
    results = list(observations.aggregate(pipeline, allowDiskUse=True, maxTimeMS = 5000))
    return json200({'results' : results, 'count' : len(results)})

  except pymongo.errors.ExecutionTimeout:
    return json400({'count' : 0, 'results' : [], 'err' : 'Timeout.'})



@app.route('/api/raw/count')
def api_raw_count():
  """
  Path: /api/raw/count

  Arguments: See api_raw_observations()

  Returns how many observations match.
  """

  pipeline = get_pipeline()

  pipeline += [{'$group' : {'_id' : 1, 'count' : {'$sum' : 1}}}]

  observations = get_observations_collection()

  try:
    result = list(observations.aggregate(pipeline, allowDiskUse=True, maxTimeMS = 5000))
    return json200({'count' : result[0]['count']})

  except pymongo.errors.ExecutionTimeout:
    return json400({'count' : -1, 'err' : 'Timeout.'})


def get_pipeline(add_skip_limit = True, force_n = 0, group = False):
  conditions_all = from_comma_separated(request.args.get('conditions'))
  limit = to_int(request.args.get('limit'))
  skip = to_int(request.args.get('skip'))
  sips = from_comma_separated(request.args.get('sip'))
  dips = from_comma_separated(request.args.get('dip'))
  path = from_comma_separated(request.args.get('path'))
  on_path = from_comma_separated(request.args.get('on_path'))
  on_path_all = from_comma_separated(request.args.get('on_path_all'))
  n = to_int(request.args.get('n'))

  time_from = to_int(request.args.get('from'))
  time_to = to_int(request.args.get('to'))

  if(time_from == 0 and time_to == 0):
    time_to = 1567204529149

  time_from = datetime.utcfromtimestamp(time_from / 1000.0)
  time_to = datetime.utcfromtimestamp(time_to / 1000.0)

  if(limit <= 0):
    limit = 4096
  elif(limit >= 8192):
    limit = 8192

  if(n > 65536):
    n = 65536

  if(force_n != 0):
    n = force_n

  filters = []

  for conditions_e in conditions_all:
    conditions = from_colon_separated(conditions_e)

    # If we group, the conditions will be in 'observations.conditions'
    if(not group):
      filters.append({'conditions' : {'$all' : conditions}})
    else:
      filters.append({'observations.conditions' : {'$all' : conditions}})

  sip_filter = {}
  dip_filter = {}

  ips = []

  if(len(sips) > 0):
    sip_filter = {'sip' : {'$in' : sips}}

  if(len(dips) > 0):
    dip_filter = {'dip' : {'$in' : dips}}

  for sip in sips: ips.append(sip)
  for dip in dips: ips.append(dip)
  for ip in on_path: ips.append(ip)
  for ip in on_path_all: ips.append(ip)


  pipeline = []
  

  pre_matches = {
     '$match' : {'action_ids.0.valid' : True,
                 'time.from' : {'$gte' : time_from}, 
                 'time.to' : {'$lte' : time_to}, 
                }
    }

  # If we group we need to put this match AFTER the group stage
  if(len(filters) > 0 and (not group)):
    pre_matches['$match']['$or'] = filters

  if(len(ips) > 0):
    pre_matches['$match']['path'] = ips[-1]

  if(len(path) > 0):
    pre_matches['$match']['path'] = path[-1]


  pipeline += [
    pre_matches
  ]

  if(len(ips) > 0):
    pipeline += [{'$match' : {'path' : {'$in' : ips}}}]

  if(len(path) > 0):
    pipeline += [{'$match' : {'path' : path}}]

  if(len(on_path_all) > 0):
    pipeline += [{'$match' : {'path' : {'$all' : on_path_all}}}]

  pipeline += [
    {'$project' : {'_id' : 0, 'id' : '$_id', 'path' : 1, 'conditions' : 1,
                    'time' : 1, 'value' : 1, 'analyzer' : '$analyzer_id', 
                    'dip' : { '$arrayElemAt' : ['$path', -1]},
                    'sip' : { '$arrayElemAt' : ['$path',  0]},
                    'hash' : 1, 'sources' : 1, 'action_ids' : 1
       }},
    {'$match' : dip_filter},
    {'$match' : sip_filter}
  ]

  # If we group we need to skip, limit later
  if(add_skip_limit and (not group)):
    pipeline += [
      {'$skip' : skip},
      {'$limit' : limit},
    ]

  # Internal safe-guard document limit :D
  if(n > 0):
    pipeline += [{'$limit' : n}]

  # If group => group
  if(group):
    pipeline += [
      {'$group': {'_id' : '$path', 'sip' : {'$first' : '$sip'}, 'dip' : {'$first' : '$dip'}, 'observations': 
           {'$addToSet': {'id' : '$id', 'analyzer' : '$analyzer', 'conditions': '$conditions', 'time': '$time', 'value': '$value', 'path': '$path', 'sources' : '$sources'}}}},
      {'$project' : {'_id' : 0, 'sip' : 1, 'dip' : 1, 'observations' : 1, 'path' : 1}}]

    if(len(filters) > 0):
      pipeline += [{'$match' : {'$or' : filters}}]

    if(add_skip_limit):
      pipeline += [
        {'$skip' : skip},
        {'$limit' : limit},
      ]

  return pipeline


@app.route('/api/raw/observations')
def api_raw_observations_conditions():
  """
  Path: /api/raw/observations

  Arguments: /api/raw/observations/?path=<path>&conditions=<conditions>
               &from=<time.from>&to=<time.to>&sip=<sip>&dip=<dip>&limit=<limit>&skip=<skip>
               &on_path=<on_path>&on_path_all=<on_path_all>

    conditions: Conditions comma separated, then colon separated. Colon separated
                conditions will be ANDed and comma separated conditions will be ORed.
                That is: a,b:c,d is (a OR (b AND c) OR d).
    time.from:  Time window `from`.
    time.to:    Time window `to`.
    skip:       How many results to skip.
    limit:      How many results to return.
    sip:        Startpoints (comma separated)
    dip:        Endpoints (comma separated)
    path:       An exact path. Don't use sip/dip together with path. 
    on_path:    Any of these on the path.
    on_path_all:All of these on the path.
  
   Note: dip and sip are ANDed!

  Returns raw observations. No grouping done.
  """

  pipeline = get_pipeline()

  print(pipeline)

  observations = get_observations_collection()

  try:
    results = list(observations.aggregate(pipeline, allowDiskUse=True, maxTimeMS = 5000))
    return json200({'results' : results, 'count' : len(results)})

  except pymongo.errors.ExecutionTimeout:
    return json400({'count' : 0, 'results' : [], 'err' : 'Timeout.'})



@app.route('/api/observations')
def api_observations_conditions():
  """
  Path: /api/observations

  Arguments: See api_raw_observations()

   Returns observations grouped by path!
  """

  pipeline = get_pipeline(add_skip_limit = True, force_n = 65536, group = True)
  

  print(pipeline)

  observations = get_observations_collection()

  try:
    results = list(observations.aggregate(pipeline, allowDiskUse=True, maxTimeMS = 5000))
    return json200({'results' : results, 'count' : len(results)})

  except pymongo.errors.ExecutionTimeout:
    return json400({'count' : 0, 'results' : [], 'err' : 'Timeout.'})

