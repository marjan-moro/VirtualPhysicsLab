export const content = [
  {
    id: "question",
    title: "How far is it around Earth?",
    level: "explore",
    paragraphs: [
      "Imagine setting up two vertical sticks, one due north of the other. At local solar noon, compare their shadows. If the sticks have the same height, a difference in shadow length or direction reveals a difference in the direction of local vertical. On a sphere the two verticals point away from the same center.",
      "The angle between those verticals tells you what fraction of a full turn lies between the sites. Measure the distance along that arc and divide by the fraction to infer the distance around Earth.",
    ],
  },
  {
    id: "history",
    title: "Eratosthenes and the small arc",
    level: "explore",
    paragraphs: [
      "By the fourth century BCE, Aristotle had already argued for a spherical Earth from its curved shadow on the Moon during eclipses and the change in visible stars as people travel north or south. He also reported an earlier circumference estimate without giving its calculation. Eratosthenes of Cyrene later put a size on the globe using a method for which important details survive. The timeline places his work around 240 BCE.",
      "Eratosthenes’ own account is lost. In a later text, Cleomedes describes a comparison between Syene, near present-day Aswan, and Alexandria. The account treats the Sun as directly overhead at Syene at noon near the June solstice. In Alexandria a gnomon, the part of a sundial that casts the shadow, marks an angle of one-fiftieth of a full turn in the curved bowl of the dial. The method assumes parallel sunlight and treats the sites as lying on the same meridian.",
      "Cleomedes gives the baseline as 5,000 stades and the resulting circumference as 250,000 stades. Other ancient sources give 252,000 stades, and historians have proposed several explanations for the difference. The length of the stade Eratosthenes used and how the baseline was obtained are uncertain. Different unit conversions therefore give different modern distances and different estimates of the measurement’s accuracy.",
    ],
    references: [
      {
        label: "Aristotle, On the Heavens, Book II, chapter 14 (J. L. Stocks translation)",
        url: "https://original.sacred-texts.com/cla/ari/oth/oth26.htm",
      },
      {
        label: "Cleomedes, The Heavens, Book I, chapter 7 (A. C. Bowen and R. B. Todd translation)",
        url: "https://doi.org/10.1525/california/9780520233256.003.0008",
      },
      {
        label: "American Astronomical Society, Eratosthenes and the Circumference of the Earth",
        url: "https://aas.org/posts/news/2019/05/month-astronomical-history-june",
      },
      {
        label: "American Physical Society, Eratosthenes Measures the Earth",
        url: "https://www.aps.org/apsnews/2006/06/eratosthenes-measures-earth",
      },
      {
        label: "C. C. Carman and J. Evans, The Two Earths of Eratosthenes (Isis, 2015)",
        url: "https://doi.org/10.1086/681034",
      },
    ],
  },
  {
    id: "observations",
    title: "Measuring at solar noon",
    level: "explore",
    paragraphs: [
      "A modern version uses two sites on one meridian and a vertical stick on level ground at each site. Choose a day when both sites have direct sunlight at local solar noon, when the Sun crosses the local meridian. Use a solar transit prediction or track the shadow near its daily minimum. Local solar noon can differ from 12:00 on the clock.",
      "Measure each stick’s vertical height and the north–south displacement of its shadow tip from the foot of the stick. Record whether the shadow lies north or south. If the latitude where the Sun is overhead lies between the two sites, the shadows point in opposite directions and the two unsigned angles add. An overhead Sun at either site is a convenient special case that makes one angle zero.",
      "The baseline is the surface distance along the meridian arc. A road or river route may be longer, and the straight line through Earth between the sites is a chord. Use a distance corresponding to the arc you are measuring.",
    ],
    references: [
      {
        label: "Sandia National Laboratories, Basic Solar Position Models",
        url: "https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/sun-position/basic-solar-position-models/",
      },
    ],
  },
  {
    id: "geometry",
    title: "From shadow lengths to circumference",
    level: "understand",
    paragraphs: [
      "Let latitude φ and solar declination δ be positive north of the equator. Solar declination is the latitude at which the Sun is directly overhead at solar noon in the model. At either site, let h be the positive vertical height of the stick and x the signed horizontal displacement of its shadow tip, positive north. At solar noon the light, stick, and shadow lie in the local meridian plane. The right triangle gives a signed zenith angle ζ, positive when the Sun is south of the zenith and the shadow points north.",
      "On a sphere with parallel sunlight the signed zenith angle is φ − δ. Subtract the southern measurement from the northern measurement. With the same declination at both sites, δ cancels and the positive difference is the angle subtended at Earth’s center. The arc-length formula yields the radius and circumference directly.",
    ],
    equations: [
      { text: "ζ = atan2(x, h) = φ − δ", description: "The angle is in radians internally. This shadow relation requires the Sun to be above the geometric horizon." },
      { text: "θ = ζₙ − ζₛ = φₙ − φₛ", description: "Angular separation in radians, with the northern site at greater latitude." },
      { text: "s = R θ", description: "Meridian arc length s and spherical radius R are both in meters." },
      { text: "R = s / θ,    C = 2π s / θ", description: "Inferred spherical radius R and circumference C in meters. With θ in degrees, C = 360° × s / θ." },
    ],
    references: [
      {
        label: "NOAA Global Monitoring Laboratory, General Solar Position Calculations",
        url: "https://gml.noaa.gov/grad/solcalc/solareqns.PDF",
      },
    ],
  },
  {
    id: "worked-example",
    title: "A worked measurement",
    level: "understand",
    paragraphs: [
      "In an illustrative modern measurement, place two 1 m sticks 800 km apart along a meridian. The southern stick has a zero-length shadow. The northern stick’s shadow points north and measures tan(7.2°) m, or approximately 0.12633 m. This setup uses ideal values for a worked check.",
      "The angular difference is 7.2°, or one-fiftieth of the circle. The inferred circumference is 50 × 800 km = 40,000 km, and the corresponding spherical radius is about 6,366.20 km.",
      "Use the model to vary solar declination while holding the site geometry fixed. Each shadow changes and can reverse direction. Subtracting the signed angles still gives the same central angle while both sites receive direct sunlight.",
    ],
  },
  {
    id: "model",
    title: "What the model assumes",
    level: "simulate",
    paragraphs: [
      "The calculation treats Earth as a sphere, local verticals as radial, and sunlight as parallel at the two sites. It uses a common solar declination at local solar noon. The forward calculation places the northern site by adding s / R to the southern site’s latitude and calculates each ideal shadow as h tan(φ − δ). The inverse calculation infers radius from the baseline and the supplied signed shadow measurements.",
      "The model excludes terrain slope, tilted sticks, the finite angular width of the Sun, and atmospheric refraction. A low Sun gives a long shadow and makes a real measurement sensitive to the horizon and refraction. At or below the geometric horizon the direct-shadow construction has no finite solution. The lab requires the Sun to be at least 1° above the horizon at both stations. Coincident angles give no radius estimate for a positive baseline.",
      "Alexandria and the historical site of Syene differ by about 3° in longitude, and Syene lay near the ancient solstitial tropic. Their sky readings and geographic separation only approximate the ideal geometry. At different longitudes, separate local noons can still give a latitude difference if declination barely changes between observations. The distance used with that difference must correspond to the north–south meridian arc. A diagonal distance between the cities has a different geometry.",
    ],
    equations: [
      { text: "φₙ = φₛ + s / R", description: "The modeled northern latitude follows from the meridian baseline and the reference sphere’s radius." },
      { text: "x = h tan(φ − δ),    |φ − δ| < π / 2", description: "Predicted north–south shadow displacement for a positive stick height when the Sun is above the horizon." },
    ],
    references: [
      {
        label: "I. Tupikova, A common-sense approach to the problem of the itinerary stadion (2022)",
        url: "https://doi.org/10.1007/s00407-022-00287-6",
      },
      {
        label: "NOAA Global Monitoring Laboratory, Solar Calculator glossary",
        url: "https://gml.noaa.gov/grad/solcalc/glossary.html",
      },
    ],
  },
  {
    id: "uncertainty",
    title: "Why small angles are sensitive to error",
    level: "simulate",
    paragraphs: [
      "Circumference is proportional to the baseline and inversely proportional to the angle. At fixed baseline, a small error in the angle makes a larger relative difference when the two sites are close in latitude. With independent small baseline and angular uncertainties, differentiation gives the first-order estimate below.",
      "For example, with a baseline of 800 km and angular difference of 7.2°, illustrative standard uncertainties of 5 km and 0.1° would give about 610 km of standard uncertainty in the circumference. Consistently measuring a road route instead of a meridian arc would introduce bias in addition to random uncertainty.",
    ],
    equations: [
      { text: "σC / C ≈ √[(σs / s)² + (σθ / θ)²]", description: "First-order relative standard uncertainty for independent errors in baseline and angular separation. Use the same angular unit for σθ and θ." },
    ],
    references: [
      {
        label: "Joint Committee for Guides in Metrology, Guide to the Expression of Uncertainty in Measurement, §5.1",
        url: "https://www.bipm.org/en/doi/10.59161/jcgm100-2008e",
      },
    ],
  },
  {
    id: "geodesy",
    title: "From meridian arcs to geodesy",
    level: "explore",
    paragraphs: [
      "Meridian measurements connect local angles and distances to the geometry of the whole planet. Comparing measured curvature at different latitudes helped establish that Earth is slightly flattened at the poles. Modern geodesy uses models such as the WGS 84 reference ellipsoid, which has a longer equatorial radius and a shorter polar radius.",
      "The laboratory uses a comparison sphere with a radius of 6,371.0088 km, the rounded arithmetic mean of the three WGS 84 semi-axes. A precision calculation on the ellipsoid uses the curvature appropriate to the latitude and direction of the measured arc. Reference ellipsoids help define consistent coordinates for mapping, surveying, and satellite navigation.",
    ],
    references: [
      {
        label: "NOAA National Geodetic Survey, Reference datums and ellipsoids",
        url: "https://geodesy.noaa.gov/docs/datums.html",
      },
    ],
  },
];
