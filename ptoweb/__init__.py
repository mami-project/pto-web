from flask import Flask, g
from pymongo import MongoClient

app = Flask(__name__)
app.config.from_envvar('PTO_SETTINGS', silent=False)


def get_mongo_client():
  """
  Connect to MongoDB based on configuration.
  """

  return MongoClient(app.config['MONGO_URI'])


@app.before_request
def before_request():
  """
  Executed before every request.
  """
  g.mongo_client = get_mongo_client()


@app.teardown_request
def teardown_request(exception):
  """
  Executed after every request.
  """

  mongo_client = getattr(g, 'mongo_client', None)
  if mongo_client is not None:
    mongo_client.close()


import ptoweb.api


