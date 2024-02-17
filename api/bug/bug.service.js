import fs from 'fs'

import { loggerService } from '../../services/logger.service.js'
export const bugService = {
    query,
    save,
    getById,
    remove
}

var bugs = _readJsonFile('./data/bug.json')
const PAGE_SIZE = 4

async function query(filterBy = {}) {
    try {

        let bugsToReturn = [...bugs]
        
        if (filterBy.title) {
            const regExp = new RegExp(filterBy.title, 'i')
            bugsToReturn = bugsToReturn.filter(bug => regExp.test(bug.title))
        }

        if (filterBy.severity) {
            bugsToReturn = bugsToReturn.filter(bug => bug.severity >= +filterBy.severity)
        }

        if (filterBy.pageIdx !== undefined) {
            const startIdx = filterBy.pageIdx * PAGE_SIZE
            bugsToReturn = bugsToReturn.slice(startIdx, startIdx + PAGE_SIZE)
        }

        if (filterBy.lables && filterBy.lables.length > 0) {
            bugsToReturn = bugsToReturn.filter(bug => {
                return filterBy.lables.some(label => bug.lables.includes(label))
            })

        }

        if (filterBy.sortBy) {
            bugsToReturn.sort((a, b) => {
                if (filterBy.sortBy === 'title') {
                    return a.title.localeCompare(b.title)
                } else if (filterBy.sortBy === 'severity') {
                    return (a.severity - b.severity)
                } else if (filterBy.sortBy === 'createdAt') {
                    if (a[filterBy.sortBy] < b[filterBy.sortBy]) return -1 * filterBy.sortDir;
                    if (a[filterBy.sortBy] > b[filterBy.sortBy]) return 1 * filterBy.sortDir;
                    return 0;
                }
            })

        }

        if (filterBy.userId){            
            bugsToReturn = bugsToReturn.filter(bug => bug.creator._id === filterBy.userId)                    
        }
        
        return bugsToReturn
    } catch (err) {
        loggerService.error(`Had problems getting bugs...`)
        throw err
    }
}

async function getById(bugId, loggedinUser) {
    try {
        const bug = bugs.find(bug => bug._id === bugId)          
        if (!loggedinUser?.isAdmin && bug.creator._id !== loggedinUser?._id) throw `Not your bug`
        return bug
    } catch (err) {
        loggerService.error(`Had problems getting bug ${bugId}...`)
        throw err
    }
}

async function remove(bugId,loggedinUser) {


    try {
        const idx = bugs.findIndex(bug => bug._id === bugId)
        const bug = bugs[idx]
        if (!loggedinUser?.isAdmin && bug.creator._id !== loggedinUser?._id) throw `Not your bug`
        bugs.splice(idx, 1)
        _saveBugsToFile('./data/bug.json')
    } catch (err) {
        loggerService.error(`Had problems removing bug ${bugId}...`)
        throw err
    }

    return `Bug ${bugId} removed`
}

async function save(bugToSave, loggedinUser) {
    try {
        if (bugToSave._id) {
            const idx = bugs.findIndex(bug => bug._id === bugToSave._id)
            if (idx === -1) throw `Couldn't find bug with _id ${bugToSave._id}`

            const bug = bugs[idx]
            if (!loggedinUser?.isAdmin && bug.creator._id !== loggedinUser?._id) throw `Not your bug`

            bugs.splice(idx, 1, { ...bug, ...bugToSave })
            bugToSave = { ...bug, ...bugToSave }
        } else {
            bugToSave._id = _makeId()
            bugToSave.creator = { _id: loggedinUser._id, fullname: loggedinUser.fullname }
            bugToSave.createdAt = Date.now()
            bugs.push(bugToSave)
        }
        _saveBugsToFile('./data/bug.json')
    } catch (err) {
        loggerService.error(`Had problems saving bug ${bugToSave._id}...`)
        throw err
    }
    
     return bugToSave
    
}

function _makeId(length = 6) {
    var txt = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return txt
}
function _readJsonFile(path) {
    const str = fs.readFileSync(path, 'utf8')
    const json = JSON.parse(str)
    return json
}

function _saveBugsToFile(path) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(bugs, null, 2)
        fs.writeFile(path, data, (err) => {
            if (err) return reject(err)
            resolve()
        })
    })
}