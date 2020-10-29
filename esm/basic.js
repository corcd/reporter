import * as Sentry from '@sentry/browser';
import { proxy } from 'ajax-hook';
export default class ReporterBasic {
    constructor(options) {
        this._options = options;
        if (this._options.isAjax) {
            this._ajax();
            this._fetch();
        }
        if (this._options.isError)
            this._error();
        this._privacy();
    }
    _ajax() {
        proxy({
            onRequest: (config, handler) => {
                handler.next(config);
            },
            onError: (err, handler) => {
                if (!this._options.filterUrls.includes(err.config.url)) {
                    console.error(err);
                    console.log('API 错误被捕捉', err.config.url);
                    this._reportFactory('error', 'API 错误被捕捉', 'Error', err);
                }
                handler.reject(err);
            },
            onResponse: (response, handler) => {
                if (!this._options.filterUrls.includes(response.config.url)) {
                    const res = this._checkRules(response);
                    if (res) {
                        console.log('API 不符合规则被捕捉', response.config.url);
                        this._reportFactory('error', 'API 不符合规则被捕捉', 'Response', response);
                    }
                }
                handler.next(response);
            },
        });
    }
    _fetch() { }
    _error() {
        window.addEventListener('error', (e) => {
            const data = {
                t: new Date().getTime(),
                msg: `${e.target.localName} is load error`,
                target: e.target.localName,
                type: e.type,
                resourceUrl: e.target.href || e.target.currentSrc,
            };
            this._reportFactory('error', '资源加载错误', 'Stack', data);
        }, true);
        window.onerror = (msg, _url, line, col, error) => {
            setTimeout(() => {
                col = col || 0;
                const data = {
                    t: new Date().getTime(),
                    msg: error && error.stack ? error.stack.toString() : msg,
                    resourceUrl: _url,
                    line: line,
                    col: col,
                };
                this._reportFactory('error', '脚本错误', 'Stack', data);
            }, 0);
        };
        window.addEventListener('unhandledrejection', (e) => {
            const error = e && e.reason;
            const message = error.hasOwnProperty('message') ? error.message : '';
            const stack = error.stack || '';
            let resourceUrl, col, line;
            let errs = stack.match(/\(.+?\)/);
            if (errs && errs.length) {
                errs = errs[0];
                errs = errs.replace(/\w.+[js|html]/g, ($1) => {
                    resourceUrl = $1;
                    return '';
                });
                errs = errs.split(':');
            }
            if (errs && errs.length > 1)
                line = parseInt(errs[1] || 0, 10);
            if (errs && errs.length > 2)
                col = parseInt(errs[2] || 0, 10);
            const data = {
                t: new Date().getTime(),
                msg: message,
                resourceUrl: resourceUrl,
                line: col,
                col: line,
            };
            this._reportFactory('error', '异步未处理的错误', 'Stack', data);
        });
        const oldError = console.error;
        console.error = (e) => {
            setTimeout(() => {
                const data = {
                    t: new Date().getTime(),
                    msg: e,
                    resourceUrl: location.href,
                };
                this._reportFactory('error', '控制台错误提示', 'Stack', data);
            }, 0);
            return oldError.apply(console, arguments);
        };
    }
    _privacy() {
        if (!this._options.usedCookies)
            return;
        const res = this._options.usedCookies.map(item => {
            const reg = new RegExp(`(^| )${item}=([^;]*)(;|$)`);
            const arr = document.cookie.match(reg);
            return { [item]: arr ? arr[2] : '' };
        });
        this._reportFactory('info', 'Cookies 记录', 'Cookies', res);
    }
    _checkRules(response) {
        const ruleObject = this._options.apiRules.filter(item => response.config.url.includes(item.url));
        if (!ruleObject) {
            console.error('当前缺少匹配的规则');
            return false;
        }
        if (ruleObject.length > 1) {
            console.error('API 规则定义重复, 将取最先定义项作为规则');
        }
        const rules = ruleObject[0].rules ? ruleObject[0].rules : null;
        if (!rules || !Array.isArray(rules))
            return false;
        if (response.status < 200 || response.status >= 400)
            return true;
        const map = new Map(rules.map((item) => [item.name, item.permission]));
        const rep = JSON.parse(response.response);
        const match = Object.keys(rep).map(key => {
            if (map.has(key)) {
                const permission = map.get(key);
                if (permission && permission.length === 0)
                    return true;
                if (permission && permission.indexOf(rep[key]) >= 0)
                    return true;
                else
                    return false;
            }
        });
        if (match.some(value => value === false))
            return true;
        return false;
    }
    _reportFactory(type, msg = '', scope = '', data = {}) {
        setTimeout(() => {
            Sentry.setExtra(scope, data);
            type === 'error'
                ? Sentry.captureException(new Error(msg))
                : Sentry.captureMessage(msg);
        }, this._options.timeOut);
    }
}
