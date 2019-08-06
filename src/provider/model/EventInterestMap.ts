import { Identity } from "openfin/_v2/main";

interface AppClients {
    [uuid: string]: string[];
}

interface EventInterest {
    [event: string]: AppClients;
}

export class EventInterestMap {

    private _map: EventInterest = {};

    public add(event: string, target: Identity): void {
        if (this.has(event, target)) {
            return;
        }
        if (!this._map.hasOwnProperty(event)) {
            this._map[event] = {[target.uuid] : []};
        } else if (!this._map[event].hasOwnProperty(target.uuid)) {
            this._map[event][target.uuid] = [];
        }
        this._map[event][target.uuid].push(target.name!);
    }

    public remove(event: string, target: Identity): void {
        if (this.has(event, target)) {
            const wins: string[] = this._map[event][target.uuid];
            wins.splice(wins.indexOf(target.name!), 1);
        }
    }

    public has(event: string, target: Identity): boolean {
        return this._map.hasOwnProperty(event) && this._map[event].hasOwnProperty(target.uuid) && this._map[event][target.uuid].indexOf(target.name!) !== -1;
    }

}