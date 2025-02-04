// Author: Oliver Rodriguez

// Modules to import
const express = require("express");
const rp = require("request-promise");
const cfenv = require("cfenv");
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);

//Import Watson Developer Cloud SDK
const watson = require("watson-developer-cloud");
// Import service credentials
const serviceCredentials = require('./service-credentials.json');
// Get the environment variables from Cloud Foundry
const appEnv = cfenv.getAppEnv();

// Serve the static files in the /public directory
app.use(express.static(__dirname + '/public'));

// Create the Conversation object
var conversation = new watson.ConversationV1({
  username:serviceCredentials.conversation.username,
  password:serviceCredentials.conversation.password,
  version_date: watson.ConversationV1.VERSION_DATE_2017_05_26
});
 
var workspace = serviceCredentials.conversation.workspaceID;
var context = {};


// Create the Discovery object
var discovery = new watson.DiscoveryV1({
  username: serviceCredentials.discovery.username,
  password: serviceCredentials.discovery.password,
  version_date: watson.DiscoveryV1.VERSION_DATE_2017_04_27
});
var environmentId = serviceCredentials.discovery.environmentID;
var collectionId = serviceCredentials.discovery.collectionID;

// Create the Tone Analyzer Object
var toneAnalyzer = new watson.ToneAnalyzerV3({
  username: serviceCredentials.toneAnalyzer.username,
  password: serviceCredentials.toneAnalyzer.password,
  version_date: '2016-05-19'
});

// Create the personalityInsights object
var personalityInsights = new watson.PersonalityInsightsV3({
  username: serviceCredentials.personality.username,
  password: serviceCredentials.personality.password,
  version_date: '2017-10-13'
});


// start server on the specified port and binding host
server.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

