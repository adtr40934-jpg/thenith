/**
 * scripts/test-seo.js
 * Verification and regression test suite for Thenith SEO engine.
 */

import {
  formatProfileTitle,
  formatProfileDescription,
  buildProfileJsonLd,
  normalizeCanonicalUrl,
  getProfileSeoData,
  getLandingPageSeoData,
  getNotFoundSeoData,
  extractProfileSameAs,
  buildBreadcrumbJsonLd,
} from "../src/utils/seo.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("=== RUNNING THENITH TECHNICAL SEO REGRESSION TESTS ===\n");

// 1. Landing Page Metadata
console.log("1. Testing Landing Page Metadata (Arabic & English)...");
const landingAr = getLandingPageSeoData("ar");
assert(landingAr.title.includes("Thenith"), "Landing AR title contains 'Thenith'");
assert(landingAr.description.length > 50, "Landing AR description has sufficient depth");
assert(landingAr.canonicalUrl === "https://thenith.com/", "Landing AR canonical is 'https://thenith.com/'");
assert(landingAr.jsonLd["@graph"].some((item) => item["@type"] === "WebSite"), "Landing JSON-LD contains WebSite");
assert(landingAr.jsonLd["@graph"].some((item) => item["@type"] === "Organization"), "Landing JSON-LD contains Organization");

const landingEn = getLandingPageSeoData("en");
assert(landingEn.title.includes("Smart Digital Cards"), "Landing EN title has English keywords");
assert(landingEn.lang === "en" && landingEn.dir === "ltr", "Landing EN sets lang=en and dir=ltr");

// 2. Complete Personal Profile
console.log("\n2. Testing Complete Personal Profile...");
const fullPersonalProfile = {
  name: "Adam Tarek",
  role: "Graphic Designer & Video Editor",
  company: "Creative Studio",
  bio: "Senior visual designer specializing in brand identity, motion graphics, and UI design.",
  username: "adamtarek",
  publicId: "a1b2c3",
  avatar: "https://res.cloudinary.com/fib5gseo/image/upload/v12345/avatar.jpg",
  coverImage: "https://res.cloudinary.com/fib5gseo/image/upload/v12345/cover.jpg",
  links: [
    { title: "LinkedIn", url: "https://linkedin.com/in/adamtarek" },
    { title: "Behance", url: "https://behance.net/adamtarek" },
  ],
  contacts: [{ type: "email", value: "adam@example.com" }],
};

const fullPersonalSeo = getProfileSeoData(fullPersonalProfile);
assert(
  fullPersonalSeo.title === "Adam Tarek — Graphic Designer & Video Editor at Creative Studio | Thenith",
  `Personal profile title format: "${fullPersonalSeo.title}"`
);
assert(
  fullPersonalSeo.canonicalUrl === "https://thenith.com/p/adamtarek",
  `Canonical URL uses username: ${fullPersonalSeo.canonicalUrl}`
);
assert(
  fullPersonalSeo.openGraph.image === fullPersonalProfile.coverImage,
  "Open Graph image prioritizes cover image when available"
);
assert(
  fullPersonalSeo.robots === "index, follow",
  "Eligible public profile has robots 'index, follow'"
);

const personalJsonLd = fullPersonalSeo.jsonLd;
assert(personalJsonLd["@graph"].some((item) => item["@type"] === "ProfilePage"), "ProfilePage type present in JSON-LD");
const personNode = personalJsonLd["@graph"].find((item) => item["@type"] === "Person");
assert(personNode && personNode.name === "Adam Tarek", "Person entity has correct name in JSON-LD");
assert(personNode.jobTitle === "Graphic Designer & Video Editor", "Person entity has correct jobTitle in JSON-LD");
assert(personNode.worksFor?.name === "Creative Studio", "Person entity has correct worksFor in JSON-LD");
assert(personNode.sameAs?.includes("https://linkedin.com/in/adamtarek"), "Person entity includes social links in sameAs");

