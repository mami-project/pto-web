from flask import Flask, g

from pymongo import MongoClient

app = Flask(__name__)
app.config.from_envvar('PTO_SETTINGS', silent=False)

from werkzeug.contrib.cache import FileSystemCache
cache = FileSystemCache('/tmp/ptoweb')


def get_mongo_client_uploads():
  """
  Connect to MongoDB based on configuration.
  """

  return MongoClient(app.config['MONGO_URI'])


def get_mongo_client_observations():

  return MongoClient(app.config['MONGO_URI'])


def get_uploads_collection():

  return g.mongo_client_uploads['uploads']['uploads']


def get_observations_collection():

  return g.mongo_client_observations['ptodev-obs']['observations']


def get_obversations_collection_pre_grouped():

  return g.mongo_client_observations['ptodev-obs']['observations_web']


@app.before_request
def before_request():
  """
  Executed before every request.
  """
  g.mongo_client_uploads = get_mongo_client_uploads()
  g.mongo_client_observations = get_mongo_client_observations()


@app.teardown_request
def teardown_request(exception):
  """
  Executed after every request.
  """

  mongo_client = getattr(g, 'mongo_client_uploads', None)
  if mongo_client is not None:
    mongo_client.close()

  mongo_client = getattr(g, 'mongo_client_observations', None)
  if mongo_client is not None:
    mongo_client.close()


def from_comma_separated(data):
  if(data == None or data == ''):
    return []
  return list(map(lambda a: a.strip(), data.split(',')))

def from_colon_separated(data):
  if(data == None or data == ''):
    return []
  return list(map(lambda a: a.strip(), data.split(':')))


import ptoweb.api
import ptoweb.page


