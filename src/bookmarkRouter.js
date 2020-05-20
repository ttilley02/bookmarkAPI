const express = require('express')
const winston = require('winston');
const { v4: uuid } = require('uuid')
const bookmarkRouter = express.Router()
const bodyParser = express.json()
const store = require('./store')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    // move implementation logic into here
         res
          .json(store.bookmarksStore);
   
        
  })
  .post(bodyParser, (req, res) => {
    // move implementation logic into here
        const {title,url,description,rating} = req.body;
        
        if (!title) {
          logger.error(`Title is required`);
          return res
            .status(400)
            .send('Invalid data');
        }
        
        if (!url) {
          logger.error(`Url is required`);
          return res
            .status(400)
            .send('Invalid data');
        }
        if (!description) {
          logger.error(`Decription is required`);
          return res
            .status(400)
            .send('Invalid data');
        }
        
        if (!rating) {
          logger.error(`Rating is required`);
          return res
            .status(400)
            .send('Invalid data');
        }
        
        const id = uuid();
        
        const bookmark = {
          id,
          title,
          url,
          description,
          rating
        };
        
        store.bookmarksStore.push(bookmark);
        
        logger.info(`Bookmark with id ${id} created`);
        
        res
          .status(201)
          .location(`http://localhost:8000/bookmarks/${id}`)
          .json(bookmark);
        
  })

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    // move implementation logic into here
   
        const { id } = req.params;
        const bookmark = store.bookmarksStore.find(bookmark => bookmark.id == id);
      
        // make sure we found a Bookmark
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .send('Bookmark Not Found');
        }
      
        res.json(bookmark);
    
          
  })
  .delete((req, res) => {
    // move implementation logic into here
        const { id } = req.params;
      
        const bookmarkIndex = store.bookmarksStore.findIndex(bookmark => bookmark.id == id);
      
        if (bookmarkIndex === -1) {
          logger.error(`bookmark with id ${id} not found.`);
          return res
            .status(404)
            .send('Not found');
        }
  
        store.bookmarksStore.splice(bookmarkIndex, 1);
      
        logger.info(`bookmark with id ${id} deleted.`);
      
        res
          .status(204)
          .end();
 

  })

module.exports = bookmarkRouter