io.on('connection', function(socket) {
  console.log('a user has connected');

  // Handle incomming chat messages
  socket.on('chat message', function(msg) {

    console.log('message: ' + msg);
    io.emit('chat message', "you: " + msg);

    /*****************************
        Send text to Conversation
    ******************************/
conversation.message({
      context: context,
      input: { text: msg },
      workspace_id: workspace
     }, function(err, response) {
         if (err) {
           console.error(err);
         } else {
           var reply = JSON.stringify(response.output.text[0], null, 2);
        context = response.context;
        var queryString = "";
        var answer = [];
        var city = "";
        if (context.best) {
 switch(context.best) {
               case "All":
                queryString="term(hotel,count:50).average(enriched_text.sentiment.document.score)";
                 queryDiscovery(queryString, function(err, queryResults) {
 
                   if (err) {
                     console.log(err);
                   }
 
                   queryResults = queryResults.aggregations[0].results;
 
                   findBestHotel(queryResults, function(hotel, sentiment) {
 
                     io.emit('chat message', "The best hotel overall is " + hotel.replace(/_/g," ").replace(/\b\w/g, l =&lt; l.toUpperCase()) + " with an average sentiment of "+sentiment.toFixed(2));
                   });
 
                 });

                break;
               case "new-york-city":
 queryString="filter(city::"+context.best+").term(hotel,count:50).average(enriched_text.sentiment.document.score)";
                  queryDiscovery(queryString, function(err, queryResults) {
 
                    if (err) {
                      console.log(err);
                    }
 
                    queryResults = queryResults.aggregations[0].aggregations[0].results;
 
                    findBestHotel(queryResults, function(hotel, sentiment) {
 
                      io.emit('chat message', "The best hotel in New York City is " + hotel.replace(/_/g," ").replace(/\b\w/g, l =&gt; l.toUpperCase()) + " with an average sentiment of "+sentiment.toFixed(2));
                    });
 
                  });

                break;
               case "san-francisco":
 queryString="filter(city::"+context.best+").term(hotel,count:50).average(enriched_text.sentiment.document.score)";
                  queryDiscovery(queryString, function(err, queryResults) {
 
                    if (err) {
                      console.log(err);
                    }
 
                    queryResults = queryResults.aggregations[0].aggregations[0].results;
 
                    findBestHotel(queryResults, function(hotel, sentiment) {
 
                      io.emit('chat message', "The best hotel in San Francisco is " + hotel.replace(/_/g," ").replace(/\b\w/g, l =&gt; l.toUpperCase()) + " with an average sentiment of "+sentiment.toFixed(2));
                    });
 
                  });
               
                break;
               case "chicago":
queryString="filter(city::"+context.best+").term(hotel,count:50).average(enriched_text.sentiment.document.score)";
                  queryDiscovery(queryString, function(err, queryResults) {
 
                    if (err) {
                      console.log(err);
                    }
 
                    queryResults = queryResults.aggregations[0].aggregations[0].results;
 
                    findBestHotel(queryResults, function(hotel, sentiment) {
 
                      io.emit('chat message', "The best hotel in Chicago is " + hotel.replace(/_/g," ").replace(/\b\w/g, l =&gt; l.toUpperCase()) + " with an average sentiment of "+sentiment.toFixed(2));
                    });
 
                  });
 
               break;
             }

          } else if (context.list) {
 city = context.list;
             queryString = "term(city,count:10).term(hotel,count:25)"
             queryDiscovery(queryString, function(err, queryResults) {
               if (err) {
                 console.log(err);
               }
               queryResults = queryResults.aggregations[0].results;
               for(var i=0; i&lt;queryResults.length; i++) {
 
                 if(queryResults[i].key == city) {
 
                   for(var x=0; x&lt;queryResults[i].aggregations[0].results.length; x++) {
 
                     if (x == queryResults[i].aggregations[0].results.length - 1) {
                       answer[x] = "and " + queryResults[i].aggregations[0].results[x].key.replace(/_/g," ").replace(/\b\w/g, l =&gt; l.toUpperCase());
                       console.log(answer);
                     } else {
                       answer[x] = queryResults[i].aggregations[0].results[x].key.replace(/_/g," ").replace(/\b\w/g, l =&gt; l.toUpperCase()) + ", ";
                       console.log(answer);
                     }
                   }
                 }
               }
              io.emit('chat message', "Hotel Bot: " + reply.replace(/"/g,""));
              for( var n=0;n&lt;answer.length;n++) {
                console.log(answer[n]);
                io.emit('chat message',"--- " + answer[n]);
              }
             }); 

          } else if (context.hotel) {
 var chosenHotel = context.hotel[0].value;
 
              console.log("More Info on hotel: ");
              console.log(chosenHotel);
 
              queryString = "nested(enriched_text.sentiment.document.label).filter(hotel::" + chosenHotel + ").term(enriched_text.sentiment.document.label,count:10)"
              queryDiscovery(queryString, function(err, queryResults) {
                if (err) {
                  console.log(err);
                }
                if (queryResults.aggregations[0].aggregations[0].results[0]) {
                  var positiveRevs = queryResults.aggregations[0].aggregations[0].results[0].matching_results;
                } else { var positiveRevs = 0;}
 
                if (queryResults.aggregations[0].aggregations[0].results[1]) {
                  var negativeRevs = queryResults.aggregations[0].aggregations[0].results[1].matching_results;
                } else { var negativeRevs = 0;}
                getReviewText(chosenHotel, function(err, text) {
 
                if (err) {
                console.log(err);
  }
 toneAnalyzer.tone({ text: text },
                   function(err, tone) {
                     if (err)
                       console.log(err); 
     
     console.log(tone.document_tone.tone_categories[0].tones);
 var tones = tone.document_tone.tone_categories[0].tones;
 var highestTone = {
   name: "",
   score: 0
     
 };
 var detectedTones = [];
 
 for(y=0;y&lt;tones.length;y++) {
   if (tones[y].score &gt; highestTone.score) {
     highestTone.score = tones[y].score;
     highestTone.name = tones[y].tone_name;
   }
 
   if (tones[y].score &gt;= 0.40) {
     detectedTones.push(tones[y].tone_name);
   }
 }
chosenHotel = chosenHotel.replace(/"/g,"").replace(/_/g," ").replace(/\b\w/g, l =&gt; l.toUpperCase());
 
                io.emit('chat message', "Hotel Bot: "+reply.replace(/"/g,"")+" "+chosenHotel+" tells us:");
                io.emit('chat message', "--- Out of "+ (positiveRevs+negativeRevs)+" total reviews, there are "+positiveRevs+" positive 
                io.emit('chat message', "--- The detected tones include "+ detectedTones +" with  "+highestTone.name+" being the most apparent emotional tone with a confidence of "+(highestTone.score*100).toFixed(0)+"%");
                 });
                
});

                personalityInsights.profile({
      "text": text,
      "consumption_preferences": true
    }, function(err, response) {
 
      if (err) {
        console.log(err);
      } else {
 getPersonalityTraits(response, function(personality, preference) {
 
  io.emit('chat message', "--- Personality traits include: ");
 
  for(i=0;i&lt;personality.length;i++) {
    io.emit('chat message', "--- --- "+personality[i].trait+" has a score of "+personality[i].score.toFixed(2)+" and shows traits of "+personality[i].child.name+".");
  };
 
  io.emit('chat message', "--- Identified consumption preference: ");
  io.emit('chat message', "--- --- "+preference);
 
 
});

 
 
      }
    });

               reviews and "+negativeRevs+" negative reviews.");
 
              });

          } else {
            if (context.system.branch_exited) {
             console.log("Exited");
             context = {};
             
           }

 io.emit('chat message', "Hotel Bot: " + reply);
    }
      });

          }



   });
});

app.get('/', function(req, res){
  res.sendFile('index.html');
});

/*****************************
    Function Definitions
******************************/
function queryDiscovery(query, callback) {
  // Function to query Discovery
 
  discovery.query({
    environment_id: environmentId,
    collection_id: collectionId,
    aggregation: query
    }, function(err, response) {
       if (err) {
         console.error(err);
         callback(err, null);
       } else {
         //var results = JSON.stringify(response, null, 2);
        // console.log(results);
         callback(null, response);
       }
    });
}
function findBestHotel(qResults, callback) {
  // Function to find the best hotel
  var highestSent = 0;
  var currentSent;
  var bestHotel;
  for (i=0;i&lt;qResults.length;i++) {
    currentSent = qResults[i].aggregations[0].value;
    if (currentSent &gt; highestSent) {
      highestSent=currentSent;
      bestHotel=qResults[i].key;
    }
  }
  callback(bestHotel, highestSent);
}
function getReviewText(hotel, callback) {
 
  discovery.query({
    environment_id: environmentId,
    collection_id: collectionId,
    filter: "hotel:"+hotel,
    return: "text"
    }, function(err, response) {
       if (err) {
         console.error(err);
         callback(err, null);
       } else {
 
         var combinedText = "";
 
         for (var x=0;x &lt;response.results.length;x++)  {
           combinedText += response.results[x].text;
           combinedText += " ";
         }
 
         callback(null, combinedText);
       }
    });
}

function getPersonalityTraits(response, callback) {
  // Function that parses response from personality insights 
 
  var big5 = [];
  var traitScore;
 
  for (i=0;i&lt;response.personality.length;i++){
    var highestChildScore = 0;
    var traitScore = response.personality[i].percentile;
 
    for (x=0;x &lt;response.personality[i].children.length;x++){
      var currentChildScore = response.personality[i].children[x].percentile;
      if (currentChildScore &gt; highestChildScore) {
        highestChildScore = currentChildScore;
        big5[i] = {
          trait: response.personality[i].name,
          score: traitScore,
          child: response.personality[i].children[x]
        }
      }
    }
  }
  for(i=0;i &lt; big5.length;i++) {
    console.log(big5[i].trait);
    console.log(big5[i].score);
    console.log(big5[i].child.name);
  }
  console.log(big5);
  var consumptionPrefs = [];
 
  for (i=0;i&lt;response.consumption_preferences[0].consumption_preferences.length;i++) {
    if(response.consumption_preferences[0].consumption_preferences[i].score == 1) {
      consumptionPrefs.push(response.consumption_preferences[0].consumption_preferences[i].name);
    }
  }
  for(i=0;i&lt;consumptionPrefs.length;i++) {
    console.log(consumptionPrefs[i]);
  }
  var preference = consumptionPrefs[Math.floor(Math.random() * consumptionPrefs.length)];
  callback(big5, preference);
}
