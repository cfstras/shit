/***
 *     _    _       _           _
 *    | |  | |     | |         | |
 *    | | _| | ___ | |__   ___ | |_
 *    | |/ / |/ _ \| '_ \ / _ \| __|
 *    |   <| | (_) | |_) | (_) | |_
 *    |_|\_\_|\___/|_.__/ \___/ \__|
 *
 * klobot game (2016 cc-by-sa flipdot.org)
 * https://github.com/flipdot/shit
 */

var game = new Object;

game.resolution = {
    height: 240,
    width: 320
};

game.speed = 50; // pixels per second
game.fallSpeed = 2;
game.drag = 0.2;
game.moveAccel = 5;
game.maxV = 150;

game.state = {
  loadPercent: 0,
  renderFunc: loadScreen,
  animFrame: null,
  t: 0, // time in seconds
  dt: 0, // time since last frame,
  keysDown: Array(256).fill(false),
};

game.pipe = {/* Background pipe segments */
  offset: 0, // how much the current pipe has moved upward, in pixels
  path: "../res/pipes/", /* path to pipe images */
  base_modifiers: [ // pipe modifiers
    "",
    "_short",
    "_alter",
    "_long",
    //"_extralong",
    //"_alter2",
    //"_left",
    //"_right",
  ],
  max_modifiers: 2, // 0-2 modifiers per pipe possible
  modifiers_prob: { // modifiers with probabilities
    "_short": 0.5,
    "_alter2_short": 0.5, // just examples, will be filled by init code
  },
  available: { // set of available pipe segments
    "101-111_short": new Image() // just an example, will be filled by init code
  },
  availByTop: {
    "101": ["101-111_short"], // filled by loading
  },
  current: {/* new pipe segment entering the screen */
    height: 240,/* height of the pipes segment image */
    width: 320,/* width of our image, default 320 */
    top: "010", /* top connections of 3 lanes, default start: one middle lane */
    bottom: "010", /* bottom connections of 3 lanes, default: middle lane */
    kind: "_short", /* the 'kind' of a segment provides infos e.g. about crossings or imageheight, default: "_short" */
    setImagePath: function () { /* define a function to calculate an image path with passed connectors */
      this.imagePath = this.top + "-" + this.bottom + this.kind; /* Imagepath of a 1-3 pipes segment, e.g. "010-010_short.png" */
      this.image = game.pipe.available[this.imagePath];
    },
    image: new Image(),
  },
  last: {/* pipe segment which leaves the screen */
    height: 240,/* height of the pipes segment image, default: 240px */
    width: 320,/* width of our image, default: 320px */
    top: "010", /* top connections of 3 lanes, default: start one middle lane */
    bottom: "010", /* bottom connections of 3 lanes, default: middle lane */
    kind: "_short", /* the 'kind' of a segment provides infos e.g. about crossings or imageheight, default: "_short" */
    setImagePath: function () { /* define a function to calculate an image path with passed connectors */
      this.imagePath = this.top + "-" + this.bottom + this.kind; /* Imagepath of a 1-3 pipes segment, e.g. "010-010_short.png" */
      this.image = game.pipe.available[this.imagePath];
    },
    image: new Image(),
  }
};

game.mrBrown = {/* Our hero sprite! */
    height: 40,/* height of Mr.Brown sprite*/
    width: 40,/* width of Mr.Brown sprite*/
    setInitPosition: function () { /* define a function to calculate the initial top left corner position of Mr.Brown sprite */
      this.y = Math.round((game.resolution.height*0.382) - (game.mrBrown.height/2)) /* default: golden ratio */
      this.x = Math.round(game.resolution.width/2) /* default startposition: middle lane*/
     },
    x: 0, y: 0,
    imagePaths: {
      base:"../res/sprites/", /* path to sprite images */
      standard: "mrbrown.gif", /* animated shit sprite Mr. Brown */
      /* more movement animation todo...
      leftmove: this.mrBrown.path + "mrbrownleft.gif",
      rightmove: this.mrBrown.path + "mrbrownright.gif",
      collision: this.mrBrown.path + "mrbrownsplash.gif",
      */
    },
    images: {
      // image data, will be filled upon load
    },
    vx: 0, vy: 0, // velocity
    ax: 0, ay: 0, // acceleration
};

