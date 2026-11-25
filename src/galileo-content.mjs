export const content = [
  {
    id: "question",
    title: "How does a falling body gain speed?",
    level: "explore",
    paragraphs: [
      "Release a ball on a gentle ramp and track how far it travels in each second. Does it cover equal distances, or does each interval carry it farther than the last?",
      "A fixed incline makes the motion slower than vertical free fall. The ball still gains speed by equal amounts in equal times in the ideal model. Starting from rest, it takes twice as long to reach a mark four times as far from the start.",
    ],
  },
  {
    id: "history",
    title: "From motion as a description to motion as a measurement",
    level: "explore",
    paragraphs: [
      "Aristotelian accounts associated the speed of natural fall with an object’s weight and the medium through which it fell. Galileo examined how the speed of a single falling body changes with time and asked whether a measurable rule could describe that change.",
      "The timeline uses 1638, the year Galileo’s Discourses and Mathematical Demonstrations Concerning Two New Sciences appeared in Leiden. Galileo had investigated falling bodies earlier in his career. The publication brings together a definition of uniformly accelerated motion, mathematical results derived from it, and an account of ramp measurements.",
    ],
    references: [
      {
        label: "Museo Galileo, The Science of Motion",
        url: "https://catalogue.museogalileo.it/section/ScienceOfMotion.html",
      },
      {
        label: "Stanford Encyclopedia of Philosophy, Galileo Galilei",
        url: "https://plato.stanford.edu/entries/galileo/",
      },
    ],
  },
  {
    id: "apparatus",
    title: "A grooved board, a bronze ball, and a water clock",
    level: "explore",
    paragraphs: [
      "The Third Day of Two New Sciences describes a long wooden board with a straight groove lined with smooth parchment. Raising one end made a shallow slope for a round bronze ball. The account gives a board length of about 12 cubits and an elevation at one end of about one or two cubits.",
      "During each descent, the experimenters collected a thin stream of water from an elevated vessel. They weighed the collected water after the run. With a steady flow, the mass collected is proportional to elapsed time, so comparing the masses gives time ratios.",
      "The dialogue reports that a quarter of the channel took half the time for the whole channel and that other fractions followed the same rule after repeated trials at different slopes. These are reported relationships from the historical text. The virtual measurements are calculated from an idealized model.",
    ],
    references: [
      {
        label: "Galileo Galilei, Dialogues Concerning Two New Sciences, Third Day (H. Crew and A. de Salvio translation)",
        url: "https://en.wikisource.org/wiki/Dialogues_Concerning_Two_New_Sciences/Third_Day",
      },
    ],
  },
  {
    id: "pisa",
    title: "The Leaning Tower of Pisa story",
    level: "explore",
    paragraphs: [
      "In a biographical account written in 1654, Galileo’s student Vincenzo Viviani described Galileo dropping bodies of different weights from the tower in Pisa. The account appeared decades after the events it describes. Historians disagree about whether the demonstration took place as described.",
      "The underlying question can be tested directly. In 1971, Apollo 15 commander David Scott released a hammer and a feather together on the Moon. With negligible air resistance, they reached the surface together within the accuracy of the demonstration. In the local free-fall model, every released body has the same downward acceleration g when drag is negligible.",
    ],
    references: [
      {
        label: "Museo Galileo, Pisa and the account by Vincenzo Viviani",
        url: "https://brunelleschi.imss.fi.it/itineraries/itinerary/pisafollowingthepathofgalileo.html",
      },
      {
        label: "Museo Galileo, Galileo and the Science of Motion",
        url: "https://catalogue.museogalileo.it/multimedia/GalileoScienceMotionBis.html",
      },
      {
        label: "NASA, The Apollo 15 Hammer-Feather Drop",
        url: "https://science.nasa.gov/resource/the-apollo-15-hammer-feather-drop-2/",
      },
    ],
  },
  {
    id: "kinematics",
    title: "The square-time law",
    level: "understand",
    paragraphs: [
      "Take distance s and velocity v as positive downhill along the center’s path. Define s = 0 at release and θ as the angle from horizontal. For constant acceleration a and release from rest, integrating acceleration gives v = at. Integrating velocity yields the square-time law.",
      "The distances from the start after one, two, and three equal time intervals have the ratio 1:4:9. The distances covered within those intervals have the ratio 1:3:5. A plot of s against t² gives a straight line through the origin with slope a/2. The square-time law applies to both modes on a fixed ramp.",
    ],
    equations: [
      { text: "v(t) = a t", description: "Downhill velocity in meters per second, with t in seconds and a in meters per second squared." },
      { text: "s(t) = ½ a t²", description: "Distance from release in meters." },
      { text: "t_finish = √(2L / a)   (a > 0)", description: "Time to reach the end of a center-path length L. At zero incline the released body remains at rest." },
    ],
  },
  {
    id: "rolling",
    title: "Sliding and rolling on the same ramp",
    level: "understand",
    paragraphs: [
      "The component of the body’s weight along the ramp is mg sin θ. A nonspinning sphere on a frictionless plane has no contact torque and slides with acceleration g sin θ. In the rolling mode, static friction acts uphill and supplies the torque that increases the sphere’s spin. On a rigid stationary plane, the contact point of a sphere rolling without slipping is instantaneously at rest, so static friction does no work.",
      "Use f for the magnitude of uphill static friction, r for sphere radius, I for inertia about its center, and α for angular acceleration taken positive in the downhill rolling direction. Force balance along the plane and torque about the center give the acceleration below. The rolling sphere’s inertia is 2mr²/5, which produces the factor 5/7.",
      "Mass and radius cancel from the ideal center-of-mass acceleration. Changing mass changes the energies and forces. Changing the radius changes the angular speed required to roll at a given translational speed.",
    ],
    equations: [
      { text: "a_slide = g sin θ", description: "Acceleration on a frictionless ramp." },
      { text: "ma = mg sin θ − f,    I α = fr,    a = rα", description: "Downhill force balance, torque relation, and the no-slip constraint." },
      { text: "a_roll = g sin θ / (1 + I / mr²) = (5/7) g sin θ", description: "Center-of-mass acceleration for a homogeneous solid sphere rolling on one contact plane." },
      { text: "μₛ ≥ (2/7) tan θ", description: "Minimum static friction coefficient for the solid sphere to roll without slipping under the assumptions of the model." },
    ],
    references: [
      {
        label: "OpenStax, University Physics, §11.1: Rolling Motion",
        url: "https://openstax.org/books/university-physics-volume-1/pages/11-1-rolling-motion",
      },
    ],
  },
  {
    id: "worked-example",
    title: "Compare the two arrival times",
    level: "understand",
    paragraphs: [
      "Set a 2.00 m ramp at 30° and use g = 9.81 m/s². From rest, the sliding case accelerates at 4.905 m/s² and arrives in 0.9030 s. The solid sphere rolling without slipping accelerates at about 3.5036 m/s² and arrives in 1.0685 s. It needs about 18.3% more time for the same ramp.",
      "Both cases descend 1.00 m vertically. With a 0.25 kg sphere, each loses 2.4525 J of gravitational potential energy. At the finish the slider has that much translational kinetic energy. The rolling sphere has approximately 1.7518 J in translation and 0.7007 J in rotation.",
    ],
    equations: [
      { text: "U = mg(L − s) sin θ", description: "Potential energy in joules, with zero at the finish." },
      { text: "E = U + ½mv² + ½Iω²", description: "Total mechanical energy is constant in each ideal run. Angular speed ω is v/r in rolling mode and zero in sliding mode." },
    ],
  },
  {
    id: "model",
    title: "Time stepping and the limits of the model",
    level: "simulate",
    paragraphs: [
      "The lab advances its physical clock in steps of 1/120 s independently of the rendering frame rate. Acceleration is constant on a fixed ramp, so each step uses the exact constant-acceleration update. When a step would pass the end of the ramp, it is shortened to the calculated arrival time. Position, velocity, and energy can be checked against the analytical solution up to that event.",
      "The model assumes a fixed plane, steady uniform gravity, and a rigid solid sphere released from rest. It omits air resistance, rolling resistance, slipping, and deformation. The rolling case assumes sufficient static friction. The sliding case assumes frictionless contact, so the sphere retains zero angular velocity.",
      "Use 0° for a horizontal run from rest. The inclined runs accept angles from 0.1° to 60°. The lower limit keeps runs at very small accelerations manageable in the lab.",
      "Galileo’s reported groove could have supported the ball at multiple contacts. That geometry can change the relation between angular and translational speeds and therefore the acceleration. The flat-contact approximation here preserves the square-time relation and gives a reproducible ideal rolling case.",
    ],
    equations: [
      { text: "s_next = s + v Δt + ½a (Δt)²,    v_next = v + a Δt", description: "Exact step for constant acceleration over a time increment Δt." },
    ],
    references: [
      {
        label: "Ann-Marie Pendrill, Balls Rolling Down a Playground Slide: What Factors Influence Their Motion?",
        url: "https://portal.research.lu.se/en/publications/balls-rolling-down-a-playground-slide-what-factors-influence-thei/",
      },
    ],
  },
];
