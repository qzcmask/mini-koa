const http = require('http')

/**
 * 解析url的查询参数，比如/a?name=123&pwd=456 解析成 {name: 123, pwd: 456}
 * @param {string} url 请求路径
 */
const parseUrlParams = url => {
  const query = {}
  const index = url.indexOf('?')
  if (index < 0) {
    return query
  }
  url = url.substring(index + 1)
  url.split('&').forEach(function(item) {
    let obj = item.split('=')
    query[obj[0]] = obj[1] || undefined
  })
  return query
}

/**
 * Koa精简版
 * @author Mask
 */
class Koa {
  /**
   * 构造函数
   */
  constructor() {
    // 路由监听列表
    this.binding = {}
    // 监听实例
    this.httpApp = null
    // 初始化
    this.init()
  }

  /**
   * 初始化
   */
  init() {
    // 这里要绑定this，不然requestServer里面的this是Server实例
    this.httpApp = http.createServer(this._requestServer.bind(this))
  }

  /**
   * http请求函数
   * @param {*} request
   * @param {*} response
   */
  async _requestServer(request, response) {
    // 本次请求的环境
    const ctx = {}
    request.query = {}
    request.params = {}
    ctx.req = request
    ctx.request = request
    ctx.res = response
    ctx.response = response
    ctx.query = request.query
    ctx.params = request.params

    // 设置一些默认响应头
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/plain;charset=utf-8')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader(
      'Access-Control-Allow-Methods',
      'PUT,POST,GET,DELETE,OPTIONS'
    )

    // 追踪ctx.body赋值
    Object.defineProperty(ctx, 'body', {
      set(val) {
        // set()里面的this是ctx
        response.end(val)
      },
      get() {
        throw new Error(`ctx.body can't read, only support assign value.`)
      }
    })

    // 解析url,获取查询参数，类似/a?name=123&pwd=456
    const method = request.method
    const rawUrl = request.url
    const resUrl = rawUrl.match(/(\/[^?&=]*)/i)
    let url = rawUrl
    if (resUrl) {
      url = resUrl[1]
    }
    // 解析参数，需要重新指向ctx.query，不然追踪会断掉
    request.query = parseUrlParams(rawUrl)
    ctx.query = request.query

    // 默认use函数前缀
    let prefix = '/'
    // 要预先调用的use函数列表
    let useFnList = []

    // 分割url，使用use函数
    // 比如item为/user/a/b映射成[('user', 'a', 'b')]
    const filterUrl = url.split('/').filter(item => item !== '')
    // 该reduce的作用是找出本请求要use的函数列表
    filterUrl.reduce((cal, item) => {
      prefix = cal
      if (this.binding[prefix] && this.binding[prefix].length) {
        const filters = this.binding[prefix].filter(router => {
          return router.method === 'use'
        })
        useFnList.push(...filters)
      }
      return (
        '/' +
        [cal, item]
          .join('/')
          .split('/')
          .filter(item => item !== '')
          .join('/')
      )
    }, prefix)

    // 1 调用use函数列表，可以做日志记录等等
    if (useFnList.length) {
      for (let i = 0, length = useFnList.length; i < length; i++) {
        let router = useFnList[i]
        let isNext = false
        const next = () => {
          isNext = true
          return Promise.resolve()
        }
        await router.fn(ctx, next)
        if (isNext) {
          continue
        } else {
          // 没有调用next，直接中止请求处理函数
          return
        }
      }
    }

    // 2 遍历特定的路由监听函数
    const routerList = []

    // 2.1 添加具体匹配路由函数
    if (this.binding[url] && this.binding[url].length) {
      routerList.push(...this.binding[url])
    }

    // 2.2 添加模糊路由监听函数，比如请求的url为'/post/123'，可以映射到'/post/:id'监听上
    let bindingUrlList = Object.keys(this.binding).map(item => {
      // 比如item为/user/a/b映射成['user', 'a', 'b']
      return item.split('/').filter(i => i !== '')
    })

    // 模糊判断，过滤路由参数长度不同的项
    bindingUrlList = bindingUrlList.filter(item => {
      return item.length === filterUrl.length
    })

    // 具体过滤，存在的路由监听函数是否匹配
    filterUrl.forEach((key, index) => {
      bindingUrlList = bindingUrlList.filter(item => {
        if (item[index].startsWith(':')) {
          // 这一项参数是查询参数（类似:id），挂载到request.params上
          let variableName = item[index].replace(':', '')
          request.params[variableName] = key
          return true
        } else if (item[index] === key) {
          // 值相等，不是查询参数
          return true
        } else {
          // 只有长度一致
          return false
        }
      })
    })

    // 根据过滤后的模糊路由来添加路由监听函数
    bindingUrlList.forEach(item => {
      let url = '/' + item.join('/')
      if (this.binding[url] && this.binding[url].length) {
        routerList.push(...this.binding[url])
      }
      routerList.push(...this.binding[url])
    })

    // 3 执行匹配路由
    if (routerList.length) {
      // 执行
      for (let i = 0, length = routerList.length; i < length; i++) {
        let router = routerList[i]
        if (router.method === method.toLowerCase() || router.method === 'all') {
          // 新的ctx
          let isNext = false
          const next = () => {
            isNext = true
            return Promise.resolve()
          }
          await router.fn(ctx, next)

          // 如果调用了next，则传递到下一个
          if (isNext) {
            continue
          } else {
            // 没有调用next，直接中止请求处理函数
            return
          }
        }
      }
      // 函数没有中断，不支持的方法
      response.statusCode = 404
      ctx.body = `不支持的方法 - ${method}`
    } else {
      // 没有监听
      response.statusCode = 404
      ctx.body = `${url}不存在`
    }
  }

  /**
   *
   * @param {string} method 请求方法
   * @param {string} url 请求的路由
   * @param {function} callback 请求回调函数
   */
  request(method, url, callback) {
    if (typeof url === 'function') {
      // 简单判断没有传入url
      callback = url
      url = '/'
    }

    if (!this.binding[url]) {
      this.binding[url] = []
    }

    this.binding[url].push({
      method: method,
      fn: callback
    })
  }

  /**
   * 中间件函数，可用作日志记录等等
   * @param {string} url 请求的路由
   * @param {function} callback 请求回调函数
   */
  use(url, callback) {
    this.request('use', url, callback)
  }

  /**
   * 监听所有的请求方法，包括get/post等等
   * @param {string} url 请求的路由
   * @param {function} callback 请求回调函数
   */
  all(url, callback) {
    this.request('all', url, callback)
  }

  /**
   * 监听get请求
   * @param {string} url 请求的路由
   * @param {function} callback 请求回调函数
   */
  get(url, callback) {
    this.request('get', url, callback)
  }

  /**
   * 监听post请求
   * @param {string} url 请求的路由
   * @param {function} callback 请求回调函数
   */
  post(url, callback) {
    this.request('post', url, callback)
  }

  /**
   * 监听端口
   * @param  {...any} args
   */
  listen(...args) {
    this.httpApp.listen(...args)
  }

  /**
   * 添加子路由
   * @param {MoaRouter} router
   */
  addRoutes(router) {
    if (!this.binding[router.prefix]) {
      this.binding[router.prefix] = []
    }
    // 路由拷贝
    Object.keys(router.binding).forEach(url => {
      if (!this.binding[url]) {
        this.binding[url] = []
      }
      this.binding[url].push(...router.binding[url])
    })
  }
}

module.exports = Koa
