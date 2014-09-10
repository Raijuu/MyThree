function MySceneModule () {
  // private
  var scene,
    camera,
    renderer,

    // math and rendering
    clock=new THREE.Clock(true),
    dt = 2,
    last_time = 1,
    friction_factor = 1,

    // geometry
    electronSystem = {},
    electronSystemGeometry = new THREE.Geometry(),
    radius,
    group = new THREE.Object3D(),
    centerVertex = new THREE.Vector3(0,0,0),

    // debug
    context = {
      x : 0,
      y : 0
    },
    frame = 0;

  // public properties
  this.electrons = electronSystemGeometry.vertices;
  this.frame = frame;
  this.scene = scene;

  window.addEventListener('mousemove', function (e) {
    context.x = e.clientX;
    context.y = e.clientY;
  });

  // private immediate functions
  (function init () {
    // camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 400;

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    // scene
    scene = new THREE.Scene();
  }());

  (function setLights () {
    // add subtle ambient lighting
    var ambientLight = {},
      directionalLight = {};

    ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 2, 2).normalize();
    directionalLight.castShadow = true;

    scene.add(directionalLight);
  }());

  // public function definitions
  this.makeSystem = function (config) {
    // config {
    //  radius : int
    //  maxElectrons : int
    // }
    var maxElectrons = (config !== undefined) ? config.maxElectrons : 22;

    radius = (config !== undefined) ? config.radius : 400;

    electronSystem = new THREE.ParticleSystem(
      electronSystemGeometry,
      new THREE.ParticleBasicMaterial({
        wireframe : true,
        wireFrame : true,
        color: 0xaf00bf,
        size: radius / 2, // divide by 4
        transparent : true,
        opacity : 0.5
      })
    );

    // add all of the vertices now, because it is too costly
    // to add vertices dynamically, so is unsupported by three.js
    for (maxElectrons; maxElectrons > 0; maxElectrons -= 1) {
      this.electrons.push( new Electron( radius*4 ) );
    }
    scene.add(electronSystem);
    on_enter_frame();
  };

  function particleSpread (electron) {
    var electrons = electronSystemGeometry.vertices,
      len = electrons.length - 1,
      f = new ForceVector(),
      other_electron,

      fnew = new THREE.Vector3(),
      vmew = {},
      intensity = 100,
      friction = 1/( 1 + friction_factor ),
      clone = electron.clone(),
      dx,

      distance = 0,
      ratio;

    for (len; len > 0; len -= 1) {
      other_electron = electrons[len];
      if ( other_electron !== electron) {
        other_electron.multiplyScalar(1.001);
        f.accumulate_force_between( electron, other_electron );
      }
    }

    f.multiplyScalar(20);
    electron.add(f);
    distance = electron.distanceTo(centerVertex);
    ratio = radius / distance;
    electron.multiplyScalar(ratio * 0.8);
  }

  function placeGeometryAtPlatonicPoints (points) {
    scene.add(group);
    var len = points.length -1,
      x, y, z,
      geometry,
      parent = new THREE.Object3D(),
      mesh,
      material,
      color,
      r,
      stick,
      point,
      colorInc = 360/len,
      hue = colorInc;

    for (len; len >= 0; len -= 1) {
      geometry = new THREE.CubeGeometry( 40, 40, 15, 1, 1, 1 );
      // geometry = new THREE.CylinderGeometry(50, 30, 15, 6, 1, false);
      x = points[len].x;
      y = points[len].y;
      z = points[len].z;

      r = Math.sqrt(Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2));

      parent = new THREE.Object3D();
      scene.add( parent );

      stick = new THREE.Object3D();

      point = new THREE.Vector3( x, y, z );
      stick.lookAt( point );
      stick.originalVector = point;

      parent.add( stick );
      color = hslToRgb(hue/360, 1, 0.6);
      console.log({
        color : len/360
      });
      material = new THREE.MeshLambertMaterial({
        color : "rgb(" + Math.round(color[0]) + ", " + Math.round(color[1]) + ", " + Math.round(color[2]) + ")"
      });
      mesh = new THREE.Mesh( geometry, material );

      mesh.position.set( 0, 0, r );
      stick.add( mesh );

      group.add(parent);
      hue += colorInc;

    }
  }

  function on_enter_frame () {
    var electrons = electronSystemGeometry.vertices,
      len = electrons.length - 1;

    frame += 1;

    electronSystem.rotation.x += 0.005;
    electronSystem.rotation.y += 0.005;
//    group.rotation.x += 0.005;
//    group.rotation.y += 0.005;

    // how much time has passed since the last frame = dt
    dt = clock.getElapsedTime() - last_time;
    last_time = clock.getElapsedTime();
    friction_factor += dt;



    // request this function again for the next frame
    requestAnimationFrame( on_enter_frame );
    if (frame < 200) {
      for (len; len >= 0; len -= 1) {
        particleSpread(electrons[len]);
      }
    } else if (frame === 201) {
      scene.remove(electronSystem);
      placeGeometryAtPlatonicPoints(electrons);
    } else {
      groupEvents();
    }

    // animate those particles that need animating
    // inform three.js that we've moved the particles
    electronSystemGeometry.verticesNeedUpdate = true;

    // render the scene
    renderer.render( scene, camera );
  }

  function groupEvents () {
    var test = document.getElementById('cursorDetails'),
      x = context.x,
      y = context.y,
      distance = 1;

    (function distanceToCenter () {
      var center = {
          x : window.innerWidth / 2,
          y : window.innerHeight / 2
        };
        distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
        distance = Math.abs( 1 - distance / center.x) + 1; // distance = Math.abs( 1 - distance / center.x) + 1;
    }());

    (function groupRotation () {
      group.rotation.x += Math.abs(2 - distance) * 0.01;
      group.rotation.y += Math.abs(2 - distance) * 0.01;
    }());

    (function spread () {
      var len = group.children.length -1,
        geometry = {}, // group.children[index]...
        originalVector = {}; // group.children[index]...

      for (len; len >= 0; len -= 1) {
         geometry = group.children[len].children[0].children[0].geometry;
         stick = group.children[len].children[0];
         mesh = stick.children[0];
         console.log(originalVector);
         originalVector = group.children[len].children[0].originalVector.clone();

         originalVector.multiplyScalar(distance);

         r = Math.sqrt(Math.pow(originalVector.x, 2) + Math.pow(originalVector.y, 2) + Math.pow(originalVector.z, 2));

         stick.lookAt(originalVector);
         mesh.position.set( 0, 0, r );
         geometry.verticesNeedUpdate = true;
      }
    }());
  }
}

function hslToRgb(h, s, l){
    var r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb (p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}