from ptoweb import app
from flask import Response
import json

@app.route("/")
def index():
  """
  Dummy method answering with `{"status":"running"}` when the API is available.
  """

  return Response(json.dumps({'status':'running'}), status=200, mimetype='application/json')
