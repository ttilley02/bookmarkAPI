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
      it(`responds with 401 Unauthorized for GET /api/bookmarks`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for POST /api/bookmarks`, () => {
        return supertest(app)
          .post('/api/bookmarks')
          .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for GET /api/bookmarks/:id`, () => {
        const secondBookmark = store.bookmarksStore[1]
        return supertest(app)
          .get(`/api/bookmarks/${secondBookmark.id}`)
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for DELETE /api/bookmarks/:id`, () => {
        const aBookmark = store.bookmarksStore[1]
        return supertest(app)
          .delete(`/api/bookmarks/${aBookmark.id}`)
          .expect(401, { error: 'Unauthorized request' })
      })
    })       
  describe('GET /api/bookmarks TEST', () =>{
      context(`Given no bookmarks`, () => {
          console.log(process.env.API_TOKEN)
          it(`responds with 200 and an empty list`, () => {
              return supertest(app)
              .get('/api/bookmarks')
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

          it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
                  return supertest(app)
                  .get('/api/bookmarks')
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(200, testbookmarks);
          });
      });
  });
      
      describe('GET /api/bookmarks by ids', () =>{
          context(`Given no bookmarks`, () => {
                   it(`responds with 404`, () => {
                     const bookmarkId = 123456
                     return supertest(app)
                       .get(`/api/bookmarks/${bookmarkId}`)
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

      it('GET /api/bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
              const bookmarkId = 2;
              const expectedbookmark = testbookmarks[bookmarkId - 1];
              return supertest(app)
              .get(`/api/bookmarks/${bookmarkId}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(200, expectedbookmark);
              });
      });
  });
    context(`Given an XSS attack bookmark`, () => {
      const maliciousbookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'www.badhackattempt.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 1,
      };

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousbookmark ])
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousbookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
            expect(res.body.url).to.eql('www.badhackattempt.com')
          });
      });
    });
      describe(`POST /api/bookmarks`, () => {
      it(`creates an bookmark, responding with 201 and the new bookmark`, function() {
          this.retries(3);
          const newbookmark = {
              title: 'Test new bookmark',
              url: 'www.duckduckgo.com',
              description: 'best search engine',
              rating: 5
          };
           return supertest(app)
             .post('/api/bookmarks')
             .send(newbookmark)
             .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
             .expect(201)
              .expect(res => {
                expect(res.body.title).to.eql(newbookmark.title);
                expect(res.body.url).to.eql(newbookmark.url);
                expect(res.body.description).to.eql(newbookmark.description);
                expect(res.body.rating).to.eql(newbookmark.rating);
                expect(res.body).to.have.property('id');
                expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
             })
             .then(postRes =>
              supertest(app)
                  .get(`/api/bookmarks/${postRes.body.id}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(postRes.body)
              );
         });
       });
      const requiredFields = ['title', 'url', 'rating']
       
          requiredFields.forEach(field => {
            const newbookmark = {
              title: 'Test new bookmark',
              url: 'www.duckduckgo.com',
              rating: 5

            }
       
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
              delete newbookmark[field]
       
              return supertest(app)
                .post('/api/bookmarks')
                .send(newbookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                  error: { message: `Missing '${field}' in request body` }
                });
            });
          });
      describe(`DELETE /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
                  it(`responds with 404`, () => {
                    const bookmarkId = 123456
                    return supertest(app)
                      .delete(`/api/bookmarks/${bookmarkId}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(404, { error: { message: `bookmark doesn't exist` } })
                  })
                })
            context('Given there are bookmarks in the database', () => {
              const testbookmarks = makebookmarksArray()
        
              beforeEach('insert bookmarks', () => {
                return db
                  .into('bookmarks')
                  .insert(testbookmarks)
              })
        
              it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedbookmarks = testbookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                  .delete(`/api/bookmarks/${idToRemove}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/bookmarks`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedbookmarks)
                  )
              })
            })
        })
      describe(`PATCH /api/bookmarks/:id`, ()=>{
        context(`Given no bookmarks`, ()=>{
          it(`responds with a 404`, ()=>{ 
            const bookmarkId = 123456
            return supertest(app)
              .patch(`/api/bookmarks/${bookmarkId}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(404, { error: {message: `bookmark doesn't exist`}})
          })
  
        })
        context('Given there are bookmarks in the database', () => {
                const testbookmarks = makebookmarksArray()
          
                beforeEach('insert bookmarks', () => {
                  return db
                    .into('bookmarks')
                    .insert(testbookmarks)
                })
          
                it('responds with 204 and updates the bookmark', () => {
                  const idToUpdate = 2
                  const updatebookmark = {
                    title: 'updated bookmark title',
                    url: 'www.old.reddit.com',
                    description: 'updated bookmark description',
                    rating: 5,
                  }
                  const expectedbookmark = {
                        ...testbookmarks[idToUpdate - 1],
                        ...updatebookmark
                      }
                  return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send(updatebookmark)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                    supertest(app)
                      .get(`/api/bookmarks/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedbookmark)
                  )
                })
                it(`responds with 400 when no required fields supplied`, () => {
                      const idToUpdate = 2
                      return supertest(app)
                        .patch(`/api/bookmarks/${idToUpdate}`)
                        .send({ irrelevantField: 'foo' })
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(400, {
                          error: {
                            message: `Request body must contain either 'title', 'description', 'url', or 'content'`
                      }
                    })
                })
              it(`responds with 204 when updating only a subset of fields`, () => {
                      const idToUpdate = 2
                      const updatebookmark = {
                        title: 'updated bookmark title',
                      }
                      const expectedbookmark = {
                        ...testbookmarks[idToUpdate - 1],
                        ...updatebookmark
                      }
                
                      return supertest(app)
                        .patch(`/api/bookmarks/${idToUpdate}`)
                        .send({
                          ...updatebookmark,
                          fieldToIgnore: 'should not be in GET response'
                        })
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(204)
                        .then(res =>
                          supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedbookmark)
                        )
                    })
                  })
              })
    
  });