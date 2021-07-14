const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { expect } = require('chai');
const ObjectId = require('mongodb').ObjectID;

/*
Write the following tests in tests/functional-tests.js:

Creating a new thread: POST request to /api/threads/{board}
Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
Reporting a thread: PUT request to /api/threads/{board}
Creating a new reply: POST request to /api/replies/{board}
Viewing a single thread with all replies: GET request to /api/replies/{board}
Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
Reporting a reply: PUT request to /api/replies/{board}
*/

/*
^ /api/threads/:board 
^ /api/replies/:board?thread_id=
*/

chai.use(chaiHttp);

const testBoard = {
    name: "test_board" 
}
const newThread = {
    text: "thread: " + Math.floor(Math.random() * (1000 - 1 + 1) + 1),
    delete_password: "thread_pw" + Math.floor(Math.random() * (1000 - 1 + 1) + 1)
}
const newThread2 = {
    _id: new ObjectId().toString(),
    text: "DELETE THIS PLEASE",
    delete_password: "correct_pw" + Math.floor(Math.random() * (1000 - 1 + 1) + 1),
    incorrect_delete_password: "incorrect_pw" + Math.floor(Math.random() * (1000 - 1 + 1) + 1)
}
const newReply = {
    text: "hey " + Math.floor(Math.random() * (1000 - 1 + 1) + 1),
    delete_password: "reply_pw" + Math.floor(Math.random() * (1000 - 1 + 1) + 1)
}

suite('Functional Tests', function() {
    test("Creating a new thread: POST request to /api/threads/{board}", (done)=>{
        chai.request(server)
            .post("/api/threads/"+testBoard.name)
            .send({
                text: newThread2.text,
                delete_password: newThread2.delete_password,
            })
            .redirects(0)
            .end((err,res)=>{
                assert.equal(res.status,302)
                done()
            })
    })

    test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}",(done)=>{
        chai.request(server)
            .get("/api/threads/"+testBoard.name)
            .end((err,res)=>{
                assert.isArray(res.body)
                assert.isAtMost(res.body.length,10)
                assert.equal(res.body[0].text,newThread2.text)
                done()
            })
    })

    test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password",(done)=>{
        chai.request(server)
            .post("/api/threads/"+testBoard.name)
            .send({
                text: newThread.text,
                delete_password: newThread.delete_password
            })
            .end((err,res)=>{
                chai.request(server)
                    .get("/api/threads/" +testBoard.name)
                    .end((err,res)=>{
                        let id = res.body[1]._id
                        chai.request(server)
                            .delete("/api/threads/"+testBoard.name)
                            .send({
                                thread_id: id,
                                delete_password: newThread2.incorrect_delete_password
                            })
                            .end((err,res)=>{
                                chai.assert(res.text,"incorrect password")
                                done()
                            })
                    })
            })
    })
});
