async     = require("async")
coffee    = require("coffee-script")
express   = require("express")
faceplate = require("faceplate")
log       = require("./lib/logger").init("device.consumer")

delay = (ms, cb) -> setTimeout  cb, ms
every = (ms, cb) -> setInterval cb, ms

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
app.use faceplate.middleware
  app_id: process.env.FACEBOOK_APP_ID
  secret: process.env.FACEBOOK_SECRET
  scope:  "user_likes,user_ohotos,user_photo_video_tags"

app.post "/", (req, res) ->
  res.redirect "/device/1"

app.get "/device/:id", (req, res) ->
  req.facebook.get "/friends", limit:4, (err, friends) ->
    console.log "err", err
    console.log "friends", friends
    res.render "index.ejs", host:req.headers.host, facebook:req.facebook, app:app

app.listen (process.env.PORT || 5000)
