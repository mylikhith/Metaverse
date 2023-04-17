import Land from "./abi/abi.json";
import Web3 from "web3";
import polygon from "./Web3.js";
import * as THREE from "./modules/three.module.js";
import * as CANNON from "./modules/cannon-es.js";
import CannonDebuger from "./modules/cannon-es-debugger.js";
import { OrbitControls } from "./modules/OrbitControls.js";
import { FBXLoader } from "./modules/FBXLoader.js";
import { GLTFLoader } from "./modules/GLTFLoader.js";
import { RGBELoader } from "./modules/RGBELoader.js";
import { CSS2DRenderer, CSS2DObject } from "./modules/CSS2DRenderer.js";

import back from "./skybox/back.jpg";
import bottom from "./skybox/bottom.jpg";
import front from "./skybox/front.jpg";
import left from "./skybox/left.jpg";
import right from "./skybox/right.jpg";
import top from "./skybox/top.jpg";

import white from "./texture/white.jpg";

const Idle = new URL("./model/Idlelol.fbx", import.meta.url);
const Walking = new URL("./model/Walkinginp.fbx", import.meta.url);
const Running = new URL("./model/Running.fbx", import.meta.url);
const Tut_Hip_Hop_Dance = new URL(
  "./model/Tut_Hip_Hop_Dance.fbx",
  import.meta.url
);

// DECLARE VARIABLES
let scene, camera, renderer; //3js initScene()
let world, cannonDebugger; //cannon.js initWorld()
let timeStep = 1 / 60;
let controls; //orbit controls
let groundMaterial; //createGround()
let playerBody, playerMesh;
let labelRender; //2dd
var mixer, actions, anims; //createPlayer()
let speed = 0,
  minspeed = -0.2,
  maxspeed = 0.2,
  acceleration = 0.2,
  angle = 0; //key controls

let chaseCam, chaseCamPivot;
let view = new THREE.Vector3();
let First, Firstlabel, Second, Secondlabel;
let mmi;
let farm_house;
var selectedValue;

// SETUP FUNCTIONS
initScene();
initWorld();
//initOrbitControls();
initChaseCam();
createGround();
createPlayer();
loadModel();
loadTwoD();
animate();

function loadTwoD() {
  labelRender = new CSS2DRenderer();
  labelRender.setSize(window.innerWidth, window.innerHeight);
  labelRender.domElement.style.position = "absolute";
  labelRender.domElement.style.top = "0px";
  document.body.appendChild(labelRender.domElement);

  const div = document.createElement("div");
  div.className = "popup";
  First = document.createElement("div");
  Firstlabel = new CSS2DObject(First);
  // Firstlabel.position.set(0, 3, 0);
  div.appendChild(First);
  First.addEventListener("click", function () {
    console.log("onclick");
  });

  Second = document.createElement("div");
  Secondlabel = new CSS2DObject(Second);
  div.appendChild(Second);
  Second.addEventListener("click", function () {
    console.log("fuck");
  });
}

// 3js: scene, skybox, camera, renderer

function initScene() {
  scene = new THREE.Scene();

  clock = new THREE.Clock();

  scene.background = new THREE.CubeTextureLoader().load([
    left,
    right,
    top,
    bottom,
    back,
    front,
  ]);

  // camera
  camera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  // camera.position.set(0, 10, -15); //orbit controls

  // renderer
  const canvas = document.querySelector(".webgl");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const Yellow = new THREE.Color(0xe0c53a);
  const sphere_geo = new THREE.SphereGeometry(5);
  const sphere_mater = new THREE.MeshStandardMaterial({ color: Yellow });
  var sphere_mesh = new THREE.Mesh(sphere_geo, sphere_mater);
  sphere_mesh.name = "sphere";
  sphere_mesh.position.set(-100, 20, 0);
  scene.add(sphere_mesh);

  mmi = new MouseMeshInteraction(scene, camera);
  mmi.addHandler("sphere", "click", function (mesh) {
    console.log("heijdnkadz");
    if (First.textContent == "") {
      First.textContent = "GET IT";
      Second.textContent = "got it";
      First.className = "popup show";
      Second.className = "popup hide";
    } else {
      First.textContent = "";
      Second.textContent = "";
      First.className = "popup hide";
      Second.className = "popup show";
    }
  });
}

//creating cannon world, set gravity, start debugger

function initWorld() {
  // cannon js world
  world = new CANNON.World();
  world.gravity.set(0, -40, 0);

  //debugger puts wireframes
  cannonDebugger = new CannonDebuger(scene, world, {
    color: 0xffffff,
    scale: 1.0,
  });
}

