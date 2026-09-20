// Meters, Three.js axes: X right; Y up; Z toward the original headboard.
// Model origin in source centimeters: [1369, 637, 4.83726].
// Fresh inlet plan position follows user drawing 1788434914125(1).jpg.
// Its mounting height and display anchors remain adjustable exhibition assumptions.
export const config = {
  model: './assets/C-bedroom-wire.glb',
  duration:90,
  bed:{center:[-.38,.48,.32],width:1.46,length:1.94},
  fresh:{position:[-1.75,2.5,1.25]},
  // Cbg2.mp4 white square between window and bed; height is illustrative.
  ac:{position:[.68,2.5,.03],size:[.44,.08,.44]},
  heat:{position:[1.8,.85,.26]},
  // Broad wall projection above the bed: illustrative 3.0m width, standard 16:9.
  projection:{position:[-.38,1.79,1.455],size:[3.0,1.6875]},
  digitalWindow:{position:[1.81,1.51,.32],size:[1.25,1.24]},
  views:{home:[-5.3,4.6,-6.1],top:[-.1,8,-.15]},
};
