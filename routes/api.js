'use strict';

const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  // id by mongoose
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: () => new Date() },
  reported: { type: Boolean, default: false }
})
const threadSchema = new mongoose.Schema({
  // id by mongoose
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: () => new Date() },
  bumped_on: { type: Date, default: () => new Date() },
  reported: { type: Boolean, default: false },
  replies: [replySchema]
})
const boardSchema = new mongoose.Schema({
  // id by mongoose
  name: { type: String, required: true },
  posts: [threadSchema]
})

const Reply = mongoose.model('Reply', replySchema)
const Thread = mongoose.model('Thread', threadSchema)
const Board = mongoose.model('Board', boardSchema)



module.exports = function (app) {
  // * BOARD
  app.route('/api/threads/:board')
    .get((req, res) => {
      const boardName = req.params.board
      console.log("Get board "+req.params.board)
      Board.findOne({ name: boardName }, 'posts', (err, board) => {
        if (err) return console.log("Error: Get Board")
        if (!board) return res.send([])
        let arr = board.posts
        arr.sort((a, b) => {
          // Sort by newest
          return ( b.created_on - a.created_on)
        })

        let b = arr.slice(0,10).map((e)=>{
          return {
            "_id": e._id,
            "text": e.text,
            "created_on": e.created_on,
            "bumped_on": e.bumped_on,
            "replies": e.replies,
            "reply_count": e.replies.length
          }
        })
        res.send(b)
      })


    })
    .post((req, res) => {
      const boardName = req.params.board
      console.log("Post board:"+ boardName+ " "+req.body.text)
      Board.findOneAndUpdate(
        { name: boardName },
        { $set: { name: boardName } },
        { upsert: true , new: true},
        // ^ find or create Board
        (err, board) => {
          if (err) return res.send(err)
          board.posts.push(new Thread({
            text: req.body.text,
            delete_password: req.body.delete_password,
            replies: []
          }))
          board.save()
          res.redirect('/b/'+req.params.board+'/')
        }
      )
    })

    .put((req, res) => {
      console.log("Put board (report)")
      const idReport = req.body.report_id
      const boardName = req.params.board
      Board.findOneAndUpdate(
        {
          "name": boardName,
          "posts._id": idReport
        },
        {"$set":{
          "posts.$.reported": true
        }},{new : true},
        (err,done)=>{
          if(err) return console.log(err)
          res.send("Reported")
        }
      )
    })
    .delete((req, res) => {
      console.log("Del board")
      console.log(req.body)
      // board, thread_id, delete_password
      const boardName = req.params.board
      const threadId = req.body.thread_id
      const pw = req.body.delete_password

      Board.findOneAndUpdate(
        {
          "name": boardName,
        },
        {
          "$pull": {
            "posts":{
              "_id": threadId,
              "delete_password": pw
            }
          }
        },
        { new : true},
        (err,done)=>{
          if(err) return console.log(err)
          res.send("Success")
        }

      )
    })


    // * REPLIES
  app.route('/api/replies/:board')
    .get((req, res) => {
      console.log(req.body)
    })
    .post((req, res) => {
      console.log(req.body)
      // board, thread_id, text, delete_password

    })
    .put((req, res) => {
      console.log(req.body)
      // board, thread_id, reply_id
    })
    .delete((req, res) => {
      console.log(req.body)
      // board, thread_id, reply_id, delete_password
    })

};
