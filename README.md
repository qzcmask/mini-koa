# mini-koa

[`mini-koa`](https://github.com/qzcmask/mini-koa)是一个精简版`koa`和`koa-router`的结合，是一个值得学习`Node`网络框架封装的项目。

这个项目是我根据日常使用`koa`和`koa-router`的经验写的，没有参考过它们两者的源码，项目仅供学习。

`mini-koa`代码很精简，核心代码不超过`300`行，[源代码]((https://github.com/qzcmask/mini-koa))配有详细的注释。

## 安装

### NPM

```
npm i mini-koa -S
```

### 下载文件

可以直接下载项目到本地。

```
cd 项目目录

// 测试服务
npm run example
```

## 用法

用法跟`koa`类似，目前mini-koa支持以下方法：

```
Koa.prototype.use()
Koa.prototype.all()
Koa.prototype.get()
Koa.prototype.post()
Koa.prototype.listen()
Koa.prototype.addRoutes() # 添加子路由

// put/delete等其他方法类似get/post，故不加入源代码中
```

`mini-koa-router`支持以下方法：

```
Koa.prototype.use()
Koa.prototype.all()
Koa.prototype.get()
Koa.prototype.post()
```

其中，`use/all/get/post`等方法的url参数支持`params`写法，即

```
app.get('/user/:id')
```

在路由监听函数内，可以用的变量：

```
ctx.query: 查询参数('/user/abc?a=1')
ctx.params: 路由上的占位变量('/user/:id')
```

## 具体示例

```
// 代码放置在examples/server.js

const { Koa, KoaRouter } = require('mini-koa')
const app = new Koa()
// 路由用法
const userRouter = new KoaRouter({
  prefix: '/user'
})

// 中间件函数
app.use(async (ctx, next) => {
  console.log(`请求url, 请求method: `, ctx.req.url, ctx.req.method)
  await next()
})

// 方法示例
app.get('/get', async ctx => {
  ctx.body = 'hello ,app get'
})

app.post('/post', async ctx => {
  ctx.body = 'hello ,app post'
})

app.all('/all', async ctx => {
  ctx.body = 'hello ,/all 支持所有方法'
})

// 子路由使用示例
userRouter.post('/login', async ctx => {
  ctx.body = 'user login success'
})

userRouter.get('/logout', async ctx => {
  ctx.body = 'user logout success'
})

userRouter.get('/:id', async ctx => {
  ctx.body = '用户id： ' + ctx.params.id
})

// 添加路由
app.addRoutes(userRouter)

// 监听端口
app.listen(3000, () => {
  console.log('> App is listening at port 3000...')
})

```

## 联系作者

作者: Mask

项目地址: [`mini-koa`](https://github.com/qzcmask/mini-koa)