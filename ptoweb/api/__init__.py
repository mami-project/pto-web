from ptoweb import cache, app, get_uploads_collection, get_observations_collection
from flask import Response, g, request
import json
from ptoweb.api.auth import require_auth
import re

def json200(obj):
  return Response(json.dumps(obj), status=200, mimetype='application/json')


@app.route('/api/')
def api_index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return json200({'status':'running'})

@app.route('/api/conditions_total')
def api_conditions_total():

  observations = get_observations_collection()

  conditions = list(map(lambda a: a.strip(), request.args.get('name').split(',')))

  cache_key = '/api/conditions_total/' + ','.join(conditions)

  result = cache.get(cache_key)
  if result != None:
    return json200(result)

  pipeline = [
    {'$unwind' :'$conditions'}, 
    {'$match' : {'conditions' : {'$in' : conditions}}},
    {'$group' : {'_id' : '$conditions', 'count': {'$sum' : 1}}},
    {'$sort' : {'count' : -1}}
   ]

  result = list(observations.aggregate(pipeline))
  cache.set(cache_key, result, timeout = 60*60*60)

  return json200(result)


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

  result = cache.get(cache_key)
  if result != None:
    return json200(result)
  
  uploads = get_observations_collection()

  sip_match = {}

  if(sip != None and sip != ''):
    sip_match = {'sip' : sip}

  pipeline = [
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
  cache.set(cache_key, result, timeout = 60*60*60)

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
