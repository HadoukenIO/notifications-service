import {addSpawnListeners, createWindow, createApp} from './spawn';

addSpawnListeners();

// Mount createWindow and createApp on the window to be used by puppeteer
Object.assign(window, {createWindow, createApp});
