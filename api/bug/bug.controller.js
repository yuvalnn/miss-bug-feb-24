// Bug CRUDL API
import { bugService } from './bug.service.js'
import PDFDocument from 'pdfkit'


const MAX_BUG_VISITED = 3

export async function getPDF(req, res) {
    //  const { title, severity, description } = req.body
    const filterBy = {
        title: req.body.title || '',
        severity: +req.body.severity || 0
    }
    console.log(filterBy)
    try {
        const doc = new PDFDocument()
        doc.fontSize(16).text('Bug List', 50, 50)
        let bugs = await bugService.query(filterBy)
        bugs.forEach((bug, index) => {
            doc.text(`Bug ${index + 1}: ${bug.title}`)
            doc.text(`Severity: ${bug.severity}`)
            doc.text(`Description: ${bug.description}`)
        });
        doc.pipe(res)
        doc.end()
    } catch (err) {
        console.error('Error generating PDF:', err)
        res.status(500).send('Internal Server Error')
    }
}

// List
export async function getBugs(req, res) {    
    const filterBy = {
        title: req.query.title || '',
        severity: +req.query.severity || 0,
        pageIdx: req.query.pageIdx || undefined,
        sortBy: req.query.sortBy || '',
        sortDir: req.query.sortDir || 1,
        lables: req.body.lables || undefined,
        userId: req.query.userId || undefined
    }

    try {
        const bugs = await bugService.query(filterBy)
        res.send(bugs)
    } catch (err) {
        res.status(400).send(`Couldn't get bugs...`)
    }
}
//  Save

export async function addBug(req, res) {
    const { title, severity, description, createdAt, lables } = req.body
    // Better use createBug()
    const bugToSave = { title, severity: +severity, description, createdAt, lables }

    try {
        const savedBug = await bugService.save(bugToSave, req.loggedinUser)
        res.send(savedBug)
    } catch (err) {
        console.log(err)
        res.status(400).send(`Couldn't save bug...`)
    }
}
export async function updateBug(req, res) {
    const { _id, title, severity, description, lables } = req.body
    const bugToSave = { _id, title, severity: +severity, description, lables }
    try {
        console.log(req.loggedinUser)
        console.log(bugToSave)
        const savedBug = await bugService.save(bugToSave, req.loggedinUser)
        res.send(savedBug)
    } catch (err) {
        res.status(400).send(`Couldn't save bug ${err}`)
    }
}

// Get 
export async function getBug(req, res) {
    var { bugId } = req.params
    let visitedBugs = [];

    try {
        const visitedBugsCookie = req.cookies.visitedBugs;
        if (visitedBugsCookie) {
            visitedBugs = JSON.parse(visitedBugsCookie);
        }

        if (visitedBugs.length >= MAX_BUG_VISITED) return res.status(401).send('Wait for a bit')



        // Add the bug to the visitedBugs array
        if (!visitedBugs.includes(bugId)) {
            visitedBugs.push(bugId);
        }
        console.log("User visited at the following bugs:", visitedBugs)
        const bug = await bugService.getById(bugId, req.loggedinUser)
        res.cookie('visitedBugs', JSON.stringify(visitedBugs), { maxAge: 7 * 1000 });
        res.send(bug)

    } catch (error) {
        res.status(400).send(`Couldn't get bug`)
    }

}

// Delete
export async function removeBug(req, res) {
    var { bugId } = req.params

    try {
        await bugService.remove(bugId, req.loggedinUser)
        res.send(`Bug ${bugId} removed`)
    } catch (err) {
        res.status(400).send(`Couldn't remove bug...`)
    }
}