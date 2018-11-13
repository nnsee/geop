//import Collection from 'ol/Collection'

const state = {}
const events = {}
const localStorage = storageAvailable('localStorage') ? window.localStorage : false

export function setState (item, value, permanent = false) {
  if (state[item] !== value) {
    state[item] = value
    // local storage
    if (permanent && localStorage) {
      localStorage.setItem(item, value)
    }
    // events
    if (item in events) {
      events[item].forEach(handler => handler(state[item]))
    }
  }
}

export function getState (item) {
  let value
  if (localStorage) {
    value = localStorage.getItem(item)
    if (value && item in state && state[item] !== value) {
      state[item] = value
    }
  }
  return state[item]
}

export function on (item, listener) {
  if (!item in events) {
    events[item] = []
  }
  if (events[item] !== listener) {
    events[item].push(listener)
  }
}

function storageAvailable (type) {
  try {
    const storage = window[type]
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  }
  catch(e) {
    const storage = window[type]
    return e instanceof window.DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0
    }
  }