function initChaseCam() {
  chaseCam = new THREE.Object3D();
  chaseCam.position.set(0, 120, -80); // rt lf, up dn , ft bk 0 50 -100

  chaseCamPivot = new THREE.Object3D();
  chaseCamPivot.position.set(-50, 100, -350);

  chaseCam.add(chaseCamPivot);

  scene.add(chaseCam); //3rdcam
}

function initOrbitControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.5;
  controls.maxDistance = 1000;
}

function createGround() {
  groundMaterial = new CANNON.Material("groundMaterial");

  const groundShape = new CANNON.Plane();

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
    material: groundMaterial,
  });

  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI / 2
  );

  world.addBody(groundBody);

  const textureLoader = new THREE.TextureLoader();
  const groundTexture = textureLoader.load(white);
  groundTexture.wrapS = THREE.RepearWrapping;
  groundTexture.wrapT = THREE.RepearWrapping;
  groundTexture.repeat.set(10, 10);

  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
  });

  const grounfGeo = new THREE.BoxGeometry(1000, 2, 1000);

  const groundMesh = new THREE.Mesh(grounfGeo, groundMat);
  scene.add(groundMesh);
  groundMesh.position.set(0, 1, 0);
}

function createPlayer() {
  const speederMaterial = new CANNON.Material("speederMaterial");

  const playerBodyShape = new CANNON.Box(new CANNON.Vec3(2, 2, 2));

  playerBody = new CANNON.Body({
    mass: 100,
    shape: playerBodyShape,
    material: speederMaterial,
  });

  playerBody.position = new CANNON.Vec3(-80, 25, -160);
  // console.log(playerBody.position)
  world.addBody(playerBody);

  const dlight = new THREE.DirectionalLight(0xffffff, 1.4);
  dlight.position.copy(playerBody.position);
  scene.add(dlight);

  // load 3d model;

  const Loader = new FBXLoader();
  Loader.load(Idle.href, (object) => {
    playerMesh = object;
    mixer = new THREE.AnimationMixer(object);
    actions = [];
    const action = mixer.clipAction(object.animations[0]);
    action.play();
    actions.push(action);
    // console.log(object);
    object.castShadow = true;
    object.receiveShadow = true;

    object.scale.setScalar(0.11, 0.11, 0.11);
    object.position.copy(playerBody.position);
    object.quaternion.copy(playerBody.quaternion);

    playerMesh.add(chaseCam); //3rdcam
    scene.add(object);
    object.add(Firstlabel); // label
    object.add(Secondlabel);

    anims = [Walking, Running, Idle];

    loadAnimation(Loader);
  });

  window.addEventListener("resize", onWindowResize, false);
}

polygon.then((result) => {
  result.nft.forEach((object, index) => {
    if (object.owner != 0) {
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.4;

      const rgbeLoader = new RGBELoader();
      rgbeLoader.load(
        "./assets/MR_INT-001_NaturalStudio_NAD.hdr",
        function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;

          switch (index) {
            case 0:
              {
                farm_house = new GLTFLoader();
                farm_house.load("./assets/farm_house/scene.gltf", function (h) {
                  scene.add(h.scene);
                  farm_house.name = "farm";
                  h.scene.position.set(object.w, object.h / 10, object.d);
                });
              }
              break;
            case 1:
              {
                let streetlight = new GLTFLoader();
                streetlight.load(
                  "./assets/street_light/scene.gltf",
                  function (s) {
                    s.scene.scale.set(
                      object.x / 1000,
                      object.y / 1000,
                      object.z / 1000
                    );
                    s.scene.rotation.y = 1.6;
                    scene.add(s.scene);
                    s.scene.position.set(object.w, 2, object.d);
                  }
                );
              }
              break;
            case 2:
              {
                let african_wild_dog = new GLTFLoader();
                african_wild_dog.load(
                  "./assets/african_wild_dog/scene.gltf",
                  function (d) {
                    d.scene.scale.set(
                      object.x / 1000,
                      object.y / 1000,
                      object.z / 1000
                    );
                    d.scene.rotation.y = -1.4;
                    scene.add(d.scene);
                    d.scene.position.set(object.w, object.h / 10, object.d);
                  }
                );
              }
              break;
            case 3:
              {
                let helicopter_v2 = new GLTFLoader();
                helicopter_v2.load(
                  "./assets/helicopter_v2/scene.gltf",
                  function (h) {
                    h.scene.scale.set(
                      object.x / 1000,
                      object.y / 1000,
                      object.z / 1000
                    );
                    scene.add(h.scene);
                    h.scene.position.set(object.w, object.h / 10, object.d);
                  }
                );
              }
              break;
            case 4:
              {
                console.log("4");
                let bmw_507 = new GLTFLoader();
                bmw_507.load("./assets/bmw_507/scene.gltf", function (b) {
                  b.scene.scale.set(
                    object.x / 1000,
                    object.y / 1000,
                    object.z / 1000
                  );
                  b.scene.rotation.y = -1.4;
                  scene.add(b.scene);
                  b.scene.position.set(object.w, object.h / 10, object.d);
                });
              }
              break;
            default:
              console.log("LOL");
          }
        }
      );
    }
  });
});

