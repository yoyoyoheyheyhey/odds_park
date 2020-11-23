from flask import Flask, request
from flask_restful import Resource, Api
from json import dumps
from sympy import *
import json
import string
import re
import math
from functools import reduce

app = Flask(__name__)
api = Api(app)

class CompositeOdds(Resource):
    def get(self):
      odds = json.loads(request.args.get('odds'))
      inversed_odds = []
      for f in odds:
        if float(f) == 0.0:
          inversed_odds.append(0.0)
        else:
          inversed_odds.append(1 / float(f))
      composite_odds = 1 / sum(inversed_odds)
      return { "composite_odds": composite_odds }

class OptimizeInvestments(Resource):
  def get(self):
    tickets = json.loads(request.args.getlist('tickets')[0])
    martingale = json.loads(request.args.get('martingale'))

    i = 0
    opt_tickets = {}
    for key in tickets.keys():
      opt_tickets[key] = []
      for obj in tickets[key]:
        inversed_odds = 1 / float(obj["odds"])
        int_and_dec = str(inversed_odds).split(".")
        dec_point = int_and_dec[1]
        max_dec_point = re.findall("^0*\d{1,1}", dec_point)[0]
        zeros_and_max = [char for char in max_dec_point]
        zeros_and_max[-1] = str(int(zeros_and_max[-1]) + 1)
        int_and_dec[1] = "".join(zeros_and_max)
        inversed_odds_ceil = float(".".join(int_and_dec))
        inv = inversed_odds_ceil * (10000 * martingale)
        if inv < (100 * martingale):
          inv = (100 * martingale)
        opt_tickets[key].append(
          {
            "id": obj["id"],
            "odds": float(obj["odds"]),
            "inv": inv,
            "payout": float(obj["odds"]) * inv
          }
        )
        i += 1

    need_opt = True
    while need_opt == True:
      total_inv = sum(map(lambda obj: obj["inv"], flatten([*opt_tickets.values()])))
      find_lost = lambda obj: obj["payout"] < total_inv
      if next(filter(find_lost, flatten([*opt_tickets.values()])), None):
        need_opt = True
      else:
        need_opt = False
      for key in opt_tickets.keys():
        for obj in opt_tickets[key]:
          if obj["payout"] < total_inv:
            opt_tickets[key].remove(obj)
            inv = obj["inv"] + 100
            opt_tickets[key].append({
              "id": obj["id"],
              "odds": obj["odds"],
              "inv": inv,
              "payout": obj["odds"] * inv
            })

    payouts = map(lambda obj: obj["payout"], flatten([*opt_tickets.values()]))
    min_payout = min(payouts)
    return {
      "tickets": json.dumps(opt_tickets),
      "total_inv": json.dumps(total_inv),
      "min_payout": json.dumps(min_payout)
    }

api.add_resource(CompositeOdds, "/composite_odds")
api.add_resource(OptimizeInvestments, "/optimize_investments")

if __name__ == '__main__':
    app.run(port='5002')
