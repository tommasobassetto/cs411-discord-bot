// Discord connection
const {Client, Intents, User, DMChannel} = require('discord.js');
const token = require('./auth-main.json');
const config = require('./package.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS,
                                      Intents.FLAGS.GUILD_MESSAGES,
                                      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                                      Intents.FLAGS.DIRECT_MESSAGES] });

// SQL server connection
var mysql = require('mysql2');

// Used for hashing passwords
var crypto = require('crypto');

var connection = mysql.createConnection({
    host: '34.135.132.110',
    user: 'root',
    password: 'test123',
    database: 'cs_411_test'
});

connection.connect;

var sql_response = undefined;

var unfilled_forms = {};
var open_sessions = {};

async function runQuerySafe (q) {
    return new Promise(resolve => {
        connection.query(q, function (error, result) {
            if (error) {
                //res.send('Database error occurred'); 
                sql_response = "ERR";
                console.log(error);
                resolve();
            }

            else { 
                sql_response = result;
                resolve();
            }
    });
    });
}

function convertSQLTable(table) {
    if (table.length === 0) return "<p>No data exists with these constraints</p>";

    col_names = Object.keys(table[0]);

    var table_head = ``;

    for (var i = 0; i < col_names.length; i++) {
        table_head += col_names[i] + " | ";
    }

    table_body = "\n";

    for (var row = 0; row < table.length; row++) {

        for (var i = 0; i < col_names.length; i++) {
            table_body += table[row][col_names[i]];
            table_body += " | ";
        }

        table_body += "\n";
    }


    return table_head + table_body;
}


client.once ('ready', () => {
    console.log('Ready!');
});

// FIXME - sanitize input
client.on ('messageCreate', async function (message) {
    if (message.author.bot) return;


    switch (message.content) {
        case '.ping':
            message.channel.send('Pong.');
            break;

        case '.help':
            var mesg = `
            \`\`\`.ping - Test the bot. \n
            .search - Search books by name.\n
            .info - Show reviews for a specific book.
            .unlink - Unlink your Discord and OpenSourceBooks accounts.\n
            .help - Display this message.\`\`\`
            `;
            message.channel.send(mesg);
            break;
            
    }

    // Search DB for books by ISBN print out  BROWSE PAGE 
    if (message.content.startsWith(".search ")) {
        book_name=message.content.split(' ')[1]
        var query = `SELECT * FROM Books WHERE Title like '%`+book_name+`%' LIMIT 3;`;
        await runQuerySafe(query);
        if (sql_response){
            message.channel.send("Book selected.");
            message.channel.send('```'+convertSQLTable(sql_response)+'```');
        }else{
            message.channel.send("No such book.");
        }
        
    }

    // Show reviews for a single book,select from review where ISBN, give specific book review info
    if (message.content.startsWith(".info ")) {
//         Alter to run if a book is not in database
        var isbn = message.content.substring(6);
        var ratings_query = `SELECT Rating, Description FROM Ratings WHERE ISBN = '` + isbn + `' LIMIT 10;`;
        await runQuerySafe(ratings_query);
        message.channel.send('```' + convertSQLTable(sql_response) + '```');
    }

    // FIXME - add/remove friends and reviews, view recommendations


});

client.login(token.token);