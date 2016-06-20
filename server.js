var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var five = require("johnny-five");
var board = new five.Board();

var qr = require('qr-image');
var fs = require('fs');

var address;
var os = require('os');
var ifaces = os.networkInterfaces();

var port = 9169;


Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
      address = iface.address;
    }
    ++alias;
  });
});

var code = qr.image('http://' + address + ':' + port + '/mobile.html', {
  type: 'png'
});
var output = fs.createWriteStream('qr.png');
code.pipe(output);

fs.readFile('mobile.src', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/localhost/g, address);

  fs.writeFile('mobile.html', result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});

var led;
board.on("ready", function () {
  led = new five.Led(11);

  // Add servo to REPL (optional)
  this.repl.inject({
    led: led
  });

});

app.listen(port);

function handler(req, res) {
  var url = req.url;
  if (req.url.indexOf('?') > 0) {
    url = req.url.substr(0, req.url.indexOf('?'));
  }
  fs.readFile(__dirname + url,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
}

io.on('connection', function (socket) {
  socket.on('orientation', function (data) {
    console.log(data);
    if (led) {
      led.brightness(Math.floor(Math.abs(Math.sin(data.beta / 180 * 3.1415926)) * 255));
    }
    // io.emit('control', data);
  });

  socket.on('motion', function (data) {
    // console.log(data);

    // io.emit('control', data);
  });
});
