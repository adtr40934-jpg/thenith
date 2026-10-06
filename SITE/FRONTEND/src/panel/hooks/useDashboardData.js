import { useEffect, useMemo, useState } from "react";
import {
  normalizeCard,
  normalizeDashboardData,
} from "../data/dashboardSeed.js";
import { permissionsFromEntitlements } from "../utils/entitlements.js";
import {
  createCard,
  deleteCard as deleteCardRequest,
  deleteInboxItemApi,
  fetchDashboardData,
  saveCard,
  setActiveCard as setActiveCardRequest,
  toggleInboxItemReadApi,
} from "../services/dashboardApi.js";
import { saveProfile } from "../services/authApi.js";

export function getInboxItems(card) {
  if (!card) return [];
  return card.actionType === "calendar"
    ? card.appointments || []
    : card.requests || [];
}

export function getInboxLabel(card, t) {
  return card?.actionType === "calendar"
    ? t("appointments")
    : t("workRequests");
}

export function normalizeUrl(value) {
  if (!value?.trim()) return "";
  return /^(https?:\/\/|mailto:|tel:|sms:)/i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
}

function reorderItems(collection, fromId, toId) {
  const fromIndex = collection.findIndex((item) => item.id === fromId);
  const toIndex = collection.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return collection;
  const next = [...collection];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState(() =>
    normalizeDashboardData(),
  );
  const [remoteData, setRemoteData] = useState(() => normalizeDashboardData());

  const [activeCardId, setActiveCardIdState] = useState(undefined);

  const [selectedMessageCardId, setSelectedMessageCardId] = useState(null);
  const [status, setStatus] = useState("loading");
  const [hasRemoteData, setHasRemoteData] = useState(false);
  const [isSwitchingCard, setIsSwitchingCard] = useState(false);

  const synthesizeNotifications = (cards) => {
    return cards
      .flatMap((card) => {
        const reqs = (card.requests || []).map((r) => ({
          id: r.id || r._id,
          type: "new_request",
          payload: r,
          date: new Date(r.createdAt),
        }));
        const appts = (card.appointments || []).map((a) => ({
          id: a.id || a._id,
          type: "new_appointment",
          payload: a,
          date: new Date(a.createdAt),
        }));
        return [...reqs, ...appts];
      })
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
  };

  const setActiveCardId = async (id) => {
    if (id === activeCardId || isSwitchingCard) return;
    setIsSwitchingCard(true);
    setActiveCardIdState(id);
    if (status === "ready" && id) {
      try {
        const result = await setActiveCardRequest(id);
        if (result.cards) {
          updateDashboard((current) => ({
            ...current,
            cards: result.cards,
            owner: { ...current.owner, activeCardId: result.activeCardId },
          }));
          setRemoteData((current) => ({
            ...current,
            cards: result.cards,
            owner: { ...current.owner, activeCardId: result.activeCardId },
          }));
        }
      } catch (error) {
      } finally {
        setIsSwitchingCard(false);
      }
    } else {
      setIsSwitchingCard(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchDashboardData()
      .then((data) => {
        if (!mounted) return;
        if (!data.subscription?.plan || !data.subscription?.entitlements) {
          throw new Error("Account entitlements are missing");
        }

        data.notifications =
          data.notifications || synthesizeNotifications(data.cards || []);

        setDashboardData(data);
        setRemoteData(data);
        setHasRemoteData(true);
        setActiveCardIdState((current) => {
          const preferred = data.owner?.activeCardId;
          const exists = data.cards.some((c) => c.id === preferred);
          const resolved = exists ? preferred : data.cards[0]?.id;
          return resolved;
        });
        setStatus("ready");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Poll dashboard data periodically to receive real-time updates (like new messages)
  useEffect(() => {
    let timeoutId;
    let isPolling = true;

    const poll = async () => {
      try {
        const fresh = await fetchDashboardData();

        setDashboardData((prev) => {
          // If plan or any entitlements changed, completely overwrite state
          const prevEntitlements = JSON.stringify(
            prev.subscription?.entitlements || {},
          );
          const freshEntitlements = JSON.stringify(
            fresh.subscription?.entitlements || {},
          );

          if (prevEntitlements !== freshEntitlements) {
            return fresh;
          }

          const mergedCards = prev.cards.map((prevCard) => {
            const freshCard = fresh.cards.find((c) => c.id === prevCard.id);
            if (!freshCard) return prevCard;
            return {
              ...prevCard,
              appointments: freshCard.appointments,
              requests: freshCard.requests,
            };
          });

          fresh.notifications =
            fresh.notifications || synthesizeNotifications(fresh.cards || []);

          return {
            ...prev,
            metrics: fresh.metrics,
            visits: fresh.visits,
            notifications: fresh.notifications,
            pendingPayment: fresh.pendingPayment,
            subscription: fresh.subscription,
            cards: mergedCards,
          };
        });

        setRemoteData(fresh);
      } catch (e) {
      }

      if (isPolling) {
        timeoutId = setTimeout(poll, 10000);
      }
    };

    timeoutId = setTimeout(poll, 10000);

    return () => {
      isPolling = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const cards = dashboardData.cards;
  const activeCard = useMemo(() => {
    const card = cards.find((item) => item.id === activeCardId) || cards[0];
    return card ? normalizeCard(card) : null;
  }, [activeCardId, cards]);
  const selectedMessageCard = useMemo(() => {
    const found = cards.find((card) => card.id === selectedMessageCardId);
    return found ? normalizeCard(found) : null;
  }, [cards, selectedMessageCardId]);

  // Build the public URL: if owner has a username → thenith.com/username, else use publicId
  const owner = dashboardData.owner || {};
  const activeCardLink = useMemo(() => {
    const username = owner.username?.trim();
    const publicId = owner.publicId?.trim();
    // USERNAME takes priority — always use username as primary link when available
    if (username) return `${window.location.origin}/p/${username}`;
    if (publicId) return `${window.location.origin}/p/${publicId}`;
    return `${window.location.origin}/p/${activeCard?.publicId || ""}`;
  }, [owner.username, owner.publicId, activeCard, cards]);

  const updateDashboard = (patcher) => {
    setDashboardData((current) => normalizeDashboardData(patcher(current)));
  };

  const updatePersistedOwner = (profile) => {
    const mergeOwner = (current) =>
      normalizeDashboardData({
        ...current,
        owner: { ...current.owner, ...profile },
      });
    setDashboardData(mergeOwner);
    setRemoteData(mergeOwner);
  };

  const addNotification = (title, type = "action") => {
    // Dispatch to global handler which will save to DB
    window.dispatchEvent(new CustomEvent("dashboard-action", {
      detail: { type, title, message: "" }
    }));
  };

  const updateCard = (cardId, patcher) => {
    updateDashboard((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === cardId ? normalizeCard(patcher(normalizeCard(card))) : card,
      ),
    }));
  };

  const updateActiveCard = (patcher) => {
    if (!activeCard) return;
    updateCard(activeCard.id, patcher);
  };

  const saveActiveCard = async () => {
    if (!activeCard) throw new Error("No active card selected");

    // Check for empty fields before saving
    const hasEmptyContacts = (activeCard.contacts || []).some(
      (c) => !c.value || c.value.trim() === "",
    );
    const hasEmptyLinks = (activeCard.links || []).some(
      (l) => !l.url || l.url.trim() === "",
    );

    if (hasEmptyContacts || hasEmptyLinks) {
      throw new Error("ValidationFailed");
    }

    const savedCard = normalizeCard(await saveCard(activeCard));
    // Update local dashboard state with the saved card
    updateDashboard((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === savedCard.id ? savedCard : card,
      ),
    }));
    setRemoteData((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === savedCard.id ? savedCard : card,
      ),
    }));
    // Refresh the entire dashboard to sync any related data (e.g., notifications, owner info)
    try {
      const fresh = await fetchDashboardData();
      setDashboardData(fresh);
      setRemoteData(fresh);
    } catch (e) {
    }
    return savedCard;
  };

  const saveOwner = async () => {
    const result = await saveProfile(dashboardData.owner || {});
    const data = result.profile || result.user;
    if (data) {
      updateDashboard((current) => ({
        ...current,
        owner: { ...current.owner, ...data },
      }));
      setRemoteData((current) => ({
        ...current,
        owner: { ...current.owner, ...data },
      }));
      try {
        const fresh = await fetchDashboardData();
        setDashboardData(fresh);
        setRemoteData(fresh);
      } catch (e) {
      }
    }
    return result;
  };

  const hasCardChanges = useMemo(() => {
    if (!activeCard) return false;
    const remote = remoteData.cards.find((c) => c.id === activeCard.id);
    return JSON.stringify(remote) !== JSON.stringify(activeCard);
  }, [activeCard, remoteData.cards]);

  const hasOwnerChanges = useMemo(() => {
    return (
      JSON.stringify(remoteData.owner) !== JSON.stringify(dashboardData.owner)
    );
  }, [dashboardData.owner, remoteData.owner]);

  const addCard = async () => {
    try {
      const createdCard = await createCard(`Card ${cards.length + 1}`);
      updateDashboard((current) => ({
        ...current,
        cards: [...current.cards, normalizeCard(createdCard)],
      }));
      setActiveCardId(createdCard.id);
      addNotification("تم إنشاء بطاقة جديدة", "card_created");
      return createdCard;
    } catch {
      return null;
    }
  };

  const deleteCard = (cardId) => {
    const removed = cards.find((c) => c.id === cardId);
    const remaining = cards.filter((card) => card.id !== cardId);
    updateDashboard((current) => ({ ...current, cards: remaining }));
    if (activeCardId === cardId) setActiveCardId(remaining[0]?.id);
    if (selectedMessageCardId === cardId) setSelectedMessageCardId(null);
    deleteCardRequest(cardId).catch((error) => {
    });
    addNotification(`تم حذف البطاقة "${removed?.name || ""}" بنجاح`, "card_deleted");
  };

  const updatePersonal = (key, value) => {
    updateActiveCard((card) => ({
      ...card,
      personal: { ...card.personal, [key]: value },
    }));
  };

  const updateContact = (contactId, patch) => {
    updateActiveCard((card) => {
      const targetContact = card.contacts.find((item) => item.id === contactId);
      let contacts = card.contacts.map((item) =>
        item.id === contactId ? { ...item, ...patch } : item,
      );
      if (patch.primary && targetContact) {
        contacts = contacts.map((item) =>
          item.type === targetContact.type &&
          (targetContact.type === "phone" || targetContact.type === "whatsapp")
            ? { ...item, primary: item.id === contactId }
            : item,
        );
      }
      return { ...card, contacts };
    });
  };

  const addContact = (contact) => {
    updateActiveCard((card) => ({
      ...card,
      contacts: [...card.contacts, contact],
    }));
  };

  const deleteContact = (contactId) => {
    updateActiveCard((card) => ({
      ...card,
      contacts: card.contacts.filter((item) => item.id !== contactId),
    }));
  };

  const addLink = (link) => {
    updateActiveCard((card) => ({ ...card, links: [...card.links, link] }));
  };

  const updateLink = (linkId, patch) => {
    updateActiveCard((card) => ({
      ...card,
      links: card.links.map((link) =>
        link.id === linkId ? { ...link, ...patch } : link,
      ),
    }));
  };

  const deleteLink = (linkId) => {
    updateActiveCard((card) => ({
      ...card,
      links: card.links.filter((link) => link.id !== linkId),
    }));
  };

  const reorderCardItems = (kind, fromId, toId) => {
    updateActiveCard((card) => ({
      ...card,
      [kind]: reorderItems(card[kind] || [], fromId, toId),
    }));
  };

  const deleteInboxItem = async (cardId, itemId) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const item = getInboxItems(card).find((i) => i.id === itemId);
    if (!item) return;

    updateCard(cardId, (card) => ({
      ...card,
      [card.actionType === "calendar" ? "appointments" : "requests"]:
        getInboxItems(card).filter((i) => i.id !== itemId),
    }));

    try {
      await deleteInboxItemApi(
        cardId,
        card.actionType === "calendar" ? "calendar" : "form",
        itemId,
      );
    } catch (e) {
    }
  };

  const toggleInboxItemRead = async (cardId, itemId) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const items = getInboxItems(card);
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    updateCard(cardId, (card) => {
      const isCalendar = card.actionType === "calendar";
      const list = isCalendar ? card.appointments : card.requests;
      return {
        ...card,
        [isCalendar ? "appointments" : "requests"]: (list || []).map((i) =>
          i.id === itemId ? { ...i, read: !i.read } : i,
        ),
      };
    });

    try {
      await toggleInboxItemReadApi(
        cardId,
        card.actionType === "calendar" ? "calendar" : "form",
        itemId,
      );
    } catch (e) {
    }
  };

  const markInboxItemRead = async (cardId, itemId) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const items = getInboxItems(card);
    const item = items.find((i) => i.id === itemId);
    if (!item || item.read) return;

    updateCard(cardId, (card) => {
      const isCalendar = card.actionType === "calendar";
      const list = isCalendar ? card.appointments : card.requests;
      return {
        ...card,
        [isCalendar ? "appointments" : "requests"]: (list || []).map((i) =>
          i.id === itemId ? { ...i, read: true } : i,
        ),
      };
    });

    try {
      await toggleInboxItemReadApi(
        cardId,
        card.actionType === "calendar" ? "calendar" : "form",
        itemId,
      );
    } catch (e) {
    }
  };

  const totalInboxCount = cards.reduce(
    (total, card) =>
      total +
      getInboxItems(normalizeCard(card)).filter((item) => !item.read).length,
    0,
  );

  return {
    dashboardData,
    entitlements: dashboardData.subscription?.entitlements,
    permissions: permissionsFromEntitlements(
      dashboardData.subscription?.entitlements,
    ),
    updateDashboard,
    updatePersistedOwner,
    owner,
    activeCardLink,
    cards,
    metrics: dashboardData.metrics,
    visits: dashboardData.visits,
    notifications: dashboardData.notifications || [],
    activeCard,
    activeCardId,
    setActiveCardId,
    selectedMessageCard,
    selectedMessageCardId,
    setSelectedMessageCardId,
    hasCardChanges,
    hasOwnerChanges,
    totalInboxCount,
    status,
    hasRemoteData,
    isSwitchingCard,
    addCard,
    deleteCard,
    updateActiveCard,
    saveActiveCard,
    saveOwner,
    updatePersonal,
    updateContact,
    addContact,
    deleteContact,
    addLink,
    updateLink,
    deleteLink,
    reorderCardItems,
    deleteInboxItem,
    toggleInboxItemRead,
    markInboxItemRead,
  };
}
