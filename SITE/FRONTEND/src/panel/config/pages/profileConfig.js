export const profileConfig = {
  features: {
    profile: true,
  },
  fields: [
    { key: "fullName", required: true },
    { key: "email", required: true },
    { key: "phone", required: false },
    { key: "address", required: false },
  ],
};
