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

class LinkForm {
    constructor() {
        this.uname = undefined;
        this.pass_hash = undefined;
    }

    async checkCorrect () {
        if (this.uname != undefined && this.pass_hash != undefined) {
            var password_query = `SELECT COUNT(*) AS U FROM Users WHERE Username = "` + 
            this.uname + `" AND PasswordHash = '` + this.pass_hash + `';`;

            sql_response = undefined;
      
            await runQuerySafe(password_query);
      
            var user_ct = sql_response[sql_response.length - 1]['U'];

            return user_ct != 0;
          
        }

        return false;

    }
}

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


client.once ('ready', () => {
    console.log('Ready!');
});

// FIXME - sanitize input
client.on ('messageCreate', async function (message) {
    if (message.author.bot) return;

    // FIXME must read DMs or slash commands, must work
    if (true) {//message.channel.type === 'dm') {
        // If you DM the bot it should only be for account linking info.
        if (disc_id in unfilled_forms) {
            if (unfilled_forms[disc_id].uname === undefined) {
                unfilled_forms[disc_id].uname = message.content;
                message.author.send("Please enter your OpenSourceBooks password.");
                return;
            }

            else if (unfilled_forms[disc_id].password === undefined) {
                var hash = crypto.createHash('sha256');
                var data = hash.update(message.content, 'utf-8');
                
                //Creating the hash in the required format
                var gen_hash = data.digest('hex');
                unfilled_forms[disc_id].pass_hash = gen_hash;

                // Check that the user's info is correct.
                if (unfilled_forms[disc_id].checkCorrect()) {
                    open_sessions[disc_id] = unfilled_forms[disc_id].uname;
                    var query = `INSERT INTO DiscordUsers VALUES ("` + disc_id + `", "` +
                    unfilled_forms[disc_id].uname + `";`;

                    await runQuerySafe(query);

                    message.author.send("Accounts successfully linked!");
                } else {
                    message.author.send("Could not find an account with that name, or passwords don't match.");
                }

                unfilled_forms.delete(disc_id);
                return;
            }

        }
    }


    switch (message.content) {
        case '.ping':
            message.channel.send('Pong.');
            break;

        case '.help':
            var mesg = `
            \`\`\`.ping - Test the bot. \n
            .link - Link your Discord and OpenSourceBooks accounts.\n
            .unlink - Unlink your Discord and OpenSourceBooks accounts.\n
            .help - Display this message.\`\`\`
            `;
            message.channel.send(mesg);
            break;

        // FIXME: Link your OpenSourceBooks account to your Discord account.
        // Schema on server: DiscordUsers(discordID PK, booksID FK references Users.Username)
        // DM user asking for username and password
        case '.link':
            // Reestablish an existing link.
            var disc_id = message.author.id;

            var link_query = `SELECT booksID FROM DiscordUsers WHERE discordID = "` + 
            this.disc_id + `";`;
            await runQuerySafe(link_query);

            // FIXME existing link
            console.log(sql_response);

            // Create a new link.
            message.author.send("Please enter your OpenSourceBooks username.");
            unfilled_forms[disc_id] = new LinkForm();
            break;

        // Remove a user's link.
        case '.unlink':
            var disc_id = message.author.id;

            if (disc_id in open_sessions) {
                open_sessions.delete(disc_id);
                message.channel.send("Your account has been unlinked.");
            } else {
                message.channel.send("No account to unlink.");
            }

            break;
            
    }

    // Search DB for books
    if (message.content.startsWith(".search ")) {

    }

    // Show reviews for a single book
    if (message.content.startsWith(".info ")) {
//         Alter to run if a book is not in database
        var isbn = message.content.substring(6);
        var ratings_query = `SELECT Rating, Description FROM Ratings WHERE ISBN = ` + isbn + ` LIMIT 10;`;
        await runQuerySafe(ratings_query);
        message.channel.send(sql_response);
    }

    // FIXME - add/remove friends and reviews, view recommendations


});

client.login(token.token);