import { HistoryRepository } from "./HistoryRepository";
import { Repository } from "./Repository";
import { Entity } from "../../../../Shared/Models/Entity";

/**
 * @description Schematic for repository dictionary
 */
export interface IRepositories {
    [key: string]: Repository<Entity>;
    history: HistoryRepository;
}