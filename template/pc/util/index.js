import apiMap from './apimap';
import Modal from '@wm/modal';
import Bridge from '@wm/bridge';
import WM from 'wm';
const Wm = new WM('v1');
const tools = {
    /*
     * 调用改核心方法 统一接口处理
     * */
    ajax(obj, suc, err){
        obj.method =  obj.method || 'get';
        const hostname = location.hostname;
        if(obj.api){
            const url = apiMap[obj.api];
            obj.url = url;
            if(['127.0.0.1','localhost'].indexOf(hostname) !== -1 ){
                obj.url = '//'+location.host+'/mock/'+obj.api+'.json';
                obj.method = 'get';
                obj.beforeSend = function (opt) {
                    delete opt.headers;
                };
            }
        }
        obj.success = function (res = {}) {
            if(res.code === 0 || res.code === '0'){
                suc(res)
            }else{
                Modal.toast('error:'+ (res.message || '服务端异常'));
                err && err(res);
            }
        };
        obj.error = function (res) {
            Modal.toast('error:出现异常');
            err && err(res);
        };
        return Wm.send(obj);
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
const Ajax = tools.ajax.bind(tools);
export default tools;
export {Modal,Wm,Ajax,Bridge}
