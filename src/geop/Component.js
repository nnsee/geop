import Base from 'Geop/Base'

class Component extends Base {
  constructor (App) {
    super()
    this.$components = App.components
    this.$store = App.store
    this.$permalink = App.permalink
    this.$el = null
  }
}

export default Component