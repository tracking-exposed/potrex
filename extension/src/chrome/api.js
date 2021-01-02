import nacl from 'tweetnacl'
import bs58 from 'bs58'

import config from '../config'
import { decodeString, decodeKey } from '../utils'
import db from './db'

function post (apiUrl, data) {
  return new Promise((resolve, reject) => {
    db.get('local').then(keypair => {
      const xhr = new XMLHttpRequest()
      const payload = JSON.stringify(data)
      const url = config.API_ROOT + apiUrl

      xhr.open('POST', url, true)

      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('X-potrex-Version', config.VERSION)

      if (!keypair) {
        reject('Cannot sign payload, no keypair found!')
        return
      }

      const signature = nacl.sign.detached(decodeString(payload),
        decodeKey(keypair.secretKey))
      console.log("NaCl signed", payload.length, "bytes from", data.length, "objects");

      xhr.setRequestHeader('X-potrex-PublicKey', keypair.publicKey)
      xhr.setRequestHeader('X-potrex-Signature', bs58.encode(signature))

      xhr.send(payload)
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(this.response)
        } else {
          reject(this.statusText)
        }
      }

      xhr.onerror = function () {
        console.log("XHR.onerror", this.statusText);
        reject(this.statusText)
      }
    })
      .catch(error => {
        console.log("Catch error in POST:", error);
        reject(error);
      })
  })
}

function get (apiUrl, version, userId) {
  return new Promise((resolve, reject) => {
    db.get('local').then(keypair => {
      const xhr = new XMLHttpRequest()
      const url = config.API_ROOT + apiUrl

      xhr.open('GET', url, true)

      xhr.setRequestHeader('X-potrex-Version', version)
      xhr.send()
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          console.log(this.response)
          resolve(this.response)
        } else {
          console.log('Load error', this.statusText)
          reject(this.statusText)
        }
      }

      xhr.onerror = function () {
        console.log('onerror', this.statusText)
        reject(this.statusText)
      }
    })
      .catch(error => reject(error))
  })
}

const api = {
  postEvents: post.bind(null, 'events'),
  validate: post.bind(null, 'validate'),
  handshake: post.bind(null, 'handshake')
}

export default api
