var map;
var directionsManager;

var mapInit = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: {lat:35.5086529, lng:135.0703902},
    disableDefaultUI: true
  });
  directionsManager = new DirectionsManager(map);

  Object.entries(LOCATIONS).forEach(function(loc) {
    var infowindow = new google.maps.InfoWindow({
      content: loc[1].name
    });
    var marker = new google.maps.Marker({
      map: map,
      position: loc[1].latLng,
      title: loc[1].name,
      icon: {
        url: loc[1].icon,
        scaledSize: new google.maps.Size(StepMarker.ICON_SIZE, StepMarker.ICON_SIZE),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(StepMarker.ICON_SIZE / 2.0, StepMarker.ICON_SIZE / 2.0)
      }
    });
    marker.addListener('mouseover', function() {
      infowindow.open(map, marker);
    });
    marker.addListener('mouseout', function() {
      infowindow.close();
    });
    marker.addListener('click', function() {
      showDialog(formatLocation(loc[1]));
      directionsManager.showInOut(loc[1]);
    });
  });
}

var locationInit = function() {
  var products = {};
  PRODUCT_LINKS.forEach(function(link) {
    if (! products[link.source]) {
      products[link.source] = {};
    }
    products[link.source][link.product] = true;
    if (link.source && link.destination) {
      if (! LOCATIONS[link.source].outgoing) {
        LOCATIONS[link.source].outgoing = [];
      }
      LOCATIONS[link.source].outgoing.push(link);
      if (! LOCATIONS[link.destination].incoming) {
        LOCATIONS[link.destination].incoming = [];
      }
      LOCATIONS[link.destination].incoming.push(link);
    }
  });
  Object.keys(products).forEach(function(source) {
    LOCATIONS[source].products = Object.keys(products[source]);
  });
  Object.entries(LOCATIONS).forEach(function(loc) {
    loc[1].latLng = {lat: loc[1].lat, lng: loc[1].lng};
  });
};

var formatLocation = function(loc) {
  // Create element
  function ce(tag, children, attr) {
    var e = document.createElement(tag);
    if (children) {
      children.forEach(function(c){
        e.appendChild(c);
      });
      if (attr) {
        Object.entries(attr).forEach(function(v) {
          e[v[0]] = v[1];
        });
      }
    }
    return e;
  };
  // Text node.
  function t(content) {
    return document.createTextNode(content);
  };
  // Append Children.
  function ac(p, children) {
    children.forEach(function(c){
      p.appendChild(c);
    });
    return p;
  };
  // Anchor tag.
  function a(text, href, onclick) {
    var a = ce("a", []);
    a.innerText = text;
    a.href = (href ? href : "#");
    if (onclick) {
      a.onclick = onclick;
    }
    return a;
  };
  // div.
  function div(children) {
    return ce("div", children);
  }
  // br
  function br() {
    return ce("br");
  }
  var result = div([
    ce("h2", [
      (loc.url ? a(loc.name, loc.url) : t(loc.name))
    ])
  ]);
  // Products.
  if (loc.products) {
    var lines = [
      ce("iron-icon", [], {"icon":"social:domain"}),
      ce("b", [t("ここで作っているもの")]),
      br()];
    loc.products.forEach(function(product) {
      lines.push(
        t("ここでは"),
        t(PRODUCTS[product].name),
        t("を作っています。"),
        br()
      );
    });
    ac(result, [div(lines)]);
  }
  // Incoming.
  if (loc.incoming) {
    var lines = [
      ce("iron-icon", [], {"icon":"maps:local-shipping"}),
      ce("iron-icon", [], {"icon":"forward"}),
      ce("iron-icon", [], {"icon":"social:domain"}),
      ce("b", [t("ここで使っているもの")]),
      br()];
    loc.incoming.forEach(function(link) {
      lines.push(
        t("ここでは"),
        a(LOCATIONS[link.source].name, "#" + link.source, function() {
          showLocationDialog(formatLocation(LOCATIONS[link.source]));
          directionsManager.showInOut(LOCATIONS[link.source]);
        }),
        t("の"),
        t(link.product_name),
        t("を使っています。"),
        br()
      );
    });
    ac(result, [div(lines)]);
  }
  // Outgoing.
  if (loc.outgoing) {
    var lines = [
      ce("iron-icon", [], {"icon":"social:domain"}),
      ce("iron-icon", [], {"icon":"forward"}),
      ce("iron-icon", [], {"icon":"face"}),
      ce("b", [t("ここで作られたものを使っている人達")]),
      br()];
    loc.outgoing.forEach(function(link) {
      lines.push(
        a(LOCATIONS[link.destination].name, "#" + link.destination, function() {
          showLocationDialog(formatLocation(LOCATIONS[link.destination]));
          directionsManager.showInOut(LOCATIONS[link.destination]);
        }),
        t("がここの"),
        t(link.product_name),
        t("を使っています。"),
        br()
      );
    });
    ac(result, [div(lines)]);
  }
  // Description.
  var desc = div();
  desc.innerHTML = loc.desc;
  ac(result, [desc]);
  return result;
};

var formatLink = function(link) {
  var source = LOCATIONS[link.source];
  var dest = LOCATIONS[link.destination];
  var result = dest.name;
  result += "では<br />";
  result += source.name;
  result += "の";
  result += link.product_name;
  result += "を使っています";
  return result;
};

var formatPing = function(loc) {
  var result = "";
  result += "<iron-icon icon='maps:restaurant'></iron-icon>";
  result += "<b>食べたよ！飲んだよ！</b>";
  result += "<iron-icon icon='maps:local-bar'></iron-icon>";
  result += "<br />";
  result += loc.name;
  result += "の";
  result += PRODUCTS[loc.products[0]].name;
  result += "を楽しんでいる人がいますよ！<br />";
  result += new Date();
  return result;
};

var showLocationDialog = function(content) {
  var dialog = document.getElementById('location_desc_dialog');
  var container = document.getElementById('location_desc_content');
  dialog.close();
  container.innerHTML = "";
  container.appendChild(content);
  dialog.open();
};

var DASHBOARD_MODE = false;

var parseDeepLink = function() {
  if (location.hash.length > 0) {
    var hash = location.hash.substring(1);
    var loc = LOCATIONS[hash];
    if (loc) {
      showLocationDialog(formatLocation(loc));
      directionsManager.showInOut(loc);
      map.setCenter(loc.latLng);
    } else if (hash == "DASHBOARD") {
      console.log("Dashboard mode.");
      DASHBOARD_MODE = true;
      // Listen on Firebase Database.
      listenPing(pingHandler);
    }
  }
};

var pingHandler = function(loc) {
  showLocationDialog(formatLocation(loc));
  directionsManager.showInOut(loc);
  map.setCenter(loc.latLng);
  if (DASHBOARD_MODE) {
    var dialog = document.getElementById('dashboard_dialog');
    var container = document.getElementById('dashboard_content');
    dialog.close();
    var card = document.createElement("paper-card");
    card.innerHTML = formatPing(loc);
    container.insertBefore(card, container.childNodes[0]);
    dialog.open();
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

var showMessage = function(message) {
  var toast = document.getElementById("message");
  toast.text = message;
  toast.open();
};
