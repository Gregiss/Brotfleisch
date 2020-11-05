const express = require('express')
const path = require('path')
// const sqlite = require('sqlite-sync')
// const setup = require('./setup')
const verPedidos = require('./verPedidos')
const logar = require('./user/login.js')
const cardapio = require('./cardapio.json')
const adicional = require('./adicional.json')
const token = "yE-~!i]a_2F]FHIF4$8WKW1Q9A)c;81Rtmyl5oT@LQPmJ#fb!yI-Z?^24bK.e~Rj1)NN}aZK<UP!cPE67&`7!<i|8;tu*V*VM.ud`.-g$%DW;ylQuFX~EE~3i,m~46CCDB3CE93BE7"
const user = {user: 'brot', password: 'diegoBrot'}

// sqlite.connect('./brot.db')
//Setup do programa
// setup()

const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.static(path.join(__dirname, 'public')))
const porta = process.env.PORT || 8080

app.set('views', path.join(__dirname, 'public'))
app.engine('html', require('ejs').renderFile)

app.use('/', (req, res) => {
	res.render('index.html')
})

app.use('/pedidos', (req, res) => {
	res.render('pedidos.html')
})

var pedidos = []

io.on('connection', socket => {
	socket.on('login', data => {
		if(data.user && data.password){
			if(user.user.toLowerCase() == data.user.toLowerCase() && user.password.toLowerCase() == data.password.toLowerCase()){
				socket.emit('token', token)
			}
		}
	})
	socket.on('card', data => {
		socket.emit('cardapio', {cardapio: cardapio, adicional: adicional})
		socket.join('brot')
	})
	socket.on('novoPedidoAa', data => {
		if(data.token == token){
			data.id = pedidos.length + 1
			pedidos.push(data)
			io.sockets.in(`brot`).emit('novoPedido', pedidos)
		}
	})
	socket.on('listarPedidos', data => {
		io.sockets.in(`brot`).emit('novoPedido', pedidos)
	})
	socket.on('auth', data => {
		if(data == token){
			socket.emit('authed', true)
		}
	})
	socket.on('finalizarPedido', data => {
		if(data.token == token){
			if(data.pedido){
				const found = pedidos.find(e => e.id == data.pedido.id)
				if(found){
					const id = pedidos.indexOf(found)
					pedidos.splice(id, 1)
					io.sockets.in(`brot`).emit('novoPedido', pedidos)
				}
			}
		}
	})
})

server.listen(porta, () => {
	console.log("starting")
})