const http = require('http')
const app = http.createServer((request, response) => {
  response.end('hello Node.js')
})
app.listen(3333, () => {
  console.log('App is listening at port 3333...')
})
