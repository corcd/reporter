# @gdyfe/reporter

gdyfe 团队新版本非侵入式 Sentry 前端异常自动上报工具，基于 Typescript 开发，可以一行代码实现 Xhr/Fetch 异常收集、错误信息上报、页面性能统计（开发中）等功能

> 目前暂时仅支持浏览器端项目，未来计划支持 Node.js 等

## 引入方式

### 资源引用方式

1. 下载 `dist/reporter.min.js` 至本地
2. 使用 `script` 标签引入到 `html` 的头部（请放置在所有 js 资源之前）
3. 配置使用 `reporter`

```html
<html>
  <head>
    <meta charset="UTF-8" />
    <title>report test</title>
    <script src="../dist/reporter.min.js"></script>
    <script>
      reporter({
        dsn: '...Your Sentry Dsn'
      })
    </script>
  </head>
</html>
```

### NPM 引入方式

```bash
sudo npm install @gdyfe/reporter --save
sudo yarn add @gdyfe/reporter
```

```javascript
import reporter from '@gdyfe/reporter'
```

### 参数配置

| parameter name | describe                | explain                                                                                                                 |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| dsn            | Sentry Dsn              | 必选项，从 sentry 项目中获取，请优先使用 https                                                                          |
| version        | 当前项目版本            | 字符串，可从 package.json 取，默认为 1.0.0                                                                              |
| env            | 环境变量                | 字符串，TEST/PRE/（空），对应测试、预发、生产环境                                                                       |
| appid          | 唯一标识                | 字符串，可为 appid 或其他唯一标识                                                                                       |
| uin            | 用户 uin                | 数字，默认为 0                                                                                                          |
| name           | 项目名称                | 字符串                                                                                                                  |
| isAjax         | 是否上报 xhr/fetch 数据 | 默认 true                                                                                                               |
| isError        | 是否上报错误信息        | 默认 true                                                                                                               |
| isCookies      | 是否上报 cookies 信息   | 默认 true                                                                                                               |
| timeOut        | 脚本延迟上报时间        | 数字，默认 300ms                                                                                                        |
| filterUrls     | url 过滤列表            | 字符串数组，过滤列表内 url ，将不再自动上报                                                                             |
| apiRules       | api 规则列表            | 规则数组，使用固有格式定制 API 校验规范（已定义且不符合规则的 API 将上报，未定义的 API 请求出错时上报），详情见单独说明 |
| usedCookies    | 需要摘取的 cookies 列表 | 字符串数组，单项为需要摘取的 cookie 的 name，默认集成 'CONSOLE_TOKEN_GDY'                                               |

### API Rules

apiRules 示例：

```javascript
[{
  url: 'xxxxx',
  rules: [
    { name: 'code', permission: [] },
    { name: 'data', permission: [] },
    { name: 'errorMessage', permission: [] }
  ]
}]
```

rules 为规则数组。其中单项的 name 为 response 内对应项的字段名，permission 为允许的值的集合数组（为空时表示所有值都被允许）。重复定义的规则项将以首个规则为准。

若 response 内相应 name 的数据，不为其 permission 中任一元素，则该条记录将会被上报至 sentry

> 当前内部已集成最基础的云平台 API 规则，无须自定义：
>
> ```javascript
> {
>   url: 'guangdianyun.tv',
>   rules: [
>     { name: 'code', permission: [200] },
>     { name: 'data', permission: [] },
>     { name: 'errorCode', permission: [0] },
>     { name: 'errorMessage', permission: [] }
>   ]
> }
> ```

### 参考示例

```javascript
import reporter from '@gdyfe/reporter'

reporter({
  dsn: 'https://xxxxxxxxxxxxxxxxx@sentry.guangdianyun.tv/x',
  version: '1.0.2',
  env: 'TEST',
  appid: 'xxxxxxxxx',
  uin: 1000,
  name: 'Sentry',
  isAjax: true,
  isError: true,
  isCookies: true,
  timeOut: 300,
  filterUrls: ['xxx.xxx.com', 'yyy.yyy.com'],
  apiRules: [{
    url: 'xxxxx',
    rules: [
      { name: 'code', permission: [200, 201] },
      { name: 'data', permission: [] },
      { name: 'errorMessage', permission: [] }
    ]
  }],
  usedCookies: ['token', 'user_ip'],
})
```

### 外部命令

#### reporter.init

提供在工具加载后重新初始化 Sentry 信息的功能，支持对象参数导入，对象支持 3 个参数（dsn，version，env），配置规则同配置列表所示

```javascript
const option = {
  // sentry dsn
  dsn: 'https://xxxxxxxxxxxxxxxxx@sentry.guangdianyun.tv/x',
  // 版本信息
  version: '1.0.0',
  // 环境变量
  env: 'TEST'
}
reporter.init(option)
```

#### reporter.setUser

提供在工具加载后设置 Sentry 用户信息的功能，支持 4 个参数（appid, uin，name，env），配置规则同配置列表所示

```javascript
reporter.setUser('xxxxxx', 1000, 'Lcps', 'TEST')
```

#### reporter.api

自定义上报 API 异常功能，支持 4 个参数（appid, uin，msg, data），其中 msg 为信息内容，data 为数据体，配置规则同配置列表所示

```javascript
const { data } = await API()
reporter.api('xxxxxx', 1000, 'api error', response)
```

#### reporter.info

自定义上报提示信息，支持 4 个参数（appid, uin，msg, data），其中 msg 为信息内容，data 为数据体，配置规则同配置列表所示

```javascript
const str = 'hello world'
reporter.info('xxxxxx', 1000, 'init message', str)
```

#### reporter.error

自定义上报错误信息，支持 4 个参数（appid, uin，msg, data），其中 msg 为错误内容，data 为数据体，配置规则同配置列表所示

```javascript
const error = 'data is undefined'
reporter.error('xxxxxx', 1000, 'i get error', error)
```

### Typescript

支持
