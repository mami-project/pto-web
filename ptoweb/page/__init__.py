from ptoweb import app, from_comma_separated, from_colon_separated
from flask import Response, g, render_template, request
import json


def err400(msg="Client Error"):
  return Response(msg, status=400, mimetype='text/plain')


@app.route("/")
def index():
  return render_template("index.html")


@app.route("/uploadstats")
def uploadstats():
  return render_template("uploadstats.html")


@app.route('/observatory')
def observatory():
  return render_template("observatory.html")


def to_int(value):
  try:
    return int(value, 10)
  except:
    return 0

@app.route('/advanced')
def advanced():
  
  on_path = from_comma_separated(request.args.get('on_path'))
  sip = from_comma_separated(request.args.get('sip'))
  dip = from_comma_separated(request.args.get('dip'))
  condition_criteria = from_comma_separated(request.args.get('condition_criteria'))
  force_load = True if request.args.get('l') == 'y' else False

  page_num = to_int(request.args.get('page_num'))

  if(len(condition_criteria) > 4):
    return err400("Too many condition criteria (max. 4 allowed): " + str(condition_criteria))

  condition_criteria = list(map(from_colon_separated, condition_criteria))

  for condition_criterion in condition_criteria:
    if(len(condition_criterion) != 4):
      return err400("Malformed condition criterion: " + str(condition_criterion))

  print(condition_criteria)

  condition_criteria = list(filter(lambda x: not any((map(lambda a: len(a) < 1, x[:3]))), condition_criteria))

  print(condition_criteria)

  count = len(condition_criteria)

  

  while len(condition_criteria) < 4:
    condition_criteria.append(['must','?','',''])

  return render_template("advanced.html" ,
                         on_path = on_path, sip = sip, dip = dip,
                         condition_criteria = condition_criteria,
                         count = count, page_num = str(page_num), force_load = force_load)
