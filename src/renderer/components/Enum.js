// import _ from 'lodash'
// const assert = require('./assert.js')
import Misc from '@/misc.js'

function isMethod (variable, attr) {
  if (variable[attr] !== undefined) {
    if (!variable.hasOwnProperty(attr)) {
      // is not dynamic attrivute aka keys
      return true
    }
  }

  return false
}

function Enum () {
  // shallow copy
  const args = Array.from(arguments)
  Misc.assert(!(args.includes('ALL')))

  const mapping = {}
  args.forEach(item => {
    mapping[item] = item
  })

  let enumOut = null
  const allowedValues = args.slice(0)
  const frozenMapping = Object.freeze(mapping)
  const newEnum = new Proxy(frozenMapping, {
    get: function (target, name) {
      // console.log('INCLDES', target, name)
      if (name === 'ALL') {
        return allowedValues.slice(0)
      } else if (name === 'ALLMAP') {
        return frozenMapping
      } else if (name === 'length') {
        return allowedValues.length
      } else if (name === 'includes') {
        return value => allowedValues.includes(value)
      } else if (isMethod(allowedValues, name)) {
        return allowedValues.slice(0)[name]
      } else if (name === Symbol.toStringTag) {
        return 'Enum'
      } else if (!(name in frozenMapping)) {
        throw new Error(`ENUM PROP DOES NOT EXIST ${name}`)
      }

      return frozenMapping[name]
    },

    set: function (target, name, value) {
      throw new Error(`ENUM IS READONLY - ${name} = ${value}, ${target}`)
    }
  })

  enumOut = Object.freeze(newEnum)
  return enumOut
}

export default Enum
