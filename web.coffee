async    = require("async")
coffee   = require("coffee-script")
express  = require("express")
http     = require("http")
log      = require("./lib/logger").init("device.consumer")
merge    = require("coffee-script").helpers.merge
passport = require("passport")

delay = (ms, cb) -> setTimeout  cb, ms
every = (ms, cb) -> setInterval cb, ms

get = (url, cb) ->
  http.get url, (res) ->
    buffer = ""
    res.on "data", (data) -> buffer += data.toString()
    res.on "end", -> cb null, buffer

post = (url, data, cb) ->
  headers =
    "Content-Length": data.length
    "Content-Type": "application/x-www-form-urlencoded"
  req = http.request merge(require("url").parse(url), method:"POST", headers:headers), (res) ->
    buffer = ""
    res.on "data", (data) -> buffer += data.toString()
    res.on "end", -> cb null, buffer
  req.write data
  req.end()

del = (url, data, cb) ->
  headers =
    "Content-Length": data.length
    "Content-Type": "application/x-www-form-urlencoded"
  req = http.request merge(require("url").parse(url), method:"DELETE", headers:headers), (res) ->
    buffer = ""
    res.on "data", (data) -> buffer += data.toString()
    res.on "end", -> cb null, buffer
  req.write data
  req.end()

FacebookStrategy = require("passport-facebook").Strategy

passport.use new FacebookStrategy
  clientID:     process.env.FACEBOOK_APP_ID
  clientSecret: process.env.FACEBOOK_SECRET
  callbackURL:  process.env.FACEBOOK_CALLBACK_URL
  (access, refresh, profile, done) ->
    done null, profile

passport.serializeUser (user, done)  -> console.log "uuuser", user; done null, user
passport.deserializeUser (obj, done) -> done null, obj

authenticate = () ->
  passport.authenticate "facebook", scope:["publish_actions"], failureRedirect:"/auth/invalid"

ensure_authenticated = (req, res, next) ->
  if req.isAuthenticated() then next() else res.redirect "/auth/facebook"

express.logger.format "method",     (req, res) -> req.method.toLowerCase()
express.logger.format "url",        (req, res) -> req.url.replace('"', "&quot")
express.logger.format "user-agent", (req, res) -> (req.headers["user-agent"] || "").replace('"', "")

app = express()

app.disable "x-powered-by"

app.use express.logger
  buffer: false
  format: "ns=\"device.consumer\" measure=\"http.:method\" source=\":url\" status=\":status\" elapsed=\":response-time\" from=\":remote-addr\" agent=\":user-agent\""
app.use express.cookieParser()
app.use express.bodyParser()
app.use express.session({ secret:process.env.SESSION_SECRET || "secret123" })
app.use passport.initialize()
app.use passport.session()
app.use express.static("#{__dirname}/public")
app.use app.router

app.get "/auth/invalid", (req, res) ->
  res.send "invalid login"

app.get "/auth/facebook", authenticate()

app.get "/auth/facebook/callback", authenticate(), (req, res) ->
  res.redirect "/dashboard"

app.get "/", (req, res) ->
  res.render "index.jade", user:{}

app.get "/reset", ensure_authenticated, (req, res) ->
  del "http://device-mothership.herokuapp.com/user/#{req.user.id}/device", "", (err, data) ->
    res.redirect "/dashboard"

app.get "/dashboard", ensure_authenticated, (req, res) ->
  get "http://device-mothership.herokuapp.com/user/#{req.user.id}/device", (err, data) ->
    device = JSON.parse(data)
    if device
      get "http://device-mothership.herokuapp.com/sensor/#{device}/history/hour", (err, data) ->
        try
          history = JSON.parse(data)
        catch error
          history = {temp:[], battery:[]}
        res.render "device.jade", user:req.user, device:device, history:history
    else
      res.render "welcome.jade", user:req.user, device:device

app.post "/device", ensure_authenticated, (req, res) ->
  post "http://device-mothership.herokuapp.com/user/#{req.user.id}/device", "device=#{req.body.device}", (err, data) ->
    res.redirect "/dashboard"

app.get "/devices", ensure_authenticated, (req, res) ->
  get "http://device-mothership.herokuapp.com/user/#{req.user.id}/devices", (err, data) ->
    res.render "devices.jade", user:req.user, devices:JSON.parse(data)

app.post "/devices", ensure_authenticated, (req, res) ->
  post "http://device-mothership.herokuapp.com/user/#{req.user.id}/devices", "device=#{req.body.device}", (err, data) ->
    res.redirect "/devices"

app.get "/device/:id", (req, res) ->
  req.facebook.get "/friends", limit:4, (err, friends) ->
    console.log "err", err
    console.log "friends", friends
    res.render "index.ejs", host:req.headers.host, facebook:req.facebook, app:app

app.listen (process.env.PORT || 5000)
