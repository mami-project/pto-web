from ptoweb import app
from flask import Response, g
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


@app.route('/api/uploads/<uploader>')
@require_auth
def api_uploads(uploader):
  """
  Path: /api/uploads/<uploader>

  - uploader: Name of the uploader

  Retrieve the number of uploads by an uploader.
  
  Returns: `{"uploads":<number>,"uploader":"<uploader>"}`
  """

  mongo_client = g.mongo_client
  db = mongo_client['uploads']
  uploads = db['uploads']

  if(uploader == ""):
    result = uploads.count({})
  else:
    result = uploads.count({'uploader':uploader})

  js = {'uploads' : result, 'uploader':uploader}

  return json200(js)


@app.route('/api/uploadstats')
def api_upload_statistics():
  """
  Path: /api/uploadstats

  Retrieve basic statistics about uploads.
  """

  mongo_client = g.mongo_client
  db = mongo_client['uploads']
  uploads = db['uploads']

  total = uploads.count({})

  pipeline = [{ '$group' : { '_id' : '$meta.msmntCampaign', 'count' : { '$sum' : 1 }}},
              { '$match' : { 'count' : { '$gt' : 1000 }}},
              { '$sort' : { '_id' : 1 }}]

  msmnt_campaigns = list(uploads.aggregate(pipeline))


  js = {'total' : total, 'msmntCampaigns' : msmnt_campaigns}

  return json200(js)
