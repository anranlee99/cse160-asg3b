// Vertex shader program
var VSHADER_SOURCE = `
precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`
  ;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
      
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else {
      gl_FragColor = vec4(1, .2, 0.2, 1);
    }
  }`;

// GLSL stuff
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_yellowAngle = 0;
let g_yellowAngle2 = -45;
let g_blueAngle = 0;
let g_globalAngle = 0;
let g_lastX = 0;
let g_lastY = 0;
let g_x = 0;
let g_yAngle = 0;
let g_zAngle = 0;
let dragging = false;

let animation = false;
let SHAPE = 'POINT';
let g_segments = 10;
let camera;
function setupWebGL() {
  canvas = document.querySelector('#canvas');
  gl = getWebGLContext(canvas);
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to init shaders');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  const identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {

  const image = new Image();
  image.onload = function () { sendTextureToGLSL0(image); };
  image.src = renderMandelbrot();

  const grass = new Image();
  grass.onload = function () { sendTextureToGLSL1(grass); };
  grass.src = getWater();
}

function sendTextureToGLSL0(image) {
  const texture = gl.createTexture();
  // flip the images y axis
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  // enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Set up the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // set up the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0)
}
function sendTextureToGLSL1(image) {
  const texture = gl.createTexture();
  // flip the images y axis
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  // enable texture unit0
  gl.activeTexture(gl.TEXTURE1);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Set up the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // set up the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1)
}

function main() {
  setupWebGL();
  // Initialize shaders
  connectVariablesToGLSL();
  initTextures();
  gl.clearColor(0.0, 0.5, 1.0, 1.0);

  camera = new Camera();
  canvas.addEventListener('mousedown', (e) => {
    camera.beginRotate(e);
  });

  canvas.addEventListener('wheel', (e) => {
    camera.scrollFactor += e.deltaY * -0.001;
    camera.beginRotate(e);
    camera.rotateCamera(e);
    camera.moving = false;

  })

  document.addEventListener('mousemove', (e) => {
    if (camera.moving && e.target === canvas) {
      camera.rotateCamera(e);
    }
  });

  canvas.addEventListener('mouseup', () => {
    camera.moving = false;
  });

  canvas.addEventListener('mouseenter', (e) => {
    camera.rotateCamera(e);
    if (!camera.moving) {
      camera.moving = false;
    }
  });

  document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) { // Use toLowerCase() to ensure case insensitivity
      case 'w':
        camera.moveDirection.forward = true;
        break;
      case 's':
        camera.moveDirection.back = true;
        break;
      case 'a':
        camera.moveDirection.left = true;
        break;
      case 'd':
        camera.moveDirection.right = true;
        break;
      case 'q':
        camera.moveDirection.rotateLeft = true;
        break;
      case 'e':
        camera.moveDirection.rotateRight = true;
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
      case 'w':
        camera.moveDirection.forward = false;
        break;
      case 's':
        camera.moveDirection.back = false;
        break;
      case 'a':
        camera.moveDirection.left = false;
        break;
      case 'd':
        camera.moveDirection.right = false;
        break;
      case 'q':
        camera.moveDirection.rotateLeft = false;
        break;
      case 'e':
        camera.moveDirection.rotateRight = false;
        break;
    }
  });



  renderAllShapes();
  tick();
}


let time_since_last_frame = performance.now();
let lastUpdateTime = 0;
const updateInterval = 1000;
const fpsel = document.querySelector('#fps');
function tick() {
  const now = performance.now();
  const delta = now - time_since_last_frame;
  time_since_last_frame = now;
  const fps = 1000 / delta;
  if (now - lastUpdateTime > updateInterval) {
    fpsel.innerText = `ms: ${Math.round(delta)}FPS: ${Math.round(fps)}`;
    lastUpdateTime = now;
    Cube.updateColors();
  }
  renderAllShapes(delta);
  requestAnimationFrame(tick);
}

class Camera {
  constructor() {
    this.m = new Matrix4();
    this.angleX = 0;
    this.angleY = 0;
    this.angleZ = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.scrollFactor = 1;
    this.moving = false;
    this.position = [0, 0, -3];
    this.moveSpeed = 0.1;
    this.moveDirection = { forward: false, back: false, left: false, right: false, rotateLeft: false, rotateRight: false };
  }
  updatePosition() {
    if (this.moveDirection.forward) {
      this.position[2] += this.moveSpeed;
    }
    if (this.moveDirection.back) {
      this.position[2] -= this.moveSpeed;
    }
    if (this.moveDirection.left) {
      this.position[0] -= this.moveSpeed;
    }
    if (this.moveDirection.right) {
      this.position[0] += this.moveSpeed;
    }
    if (this.moveDirection.rotateLeft) {
      this.rotateLeft();
    }
    if (this.moveDirection.rotateRight) {
      this.rotateRight();
    }
  }
  convertMouseToEventCoords(e) {

    let x = e.clientX; // x coordinate of a mouse pointer
    let y = e.clientY; // y coordinate of a mouse pointer

    const rect = (e.target).getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2); // canvas dt 
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2); // canvas dt


    return ([x, y]);
  }

  rotateCamera(e) {
    if (!this.moving) return;

    const [x, y] = this.convertMouseToEventCoords(e);

    // Calculate angle changes
    let deltaX = (x - this.lastX) * 120; // Adjust sensitivity as needed
    let deltaY = (y - this.lastY) * 120;

    // Update angles based on the delta
    this.angleY += deltaX;
    this.angleX += deltaY;

    // Update the matrix
    this.m.setIdentity();
    this.m.rotate(this.angleX, 1, 0, 0);
    this.m.rotate(this.angleY, 0, 1, 0);
    this.m.rotate(this.angleZ, 0, 0, 1);
    this.m.scale(this.scrollFactor, this.scrollFactor, this.scrollFactor);

    // Save current positions for the next update
    this.lastX = x;
    this.lastY = y;

    // Update the uniform
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix"), false, this.m.elements);
  }

  rotateLeft() {
    let x = this.lastX - 0.01;
    let y = this.lastY;
    let deltaX = (x - this.lastX) * 120; // Adjust sensitivity as needed
    let deltaY = (y - this.lastY) * 120;

    // Update angles based on the delta
    this.angleY += deltaX;
    this.angleX += deltaY;

    // Update the matrix
    this.m.setIdentity();
    this.m.rotate(this.angleX, 1, 0, 0);
    this.m.rotate(this.angleY, 0, 1, 0);
    this.m.rotate(this.angleZ, 0, 0, 1);
    this.m.scale(this.scrollFactor, this.scrollFactor, this.scrollFactor);

    // Save current positions for the next update
    this.lastX = x;
    this.lastY = y;

    // Update the uniform
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix"), false, this.m.elements);
  }

  rotateRight() {
    let x = this.lastX + 0.01;
    let y = this.lastY;
    let deltaX = (x - this.lastX) * 120; // Adjust sensitivity as needed
    let deltaY = (y - this.lastY) * 120;

    // Update angles based on the delta
    this.angleY += deltaX;
    this.angleX += deltaY;

    // Update the matrix
    this.m.setIdentity();
    this.m.rotate(this.angleX, 1, 0, 0);
    this.m.rotate(this.angleY, 0, 1, 0);
    this.m.rotate(this.angleZ, 0, 0, 1);
    this.m.scale(this.scrollFactor, this.scrollFactor, this.scrollFactor);

    // Save current positions for the next update
    this.lastX = x;
    this.lastY = y;

    // Update the uniform
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix"), false, this.m.elements);
  }


  beginRotate(e) {
    this.moving = true;
    [this.lastX, this.lastY] = this.convertMouseToEventCoords(e);
  }
}


function renderAllShapes(delta) {

  camera.updatePosition();


  const projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  const viewMat = new Matrix4();
  viewMat.lookAt(camera.position[0], camera.position[1], camera.position[2], 0, 0, 0, 0, 1, 0);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, camera.m.elements);


  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      const ground = new Cube();
      ground.color = [1, 0, 0, 1];
      ground.matrix.translate(i - 16, -2, j - 16);
      ground.matrix.scale(1, 1, 1);
      ground.matrix.translate(-.5, 0, -.5);
      ground.renderLerp(delta);
    }
  }

  // Skybox
  const sky = new Cube();
  sky.color = [1, 0, 0, 1];
  sky.textureNum = 0;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-.5, -.5, -.5);
  sky.render();




}




main();