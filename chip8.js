const SPEED1 = 1<<0;
const SPEED2 = 1<<2;
const SPEED3 = 1<<4;
const SPEED4 = 1<<5;
const SPEED5 = 1<<7;

/* A public CORS proxy that allows bypassing of same-origin for file retrieval. */
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

window.Module = {};
Module.iter = 0;
Module.speed = SPEED3;
Module.sound_enabled = false;

async function play(name) {
  Module.name = name;

  name = CORS_PROXY + name;
  const rom_file = await fetch(name, { mode: 'cors' });
  const rom = await rom_file.arrayBuffer();

  const wasm_file = await fetch('chip8.wasm');
  const wasm_buff = await wasm_file.arrayBuffer();
  const module = await WebAssembly.compile(wasm_buff);
  const inst = await WebAssembly.instantiate(module,  {env : {
    js_log: function (ptr, len) {
      let buffer = new Uint8Array(Module.memory.buffer, ptr, len);
      const decoder = new TextDecoder("UTF-8");
      const buffer_utf8 = decoder.decode(buffer);
      console.log(buffer_utf8);
    },
    js_rand: function () {
      return Math.floor(Math.random() * 256);
    }
  }});

  var canvas = document.getElementById('screen');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');

    Module.chip8_new = inst.exports.chip8_new;
    Module.chip8_delete = inst.exports.chip8_delete;
    Module.chip8_get_screen = inst.exports.chip8_get_screen;
    Module.chip8_get_memory = inst.exports.chip8_get_memory;
    Module.chip8_tick = inst.exports.chip8_tick;
    Module.chip8_key_down = inst.exports.chip8_key_down;
    Module.chip8_key_up = inst.exports.chip8_key_up;
    Module.memory = inst.exports.memory;
    var width = 64;
    var height = 32;
    var bytes = width * height * 4;

    var chip8 = Module.chip8_new();
    var screen_ptr = Module.chip8_get_screen(chip8);
    var screen_array = new Uint8ClampedArray(inst.exports.memory.buffer,
      screen_ptr, bytes);
    var img = new ImageData(screen_array, width, height);

    var mem_ptr = Module.chip8_get_memory(chip8);
    var mem_array = new Uint8ClampedArray(inst.exports.memory.buffer,
      mem_ptr, 1024 * 4);
    mem_array.set(new Uint8ClampedArray(rom), 0x200);

    var audio = new (window.AudioContext || window.webkitAudioContext);
    var osc;

    var playing = false;
    Module.iter = Module.iter + 1;
    var iter = Module.iter;

    function tick() {
      if (Module.iter == iter) {
        window.requestAnimationFrame(tick);
      }
      if (Module.chip8_tick(chip8, Module.speed) && Module.sound_enabled) {
        if (!playing) {
          osc = audio.createOscillator();
          osc.type = 'square';
          osc.frequency.value = 440;
          osc.connect(audio.destination);
          osc.start(0);
          playing = true;
        }
      } else if (playing) {
        osc.stop(0);
        playing = false;
      }
      ctx.putImageData(img, 0, 0)
    }

    function get_key(evt) {
      if (evt.code == "Digit1") {
        return 1;
      } else if (evt.code == "Digit2") {
        return 2;
      } else if (evt.code == "Digit3") {
        return 3;
      } else if (evt.code == "Digit4") {
        return 0xC;
      } else if (evt.code == "KeyQ") {
        return 4;
      } else if (evt.code == "KeyW") {
        return 5;
      } else if (evt.code == "KeyE") {
        return 6;
      } else if (evt.code == "KeyR") {
        return 0xD;
      } else if (evt.code == "KeyA") {
        return 7;
      } else if (evt.code == "KeyS") {
        return 8;
      } else if (evt.code == "KeyD") {
        return 9;
      } else if (evt.code == "KeyF") {
        return 0xE;
      } else if (evt.code == "KeyZ") {
        return 0xA;
      } else if (evt.code == "KeyX") {
        return 0x0;
      } else if (evt.code == "KeyC") {
        return 0xB;
      } else if (evt.code == "KeyV") {
        return 0xF;
      }
      return -1;
    }

    function key_down(evt) {
      var k = get_key(evt);
      if (k == -1) return;
      Module.chip8_key_down(chip8, k);
    }

    function key_up(evt) {
      var k = get_key(evt);
      if (k == -1) return;
      Module.chip8_key_up(chip8, k);
    }

    canvas.addEventListener("keydown", key_down);
    canvas.addEventListener("keyup", key_up);

    Module.go = true;
    window.requestAnimationFrame(tick);
  }
}

/* UI animations */
window.onload = function() {
  var start = document.getElementById("start");
  var intro = document.getElementById("intro");
  var gamelist = document.getElementById("gamelist");
  var monitor = document.getElementById("monitor");
  var keymap = document.getElementById("keymap");
  var body = document.body;
  var back = document.getElementById("back");
  var volume = document.getElementById("button-volume-track");
  var reset = document.getElementById("button-reset");
  var knob = document.getElementById("button-speed-knob");
  var speed1 = document.getElementById("speed-1");
  var speed2 = document.getElementById("speed-2");
  var speed3 = document.getElementById("speed-3");
  var speed4 = document.getElementById("speed-4");
  var speed5 = document.getElementById("speed-5");

  start.onclick = function() {
    body.classList.toggle("to-beige");
    intro.style.display = "none";
    gamelist.style.display = "block";
    monitor.classList.add("move");
    keymap.style.display = "block";
  }

  back.onclick = function() {
    body.classList.toggle("to-beige");
    intro.style.display = "block";
    gamelist.style.display = "none";
    monitor.classList.remove("move");
    keymap.style.display = "none";
  }

  speed1.onclick = function() {
    knob.style.left = 20 + "px";
    Module.speed = SPEED1;
  }

  speed2.onclick = function() {
    knob.style.left = 89 + "px";
    Module.speed = SPEED2;
  }

  speed3.onclick = function() {
    knob.style.left = 157 + "px";
    Module.speed = SPEED3;
  }

  speed4.onclick = function() {
    knob.style.left = 224 + "px";
    Module.speed = SPEED4;
  }

  speed5.onclick = function() {
    knob.style.left = 292 + "px";
    Module.speed = SPEED5;
  }

  volume.onclick = function() {
    Module.sound_enabled = !Module.sound_enabled;
    volume.classList.toggle("volume-on");
  }

  reset.onclick = function() {
    play(Module.name);
  }
};

play('github.com/dmatlack/chip8/blob/master/roms/programs/Chip8%20Picture.ch8?raw=true');
