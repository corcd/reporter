/*
 * @Author: Whzcorcd
 * @Date: 2020-10-28 09:26:11
 * @LastEditors: Whzcorcd
 * @LastEditTime: 2020-11-16 19:29:06
 * @Description: file content
 */
import * as Sentry from '@sentry/browser'
import { proxy } from 'ajax-hook'
import {
  TApiRulesItem,
  TApiRules,
  IOptions,
  TReport,
  XhrResponse,
} from './types'

export default class ReporterBasic {
  private _options: IOptions

  constructor(options: IOptions) {
    this._options = options

    if (this._options.isAjax) {
      this._ajax()
      this._fetch()
    }
    if (this._options.isError) this._error()
    this._privacy()
  }

  private _ajax(): void {
    proxy({
      // 请求发起前进入
      onRequest: (config, handler) => {
        handler.next(config)
      },
      // 请求发生错误时进入，比如超时；注意，不包括 http 状态码错误，如 404 仍然会认为请求成功
      onError: (err, handler) => {
        if (this._checkUrlLegal(err.config.url)) {
          console.log('API 错误被捕捉', err.config.url)
          this._reportFactory('error', 'API 错误被捕捉', 'Error', err)
        }
        handler.reject(err)
      },
      // 请求成功后进入
      onResponse: (response, handler) => {
        if (this._checkUrlLegal(response.config.url)) {
          const res = this._checkXhrRules(response)
          if (res) {
            console.log('API 不符合规则被捕捉', response.config.url)
            this._reportFactory(
              'error',
              'API 不符合规则被捕捉',
              'Response',
              response
            )
          }
        }
        handler.next(response)
      },
    })
  }