// 3. Personal Profile with Missing Optional Fields
console.log("\n3. Testing Personal Profile with Missing Optional Fields...");
const sparsePersonalProfile = {
  name: "Sarah Ahmed",
  role: "",
  company: "",
  bio: "",
  username: "sarah",
  publicId: "s1s2s3",
  avatar: "",
  links: [],
};
const sparseSeo = getProfileSeoData(sparsePersonalProfile);
assert(sparseSeo.title === "Sarah Ahmed | Thenith", `Sparse profile title: "${sparseSeo.title}"`);
assert(sparseSeo.description.includes("Sarah Ahmed"), "Fallback description gracefully includes name without fabrication");
assert(!sparseSeo.description.includes("undefined"), "Description contains no undefined artifacts");
assert(sparseSeo.canonicalUrl === "https://thenith.com/p/sarah", "Sparse profile has correct canonical URL");
const sparseJsonLd = sparseSeo.jsonLd;
const sparsePerson = sparseJsonLd["@graph"].find((item) => item["@type"] === "Person");
assert(sparsePerson && !sparsePerson.jobTitle, "Missing jobTitle not fabricated in JSON-LD");
assert(!sparsePerson.worksFor, "Missing company not fabricated in JSON-LD");

// 4. Business Profile
console.log("\n4. Testing Business Profile...");
const businessProfile = {
  isBusiness: true,
  name: "Brand ADV",
  company: "Brand ADV",
  role: "Advertising and Creative Services",
  bio: "Full-service digital branding agency delivering high-impact campaigns across Egypt.",
  username: "brandadv",
  publicId: "b9z8y7",
  avatar: "https://res.cloudinary.com/fib5gseo/image/upload/v12345/brandlogo.png",
  links: [{ title: "Website", url: "https://brandadv.com" }],
};

const businessSeo = getProfileSeoData(businessProfile);
assert(
  businessSeo.title === "Brand ADV — Advertising and Creative Services | Thenith",
  `Business profile title: "${businessSeo.title}"`
);
const businessJsonLd = businessSeo.jsonLd;
const orgNode = businessJsonLd["@graph"].find((item) => item["@type"] === "Organization");
assert(orgNode && orgNode.name === "Brand ADV", "Organization entity present instead of Person");
assert(orgNode.sameAs?.includes("https://brandadv.com"), "Organization includes website in sameAs");

// 5. Private / Inactive Profile
console.log("\n5. Testing Private / Inactive Profile...");
const privateProfile = {
  name: "Secret User",
  username: "secret",
  isPrivate: true,
};
const privateSeo = getProfileSeoData(privateProfile);
assert(privateSeo.robots === "noindex, nofollow", "Private profile sets 'noindex, nofollow'");
assert(privateSeo.jsonLd === null, "Private profile emits no structured entity data");

const inactiveProfile = {
  name: "Inactive User",
  username: "inactive",
  isActive: false,
};
const inactiveSeo = getProfileSeoData(inactiveProfile);
assert(inactiveSeo.robots === "noindex, nofollow", "Inactive profile sets 'noindex, nofollow'");

// 6. Not Found Profile / 404
console.log("\n6. Testing 404 / Non-existent Profile...");
const notFoundProfileSeo = getProfileSeoData(null);
assert(notFoundProfileSeo.robots === "noindex, nofollow", "Null profile sets 'noindex, nofollow'");
assert(notFoundProfileSeo.title.includes("غير موجود"), "Null profile title indicates not found");