game.init = function init(delay){ /* Initialising canvas */
  /* draw a nice debug ascii-picture in the console for developers happyness*/
  console.log(" _    _       _           _    ");
  console.log("| |  | |     | |         | |   ");
  console.log("| | _| | ___ | |__   ___ | |_  ");
  console.log("| |/ / |/ _ \\| '_ \\ / _ \\| __| ");
  console.log("|   <| | (_) | |_) | (_) | |_  ");
  console.log("|_|\\_\\_|\\___/|_.__/ \\___/ \\__| ");
  console.log("## may the shit be with you ##");

  this.canvas = document.getElementById('canvas'); /* get the <canvas> in the browser window */

  this.canvas.width = this.resolution.width; /* apply the defined screen resolution to the canvas */
  this.canvas.height = this.resolution.height;
  this.context = this.canvas.getContext('2d'); /* provide a 2D rendering context for the drawing surface of a <canvas> element. */

  game.state.animFrame = requestAnimationFrame(render);
  document.addEventListener('keydown', game.keydown);
  document.addEventListener('keyup', game.keyup);

  var pipesPromise = loadPipes();
  pipesPromise.then(function(){
    console.log(game);
    game.mrBrown.setInitPosition();
    game.pipe.current.setImagePath();
    game.pipe.last.setImagePath();
    game.state.renderFunc = fall;

  });
}

game.keydown = function(e) {
  //console.log(e.keyCode);
  if (game.state.keysDown[e.keyCode]) {
    return;
  }
  game.state.keysDown[e.keyCode] = true;
  switch (e.keyCode) {
    case 39: // right
      game.keyup({keyCode: 37});
      game.mrBrown.vx = 0;
      game.mrBrown.ax = game.moveAccel;
    break;
    case 37: // left
      game.keyup({keyCode: 39});
      game.mrBrown.vx = 0;
      game.mrBrown.ax = -game.moveAccel;
    break;
  }
};

game.keyup = function(e) {
  if (!game.state.keysDown[e.keyCode]) {
    return;
  }
  game.state.keysDown[e.keyCode] = false;
  switch (e.keyCode) {
    case 39: // right
      //game.mrBrown.vx = 0;
      game.mrBrown.ax = 0;
    break;
    case 37: // left
      //game.mrBrown.vx = 0;
      game.mrBrown.ax = 0;
    break;
  }
};

function render(t) {
  game.state.animFrame = requestAnimationFrame(render);
  t /= 1000; // from ms to s
  game.state.dt = t - game.state.t;
  game.state.t = t;

  game.state.renderFunc();
}

function loadScreen() {
  var percent = game.state.loadPercent;
  var w = game.resolution.width, h = game.resolution.height;
  game.context.clearRect(0,0,w,h);
  game.context.beginPath();
  game.context.moveTo(w/2, h/2);
  //game.context.lineTo(w/2, h/6);
  var start = -0.5 * Math.PI + percent * 0.7 * Math.PI;
  var pos = start + percent*2*Math.PI;
  game.context.arc(w/2,h/2, w/4, start, pos);
  game.context.lineTo(w/2, h/2);
  game.context.fillStyle = "hsl(56,"+percent*100+"%,50%)";
  game.context.fill();
}

function fall() {
  var w = game.resolution.width, h = game.resolution.height;
  var offset = game.pipe.offset;
  var current = game.pipe.current;
  var last = game.pipe.last;
  
  game.context.clearRect(0, 0, w, h);
  game.context.drawImage(last.image,
    0, -offset,
    last.width, last.height)
  game.context.drawImage(current.image,
    0, -offset + last.height,
    current.width, current.height);
  
  // draw mrbrown
  game.context.drawImage(game.mrBrown.images['standard'],
    game.mrBrown.x - game.mrBrown.width/2, game.mrBrown.y - game.mrBrown.height/2,
    game.mrBrown.width, game.mrBrown.height);

  // move pipes, select new ones
  game.pipe.offset += game.state.dt * game.speed * game.fallSpeed;
  if (game.pipe.offset >= last.height) {
    game.pipe.offset -= last.height;
    var next = game.pipe.last;
    game.pipe.last = game.pipe.current;

    next.top = game.pipe.last.bottom;
    //next.bottom = next.top;
    choosePipe(next);
    next.setImagePath();
    next.width = next.image.width;
    next.height = next.image.height;
    game.pipe.current = next;
    console.log("next pipe:", next.imagePath);
  }

  // move mrbrown
  var vDir = Math.sign(game.mrBrown.vx);
  var doDrag = Math.abs(game.mrBrown.ax) > 0 ? 0 : 1;
  var dragAmount = doDrag * game.drag;
  var absVx = Math.abs(game.mrBrown.vx);
  game.mrBrown.vx -= (dragAmount > absVx ? absVx : dragAmount) * vDir;
  
  game.mrBrown.x += game.mrBrown.vx * game.state.dt * game.speed;

  game.mrBrown.vx += game.mrBrown.ax * game.state.dt;
  vDir = Math.sign(game.mrBrown.vx);
  game.mrBrown.vx = vDir * Math.min(game.maxV, Math.abs(game.mrBrown.vx));
  
  document.getElementById("stats").innerHTML = "vx: " + game.mrBrown.vx.toFixed(3) +
    ", ax: " + game.mrBrown.ax.toFixed(3) + ", dt: " + game.state.dt.toFixed(4) + "<br>" +
    "vDir: " + vDir.toFixed(1) + ", doDrag: " + doDrag;
}

