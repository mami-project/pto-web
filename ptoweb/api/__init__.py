from ptoweb import app, get_uploads_collection, get_observations_collection
from flask import Response, g, request
import json
from ptoweb.api.auth import require_auth

def json200(obj):
  return Response(json.dumps(obj), status=200, mimetype='application/json')


@app.route('/api/')
def api_index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return json200({'status':'running'})


@app.route('/api/conditions')
def api_conditions():
  """
  """

  dip = request.args.get('dip')
  
  uploads = get_observations_collection()

  pipeline = [
      {'$match' : {'path' : '104.24.104.16'}},
      {'$unwind' : '$conditions'}, 
      {'$project' : {'_id' : 1, 'conditions' : 1, 'sip' : { '$arrayElemAt': ['$path',0] },
                     'dip' : { '$arrayElemAt' : ['$path', -1]}}},
      {'$match' : {'dip' : '104.24.104.16'}},
      {'$group' : {'_id' : { 'condition' : '$conditions', 'dip' : '$dip'}, 'count' : {'$sum' : 1}}},
      {'$group' : {'_id' : '$_id.dip', 'data' : {'$addToSet' : { 'condition' : '$_id.condition', 'count' : '$count'}}}}
    ]

  pipeline2 = [
      {'$unwind' : '$conditions'}
    ]

  result = list(uploads.aggregate(pipeline, allowDiskUse = True))
  print(result)

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
