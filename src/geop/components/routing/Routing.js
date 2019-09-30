import Component from 'Geop/Component'
import OSRMProvider from './OSRM'
import OpenRouteService from './OpenRouteService'
import { apiUrls } from 'Conf/settings'
import { getState, setState, onchange } from 'Utilities/store'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { uid } from 'Utilities/util'
import { createMarker } from 'Components/mouseposition/MousePosition'
import { createLayer } from 'Components/layer/LayerCreator'
import { toLonLat, fromLonLat } from 'ol/proj'
import { getDistance } from 'ol/sphere'
import $ from 'jquery'

const providers = {
  osrm: new OSRMProvider(),
  openrouteservice: new OpenRouteService()
}

let routeLayer = null

class Routing extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<span class="float-right" id="scale-line"></span>`)
    this.state = {
      from: null,
      to: null,
      contextmenu: {
        from: {
          content: `<i class="fas fa-directions text-success size-1_1"></i> ${t('Directions from here')}`,
          onClick: (e, coord, feature) => {
            const fromFeature = feature ? feature[1] : createMarker(coord)
            this.state.from = fromFeature.getGeometry().getCoordinates()
            setState('routing/stops', [toLonLat(this.state.from), this.state.to && toLonLat(this.state.to)])
            this.findRoute()
          },
          closeOnClick: true
        },
        to: {
          content: `<i class="fas fa-directions text-danger size-1_1"></i>
            ${t('Directions to here')}
            <a href="#" class="btn btn-link context-item-btn"><i class="fab fa-google"></i></a>`,
          onClick: (e, coord, feature) => {
            const toFeature = feature ? feature[1] : createMarker(coord)
            this.state.to = toFeature.getGeometry().getCoordinates()
            setState('routing/stops', [this.state.from && toLonLat(this.state.from), toLonLat(this.state.to)])
            this.findRoute()
          },
          closeOnClick: true,
          onBtnClick: (e, coord, feature) => {
            e.preventDefault()
            const formatted = toLonLat(coord).slice(0, 2).reverse().join(',')
            $('<a>').attr('href', apiUrls.google.directions + formatted).attr('target', '_blank')[0].click()
          }
        },
        done: {
          content: `<i class="fas fa-directions text-info size-1_1"></i>
            ${t('Retry directions')}
            <a href="#" class="btn btn-link context-item-btn"><i class="fas fa-times"></i></a>`,
          onClick: (e, coord, feature) => {
            this.findRoute()
          },
          closeOnClick: true,
          onBtnClick: (e, coord, feature) => {
            e.preventDefault()
            this.clear()
          }
        }
      }
    }
    // set contextmenu
    this.handleContextMenuItems()
    onchange('routing/stops', () => {
      this.handleContextMenuItems()
    })
  }
  handleContextMenuItems () {
    const contextMenuItems = getState('map/contextmenu')
    Object.keys(this.state.contextmenu).forEach(key => {
      const idx = contextMenuItems.indexOf(this.state.contextmenu[key])
      if (idx > -1) {
        contextMenuItems.splice(idx, 1)
      }
    })
    if (routeLayer && routeLayer.getSource().getFeatures().length) {
      contextMenuItems.push(this.state.contextmenu.done)
    } else {
      if (!this.state.from) {
        contextMenuItems.push(this.state.contextmenu.from)
      }
      if (!this.state.to) {
        contextMenuItems.push(this.state.contextmenu.to)
      }
      if (this.state.from && this.state.to) {
        contextMenuItems.push(this.state.contextmenu.done)
      }
    }
  }
  findRoute () {
    const coords = getState('routing/stops')
    if (coords.filter(lonLat => !!lonLat).length > 1) {
      findRoute(coords).then(route => {

      }).catch(e => {
        log('error', e)
        if (getState('app/debug')) {
          console.error('routing error', e)
        }
      })
    }
  }
  clear () {
    this.state.from = null
    this.state.to = null
    if (routeLayer) {
      routeLayer.setMap(null)
      routeLayer.getSource().clear()
      routeLayer = null
    }
    setState('routing/stops', [])
    setState('navigate/to', null)
  }
}

export function findRoute (coords) {
  if (routeLayer && routeLayer.getSource().getFeatures().length) {
    routeLayer.getSource().clear()
  }
  return new Promise((resolve, reject) => {
    const providerKey = getState('app/routing')
    const provider = (providerKey in providers) ? providers[providerKey] : null
    if (!provider) {
      throw new Error(t('Missing provider, aborting!'))
    }
    const coordinates = provider.formatInput(coords)
    if (!provider.test(coordinates)) {
      throw new Error(t('Routing input test failed, aborting!'))
    }
    provider.directions(coordinates)
      .then(route => {
        createRouteLayer()
        const routeCoords = route.getGeometry().getCoordinates()
        const distance = getDistance(coords[0], coords[coords.length - 1])
        if (routeCoords.length > 1 &&
          distance > getDistance(coords[0], toLonLat(routeCoords[0])) &&
          distance > getDistance(coords[coords.length - 1], toLonLat(routeCoords[routeCoords.length - 1]))
        ) {
          routeCoords.unshift(fromLonLat(coords[0], getState('map/projection')))
          routeCoords.push(fromLonLat(coords[coords.length - 1], getState('map/projection')))
          route.getGeometry().setCoordinates(routeCoords)
          routeLayer.getSource().addFeature(route)
          setState('routing/stops', coords)
          resolve(route)
        } else {
          throw new Error(t('Invalid route'))
        }
      })
      .catch(reject)
  })
}

function createRouteLayer () {
  if (!routeLayer) {
    routeLayer = layerCreate()
    routeLayer.setMap(getState('map'))
  }
}

function layerCreate () {
  const conf = {
    type: 'FeatureCollection',
    id: uid(),
    zIndex: 99,
    title: 'Route',
    style: [{
      stroke: {
        color: 'rgba(255, 255, 255, 0.7)',
        width: 7
      }
    }, {
      stroke: {
        color: 'rgba(0, 133, 203, 1)',
        width: 3
      }
    }]
  }
  return createLayer(conf)
}

export function getLayer () {
  if (!routeLayer) {
    routeLayer = layerCreate()
    routeLayer.setMap(getState('map'))
  }
  return routeLayer
}

export default Routing
