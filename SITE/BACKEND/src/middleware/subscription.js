import _subscriptionService from "../services/subscriptionService.js";
const { getSubscriptionState, consumeBusinessRequest } = _subscriptionService;

async function requireSubscription(request, _response, next) {
  try {
    request.subscription = await getSubscriptionState(request.user._id);
    next();
  } catch (error) {
    next(error);
  }
}

export default { requireSubscription, getSubscriptionState, consumeBusinessRequest };
