import Component from 'Geop/Component'
import { create, GroupLayer } from 'Components/layer/LayerCreator'
import { getState, setState } from 'Utilities/store'
import { degToRad, radToDeg } from 'Utilities/util'
import Map from 'ol/Map'
import View from 'ol/View'
import { get as getProjection, fromLonLat, toLonLat } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import $ from 'jquery'
import 'ol/ol.css'
import './MapEngine.styl'

proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
proj4.defs("EPSG:32634", "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs")
proj4.defs("EPSG:32635", "+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs")
register(proj4)
getProjection('EPSG:3301').setExtent([40500, 5993000, 1064500, 7017000])

class MapEngine extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div id="${getState('map/el').slice(1)}"></div>`)
    this.create()
    this.map = null
    this.layers = {
      base: new GroupLayer({
        layers: []
      }),
      layers: new GroupLayer({
        layers: []
      }),
      overlays: new GroupLayer({
        layers: []
      })
    }
    this.activeBaseLayer = null
    this.geoLocation = null
    this.controls = {
      mouseCoordinates : null
    }
    this.overlay = null
    this.shouldUpdate = true
    // permalink
    const permalink = this.permalinkToViewConf(
      this.$permalink ? this.$permalink.get('map') : null)
    this.createBaseLayers(getState('map/layers').baseLayers, permalink.baselayer)
    this.createLayers(getState('map/layers').layers)
    // set to store
    setState('map/layer/base', this.layers.base.getLayers())
    setState('map/layer/layers', this.layers.layers.getLayers())
    setState('map/layer/overlays', this.layers.overlays.getLayers())
    setState('map/baseLayer', this.activeBaseLayer.get('id'), true)
    // que for map
    setState('map/que', [])
  }

  init () {
    // permalink
    const permalink = this.permalinkToViewConf(
      this.$permalink ? this.$permalink.get('map') : null)
    this.map = this.createMap(permalink)
    setState('map', this.map)
    this.map.on('moveend', (e) => {
      const view = e.map.getView()
      setState('map/resolution', view.getResolution())
      setState('map/center', toLonLat(view.getCenter()), true)
      setState('map/zoom', view.getZoom(), true)
      setState('map/rotation', radToDeg(view.getRotation()), true)
    })
    // run que
    const que = getState('map/que')
    que.forEach(item => {
      if (typeof item === 'function') {
        item(this.map)
      }
    })
  }

  permalinkToViewConf (permalink) {
    const parts = permalink ? permalink.split('-') : []
    return {
      center: (parts[1] && parts[0]) ? [parts[1], parts[0]] : getState('map/center'),
      zoom: parts[2] || getState('map/zoom'),
      rotation: parts[3] || getState('map/rotation'),
      baselayer: parts[4] || getState('map/baseLayer')
    }
  }

  createMap (viewConf) {
    return new Map({
      layers: Object.keys(this.layers).map(i => this.layers[i]),
      controls: [],
      target: document.querySelector(getState('map/el')),
      moveTolerance: 2,
      pixelRatio: 2,
      view: new View({
        projection: getState('map/projection'),
        center: fromLonLat(viewConf.center, getState('map/projection')),
        zoom: viewConf.zoom,
        rotation: degToRad(viewConf.rotation),
        maxZoom: getState('map/maxZoom'),
        minZoom: getState('map/minZoom')
      })
    })
  }

  createBaseLayers (layers, activeBaseLayerId) {
    Object.keys(layers).forEach(id => {
      layers[id].visible = (id === activeBaseLayerId)
      const layer = create(layers[id])
      layer.set('id', id)
      this.addBaseLayer(layer)
      if (layers[id].visible) {
        this.activeBaseLayer = layer
      }
    })
  }

  createLayers (layers) {
    Object.keys(layers).forEach(name => {
      const layer = create(layers[name])
      layer.set('id', name)
      this.addLayer(layer)
    })
  }

  addBaseLayer (layer) {
    this.layers.base.getLayers().push(layer)
  }

  addLayer (layer) {
    this.layers.layers.getLayers().push(layer)
  }

  // TODO: id filter
  getLayer (group, id = null) {
    if (group in this.layers) {
      return this.layers[group]
    }
  }

}

export default MapEngine
