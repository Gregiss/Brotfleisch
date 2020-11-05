const socket = io('https://brotfleisch.herokuapp.com/');
const sound = new Audio('./notifica.wav')

const app = new Vue({
    el: "#app",
    data: {
        login: '',
        senha: '',
        logged: false,
        path: window.location.pathname,
        cardapio: [],
        pedidoCardapio: [],
        total: 0,
        adicional: [],
        totalAdicional: [],
        cliente: "",
        pedidos: []
    },
    mounted(){
        socket.emit('card')
        const vue = this
        socket.on('cardapio', data => {
            vue.cardapio = data.cardapio
            vue.pedidoCardapio = [...data.cardapio],
            vue.adicional = data.adicional
            for(let i = 0; i < vue.pedidoCardapio.length; i++){
                vue.pedidoCardapio[i].adicional = []
            }
            vue.totalAdicional = []
        })
        socket.emit('listarPedidos')
        socket.on('novoPedido', data => {
            if(vue.path.includes("/pedidos")){
                sound.play()
                vue.pedidos = data
                vue.pedidos = vue.pedidos.reverse()
            } 
        })
        if(window.localStorage.getItem('token')){
            socket.emit('auth', window.localStorage.getItem('token'))
        }
        socket.on('token', token => {
            window.localStorage.setItem('token', token)
        })
        socket.on('authed', () => {
            vue.logged = true
        })
    },
    methods: {
        entrar(e){
            socket.emit('login', {user: this.login, password: this.senha})
            e.preventDefault()
        },
        updatePreco(){
            var total = 0;
            for(let i = 0; i < this.pedidoCardapio.length; i++){
                if(this.pedidoCardapio[i].quantidade > 0){
                    total += this.pedidoCardapio[i].quantidade * this.pedidoCardapio[i].preco
                    for(let i = 0; i < this.totalAdicional.length; i++){
                        const found = this.totalAdicional[i]
                        if(found){
                            total += parseFloat(this.totalAdicional[i].preco) * parseFloat(this.totalAdicional[i].qt)
                        }
                    }
                }
            }
            this.total = total
        },
        novoPedido(){
            const vue = this
            if(this.cliente.trim().length == 0){
                Toastify({
                    text: "Preencha o nome do cliente",
                    backgroundColor: "linear-gradient(to right, rgba(227,11,31,1),  rgba(203,20,37,0.9304096638655462))",
                    className: "info",
                }).showToast();
            } else{
            socket.emit("novoPedidoAa", {
                pedidos: vue.pedidoCardapio,
                adicional: vue.totalAdicional,
                total: vue.total,
                cliente: vue.cliente,
                token: window.localStorage.getItem('token')
            })
            Toastify({
                text: "Pedido enviado",
                backgroundColor: "linear-gradient(to right, rgba(227,11,31,1),  rgba(203,20,37,0.9304096638655462))",
                className: "info",
            }).showToast();
            socket.emit('card')
            this.cliemte = ""
            this.total = 0
        }
        },
        addAdicional(ad, id, lanche){  
            this.pedidoCardapio[id].adicional.push(ad)
            const found = this.totalAdicional.find(e => e.Lanche == lanche && e.adicional == ad.name)
            if(found){
                const id = this.totalAdicional.indexOf(found)
                this.totalAdicional[id].qt++
            } else{
                this.totalAdicional.push({
                    Lanche: lanche,
                    adicional: ad.name,
                    qt: 1,
                    preco: ad.preco
                })
            }
            this.updatePreco()
        },
        removeAdicional(ad, id, lanche){
            const found = this.totalAdicional.find(e => e.Lanche == lanche && e.adicional == ad.name)
            const found2 = this.pedidoCardapio[id].adicional.find(e => e.Lanche == lanche && adicional == ad.name)
            if(found2){
                const id2 = this.pedidoCardapio[id].adicional[found2]
                this.pedidoCardapio[id].addAdicional.splice(id2, 1)
            }
            if(found){
                const id3 = this.totalAdicional.indexOf(found)
                if(this.totalAdicional[id3].qt > 0){
                    --this.totalAdicional[id3].qt
                } else{
                    this.pedidoCardapio[id].addAdicional.splice(id2, 1)
                }
            }
            this.updatePreco()
        },
        finalizarPedido(pedido, ped){
            socket.emit('finalizarPedido', {
                pedido,
                ped,
                token: window.localStorage.getItem('token')
            })
        }
    }
})