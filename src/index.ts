/*
 * @Author: Whzcorcd
 * @Date: 2020-10-28 09:12:47
 * @LastEditors: Whzcorcd
 * @LastEditTime: 2020-10-29 15:10:37
 * @Description: file content
 */
import * as Sentry from '@sentry/browser'
import ReporterBasic from './basic'
import { IOptions, TApiRules, IInitOptions } from './types'

class Reporter extends ReporterBasic {
  public options: IOptions

  constructor(options: IOptions) {
    const _filterUrls: Array<string> = [
      '/sockjs-node/info',
      'arms-retcode.aliyuncs.com',
      'aliyuncs.com',
      'ynuf.aliapp.org',
    ]
    const _apiRules: Array<TApiRules> = [
      {
        url: 'guangdianyun.tv',
        rules: [
          { name: 'code', permission: [200] },
          { name: 'data', permission: [] },
          { name: 'errorCode', permission: [0] },
          { name: 'errorMessage', permission: [] },
        ],
      },
    ]
    const _usedCookies = ['CONSOLE_TOKEN_GDY']
    const _options: IOptions = {
      // Sentry dsn
      dsn: '',
      // 版本信息
      version: '1.0.0',
      // 环境变量
      env: '',
      // appid
      appid: '',
      // uin
      uin: 0,
      // 项目名称
      name: '',
      // 是否上报 ajax 数据
      isAjax: true,
      // 是否上报错误信息
      isError: true,
      // 是否上报 cookies 信息
      isCookies: true,
      // 脚本延迟上报时间
      timeOut: 300,
      // ajax 请求时需要过滤的 url 信息
      filterUrls: [],
      // api 校验规则
      apiRules: [],
      // 记录的 cookies 列表
      usedCookies: [],
    }

    Object.assign(_options, options)
    _options.filterUrls = (_options.filterUrls as Array<string>).concat(
      _filterUrls
    )
    _options.apiRules = (_options.apiRules as Array<TApiRules>).concat(
      _apiRules
    )
    _options.usedCookies = (_options.usedCookies as Array<string>).concat(
      _usedCookies
    )
    super(_options)
    this.options = _options
    console.log(this.options)

    let environment = ''
    switch (this.options.env) {
      case 'TEST':
        environment = 'development'
        break
      case 'PRE':
        environment = 'preview'
        break
      case '':
        environment = 'production'
        break
      default:
        environment = 'production'
        break
    }

    Sentry.init({
      dsn: this.options.dsn,
      release: this.options.version,
      environment: environment,
    })

    Sentry.setUser({
      AppId: this.options.appid,
      Uin: this.options.uin,
      Name: this.options.name,
      Environment: environment,
    })

    Sentry.setTag('Uin', String(this.options.uin))
    Sentry.setTag('Appid', <string>this.options.appid)
  }

  public init(options: IInitOptions): void {
    const _options = {
      // Sentry dsn
      dsn: '',
      // 版本信息
      version: '1.0.0',
      // 环境变量
      env: '',
    }

    Object.assign(_options, options)

    let environment = ''
    switch (_options.env) {
      case 'TEST':
        environment = 'development'
        break
      case 'PRE':
        environment = 'preview'
        break
      case '':
        environment = 'production'
        break
      default:
        environment = 'production'
        break
    }
    Sentry.init({
      dsn: String(_options.dsn),
      release: _options.version,
      environment: environment,
    })
  }

  public setUser(
    appid: string,
    uin: number,
    name: string = '',
    env: string = ''
  ): void {
    let environment = ''
    switch (env) {
      case 'TEST':
        environment = 'development'
        break
      case 'PRE':
        environment = 'preview'
        break
      case '':
        environment = 'production'
        break
      default:
        environment = 'production'
        break
    }
    Sentry.setUser({
      AppId: appid,
      Uin: uin,
      Name: name,
      Environment: environment,
    })
  }

  public api(appid: string, uin: number, msg: string, data: any = {}): void {
    Sentry.configureScope(function (scope) {
      scope.setTag('appid', appid)
      scope.setTag('uin', String(uin))
    })
    Sentry.setTag('Uin', String(uin))
    Sentry.setTag('Appid', appid)
    Sentry.setExtra('data', data)
    Sentry.captureException(new Error(`Api Error:${msg}`))
  }

  public info(
    appid: string,
    uin: number,
    msg: string = 'Info',
    data: any = {}
  ): void {
    Sentry.configureScope(function (scope) {
      scope.setTag('appid', appid)
      scope.setTag('uin', String(uin))
    })
    Sentry.setTag('Uin', String(uin))
    Sentry.setTag('Appid', appid)
    Sentry.setExtra('data', data)
    Sentry.captureMessage(msg)
  }

  public error(
    appid: string,
    uin: number,
    msg: string = 'New Error',
    data: any = {}
  ): void {
    Sentry.configureScope(function (scope) {
      scope.setTag('appid', appid)
      scope.setTag('uin', String(uin))
    })
    Sentry.setTag('Uin', String(uin))
    Sentry.setTag('Appid', appid)
    Sentry.setExtra('data', data)
    Sentry.captureException(new Error(msg))
  }
}

export default Reporter
