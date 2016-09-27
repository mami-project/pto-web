from ptoweb import cache, app, get_uploads_collection, get_observations_collection, from_comma_separated, from_colon_separated, get_obversations_collection_pre_grouped
from flask import Response, g, request
from bson import json_util
import json
from ptoweb.api.auth import require_auth
import re
from datetime import datetime
import pymongo.errors
from collections import OrderedDict


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


@app.route('/api/observations')
def api_observations_conditions():
  """
  Path: /api/observations

  Arguments: /api/observations/?conditions=<conditions>&from=<time.from>&to=<time.to>&n=<n>&sip=<sip>&dip=<dip>

    conditions: Conditions comma separated, then colon separated. Colon separated
                conditions will be ANDed and comma separated conditions will be ORed.
                That is: a,b:c,d is (a AND b) OR (c AND d).
    time.from:  Time window `from`.
    time.to:    Time window `to`.
    n:          Limit query to n observations only.
    skip:       How many results to skip.
    limit:      How many results to return.
    sip:        Startpoints (comma separated)
    dip:        Endpoints (comma separated)
  
   Note: dip and sip are ANDed!
  """

  conditions_all = from_comma_separated(request.args.get('conditions'))
  limit = to_int(request.args.get('limit'))
  skip = to_int(request.args.get('skip'))
  n = to_int(request.args.get('n'))
  sips = from_comma_separated(request.args.get('sip'))
  dips = from_comma_separated(request.args.get('dip'))

  time_from = to_int(request.args.get('from'))
  time_to = to_int(request.args.get('to'))

  if(time_from == 0 and time_to == 0):
    time_to = 1567204529149

  time_from = datetime.utcfromtimestamp(time_from / 1000.0)
  time_to = datetime.utcfromtimestamp(time_to / 1000.0)

  if(limit <= 0):
    limit = 128
  elif(limit >= 4096):
    limit = 4096

  if(n <= 0):
    n = 8192
  elif(n >= 65536):
    n = 65536

  if(skip >= n):
    return json400({'count' : 0, 'results' : [], 'err' : 'skip >= n'})

  filters = []

  for conditions_e in conditions_all:
    conditions = from_colon_separated(conditions_e)
    filters.append({'conditions' : {'$all' : conditions}})

  sip_filter = {}
  dip_filter = {}

  ips = []

  if(len(sips) > 0):
    sip_filter = {'sip' : {'$in' : sips}}

  if(len(dips) > 0):
    dip_filter = {'dip' : {'$in' : dips}}

  for sip in sips: ips.append(sip)
  for dip in dips: ips.append(dip)


  pipeline = []
  

  pre_matches = {
     '$match' : {'action_ids.0.valid' : True,
                 '$or' : filters,
                 'time.from' : {'$gte' : time_from}, 
                 'time.to' : {'$lte' : time_to}, 
                }
    }

  if(len(ips) > 0):
    pre_matches['$match']['path'] = {'$in' : ips}  


  pipeline += [
    pre_matches,
    {'$limit' : n},
    {'$project' : {'_id' : 1, 'path' : 1, 'conditions' : 1,
                    'time' : 1, 'value' : 1, 'analyzer_id' : 1, 
                    'dip' : { '$arrayElemAt' : ['$path', -1]},
                    'sip' : { '$arrayElemAt' : ['$path',  0]}
       }},
    {'$match' : dip_filter},
    {'$match' : sip_filter},
    {'$group': {'_id' : '$path', 'sip' : {'$first' : '$sip'}, 'dip' : {'$first' : '$dip'}, 'observations': 
           {'$addToSet': {'analyzer' : '$analyzer_id', 'conditions': '$conditions', 'time': '$time', 'value': '$value', 'path': '$path'}}}},
    {'$sort' : OrderedDict([('time.from',-1),('time.to',-1)])},
    {'$skip' : skip},
    {'$limit' : limit},
  ]

  print(pipeline)

  observations = get_observations_collection()

  try:
    results = list(observations.aggregate(pipeline, allowDiskUse=True, maxTimeMS = 5000))
    return json200({'results' : results, 'count' : len(results)})

  except pymongo.errors.ExecutionTimeout:
    return json400({'count' : 0, 'results' : [], 'err' : 'Timeout.'})

