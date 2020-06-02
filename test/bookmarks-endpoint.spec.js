const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makebookmarksArray } = require('./bookmarks.fixtures');
const store = require('../src/store');

describe.only('bookmarks Endpoints', function() {
    let db;
  
    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      });
      app.set('db', db);
    });
  
    after('disconnect from db', () => db.destroy());
  
    before('clean the table', () => db('bookmarks').truncate());

    afterEach('cleanup', () => db('bookmarks').truncate());

   

    describe(`Unauthorized requests`, () => {
        it(`responds with 401 Unauthorized for GET /bookmarks`, () => {
          return supertest(app)
            .get('/bookmarks')
            .expect(401, { error: 'Unauthorized request' })
        })
    
        it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
          return supertest(app)
            .post('/bookmarks')
            .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
            .expect(401, { error: 'Unauthorized request' })
        })
    
        it(`responds with 401 Unauthorized for GET /bookmarks/:id`, () => {
          const secondBookmark = store.bookmarksStore[1]
          return supertest(app)
            .get(`/bookmarks/${secondBookmark.id}`)
            .expect(401, { error: 'Unauthorized request' })
        })
    
        it(`responds with 401 Unauthorized for DELETE /bookmarks/:id`, () => {
          const aBookmark = store.bookmarksStore[1]
          return supertest(app)
            .delete(`/bookmarks/${aBookmark.id}`)
            .expect(401, { error: 'Unauthorized request' })
        })
      })       
    describe('GET / bookmarks TEST', () =>{
        context(`Given no bookmarks`, () => {
            console.log(process.env.API_TOKEN)
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, []);
            });
            });
        context('Given there are bookmarks in the database', () => {
            const testbookmarks =  makebookmarksArray();
                
            beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testbookmarks);
            });

            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                    return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testbookmarks);
            });
        });
    });
        
        describe('GET / bookmark by ids', () =>{
            context(`Given no bookmarks`, () => {
                     it(`responds with 404`, () => {
                       const bookmarkId = 123456
                       return supertest(app)
                         .get(`/bookmarks/${bookmarkId}`)
                         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                         .expect(404, { error: { message: `bookmark doesn't exist` } });
                     });
                   });
        context('Given there are bookmarks in the database', () => {
            const testbookmarks =  makebookmarksArray();
                
        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testbookmarks);
            });

        it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2;
                const expectedbookmark = testbookmarks[bookmarkId - 1];
                return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedbookmark);
                });
        });
    });
    
  });