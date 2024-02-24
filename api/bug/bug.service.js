import fs from 'fs'
import { dbService } from '../../services/db.service.js';
import { ObjectId } from 'mongodb'


import { loggerService } from '../../services/logger.service.js'
export const bugService = {
    query,
    add,
    update,
    getById,
    remove
}

var bugs = _readJsonFile('./data/bug.json')
const collectionName = 'bug'
const PAGE_SIZE = 4

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sortBy = _buildSortBy(filterBy)
        // let bugsToReturn = [...bugs]
        const collection = await dbService.getCollection(collectionName)
        // const bugCursor = await collection.find(criteria, sortBy)
        

        const bugCursor = await collection.find(criteria).sort(sortBy);
        if (filterBy.pageIdx !== undefined) {            
            const startIdx = filterBy.pageIdx * PAGE_SIZE
            bugCursor.skip(startIdx).limit(PAGE_SIZE)
        }
    
        const bugs = await bugCursor.toArray()

        // if (filterBy.title) {

        //     const regExp = new RegExp(filterBy.title, 'i')
        //     bugsToReturn = bugsToReturn.filter(bug => regExp.test(bug.title))
        // }

        // if (filterBy.severity) {

        //     bugsToReturn = bugsToReturn.filter(bug => bug.severity >= +filterBy.severity)

        // }

        // if (filterBy.pageIdx !== undefined) {

        //     const startIdx = filterBy.pageIdx * PAGE_SIZE
        //     bugsToReturn = bugsToReturn.slice(startIdx, startIdx + PAGE_SIZE)
        // }

        // if (filterBy.lables && filterBy.lables.length > 0) {
        //     console.log(bugsToReturn)
        //     bugsToReturn = bugsToReturn.filter(bug => {
        //         return filterBy.lables.some(label => bug.lables.includes(label))
        //     })

        // }

        // if (filterBy.sortBy) {

        //     bugsToReturn.sort((a, b) => {
        //         if (filterBy.sortBy === 'title') {
        //             return a.title.localeCompare(b.title)
        //         } else if (filterBy.sortBy === 'severity') {
        //             return (a.severity - b.severity)
        //         } else if (filterBy.sortBy === 'createdAt') {
        //             if (a[filterBy.sortBy] < b[filterBy.sortBy]) return -1 * filterBy.sortDir;
        //             if (a[filterBy.sortBy] > b[filterBy.sortBy]) return 1 * filterBy.sortDir;
        //             return 0;
        //         }
        //     })

        // }

        // if (filterBy.userId){            
        //     bugsToReturn = bugsToReturn.filter(bug => bug.creator._id === filterBy.userId)                    
        // }

        // return bugsToReturn
        return bugs
    } catch (err) {
        loggerService.error(`Had problems getting bugs...`)
        throw err
    }
}

async function getById(bugId, loggedinUser) {
    try {
        console.log(bugId)
        const collection = await dbService.getCollection(collectionName)
        // const bug = bugs.find(bug => bug._id === bugId) 
        const bug = await collection.findOne({ _id: new ObjectId(bugId) })
        if (!bug) throw `Couldn't find bug with _id ${bugId}`
        console.log(loggedinUser)
        if (!loggedinUser?.isAdmin && bug.creator._id !== loggedinUser?._id) throw `Not your bug`
        return bug
    } catch (err) {
        loggerService.error(`Had problems getting bug ${bugId}...`)
        throw err
    }
}

async function remove(bugId, loggedinUser) {
    try {
        // const idx = bugs.findIndex(bug => bug._id === bugId)
        // const bug = bugs[idx]
        // if (!loggedinUser?.isAdmin && bug.creator._id !== loggedinUser?._id) throw `Not your bug`
        // bugs.splice(idx, 1)
        // _saveBugsToFile('./data/bug.json')
        const collection = await dbService.getCollection(collectionName)
        const { deletedCount } = await collection.deleteOne({ _id: new ObjectId(bugId) })
        // return deletedCount
    } catch (err) {
        loggerService.error(`Had problems removing bug ${bugId}...`)
        throw err
    }

    return `Bug ${bugId} removed`
}
async function add(bugToSave, loggedinUser) {
    try {
        console.log(loggedinUser)
        bugToSave.creator ={_id: new ObjectId(loggedinUser._id), fullname: loggedinUser.fullname}
        bugToSave.createdAt = Date.now()        
        // bugToSave.creator = loggedinUser
        const collection = await dbService.getCollection(collectionName)
        await collection.insertOne(bugToSave)
        return bugToSave
    } catch (err) {
        loggerService.error('bugService, can not add bug : ' + err)
        throw err
    }
}

async function update(bug, loggedinUser) {
    try {
        // Peek only updateable fields
        const bugToSave = {
            title: bug.title,
            severity: bug.severity,
            description: bug.description
        }
        const collection = await dbService.getCollection(collectionName)        
        const originBug = await collection.findOne({ _id: new ObjectId(bug._id) })        
        if (!originBug) throw `Couldn't find bug with _id ${bug._id}`

        if (!loggedinUser?.isAdmin && new ObjectId(originBug.creator._id).toString() !== loggedinUser?._id) throw `Not your bug`
        const res = await collection.updateOne({ _id: new ObjectId(bug._id) }, { $set: bugToSave })
        console.log('res', res)
        if(res.modifiedCount < 1) throw 'Could not update bug'
        return bug
    } catch (err) {
        loggerService.error(`cannot update bug ${bug._id}`, err)
        throw err
    }
}
// async function save(bugToSave, loggedinUser) {
//     try {
//         if (bugToSave._id) {
//             const idx = bugs.findIndex(bug => bug._id === bugToSave._id)
//             if (idx === -1) throw `Couldn't find bug with _id ${bugToSave._id}`

//             const bug = bugs[idx]
//             if (!loggedinUser?.isAdmin && bug.creator._id !== loggedinUser?._id) throw `Not your bug`

//             bugs.splice(idx, 1, { ...bug, ...bugToSave })
//             bugToSave = { ...bug, ...bugToSave }
//         } else {
//             bugToSave._id = _makeId()
//             bugToSave.creator = { _id: loggedinUser._id, fullname: loggedinUser.fullname }
//             bugToSave.createdAt = Date.now()
//             bugs.push(bugToSave)
//         }
//         _saveBugsToFile('./data/bug.json')
//     } catch (err) {
//         loggerService.error(`Had problems saving bug ${bugToSave._id}...`)
//         throw err
//     }

//     return bugToSave

// }

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

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.title) {
        criteria.title = { $regex: filterBy.title, $options: 'i' }
    }
    if (filterBy.severity) {
        criteria.severity = { $gt: filterBy.severity }
        
    }   
    if (filterBy.userId){  
        criteria['creator._id'] = filterBy.userId;    
    }  
    return criteria
}


function _buildSortBy(filterBy) {
    let sortBy = {}
    let sortOrder = 1;
    if (filterBy.sortDir){
        sortOrder = filterBy.sortDir
    }
    if (filterBy.sortBy) {
        if (filterBy.sortBy === 'title') {
            sortBy = { 'title': sortOrder }
        }
        else if (filterBy.sortBy === 'severity') {
            sortBy = { 'severity': sortOrder }
        }
        else if (filterBy.sortBy === 'createdAt') {
            sortBy = { 'createdAt': sortOrder }
        }
    }
    return sortBy
}