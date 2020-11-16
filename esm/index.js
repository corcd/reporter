import * as Sentry from '@sentry/browser';
import ReporterBasic from './basic';
class Reporter extends ReporterBasic {
    constructor(options) {
        const _filterUrls = [
            '/sockjs-node/info',
            'arms-retcode.aliyuncs.com',
            'aliyuncs.com',
            'ynuf.aliapp.org',
            'sentry.guangdianyun.tv'
        ];
        const _apiRules = [
            {
                url: 'guangdianyun.tv',
                rules: [
                    { name: 'code', permission: [200] },
                    { name: 'data', permission: [] },
                    { name: 'errorCode', permission: [0] },
                    { name: 'errorMessage', permission: [] },
                ],
            },
        ];
        const _usedCookies = ['CONSOLE_TOKEN_GDY'];
        const _options = {
            dsn: '',
            version: '1.0.0',
            env: '',
            appid: '',
            uin: 0,
            name: '',
            isAjax: true,
            isError: true,
            isCookies: true,
            timeOut: 300,
            filterUrls: [],
            apiRules: [],
            usedCookies: [],
        };
        Object.assign(_options, options);
        _options.filterUrls = _options.filterUrls.concat(_filterUrls);
        _options.apiRules = _options.apiRules.concat(_apiRules);
        _options.usedCookies = _options.usedCookies.concat(_usedCookies);
        super(_options);
        this.options = _options;
        console.log(this.options);
        let environment = '';
        switch (this.options.env) {
            case 'TEST':
                environment = 'development';
                break;
            case 'PRE':
                environment = 'preview';
                break;
            case '':
                environment = 'production';
                break;
            default:
                environment = 'production';
                break;
        }
        Sentry.init({
            dsn: this.options.dsn,
            release: this.options.version,
            environment: environment,
        });
        Sentry.setUser({
            AppId: this.options.appid,
            Uin: this.options.uin,
            Name: this.options.name,
            Environment: environment,
        });
        Sentry.setTag('Uin', String(this.options.uin));
        Sentry.setTag('Appid', this.options.appid);
    }
    static getInstance(options) {
        if (!this.singleInstance) {
            this.singleInstance = new Reporter(options);
        }
        return this.singleInstance;
    }
    init(options) {
        const _options = {
            dsn: '',
            version: '1.0.0',
            env: '',
        };
        Object.assign(_options, options);
        let environment = '';
        switch (_options.env) {
            case 'TEST':
                environment = 'development';
                break;
            case 'PRE':
                environment = 'preview';
                break;
            case '':
                environment = 'production';
                break;
            default:
                environment = 'production';
                break;
        }
        Sentry.init({
            dsn: String(_options.dsn),
            release: _options.version,
            environment: environment,
        });
    }
    setUser(appid, uin, name = '', env = '') {
        let environment = '';
        switch (env) {
            case 'TEST':
                environment = 'development';
                break;
            case 'PRE':
                environment = 'preview';
                break;
            case '':
                environment = 'production';
                break;
            default:
                environment = 'production';
                break;
        }
        Sentry.setUser({
            AppId: appid,
            Uin: uin,
            Name: name,
            Environment: environment,
        });
    }
    api(appid, uin, msg, data = {}) {
        Sentry.configureScope(function (scope) {
            scope.setTag('appid', appid);
            scope.setTag('uin', String(uin));
        });
        Sentry.setTag('Uin', String(uin));
        Sentry.setTag('Appid', appid);
        Sentry.setExtra('data', data);
        Sentry.captureException(new Error(`API 手动捕捉 ${msg}`));
    }
    info(appid, uin, msg = 'Info', data = {}) {
        Sentry.configureScope(function (scope) {
            scope.setTag('appid', appid);
            scope.setTag('uin', String(uin));
        });
        Sentry.setTag('Uin', String(uin));
        Sentry.setTag('Appid', appid);
        Sentry.setExtra('data', data);
        Sentry.captureMessage(msg);
    }
    error(appid, uin, msg = 'New Error', data = {}) {
        Sentry.configureScope(function (scope) {
            scope.setTag('appid', appid);
            scope.setTag('uin', String(uin));
        });
        Sentry.setTag('Uin', String(uin));
        Sentry.setTag('Appid', appid);
        Sentry.setExtra('data', data);
        Sentry.captureException(new Error(msg));
    }
}
Reporter.singleInstance = null;
const reporter = (options) => Reporter.getInstance(options);
export default reporter;
