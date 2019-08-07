import {Identity} from 'openfin/_v2/main';

interface Application {
    [name: string]: boolean;
}

interface Event {
    [uuid: string]: Application;
}

interface EventInterest {
    [event: string]: Event;
}

export class EventInterestMap {
    private _map: EventInterest = {};

    public add(event: string, target: Identity): void {
        !this._map.hasOwnProperty(event) && (this._map[event] = {});
        !this._map[event].hasOwnProperty(target.uuid) && (this._map[event][target.uuid] = {});
        this._map[event][target.uuid][target.name!] = true;
    }

    public remove(event: string, target: Identity): void {
        if (this.has(event, target)) {
            delete this._map[event][target.uuid][target.name!];
        }
    }

    public has(event: string, target: Identity): boolean {
        return this._map.hasOwnProperty(event) &&
               this._map[event].hasOwnProperty(target.uuid) &&
               this._map[event][target.uuid].hasOwnProperty(target.name!) &&
               this._map[event][target.uuid][target.name!];
    }
}
