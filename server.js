const zmq = require('zeromq');
const sqlite = require('sqlite3');
const pub = zmq.socket('pub');
const sub = zmq.socket('sub');

const err = (msgId, errMessage) => {
  return JSON.stringify({ msg_id: msgId, status: 'error', error: errMessage });
};
const success = (msgId, userId) => {
  return JSON.stringify({ msg_id: msgId, user_id: userId, status: 'ok' });
};

pub.bindSync(`tcp://127.0.0.1:${process.argv[2]}`);
sub.bindSync(`tcp://127.0.0.1:${process.argv[3]}`);

const db = new sqlite.Database('./SQLite.db', err => {
  if (err) console.error(err.message);
  console.log('Connected to the SQLite database.');
});

sub.subscribe('api_in');
sub.on('message', (topic, message) => {
  const msg = JSON.parse(message.toString());

  if (msg.type == 'login') {
    const { email, msg_id, pwd } = msg;
    if (!email || !pwd) {
      return pub.send(['api_out', err(msg_id, 'WRONG_FORMAT')]);
    }
    db.get(`SELECT * FROM users WHERE EXISTS(SELECT * FROM users WHERE email == '${email}')`, (error, row) => {
      if (error) console.log(error);
      if (row && row.passw == pwd) {
        return pub.send(['api_out', success(msg_id, row.user_id)]);
      } else {
        return pub.send(['api_out', err(msg_id, 'WRONG_PWD')]);
      }
    });
  }
});
