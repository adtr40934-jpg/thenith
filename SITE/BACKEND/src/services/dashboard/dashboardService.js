import AnalyticEvent from "../../models/AnalyticEvent.js";

/**
 * Returns aggregated analytics (visits + link clicks + countries) for a given card.
 */
async function getCardAnalytics(cardId) {
  const now = new Date();

  const day = now.getDay();
  const diffToSaturday = day === 6 ? 0 : day + 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToSaturday);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 29);
  monthStart.setHours(0, 0, 0, 0);

  const yearStart = new Date(now);
  yearStart.setMonth(now.getMonth() - 11);
  yearStart.setDate(1);
  yearStart.setHours(0, 0, 0, 0);

  const visits = await AnalyticEvent.find({
    cardId,
    eventType: "visit",
    createdAt: { $gte: yearStart },
  });

  const week = Array(7).fill(0);
  const month = Array(30).fill(0);
  const year = Array(12).fill(0);

  visits.forEach((v) => {
    if (v.createdAt >= weekStart) {
      const diff = Math.floor(
        (v.createdAt - weekStart) / (1000 * 60 * 60 * 24),
      );
      if (diff >= 0 && diff < 7) week[diff]++;
    }
    if (v.createdAt >= monthStart) {
      const diff = Math.floor(
        (v.createdAt - monthStart) / (1000 * 60 * 60 * 24),
      );
      if (diff >= 0 && diff < 30) month[diff]++;
    }
    const diffMonth =
      (v.createdAt.getFullYear() - yearStart.getFullYear()) * 12 +
      (v.createdAt.getMonth() - yearStart.getMonth());
    if (diffMonth >= 0 && diffMonth < 12) year[diffMonth]++;
  });

  const clicks = await AnalyticEvent.aggregate([
    { $match: { cardId, eventType: "click" } },
    {
      $group: {
        _id: { linkUrl: "$linkUrl", country: "$country" },
        count: { $sum: 1 },
      },
    },
  ]);
  const linkClicks = {};
  clicks.forEach((c) => {
    const url = c._id.linkUrl;
    const country = c._id.country;
    if (!linkClicks[url]) linkClicks[url] = { total: 0, countries: {} };
    linkClicks[url].total += c.count;
    linkClicks[url].countries[country] = c.count;
  });

  const countriesAgg = await AnalyticEvent.aggregate([
    { $match: { cardId, eventType: "visit" } },
    { $group: { _id: "$country", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const countries = {};
  countriesAgg.forEach((c) => (countries[c._id] = c.count));

  return { visits: { week, month, year }, linkClicks, countries };
}


export default { getCardAnalytics };
