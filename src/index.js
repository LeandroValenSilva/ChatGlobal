import express from 'express';
import { __dirname } from "./util.js";
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';

const app = express()
const port = 3000

app.use(express.static(__dirname + '/../public'))
app.engine('handlebars', handlebars.engine()); //arranca el motor
app.set('views', __dirname + '/views');//se le da la ruta de las vistas
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Ingresar al chat'
  })
})

app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'motores/contacto',
    dato: 'por jugar'
  })
})

app.get('/chat', (req, res) => {
  const username = typeof req.query.username === 'string'
    ? req.query.username.trim()
    : ''
  if (!username || username.length > 30) {
    return res.redirect('/')
  }
  res.render('chat', {
    title: 'Chat global',
    username
  })
})

const httpServer = app.listen(port, () => {
  console.log('Servidor funcionando en http://localhost:', { port })
})
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('Un navegador se conectó', socket.id)
  io.emit('usuariosConectados', io.of('/').sockets.size)
  socket.on('registrarUsuario', (username) => {
    console.log('Solicitud de registro:', username)

    if (typeof username !== 'string') {
      return
    }

    const nombre = username.trim()

    if (!nombre || nombre.length > 30) {
      return
    }

    socket.data.username = nombre

    console.log('Usuario registrado:', socket.data.username)
  })
  socket.on('enviarMensaje', (texto) => {
    console.log('Mensaje recibido:', texto, 'Usuario:', socket.data.username)
    if (!socket.data.username || typeof texto !== 'string') {
      return
    }

    const mensaje = texto.trim()

    if (!mensaje || mensaje.length > 500) {
      return
    }

    io.emit('nuevoMensaje', {
      username: socket.data.username,
      texto: mensaje,
      fecha: new Date().toISOString(),
      emisorId: socket.id
    })
  })
  socket.on('disconnect', () => {
  io.emit('usuariosConectados', io.of('/').sockets.size)
})
})