function choosePipe(pipe) {
  var avail = game.pipe.availByTop[pipe.top];
  var choose = avail[(Math.random() * avail.length) | 0];
  if (choose.indexOf("_") != -1) {
    pipe.bottom = choose.slice(choose.indexOf("-")+1, choose.indexOf("_"));
    pipe.kind = choose.slice(choose.indexOf("_"), choose.length);
  } else {
    pipe.bottom = choose.slice(choose.indexOf("-")+1, choose.length);
    pipe.kind = "";
  }
}

function loadPipes() {
  var bases = ["001","010","011","100","101","110","111"];
  var modifier_combinations = 0;
  var modifiers_num = {};
  game.pipe.available = {};
  game.pipe.availByTop = {};
  var promises = [];
  var totalTries = 0, doneTries = 0;
  totalTries += 10; // for the stat calculation
  totalTries += Object.keys(game.mrBrown.imagePaths).length - 1; // base does not count
  for (var i_from in bases) {
    var base_from = bases[i_from];
    for (var i_to in bases) {
      var base_to = bases[i_to];
      var from_to_path = game.pipe.path + base_from + "/" +
        base_from + "-" + base_to;

      for (var i_mod in game.pipe.base_modifiers) {
        var mod1 = game.pipe.base_modifiers[i_mod]
        for (var i_mod2 in game.pipe.base_modifiers) {
          totalTries++;
          var mod2 = game.pipe.base_modifiers[i_mod2];
          var modifier = mod1 + mod2;
          var path = from_to_path + mod1 + mod2 + ".png";
          var promise = new Promise(function(path, resolve, reject){
            fileCheck(path, function(base_from, base_to, modifier, image){
              doneTries++;
              game.state.loadPercent = doneTries / totalTries;
              if (!image) {
                resolve();
                return;
              }
              if (modifiers_num[modifier]) {
                modifiers_num[modifier]++;
              } else {
                modifiers_num[modifier] = 1;
              }
              var identifier = base_from + "-" + base_to + modifier;
              game.pipe.available[identifier] = image;
              
              // availByTop
              var availByTop = game.pipe.availByTop[base_from];
              if (!availByTop) {
                availByTop = [];
                game.pipe.availByTop[base_from] = availByTop;
              }
              availByTop.push(identifier);

              resolve();
            }.bind(this, base_from, base_to, modifier));
          }.bind(this, path));
          promises.push(promise);
        }
      }
    }
  }
  // load mr. brown images
  for (var type in game.mrBrown.imagePaths) {
    if (type == "base") continue;
    var path = game.mrBrown.imagePaths.base + game.mrBrown.imagePaths[type];
    promises.push(new Promise(function(resolve, reject){
      fileCheck(path, function(data){
        doneTries++;
        game.state.loadPercent = doneTries / totalTries;
        if (!data) {
          reject("mr brown "+ type + " not found!");
        }
        game.mrBrown.images[type] = data;
        resolve();
      });
    }));
  }

  return Promise.all(promises).then(function(){
    game.pipe.modifiers_prob = {};
    var all = 0;
    for (var mod in modifiers_num) {
      all += modifiers_num[mod];
    }
    doneTries += 5;
    game.state.loadPercent = doneTries / totalTries;
    for (var mod in modifiers_num) {
      var num = modifiers_num[mod];
      game.pipe.modifiers_prob[mod] = num / all;
    }
    console.log(game.pipe);
    doneTries += 5;
    game.state.loadPercent = doneTries / totalTries;
  });
};

/** fileCheck(path)
* hacked function to check if a randomly generated image exists
* @param {string} path to image
* @param {function} will be called with boolean
*/
function fileCheck(path, callback) {
  var img = new Image(); /* define the variable 'img' as a new Image */
  img.src = path; /* set the source of this 'img' with the path that is passed as argument to the function */
  img.onload = function() {
    var originalState = game.context.getImageData(0,0,1,1).data; /* get the original color of the upper right screencorner 1x1 testpixel */

    game.context.clearRect(0,0,1,1); // clear the state
    var pixelState = game.context.getImageData(0,0,1,1).data;

    game.context.drawImage(img, 0,0,1,1); /* draw the possibly existing image in size 1x1px in this testpixel */
    var pixelHack = game.context.getImageData(0,0,1,1).data; /* if the image exists, it will been drawn and changes the color of that pixel */

    game.context.fillStyle = "rgba(" + originalState.join(",") + ")"; /* prepare the old color for a rectangle to overwrite that testpixel */
    game.context.fillRect(0,0,1,1); /* draw a 1x1 rectangle at the testpixel with the original color*/
    if (pixelState.join("") === pixelHack.join(""))/* compare if the color of this pixel has changed */
      callback(false);/* false if the pixelcolor stayed the same aka. the file didn't exist and wasn't drawn */
    else
      callback(img);/* true if the pixelcolor was changed aka. the file exists */
  }
  img.onerror = function() {
    callback(false);
  }
}
