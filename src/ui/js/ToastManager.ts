import {Fin} from '../../fin';
import {ISenderInfo} from '../../provider/Models/ISenderInfo';
import {Notification} from '../../Shared/Models/Notification';
import {INotification} from '../models/INotification';
import {IToast} from '../models/toast/IToast';

import {WindowInfo} from './WindowInfo';

declare var fin: Fin;

/**
 * @class ToastManager Handles all toasts
 */
export class ToastManager {
  private static singleton: ToastManager = null;

  private toasts: IToast[] = [];
  private windowInfo: WindowInfo = WindowInfo.instance;

  constructor() {
    if (ToastManager.singleton) {
      return ToastManager.singleton;
    }

    window.addEventListener(
        'WindowShowingUpdate', this.windowShowingEventHandler.bind(this));
    ToastManager.singleton = this;
  }

  /**
   * @method create Creates a Fin Notification
   * @param {INotification} meta Notification Information
   * @param {boolean} force Force show a notification, regardless of window showing or not
   */
  public create(meta: Notification&ISenderInfo, force: boolean = false) {
    if (!force) {
      if (this.windowInfo.getShowingStatus()) {
        return;
      }
    }

    const note: fin.OpenFinNotification =
        new fin.desktop.Notification({url: 'Toast.html', message: meta});

    const toast: IToast = {note, meta};
    this.toasts.push(toast);
  }

  /**
   * @method closeAll Closes all Toasts
   * @returns void
   */
  public closeAll(): void {
    this.toasts.forEach((toast) => {
      toast.note.close();
    });
  }

  /**
   * @method windowShowingEventHandler Handler for the WindowShowingUpdate Event
   * @param {CustomEvent} e
   */
  private windowShowingEventHandler(e: CustomEvent): void {
    if (e.detail.showing) {
      this.closeAll();
    }
  }

  /**
   * @method instance Returns the Toast Manager Instance
   * @returns {ToastManager}
   * @static
   */
  public static get instance(): ToastManager {
    if (ToastManager.singleton) {
      return ToastManager.singleton;
    } else {
      return new ToastManager();
    }
  }
}