function loadModel() {
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.4;

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load(
    "./assets/MR_INT-001_NaturalStudio_NAD.hdr",
    function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;

      let oak_trees = new GLTFLoader();
      oak_trees.load("./assets/oak_trees/scene.gltf", function (d) {
        d.scene.scale.set(35, 35, 35);
        d.scene.rotation.y = -1;
        scene.add(d.scene);
        d.scene.position.set(10, 2, -150);
      });

      let rocks_and_trees = new GLTFLoader();
      rocks_and_trees.load("./assets/rocks_and_trees/scene.gltf", function (h) {
        h.scene.scale.set(23, 23, 23);
        scene.add(h.scene);
        h.scene.rotation.y = 0.6;
        h.scene.position.set(-35, 8, -180);
      });

      let low_poly_trees = new GLTFLoader();
      low_poly_trees.load("./assets/low_poly_trees/scene.gltf", function (h) {
        h.scene.scale.set(23, 23, 23);
        scene.add(h.scene);
        h.scene.rotation.y = 1.7;
        h.scene.position.set(-130, 4, 70);
      });
    }
  );
}

const a = document.querySelector("#btn");
a.addEventListener("click", mintNFT);

function mintNFT() {
  selectedValue = document.querySelector("#list").value;

  if (typeof window.ethereum == "undefined") {
    rej("you should install Metamask");
  }

  let web3 = new Web3(window.ethereum);
  let contract = new web3.eth.Contract(
    Land.abi,
    "0x83347dB3EE32E2179011C740cE4741119828b527"
  );

  web3.eth.requestAccounts().then((accounts) => {
    contract.methods
      .mint(selectedValue)
      .send({ from: accounts[0], value: "10" })
      .then(console.log("NFT is minted"));
    // .then(location.reload());
  });

  setInterval(myTimer, 22000);

  function myTimer() {
    location.reload();
  }
}

function playAction(index) {
  const action = actions[index];
  mixer.stopAllAction();
  action.reset();
  action.fadeIn(0.5);
  action.play();
}

function loadAnimation(Loader) {
  const anim = anims.shift();

  Loader.load(anim.href, (object) => {
    const action = mixer.clipAction(object.animations[0]);
    if (anim == "Idle") {
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
    }
    actions.push(action);
    if (anims.length > 0) {
      loadAnimation(Loader);
    } else {
      update();
    }
  });
}

document.onkeydown = (event) => {
  console.log(event);
  switch (event.key) {
    case "ArrowLeft":
      angle += 2 * (Math.PI / 30);
      break;

    case "ArrowRight":
      angle -= 2 * (Math.PI / 30);
      break;

    case "ArrowUp":
      speed += acceleration;
      if (speed > maxspeed) speed = maxspeed;
      if (speed == 0) {
        playAction(3);
      } else {
        playAction(1);
      }
      break;

    case "ArrowDown":
      speed -= acceleration;
      if (speed < minspeed) speed = minspeed;
      if (speed == 0) {
        playAction(3);
      } else {
        playAction(1);
      }
      break;
  }
  playerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
};

function moveSpeeder() {
  playerBody.position.x += speed * Math.sin(angle);
  playerBody.position.z += speed * Math.cos(angle);

  if (playerMesh) {
    playerMesh.position.copy(playerBody.position);
    playerMesh.quaternion.copy(playerBody.quaternion);

    camera.lookAt(playerMesh.position); //3rdcam
  }
}

function animate() {
  // controls.update(); //orbit controls

  // cannonDebugger.update();

  world.step(timeStep);

  moveSpeeder();

  updateChaseCam(); // 3rdcam

  labelRender.render(scene, camera); //2dd

  //

  mmi.update();

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

function update() {
  requestAnimationFrame(update);
  renderer.render(scene, camera);
  const dt = clock.getDelta();
  mixer.update(dt);
}

function updateChaseCam() {
  chaseCamPivot.getWorldPosition(view);
  if (view.y < 1) view.y = 1;

  camera.position.lerpVectors(camera.position, view, 0.3);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRender.setSize(this.window.innerWidth, this.window.innerHeight);
}

window.addEventListener("resize", onWindowResize);
