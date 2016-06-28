from ptoweb import app
from flask import Response, g, render_template
import json


@app.route("/")
def index():
  return render_template("index.html")


@app.route("/uploadstats")
def uploadstats():
  return render_template("uploadstats.html")


