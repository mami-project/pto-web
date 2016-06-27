from ptoweb import app
from flask import Response, g
import json
from ptoweb.api.auth import require_auth

def json200(obj):
  return Response(json.dumps(obj), status=200, mimetype='application/json')


@app.route("/")
def index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return json200({'status':'running'})


@app.route('/api/uploads/<uploader>')
@require_auth
def uploads(uploader):
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
    result = uploads.count({"uploader":uploader})

  js = {"uploads" : result, "uploader":uploader}

  return json200(js)
