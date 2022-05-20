/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */

console.log('Service Worker file loaded successfully');

// TODO
const socket = new WebSocket('[magic]');
socket.addEventListener('message', ({ data }) => {
  console.log('heyho');
  const nt = JSON.parse(data);
  if (nt.event !== 'message') return;

  clients.matchAll({
    type: 'window',
  }).then((wins) => {
    if (wins.length !== 0) {
      console.log('Notification already handled');
      return;
    }

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
  });
});

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
});

// self.addEventListener('fetch', (event) => {
//   // console.log('Service worker fetches', event);
//   return fetch(event);
// });
