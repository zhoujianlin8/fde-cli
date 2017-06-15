import api from './apimap';
import {AjaxMap} from '@wm/ajax';
const ajax = AjaxMap({
    apiMap: api
});
const tools = {
    /*
     * 调用改核心方法 统一接口处理
     * */
    ajax(param, suc, err){
        //其他设置成功失败定义
        return ajax(param, suc, err)
    },
    isDaily(){
        const host = window.location.host;
        return host.indexOf('.daily.') > -1;
    },

    getUrlParam: function (name) {
        const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        const r = decodeURIComponent(window.location.search.substr(1)).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    },

    isArray: function (object) {
        return object instanceof Array
    },
    isWindow: function (obj) {
        return obj != null && obj == obj.window
    },
    isDocument: function (obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    },
    isObject: function (obj) {
        return this._type(obj) == "object"
    },
    isFunction: function (fn) {
        return this._type(fn) == "function"
    },
    isPlainObject: function (obj) {
        return this.isObject(obj) && !this.isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    },
    _type: function (obj) {
        const class2type = {};
        const toString = class2type.toString;
        return obj == null ? String(obj) :
            class2type[toString.call(obj)] || "object"
    },
    isString: function (str) {
        return typeof str === 'string'
    },
    extend: function (target, source) {
        target = target || {};
        source = source || {};
        for (const key in source) {
            target[key] = source[key]
        }
        return target;

    },
    namespace: function (name) {
        return function (v) {
            return name + '-' + v;
        }
    }
};
export const NameSpace = tools.namespace.bind(tools);
export const Ajax = tools.ajax.bind(tools);
export default tools;