import Component from 'Geop/Component'
import { apiUrls } from 'Conf/settings'
import { getSessionState } from 'Utilities/session'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { copy, uid } from 'Utilities/util'
import { get as getPermalink } from 'Utilities/permalink'
import log from 'Utilities/log'
import $ from 'jquery'
import './Bookmark.styl'

class Bookmark extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <div class="btn-group float-right" id="bookmark"></div>
    `)
    this.state = {
      bookmarks: getState('app/bookmarks') || [],
      bookmark: getPermalink('hash')
    }
    this.modal = $(`
      <div class="modal fade"
        id="modal_bookmark">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title">${t('Share bookmark')}</h4>
              <button type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body text-muted">
              <div class="input-group mb-5">
                <input type="text" class="form-control" name="bookmark" readonly>
                <div class="input-group-append">
                  <button class="btn btn-secondary copy" type="button">
                    <i class="far fa-clone"></i>
                  </button>
                  <a class="btn btn-secondary go" href="#" target="_blank">
                    <i class="fas fa-link"></i>
                  </a>
                </div>
              </div>
              <div class="mb-5 text-center display-4">
                ${t('or')}
              </div>
              <div class="mb-5 text-center">
                <img
                  class="rounded mx-auto d-block img-thumbnail"
                  src=""
                  alt="qr code" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `)
    this.create()
    $('body').append(this.modal)
    this.el.on('click', 'button.share', e => {
      e.preventDefault()
      this.share()
    })
    this.el.on('click', 'li', e => {
      e.preventDefault()
      this.openModal($(e.currentTarget).data('id'))
    })
    this.el.on('click', 'li .tools a.remove', e => {
      e.preventDefault()
      e.stopPropagation()
      this.delete($(e.currentTarget).closest('li').data('id'))
    })
    this.modal.on('click', 'button.copy', e => {
      this.copy($(e.target).closest('.modal').find('input').val())
    })
  }
  render () {
    this.el.html(`
      <div class="btn-group dropup">
        <button type="button" class="btn btn-secondary share" title="${t('Share')}">
          <i class="fas fa-share-alt"></i>
        </button>
        <button ${this.state.bookmarks.length ? '' : 'disabled'}
          type="button"
          class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
          data-toggle="dropdown">
        </button>
        <div class="dropdown-menu dropdown-menu-right">
          ${this.state.bookmarks.map((bookmark) => {
            return `
            <li
              class="dropdown-item"
              data-id="${bookmark}">
              <i class="fas fa-star"></i>
              ${bookmark}
              <div class="tools">
                <a href="#" class="remove">
                  <i class="fa fa-times"></i>
                </a>
              </div>
            </li>`
          }).join('')}
        </div>
      </div>
    `)
  }
  //https://dev.to/bauripalash/building-a-simple-url-shortener-with-just-html-and-javascript-16o4
  share () {
    getSessionState()
      .then(appState => {
        const data = formatState('up', appState)
        setBookmarkState(data)
          .then(bookmark => {
            this.state.bookmarks.push(bookmark)
            setState('app/bookmarks', this.state.bookmarks, true)
            this.render()
            this.openModal(bookmark)
          })
          .catch(e => {
            log('error', t(e))
          })
      })
      .catch(e => {
        log('error', t(e))
      })
  }
  copy (content) {
    copy(content)
      .then(() => {
        log('success', `${t('URL')} ${content} ${t('copied to clipboard')}`)
      })
      .catch(() => {
        log('error', t('Unable to copy to clipboard'))
      })
  }
  delete (bookmark) {
    deleteBookmarkState(bookmark)
      .then(() => {
        this.state.bookmarks = this.state.bookmarks.filter(item => item !== bookmark)
        setState('app/bookmarks', this.state.bookmarks, true)
        this.render()
      })
      .catch(e => {
        log('error', t(e))
      })
  }
  bookmarkUrl (hash) {
    return window.location.origin + '/#hash=' + hash
  }
  openModal (bookmark) {
    this.modal.find('input').val(this.bookmarkUrl(bookmark))
    this.modal.find('a.go').attr('href', this.bookmarkUrl(bookmark))
    this.modal.find('img').attr('src', apiUrls.qrcode + encodeURI(this.bookmarkUrl(bookmark)))
    this.modal.modal()
  }
}

let xhr = null

function formatState (type = 'down', data = {}, hash = null) {
  let state = {}
  if (type === 'up') {
    state = Object.assign({}, ...Object.keys(data).map(k => ({[k.replace(/\//g, '_')]: data[k]})))
    if ('app_bookmarks' in state) {
      delete state.app_bookmarks
    }
    if ('app_bookmark_loaded' in state) {
      delete state.app_bookmark_loaded
    }
  } else {
    state = Object.assign({}, ...Object.keys(data).map(k => ({[k.replace(/_/g, '/')]: data[k]})))
    if (hash) {
      state['app/bookmark/loaded'] = hash
    }
  }
  return state
}

function setBookmarkState (data) {
  return new Promise((resolve, reject) => {
    if (xhr && typeof xhr.abort === 'function') {
      xhr.abort()
    }
    const hash = uid()
    xhr = $.ajax({
      type : 'POST',
      crossDomain : true,
      url : apiUrls.jsonstore + '/' + hash,
      data: JSON.stringify(data),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    })
    .done(data => {
      if (data && data.ok) {
        resolve(hash)
      } else {
        reject(new Error('Unable to save bookmark'))
      }
    })
    .fail(request => {
      if (request.statusText === 'abort') {
        resolve(null)
      } else {
        reject(new Error('Unable to save bookmark'))
      }
    })
  })
}

export function getBookmarkState (hash) {
  return new Promise((resolve, reject) => {
    if (xhr && typeof xhr.abort === 'function') {
      xhr.abort()
    }
    xhr = $.ajax({
      type : 'GET',
      crossDomain : true,
      url : apiUrls.jsonstore + '/' + hash,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    })
    .done(data => {
      if (data && data.ok && data.result) {
        resolve(formatState('down', data.result, hash))
      } else {
        reject(new Error('Unable to load bookmark'))
      }
    })
    .fail(request => {
      if (request.statusText === 'abort') {
        resolve(null)
      } else {
        reject(new Error('Unable to load bookmark'))
      }
    })
  })
}

function deleteBookmarkState (hash) {
  return new Promise((resolve, reject) => {
    if (xhr && typeof xhr.abort === 'function') {
      xhr.abort()
    }
    xhr = $.ajax({
      type : 'DELETE',
      crossDomain : true,
      url : apiUrls.jsonstore + '/' + hash,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    })
    .done(data => {
      if (data && data.ok) {
        resolve()
      } else {
        reject(new Error('Unable to delete bookmark'))
      }
    })
    .fail(request => {
      if (request.statusText === 'abort') {
        resolve(null)
      } else {
        reject(new Error('Unable to delete bookmark'))
      }
    })
  })
}

export default Bookmark