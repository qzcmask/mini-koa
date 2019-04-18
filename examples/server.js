const { Koa, KoaRouter } = require('../index')
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
