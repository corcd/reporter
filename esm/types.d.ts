export declare function unProxy(): void;
export declare function unHook(): void;
export interface IOptions {
    dsn: string;
    version?: string;
    env?: 'TEST' | 'PRE' | '';
    appid?: string;
    uin?: number;
    name?: string;
    isAjax?: boolean;
    isError?: boolean;
    isCookies?: boolean;
    timeOut?: number;
    filterUrls?: Array<string>;
    apiRules?: Array<TApiRules>;
    usedCookies?: Array<string>;
}
export declare type TApiRulesItem = {
    name: string;
    permission: Array<any>;
};
export declare type TApiRules = {
    url: string;
    rules: Array<TApiRulesItem>;
};
export interface IInitOptions {
    dsn: string;
    version: string;
    env: 'TEST' | 'PRE' | '';
}
export declare type TReport = 'info' | 'error';
interface XhrRequestConfig {
    method: string;
    url: string;
    headers: any;
    body: any;
    async: boolean;
    user: string;
    password: string;
    withCredentials: boolean;
    xhr: any;
}
export interface XhrResponse {
    config: XhrRequestConfig;
    headers: any;
    response: any;
    status: number;
    statusText?: string;
}
export {};
