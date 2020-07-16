'use strict';

module.exports.setup = function(app) {
    const accountSid = 'AC0b342001d763102bf0b046829284469b';
    const authToken = 'ca522c897bd1ae8ac2dc82c3da37ef50';
    const client = require('twilio')(accountSid, authToken);

    
    var builder = require('botbuilder');
    var teams = require('botbuilder-teams');
    var config = require('config');
    const MessagingResponse = require('twilio').twiml.MessagingResponse;

    if (!config.has("bot.appId")) {
        // We are running locally; fix up the location of the config directory and re-intialize config
        process.env.NODE_CONFIG_DIR = "../config";
        delete require.cache[require.resolve('config')];
        config = require('config');
    }
    // Create a connector to handle the conversations
    var connector = new teams.TeamsChatConnector({
        // It is a bad idea to store secrets in config files. We try to read the settings from
        // the config file (/config/default.json) OR then environment variables.
        // See node config module (https://www.npmjs.com/package/config) on how to create config files for your Node.js environment.
        appId: config.get("bot.appId"),
        appPassword: config.get("bot.appPassword")
    });
    
    var inMemoryBotStorage = new builder.MemoryBotStorage();
    var savedAddress
    var bot = new builder.UniversalBot(connector, function(session) {
        // Message might contain @mentions which we would like to strip off in the response
        const text = teams.TeamsMessage.getTextWithoutMentions(session.message);
        const fileAttachments = teams.FileDownloadInfo.filter(session.message.attachments);
        if (fileAttachments && (fileAttachments.length > 0)) {
            var fileurl = fileAttachments[0].content.downloadUrl;
            var msg = {
                mediaUrl: [fileurl],
                body: text,
                from: 'whatsapp:+14155238886',
                to: 'whatsapp:+85266566016'
            }
        }
        else {
            var msg = {
                body: text,
                from: 'whatsapp:+14155238886',
                to: 'whatsapp:+85266566016'
            }
        }
        console.log(fileurl);
        savedAddress = session.message.address;
        session.userData.savedAddress = savedAddress;
        console.log(savedAddress);
        //echo the message sent
        //session.send("You said: " + text);
        console.log(session);
        //send message to WhatsApp
        
        client.messages
            .create(msg)
            .then(message => console.log(message.sid))
            .done();
        
    }).set('storage', inMemoryBotStorage);

    // Setup an endpoint on the router for the bot to listen.
    // NOTE: This endpoint cannot be changed and must be api/messages
    app.post('/api/messages', connector.listen());

    app.post('/api/sms', (req, res) => {
        const twiml = new MessagingResponse();
        //twiml.message('The Robots are coming! Head for the hills!');
        var text = req.body.Body;
        text = "From" +req.body.From + ":\n" + text;
        console.log(req.body);
        console.log(savedAddress);
        var msg = new builder.Message().address(savedAddress);
        msg.text(text);
        bot.send(msg);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end();
    });

    // Export the connector for any downstream integration - e.g. registering a messaging extension
    module.exports.connector = connector;
};
