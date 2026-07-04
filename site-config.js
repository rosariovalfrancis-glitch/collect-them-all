function showToast(msg) {
  var c = document.querySelector(".toast-container");
  if (!c) { c = document.createElement("div"); c.className = "toast-container"; document.body.appendChild(c); }
  var t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  c.appendChild(t);
  setTimeout(function () { t.classList.add("toast-out"); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250); }, 3000);
}

window.SITE_CONFIG = {
  messengerUrl: "https://m.me/YourPageName",
  featuredExpansion: {
    id: "chaos-rising",
    name: "Chaos Rising",
    tagline: "Available Now",
    description: "The hustle and bustle of the city turns into havoc as Mega Floette ex brings turmoil to the streets! Filled with courage and determination, Mega Greninja ex gathers other powerful Mega Evolution Pokemon ex, including Mega Pyroar ex and Mega Dragalge ex, to ward off this growing threat.",
    trailerId: "adNied8CUfE",
    trailerUrl: "https://youtu.be/adNied8CUfE",
    setFilter: "Chaos Rising",
    releaseDate: "May 22, 2026"
  },
  expansions: [
    {
      id: "chaos-rising",
      name: "Chaos Rising",
      apiSetId: "me4",
      imagePrefix: "me4",
      releaseDate: "May 22, 2026",
      tagline: "Available Now",
      description: "The hustle and bustle of the city turns into havoc as Mega Floette ex brings turmoil to the streets! Filled with courage and determination, Mega Greninja ex gathers other powerful Mega Evolution Pokemon ex, including Mega Pyroar ex and Mega Dragalge ex, to ward off this growing threat.",
      trailerId: "adNied8CUfE",
      trailerUrl: "https://youtu.be/adNied8CUfE",
      productSet: "Chaos Rising",
      cardCount: 122
    },
    {
      id: "perfect-order",
      name: "Perfect Order",
      apiSetId: "me3",
      imagePrefix: "me3",
      releaseDate: "March 27, 2026",
      tagline: "Available Now",
      description: "Order gives way to chaos as Mega Zygarde ex emerges to enforce balance! Trainers must adapt their strategies to contend with this formidable Legendary Pokemon ex, while new Supporters and Items reshape the competitive landscape.",
      trailerId: "ApnYdGSkIvM",
      trailerUrl: "https://youtu.be/ApnYdGSkIvM",
      productSet: "Perfect Order",
      cardCount: 120
    },
    {
      id: "ascended-heroes",
      name: "Ascended Heroes",
      apiSetId: "me2pt5",
      imagePrefix: "me2pt5",
      releaseDate: "January 30, 2026",
      tagline: "Available Now",
      description: "Heroes rise to the challenge as Mega Dragonite ex takes flight! This special expansion brings together powerful Dragon-type Pokemon ex alongside stunning Special Art cards that showcase the pinnacle of Pokemon TCG illustration.",
      trailerId: "aM6lTrQ3LAY",
      trailerUrl: "https://youtu.be/aM6lTrQ3LAY",
      productSet: "Ascended Heroes",
      cardCount: 295,
      viewAllUrl: "https://tcg.pokemon.com/en-us/galleries/ascended-heroes/"
    },
    {
      id: "phantasmal-flames",
      name: "Phantasmal Flames",
      apiSetId: "me2",
      imagePrefix: "me2",
      releaseDate: "November 14, 2025",
      tagline: "Available Now",
      description: "Ghostly flames illuminate the night as Mega Charizard X ex and Mega Gengar ex unleash their devastating power! This haunting expansion introduces the first Mega Evolution Pokemon ex in the new era.",
      trailerId: "Ifm-hBGwh30",
      trailerUrl: "https://youtu.be/Ifm-hBGwh30",
      productSet: "Phantasmal Flames",
      cardCount: 140
    },
    {
      id: "mega-evolution",
      name: "Mega Evolution",
      apiSetId: "me1",
      imagePrefix: "me1",
      releaseDate: "September 26, 2025",
      tagline: "Available Now",
      description: "The Mega Evolution era begins! Mega Lucario ex and Mega Gardevoir ex lead the charge in this landmark expansion that introduces the Mega Evolution mechanic to the Pokemon TCG. Discover powerful new Pokemon ex and game-changing Trainer cards.",
      trailerId: "DTfLZLFeCPA",
      trailerUrl: "https://youtu.be/DTfLZLFeCPA",
      productSet: "Mega Evolution",
      cardCount: 150
    }
  ]
};
