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
      console.log("Get board")
      Board.findOne({name: boardName},(err,board)=>{
        if (err) return console.log("Error: Get Board")
        res.send(board.posts)
      })
      

    })
    .post((req, res) => {
      const boardName = req.params.board
      
      const newBoard = new Board({name: boardName, posts: []})
      console.log("Create Board: " + newBoard.name)

      // * find or create Board
      Board.findOneAndUpdate(
        { name: boardName },
        newBoard,
        { upsert: true, new: true},
        (err,board)=>{
          if(err) return console.log("Error: Post Board")
          
        }
      )
    })

    .put((req, res) => {
      console.log("Put board")
      console.log(req.body)
      // board, thread_id
    })
    .delete((req, res) => {
      console.log("Del board")
      console.log(req.body)
      // board, thread_id, delete_password
    })

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
