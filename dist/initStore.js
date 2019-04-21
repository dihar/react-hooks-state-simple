"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var is_plain_object_1 = __importDefault(require("is-plain-object"));
var SimpleStore_1 = __importDefault(require("./SimpleStore"));
/**
 * Create new Store for using reack hook
 *
 * @param {Object} config
 *
 * @retrun store ane useStore hook
 */
var initStore = function (initialState, actions) {
    var store = new SimpleStore_1.default(initialState);
    var memoActions = Object.entries(actions || {})
        .reduce(function (result, _a) {
        var key = _a[0], action = _a[1];
        if (typeof action === 'function') {
            result[key] = function (payload) {
                var actionResult = action({
                    state: store.getState(),
                    getState: store.getState,
                    setState: store.setState
                }, payload);
                if (is_plain_object_1.default(actionResult)) {
                    store.setState(actionResult);
                }
                return actionResult;
            };
        }
        return result;
    }, {});
    var useStore = function () {
        var usingProps = react_1.useMemo(function () { return new Set; }, []);
        var _a = react_1.useState({}), innerState = _a[0], setInnerState = _a[1];
        var proxyObject = react_1.useMemo(function () { return new Proxy({}, {
            get: function (_, prop) {
                usingProps.add(prop);
                var outerState = store.getState();
                if (prop in outerState) {
                    return outerState[prop];
                }
                if (prop in memoActions) {
                    return memoActions[prop];
                }
                return undefined;
            },
            set: function () {
                throw new ReferenceError('You can\'t modify state directly');
            }
        }); }, []);
        react_1.useEffect(function () {
            return store.subscribe(function (newState) {
                var isPropsChanged = false;
                var newInnerState = {};
                usingProps.forEach(function (key) {
                    if (key in memoActions) {
                        return;
                    }
                    isPropsChanged = isPropsChanged || !Object.is(newState[key], innerState[key]);
                    newInnerState[key] = newState[key];
                });
                if (isPropsChanged) {
                    setInnerState(newInnerState);
                }
            });
        }, [innerState]);
        return proxyObject;
    };
    return {
        useStore: useStore,
        store: store,
    };
};
exports.default = initStore;
