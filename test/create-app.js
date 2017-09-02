var Koa = require('koa');
var session = require('koa-generic-session');
var ssoAuth = require('..');
var route = require('koa-route');
var errorCatcher = require('koa-error-catcher');

module.exports = function(match, ignore) {
    var app = new Koa();
    app.keys = ['i m secret'];
    app.use(session());

    app.use(async function (ctx, next) {
        try {
            await next();
        } catch (err) {
            this.status = 500;
            this.body = {
                error: err.message,
                message: this.method + ' ' + this.url
            };
        }
    });

    app.use(ssoAuth({
        match: match,
        ignore: ignore,
        loginURL: url => `/mocklogin?redirect=${url}`,
        getUser: async function (ctx) {
            if (ctx.get('mockerror')) {
                var err = new Error('mock getUser error');
                err.data = {url: ctx.url};
                ctx.throw(err);
            }

            if (ctx.get('mockempty')) {
                return null;
            }

            var user = ctx.session.user;
            if (ctx.get('mocklogin')) {
                user = {
                    nick: 'mock user',
                    userid: 1234
                };
            }

            if (ctx.get('mocklogin_redirect')) {
                user.loginRedirect = ctx.get('mocklogin_redirect');
            }

            if (ctx.get('mocklogin_callbackerror')) {
                user.loginError = ctx.get('mocklogin_callbackerror');
            }

            if (ctx.get('mocklogout_redirect')) {
                user.logoutRedirect = ctx.get('mocklogout_redirect');
            }

            if (ctx.get('mocklogout_callbackerror')) {
                user.logoutError = ctx.get('mocklogout_callbackerror');
            }
            return user;
        },

        loginCallback: async function (ctx, user) {
            if (user.loginError) {
                ctx.throw(user.loginError);
            }
            return [user, user.loginRedirect];
        },


        logoutCallback: async function (ctx, user) {
            ctx.set('X-Logout', 'logoutCallback header');
            if (user.logoutError) {
                throw new Error(user.logoutError);
            }
            return user.logoutRedirect;
        }
    }));

    app.use(route.get('/mocklogin', (ctx) => {
        ctx.redirect(ctx.query.redirect);
    }));

    app.use(ctx => {
        ctx.body = {
            user: ctx.session.user || null,
            message: ctx.method + ' ' + ctx.url
        };
    });
    return app
};
