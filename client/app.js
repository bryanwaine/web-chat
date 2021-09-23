const socket = io()

// Elements
const dom = {
    messageForm: document.querySelector('.messaging-form'),
    nameInput: document.querySelector('.name-input'),
    joinButton: document.querySelector('.join'),
    inputAvatar: document.querySelector('.messaging-form .avatar'),
    welcomeMessage: document.querySelector('h1'),
    feed: document.querySelector('.feed'),
    feedback: document.querySelector('.feedback'),
    send: document.querySelector('.send'),
    messagingForm: document.querySelector('.messaging-form'),
    mainBody: document.querySelector('.main-body'),
    messages: document.querySelector('.message-feed'),
    top: document.querySelector('.top')
}

dom.send.setAttribute('disabled', 'disabled')


const user = {
    name: null,
    avatar: null
}

const getAvatar = () => {
    const size = Math.floor(Math.random() * 100) + 25

    return `url(https://www.placecage.com/${size}/${size})`
}

const autoscroll = () => {
    // New message elements
    const newMessage = dom.feed.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = dom.feed.offsetHeight

    // Height of messages container
    const containerHeight = dom.feed.scrollHeight

    // How far have I scrolled
    const scrollOffset = dom.feed.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        dom.feed.scrollTop = dom.feed.scrollHeight
    }

}

const theMessage = (name, you) => {

    if (you) {
        return `You have joined the conversation`
    } else {
        return `<span class="user-name">${name}</span> has joined the conversation`
    }
}

const theAvatar = (avatar, you) => {

    if (you) {
        return ''
    } else {
        return `<span class="avatar" style="background: ${avatar}; background-size: contain;"></span>`
    }
}

const addWelcomeMessage = (payload, you) => {
    const welcomeMessage = document.createElement('div')

    const youMessage = `You have joined the conversation`
    const youAvatar = ''

    welcomeMessage.classList = 'welcome-message'
    welcomeMessage.innerHTML = you === true ? `
    <p>
        <hr />
        <div class="welcome-message-text">
            ${youAvatar}
            ${youMessage}
        </div>
    </p>
        ` : `
    <p>
        <hr />
        <div class="welcome-message-text">
            ${payload.avatar}
            ${payload.message}
        </div>
    </p>
    `

    dom.feed.appendChild(welcomeMessage)

    autoscroll()
}

const enterChannel = async () => {
    const avatar = getAvatar()
    const name = dom.nameInput.value

    await dom.joinButton.remove()
    await dom.welcomeMessage.remove()
    
    dom.send.style.display = 'inline'
    dom.send.removeAttribute('disabled')
    

    dom.nameInput.value = ''
    dom.nameInput.placeholder = 'Type a message...'
    dom.nameInput.focus()


    dom.inputAvatar.innerText = ''
    dom.inputAvatar.style.backgroundImage = avatar
    dom.inputAvatar.style.backgroundSize = 'contain'

    user.name = name
    user.avatar = avatar

    addWelcomeMessage({ avatar }, true)

    socket.emit('user connection', {
        name,
        avatar
    })
}

const addZero = (date) => {
    if (date < 10) {
        date = `0${date}`
    }
    return date
}

const addEntry = ({ user, message }, you) => {
    const entry = document.createElement('div');
    const date = new Date();

    entry.classList = `message-entry${you ? ' message-entry-own' : ' message-entry-other'}`
    entry.innerHTML = `
    <li>
        <div class="avatar-container">
            <span class="avatar" style="background: ${user.avatar}; background-size: contain;"></span>
        </div>
        <div class="message-body">
            <span class="user-name">${you ? 'You' : user.name}</span>
            <time>@ ${addZero(date.getHours())}:${addZero(date.getMinutes())}</time>
            <p>${message}</p>
        </div>
    </li>
    `

    dom.feed.appendChild(entry)

    autoscroll()

}

socket.on('user connection', (payload) => addWelcomeMessage(payload, false))

socket.on('user typing', ({ user, typers }) => {
    dom.feedback.innerHTML = typers > 1 ? 
        `Several people are typing...` : 
        `<i>${user}</i> is typing...`
})

socket.on('user stopped typing', (typers) => {
    if (!typers) {
        dom.feedback.innerHTML = ''
    }
})

socket.on('send message', payload => {
    addEntry(payload)


    if (!payload.typers) {
        dom.feedback.innerHTML = ''
    }

    
})

dom.joinButton.addEventListener('click', (e) => {
    e.preventDefault()

    if (!dom.nameInput.value) {
        return dom.nameInput.parentElement.classList.add('error')
    } else {
        dom.nameInput.parentElement.classList.remove('error')
        enterChannel()
    }

    dom.nameInput.addEventListener('keyup', (e) => {
        socket.emit('user typing')

        if (e.target.value === '') {
            socket.emit('user stopped typing')
        }
    })

})

dom.send.onclick = e => {
    e.preventDefault()

    if (!dom.nameInput.value) {
        return dom.nameInput.parentElement.classList.add('error')
    }
        dom.nameInput.parentElement.classList.remove('error')
        const data = dom.nameInput
        const message = data.value


    socket.emit('send message', {
        message,
        user
    })

    addEntry({ user, message }, true)

    data.value = ''
    data.focus()
}

