// Real artist data (names, Qloo image URLs, Spotify IDs, affinities, tags) copied from the
// captured API responses in scripts/fixtures/ (06-insights-recommend-artists.json and
// 12-insights-location-artists.json). Static: the landing page makes no API calls.
// Regenerate by re-running scripts/test-qloo-endpoints.js and copying the same fields.

export interface LandingArtist {
  name: string;
  imageUrl: string;
  spotifyId: string;
  /** Qloo query.affinity (0-1) from the Stranger Things recommendation run, or 1.000 for the location run. */
  affinity: number;
  tags: string[];
}

export const LANDING_ARTISTS: Record<string, LandingArtist> = {
  "girl in red": {
    "name": "girl in red",
    "imageUrl": "https://images.qloo.com/i/716A6B01-D1C4-4991-91A8-0204D65225EB-420x-auto.jpg",
    "spotifyId": "0eimViBlWl2DqivQVmG1uA",
    "affinity": 0.935,
    "tags": [
      "Emotive",
      "Lo-Fi",
      "Emotive Indie Rock"
    ]
  },
  "Harry Styles": {
    "name": "Harry Styles",
    "imageUrl": "https://images.qloo.com/i/5D28EDAC-F84F-42EB-8DB3-28EC65330287-420x-auto.jpg",
    "spotifyId": "6KImCVD70vtIoJWnq6nGn3",
    "affinity": 0.935,
    "tags": [
      "Folk Rock",
      "Glam Rock",
      "Energetic"
    ]
  },
  "Billie Eilish": {
    "name": "Billie Eilish",
    "imageUrl": "https://images.qloo.com/i/D7BCE4CD-5135-4608-8A7D-78E08FFD52F3-420x-auto.jpg",
    "spotifyId": "6qqNVTkY8uBg9cP3Jd7DAH",
    "affinity": 0.934,
    "tags": [
      "Expressive",
      "Minimalist",
      "Indie Electro Ballad"
    ]
  },
  "Olivia Rodrigo": {
    "name": "Olivia Rodrigo",
    "imageUrl": "https://images.qloo.com/i/087EF30C-3367-49B8-AC58-8B8C01D69DB6-420x-auto.jpg",
    "spotifyId": "1McMsnEElThX1knmY4oliG",
    "affinity": 0.933,
    "tags": [
      "Indie Pop Rock",
      "Youthful Anthems",
      "Pop"
    ]
  },
  "Mitski": {
    "name": "Mitski",
    "imageUrl": "https://images.qloo.com/i/E3BD2650-8E5C-43FB-B5A7-C1C7753A6293-420x-auto.jpg",
    "spotifyId": "2uYWxilOVlUdk4oV9DvwqK",
    "affinity": 0.933,
    "tags": [
      "Emotive Balladry",
      "Indie Pop",
      "Experimental Alternative"
    ]
  },
  "Clairo": {
    "name": "Clairo",
    "imageUrl": "https://images.qloo.com/i/9B2140E4-8DEB-452C-BB75-C3B7B6AD198E-420x-auto.jpg",
    "spotifyId": "3l0CmX0FuQjFxr8SK7Vqag",
    "affinity": 0.931,
    "tags": [
      "Lo-Fi Indie",
      "Dreamy",
      "Melodic"
    ]
  },
  "Conan Gray": {
    "name": "Conan Gray",
    "imageUrl": "https://images.qloo.com/i/97A06C30-99BE-47A8-BD7E-D6DDD4504137-420x-auto.jpg",
    "spotifyId": "4Uc8Dsxct0oMqx0P6i60ea",
    "affinity": 0.927,
    "tags": [
      "Indie Pop",
      "American",
      "Melodic"
    ]
  },
  "Suki Waterhouse": {
    "name": "Suki Waterhouse",
    "imageUrl": "https://images.qloo.com/i/4607C481-A992-456F-900E-46AB836351EF-420x-auto.jpg",
    "spotifyId": "5GGJosGMs08YEmKTZJe1fL",
    "affinity": 0.926,
    "tags": [
      "Indie Pop",
      "Dream Pop",
      "Melodic"
    ]
  },
  "Kate Bush": {
    "name": "Kate Bush",
    "imageUrl": "https://images.qloo.com/i/BAC6AB43-13D1-49F8-A315-9CB97C029858-420x-auto.jpg",
    "spotifyId": "1aSxMhuvixZ8h9dK9jIDwL",
    "affinity": 0.925,
    "tags": [
      "Synthpop",
      "Experimental",
      "Innovative"
    ]
  },
  "The Psychedelic Furs": {
    "name": "The Psychedelic Furs",
    "imageUrl": "https://images.qloo.com/i/97869186-03D4-4D6F-9F46-18D9A4D72411-420x-auto.jpg",
    "spotifyId": "0O0lrN34wrcuBenkqlEDZe",
    "affinity": 0.924,
    "tags": [
      "Melodic Post-Punk",
      "Pop Rock",
      "Psychedelic Rock"
    ]
  },
  "Björk": {
    "name": "Björk",
    "imageUrl": "https://images.qloo.com/i/01381184-B533-4E3C-B9DB-43A2FE326744-420x-auto.jpg",
    "spotifyId": "3HDfNAh4MpiptvaJP9We0w",
    "affinity": 1,
    "tags": [
      "Indie Pop",
      "Orchestral",
      "Art Pop"
    ]
  },
  "Solange": {
    "name": "Solange",
    "imageUrl": "https://images.qloo.com/i/9BC770A7-3369-4BB8-A79E-E3440D308489-420x-auto.jpg",
    "spotifyId": "2auiVi8sUZo17dLy1HwrTU",
    "affinity": 1,
    "tags": [
      "Hip-Hop",
      "Avant-Garde Pop",
      "Neo Soul"
    ]
  },
  "FKA twigs": {
    "name": "FKA twigs",
    "imageUrl": "https://images.qloo.com/i/FD7E4822-C2DA-4F78-896E-D5F2E22CFFC8-420x-auto.jpg",
    "spotifyId": "6nB0iY1cjSY1KyhYyuIIKH",
    "affinity": 1,
    "tags": [
      "Avant-Garde",
      "Trip Hop",
      "Electronic"
    ]
  },
  "Diplo": {
    "name": "Diplo",
    "imageUrl": "https://images.qloo.com/i/C0DD298A-4109-4D49-B4A1-F052AFBC6772-420x-auto.jpg",
    "spotifyId": "5fMUXHkw8R8eOP2RNVYEZX",
    "affinity": 1,
    "tags": [
      "Moombahton",
      "Dance",
      "House"
    ]
  },
  "Lizzo": {
    "name": "Lizzo",
    "imageUrl": "https://images.qloo.com/i/2D1676A1-EC6D-482C-A778-4B2BAAD2D92E-420x-auto.jpg",
    "spotifyId": "56oDRnqbIiwx4mymNEv7dS",
    "affinity": 1,
    "tags": [
      "Funk",
      "Pop",
      "Soulful"
    ]
  }
};

export const artist = (name: string): LandingArtist => {
  const a = LANDING_ARTISTS[name];
  if (!a) throw new Error(`Unknown landing artist: ${name}`);
  return a;
};
