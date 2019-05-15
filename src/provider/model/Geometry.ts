import {Rect} from 'openfin/_v2/api/system/monitor';

/**
 * Check to see if box1 cotains box2.
 * @param box1 box1 is compared to see if box2 is inside.
 * @param box2 box2 is compared to see if it inside box1.
 */
export function contains(box1: Rect, box2: Rect): boolean {
    console.log('Contains', box1, box2);
    if (box1.left > box2.left) {
        return false;
    }
    if (box1.right < box2.right) {
        return false;
    }
    if (box1.bottom < box2.bottom) {
        return false;
    }
    if (box1.top > box2.top) {
        return false;
    }
    return true;
}
