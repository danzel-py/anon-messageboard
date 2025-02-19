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
      console.log("Get board " + req.params.board)
      Board.findOne({ name: boardName }, 'posts', (err, board) => {
        if (err) return console.log("Error: Get Board")
        if (!board) return res.send([])
        let arr = board.posts
        arr.sort((a, b) => {
          // Sort by newest
          return (b.bumped_on - a.bumped_on)
        })

        let b = arr.slice(0, 10).map((e) => {
          return {
            "_id": e._id,
            "text": e.text,
            "created_on": e.created_on,
            "bumped_on": e.bumped_on,
            "replies": e.replies.slice(e.replies.length-3),
            "reply_count": e.replies.length
          }
        })
        res.send(b)
      })


    })
    .post((req, res) => {
      const boardName = req.params.board
      console.log("Post board:" + boardName + " " + req.body.text)
      Board.findOneAndUpdate(
        { name: boardName },
        { $set: { name: boardName } },
        { upsert: true, new: true },
        // ^ find or create Board
        (err, board) => {
          if (err) return res.send(err)
          board.posts.push(new Thread({
            text: req.body.text,
            delete_password: req.body.delete_password,
            replies: []
          }))
          board.save()
          res.redirect('/b/' + req.params.board + '/')
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
        {
          "$set": {
            "posts.$.reported": true
          }
        }, { new: true },
        (err, done) => {
          if (err) return console.log(err)
          if (!done) return res.send("Not found")
          res.send("Reported")
        }
      )
    })
    .delete((req, res) => {
      console.log("Del board")
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
            "posts": {
              "_id": threadId,
              "delete_password": pw
            }
          }
        },
        { new: true },
        (err, board) => {
          if (err) return console.log(err)
          let ix = board.posts.findIndex(post=>post._id.toString() == threadId)
          if(ix != -1) return res.send("incorrect password")
          res.send("success")
        }
      )
    })


  // * REPLIES
  app.route('/api/replies/:board')
    .get((req, res) => {
      // params board
      // body none
      // query thread_id
      Board.findOne(
        {
          "name": req.params.board,
          "posts._id": req.query.thread_id
        },
        'posts',
        (err, board) => {
          if (err) return console.log(err)
          if (!board) return console.log("no board")
          let posts = board.posts
          let idx = posts.findIndex((elm)=>elm._id == req.query.thread_id)
          let e = board.posts[idx]

          let aaaa = {
            _id: e._id,
            text: e.text,
            created_on: e.created_on,
            bumped_on: e.bumped_on,
            replies: e.replies.map((el) => {
              return {
                _id: el._id,
                text: el.text,
                created_on: el.created_on
              }
            })
          }
          res.send(aaaa)
        }
      )

    })
    .post((req, res) => {
      console.log("post reply")
      // board, thread_id, text, delete_password
      const boardName = req.params.board
      const threadId = req.body.thread_id

      Board.findOneAndUpdate(
        {
          "name": boardName,
          "posts._id": threadId
        },
        {
          $push: {
            "posts.$.replies":
              new Reply({
                text: req.body.text,
                delete_password: req.body.delete_password
              })
          },
          $set:{
            "posts.$.bumped_on": new Date()
          }
        },
        {
          new: true
        },
        (err, done) => {
          if (err) return console.log(err)
          console.log(done)
          res.redirect('/b/' + boardName + '/' + threadId)
        }
      )
    })
    .put((req, res) => {
      console.log("put reply")
      // board, thread_id, reply_id
      let boardName = req.params.board
      let threadId = req.body.thread_id
      let replyId = req.body.reply_id

      Board.findOne(
        {
          "name": boardName,
        },
        (err,board)=>{
          if(err) return console.log(err)
          if(!board) return res.send("no board")
          let thread = board.posts.filter((post)=>{return post._id == threadId})[0]
          if(!thread) return res.send("no thread")
          let reply = thread.replies.filter((reply)=>{return reply._id == replyId})
          if(!reply) return res.send("no reply")
          reply.reported = true;
          board.save()
          console.log(reply)
          res.send("Reported")
        }
      )
    })
    .delete((req, res) => {
      console.log("delete reply")
      // board, thread_id, reply_id, delete_password
      let boardName = req.params.board
      let threadId = req.body.thread_id
      let replyId = req.body.reply_id
      let pw = req.body.delete_password

      Board.findOne(
        {
          "name": boardName
        },
        (err,board)=>{
          if(err) return console.log(err)
          if(!board) return console.log("no board")
          let post = board.posts.filter(post=>{return post._id == threadId})[0]
          if(!post) return console.log("no post")
          let fidx = post.replies.findIndex(reply=> reply._id == replyId && reply.delete_password == pw)
          if(fidx == -1) return res.send("no reply/ wrong pw")
          post.replies.splice(fidx,1)
          board.save()
          res.redirect('/b/' + boardName + '/' + threadId)
        }
      )

    })

};
