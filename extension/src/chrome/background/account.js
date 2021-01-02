import nacl from 'tweetnacl'
import bs58 from 'bs58'

import api from '../api'
import { isEmpty } from '../../utils'
import db from '../db'

const bo = chrome || browser

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: false, ux: false }
const FIXED_USER_NAME = 'local'

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'localLookup') {
    userLookup(request.payload, sendResponse)
    return true
  }
  if (request.type === 'remoteLookup') {
    serverLookup(request.payload, sendResponse)
    return true
  }
  if (request.type === 'configUpdate') {
    configUpdate(request.payload, sendResponse)
    return true
  }
})

function initializeKey () {
  const newKeypair = nacl.sign.keyPair()
  console.log('Initializing new key pair:', bs58.encode(newKeypair.publicKey))
  return {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey)
  }
}
function setDefaults (val) {
  val.active = DEFAULT_SETTINGS.active
  val.ux = DEFAULT_SETTINGS.ux
  return val
}

function userLookup (ignoredarg, sendResponse) {
  // console.log('ignored', ignoredarg) // this would have been a cookieId (but require 'domains' permission in manifest)
  const userId = FIXED_USER_NAME
  db.get(userId).then(val => {
    if (isEmpty(val)) {
      var val = initializeKey()
      val = setDefaults(val)
      db.set(userId, val).then(val => {
        console.log('First access attempted, created config', val)
        sendResponse(val)
      })
    } else {
      console.log('sending back from userLookup', val)
      sendResponse(val)
    }
  })
};

function serverLookup (payload, sendResponse) {
  /* remoteLookup might be call as first function after the extension has been
     * installed, and the keys not be yet instanciated */
  const userId = FIXED_USER_NAME
  db.get(userId).then(val => {
    if (isEmpty(val)) {
      var val = initializeKey()
      val = setDefaults(val)
      console.log("serverLookup isn't used since a while and have been trimmed: double check!")
      return db.set(userId, val).then(function () { return val })
    }
    return val
  })
    .then(function (x) {
      return api
        .handshake(payload, 'local')
        .then(response => sendResponse({ type: 'handshakeResponse', response: response }))
        .catch(error => sendResponse({ type: 'handshakeError', response: error }))
    })
};

function configUpdate (payload, sendResponse) {
  const userId = FIXED_USER_NAME
  db.get(userId).then(val => {
    const update = _.merge(val, payload)
    return db.set(userId, update)
  }).then(val => {
    console.log('ConfigUpdate completed and return', val)
    sendResponse(val)
  })
}
