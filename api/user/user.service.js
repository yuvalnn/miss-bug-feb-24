import fs from 'fs'
import { utilService } from '../../services/util.service.js'
import { loggerService } from '../../services/logger.service.js'


var users = utilService.readJsonFile('data/user.json')

export const userService = {
    query,
    getById,
    remove,
    save,
    getByUsername
    
}


async function query() {
    try {
        return users 
    } catch(err) {
        loggerService.error(`Had problems getting users...`)
        throw err
    }
}

async function getByUsername(username) {
    const user = users.find(user => user.username === username)
    return user
}

async function getById(userId) {
    console.log(userId)
    try {
        const user = users.find(user => user._id === userId)
        if (!user) throw `User not found by userId : ${userId}`
        return user
    } catch (err) {
        loggerService.error(`Had problems getting user ${userId}...`)
        throw err
    }
}
async function remove(userId) {
    const idx = users.findIndex(user => user._id === userId)
    users.splice(idx, 1)

    try {
        _saveUsersToFile('./data/user.json')
    } catch (err) {
        loggerService.error(`Had problems removing user ${userId}...`)
        throw err
    }

    return `user ${userId} removed`
}


async function save(userToSave) {
    try {
        if(userToSave._id){
            const idx = users.findIndex(user => user._id === userToSave._id)
            if(idx === -1) throw 'Bad Id'
            users.splice(idx, 1, userToSave)
        } else {
            userToSave._id = _makeId()   
            userToSave.score = 10000               
            userToSave.createdAt = Date.now()  
            if (!userToSave.imgUrl) userToSave.imgUrl = 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'               
            users.push(userToSave)
        }
        _saveUsersToFile('./data/user.json')        
    } catch (err) {
         loggerService.error(`Had problems saving user ${userToSave._id}...`)
        throw err
    }
    return userToSave
}
function _makeId(length = 6) {
    var txt = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return txt
}



function _saveUsersToFile(path) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(users, null, 2)
        fs.writeFile(path, data, (err) => {
            if (err) return reject(err)
            resolve()
        })
    })
}