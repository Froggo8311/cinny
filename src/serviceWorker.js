/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */

import { get, set, createStore } from 'idb-keyval';

console.log('Service Worker file loaded successfully');
const store = createStore('cinny-serviceworker-db', 'cinny-serviceworker-storage');

function handleNotification(data) {
  const { notification } = JSON.parse(JSON.parse(data).message);

  if (notification.counts.unread === 0) {
    registration.getNotifications({ tag: 'cinny-unread' })
      .then((ns) => ns.forEach((n) => n.close()));
    navigator.clearAppBadge();
  } else {
    registration.showNotification(`${notification.counts.unread ?? 'New'} unread messages`, {
      time: new Date(notification.time * 1000),
      tag: 'cinny-unread',
      data: notification,
      // If event is regarding a new message it has an event id
      renotify: notification.event_id,
      actions: [{
        title: 'View new message',
        action: 'cinny-open-chat',
      },
      {
        title: 'Open Cinny',
        action: 'cinny-show-app',
      }],
    });
    navigator.setAppBadge(notification.counts.unread);
  }
}

/**
 * @type {WebSocket | undefined}
 */
let socket;
function openSocket(subscription) {
  // TODO
  if (!subscription) return;
  if (socket) socket.close();

  // Like wss://ntfy.sh/2296aeb2-dc13-4806-bf13-f948bc8323fc/ws  wss://ntfy.sh/30dc3770-d840-4119-87c8-a1c0f0d90faf/ws
  socket = new WebSocket(subscription);

  socket.addEventListener('message', ({ data }) => {
    const nt = JSON.parse(data);
    if (nt.event !== 'message') { return; }

    clients.matchAll({
      type: 'window',
    }).then((wins) => {
      if (wins.length !== 0) {
        console.log('Notification already handled');
        return;
      }

      handleNotification(data);
    });
  });
  console.log('Socket opened');
}

get('ntfy-push-subscription', store).then(openSocket);

self.addEventListener('notificationclick', (ev) => {
  // TODO: Automatically choose client whith the room opened when #411 is merged

  ev.waitUntil(clients.matchAll({
    type: 'window',
  }).then((clientList) => {
    const cl = clientList.find((c) => 'focus' in c);
    if (cl) cl.focus();
    else if (clients.openWindow) clients.openWindow('/');
  }));
});

self.addEventListener('install', () => {
  console.log('Hello world from the Service worker');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Serive worker now active');
  clients.claim();
});

self.addEventListener('message', (event) => {
  console.log('Service worker received message', event);

  if (event.data.type === 'ntfy-push-address') {
    set('ntfy-push-subscription', event.data.eventSocketAddr, store);
    openSocket(event.data.eventSocketAddr);
  }
});

// self.addEventListener('fetch', (event) => {
//   // console.log('Service worker fetches', event);
//   return fetch(event);
// });
