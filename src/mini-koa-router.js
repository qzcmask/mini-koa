/**
 * koa-router精简版
 * @author Mask
 */
class KoaRouter {
  /**
   * 构造函数
   * @param {object} props 路由参数配置
   */
  constructor(props) {
    // 路由前缀
    this.prefix = props.prefix || '/'
    // 路由监听列表
    this.binding = {}
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

    if (this.prefix) {
      // 添加路由实例有前缀
      url =
        '/' +
        [this.prefix, url]
          .join('/')
          .split('/')
          .filter(item => item)
          .join('/')
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
}

module.exports = KoaRouter
