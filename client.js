const zmq = require('zeromq');
const inquirer = require('inquirer');
const randomString = require('randomstring');
const pub = zmq.socket('pub');
const sub = zmq.socket('sub');

pub.connect(`tcp://127.0.0.1:${process.argv[2]}`);
sub.connect(`tcp://127.0.0.1:${process.argv[3]}`);

sub.subscribe('api_out');

sub.on('message', (topic, message) => {
  const msg = JSON.parse(message.toString());
  if (msg.status === 'ok') {
    console.log('Ok');
  } else if (msg.status === 'error') {
    console.log(msg.error);
  }
});

inquirer
  .prompt([
    { type: 'input', message: 'Input email', name: 'email' },
    { type: 'input', message: 'Input password', name: 'password' }
  ])
  .then(answers => {
    pub.send(['api_in', JSON.stringify({ type: 'login', email: answers.email, pwd: answers.password, msg_id: randomString.generate() })]);
  });
