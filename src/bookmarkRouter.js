const express = require('express');
const winston = require('winston');
const xss = require('xss');
const bookmarkRouter = express.Router();
const bodyParser = express.json();
const store = require('./store');
const BookarksService = require('./bookmarks-service');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})


bookmarkRouter
  .route('/api/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
   BookarksService.getAllbookmarks(knexInstance)
        .then(bookmark => {
           res.json(bookmark);
         })
        .catch(next);
    })
  .post(bodyParser, (req, res, next) => {
        const {title,url,description,rating} = req.body;
        
        if (!title) {
          logger.error(`Title is required`);
          return res
            .status(400).json({
              error: { message: `Missing 'title' in request body` }
           });
          }
        
        if (!url) {
          logger.error(`Url is required`);
          return res
            .status(400).json({
              error: { message: `Missing 'url' in request body` }
            });
          }        
        if (!rating) {
          logger.error(`Rating is required`);
          return res
            .status(400).json({
              error: { message: `Missing 'rating' in request body` }
            });
          }
        
        const id = Math.floor((Math.random() * 999999) + 1)
        console.log(id);
        
        const bookmark = {
          id,
          title,
          url,
          description,
          rating
        };
        

        BookarksService.insertbookmarks(
          req.app.get('db'),
          bookmark
        )
        
        .then(bookmark => {
          res
          .status(201)
          .location(`/api/bookmarks/${id}`)
          .json(bookmark)
          logger.info(`Bookmark with id ${id} created`);
        })
        .catch(next);

        
  });

bookmarkRouter
  .route('/api/bookmarks/:id')
  .all((req, res, next) => {
    BookarksService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark // save the bookmark for the next middleware
        next() // don't forget to call next so the next middleware happens!
      })
      .catch(next)
  })
.get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookarksService.getById(knexInstance, req.params.id)
      .then(bookmark => {
       if (!bookmark) {
                  return res.status(404).json({
                    error: { message: `bookmark doesn't exist` }
                  });
                }
        res.json ({
          id:Number(xss(bookmark.id)),
          url:xss(bookmark.url),
          title:xss(bookmark.title),
          description:xss(bookmark.description),
          rating:Number(xss(bookmark.rating))

        })
      })
    .catch(next)
})

.delete((req, res, next) => {
  BookarksService.deletebookmarks(
         req.app.get('db'),
         req.params.id
       )
         .then(() => {
           res.status(204).end()
         })
         .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
        return res.status(400).json({
          error: {
            message: "Request body must contain either 'title', 'description', 'url', or 'content'"
          }
        })
        
      }
      
      
    BookarksService.updatebookmarks(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
})

  

module.exports = bookmarkRouter;