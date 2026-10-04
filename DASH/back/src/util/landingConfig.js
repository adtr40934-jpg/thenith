const defaultLandingConfig = {
  hero: {
    title: "ارتقِ بهويتك واصنع تأثيراً لا يُنسى",
    subtitle:
      "صفحة رقمية واحدة تجمع بياناتك، أعمالك، وحساباتك لتشاركها بسهولة وبأسلوب يليق بك.",
    primaryButtonText: "ابدأ الآن",
    primaryButtonUrl: "/signup",
    secondaryButtonText: "استكشف المزايا",
    secondaryTargetId: "features",
  },
  intro: {
    title: "حضورك يستحق مساحة تعبر عن قيمتك",
    subtitle:
      "مساحة رقمية فاخرة صممت بعناية لتبرز احترافيتك في واجهة واحدة منظمة.",
  },
  cardSection: {
    title: "لمسة واحدة تصنع الفارق.",
    subtitle:
      "من خلال بطاقات Thenith الفاخرة، لمسة واحدة على أي هاتف ذكي تكفي لمشاركة بياناتك وبدء تواصل حقيقي.",
    buttonText: "استكشف البطاقات",
    buttonUrl: "/products",
    images: [],
  },
  dashboardSection: {
    title: "لوحة إدارة احترافية",
    subtitle:
      "لوحة تحكم متكاملة تتيح لك إدارة بطاقاتك، متابعة الإحصائيات، وتلقي رسائل عملائك في مكان واحد.",
  },
  stepsSection: {
    title: "ابدأ في دقائق",
    subtitle: "جهز هويتك الرقمية وشاركها بسهولة في كل لقاء.",
  },
};

const mergeLandingConfig = (value = {}) => ({
  hero: { ...defaultLandingConfig.hero, ...(value.hero || {}) },
  intro: { ...defaultLandingConfig.intro, ...(value.intro || {}) },
  cardSection: {
    ...defaultLandingConfig.cardSection,
    ...(value.cardSection || {}),
    images: Array.isArray(value.cardSection?.images)
      ? value.cardSection.images.filter(Boolean)
      : defaultLandingConfig.cardSection.images,
  },
  dashboardSection: {
    ...defaultLandingConfig.dashboardSection,
    ...(value.dashboardSection || {}),
  },
  stepsSection: {
    ...defaultLandingConfig.stepsSection,
    ...(value.stepsSection || {}),
  },
});


export default {
  defaultLandingConfig,
  mergeLandingConfig
};
