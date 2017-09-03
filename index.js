const debug = require('debug')('koa-sso-auth')

/**
 * sso auth middleware.
 *
 * @param {Object} options
 *  - {Function(url)} loginURL function formatter, set the login url.
 */

module.exports =  function(options) {
    return async (ctx, next) => {
        let loginURL = options.loginURL(ctx.path)

    }
}
