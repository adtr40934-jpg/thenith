import { toast as hotToast } from "react-hot-toast";

const messageCounts = new Map();
const messageTimeouts = new Map();

function show(msg, opts, method) {
  const key = typeof msg === 'string' ? msg : 'custom';
  if (key === 'custom') {
     return method ? hotToast[method](msg, opts) : hotToast(msg, opts);
  }

  const count = (messageCounts.get(key) || 0) + 1;
  messageCounts.set(key, count);

  if (messageTimeouts.has(key)) clearTimeout(messageTimeouts.get(key));
  messageTimeouts.set(key, setTimeout(() => {
    messageCounts.delete(key);
    messageTimeouts.delete(key);
  }, 4000));

  const displayMsg = count > 1 ? `${msg} (${count})` : msg;
  // Use the key as the id so react-hot-toast replaces the toast in-place!
  return method ? hotToast[method](displayMsg, { ...opts, id: key }) : hotToast(displayMsg, { ...opts, id: key });
}

// Create a wrapper that behaves exactly like the original toast but deduplicates
const toast = Object.assign(
  (msg, opts) => show(msg, opts, null),
  hotToast,
  {
    success: (msg, opts) => show(msg, opts, 'success'),
    error: (msg, opts) => show(msg, opts, 'error'),
    loading: (msg, opts) => show(msg, opts, 'loading'),
  }
);

export { toast };
export default toast;
