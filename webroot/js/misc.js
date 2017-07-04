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
  function ce(tag, children) { // Create element
    var e = document.createElement(tag);
    children.forEach(function(c){
      e.appendChild(c);
    });
    return e;
  };
  function t(content) { // Text node.
    return document.createTextNode(content);
  };
  function ac(p, children) { // Append Children
    children.forEach(function(c){
      p.appendChild(c);
    });
    return p;
  };
  function a(text, href, onclick) { // Anchor tag.
    var a = ce("a", []);
    a.innerText = text;
    a.href = (href ? href : "#");
    if (onclick) {
      a.onclick = onclick;
    }
    return a;
  };
  var result = ce("div", [
    ce("h2", [
      (loc.url ? a(loc.name, loc.url) : t(loc.name))
    ])
  ]);
  // Incoming.
  if (loc.incoming) {
    var div = ce("div", []);
    loc.incoming.forEach(function(link) {
      ac(div, [
        t("ここでは"),
        a(LOCATIONS[link.source].name, "#" + link.source, function() {
          showDialog(formatLocation(LOCATIONS[link.source]));
          directionsManager.showInOut(LOCATIONS[link.source]);
        }),
        t("の"),
        t(link.product_name),
        t("を使っています。"),
        ce("br", [])
      ]);
    });
    result = ac(result, [div]);
  }
  // Outgoing.
  if (loc.outgoing) {
    var div = ce("div", []);
    loc.outgoing.forEach(function(link) {
      ac(div, [
        a(LOCATIONS[link.destination].name, "#" + link.destination, function() {
          showDialog(formatLocation(LOCATIONS[link.destination]));
          directionsManager.showInOut(LOCATIONS[link.destination]);
        }),
        t("がここの"),
        t(link.product_name),
        t("を使っています。"),
        ce("br", [])
      ]);
    });
    result = ac(result, [div]);
  }
  // Description.
  var desc = ce("div", []);
  desc.innerHTML = loc.desc;
  result = ac(result, [desc]);
  return result;
};

var formatLink = function(link) {
  var source = LOCATIONS[link.source];
  var dest = LOCATIONS[link.destination];
  var result = dest.name;
  result += "では<br />";
  result += source.name;
  result += "の<br />";
  result += link.product_name;
  result += "を使っています";
  return result;
};

var showDialog = function(content) {
  var dialog = document.getElementById('location_desc_dialog');
  var container = document.getElementById('location_desc_content');
  dialog.close();
  container.innerHTML = "";
  container.appendChild(content);
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
