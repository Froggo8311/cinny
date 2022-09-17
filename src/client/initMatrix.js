import EventEmitter from 'events';
import * as sdk from 'matrix-js-sdk';
// import { logger } from 'matrix-js-sdk/lib/logger';

import { secret } from './state/auth';
import RoomList from './state/RoomList';
import AccountData from './state/AccountData';
import RoomsInput from './state/RoomsInput';
import Notifications from './state/Notifications';
import { cryptoCallbacks } from './state/secretStorageKeys';
import getConfig from '../util/config';
import navigation from './state/navigation';

global.Olm = require('@matrix-org/olm');

// logger.disableAll();

class InitMatrix extends EventEmitter {
  constructor() {
    super();

    navigation.initMatrix = this;
  }

  async init() {
    await this.startClient();
    this.setupSync();
    this.listenEvents();
  }

  async startClient() {
    const indexedDBStore = new sdk.IndexedDBStore({
      indexedDB: global.indexedDB,
      localStorage: global.localStorage,
      dbName: 'web-sync-store',
    });
    await indexedDBStore.startup();

    this.matrixClient = sdk.createClient({
      baseUrl: secret.baseUrl,
      accessToken: secret.accessToken,
      userId: secret.userId,
      store: indexedDBStore,
      cryptoStore: new sdk.IndexedDBCryptoStore(global.indexedDB, 'crypto-store'),
      deviceId: secret.deviceId,
      timelineSupport: true,
      cryptoCallbacks,
      verificationMethods: [
        'm.sas.v1',
      ],
    });

    await this.matrixClient.initCrypto();

    await this.matrixClient.startClient({
      lazyLoadMembers: true,
    });
    this.matrixClient.setGlobalErrorOnUnknownDevices(false);
  }

  setupSync() {
    const sync = {
      NULL: () => {
        console.log('NULL state');
      },
      SYNCING: () => {
        console.log('SYNCING state');
      },
      PREPARED: (prevState) => {
        console.log('PREPARED state');
        console.log('Previous state: ', prevState);
        // TODO: remove global.initMatrix at end
        global.initMatrix = this;
        if (prevState === null) {
          this.roomList = new RoomList(this.matrixClient);
          this.accountData = new AccountData(this.roomList);
          this.roomsInput = new RoomsInput(this.matrixClient, this.roomList);
          this.notifications = new Notifications(this.roomList);
          this.emit('init_loading_finished');
          this.notifications._initNoti();
        } else {
          this.notifications._initNoti();
        }
      },
      RECONNECTING: () => {
        console.log('RECONNECTING state');
      },
      CATCHUP: () => {
        console.log('CATCHUP state');
      },
      ERROR: () => {
        console.log('ERROR state');
      },
      STOPPED: () => {
        console.log('STOPPED state');
      },
    };
    this.matrixClient.on('sync', (state, prevState) => sync[state](prevState));
  }

  listenEvents() {
    this.matrixClient.on('Session.logged_out', async () => {
      this.matrixClient.stopClient();
      await this.matrixClient.clearStores();
      window.localStorage.clear();
      window.location.reload();
    });
  }

  async setupPushGateway() {
    const appId = `${window.location.hostname.split('.').reverse().join('.')}.${secret.deviceId}`;
    const existingPushers = await this.matrixClient.getPushers();
    if (existingPushers.pushers.find((p) => p.app_id === appId)) {
      console.log('Pusher already registered');
      return;
    }

    const ntfyKey = crypto.randomUUID();
    const { unifiedPushGateway, ntfyHost } = await getConfig();
    const pushAddr = `https://${ntfyHost ?? 'ntfy.sh'}/${ntfyKey}?up=1`;
    const eventSocketAddr = `wss://${ntfyHost ?? 'ntfy.sh'}/${ntfyKey}/ws`;

    await this.matrixClient.setPusher({
      app_id: appId,
      device_display_name: `Cinny (${secret.deviceId})`,
      app_display_name: 'Cinny',
      kind: 'http',
      lang: 'en',
      append: false,
      data: {
        format: 'event_id_only',
        url: unifiedPushGateway ?? 'https://matrix.gateway.unifiedpush.org/_matrix/push/v1/notify',
      },
      pushkey: pushAddr,
    });

    const svr = await navigator.serviceWorker.getRegistration();
    svr.active.postMessage({
      type: 'ntfy-push-address',
      eventSocketAddr,
    });

    console.log('Pusher registered, push address: ', pushAddr);

  async logout() {
    this.matrixClient.stopClient();
    try {
      await this.matrixClient.logout();
    } catch {
      // ignore if failed to logout
    }
    await this.matrixClient.clearStores();
    window.localStorage.clear();
    window.location.reload();
  }

  clearCacheAndReload() {
    this.matrixClient.stopClient();
    this.matrixClient.store.deleteAllData().then(() => {
      window.location.reload();
    });
  }
}

const initMatrix = new InitMatrix();

export default initMatrix;
