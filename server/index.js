const socketio = require('socket.io')
const express = require('express')
const http = require('http')
const path = require('path')

const app = express()

const server = http.createServer(app)

const io = socketio(server)

const port = process.env.PORT || 4000

const pubDirPath = path.join(__dirname, '../client')

app.use(express.static(pubDirPath))

// User objects
const users = {}
const typers = {}

const getUser = (data) => {
    const user = data
    return user
}

const joinMessage = (name) => { 
    return `<span class="user-name">${name}</span> has joined the conversation`
}

const leaveMessage = (name) => { 
    return `<span class="user-name">${name}</span> has left the conversation`
}

const theAvatar = (avatar) => {
    return `<span class="avatar" style="background: ${avatar}; background-size: contain;"></span>`
}

io.on('connection', (socket) => {
    console.log(`New Websocket Connection`)

    socket.on('user connection', payload => {
        users[socket.id] = {
            id: socket.id,
            name: payload.name,
            avatar: payload.avatar,
        }

        const user = users[socket.id]


        const message = joinMessage(user.name)
        const avatar = theAvatar(user.avatar)
        const userPayload = {
            avatar,
            message

        }



        socket.broadcast.emit('user connection', userPayload)
    })

    socket.on('user typing', () => {
        typers[socket.id] = 1

        socket.broadcast.emit('user typing', {
            user: users[socket.id].name,
            typers: Object.keys(typers).length
        })
    })

    socket.on('user stopped typing', () => {
        delete typers[socket.id]

        socket.broadcast.emit('user stopped typing', Object.keys(typers).length)
    })

    socket.on('send message', payload => {
        delete typers[socket.id]

        socket.broadcast.emit('send message', {
            user: payload.user,
            message: payload.message,
            typers: Object.keys(typers).length
        })
    })

    

    socket.on('disconnect', async () => {
        
        const data = users[socket.id]

        try {
            const user = await getUser(data) 
            const userName = user.name
            const userAvatar = user.avatar       


            const message = leaveMessage(userName)
            const avatar = theAvatar(userAvatar)
            const userPayload = {
                avatar,
                message

            }

            socket.broadcast.emit('user connection', userPayload)

            delete user
        } 
        catch (e) {
            return e
        }
    })

})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})