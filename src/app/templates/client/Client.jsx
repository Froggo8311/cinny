import React, { useState, useEffect, useRef } from 'react';
import './Client.scss';

import { initHotkeys } from '../../../client/event/hotkeys';
import { initRoomListListener } from '../../../client/event/roomList';

import Text from '../../atoms/text/Text';
import Spinner from '../../atoms/spinner/Spinner';
import Navigation from '../../organisms/navigation/Navigation';
import ContextMenu, { MenuItem } from '../../atoms/context-menu/ContextMenu';
import IconButton from '../../atoms/button/IconButton';
import ReusableContextMenu from '../../atoms/context-menu/ReusableContextMenu';
import Room from '../../organisms/room/Room';
import Windows from '../../organisms/pw/Windows';
import Dialogs from '../../organisms/pw/Dialogs';
import EmojiBoardOpener from '../../organisms/emoji-board/EmojiBoardOpener';

import initMatrix from '../../../client/initMatrix';
import navigation from '../../../client/state/navigation';
import cons from '../../../client/state/cons';
import DragDrop from '../../organisms/drag-drop/DragDrop';

import VerticalMenuIC from '../../../../public/res/ic/outlined/vertical-menu.svg';

function Client() {
  const [isLoading, changeLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Loading...');
  const [dragCounter, setDragCounter] = useState(0);
  const classNameHidden = 'client__item-hidden';

  const navWrapperRef = useRef(null);
  const roomWrapperRef = useRef(null);

  function onRoomSelected() {
    navWrapperRef.current?.classList.add(classNameHidden);
    roomWrapperRef.current?.classList.remove(classNameHidden);
  }
  function onNavigationSelected() {
    navWrapperRef.current?.classList.remove(classNameHidden);
    roomWrapperRef.current?.classList.add(classNameHidden);
  }

  useEffect(() => {
    navigation.on(cons.events.navigation.ROOM_SELECTED, onRoomSelected);
    navigation.on(cons.events.navigation.NAVIGATION_OPENED, onNavigationSelected);

    return (() => {
      navigation.removeListener(cons.events.navigation.ROOM_SELECTED, onRoomSelected);
      navigation.removeListener(cons.events.navigation.NAVIGATION_OPENED, onNavigationSelected);
    });
  }, []);

  useEffect(() => {
    let counter = 0;
    const iId = setInterval(() => {
      const msgList = [
        'Still loading...',
        'Should be done soon...',
      ];
      if (counter === msgList.length - 1) {
        setLoadingMsg(msgList[msgList.length - 1]);
        clearInterval(iId);
        return;
      }
      setLoadingMsg(msgList[counter]);
      counter += 1;
    }, 15000);
    initMatrix.once('init_loading_finished', () => {
      clearInterval(iId);
      initHotkeys();
      initRoomListListener(initMatrix.roomList);
      changeLoading(false);
    });
    initMatrix.init();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-display">
        <div className="loading__menu">
          <ContextMenu
            placement="bottom"
            content={(
              <>
                <MenuItem onClick={() => initMatrix.clearCacheAndReload()}>
                  Clear cache & reload
                </MenuItem>
                <MenuItem onClick={() => initMatrix.logout()}>Logout</MenuItem>
              </>
            )}
            render={(toggle) => <IconButton size="extra-small" onClick={toggle} src={VerticalMenuIC} />}
          />
        </div>
        <Spinner />
        <Text className="loading__message" variant="b2">{loadingMsg}</Text>

        <div className="loading__appname">
          <Text variant="h2" weight="medium">Cinny</Text>
        </div>
      </div>
    );
  }

  function dragContainsFiles(e) {
    if (!e.dataTransfer.types) return false;

    for (let i = 0; i < e.dataTransfer.types.length; i += 1) {
      if (e.dataTransfer.types[i] === 'Files') return true;
    }
    return false;
  }

  function modalOpen() {
    return navigation.isRawModalVisible && dragCounter <= 0;
  }

  function handleDragOver(e) {
    if (!dragContainsFiles(e)) return;

    e.preventDefault();

    if (!navigation.selectedRoomId || modalOpen()) {
      e.dataTransfer.dropEffect = 'none';
    }
  }

  function handleDragEnter(e) {
    e.preventDefault();

    if (navigation.selectedRoomId && !modalOpen() && dragContainsFiles(e)) {
      setDragCounter(dragCounter + 1);
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();

    if (navigation.selectedRoomId && !modalOpen() && dragContainsFiles(e)) {
      setDragCounter(dragCounter - 1);
    }
  }

  function handleDrop(e) {
    e.preventDefault();

    setDragCounter(0);

    if (modalOpen()) return;

    const roomId = navigation.selectedRoomId;
    if (!roomId) return;

    const { files } = e.dataTransfer;
    if (!files?.length) return;
    const file = files[0];
    initMatrix.roomsInput.setAttachment(roomId, file);
    initMatrix.roomsInput.emit(cons.events.roomsInput.ATTACHMENT_SET, file);
  }

  return (
    <div
      className="client-container"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <script src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js" crossorigin="anonymous"></script>
      <div className="navigation__wrapper" ref={navWrapperRef}>
        <Navigation />
      </div>
      <div className={`room__wrapper ${classNameHidden}`} ref={roomWrapperRef}>
        <Room />
      </div>
      <Windows />
      <Dialogs />
      <EmojiBoardOpener />
      <ReusableContextMenu />
      <DragDrop isOpen={dragCounter !== 0} />
    </div>
  );
}

export default Client;
