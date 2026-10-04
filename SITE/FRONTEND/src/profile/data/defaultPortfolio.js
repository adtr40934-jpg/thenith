/**
 * defaultPortfolio.js
 * Empty placeholder schema for fallback initialization.
 * Real profile data is fetched dynamically from the Backend API.
 */

export const defaultPortfolio = {
  id: "",
  name: "",
  role: "",
  bio: "",
  avatar: "",
  coverImage: "",
  profileUrl: "",
  availableForWork: false,
  organization: "",
  contact: {
    phone: "",
    email: "",
    website: "",
    location: "",
    address: {
      city: "",
      region: "",
      country: "",
    },
  },
  socials: [],
  seo: {
    title: "Thenith Profile",
    description: "Digital profile powered by Thenith",
    keywords: [],
    image: "",
  },
};

export default defaultPortfolio;
