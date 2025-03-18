var wrappy = require('wrappy')
var reqs = Object.create(null)
var once = require('once')

module.exports = wrappy(inflight)

function inflight(key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb)
    return null
  } else {
    reqs[key] = [cb]
    return makeres(key)
  }
}

function makeres(key) {
  return once(function RES() {
    try {
      var cbs = reqs[key]
      var len = cbs.length
      var args = slice(arguments)

      // XXX It's somewhat ambiguous whether a new callback added in this
      // pass should be queued for later execution if something in the
      // list of callbacks throws, or if it should just be discarded.
      // However, it's such an edge case that it hardly matters, and either
      // choice is likely as surprising as the other.
      // As it happens, we do go ahead and schedule it for later execution.
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args)
      }
    } catch (err) {
      console.error('Error in RES:', err)
    } finally {
      try {
        if (cbs.length > len) {
          cbs.splice(0, len)
          process.nextTick(function () {
            RES.apply(null, args)
          })
        } else {
          delete reqs[key]
        }
      } catch (ferr) {
        console.error('Error in finally:', ferr)
        delete reqs[key]
      }
    }
  })
}

function slice(args) {
  var length = args.length
  var array = []

  for (var i = 0; i < length; i++) array[i] = args[i]
  return array
}