  private _fetch(): void {
    const intercept = async (response: Response): Promise<Response> => {
      if (!response.body) return response

      const _this = this
      const reader = (<ReadableStream>response.body).getReader()
      const stream = new ReadableStream({
        start(controller) {
          function push(): void {
            // "done" 是一个布尔型，"value" 是一个 Unit8Array
            reader.read().then(e => {
              const { done, value } = e
              // 判断是否还有可读的数据
              const decodedValue = new TextDecoder('utf-8').decode(value)

              if (done) {
                // 告诉浏览器已经结束数据发送
                controller.close()
                return
              }

              // console.log(done, decodedValue)
              if (_this._checkUrlLegal(response.url)) {
                try {
                  const data = value ? JSON.parse(decodedValue) : {}
                  const res = _this._checkFetchRules(response, data)

                  if (res) {
                    console.log('API 不符合规则被捕捉', response.url)
                    _this._reportFactory(
                      'error',
                      'API 不符合规则被捕捉',
                      'Response',
                      response
                    )
                  }
                } catch (err) {
                  // 非 json 返回值
                  console.log('API 不符合规则被捕捉', response.url)
                  _this._reportFactory(
                    'error',
                    'API 不符合规则被捕捉',
                    'Response',
                    response
                  )
                }
              }
              // 取得数据并将它通过 controller 发送给浏览器
              controller.enqueue(value)
              push()
            })
          }
          push()
        },
      })
      return new Response(stream, {
        headers: response.headers,
      })
    }

    const originFetch = fetch
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get() {
        return (url: string, options: any) => {
          return originFetch(url, { ...options }).then(intercept)
        }
      },
      set() {},
    })
  }

  private _error(): void {
    // img, script, css, jsonp
    window.addEventListener(
      'error',
      (e: ErrorEvent) => {
        const data = {
          t: new Date().getTime(),
          msg: `${(e.target as any).localName} is load error`,
          target: (e.target as any).localName,
          type: e.type,
          resourceUrl: (e.target as any).href || (e.target as any).currentSrc,
        }
        // 上报错误信息
        this._reportFactory('error', '资源加载错误', 'Stack', data)
      },
      true
    )
    // js
    window.onerror = (msg, _url, line, col, error): void => {
      setTimeout((): void => {
        col = col || 0
        const data = {
          t: new Date().getTime(),
          msg: error && error.stack ? error.stack.toString() : msg,
          resourceUrl: _url,
          line: line,
          col: col,
        }
        // 上报错误信息
        this._reportFactory('error', '脚本错误', 'Stack', data)
      }, 0)
    }
    window.addEventListener(
      'unhandledrejection',
      (e: PromiseRejectionEvent): void => {
        const error = e && e.reason
        const message = error.hasOwnProperty('message') ? error.message : ''
        const stack = error.stack || ''
        // Processing error
        let resourceUrl, col, line
        let errs = stack.match(/\(.+?\)/)
        if (errs && errs.length) {
          errs = errs[0]
          errs = errs.replace(/\w.+[js|html]/g, ($1: string) => {
            resourceUrl = $1
            return ''
          })
          errs = errs.split(':')
        }
        if (errs && errs.length > 1) line = parseInt(errs[1] || 0, 10)
        if (errs && errs.length > 2) col = parseInt(errs[2] || 0, 10)
        const data = {
          t: new Date().getTime(),
          msg: message,
          resourceUrl: resourceUrl,
          line: col,
          col: line,
        }
        // 上报错误信息
        this._reportFactory('error', '异步未处理的错误', 'Stack', data)
      }
    )
    // 重写 console.error
    const _this = this
    const oldError = console.error
    console.error = function (e: ErrorEvent): void {
      setTimeout((): void => {
        const data = {
          t: new Date().getTime(),
          msg: e,
          resourceUrl: location.href,
        }
        // 上报错误信息
        _this._reportFactory('error', '控制台错误提示', 'Stack', data)
      }, 0)
      return oldError.apply(console, (arguments as unknown) as any[])
    }
  }

  private _privacy(): void {
    if (!this._options.usedCookies) return

    const res = this._options.usedCookies.map(item => {
      const reg = new RegExp(`(^| )${item}=([^;]*)(;|$)`)
      const arr = document.cookie.match(reg)
      return { [item]: arr ? arr[2] : '' }
    })
    this._reportFactory('info', 'Cookies 记录', 'Cookies', res)
  }

  private _checkXhrRules(response: XhrResponse): boolean {
    // true 为标记，false为忽略
    // TODO response 为空处理

    const ruleObject = (this._options.apiRules as Array<
      TApiRules
    >).filter(item => response.config.url.includes(item.url))

    if (!ruleObject) {
      console.log('当前缺少匹配的规则')
      return false
    }
    if (ruleObject.length > 1) {
      console.log('API 规则定义重复, 将取最先定义项作为规则')
    }

    const rules = ruleObject[0].rules ? ruleObject[0].rules : null
    if (!rules || !Array.isArray(rules)) return false

    // http 状态码判断
    if (response.status < 200 || response.status >= 400) return true
    // 允许值判断
    const map = new Map(
      rules.map((item: TApiRulesItem) => [item.name, item.permission])
    )
    const rep = JSON.parse(response.response)
    const match = Object.keys(rep).map(key => {
      if (map.has(key)) {
        // true 为通过，false为不通过
        const permission = map.get(key)
        if (permission && permission.length === 0) return true
        if (permission && permission.indexOf(rep[key]) >= 0) return true
        else return false
      }
    })
    if (match.some(value => value === false)) return true
    return false
  }

  private _checkUrlLegal(url: string): boolean {
    if ((<string[]>this._options.filterUrls).length === 0) {
      return true
    }
    const result = (<string[]>this._options.filterUrls).some(item =>
      url.includes(item)
    )
    return !result
  }

  private _checkFetchRules(response: Response, data: any = {}): boolean {
    // true 为标记，false 为忽略
    // TODO response 为空处理
    if (Object.keys(data).length === 0) return false
    if (response.url.includes('sentry_key')) return false

    const ruleObject = (this._options.apiRules as Array<
      TApiRules
    >).filter(item => response.url.includes(item.url))

    if (!ruleObject) {
      console.log('当前缺少匹配的规则')
      return false
    }
    if (ruleObject.length > 1) {
      console.log('API 规则定义重复, 将取最先定义项作为规则')
    }

    const rules = ruleObject[0].rules ? ruleObject[0].rules : null
    if (!rules || !Array.isArray(rules)) return false

    // http 状态码判断
    if (response.status < 200 || response.status >= 400) return true
    // 允许值判断
    const map = new Map(
      rules.map((item: TApiRulesItem) => [item.name, item.permission])
    )
    const match = Object.keys(data).map(key => {
      if (map.has(key)) {
        // true 为通过，false 为不通过
        const permission = map.get(key)

        if (permission && permission.length === 0) return true

        if (permission && permission.indexOf(data[key]) >= 0) return true
        else return false
      }
    })
    if (match.some(value => value === false)) return true
    return false
  }

  private _reportFactory(
    type: TReport,
    msg: string = '',
    scope = '',
    data: any = {}
  ): void {
    setTimeout((): void => {
      Sentry.setExtra(scope, data)
      type === 'error'
        ? Sentry.captureException(new Error(msg))
        : Sentry.captureMessage(msg)
    }, this._options.timeOut)
  }
}
