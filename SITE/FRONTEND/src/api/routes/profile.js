import panelRoutes from "./panel.js";
import publicProfileRoutes from "./publicProfile.js";

export const profileRoutes = {
  getPublicProfile: publicProfileRoutes.getPublicProfile,
  getPanelProfile: panelRoutes.getProfile,
  updatePanelProfile: panelRoutes.updateProfile,
  getLinks: panelRoutes.getLinks,
  updateLinks: panelRoutes.updateLinks,
};

export default profileRoutes;
