import {Sorts} from './Sort';

/**
 * @description The meta data about the page they are requesting, the page
 * number and the number of items for the page
 */
export interface PageInfo {
  pageNumber: number;
  numberOfItems: number;
  sort: Sorts;
}