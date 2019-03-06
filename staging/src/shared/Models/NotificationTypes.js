"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes["DEFAULT"] = "DEFAULT";
    NotificationTypes["BUTTON"] = "BUTTON";
    NotificationTypes["INLINE"] = "INLINE";
    NotificationTypes["INLINEBUTTON"] = "INLINEBUTTON";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
function TypeResolver(payload) {
    const button = typeof payload.buttons === 'object' && payload.buttons.length > 0 ? true : false;
    const inline = typeof payload.inputs === 'object' && payload.inputs.length > 0 ? true : false;
    let type = NotificationTypes.DEFAULT;
    if (button && !inline) {
        type = NotificationTypes.BUTTON;
    }
    else if (!button && inline) {
        type = NotificationTypes.INLINE;
    }
    else if (button && inline) {
        type = NotificationTypes.INLINEBUTTON;
    }
    return type;
}
exports.TypeResolver = TypeResolver;
//# sourceMappingURL=NotificationTypes.js.map