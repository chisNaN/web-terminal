var sql = require('sqlite3');
var chatPath = './local/chat.db';

var isOpen = false;
var dbError = null;
var db = new sql.Database(chatPath, function(err) {
  isOpen = !err;
  dbError = err;
  if (err) { return; }

  createTables();
});

module.exports = {
  hello: hello,
  load: load,
  publish: publish,
  purge: purge,
};

function hello() {
  // Workaround to remain backwards-compatible
  this.send(null, {
    type: 'show',
    from: 'computer',
    to: 'chat',
  });

  // Ensure db is open without error
  if (!isOpen && !dbError) { return setImmediate(hello.bind(this)); }
  this.send(dbError, {
    type: 'db',
    from: 'computer',
    to: 'chat',
    error: dbError && dbError.toString(),
  });
}

function load(msg, cb) {
  var self = this;
  var opts = {};
  msg = msg || {};
  opts.$time = msg.timestamp || new Date().toISOString();
  opts.$rowid = msg.lastid || Infinity;
  opts.$limit = msg.limit || 50;
  db.all(
    [
      'SELECT *, rowid',
      'FROM chats',
      'WHERE datetime(time) <= datetime($time) AND rowid < $rowid',
      'ORDER BY datetime(time) DESC, rowid ASC',
      'LIMIT $limit',
    ].join(' '),
    opts,
    function(err, rows) {
      if (err) { return self.send(err); }

      cb(rows.map(function(row) {
        row.time += 'Z'; // append the timezone
        return row;
      }));
    }
  );
}

function publish(msg, cb) {
  var self = this;
  var data = { $message: msg.message, $originator: msg.originator };

  db.run(
    [
      'INSERT INTO chats(message, originator)',
      'VALUES($message, $originator)',
    ].join(' '),
    data,
    function(err) {
      if (err) { return self.send(err); }

      var id = this.lastID;
      db.get('SELECT *, rowid FROM chats WHERE rowid = ?', id, function(err, row) {
        if (err) { return self.send(err); }

        cb(id);

        row.time += 'Z'; // append the timezone
        self.send(null, {
          type: 'publish',
          from: 'computer',
          to: 'chat',
          message: row,
        });
      });
    }
  );
}

function purge(msg, cb) {
  dropTables();
  createTables();

  this.send(null, {
    type: 'purge',
    from: 'computer',
    to: 'chat',
  });
  cb();
}

function dropTables() {
  db.exec('DROP INDEX datedChats');
  db.exec('DROP TABLE chats');
}

function createTables() {
  db.exec('CREATE TABLE IF NOT EXISTS chats (message NOT NULL, originator NOT NULL, time DEFAULT CURRENT_TIMESTAMP)');
  db.exec('CREATE INDEX IF NOT EXISTS datedChats ON chats (time)');
}
