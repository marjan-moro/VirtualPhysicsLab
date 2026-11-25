export const content = [
  {
    id: "question",
    title: "Why do objects float?",
    level: "explore",
    paragraphs: [
      "A steel ship can float even though a solid block of steel sinks. How much water must each push aside for the water to support it?",
      "Archimedes’ principle says that the upward push on an immersed body equals the weight of the fluid it displaces. A floating ship settles to the waterline where that push balances its weight. The enclosed space in the hull lets the ship displace a large volume of water for its mass.",
    ],
    references: [
      {
        label: "OpenStax, University Physics, §14.4: Archimedes’ principle and buoyancy",
        url: "https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy",
      },
    ],
  },
  {
    id: "history",
    title: "Archimedes and floating bodies",
    level: "explore",
    paragraphs: [
      "Archimedes lived in Syracuse, Sicily, in the third century BCE. In On Floating Bodies he gave a mathematical treatment of familiar observations about objects in water. Book I shows that a floating body displaces fluid equal to its own weight and treats the apparent loss of weight when a dense body is immersed.",
      "The surviving treatise gives propositions and geometric proofs. The timeline’s approximate date places the work in Archimedes’ lifetime. The date of the discovery and details of any contemporary trial are uncertain.",
    ],
    references: [
      {
        label: "Archimedes, On Floating Bodies, Book I, propositions 5 and 7 (T. L. Heath edition)",
        url: "https://doi.org/10.1017/CBO9780511695124.019",
      },
      {
        label: "University of St Andrews, MacTutor biography of Archimedes",
        url: "https://mathshistory.st-andrews.ac.uk/Biographies/Archimedes/",
      },
    ],
  },
  {
    id: "crown",
    title: "The golden crown story",
    level: "explore",
    paragraphs: [
      "Writing roughly two centuries later, the Roman author Vitruvius tells how King Hiero II of Syracuse asked Archimedes to find out whether a goldsmith had substituted silver for some of the gold in a crown. In the story, Archimedes saw water overflow as he stepped into his bath and realized that he could compare the crown’s volume with that of an equal mass of pure gold.",
      "Vitruvius describes immersing the crown and equal masses of gold and silver in turn in a brim-full vessel, measuring how much water was needed to refill it each time. At equal mass, the denser material occupies less space. A larger displaced volume would have indicated a lower average density for the crown.",
      "The account is a later anecdote. Measuring a small difference by overflow would have been difficult with the reported apparatus, and the surviving treatise gives no account of the crown test.",
    ],
    references: [
      {
        label: "Vitruvius, On Architecture, Book IX, preface §§9–12",
        url: "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/9%2A.html",
      },
      {
        label: "Museo Galileo, Vitruvius and Archimedes",
        url: "https://exhibits.museogalileo.it/archimedes/section/VitruviusArchimedes.html",
      },
      {
        label: "Chris Rorres, The Golden Crown, New York University archive",
        url: "https://math.nyu.edu/Archimedes/Crown/CrownIntro.html",
      },
    ],
  },
  {
    id: "applications",
    title: "From ship hulls to hydrometers",
    level: "explore",
    paragraphs: [
      "Loading a floating ship increases its weight and lowers the hull until the extra displaced water balances the added load. In denser seawater the same ship needs a smaller displaced volume than in fresh water. The corresponding draft depends on the hull shape.",
      "A hydrometer uses the same equilibrium to measure liquid density. Its stem rises higher in a denser liquid, where a smaller submerged volume supplies the required buoyant force. Precision calibration accounts for effects such as surface tension at the stem.",
    ],
    references: [
      {
        label: "University of Hawaiʻi at Mānoa, Transportation and Ship Design",
        url: "https://manoa.hawaii.edu/exploringourfluidearth/physical/navigation-and-transportation/transportation-and-ship-design",
      },
      {
        label: "NIST Special Publication 250-78r1, Calibration Services for Hydrometers",
        url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.250-78r1.pdf",
      },
    ],
  },
  {
    id: "pressure",
    title: "Hydrostatic pressure and buoyant force",
    level: "understand",
    paragraphs: [
      "Take depth h to be positive downward from the undisturbed liquid surface. A thin, horizontal slice of stationary liquid is held in equilibrium by the pressure difference across its faces. The excess upward pressure force from below balances the slice’s weight. Integrating from the surface gives a pressure increase proportional to depth for constant liquid density and gravity.",
      "For an upright cuboid the pressure on vertical sides has no vertical component. The horizontal bottom and top faces have the same area A. The bottom experiences the greater pressure while immersed, so the difference in gauge pressure across the faces, multiplied by A, gives the buoyant force. Above the liquid the gauge pressure is zero under the model’s negligible air buoyancy assumption.",
      "The same result holds for other shapes in a static fluid. Imagine replacing the submerged object volume with a parcel of liquid. Pressure forces on the parcel’s boundary must support its weight. Restoring the object changes what occupies that region while leaving the surrounding hydrostatic pressure at the boundary the same.",
    ],
    equations: [
      { text: "dp/dh = ρf g", description: "The hydrostatic pressure gradient with depth in the liquid. ρf is liquid density and g is the magnitude of gravitational acceleration." },
      { text: "p − pₛ = ρf g h   (h ≥ 0)", description: "Gauge pressure in pascals relative to the surface pressure pₛ." },
      { text: "Fᵦ = A (p_b − p_t) = ρf g Vd", description: "Upward buoyant force in newtons. p_b and p_t are the bottom and top gauge pressures, and Vd is the displaced liquid volume in cubic meters." },
    ],
    references: [
      {
        label: "OpenStax, University Physics, §14.1: Fluids, density, and pressure",
        url: "https://openstax.org/books/university-physics-volume-1/pages/14-1-fluids-density-and-pressure",
      },
      {
        label: "OpenStax, University Physics, §14.4: Archimedes’ principle and buoyancy",
        url: "https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy",
      },
    ],
  },
  {
    id: "equilibrium",
    title: "Floating, sinking, and apparent weight",
    level: "understand",
    paragraphs: [
      "Take vertical force as positive upward. A body’s weight has magnitude W and points down. Its apparent weight in the lab is the signed external force needed to hold its selected position. A positive value calls for upward support, as from a suspension scale under tension. A negative value calls for downward restraint.",
      "For a freely floating object, equilibrium occurs when the submerged volume fraction equals the ratio of the object density to the fluid density. If the ratio is less than one, the object can balance at the surface. If the ratio is exactly one, a fully submerged object is neutrally buoyant. If the ratio exceeds one, even full submersion supplies too little buoyancy and the body would descend when released.",
    ],
    equations: [
      { text: "W = ρo g V", description: "Weight magnitude in newtons for a homogeneous object of density ρo and total volume V." },
      { text: "Fhold = W − Fᵦ", description: "Signed vertical holding force required for equilibrium at the selected immersion." },
      { text: "Vd / V = ρo / ρf", description: "Equilibrium submerged fraction for a freely floating body when its density is less than the liquid density." },
    ],
  },
  {
    id: "measurement",
    title: "Measure buoyancy from a force difference",
    level: "understand",
    paragraphs: [
      "For a dense object, record the upward holding force with the body out of the liquid. Record it again with the body fully submerged and away from the sides and bottom. The difference gives the buoyant force. Use the known liquid density and gravity to infer displaced volume, then infer the object density using the dry weight.",
      "To test the pressure model, record buoyancy at several immersion depths. Plot buoyancy against displaced volume. The ideal slope is the liquid’s weight per unit volume, ρf g. As a fully submerged body goes deeper, pressure on each face increases while the pressure difference across the body stays constant.",
      "Measurements recorded in this virtual lab are calculated values for the selected inputs. A physical experiment would also have uncertainty from the scale, liquid density, temperature, depth readings, and any bubbles attached to the object.",
    ],
    equations: [
      { text: "Vd = (W − Fhold) / (ρf g)", description: "Infer displaced volume from the drop in the holding force." },
      { text: "ρo = ρf W / (W − Fhold)   (fully submerged)", description: "Infer object density by using the dry weight and the holding force at full immersion." },
    ],
  },
  {
    id: "model",
    title: "Static model and limits",
    level: "simulate",
    paragraphs: [
      "The model evaluates a rigid, homogeneous cuboid with horizontal faces. Its dimensions L, b, and H are measured in meters. Set d to the signed depth of the bottom face relative to the undisturbed surface. The top face is at depth d − H. Only the portion of the cuboid inside the liquid contributes to displaced volume, so submerged height is bounded by zero and H by geometry.",
      "The fluid is at rest with uniform density and uniform gravity. The free surface remains flat and fixed as the block moves. Each selected immersion is evaluated using the cuboid’s exact geometry. Air buoyancy, surface tension, drag, changes in the free surface, wall contact, bottom contact, and rotation are outside the model. The predicted sinking case is a force-balance result. The lab does not integrate a trajectory.",
      "An analytical check uses a cube with 0.20 m sides and density 600 kg/m³, in a liquid of density 1,000 kg/m³ with g = 9.81 m/s². The floating bottom is 0.120 m below the surface, and at that point the displaced volume is 0.0048 m³ and both weight and buoyancy are 47.088 N. Fully immersed, its buoyancy rises to 78.480 N and the signed holding force is −31.392 N.",
    ],
    equations: [
      { text: "V = L b H", description: "Total cuboid volume." },
      { text: "Vd = L b min(H, max(0, d))", description: "Immersed volume at the selected signed bottom-face depth d." },
      { text: "d = H ρo / ρf   (ρo < ρf)", description: "Bottom-face depth at free-floating equilibrium in the orientation shown." },
    ],
  },
];