// 7. Canonical URL Normalization
console.log("\n7. Testing Canonical URL Normalization...");
assert(normalizeCanonicalUrl("https://thenith.com/p/adam/") === "https://thenith.com/p/adam", "Trailing slash stripped on profile URL");
assert(normalizeCanonicalUrl("https://thenith.com/") === "https://thenith.com/", "Root slash preserved");
assert(
  normalizeCanonicalUrl("https://thenith.com/p/adam?utm_source=facebook&utm_medium=cpc") === "https://thenith.com/p/adam",
  "Tracking parameters (utm_*) stripped"
);
assert(
  normalizeCanonicalUrl("https://thenith.com/p/adam?fbclid=123456&gclid=789") === "https://thenith.com/p/adam",
  "Click IDs (fbclid, gclid) stripped"
);
assert(
  normalizeCanonicalUrl("/products/") === "https://thenith.com/products",
  "Relative path normalized to production domain without trailing slash"
);

// 8. Sitemap XML Validation
console.log("\n8. Testing Sitemap XML file...");
const sitemapPath = path.resolve(__dirname, "../public/sitemap.xml");
assert(fs.existsSync(sitemapPath), "public/sitemap.xml exists");
const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "Sitemap has valid XML header");
assert(sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), "Sitemap has standard urlset namespace");
assert(sitemapContent.includes("<loc>https://thenith.com/</loc>"), "Sitemap includes root canonical URL");
assert(sitemapContent.includes("<loc>https://thenith.com/products</loc>"), "Sitemap includes /products");
assert(sitemapContent.includes("<loc>https://thenith.com/pricing</loc>"), "Sitemap includes /pricing");
assert(!sitemapContent.includes("/panel"), "Sitemap excludes /panel");
assert(!sitemapContent.includes("/u/"), "Sitemap excludes /u/");
assert(!sitemapContent.includes("/login"), "Sitemap excludes /login");

// 9. Robots.txt Validation
console.log("\n9. Testing Robots.txt file...");
const robotsPath = path.resolve(__dirname, "../public/robots.txt");
assert(fs.existsSync(robotsPath), "public/robots.txt exists");
const robotsContent = fs.readFileSync(robotsPath, "utf-8");
assert(robotsContent.includes("User-agent: Googlebot"), "robots.txt includes Googlebot");
assert(robotsContent.includes("User-agent: OAI-SearchBot"), "robots.txt includes OAI-SearchBot");
assert(robotsContent.includes("User-agent: PerplexityBot"), "robots.txt includes PerplexityBot");
assert(robotsContent.includes("Disallow: /panel"), "robots.txt disallows /panel");
assert(robotsContent.includes("Disallow: /u/"), "robots.txt disallows /u/");
assert(robotsContent.includes("Allow: /p/"), "robots.txt explicitly allows /p/");
assert(robotsContent.includes("Sitemap: https://thenith.com/sitemap.xml"), "robots.txt references sitemap.xml");

// 10. LLMS.txt Validation
console.log("\n10. Testing LLMS.txt file...");
const llmsPath = path.resolve(__dirname, "../public/llms.txt");
assert(fs.existsSync(llmsPath), "public/llms.txt exists");
const llmsContent = fs.readFileSync(llmsPath, "utf-8");
assert(llmsContent.includes("Thenith"), "llms.txt describes Thenith");
assert(llmsContent.includes("https://thenith.com"), "llms.txt includes canonical URL");

// 11. Breadcrumbs Validation
console.log("\n11. Testing Breadcrumbs JSON-LD generation...");
const breadcrumbsData = buildBreadcrumbJsonLd([
  { name: "الرئيسية", url: "/" },
  { name: "المنتجات", url: "/products" },
  { name: "كارت ذكي", url: "/products/123" },
]);
assert(breadcrumbsData["@type"] === "BreadcrumbList", "BreadcrumbList @type present");
assert(breadcrumbsData.itemListElement.length === 3, "Breadcrumbs item count correct (3)");
assert(breadcrumbsData.itemListElement[0].item === "https://thenith.com/", "Breadcrumb item 1 canonical root");
assert(breadcrumbsData.itemListElement[1].item === "https://thenith.com/products", "Breadcrumb item 2 canonical /products");
assert(fullPersonalSeo.breadcrumbs && fullPersonalSeo.breadcrumbs.length === 3, "Profile SEO metadata includes breadcrumbs");

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
