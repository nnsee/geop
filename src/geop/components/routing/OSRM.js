import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import Provider from 'Geop/Provider'
import { t } from 'Utilities/translate'
import Polyline from 'ol/format/Polyline'
import $ from 'jquery'

class OSRM extends Provider {
  constructor () {
    super()
    this.title = 'OSRM'
    this.xhr = null
  }
  formatInput (coords) {
    return coords.filter(lonLat => !!lonLat).map(lonLat => {
      return lonLat.slice(0, 2).join()
    })
  }
  test (coords) {
    return !(coords.length < 2)
  }
  directions (coords) {
    return new Promise((resolve, reject) => {
      this.clear()
      this.xhr = $.ajax({
        type: 'GET',
        crossDomain: true,
        url: apiUrls.osrm + coords.join(';'),
        data: {
          overview: 'full'
        },
        dataType: 'json'
      })
        .done(response => {
          if (response.code === 'Ok') {
            resolve(this.format(response.routes[0].geometry))
          } else {
            reject(new Error(t('Unable to find route') + ': ' + response.code))
          }
        })
        .fail(function (request) {
          if (request.statusText === 'abort') {
            return
          }
          reject(new Error(t('Unable to find route') + ': ' + t(request.responseJSON ? request.responseJSON.message : request.statusText)))
        })
    })
  }
  format (polyline) {
    return new Polyline({
      factor: 1e5
    }).readFeature(polyline, {
      dataProjection: 'EPSG:4326',
      featureProjection: getState('map/projection')
    })
  }
}

export default OSRM
