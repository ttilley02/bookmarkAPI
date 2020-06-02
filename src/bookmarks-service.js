const bookmarkssService = {
    getAllbookmarks(knex){
    return knex.select('*').from('bookmarks');
    },

    insertbookmarks(knex, newbookmarks) {
    return knex
           .insert(newbookmarks)
           .into('bookmarks')
           .returning('*')
           .then(rows => {
            return rows[0];
           });
    },

    getById(knex, id) {
          return knex.from('bookmarks').select('*').where('id', id).first();
        },

    deletebookmarks(knex, id) {
       return knex('bookmarks')
         .where({ id })
         .delete();
     },

    updatebookmarks(knex, id, newbookmarksFields) {
     return knex('bookmarks')
       .where({ id })
       .update(newbookmarksFields);
    },
};

module.exports = bookmarkssService;