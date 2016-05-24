import {start, pull, html} from 'inu'
import ready from 'domready'
import t from 'tcomb'
import SSBClient from './ws-client'
import api from './api'
import Router from './components/router'
const client = SSBClient(api)

import actionsStream from './streams/actionsStream'
import SbotGatheringAdded from './actions/sbotGatheringWasAdded'
import SbotMyRsvpWasAdded from './actions/sbotMyRsvpWasAdded'
import UiDidRsvp from './actions/uiDidRsvp'
import UiUrlDidChangeAction from './actions/uiUrlDidChange'
import Default from './actions/default'

import Rsvps from './models/rsvps'
import Gatherings from './models/gatherings'
import Model from './models/model'

const Action = t.union([SbotGatheringAdded, SbotMyRsvpWasAdded, UiDidRsvp, UiUrlDidChangeAction], 'Action')

const State = t.struct({
  model: Model,
  effect: t.maybe(t.Object)
}, 'State')

const app = {

  init: function(){
    return State({
      model: {
        gatherings: [],
        rsvps: [],
        url: '/'
      },
      effect: {
        type: 'INIT'
      }})
      },

  update: function(model, action){
    console.log(model, action);
    return State(Action(action).update(model, action))
  },

  view: (model, dispatch) => {
    return html`
      <main>
        ${Router(model, dispatch)}
      </main>`
  },

  run: function(effect){
    switch(effect.type){
      case "INIT": 
        return actionsStream(client) 
      case "SCHEDULE_RSVP":
        client.publish(RsvpMsg(effect.id, effect.status), function(err, res) { })
        return pull.empty()
    }
    return pull.empty()
  }
}

function RsvpMsg(id, vote){
  return { type: 'rsvp', vote: { link: id, value: vote } } 
}

ready(function(){
  const main = document.querySelector('main')
  const {views} = start(app)
  
  pull(
    views(),
    pull.drain(function(view) {
    html.update(main, view)
  }))
})
