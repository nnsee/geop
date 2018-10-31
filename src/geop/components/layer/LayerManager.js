import {getState} from 'Utilities/store'
import {layers as layerConf} from 'Conf/settings'
import Component from 'Geop/Component'

class LayerManager extends Component {
  constructor () {
    super()
    this.state = {
      activeBaseLayer: getState('map/activeBaseLayer'),
      baseLayers: getState('map/baseLayers')
    }
  }

  layerVisible (layer) {
    if (layer.minResolution && this._map.getView().getResolution() < layer.minResolution) {
      return false;
    }
    if (layer.maxResolution && this._map.getView().getResolution() > layer.maxResolution) {
      return false;
    }
    return true;
  }

  getLayerConf (type, id) {
    return layerConf[type][id]
  }

  render () {
    return `
      <div class="btn-group pull-right layerswitcher">
        <button type="button"
          class="btn btn-secondary btn-sm dropdown-toggle"
          data-toggle="dropdown"
          aria-expanded="false">
          <span class="display-name hidden-xs">${this.state.activeBaseLayer}</span>
          <i class="fa fa-globe"></i>
        </button>
        <ul class="dropdown-menu" role="menu">
          ${this.state.baseLayers.getArray().map(layer => {
            const conf = this.getLayerConf('baseLayers', layer.get('id'))
            return `
              <li class="${this.layerVisible(layer) ? '' : 'disabled'}">
                <a href="#" class="baselayer"
                  data-name="${layer.get('id')}"
                  data-crs="${conf.projection}">${conf.title}</a>
              </li>`
          }).join('')}
        </ul>
      </div>`
  }

}

export default LayerManager
