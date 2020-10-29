/*
 * @Author: Whzcorcd
 * @Date: 2020-10-28 11:04:26
 * @LastEditors: Whzcorcd
 * @LastEditTime: 2020-10-29 14:00:35
 * @Description: file content
 */
export declare function unProxy(): void

export declare function unHook(): void

export interface IOptions {
  dsn: string
  version?: string
  env?: 'TEST' | 'PRE' | ''
  appid?: string
  uin?: number
  name?: string
  isAjax?: boolean
  isError?: boolean
  isCookies?: boolean
  timeOut?: number
  filterUrls?: Array<string>
  apiRules?: Array<TApiRules>
  usedCookies?: Array<string>
}

export type TApiRulesItem = { name: string; permission: Array<any> }

export type TApiRules = {
  url: string
  rules: Array<TApiRulesItem>
}

export interface IInitOptions {
  dsn: string
  version: string
  env: 'TEST' | 'PRE' | ''
}

export type TReport = 'info' | 'error'

interface XhrRequestConfig {
  method: string
  url: string
  headers: any
  body: any
  async: boolean
  user: string
  password: string
  withCredentials: boolean
  xhr: any
}

export interface XhrResponse {
  config: XhrRequestConfig
  headers: any
  response: any
  status: number
  statusText?: string
}
