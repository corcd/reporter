import ReporterBasic from './basic';
import { IOptions, IInitOptions } from './types';
declare class Reporter extends ReporterBasic {
    options: IOptions;
    constructor(options: IOptions);
    init(options: IInitOptions): void;
    setUser(appid: string, uin: number, name?: string, env?: string): void;
    api(appid: string, uin: number, msg: string, data?: any): void;
    info(appid: string, uin: number, msg?: string, data?: any): void;
    error(appid: string, uin: number, msg?: string, data?: any): void;
}
export default Reporter;
