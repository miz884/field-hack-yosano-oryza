var locationInit = function() {
  PRODUCT_LINKS.forEach(function(link) {
    if (! LOCATIONS[link.source].outgoing) {
      LOCATIONS[link.source].outgoing = [];
    }
    LOCATIONS[link.source].outgoing.push(link);
    if (! LOCATIONS[link.destination].incoming) {
      LOCATIONS[link.destination].incoming = [];
    }
    LOCATIONS[link.destination].incoming.push(link);
  });
};

var formatLocation = function(loc) {
  var content = "";
  // Title.
  content += "<h2>";
  content +=  (loc.url ? "<a href='" + loc.url + "'>" : "");
  content +=  loc.name;
  content +=  (loc.url ? "</a>" : "");
  content +=  "</h2>";
  // Incoming.
  if (loc.incoming) {
    content +=  "<div>";
    loc.incoming.forEach(function(link) {
      content +=  "ここでは";
      content +=  LOCATIONS[link.source].name;
      content +=  "の";
      content +=  link.product_name;
      content +=  "を使っています。<br />";
    });
    content +=  "</div>";
  }
  // Outgoing.
  if (loc.outgoing) {
    content +=  "<div>";
    loc.outgoing.forEach(function(link) {
      content +=  LOCATIONS[link.destination].name;
      content +=  "がここの";
      content +=  link.product_name;
      content +=  "を使っています。<br />";
    });
    content +=  "</div>";
  }
  // Description.
  content +=  "<div>";
  content +=  loc.desc;
  content +=  "</div>";
  return content;
};

var showDialog = function(content) {
  var dialog = document.getElementById('location_desc_dialog');
  var container = document.getElementById('location_desc_content');
  dialog.close();
  container.innerHTML = content;
  dialog.open();
};

var parseDeepLink = function() {
  if (location.hash.length > 0) {
    var hash = location.hash.substring(1);
    var loc = LOCATIONS[hash];
    if (loc) {
      showDialog(formatLocation(loc));
      directionsManager.showInOut(loc);
      map.setCenter({"lat":loc.lat, "lng":loc.lng});
    } else if (hash == "DASHBOARD") {
      console.log("Dashboard mode.");
      // Listen on Firebase Database.
      listenPing(function(loc) {
        showDialog(formatLocation(loc));
        directionsManager.showInOut(loc);
      });
    }
  }
};

var listenPing = function(callback) {
  var pingRef =  firebase.database().ref('/ping');
  pingRef.on('value', function(snapshot) {
    var val = snapshot.val();
    console.log("pinged:");
    console.log(val);
    if (val && val.label) {
      var loc = LOCATIONS[val.label];
      if (loc) {
        callback(loc);
      }
    }
  });
};
